import axios from 'axios';

const PINATA_HUB_API = 'https://hub.pinata.cloud/v1';
const OG_IMAGE_API = 'https://ap-news.vercel.app/api/og';

// ... (keep other helper functions)

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // ... (keep your existing logic for finding a random user)

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