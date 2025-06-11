const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');

// Production server with comprehensive error handling
const dev = false;
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

console.log('Starting production server...');
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Port: ${port}`);

// Configure Next.js
const app = next({
  dev,
  hostname,
  port,
  dir: __dirname,
  conf: {
    distDir: '.next',
    compress: true,
    poweredByHeader: false,
  }
});

const handle = app.getRequestHandler();

// Error handler
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit in production, try to recover
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in production, try to recover
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

let server;

app.prepare()
  .then(() => {
    server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        const { pathname } = parsedUrl;
        
        // Health check endpoint
        if (pathname === '/health' || pathname === '/api/health') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ 
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
          }));
          return;
        }

        // Handle all other routes with Next.js
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('Internal server error');
      }
    });

    server.listen(port, hostname, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log('> Production server is running!');
      
      // Log memory usage
      const used = process.memoryUsage();
      console.log('Memory usage:');
      for (let key in used) {
        console.log(`${key}: ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
      }
    });

    // Keep-alive for the server
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
  })
  .catch((err) => {
    console.error('Error starting server:', err);
    process.exit(1);
  });