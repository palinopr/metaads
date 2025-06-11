const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Meta Ads Dashboard (Ultra-Stable Mode)');
console.log('===========================================');

let server = null;
let restartCount = 0;
let lastRestartTime = Date.now();

// Function to start the server
function startServer() {
  console.log(`\n🔧 Starting server (attempt ${restartCount + 1})...`);
  
  // Environment setup with protective measures
  const env = {
    ...process.env,
    NODE_ENV: 'development',
    NODE_OPTIONS: '--max-old-space-size=4096', // 4GB memory limit
    NEXT_TELEMETRY_DISABLED: '1', // Disable telemetry
  };

  // Start the Next.js server
  server = spawn('npm', ['run', 'dev'], {
    cwd: __dirname,
    env,
    stdio: 'pipe', // Capture output
    shell: true
  });

  let serverOutput = '';

  // Handle server output
  server.stdout.on('data', (data) => {
    const output = data.toString();
    process.stdout.write(output);
    serverOutput += output;

    // Check if server is ready
    if (output.includes('Ready in') || output.includes('started server on')) {
      console.log('\n✅ Server is ready!');
      console.log('📊 Dashboard available at http://localhost:3000');
      serverOutput = ''; // Reset buffer
    }
  });

  // Handle server errors
  server.stderr.on('data', (data) => {
    const error = data.toString();
    console.error('Server error:', error);

    // Check for common errors
    if (error.includes('EADDRINUSE')) {
      console.log('\n❌ Port 3000 is already in use!');
      console.log('Try: lsof -ti:3000 | xargs kill -9');
      process.exit(1);
    }
  });

  // Handle server exit
  server.on('exit', (code, signal) => {
    console.log(`\n⚠️  Server exited with code ${code} and signal ${signal}`);
    
    // Calculate time since last restart
    const timeSinceLastRestart = Date.now() - lastRestartTime;
    
    // If server crashed too quickly, wait before restarting
    if (timeSinceLastRestart < 5000) {
      console.log('Server crashed too quickly. Waiting 5 seconds...');
      setTimeout(() => {
        restartServer();
      }, 5000);
    } else {
      restartServer();
    }
  });

  // Handle server errors
  server.on('error', (error) => {
    console.error('Failed to start server:', error);
    setTimeout(() => {
      restartServer();
    }, 3000);
  });

  // Update restart tracking
  restartCount++;
  lastRestartTime = Date.now();
}

// Function to restart server
function restartServer() {
  if (restartCount > 10) {
    console.error('\n❌ Server crashed too many times. Please check the logs.');
    process.exit(1);
  }

  console.log('\n🔄 Restarting server in 3 seconds...');
  setTimeout(() => {
    startServer();
  }, 3000);
}

// Function to gracefully shutdown
function shutdown() {
  console.log('\n🛑 Shutting down gracefully...');
  if (server) {
    server.kill('SIGTERM');
  }
  process.exit(0);
}

// Handle process termination
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('\n❌ Uncaught Exception:', error);
  console.log('Server will continue running...');
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ Unhandled Rejection at:', promise, 'reason:', reason);
  console.log('Server will continue running...');
});

// Memory usage monitoring
setInterval(() => {
  const usage = process.memoryUsage();
  const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
  
  if (heapUsedMB > 1000) {
    console.warn(`\n⚠️  High memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB`);
    
    // Force garbage collection if available
    if (global.gc) {
      console.log('Running garbage collection...');
      global.gc();
    }
  }
}, 30000); // Check every 30 seconds

// Start the server
console.log('===========================================');
console.log('🛡️  Crash protection: ENABLED');
console.log('🔄 Auto-restart: ENABLED');
console.log('📊 Memory monitoring: ENABLED');
console.log('🚨 Error recovery: ENABLED');
console.log('===========================================\n');

startServer();