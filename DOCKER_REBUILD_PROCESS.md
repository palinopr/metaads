# Docker Rebuild Process for Meta Ads Dashboard

## Quick Reference Commands

### Emergency Rebuild (2-3 minutes)
```bash
# One-liner for emergency situations
docker-compose down && docker-compose build --no-cache && docker-compose up -d
```

### Development Rebuild (5-7 minutes)
```bash
# Step-by-step rebuild for development
docker-compose down
docker-compose build --no-cache
docker-compose up -d
docker-compose logs -f
```

### Production Rebuild (10-15 minutes)
```bash
# Complete production rebuild with validation
./scripts/docker-rebuild-production.sh
```

---

## Detailed Rebuild Procedures

### Level 1: Quick Restart (30 seconds)
When you need to restart without rebuilding:

```bash
# Just restart containers
docker-compose restart

# Or restart specific service
docker-compose restart metaads

# Check status
docker-compose ps
docker-compose logs --tail=50 metaads
```

### Level 2: Rebuild Application (2-3 minutes)
When code changes need to be applied:

```bash
# Stop containers
docker-compose down

# Rebuild only the application (no dependencies)
docker-compose build --no-cache metaads

# Start containers
docker-compose up -d

# Monitor startup
docker-compose logs -f metaads
```

### Level 3: Full Rebuild (5-7 minutes)
When dependencies or Docker configuration changes:

```bash
# Stop and remove containers
docker-compose down --volumes

# Remove related images
docker rmi $(docker images | grep metaads | awk '{print $3}')

# Clear build cache
docker builder prune -f

# Rebuild everything
docker-compose build --no-cache --pull

# Start containers
docker-compose up -d

# Validate health
docker-compose exec metaads curl -f http://localhost:3000/api/health
```

### Level 4: Nuclear Rebuild (10-15 minutes)
When everything is broken:

```bash
# Stop all containers
docker-compose down --volumes --remove-orphans

# Remove all unused Docker resources
docker system prune -af --volumes

# Remove all images (be careful - this affects other projects)
docker rmi $(docker images -q) -f

# Rebuild from scratch
docker-compose build --no-cache --pull

# Start with detailed logging
docker-compose up --force-recreate
```

---

## Docker Configuration Analysis

### Current Dockerfile Structure
```dockerfile
# Multi-stage build for optimization
FROM node:20-alpine AS deps      # Dependencies layer
FROM node:20-alpine AS builder   # Build layer  
FROM node:20-alpine AS runner    # Runtime layer
```

**Optimization Benefits:**
- Smaller final image size (~200MB vs ~1GB)
- Faster deployments
- Better security (no build tools in production)
- Cached dependency layer for faster rebuilds

### Docker Compose Configuration
```yaml
services:
  metaads:
    build: .
    ports: ["3000:3000"]
    healthcheck: curl health endpoint every 30s
    resources: 2GB max memory, 2 CPU max
    restart: unless-stopped
```

**Key Features:**
- Health monitoring with automatic restart
- Resource limits to prevent memory leaks
- Environment variable support
- Production-ready configuration

---

## Common Docker Issues and Solutions

### Issue 1: Build Fails at Dependencies Stage
**Symptoms:**
```
ERROR [deps 3/4] RUN corepack enable pnpm && pnpm i --no-frozen-lockfile
```

**Solutions:**
```bash
# 1. Clear package manager cache
docker-compose build --no-cache deps

# 2. Update lockfile
rm pnpm-lock.yaml
docker run --rm -v $(pwd):/app -w /app node:20-alpine sh -c "corepack enable pnpm && pnpm install"

# 3. Rebuild with fresh dependencies
docker-compose build --no-cache
```

### Issue 2: Next.js Build Errors
**Symptoms:**
```
ERROR [builder 3/4] RUN corepack enable pnpm && pnpm run build
```

**Solutions:**
```bash
# 1. Check for TypeScript errors locally
npx tsc --noEmit

# 2. Build locally first
npm run build

# 3. Rebuild Docker image
docker-compose build --no-cache builder
```

