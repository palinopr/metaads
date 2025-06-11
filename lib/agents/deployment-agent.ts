/**
 * Agent 11: Deployment Agent
 * Handles deployment, CI/CD, and infrastructure
 */

import { BaseAgent, Task } from './base-agent';

export class DeploymentAgent extends BaseAgent {
  constructor() {
    super('Deployment');
    this.tasks = this.getTasks();
  }

  getTasks(): Task[] {
    return [
      {
        id: 'deploy-1',
        name: 'Setup CI/CD pipeline',
        description: 'GitHub Actions for automated deployment',
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'deploy-2',
        name: 'Configure Docker',
        description: 'Containerization for consistent deployment',
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'deploy-3',
        name: 'Setup staging environment',
        description: 'Pre-production testing environment',
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'deploy-4',
        name: 'Implement blue-green deployment',
        description: 'Zero-downtime deployments',
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'deploy-5',
        name: 'Create infrastructure as code',
        description: 'Terraform/Pulumi configuration',
        priority: 'low',
        status: 'pending'
      }
    ];
  }

  async execute(): Promise<void> {
    this.log('Starting deployment setup...');
    
    for (const task of this.tasks) {
      await this.executeTask(task);
    }
  }

  protected async performTask(task: Task): Promise<void> {
    switch (task.id) {
      case 'deploy-1':
        await this.setupCICD();
        break;
      case 'deploy-2':
        await this.configureDocker();
        break;
      case 'deploy-3':
        await this.setupStagingEnvironment();
        break;
      case 'deploy-4':
        await this.implementBlueGreenDeployment();
        break;
      case 'deploy-5':
        await this.createInfrastructureAsCode();
        break;
    }
  }

  private async setupCICD() {
    // GitHub Actions workflow for CI/CD
    await this.writeFile('.github/workflows/ci-cd.yml', `
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io
  IMAGE_NAME: \\${{ github.repository }}

jobs:
  # Continuous Integration
  test:
    name: Test
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: 'pnpm'
          
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Run linter
        run: pnpm lint
        
      - name: Type check
        run: pnpm type-check
        
      - name: Run tests
        run: pnpm test:ci
        env:
          CI: true
          
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          fail_ci_if_error: true

  # Security scanning
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
          
      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
          
      - name: Run npm audit
        run: pnpm audit --production

  # Build application
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [test, security]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: 'pnpm'
          
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Build application
        run: pnpm build
        env:
          NEXT_TELEMETRY_DISABLED: 1
          
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: |
            .next/
            public/
            package.json
            pnpm-lock.yaml

  # Build Docker image
  docker:
    name: Build Docker Image
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'push'
    
    permissions:
      contents: read
      packages: write
      
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v3
        
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: \${{ env.REGISTRY }}
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
          
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha
            
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: \${{ steps.meta.outputs.tags }}
          labels: \${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          platforms: linux/amd64,linux/arm64

  # Deploy to staging
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: docker
    if: github.ref == 'refs/heads/develop'
    environment:
      name: staging
      url: https://staging.metaadsdashboard.com
      
    steps:
      - name: Deploy to Vercel Staging
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          alias-domains: staging.metaadsdashboard.com

  # Deploy to production
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: docker
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://metaadsdashboard.com
      
    steps:
      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          
      - name: Purge CDN Cache
        run: |
          curl -X POST https://api.cloudflare.com/client/v4/zones/\${{ secrets.CLOUDFLARE_ZONE_ID }}/purge_cache \\
            -H "Authorization: Bearer \${{ secrets.CLOUDFLARE_API_TOKEN }}" \\
            -H "Content-Type: application/json" \\
            -d '{"purge_everything":true}'
            
      - name: Notify Deployment
        uses: 8398a7/action-slack@v3
        with:
          status: \${{ job.status }}
          text: 'Production deployment completed!'
          webhook_url: \${{ secrets.SLACK_WEBHOOK }}
        if: always()

  # E2E tests on staging
  e2e-staging:
    name: E2E Tests on Staging
    runs-on: ubuntu-latest
    needs: deploy-staging
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Install Playwright
        run: pnpm playwright install --with-deps
        
      - name: Run E2E tests
        run: pnpm test:e2e
        env:
          PLAYWRIGHT_BASE_URL: https://staging.metaadsdashboard.com
          
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

  # Performance testing
  lighthouse:
    name: Lighthouse Performance Test
    runs-on: ubuntu-latest
    needs: deploy-staging
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          urls: |
            https://staging.metaadsdashboard.com
            https://staging.metaadsdashboard.com/dashboard
          uploadArtifacts: true
          temporaryPublicStorage: true
          budgetPath: ./lighthouse-budget.json
`);

    // GitHub Actions for release
    await this.writeFile('.github/workflows/release.yml', `
name: Release

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write
  packages: write

jobs:
  release:
    name: Create Release
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          
      - name: Generate changelog
        id: changelog
        uses: mikepenz/release-changelog-builder-action@v4
        with:
          configuration: ".github/changelog-config.json"
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          
      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          body: \${{ steps.changelog.outputs.changelog }}
          draft: false
          prerelease: false
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          
      - name: Build and publish npm package
        run: |
          echo "//registry.npmjs.org/:_authToken=\${{ secrets.NPM_TOKEN }}" > ~/.npmrc
          pnpm install --frozen-lockfile
          pnpm build
          pnpm publish --no-git-checks
        env:
          NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}
`);

    this.log('CI/CD pipeline setup complete');
  }

