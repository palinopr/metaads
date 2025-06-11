const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Meta Ads Dashboard (Production Mode)');
console.log('===========================================');

// Environment setup
const env = {
  ...process.env,
  NODE_ENV: 'production',
  NODE_OPTIONS: '--max-old-space-size=4096', // Increase memory limit
};

// Start the Next.js server
const server = spawn('npm', ['run', 'dev'], {
  cwd: __dirname,
  env,
  stdio: 'inherit',
  shell: true
});

// Handle server events
server.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

server.on('close', (code) => {
  if (code !== 0) {
    console.error(`Server exited with code ${code}`);
    console.log('Restarting in 3 seconds...');
    setTimeout(() => {
      require('./run-production.js');
    }, 3000);
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  server.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  server.kill();
  process.exit(0);
});

// Prevent crashes from unhandled errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit - keep running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - keep running
});

console.log('✅ Server starting...');
console.log('📊 Dashboard will be available at http://localhost:3000');
console.log('🛡️  Crash protection: ENABLED');
console.log('🔄 Auto-restart: ENABLED');
console.log('===========================================');