### Issue 3: Runtime Errors
**Symptoms:**
```
Container exits immediately or health check fails
```

**Solutions:**
```bash
# 1. Check container logs
docker-compose logs metaads

# 2. Debug container interactively
docker-compose run --rm metaads sh

# 3. Check environment variables
docker-compose exec metaads env | grep NEXT_PUBLIC
```

### Issue 4: Port Conflicts
**Symptoms:**
```
ERROR: Port 3000 is already in use
```

**Solutions:**
```bash
# 1. Find process using port
lsof -i :3000

# 2. Kill process
kill -9 [PID]

# 3. Or use different port
docker-compose -f docker-compose.override.yml up -d
# Where override.yml has: ports: ["3001:3000"]
```

### Issue 5: Out of Disk Space
**Symptoms:**
```
no space left on device
```

**Solutions:**
```bash
# 1. Clean Docker system
docker system prune -af --volumes

# 2. Remove unused images
docker image prune -af

# 3. Remove build cache
docker builder prune -af

# 4. Check disk usage
df -h
docker system df
```

---

## Automated Rebuild Scripts

### Development Rebuild Script
```bash
#!/bin/bash
# scripts/docker-rebuild-dev.sh

set -e

echo "🔄 Starting development Docker rebuild..."

# Stop containers
echo "⏹️  Stopping containers..."
docker-compose down

# Clear cache
echo "🧹 Clearing build cache..."
docker builder prune -f

# Rebuild
echo "🔨 Rebuilding application..."
docker-compose build --no-cache

# Start containers
echo "🚀 Starting containers..."
docker-compose up -d

# Wait for health check
echo "⏳ Waiting for health check..."
sleep 30

# Check status
if docker-compose exec metaads curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Rebuild successful! Dashboard is healthy."
    docker-compose ps
else
    echo "❌ Rebuild failed! Check logs:"
    docker-compose logs --tail=20 metaads
    exit 1
fi
```

### Production Rebuild Script
```bash
#!/bin/bash
# scripts/docker-rebuild-production.sh

set -e

echo "🏭 Starting production Docker rebuild..."

# Backup current state
echo "💾 Creating backup..."
docker tag metaads-app:latest metaads-app:backup-$(date +%Y%m%d-%H%M%S) || true

# Pre-build validation
echo "🔍 Running pre-build validation..."
npm run lint
npm run test:unit
npx tsc --noEmit

# Stop containers gracefully
echo "⏹️  Stopping containers..."
docker-compose down --timeout 30

# Clean rebuild
echo "🧹 Cleaning Docker environment..."
docker system prune -f
docker builder prune -f

# Build with cache optimization
echo "🔨 Building production image..."
docker-compose build --no-cache --pull

# Start containers
echo "🚀 Starting production containers..."
docker-compose up -d

# Extended health check
echo "⏳ Running health validation..."
sleep 60

# Comprehensive health check
if ./scripts/health-check-comprehensive.sh; then
    echo "✅ Production rebuild successful!"
    # Clean up old backup
    docker rmi metaads-app:backup-* 2>/dev/null || true
else
    echo "❌ Production rebuild failed! Rolling back..."
    docker-compose down
    docker tag metaads-app:backup-$(date +%Y%m%d-%H%M%S) metaads-app:latest
    docker-compose up -d
    exit 1
fi
```

### Comprehensive Health Check Script
```bash
#!/bin/bash
# scripts/health-check-comprehensive.sh

echo "🔍 Running comprehensive health check..."

# Test basic connectivity
if ! curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "❌ Health endpoint failed"
    return 1
fi

# Test Meta API integration
if ! curl -f -X POST http://localhost:3000/api/meta \
    -H "Content-Type: application/json" \
    -d '{"type":"overview"}' > /dev/null 2>&1; then
    echo "❌ Meta API integration failed"
    return 1
fi

# Test memory usage
MEMORY_USAGE=$(docker stats --no-stream metaads-app --format "{{.MemUsage}}" | cut -d'/' -f1 | sed 's/[^0-9.]//g')
if (( $(echo "$MEMORY_USAGE > 1000" | bc -l) )); then
    echo "⚠️ High memory usage: ${MEMORY_USAGE}MB"
fi

# Test response time
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:3000/)
if (( $(echo "$RESPONSE_TIME > 2" | bc -l) )); then
    echo "⚠️ Slow response time: ${RESPONSE_TIME}s"
fi

echo "✅ All health checks passed"
return 0
```

