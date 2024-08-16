import { ImageResponse } from '@vercel/og';
import { writeFile } from 'fs/promises';
import path from 'path';

export const config = {
  runtime: 'edge',
};

async function fetchImageWithProxy(imageUrl) {
  const proxyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/proxy?url=${encodeURIComponent(imageUrl)}`;
  console.log('Fetching image with proxy:', proxyUrl);
  const response = await fetch(proxyUrl);
  if (!response.ok) {
    throw new Error(`Proxy fetch failed: ${response.status} ${response.statusText}`);
  }
  return await response.arrayBuffer();
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') || 'Farcaster User';
  const subtitle = searchParams.get('subtitle') || 'This is a user on Farcaster.';
  const image = searchParams.get('image');

  console.log('Received parameters:', { title, subtitle, image });

  let imageData = null;

  if (image) {
    try {
      imageData = await fetchImageWithProxy(image);
      console.log('Successfully fetched image data');
    } catch (error) {
      console.error('Error fetching image:', error);
      // Fall back to default image
      imageData = await fetchImageWithProxy(`${process.env.NEXT_PUBLIC_BASE_URL}/default-avatar.png`);
    }
  } else {
    console.log('No image URL provided, using default image');
    imageData = await fetchImageWithProxy(`${process.env.NEXT_PUBLIC_BASE_URL}/default-avatar.png`);
  }

  try {
    const ogImage = new ImageResponse(
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
              src={imageData}
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

    // Save the image to a public directory
    const fileName = `og-image-${Date.now()}.png`;
    const filePath = path.join(process.cwd(), 'public', fileName);
    await writeFile(filePath, await ogImage.arrayBuffer());

    // Return the URL of the saved image
    return new Response(JSON.stringify({ imageUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/${fileName}` }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating image response:', error);
    return new Response(`Failed to generate image: ${error.message}`, { status: 500 });
  }
}