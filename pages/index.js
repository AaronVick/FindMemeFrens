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
        <h1>Find a Fren in Success</h1>
        <p>Success Matters</p>
        <img src={`${baseUrl}/success.png`} alt="Success" width={500} height={300} />
      </main>
    </>
  );
}