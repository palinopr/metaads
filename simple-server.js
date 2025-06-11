const express = require('express');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;

app.prepare().then(() => {
  const server = express();

  // Health check endpoint
  server.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Handle all other routes with Next.js
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(PORT, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log(`> Server running on port ${PORT}`);
    console.log(`> Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`> Ready for requests!`);
  });
});