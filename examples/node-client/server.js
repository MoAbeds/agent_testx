const express = require('express');
const mojoMiddleware = require('./agent-sdk');

const app = express();
const PORT = 4000;

// Apply Mojo Middleware
app.use(mojoMiddleware);

// A simple boring page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Original Boring Title</title>
      </head>
      <body>
        <h1>Welcome to the User's Website</h1>
        <p>This is a standard page with no optimization.</p>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
});
