import Head from 'next/head';
import { useEffect } from 'react';

export async function getServerSideProps() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://success-omega.vercel.app';
  return { props: { baseUrl } };
}

export default function Home({ baseUrl }) {
  useEffect(() => {
    console.log('Build time:', process.env.NEXT_PUBLIC_BUILD_TIME);
  }, []);

  return (
    <>
      <Head>
        <title>Find a Fren Farcaster Frame</title>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content={`${baseUrl}/success.png`} />
        <meta property="fc:frame:button:1" content="Find a Fren" />
        <meta property="fc:frame:post_url" content={`${baseUrl}/api/findFren`} />

        <meta property="fc:frame:button:2" content="Share" />
        <meta property="fc:frame:button:2:action" content="link" />
        <meta property="fc:frame:button:2:target" content="https://warpcast.com/~/compose?text=Let's+meet+some+frens+in+/success.%0A%0AFrame+by+%40aaronv&embeds[]=https%3A%2F%2Fsuccess-omega.vercel.app%2F" />

      </Head>
      <main>
        <h1>Find a Fren in Success</h1>
        <p>Success Matters</p>
        <img src={`${baseUrl}/success.png`} alt="Success" width={500} height={300} />
        <p>If you can see this image, static file serving is working.</p>
      </main>
    </>
  );
}