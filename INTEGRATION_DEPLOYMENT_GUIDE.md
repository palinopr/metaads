# Meta Ads Dashboard - Integration & Deployment Guide

## Overview

This guide covers the comprehensive integration system and deployment procedures for the Meta Ads Dashboard. The system coordinates multiple specialized agents and provides a unified, production-ready platform.

## Architecture Overview

### Integration System Components

1. **Feature Manager** - Controls feature flags and gradual rollouts
2. **Integration Manager** - Monitors system health and component status
3. **Navigation Manager** - Provides cohesive navigation and routing
4. **Conflict Resolver** - Automatically resolves conflicts between components
5. **Environment Manager** - Manages environment-specific configurations
6. **Migration Manager** - Handles data migrations and user settings
7. **Backup Manager** - Provides backup and restore capabilities
8. **Rollback Manager** - Handles automatic rollbacks during failures

## Quick Start

### 1. Environment Setup

```bash
# Clone the repository
git clone <repository-url>
cd metaads

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### 2. Development Setup

```bash
# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

### 3. Production Deployment

```bash
# Deploy to production
./scripts/deploy-production.sh deploy

# Check deployment status
./scripts/deploy-production.sh health-check

# Rollback if needed
./scripts/deploy-production.sh rollback
```

## Feature Management

### Feature Flags

The system uses a comprehensive feature flag system for gradual rollouts:

```typescript
// Check if feature is enabled
const isEnabled = useFeature('ai_insights_advanced');

// Enable feature programmatically
featureManager.enableFeature('feature_id', 75); // 75% rollout

// Disable feature
featureManager.disableFeature('feature_id');
```

### Available Features

#### Core Features (Always Enabled)
- `auth_oauth_flow` - OAuth authentication
- `ui_dark_mode` - Dark theme support
- `ui_responsive_design` - Mobile optimization
- `performance_optimization` - Performance enhancements

#### Advanced Features (Gradual Rollout)
- `ai_insights_advanced` - Advanced AI analytics
- `pipeline_real_time` - Real-time data processing
- `automation_alerts` - Smart alerts system
- `ai_creative_analysis` - Creative intelligence

#### Enterprise Features
- `auth_multi_account` - Multi-account management
- `automation_reporting` - Automated reporting
- `testing_ab_framework` - A/B testing

## Component Integration

### Using the Integration Provider

Wrap your application with the `IntegrationProvider`:

```tsx
import { IntegrationProvider } from '@/components/integration-provider';

function App() {
  return (
    <IntegrationProvider userProfile={userProfile}>
      <YourApp />
    </IntegrationProvider>
  );
}
```

### Feature Gating Components

```tsx
import { FeatureGate, withFeatureGate } from '@/components/integration-provider';

// Using FeatureGate component
<FeatureGate feature="ai_insights_advanced">
  <AdvancedAnalytics />
</FeatureGate>

// Using HOC
const GatedComponent = withFeatureGate(
  'ai_insights_advanced',
  AdvancedAnalytics,
  BasicAnalytics // fallback
);
```

### Navigation Integration

```tsx
import { useNavigation } from '@/components/integration-provider';

function Navigation() {
  const { navigationItems, breadcrumbs } = useNavigation();
  
  return (
    <nav>
      {navigationItems.map(item => (
        <NavItem key={item.id} item={item} />
      ))}
    </nav>
  );
}
```

## Environment Configuration

### Configuration Files

- `config/production.yml` - Production settings
- `config/staging.yml` - Staging settings
- `ecosystem.config.production.js` - PM2 production config

### Environment Variables

Required variables:
```bash
NEXT_PUBLIC_META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
ANTHROPIC_API_KEY=your_anthropic_api_key
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=your_app_url
```

Optional variables:
```bash
SENTRY_DSN=your_sentry_dsn
ANALYTICS_ID=your_analytics_id
VERSION=1.0.0
```

## Deployment Options

### 1. PM2 Deployment

```bash
# Install PM2 globally
npm install -g pm2

# Deploy with PM2
pm2 start ecosystem.config.production.js --env production

# Monitor
pm2 monit

# Save configuration
pm2 save
pm2 startup
```

### 2. Docker Deployment

```bash
# Build image
docker build -t metaads:latest .

# Run container
docker run -d \
  --name metaads-app \
  -p 3000:3000 \
  --env-file .env \
  metaads:latest
```

### 3. Docker Compose Deployment

```bash
# Deploy with compose
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

## Migration System

### Running Migrations

```typescript
// Check if migrations are needed
const needsMigration = migrationManager.needsMigration();

// Run all pending migrations
const results = await migrationManager.runMigrations();

