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
  console.log(`Reading file: ${filePath}`);
  const data = await fs.readFile(filePath, 'utf8');
  const lines = data.split('\n').filter(line => line.trim() !== '');
  console.log(`Found ${lines.length} non-empty lines in the file`);
  return lines[Math.floor(Math.random() * lines.length)];
}

async function searchFarcasterByName(name) {
  console.log(`Searching for Farcaster user: ${name}`);
  try {
    const proof = await getUserNameProof(name);
    if (!proof) {
      console.log(`No proof found for user: ${name}`);
      return null;
    }
    console.log(`Found proof for user: ${name}, FID: ${proof.fid}`);

    const userData = await getAllUserData(proof.fid);
    console.log(`Retrieved user data for FID: ${proof.fid}`);

    const ogImageUrl = generateOgImageUrl(proof.fid, userData);
    console.log(`Generated OG Image URL: ${ogImageUrl}`);

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
  console.log('NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL);
  console.log('OG_IMAGE_API:', OG_IMAGE_API);

  // Test OG Image API
  try {
    const testUrl = `${OG_IMAGE_API}?title=Test&subtitle=Test&image=https://example.com/image.jpg`;
    const response = await axios.get(testUrl);
    console.log('OG Image API test successful:', response.status);
  } catch (error) {
    console.error('OG Image API test failed:', error.message);
  }

  if (req.method === 'POST') {
    console.log('Received POST request to /api/findFren');
    try {
      console.log('Attempting to fetch random user...');
      const result = await fetchRandomUser();
      if (result) {
        console.log('Successfully found a random user:', result.userData.username);
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Find a Fren Result</title>
              <meta property="fc:frame" content="vNext" />
              <meta property="fc:frame:image" content="${result.ogImageUrl}" />
              <meta property="fc:frame:button:1" content="View ${result.userData.username}'s Profile" />
              <meta property="fc:frame:button:1:action" content="link" />
              <meta property="fc:frame:button:1:target" content="https://warpcast.com/${result.userData.username}" />
              <meta property="fc:frame:button:2" content="Find Another Fren" />
              <meta property="fc:frame:button:2:action" content="post" />
              <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/findFren" />
            </head>
            <body>
              <h1>Find a Fren Result</h1>
              <p>Check out your new fren on Farcaster!</p>
            </body>
          </html>
        `);
      } else {
        console.log('Failed to find a random user after maximum attempts');
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Find a Fren Error</title>
              <meta property="fc:frame" content="vNext" />
              <meta property="fc:frame:image" content="${process.env.NEXT_PUBLIC_BASE_URL}/error.png" />
              <meta property="fc:frame:button:1" content="Try Again" />
              <meta property="fc:frame:button:1:action" content="post" />
              <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/findFren" />
            </head>
            <body>
              <h1>Error</h1>
              <p>Sorry, we couldn't find a fren this time. Please try again!</p>
            </body>
          </html>
        `);
      }
    } catch (error) {
      console.error('Error in findFren handler:', error);
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Find a Fren Error</title>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${process.env.NEXT_PUBLIC_BASE_URL}/error.png" />
            <meta property="fc:frame:button:1" content="Try Again" />
            <meta property="fc:frame:button:1:action" content="post" />
            <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/findFren" />
          </head>
          <body>
            <h1>Error</h1>
            <p>An unexpected error occurred. Please try again!</p>
          </body>
        </html>
      `);
    }
  } else {
    console.log(`Received ${req.method} request to /api/findFren`);
    res.setHeader('Content-Type', 'text/html');
    res.status(405).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Method Not Allowed</title>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${process.env.NEXT_PUBLIC_BASE_URL}/error.png" />
          <meta property="fc:frame:button:1" content="Go Back" />
          <meta property="fc:frame:button:1:action" content="post" />
          <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/findFren" />
        </head>
        <body>
          <h1>Method Not Allowed</h1>
          <p>This endpoint only accepts POST requests.</p>
        </body>
      </html>
    `);
  }
}