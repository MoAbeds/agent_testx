const express = require('express');
const mojoGuardian = require('./mojo-agent');
const app = express();
const port = process.env.PORT || 3001;

// 1. ATTACH THE MOJO GUARDIAN
app.use(mojoGuardian);

// 2. DEFINE SOME ROUTES
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Old Generic Title</title>
        <meta name="description" content="This is an old unoptimized meta description.">
        <style>
          body { font-family: sans-serif; background: #111; color: #eee; padding: 40px; text-align: center; }
          .card { background: #222; padding: 20px; border-radius: 10px; border: 1px solid #333; max-width: 500px; margin: 0 auto; }
          h1 { color: #22c55e; }
          a { color: #3b82f6; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Welcome to the Dummy Site</h1>
          <p>This site is currently unprotected.</p>
          <div style="margin-top: 20px;">
            <a href="/pricing">Visit Pricing Page</a> | 
            <a href="/broken-link">Click a Dead Link (404)</a>
          </div>
        </div>
      </body>
    </html>
  `);
});

app.get('/pricing', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Pricing - My Service</title>
      </head>
      <body>
        <h1>Our Pricing</h1>
        <p>This page has no meta description and a weak title.</p>
        <a href="/">Back Home</a>
      </body>
    </html>
  `);
});

// A route that doesn't exist will trigger a 404
// The Mojo Guardian will intercept /broken-link if we set up a rule!

app.listen(port, () => {
  console.log(`Dummy Site listening at http://localhost:${port}`);
  console.log(`Guardian Status: CONNECTED`);
});
