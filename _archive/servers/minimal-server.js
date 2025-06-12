const { createServer } = require('http');
const next = require('next');

const dev = false; // Always production mode
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

console.log('Starting minimal server...');
console.log(`Port: ${port}`);

// Use minimal config
process.env.NEXT_CONFIG_FILE = './next.config.minimal.mjs';

const app = next({ 
  dev,
  conf: require('./next.config.minimal.mjs')
});

const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    createServer((req, res) => {
      handle(req, res);
    })
    .listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
  })
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });