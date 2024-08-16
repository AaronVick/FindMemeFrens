import { Frog } from 'frog';
import { serveStatic } from 'hono/serve-static.module';
import { findFren } from './findFren.js';

// Initialize Frog
const app = new Frog({
  basePath: '/',
  // Supply your own hub if you have one
  hubApiUrl: 'https://hub.pinata.cloud/v1',
});

// Serve static files
app.use('/public/*', serveStatic({ root: './' }));

// Define your frame
app.frame('/', (c) => {
  const { buttonValue, status } = c;
  
  if (status === 'initial') {
    return c.res({
      image: `${process.env.NEXT_PUBLIC_BASE_URL}/public/success.png`,
      intents: [
        {
          type: 'button',
          action: 'post',
          label: 'Find a Fren',
        },
      ],
    });
  }

  if (buttonValue === 'Find a Fren') {
    return findFren(c);
  }
});

export default app;