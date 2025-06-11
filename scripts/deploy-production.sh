#!/bin/bash

# Production Deployment Script for Meta Ads Dashboard
# This script handles production deployment with safety checks and rollback capability

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_LOG="/tmp/metaads-deploy-$(date +%Y%m%d-%H%M%S).log"
BACKUP_DIR="/tmp/metaads-backups"
VERSION="${VERSION:-$(date +%Y%m%d-%H%M%S)}"
ENVIRONMENT="production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

# Cleanup function
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        error "Deployment failed with exit code $exit_code"
        error "Check deployment log: $DEPLOYMENT_LOG"
        
        # Offer rollback
        read -p "Do you want to rollback to the previous version? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rollback_deployment
        fi
    fi
    exit $exit_code
}

trap cleanup EXIT

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."
    
    # Check if required environment variables are set
    local required_vars=("NEXT_PUBLIC_META_APP_ID" "META_APP_SECRET" "ANTHROPIC_API_KEY")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    # Check if we're in the correct directory
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        error "package.json not found. Please run from project root."
        exit 1
    fi
    
    # Check if dependencies are installed
    if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
        error "Dependencies not installed. Run 'npm install' first."
        exit 1
    fi
    
    # Check if build directory exists or can be created
    if [ ! -d "$PROJECT_ROOT/.next" ]; then
        warning "Build directory not found. Will build during deployment."
    fi
    
    # Check disk space (at least 2GB free)
    local available_space=$(df "$PROJECT_ROOT" | awk 'NR==2 {print $4}')
    if [ "$available_space" -lt 2097152 ]; then  # 2GB in KB
        error "Insufficient disk space. At least 2GB required."
        exit 1
    fi
    
    # Check memory (at least 1GB available)
    local available_memory=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    if [ "$available_memory" -lt 1024 ]; then
        warning "Low memory available: ${available_memory}MB. Deployment may be slow."
    fi
    
    success "Pre-deployment checks passed"
}

# Create backup
create_backup() {
    log "Creating backup before deployment..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup current deployment if it exists
    if [ -d "$PROJECT_ROOT/.next" ]; then
        local backup_name="backup-$(date +%Y%m%d-%H%M%S)"
        tar -czf "$BACKUP_DIR/$backup_name.tar.gz" -C "$PROJECT_ROOT" .next package.json package-lock.json
        log "Backup created: $BACKUP_DIR/$backup_name.tar.gz"
        
        # Store backup reference
        echo "$backup_name" > "$BACKUP_DIR/latest-backup"
    fi
    
    # Backup user data using the application's backup system
    cd "$PROJECT_ROOT"
    if npm run --silent pre-deploy 2>/dev/null; then
        log "Application-level backup completed"
    else
        warning "Application-level backup failed, continuing with file-level backup only"
    fi
}

# Build application
build_application() {
    log "Building application for production..."
    
    cd "$PROJECT_ROOT"
    
    # Install/update dependencies
    log "Installing dependencies..."
    npm ci --only=production
    
    # Run linting (non-blocking)
    log "Running linting..."
    if ! npm run lint; then
        warning "Linting issues found. Review before deployment."
    fi
    
    # Run tests (blocking)
    log "Running tests..."
    if ! npm run test:ci; then
        error "Tests failed. Deployment aborted."
        exit 1
    fi
    
    # Build the application
    log "Building Next.js application..."
    NODE_ENV=production npm run build
    
    # Verify build
    if [ ! -d ".next" ] || [ ! -f ".next/BUILD_ID" ]; then
        error "Build verification failed. .next directory or BUILD_ID not found."
        exit 1
    fi
    
    success "Application built successfully"
}

# Health check
health_check() {
    local url="$1"
    local max_attempts="${2:-30}"
    local attempt=1
    
    log "Performing health check on $url..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s -o /dev/null --max-time 10 "$url/api/health"; then
            success "Health check passed on attempt $attempt"
            return 0
        fi
        
        log "Health check attempt $attempt/$max_attempts failed, retrying in 5 seconds..."
        sleep 5
        ((attempt++))
    done
    
    error "Health check failed after $max_attempts attempts"
    return 1
}

# Deploy using PM2
deploy_pm2() {
    log "Deploying with PM2..."
    
    cd "$PROJECT_ROOT"
    
    # Stop existing processes
    if pm2 list | grep -q "metaads"; then
        log "Stopping existing PM2 processes..."
        pm2 stop metaads || true
        pm2 delete metaads || true
    fi
    
    # Start new process
    log "Starting new PM2 process..."
    NODE_ENV=production pm2 start ecosystem.config.js --env production
    
    # Wait for startup
    sleep 10
    
    # Health check
    if ! health_check "http://localhost:3000"; then
        error "Health check failed after PM2 deployment"
        return 1
    fi
    
    # Save PM2 configuration
    pm2 save
    
    success "PM2 deployment completed"
}