  private async configureDocker() {
    // Production Dockerfile
    await this.writeFile('Dockerfile', `
# Build stage
FROM node:18-alpine AS builder

# Install dependencies for node-gyp
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.6.0 --activate

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Build application
ENV NEXT_TELEMETRY_DISABLED 1
RUN pnpm build

# Production stage
FROM node:18-alpine AS runner

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Set environment
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"
`);

    // Docker Compose for local development
    await this.writeFile('docker-compose.yml', `
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: builder
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_META_ACCESS_TOKEN=\${NEXT_PUBLIC_META_ACCESS_TOKEN}
      - NEXT_PUBLIC_META_AD_ACCOUNT_ID=\${NEXT_PUBLIC_META_AD_ACCOUNT_ID}
      - DATABASE_URL=postgresql://postgres:password@db:5432/metaads
      - REDIS_URL=redis://redis:6379
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    depends_on:
      - db
      - redis
    command: pnpm dev

  db:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=metaads
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Development tools
  pgadmin:
    image: dpage/pgadmin4:latest
    ports:
      - "5050:80"
    environment:
      - PGADMIN_DEFAULT_EMAIL=admin@example.com
      - PGADMIN_DEFAULT_PASSWORD=admin
    depends_on:
      - db

  redis-commander:
    image: rediscommander/redis-commander:latest
    ports:
      - "8081:8081"
    environment:
      - REDIS_HOSTS=local:redis:6379
    depends_on:
      - redis

volumes:
  postgres_data:
  redis_data:
`);

    // Docker ignore file
    await this.writeFile('.dockerignore', `
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
.pnpm-store/

# Testing
coverage/
.nyc_output/
test-results/
playwright-report/
playwright/

# Next.js
.next/
out/
dist/

# Production
build/

# Misc
.DS_Store
*.pem
.vscode/
.idea/

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# Git
.git/
.gitignore

# Documentation
docs/
*.md
`);

    this.log('Docker configuration complete');
  }

