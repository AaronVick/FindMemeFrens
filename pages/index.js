import Head from 'next/head';

export async function getServerSideProps() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://success-omega.vercel.app';
  return { props: { baseUrl } };
}

export default function Home({ baseUrl }) {
  return (
    <>
      <Head>
        <title>Find a Fren Farcaster Frame</title>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content={`${baseUrl}/success.png`} />
        <meta property="fc:frame:button:1" content="Find a Fren" />
        <meta property="fc:frame:post_url" content={`${baseUrl}/api/findFren`} />
      </Head>
      <main>
        <h1>Find a Fren Farcaster Frame</h1>
        <p>This is a Farcaster frame. View it on a Farcaster client to interact.</p>
      </main>
    </>
  );
}