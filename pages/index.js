import Head from 'next/head';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export async function getServerSideProps() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://success-omega.vercel.app';
  return { props: { baseUrl } };
}

export default function Home({ baseUrl }) {
  const [apiMessage, setApiMessage] = useState('');

  useEffect(() => {
    fetch('/api/hello')
      .then(response => response.json())
      .then(data => setApiMessage(data.message))
      .catch(error => setApiMessage('Error fetching API'));
  }, []);

  return (
    <>
      <Head>
        <title>Find a Fren Farcaster Frame</title>
        <meta property="og:title" content="Find a Fren" />
        <meta property="og:image" content={`${baseUrl}/success.png`} />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content={`${baseUrl}/success.png`} />
        <meta property="fc:frame:button:1" content="Find a Fren" />
        <meta property="fc:frame:post_url" content={`${baseUrl}/api/findFren`} />
      </Head>
      <main>
        <h1>Find a Fren Farcaster Frame</h1>
        <p>This is a Farcaster frame. View it on a Farcaster client to interact.</p>
        <Image src="/success.png" alt="Success" width={500} height={300} />
        <p>Direct link to image: <a href="/success.png" target="_blank">/success.png</a></p>
        <p>API Test: {apiMessage}</p>
      </main>
    </>
  );
}