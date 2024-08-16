import Head from 'next/head';
import { promises as fs } from 'fs';
import path from 'path';

export async function getServerSideProps() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://success-omega.vercel.app/';
  const defaultImageUrl = `${baseUrl}/success.png`;

  return {
    props: { 
      baseUrl,
      defaultImageUrl,
    }
  };
}

const Home = ({ baseUrl, defaultImageUrl }) => {
  return (
    <>
      <Head>
        <title>Find a Fren Farcaster Frame</title>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content={defaultImageUrl} />
        
        <meta property="fc:frame:button:1" content="Find a Fren" />
        <meta property="fc:frame:post_url" content={`${baseUrl}/api/findFren`} />
      </Head>
      <div>
        <h1>Find a Fren</h1>
        <img src={defaultImageUrl} alt="Default Success Image" />
        <div>
          <button>Find a Fren</button>
        </div>
      </div>
    </>
  );
};

export default Home;