// Get migration status
const status = migrationManager.getMigrationStatus();
```

### Creating Custom Migrations

```typescript
const migration: Migration = {
  id: 'your_migration_id',
  version: '1.1.0',
  name: 'Your Migration Name',
  description: 'Description of what this migration does',
  dependencies: ['previous_migration_id'],
  critical: false,
  up: async () => {
    // Migration logic
  },
  down: async () => {
    // Rollback logic
  }
};

migrationManager.addMigration(migration);
```

## Backup and Restore

### Creating Backups

```typescript
// Create manual backup
const backupId = await backupManager.createBackup({
  name: 'Pre-deployment backup',
  description: 'Backup before major deployment',
  type: 'manual'
});

// List available backups
const backups = backupManager.getBackups();
```

### Restoring from Backup

```typescript
// Restore from backup
await backupManager.restoreBackup(backupId, {
  includeUserData: true,
  includeSystemConfig: true,
  createBackupBeforeRestore: true
});
```

## Rollback System

### Automatic Rollbacks

The system automatically monitors for:
- High error rates (>5%)
- Performance degradation (>3s response time)
- Health score drops (<50%)

### Manual Rollbacks

```typescript
// Execute rollback plan
const executionId = await rollbackManager.executeRollback(
  'high_error_rate',
  'manual_trigger'
);

// Check rollback status
const execution = rollbackManager.getExecution(executionId);
```

### Creating Rollback Plans

```typescript
const rollbackPlan: RollbackPlan = {
  name: 'Custom Rollback Plan',
  description: 'Handles specific failure scenario',
  priority: 80,
  triggers: [
    {
      type: 'error_rate',
      threshold: 0.1,
      timeWindow: 300000,
      enabled: true
    }
  ],
  actions: [
    {
      type: 'disable_feature',
      target: 'problematic_feature',
      order: 1
    }
  ]
};

rollbackManager.addRollbackPlan(rollbackPlan);
```

## Monitoring and Health Checks

### System Health

```typescript
// Get integration status
const status = integrationManager.getStatus();

// Check specific component
const componentHealth = integrationManager.getComponentStatus('api_meta');

// Refresh health status
await integrationManager.refreshStatus();
```

### Performance Monitoring

The system automatically tracks:
- API response times
- Memory usage
- Error rates
- Component health scores

### Setting Up Alerts

Configure alerts in your environment config:

```yaml
monitoring:
  alerts:
    error_rate_threshold: 0.05  # 5%
    response_time_threshold: 3000  # 3 seconds
    health_score_threshold: 70
```

## Troubleshooting

### Common Issues

1. **Feature not loading**
   - Check feature flags
   - Verify dependencies
   - Check user permissions

2. **Performance issues**
   - Review memory usage
   - Check cache configuration
   - Monitor API response times

3. **Deployment failures**
   - Check health endpoints
   - Review error logs
   - Verify environment variables

### Debug Mode

Enable debug mode for development:

```bash
NODE_ENV=development npm run dev
```

This enables:
- Detailed logging
- Debug panels
- Development tools
- Feature testing

### Logs and Monitoring

```bash
# View application logs
pm2 logs metaads-production

# View deployment logs
tail -f /tmp/metaads-deploy-*.log

# Check system health
curl http://localhost:3000/api/health/detailed
```

## Security Considerations

### Production Security

- HTTPS enforced
- CSP headers configured
- Secure cookie settings
- Rate limiting enabled
- Input validation
- Error sanitization

### Environment Isolation

- Separate configs per environment
- Environment-specific feature flags
- Isolated secrets management
- Network security policies

## Performance Optimization

### Build Optimizations

- Bundle splitting
- Tree shaking
- Image optimization
- Code minification
- Gzip compression

### Runtime Optimizations

- Memory management
- Cache strategies
- Lazy loading
- Request batching
- Connection pooling

## Support and Maintenance

### Regular Maintenance

1. **Daily**
   - Check health dashboards
   - Review error logs
   - Monitor performance metrics

2. **Weekly**
   - Review backup status
   - Update dependencies
   - Performance analysis

3. **Monthly**
   - Security audits
   - Capacity planning
   - Feature usage analysis

### Getting Help

- Check logs: `/logs/` directory
- Health check: `/api/health/detailed`
- Debug panel: `/debug` (development only)
- Error tracking: Integration with error reporting services

## Contributing

When adding new features or components:

1. Add feature flags for gradual rollout
2. Include health checks
3. Add migration scripts if needed
4. Update navigation structure
5. Include rollback procedures
6. Document configuration options

## Version History

- **1.0.0** - Initial integration system
- **1.1.0** - Enhanced OAuth and multi-account support
- **1.2.0** - Advanced AI features
- **1.3.0** - Performance optimizations
- **1.4.0** - Comprehensive monitoring
- **1.5.0** - Production deployment features