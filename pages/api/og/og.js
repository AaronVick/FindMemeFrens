import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',  // Ensures the function runs as a Vercel Edge Function
};

export default function handler(req) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') || 'Default Title';
  const subtitle = searchParams.get('subtitle') || 'Default Subtitle';
  const image = searchParams.get('image');

  if (!image) {
    return new Response('Missing image parameter', { status: 400 });
  }

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'space-between', padding: '20px', backgroundColor: '#f3f4f6' }}>
        <div style={{ flex: '1', fontSize: '40px', color: '#333' }}>
          <strong>{title}</strong>
          <p style={{ fontSize: '30px', marginTop: '10px', color: '#777' }}>{subtitle}</p>
        </div>
        <img src={image} alt="User Profile" style={{ width: '150px', height: '150px', borderRadius: '50%' }} />
      </div>
    ),
    {
      width: 800,
      height: 400,
    }
  );
}
