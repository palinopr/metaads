const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

// Check if we're in production and have a build
const dev = !fs.existsSync(path.join(__dirname, '.next'));
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

console.log('Starting Railway server...');
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Port: ${port}`);
console.log(`Mode: ${dev ? 'development' : 'production'}`);

if (dev) {
  console.log('No production build found, running in development mode');
}

const app = next({ 
  dev,
  hostname,
  port,
});

const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        const { pathname } = parsedUrl;
        
        // Health check
        if (pathname === '/health') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ 
            status: 'ok',
            mode: dev ? 'development' : 'production',
            timestamp: new Date().toISOString()
          }));
          return;
        }

        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error handling request:', err);
        res.statusCode = 500;
        res.end('Internal server error');
      }
    });

    server.listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log('> Server is running successfully!');
    });

    server.on('error', (err) => {
      console.error('Server error:', err);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });