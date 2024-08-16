import { promises as fs } from 'fs';
import axios from 'axios';
import path from 'path';

const PINATA_HUB_API = 'https://hub.pinata.cloud/v1';
const OG_IMAGE_API = 'https://success-omega.vercel.app/api/og';

const USER_DATA_TYPES = {
  PFP: 1,
  DISPLAY: 2,
  BIO: 3,
  URL: 5,
  USERNAME: 6
};

// ... [keep all the existing functions] ...

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
        const ogImageUrl = `${OG_IMAGE_API}?title=${encodeURIComponent(result.userData.display || result.userData.username)}&subtitle=${encodeURIComponent(result.userData.bio || '')}&image=${encodeURIComponent(result.userData.pfp || '')}`;
        
        console.log('Generated OG Image URL:', ogImageUrl);

        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Find a Fren Result</title>
              <meta property="fc:frame" content="vNext" />
              <meta property="fc:frame:image" content="${ogImageUrl}" />
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