module.exports = {
  apps: [{
    name: 'meta-ads-dashboard',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    
    // Auto-restart if it crashes
    min_uptime: '10s',
    max_restarts: 10,
    
    // Graceful restart
    kill_timeout: 5000,
    
    // Memory leak protection
    cron_restart: '0 */3 * * *', // Restart every 3 hours
  }]
}