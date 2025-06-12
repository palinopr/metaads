#!/usr/bin/env node

const http = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

console.log('🚨 Emergency Server Starting...');

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  // Don't exit, keep running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit, keep running
});

app.prepare().then(() => {
  const server = http.createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      
      // Add timeout to all requests
      res.setTimeout(30000, () => {
        console.error('Request timeout:', req.url);
        res.statusCode = 408;
        res.end('Request Timeout');
      });
      
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`✅ Ready on http://${hostname}:${port}`);
    console.log('🛡️  Protected against crashes');
    console.log('📊 Visit http://localhost:3000/test to verify');
  });

  // Handle server errors
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} is already in use!`);
      console.log('Try: lsof -ti:3000 | xargs kill -9');
      process.exit(1);
    } else {
      console.error('Server error:', err);
    }
  });
});

// Keep process alive
setInterval(() => {
  const mem = process.memoryUsage();
  const heapMB = Math.round(mem.heapUsed / 1024 / 1024);
  if (heapMB > 500) {
    console.warn(`⚠️  High memory: ${heapMB}MB`);
  }
}, 30000);