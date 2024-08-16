import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',  // Run as an Edge function
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') || 'Farcaster User';
  const subtitle = searchParams.get('subtitle') || 'This is a user on Farcaster.';
  const image = searchParams.get('image');

  let imageUrl = image;

  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://success-omega.vercel.app/', // Use your Vercel app URL as referrer
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch image: ${imageUrl}, status: ${response.status}`);
      imageUrl = 'https://example.com/default-image.jpg'; // Fallback to a default image
    }
  } catch (error) {
    console.error(`Error fetching image: ${imageUrl}`, error);
    imageUrl = 'https://example.com/default-image.jpg'; // Fallback to a default image
  }

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
        {/* Left Side: User Data */}
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

        {/* Right Side: Profile Image */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flex: '2',
          }}
        >
          <img
            src={imageUrl}
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
      height: 630, // 1.91:1 aspect ratio
    }
  );
}
