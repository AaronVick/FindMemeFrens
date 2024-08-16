import { promises as fs } from 'fs';
import axios from 'axios';
import { fileURLToPath } from 'url';
import path from 'path';
import open from 'open';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  const data = await fs.readFile(filePath, 'utf8');
  const lines = data.split('\n').filter(line => line.trim() !== '');
  return lines[Math.floor(Math.random() * lines.length)];
}

async function checkApiAvailability() {
  try {
    const response = await axios.get(`${PINATA_HUB_API}/info`, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    console.error('Error checking API availability:', error.message);
    return false;
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

async function searchFarcasterByName(name) {
  try {
    console.log(`Searching for Farcaster profile with name: ${name}`);
    
    const proof = await getUserNameProof(name);
    if (!proof) {
      return null;
    }

    console.log(`FID found: ${proof.fid}`);

    const userData = await getAllUserData(proof.fid);
    const ogImageUrl = generateOgImageUrl(proof.fid, userData);

    return { fid: proof.fid, userData, ogImageUrl };
  } catch (error) {
    console.error('Error in searchFarcasterByName:', error.message);
    return null;
  }
}

async function runTest() {
  try {
    const isApiAvailable = await checkApiAvailability();
    if (!isApiAvailable) {
      console.error('The Pinata Hub API seems to be unavailable. Please check your internet connection or try again later.');
      return;
    }

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

    if (result) {
      console.log('FID:', result.fid);
      console.log('User Data:', JSON.stringify(result.userData, null, 2));
      console.log('OG Image URL:', result.ogImageUrl);
      
      console.log('\nTo use this OG image in your HTML:');
      console.log(`<meta property="og:image" content="${result.ogImageUrl}" />`);

      console.log('\nAttempting to open the OG Image in your default browser...');
      try {
        await open(result.ogImageUrl);
      } catch (error) {
        console.error('Failed to open the browser automatically. Please copy and paste the following URL into your browser to view the image:');
        console.log(result.ogImageUrl);
      }

      console.log('\nTo verify the image generation, you can also try accessing this URL:');
      console.log(`${OG_IMAGE_API}?title=Test&subtitle=This%20is%20a%20test`);
    } else {
      console.log('Failed to find a valid Farcaster user after maximum attempts.');
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

runTest();