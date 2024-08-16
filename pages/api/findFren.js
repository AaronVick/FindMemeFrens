import { promises as fs } from 'fs';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PINATA_HUB_API = 'https://hub.pinata.cloud/v1';
const OG_IMAGE_API = 'https://success-omega.vercel.app/api/og';

const USER_DATA_TYPES = {
  PFP: 1,
  DISPLAY: 2,
  BIO: 3,
  URL: 5,
  USERNAME: 6
};

async function getRandomLine(filePath) {
  const data = await fs.readFile(filePath, 'utf8');
  const lines = data.split('\n').filter(line => line.trim() !== '');
  return lines[Math.floor(Math.random() * lines.length)];
}

async function searchFarcasterByName(name) {
  try {
    const proof = await getUserNameProof(name);
    if (!proof) return null;

    const userData = await getAllUserData(proof.fid);
    const ogImageUrl = generateOgImageUrl(proof.fid, userData);

    return { userData, ogImageUrl };
  } catch (error) {
    console.error('Error searching Farcaster by name:', error.message);
    return null;
  }
}

async function getUserNameProof(name) {
  try {
    const response = await axios.get(`${PINATA_HUB_API}/userNameProofByName`, {
      params: { name },
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log(`No Farcaster account found for name: ${name}`);
      return null;
    }
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
    if (error.response && error.response.status === 400) {
      console.log(`User data type ${userDataType} not available for FID ${fid}`);
      return null;
    }
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

async function fetchRandomUser() {
  const filePath = path.join(__dirname, 'success.txt');
  let result = null;
  let attempts = 0;
  const maxAttempts = 5;

  while (!result && attempts < maxAttempts) {
    const randomValue = await getRandomLine(filePath);
    console.log(`Attempt ${attempts + 1} - Random value selected: ${randomValue}`);
    
    result = await searchFarcasterByName(randomValue);
    attempts++;
    if (!result && attempts < maxAttempts) {
      console.log('Retrying with a different random selection...');
    }
  }

  return result;
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const result = await fetchRandomUser();
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
        res.status(200).json({
          image: `${process.env.NEXT_PUBLIC_BASE_URL}/error.png`,
          buttons: [{ label: 'Try Again', action: 'post' }]
        });
      }
    } catch (error) {
      console.error('Error in findFren handler:', error);
      res.status(200).json({
        image: `${process.env.NEXT_PUBLIC_BASE_URL}/error.png`,
        buttons: [{ label: 'Try Again', action: 'post' }]
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}