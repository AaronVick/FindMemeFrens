import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') || 'Farcaster User';
  const subtitle = searchParams.get('subtitle') || 'This is a user on Farcaster.';
  const image = searchParams.get('image');

  console.log('Received parameters:', { title, subtitle, image });

  let imageUrl = image;
  let fetchedImage = null;

  if (imageUrl) {
    try {
      console.log('Attempting to fetch image:', imageUrl);
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://success-omega.vercel.app/',
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch image: ${imageUrl}, status: ${response.status}`);
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      fetchedImage = await response.arrayBuffer();
      console.log('Successfully fetched image');
    } catch (error) {
      console.error(`Error fetching image: ${imageUrl}`, error);
      imageUrl = 'https://success-omega.vercel.app/default-avatar.png'; // Fallback to a default image
    }
  } else {
    console.log('No image URL provided, using default image');
    imageUrl = 'https://success-omega.vercel.app/default-avatar.png';
  }

  try {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px',
            backgroundColor: '#f9f9f9',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              flex: '3',
              padding: '0 20px',
            }}
          >
            <div style={{ fontSize: '50px', color: '#333', fontWeight: 'bold' }}>
              {title}
            </div>
            <div style={{ fontSize: '30px', color: '#777', marginTop: '10px' }}>
              {subtitle}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flex: '2',
            }}
          >
            <img
              src={fetchedImage ? fetchedImage : imageUrl}
              alt="User Profile"
              style={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '5px solid #ddd',
              }}
            />
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating image response:', error);
    return new Response(`Failed to generate image: ${error.message}`, { status: 500 });
  }
}