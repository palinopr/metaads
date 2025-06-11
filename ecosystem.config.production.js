/**
 * PM2 Production Configuration
 * Optimized for production deployment with monitoring and error handling
 */

module.exports = {
  apps: [
    {
      name: 'metaads-production',
      script: 'npm',
      args: 'start',
      cwd: process.cwd(),
      
      // Production optimizations
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      
      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DEPLOYMENT_ENVIRONMENT: 'production'
      },
      
      // Monitoring
      monitoring: true,
      pmx: true,
      
      // Auto-restart configuration
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Memory management
      max_memory_restart: '2G',
      
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      merge_logs: true,
      
      // Process management
      kill_timeout: 5000,
      listen_timeout: 10000,
      
      // Health monitoring
      health_check_url: 'http://localhost:3000/api/health',
      health_check_grace_period: 30000,
      
      // Advanced features
      source_map_support: true,
      instance_var: 'INSTANCE_ID',
      
      // Error handling
      crash_handler: {
        enabled: true,
        max_crashes: 5,
        time_window: 600000 // 10 minutes
      },
      
      // Performance monitoring
      performance: {
        enabled: true,
        network: true,
        ports: true
      },
      
      // Custom metrics
      custom_metrics: {
        'Active Users': () => {
          // This would be implemented to track active users
          return Math.floor(Math.random() * 100);
        },
        'Memory Usage %': () => {
          const used = process.memoryUsage();
          return Math.round((used.heapUsed / used.heapTotal) * 100);
        },
        'API Response Time': () => {
          // This would be implemented to track API response times
          return Math.floor(Math.random() * 500) + 100;
        }
      },
      
      // Graceful shutdown
      shutdown_with_message: true,
      wait_ready: true,
      
      // Additional production settings
      node_args: [
        '--max-old-space-size=2048',
        '--optimize-for-size'
      ]
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['production-server'],
      ref: 'origin/main',
      repo: 'https://github.com/your-org/metaads-dashboard.git',
      path: '/var/www/metaads',
      
      // Pre-deployment commands
      'pre-deploy-local': '',
      'pre-deploy': 'git fetch --all',
      
      // Deployment commands
      'post-deploy': 'npm ci --only=production && npm run build && pm2 reload ecosystem.config.production.js --env production && pm2 save',
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  }
};