# Deploy using Docker
deploy_docker() {
    log "Deploying with Docker..."
    
    cd "$PROJECT_ROOT"
    
    # Build Docker image
    log "Building Docker image..."
    docker build -t metaads:$VERSION .
    docker tag metaads:$VERSION metaads:latest
    
    # Stop existing container
    if docker ps | grep -q "metaads-app"; then
        log "Stopping existing Docker container..."
        docker stop metaads-app || true
        docker rm metaads-app || true
    fi
    
    # Start new container
    log "Starting new Docker container..."
    docker run -d \
        --name metaads-app \
        --restart unless-stopped \
        -p 3000:3000 \
        --env-file .env \
        metaads:latest
    
    # Wait for startup
    sleep 15
    
    # Health check
    if ! health_check "http://localhost:3000"; then
        error "Health check failed after Docker deployment"
        return 1
    fi
    
    success "Docker deployment completed"
}

# Deploy using Docker Compose
deploy_docker_compose() {
    log "Deploying with Docker Compose..."
    
    cd "$PROJECT_ROOT"
    
    # Pull latest images and deploy
    log "Deploying with Docker Compose..."
    DOCKER_BUILDKIT=1 docker-compose -f docker-compose.yml build
    docker-compose -f docker-compose.yml up -d
    
    # Wait for startup
    sleep 20
    
    # Health check
    if ! health_check "http://localhost:3000"; then
        error "Health check failed after Docker Compose deployment"
        return 1
    fi
    
    success "Docker Compose deployment completed"
}

# Rollback deployment
rollback_deployment() {
    log "Rolling back deployment..."
    
    # Get latest backup
    if [ -f "$BACKUP_DIR/latest-backup" ]; then
        local backup_name=$(cat "$BACKUP_DIR/latest-backup")
        local backup_file="$BACKUP_DIR/$backup_name.tar.gz"
        
        if [ -f "$backup_file" ]; then
            log "Restoring from backup: $backup_name"
            
            # Stop current deployment
            pm2 stop metaads || docker stop metaads-app || true
            
            # Restore backup
            cd "$PROJECT_ROOT"
            rm -rf .next
            tar -xzf "$backup_file"
            
            # Restart with backup
            pm2 start ecosystem.config.js --env production || docker start metaads-app
            
            # Health check
            if health_check "http://localhost:3000"; then
                success "Rollback completed successfully"
            else
                error "Rollback failed - manual intervention required"
            fi
        else
            error "Backup file not found: $backup_file"
        fi
    else
        error "No backup reference found"
    fi
}

# Post-deployment tasks
post_deployment_tasks() {
    log "Running post-deployment tasks..."
    
    # Warm up cache
    log "Warming up application cache..."
    curl -s -o /dev/null "http://localhost:3000" || true
    curl -s -o /dev/null "http://localhost:3000/api/health" || true
    
    # Run database migrations if needed
    cd "$PROJECT_ROOT"
    if npm run --silent migrate 2>/dev/null; then
        log "Database migrations completed"
    else
        log "No migrations to run or migrations not configured"
    fi
    
    # Send deployment notification
    log "Sending deployment notification..."
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 Meta Ads Dashboard deployed to production (Version: $VERSION)\"}" \
            "$SLACK_WEBHOOK_URL" || warning "Failed to send Slack notification"
    fi
    
    # Update deployment record
    echo "{\"version\":\"$VERSION\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"success\":true}" > "$PROJECT_ROOT/deployment-info.json"
    
    success "Post-deployment tasks completed"
}

# Main deployment function
main() {
    log "Starting production deployment for Meta Ads Dashboard"
    log "Version: $VERSION"
    log "Environment: $ENVIRONMENT"
    log "Deployment log: $DEPLOYMENT_LOG"
    
    # Confirm production deployment
    echo -e "${YELLOW}⚠️  You are about to deploy to PRODUCTION${NC}"
    echo -e "${YELLOW}   Version: $VERSION${NC}"
    echo -e "${YELLOW}   Environment: $ENVIRONMENT${NC}"
    echo
    read -p "Are you sure you want to continue? (yes/NO): " -r
    if [[ ! $REPLY =~ ^yes$ ]]; then
        log "Deployment cancelled by user"
        exit 1
    fi
    
    # Run deployment steps
    pre_deployment_checks
    create_backup
    build_application
    
    # Choose deployment method
    if command -v docker-compose &> /dev/null && [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
        deploy_docker_compose
    elif command -v docker &> /dev/null && [ -f "$PROJECT_ROOT/Dockerfile" ]; then
        deploy_docker
    elif command -v pm2 &> /dev/null; then
        deploy_pm2
    else
        error "No supported deployment method found (PM2, Docker, or Docker Compose)"
        exit 1
    fi
    
    post_deployment_tasks
    
    success "🎉 Production deployment completed successfully!"
    log "Application is now running at http://localhost:3000"
    log "Deployment log saved to: $DEPLOYMENT_LOG"
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback_deployment
        ;;
    "health-check")
        health_check "http://localhost:3000"
        ;;
    "backup")
        create_backup
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|health-check|backup}"
        exit 1
        ;;
esac