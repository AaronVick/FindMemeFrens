import axios from 'axios';

const PINATA_HUB_API = 'https://hub.pinata.cloud/v1';
const OG_IMAGE_API = 'https://ap-news.vercel.app/api/og';

const USER_DATA_TYPES = {
  PFP: 1,
  DISPLAY: 2,
  BIO: 3,
  URL: 5,
  USERNAME: 6
};

async function getRandomLine(filePath) {
  const fs = await import('fs/promises');
  const data = await fs.readFile(filePath, 'utf8');
  const lines = data.split('\n').filter(line => line.trim() !== '');
  return lines[Math.floor(Math.random() * lines.length)];
}

async function getUserNameProof(name) {
  try {
    const response = await axios.get(`${PINATA_HUB_API}/userNameProofByName`, {
      params: { name },
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error('Error getting username proof:', error.message);
    return null;
  }
}

async function getUserDataByFid(fid, userDataType) {
  try {
    const response = await axios.get(`${PINATA_HUB_API}/userDataByFid`, {
      params: { fid, user_data_type: userDataType },
      timeout: 10000
    });
    return response.data.data.userDataBody.value;
  } catch (error) {
    console.error(`Error getting user data (type ${userDataType}) for FID ${fid}:`, error.message);
    return null;
  }
}

async function getAllUserData(fid) {
  const userData = {};
  for (const [key, value] of Object.entries(USER_DATA_TYPES)) {
    userData[key.toLowerCase()] = await getUserDataByFid(fid, value);
  }
  return userData;
}

function generateOgImageUrl(fid, userData) {
  const title = encodeURIComponent(`${userData.display || userData.username} (FID: ${fid})`);
  const subtitle = encodeURIComponent(userData.bio || '');
  const image = encodeURIComponent(userData.pfp || '');
  
  return `${OG_IMAGE_API}?title=${title}&subtitle=${subtitle}&image=${image}`;
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'success.txt');
      let result = null;
      let attempts = 0;
      const maxAttempts = 5;

      while (!result && attempts < maxAttempts) {
        const randomValue = await getRandomLine(filePath);
        console.log(`Attempt ${attempts + 1} - Random value selected: ${randomValue}`);
        
        const proof = await getUserNameProof(randomValue);
        if (proof) {
          const userData = await getAllUserData(proof.fid);
          const ogImageUrl = generateOgImageUrl(proof.fid, userData);
          result = { fid: proof.fid, userData, ogImageUrl };
        }
        
        attempts++;
      }

      if (result) {
        res.status(200).json({
          image: result.ogImageUrl,
          buttons: [
            {
              label: `View ${result.userData.username}'s Profile`,
              action: 'link',
              target: `https://warpcast.com/${result.userData.username}`
            },
            {
              label: 'Find Another Fren',
              action: 'post'
            }
          ]
        });
      } else {
        res.status(500).json({ error: 'Failed to find a valid Farcaster user after maximum attempts.' });
      }
    } catch (error) {
      console.error('Error in findFren handler:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}