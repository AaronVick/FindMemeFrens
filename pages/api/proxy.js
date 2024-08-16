// api/proxy.js
export default async function handler(req, res) {
    const { url } = req.query;
  
    if (!url) {
      return res.status(400).json({ error: 'Missing URL parameter' });
    }
  
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://success-omega.vercel.app/',
        },
      });
  
      if (!response.ok) {
        return res.status(response.status).json({ error: `Failed to fetch image, status: ${response.status}` });
      }
  
      const data = await response.arrayBuffer();
      res.setHeader('Content-Type', response.headers.get('Content-Type'));
      return res.status(200).send(Buffer.from(data));
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  