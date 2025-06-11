#!/usr/bin/env node

const https = require('http');

console.log('🔍 Memory Monitor Started');
console.log('========================');

// Check health every 30 seconds
setInterval(async () => {
  try {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const health = JSON.parse(data);
          const timestamp = new Date().toLocaleTimeString();
          
          console.log(`\n[${timestamp}] Health Check:`);
          console.log(`  Status: ${health.status}`);
          console.log(`  Memory: ${health.memory.heapUsed}MB / ${health.memory.heapTotal}MB`);
          console.log(`  RSS: ${health.memory.rss}MB`);
          console.log(`  Uptime: ${Math.round(health.uptime / 60)}min`);
          
          if (health.status === 'warning') {
            console.warn('  ⚠️  HIGH MEMORY USAGE DETECTED');
          }
        } catch (e) {
          console.error('Failed to parse health response:', e.message);
        }
      });
    });
    
    req.on('error', (e) => {
      console.error(`Health check failed: ${e.message}`);
    });
    
    req.end();
  } catch (error) {
    console.error('Monitor error:', error);
  }
}, 30000);

// Handle exit
process.on('SIGINT', () => {
  console.log('\n\n👋 Memory Monitor stopped');
  process.exit(0);
});