import { promises as fs } from 'fs';
import path from 'path';
import axios from 'axios';

// ... (keep all the existing functions)

export async function findFren(c) {
  try {
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
      return c.res({
        image: result.ogImageUrl,
        intents: [
          {
            type: 'button',
            action: 'link',
            label: `View ${result.userData.username}'s Profile`,
            target: `https://warpcast.com/${result.userData.username}`
          },
          {
            type: 'button',
            action: 'post',
            label: 'Find Another Fren'
          }
        ]
      });
    } else {
      return c.res({
        image: `${process.env.NEXT_PUBLIC_BASE_URL}/public/error.png`,
        intents: [
          {
            type: 'button',
            action: 'post',
            label: 'Try Again'
          }
        ]
      });
    }
  } catch (error) {
    console.error('Error in findFren handler:', error);
    return c.res({
      image: `${process.env.NEXT_PUBLIC_BASE_URL}/public/error.png`,
      intents: [
        {
          type: 'button',
          action: 'post',
          label: 'Try Again'
        }
      ]
    });
  }
}