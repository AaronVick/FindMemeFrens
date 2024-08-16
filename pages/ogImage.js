import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'experimental-edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') || 'Farcaster User';
  const subtitle = searchParams.get('subtitle') || 'This is a user on Farcaster.';
  const image = searchParams.get('image') || `${process.env.NEXT_PUBLIC_BASE_URL}/default-avatar.png`;

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
              src={image}
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
    console.error('Error in OG image generation:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}