  private async setupStagingEnvironment() {
    // Staging environment configuration
    await this.writeFile('environments/staging/config.ts', `
export const stagingConfig = {
  app: {
    name: 'Meta Ads Dashboard (Staging)',
    url: 'https://staging.metaadsdashboard.com',
    environment: 'staging',
  },
  
  api: {
    baseUrl: 'https://staging-api.metaadsdashboard.com',
    timeout: 30000,
    retries: 3,
  },
  
  features: {
    // Feature flags for staging
    aiPredictions: true,
    advancedAnalytics: true,
    betaFeatures: true,
    debugMode: true,
  },
  
  monitoring: {
    sentry: {
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN_STAGING,
      environment: 'staging',
      tracesSampleRate: 1.0,
    },
    
    analytics: {
      enabled: true,
      debugMode: true,
    },
  },
  
  security: {
    // Relaxed CSP for staging
    csp: {
      reportOnly: true,
      upgradeInsecureRequests: false,
    },
  },
};
`);

    // Staging deployment script
    await this.writeFile('scripts/deploy-staging.sh', `
#!/bin/bash
set -e

echo "🚀 Deploying to Staging Environment"

# Validate environment
if [ -z "$VERCEL_TOKEN" ]; then
  echo "Error: VERCEL_TOKEN not set"
  exit 1
fi

# Run pre-deployment checks
echo "📋 Running pre-deployment checks..."
pnpm test
pnpm lint
pnpm type-check

# Build application
echo "🏗️ Building application..."
pnpm build

# Deploy to Vercel staging
echo "🌐 Deploying to Vercel..."
vercel --token=$VERCEL_TOKEN --prod --env=staging --yes

# Run post-deployment tests
echo "🧪 Running post-deployment tests..."
STAGING_URL=$(vercel --token=$VERCEL_TOKEN ls --meta gitBranch=staging | grep staging | awk '{print $2}')

# Health check
curl -f https://$STAGING_URL/api/health || exit 1

# Run smoke tests
pnpm test:e2e:staging

echo "✅ Staging deployment complete!"
echo "🔗 URL: https://staging.metaadsdashboard.com"
`);

    // Staging environment variables
    await this.writeFile('.env.staging', `
# Staging Environment Variables
NODE_ENV=staging
NEXT_PUBLIC_APP_URL=https://staging.metaadsdashboard.com
NEXT_PUBLIC_API_URL=https://staging-api.metaadsdashboard.com

# Meta API (Staging)
NEXT_PUBLIC_META_APP_ID=staging_app_id
META_APP_SECRET=staging_app_secret

# Database (Staging)
DATABASE_URL=postgresql://user:pass@staging-db.amazonaws.com:5432/metaads_staging

# Redis (Staging)
REDIS_URL=redis://staging-redis.amazonaws.com:6379

# Monitoring (Staging)
NEXT_PUBLIC_SENTRY_DSN_STAGING=https://staging@sentry.io/project
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-STAGING123

# Feature Flags
NEXT_PUBLIC_ENABLE_BETA_FEATURES=true
NEXT_PUBLIC_ENABLE_DEBUG_MODE=true
`);

    this.log('Staging environment setup complete');
  }

