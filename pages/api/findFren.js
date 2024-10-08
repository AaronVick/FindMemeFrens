import { promises as fs } from 'fs';
import axios from 'axios';
import path from 'path';

const PINATA_HUB_API = 'https://hub.pinata.cloud/v1';
const OG_IMAGE_API = `${process.env.NEXT_PUBLIC_BASE_URL}/api/ogImage`;

const USER_DATA_TYPES = {
  PFP: 1,
  DISPLAY: 2,
  BIO: 3,
  URL: 5,
  USERNAME: 6
};

async function getRandomLine() {
  console.log('Attempting to read success.txt');
  try {
    const filePath = path.join(process.cwd(), 'public', 'success.txt');
    console.log(`Reading file: ${filePath}`);
    const data = await fs.readFile(filePath, 'utf8');
    const lines = data.split('\n').filter(line => line.trim() !== '');
    console.log(`Found ${lines.length} non-empty lines in the file`);
    return lines[Math.floor(Math.random() * lines.length)];
  } catch (error) {
    console.error('Error reading success.txt:', error);
    throw error;
  }
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

    return { userData };
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

async function fetchRandomUser() {
  let result = null;
  let attempts = 0;
  const maxAttempts = 25;

  while (!result && attempts < maxAttempts) {
    try {
      const randomValue = await getRandomLine();
      console.log(`Attempt ${attempts + 1} - Random value selected: ${randomValue}`);
      
      result = await searchFarcasterByName(randomValue);
      attempts++;
      
      if (result && result.userData && result.userData.username) {
        console.log(`Valid user found: ${result.userData.username}`);
        return result;
      } else {
        console.log('Invalid or incomplete user data, retrying...');
        result = null;
      }
    } catch (error) {
      console.error('Error in fetchRandomUser:', error);
      attempts++;
    }
  }

  console.log(`Failed to find a valid user after ${maxAttempts} attempts`);
  return null;
}

export default async function handler(req, res) {
  console.log('NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL);
  console.log('OG_IMAGE_API:', OG_IMAGE_API);

  if (req.method === 'POST') {
    console.log('Received POST request to /api/findFren');
    try {
      console.log('Attempting to fetch random user...');
      const result = await fetchRandomUser();
      if (result) {
        console.log('Successfully found a random user:', result.userData.username);
        
        // Generate OG image URL
        const ogImageUrl = `${OG_IMAGE_API}?` + new URLSearchParams({
          title: result.userData.display || result.userData.username,
          subtitle: result.userData.bio || '',
          image: result.userData.pfp || ''
        }).toString();
        
        console.log('Generated OG Image URL:', ogImageUrl);

        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Find a Fren Result</title>
              <meta property="fc:frame" content="vNext" />
              <meta property="fc:frame:image" content="${ogImageUrl}" />
              <meta property="fc:frame:button:1" content="View Profile" />
              <meta property="fc:frame:button:1:action" content="link" />
              <meta property="fc:frame:button:1:target" content="https://warpcast.com/${result.userData.username}" />
              <meta property="fc:frame:button:2" content="Find Another Fren" />
              <meta property="fc:frame:button:2:action" content="post" />
              <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/findFren" />
              <meta property="fc:frame:button:3" content="Share" />
              <meta property="fc:frame:button:3:action" content="link" />
              <meta property="fc:frame:button:3:target" content="https://warpcast.com/~/compose?text=Let's+meet+some+frens+in+/memes.%0A%0AFrame+by+%40aaronv&embeds[]=https%3A%2F%2Ffind-meme-frens.vercel.app%2F" />

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
