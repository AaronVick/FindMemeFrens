// api/proxy.js
export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  console.log('Proxying request for URL:', url);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': process.env.NEXT_PUBLIC_BASE_URL,
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch image, status: ${response.status}`);
      return res.status(response.status).json({ error: `Failed to fetch image, status: ${response.status}` });
    }

    const contentType = response.headers.get('content-type');
    res.setHeader('Content-Type', contentType);

    const data = await response.arrayBuffer();
    res.status(200).send(Buffer.from(data));
  } catch (error) {
    console.error('Error in proxy handler:', error);
    return res.status(500).json({ error: error.message });
  }
}