  private async implementBlueGreenDeployment() {
    // Blue-Green deployment configuration
    await this.writeFile('deploy/blue-green/config.ts', `
export interface DeploymentConfig {
  environment: 'blue' | 'green';
  version: string;
  healthCheckUrl: string;
  warmupRequests: number;
}

export const blueGreenConfig = {
  blue: {
    url: 'https://blue.metaadsdashboard.com',
    healthCheck: 'https://blue.metaadsdashboard.com/api/health',
    loadBalancerTarget: 'blue-target-group',
  },
  
  green: {
    url: 'https://green.metaadsdashboard.com',
    healthCheck: 'https://green.metaadsdashboard.com/api/health',
    loadBalancerTarget: 'green-target-group',
  },
  
  switchoverSteps: [
    'deploy-to-inactive',
    'run-health-checks',
    'warm-up-instances',
    'run-smoke-tests',
    'switch-traffic-gradual',
    'monitor-metrics',
    'complete-switchover',
  ],
  
  rollbackTriggers: {
    errorRateThreshold: 5, // 5% error rate
    responseTimeThreshold: 3000, // 3 seconds
    healthCheckFailures: 3,
  },
};
`);

    // Blue-Green deployment script
    await this.writeFile('scripts/blue-green-deploy.ts', `
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';

const execAsync = promisify(exec);

interface DeploymentState {
  activeEnvironment: 'blue' | 'green';
  inactiveEnvironment: 'blue' | 'green';
  version: string;
  startTime: Date;
}

class BlueGreenDeployment {
  private state: DeploymentState;
  
  constructor() {
    this.state = this.loadState();
  }
  
  async deploy(version: string) {
    console.log(\`🚀 Starting Blue-Green deployment for version \${version}\`);
    
    try {
      // Step 1: Deploy to inactive environment
      await this.deployToInactive(version);
      
      // Step 2: Health checks
      await this.runHealthChecks();
      
      // Step 3: Warm up instances
      await this.warmUpInstances();
      
      // Step 4: Run smoke tests
      await this.runSmokeTests();
      
      // Step 5: Gradual traffic switch
      await this.switchTrafficGradually();
      
      // Step 6: Monitor metrics
      await this.monitorMetrics();
      
      // Step 7: Complete switchover
      await this.completeSwitchover();
      
      console.log('✅ Deployment completed successfully!');
      
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      await this.rollback();
      throw error;
    }
  }
  
  private async deployToInactive(version: string) {
    const target = this.state.inactiveEnvironment;
    console.log(\`📦 Deploying version \${version} to \${target} environment\`);
    
    await execAsync(\`
      docker tag metaads:\${version} metaads-\${target}:latest
      docker push metaads-\${target}:latest
      kubectl set image deployment/metaads-\${target} app=metaads-\${target}:latest
    \`);
    
    // Wait for rollout
    await execAsync(\`kubectl rollout status deployment/metaads-\${target}\`);
  }
  
  private async runHealthChecks() {
    console.log('🏥 Running health checks...');
    
    const healthUrl = \`https://\${this.state.inactiveEnvironment}.metaadsdashboard.com/api/health\`;
    const maxAttempts = 10;
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await axios.get(healthUrl);
        if (response.data.status === 'healthy') {
          console.log('✅ Health check passed');
          return;
        }
      } catch (error) {
        console.log(\`Health check attempt \${i + 1} failed\`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    throw new Error('Health checks failed');
  }
  
  private async warmUpInstances() {
    console.log('🔥 Warming up instances...');
    
    const warmupUrls = [
      '/api/meta',
      '/dashboard',
      '/api/campaigns',
    ];
    
    const baseUrl = \`https://\${this.state.inactiveEnvironment}.metaadsdashboard.com\`;
    
    await Promise.all(
      warmupUrls.map(url => 
        axios.get(\`\${baseUrl}\${url}\`).catch(() => {})
      )
    );
  }
  
  private async runSmokeTests() {
    console.log('🧪 Running smoke tests...');
    
    const { stdout } = await execAsync(\`
      PLAYWRIGHT_BASE_URL=https://\${this.state.inactiveEnvironment}.metaadsdashboard.com \\
      pnpm test:e2e:smoke
    \`);
    
    console.log(stdout);
  }
  
  private async switchTrafficGradually() {
    console.log('🔄 Switching traffic gradually...');
    
    const stages = [10, 25, 50, 75, 100];
    
    for (const percentage of stages) {
      console.log(\`Routing \${percentage}% traffic to \${this.state.inactiveEnvironment}\`);
      
      await execAsync(\`
        aws elbv2 modify-rule \\
          --rule-arn \${process.env.ALB_RULE_ARN} \\
          --actions Type=forward,ForwardConfig={TargetGroups=[\\
            {TargetGroupArn=\${this.getTargetGroupArn(this.state.activeEnvironment)},Weight=\${100 - percentage}},\\
            {TargetGroupArn=\${this.getTargetGroupArn(this.state.inactiveEnvironment)},Weight=\${percentage}}\\
          ]}
      \`);
      
      // Monitor for issues
      await this.monitorMetrics(60); // 1 minute
      
      const metrics = await this.getMetrics();
      if (metrics.errorRate > 5 || metrics.responseTime > 3000) {
        throw new Error('Performance degradation detected');
      }
    }
  }
  
  private async monitorMetrics(duration = 300) {
    console.log(\`📊 Monitoring metrics for \${duration} seconds...\`);
    
    const endTime = Date.now() + duration * 1000;
    
    while (Date.now() < endTime) {
      const metrics = await this.getMetrics();
      console.log(\`Error rate: \${metrics.errorRate}%, Response time: \${metrics.responseTime}ms\`);
      
      if (metrics.errorRate > 10 || metrics.responseTime > 5000) {
        throw new Error('Critical metrics threshold exceeded');
      }
      
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  private async completeSwitchover() {
    console.log('🎯 Completing switchover...');
    
    // Update DNS
    await execAsync(\`
      aws route53 change-resource-record-sets \\
        --hosted-zone-id \${process.env.HOSTED_ZONE_ID} \\
        --change-batch file://dns-switchover.json
    \`);
    
    // Update state
    this.state.activeEnvironment = this.state.inactiveEnvironment;
    this.state.inactiveEnvironment = this.state.activeEnvironment === 'blue' ? 'green' : 'blue';
    this.saveState();
  }
  
  private async rollback() {
    console.log('⏮️ Rolling back deployment...');
    
    // Switch all traffic back to active environment
    await execAsync(\`
      aws elbv2 modify-rule \\
        --rule-arn \${process.env.ALB_RULE_ARN} \\
        --actions Type=forward,TargetGroupArn=\${this.getTargetGroupArn(this.state.activeEnvironment)}
    \`);
    
    console.log('✅ Rollback completed');
  }
  
  private getTargetGroupArn(environment: 'blue' | 'green'): string {
    return environment === 'blue' 
      ? process.env.BLUE_TARGET_GROUP_ARN! 
      : process.env.GREEN_TARGET_GROUP_ARN!;
  }
  
  private async getMetrics() {
    // Fetch metrics from monitoring system
    const response = await axios.get('https://api.metaadsdashboard.com/metrics', {
      params: {
        timeRange: '5m',
        metrics: ['error_rate', 'response_time']
      }
    });
    
    return {
      errorRate: response.data.error_rate,
      responseTime: response.data.response_time
    };
  }
  
  private loadState(): DeploymentState {
    // Load from persistent storage
    return {
      activeEnvironment: 'blue',
      inactiveEnvironment: 'green',
      version: '1.0.0',
      startTime: new Date()
    };
  }
  
  private saveState() {
    // Save to persistent storage
  }
}

// Execute deployment
const deployment = new BlueGreenDeployment();
deployment.deploy(process.argv[2]).catch(console.error);
`);

    this.log('Blue-green deployment implemented');
  }