---

## Docker Optimization Strategies

### Build Performance Optimization

#### 1. Layer Caching Strategy
```dockerfile
# Dockerfile optimization
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files first (cached if unchanged)
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile

# Copy source code after dependencies (cache bust only on code changes)
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build
```

#### 2. Multi-Stage Build Benefits
- **Dependencies stage**: Cached unless package.json changes
- **Builder stage**: Only rebuilds when source code changes  
- **Runner stage**: Minimal production image (~200MB)

#### 3. Docker Ignore Optimization
```dockerfile
# .dockerignore
node_modules
.next
.git
*.log
README.md
.env.local
```

### Runtime Performance Optimization

#### 1. Resource Limits
```yaml
# docker-compose.yml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
    reservations:
      cpus: '0.5'
      memory: 512M
```

#### 2. Health Check Configuration
```yaml
healthcheck:
  test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

---

## Monitoring and Maintenance

### Container Monitoring Commands
```bash
# Real-time stats
docker stats metaads-app

# Memory usage over time
watch -n 5 'docker stats --no-stream metaads-app'

# Log monitoring
docker-compose logs -f --tail=100 metaads

# Container inspection
docker inspect metaads-app | jq '.State'
```

### Automated Maintenance
```bash
# Daily cleanup cron job
0 2 * * * /path/to/metaads/scripts/docker-cleanup.sh

# Weekly rebuild (if needed)
0 3 * * 0 /path/to/metaads/scripts/docker-rebuild-production.sh
```

### Docker Cleanup Script
```bash
#!/bin/bash
# scripts/docker-cleanup.sh

echo "🧹 Running Docker maintenance cleanup..."

# Remove unused containers
docker container prune -f

# Remove unused images (keep last 3 versions)
docker image prune -af --filter "until=72h"

# Remove unused volumes (be careful with data!)
# docker volume prune -f

# Remove build cache older than 24h
docker builder prune -f --filter "until=24h"

# Report disk usage
echo "📊 Docker disk usage after cleanup:"
docker system df

echo "✅ Docker cleanup completed"
```

---

## Emergency Procedures

### Container Won't Start
```bash
# 1. Check logs
docker-compose logs metaads

# 2. Try interactive mode
docker-compose run --rm metaads sh

# 3. Check environment
docker-compose config

# 4. Rebuild if necessary
docker-compose down && docker-compose build --no-cache && docker-compose up -d
```

### Memory Leak Recovery
```bash
# 1. Monitor memory usage
docker stats metaads-app

# 2. If memory usage >1.5GB, restart
docker-compose restart metaads

# 3. If persistent, rebuild
docker-compose down && docker-compose up -d --force-recreate
```

### Complete Recovery Procedure
```bash
#!/bin/bash
# Emergency recovery script

echo "🚨 Starting emergency Docker recovery..."

# Stop everything
docker-compose down --volumes --remove-orphans

# Clean everything
docker system prune -af --volumes

# Rebuild from scratch
docker-compose build --no-cache --pull

# Start with monitoring
docker-compose up -d

# Wait and validate
sleep 60
if ./scripts/health-check-comprehensive.sh; then
    echo "✅ Emergency recovery successful"
else
    echo "❌ Emergency recovery failed - manual intervention required"
    exit 1
fi
```

Remember: **Always backup before major Docker operations** and **test in development environment first**!

<function_calls>
<invoke name="Read">
<parameter name="file_path">/Users/jaimeortiz/metaads/Dockerfile