  private async createInfrastructureAsCode() {
    // Terraform configuration
    await this.writeFile('infrastructure/terraform/main.tf', `
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    vercel = {
      source  = "vercel/vercel"
      version = "~> 0.15"
    }
  }
  
  backend "s3" {
    bucket = "metaads-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

provider "vercel" {
  api_token = var.vercel_api_token
}

# Variables
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "vercel_api_token" {
  description = "Vercel API token"
  type        = string
  sensitive   = true
}

# VPC
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "metaads-\${var.environment}-vpc"
  cidr = "10.0.0.0/16"

  azs             = data.aws_availability_zones.available.names
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  enable_vpn_gateway = true
  enable_dns_hostnames = true

  tags = {
    Environment = var.environment
    Project     = "MetaAdsDashboard"
  }
}

# RDS Database
resource "aws_db_instance" "postgres" {
  identifier = "metaads-\${var.environment}-db"
  
  engine         = "postgres"
  engine_version = "15.3"
  instance_class = var.environment == "production" ? "db.r6g.large" : "db.t3.micro"
  
  allocated_storage     = 100
  max_allocated_storage = 1000
  storage_encrypted     = true
  
  db_name  = "metaads"
  username = "postgres"
  password = random_password.db_password.result
  
  vpc_security_group_ids = [aws_security_group.database.id]
  db_subnet_group_name   = aws_db_subnet_group.database.name
  
  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  deletion_protection = var.environment == "production"
  skip_final_snapshot = var.environment != "production"
  
  performance_insights_enabled = var.environment == "production"
  monitoring_interval         = var.environment == "production" ? 60 : 0
  
  tags = {
    Environment = var.environment
  }
}

# ElastiCache Redis
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "metaads-\${var.environment}-redis"
  description          = "Redis cluster for MetaAds Dashboard"
  
  engine               = "redis"
  engine_version       = "7.0"
  node_type           = var.environment == "production" ? "cache.r6g.large" : "cache.t3.micro"
  num_cache_clusters  = var.environment == "production" ? 3 : 1
  
  automatic_failover_enabled = var.environment == "production"
  multi_az_enabled          = var.environment == "production"
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  
  subnet_group_name = aws_elasticache_subnet_group.redis.name
  security_group_ids = [aws_security_group.redis.id]
  
  snapshot_retention_limit = var.environment == "production" ? 7 : 1
  snapshot_window         = "03:00-05:00"
  
  tags = {
    Environment = var.environment
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "metaads-\${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = module.vpc.public_subnets

  enable_deletion_protection = var.environment == "production"
  enable_http2              = true
  
  tags = {
    Environment = var.environment
  }
}

# ECS Cluster (for background jobs)
resource "aws_ecs_cluster" "main" {
  name = "metaads-\${var.environment}"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  
  tags = {
    Environment = var.environment
  }
}

# S3 Buckets
resource "aws_s3_bucket" "assets" {
  bucket = "metaads-\${var.environment}-assets"
  
  tags = {
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "assets" {
  bucket = aws_s3_bucket.assets.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "assets" {
  bucket = aws_s3_bucket.assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  is_ipv6_enabled    = true
  comment            = "MetaAds Dashboard CDN"
  default_root_object = "index.html"
  
  origin {
    domain_name = aws_s3_bucket.assets.bucket_regional_domain_name
    origin_id   = "S3-\${aws_s3_bucket.assets.id}"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.assets.cloudfront_access_identity_path
    }
  }
  
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-\${aws_s3_bucket.assets.id}"
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }
  
  price_class = var.environment == "production" ? "PriceClass_All" : "PriceClass_100"
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    cloudfront_default_certificate = true
  }
  
  tags = {
    Environment = var.environment
  }
}

# Vercel Project
resource "vercel_project" "app" {
  name      = "metaads-dashboard-\${var.environment}"
  framework = "nextjs"
  
  git_repository = {
    type = "github"
    repo = "metaadsdashboard/app"
  }
  
  environment = [
    {
      key    = "DATABASE_URL"
      value  = "postgresql://\${aws_db_instance.postgres.username}:\${random_password.db_password.result}@\${aws_db_instance.postgres.endpoint}/\${aws_db_instance.postgres.db_name}"
      target = ["production", "preview"]
    },
    {
      key    = "REDIS_URL"
      value  = "rediss://:\${random_password.redis_password.result}@\${aws_elasticache_replication_group.redis.primary_endpoint_address}:6379"
      target = ["production", "preview"]
    }
  ]
}

# Monitoring and Alerts
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "metaads-\${var.environment}"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", aws_db_instance.postgres.id],
            [".", "DatabaseConnections", ".", "."],
            [".", "ReadLatency", ".", "."],
            [".", "WriteLatency", ".", "."]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "RDS Metrics"
        }
      },
      {
        type   = "metric"
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ElastiCache", "CPUUtilization", "ReplicationGroupId", aws_elasticache_replication_group.redis.id],
            [".", "NetworkBytesIn", ".", "."],
            [".", "NetworkBytesOut", ".", "."],
            [".", "CacheHits", ".", "."],
            [".", "CacheMisses", ".", "."]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Redis Metrics"
        }
      }
    ]
  })
}

# Outputs
output "database_endpoint" {
  value     = aws_db_instance.postgres.endpoint
  sensitive = true
}

output "redis_endpoint" {
  value     = aws_elasticache_replication_group.redis.primary_endpoint_address
  sensitive = true
}

output "cdn_domain" {
  value = aws_cloudfront_distribution.cdn.domain_name
}

output "alb_dns" {
  value = aws_lb.main.dns_name
}
`);

    // Kubernetes manifests
    await this.writeFile('infrastructure/k8s/deployment.yaml', `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: metaads-dashboard
  namespace: production
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: metaads-dashboard
  template:
    metadata:
      labels:
        app: metaads-dashboard
    spec:
      containers:
      - name: app
        image: ghcr.io/metaadsdashboard/app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: metaads-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: metaads-secrets
              key: redis-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: metaads-dashboard
  namespace: production
spec:
  selector:
    app: metaads-dashboard
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: metaads-dashboard
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: metaads-dashboard
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
`);

    this.log('Infrastructure as code created');
  }
}