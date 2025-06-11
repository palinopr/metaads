#!/bin/bash

# Meta Ads Dashboard - Enterprise Deployment Script
# Comprehensive deployment orchestration for all environments

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="${PROJECT_ROOT}/.env.deploy"

# Default values
ENVIRONMENT=${ENVIRONMENT:-staging}
DEPLOYMENT_STRATEGY=${DEPLOYMENT_STRATEGY:-rolling}
SKIP_TESTS=${SKIP_TESTS:-false}
SKIP_SECURITY_SCAN=${SKIP_SECURITY_SCAN:-false}
DRY_RUN=${DRY_RUN:-false}
VERBOSE=${VERBOSE:-false}

# Load environment configuration
if [[ -f "$CONFIG_FILE" ]]; then
    source "$CONFIG_FILE"
fi

# Logging setup
setup_logging() {
    local log_dir="${PROJECT_ROOT}/logs/deployment"
    mkdir -p "$log_dir"
    
    LOG_FILE="${log_dir}/deploy-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).log"
    
    if [[ "$VERBOSE" == "true" ]]; then
        exec > >(tee -a "$LOG_FILE")
        exec 2> >(tee -a "$LOG_FILE" >&2)
    else
        exec > >(tee -a "$LOG_FILE" > /dev/null)
        exec 2> >(tee -a "$LOG_FILE" >&2)
    fi
}

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2
}

success() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $*"
}

warning() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  $*"
}

# Banner
show_banner() {
    cat << 'EOF'
╔══════════════════════════════════════════════════════════════╗
║                  Meta Ads Dashboard                         ║
║              Enterprise Deployment System                   ║
║                                                              ║
║  🚀 DevOps & CI/CD Pipeline Agent                          ║
║  🔧 Automated Deployment Orchestration                     ║
║  🛡️  Enterprise Security & Compliance                      ║
║  📊 Comprehensive Monitoring & Alerting                    ║
╚══════════════════════════════════════════════════════════════╝
EOF
}

# Prerequisites check
check_prerequisites() {
    log "Checking deployment prerequisites..."
    
    local required_commands=(
        "kubectl" "helm" "docker" "aws" "jq" "yq" 
        "node" "npm" "git" "curl" "openssl"
    )
    
    local missing_commands=()
    
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_commands+=("$cmd")
        fi
    done
    
    if [[ ${#missing_commands[@]} -gt 0 ]]; then
        error "Missing required commands: ${missing_commands[*]}"
        exit 1
    fi
    
    # Check environment variables
    local required_vars=()
    
    case "$ENVIRONMENT" in
        "production")
            required_vars=(
                "AWS_ACCESS_KEY_ID" "AWS_SECRET_ACCESS_KEY" 
                "KUBE_CONFIG_DATA" "HELM_CHART_VERSION"
            )
            ;;
        "staging")
            required_vars=("AWS_ACCESS_KEY_ID" "AWS_SECRET_ACCESS_KEY")
            ;;
    esac
    
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        warning "Missing environment variables: ${missing_vars[*]}"
        log "Some features may not work correctly"
    fi
    
    # Check cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    # Check Helm
    if ! helm version &> /dev/null; then
        error "Helm is not properly configured"
        exit 1
    fi
    
    success "Prerequisites check completed"
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."
    
    # Git status check
    if [[ "$ENVIRONMENT" == "production" ]] && git status --porcelain 2>/dev/null | grep -q .; then
        error "Working directory is not clean. Commit or stash changes before production deployment."
        exit 1
    fi
    
    # Resource availability check
    local node_count=$(kubectl get nodes --no-headers | wc -l)
    if [[ $node_count -lt 2 ]] && [[ "$ENVIRONMENT" == "production" ]]; then
        error "Insufficient nodes for production deployment (minimum 2 required)"
        exit 1
    fi
    
    # Namespace check
    if ! kubectl get namespace "$ENVIRONMENT" &> /dev/null; then
        log "Creating namespace: $ENVIRONMENT"
        if [[ "$DRY_RUN" != "true" ]]; then
            kubectl create namespace "$ENVIRONMENT"
        fi
    fi
    
    # Check existing deployment
    if kubectl get deployment "metaads-$ENVIRONMENT" -n "$ENVIRONMENT" &> /dev/null; then
        log "Existing deployment found"
        
        # Health check
        if ! kubectl rollout status deployment/metaads-$ENVIRONMENT -n "$ENVIRONMENT" --timeout=60s; then
            warning "Existing deployment is not healthy"
        fi
    fi
    
    success "Pre-deployment checks completed"
}

# Security scans
run_security_scans() {
    if [[ "$SKIP_SECURITY_SCAN" == "true" ]]; then
        warning "Skipping security scans (SKIP_SECURITY_SCAN=true)"
        return 0
    fi
    
    log "Running security scans..."
    
    # Container image security scan
    if command -v trivy &> /dev/null; then
        log "Running Trivy container scan..."
        local image_tag="${DOCKER_REGISTRY:-ghcr.io}/metaads/dashboard:${ENVIRONMENT}"
        
        if [[ "$DRY_RUN" != "true" ]]; then
            trivy image --severity HIGH,CRITICAL "$image_tag" || {
                error "Container security scan failed"
                return 1
            }
        fi
    fi
    
    # Kubernetes manifest security scan
    if command -v kubesec &> /dev/null; then
        log "Running Kubesec scan..."
        
        local temp_manifest="/tmp/k8s-manifest-${ENVIRONMENT}.yaml"
        helm template metaads ./helm/metaads \
            --values "./helm/values-${ENVIRONMENT}.yaml" \
            --namespace "$ENVIRONMENT" > "$temp_manifest"
        
        if [[ "$DRY_RUN" != "true" ]]; then
            kubesec scan "$temp_manifest" || {
                warning "Kubernetes manifest security scan found issues"
            }
        fi
        
        rm -f "$temp_manifest"
    fi
    
    # Infrastructure security check
    if [[ -d "${PROJECT_ROOT}/infrastructure" ]] && command -v checkov &> /dev/null; then
        log "Running Checkov infrastructure scan..."
        
        if [[ "$DRY_RUN" != "true" ]]; then
            checkov -d "${PROJECT_ROOT}/infrastructure" --framework terraform || {
                warning "Infrastructure security scan found issues"
            }
        fi
    fi
    
    success "Security scans completed"
}

# Build and test
build_and_test() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        warning "Skipping tests (SKIP_TESTS=true)"
        return 0
    fi
    
    log "Building and testing application..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies
    log "Installing dependencies..."
    if [[ "$DRY_RUN" != "true" ]]; then
        npm ci
    fi
    
    # Run linting
    log "Running linter..."
    if [[ "$DRY_RUN" != "true" ]]; then
        npm run lint
    fi
    
    # Run tests
    log "Running test suite..."
    if [[ "$DRY_RUN" != "true" ]]; then
        npm run test:ci
        npm run test:e2e
    fi
    
    # Build application
    log "Building application..."
    if [[ "$DRY_RUN" != "true" ]]; then
        npm run build
    fi
    
    success "Build and test completed"
}

# Container build and push
build_and_push_container() {
    log "Building and pushing container image..."
    
    local image_tag="${DOCKER_REGISTRY:-ghcr.io}/metaads/dashboard"
    local build_tag="${image_tag}:${ENVIRONMENT}-$(git rev-parse --short HEAD)"
    local latest_tag="${image_tag}:${ENVIRONMENT}"
    
    if [[ "$DRY_RUN" != "true" ]]; then
        # Build with build args
        docker build \
            --build-arg BUILD_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
            --build-arg VCS_REF="$(git rev-parse HEAD)" \
            --build-arg VERSION="$ENVIRONMENT" \
            --tag "$build_tag" \
            --tag "$latest_tag" \
            "$PROJECT_ROOT"
        
        # Push images
        docker push "$build_tag"
        docker push "$latest_tag"
        
        # Security scan the built image
        if command -v trivy &> /dev/null; then
            trivy image "$build_tag"
        fi
    fi
    
    success "Container build and push completed"
    log "Image: $build_tag"
}

# Deploy infrastructure
deploy_infrastructure() {
    if [[ ! -d "${PROJECT_ROOT}/infrastructure" ]]; then
        log "No infrastructure directory found, skipping infrastructure deployment"
        return 0
    fi
    
    log "Deploying infrastructure with Terraform..."
    
    cd "${PROJECT_ROOT}/infrastructure"
    
    if [[ "$DRY_RUN" != "true" ]]; then
        # Initialize Terraform
        terraform init -upgrade
        
        # Plan deployment
        terraform plan \
            -var="environment=$ENVIRONMENT" \
            -var-file="environments/${ENVIRONMENT}.tfvars" \
            -out="tfplan"
        
        # Apply if not dry run
        if [[ "$ENVIRONMENT" == "production" ]]; then
            read -p "Apply Terraform changes to production? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                error "Production deployment cancelled by user"
                exit 1
            fi
        fi
        
        terraform apply "tfplan"
        
        # Output important values
        terraform output -json > "${PROJECT_ROOT}/infrastructure-outputs.json"
    fi
    
    cd "$PROJECT_ROOT"
    success "Infrastructure deployment completed"
}

# Deploy application
deploy_application() {
    log "Deploying application with Helm..."
    
    local release_name="metaads-$ENVIRONMENT"
    local chart_path="${PROJECT_ROOT}/helm/metaads"
    local values_file="${PROJECT_ROOT}/helm/values-${ENVIRONMENT}.yaml"
    
    # Validate Helm chart
    if [[ "$DRY_RUN" != "true" ]]; then
        helm lint "$chart_path" -f "$values_file"
    fi
    
    # Prepare Helm command
    local helm_cmd=(
        helm upgrade --install "$release_name" "$chart_path"
        --namespace "$ENVIRONMENT"
        --create-namespace
        --values "$values_file"
        --set "image.tag=${ENVIRONMENT}-$(git rev-parse --short HEAD)"
        --set "app.version=$(git rev-parse HEAD)"
        --timeout 600s
        --wait
    )
    
    # Add environment-specific configurations
    case "$ENVIRONMENT" in
        "production")
            helm_cmd+=(
                --set "deployment.replicaCount=5"
                --set "autoscaling.minReplicas=5"
                --set "autoscaling.maxReplicas=25"
            )
            ;;
        "staging")
            helm_cmd+=(
                --set "deployment.replicaCount=2"
                --set "autoscaling.minReplicas=2"
                --set "autoscaling.maxReplicas=8"
            )
            ;;
    esac
    
    # Execute deployment based on strategy
    case "$DEPLOYMENT_STRATEGY" in
        "blue-green")
            deploy_blue_green "${helm_cmd[@]}"
            ;;
        "canary")
            deploy_canary "${helm_cmd[@]}"
            ;;
        "rolling"|*)
            deploy_rolling "${helm_cmd[@]}"
            ;;
    esac
    
    success "Application deployment completed"
}

# Rolling deployment
deploy_rolling() {
    local helm_cmd=("$@")
    
    log "Executing rolling deployment..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: ${helm_cmd[*]} --dry-run"
        return 0
    fi
    
    "${helm_cmd[@]}"
    
    # Wait for rollout
    kubectl rollout status deployment/"metaads-$ENVIRONMENT" -n "$ENVIRONMENT" --timeout=600s
}

# Blue-green deployment
deploy_blue_green() {
    local helm_cmd=("$@")
    
    log "Executing blue-green deployment..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Blue-green deployment simulation"
        return 0
    fi
    
    # Deploy green environment
    local green_release="metaads-${ENVIRONMENT}-green"
    local green_cmd=("${helm_cmd[@]}")
    green_cmd[2]="$green_release"  # Replace release name
    
    "${green_cmd[@]}" --set "service.name=metaads-green"
    
    # Wait for green deployment
    kubectl rollout status deployment/"$green_release" -n "$ENVIRONMENT" --timeout=600s
    
    # Run health checks on green
    local green_endpoint=$(kubectl get service metaads-green -n "$ENVIRONMENT" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    if [[ -n "$green_endpoint" ]]; then
        log "Running health checks on green deployment..."
        for i in {1..30}; do
            if curl -f "http://${green_endpoint}/api/health" &> /dev/null; then
                success "Green deployment health check passed"
                break
            fi
            if [[ $i -eq 30 ]]; then
                error "Green deployment health check failed"
                return 1
            fi
            sleep 10
        done
    fi
    
    # Switch traffic to green
    log "Switching traffic to green deployment..."
    kubectl patch service "metaads-$ENVIRONMENT" -n "$ENVIRONMENT" \
        -p '{"spec":{"selector":{"app.kubernetes.io/instance":"'$green_release'"}}}'
    
    # Clean up blue deployment after successful switch
    local blue_release="metaads-${ENVIRONMENT}-blue"
    if helm list -n "$ENVIRONMENT" | grep -q "$blue_release"; then
        log "Cleaning up blue deployment..."
        helm uninstall "$blue_release" -n "$ENVIRONMENT" || true
    fi
    
    # Rename green to blue for next deployment
    helm upgrade "$blue_release" "$green_release" -n "$ENVIRONMENT" --reuse-values || true
    helm uninstall "$green_release" -n "$ENVIRONMENT" || true
}

# Canary deployment
deploy_canary() {
    local helm_cmd=("$@")
    
    log "Executing canary deployment..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Canary deployment simulation"
        return 0
    fi
    
    # Deploy canary with 10% traffic
    local canary_release="metaads-${ENVIRONMENT}-canary"
    local canary_cmd=("${helm_cmd[@]}")
    canary_cmd[2]="$canary_release"
    
    "${canary_cmd[@]}" \
        --set "deployment.replicaCount=1" \
        --set "service.name=metaads-canary" \
        --set "ingress.annotations.nginx\.ingress\.kubernetes\.io/canary=true" \
        --set "ingress.annotations.nginx\.ingress\.kubernetes\.io/canary-weight=10"
    
    # Wait for canary deployment
    kubectl rollout status deployment/"$canary_release" -n "$ENVIRONMENT" --timeout=600s
    
    # Monitor canary for 5 minutes
    log "Monitoring canary deployment for 5 minutes..."
    sleep 300
    
    # Check canary metrics (simplified check)
    local error_rate=$(kubectl logs deployment/"$canary_release" -n "$ENVIRONMENT" --tail=1000 | grep -c "ERROR" || echo "0")
    if [[ $error_rate -gt 10 ]]; then
        error "Canary deployment has high error rate, rolling back..."
        helm uninstall "$canary_release" -n "$ENVIRONMENT"
        return 1
    fi
    
    # Promote canary to full deployment
    log "Promoting canary to full deployment..."
    kubectl patch ingress "metaads-$ENVIRONMENT" -n "$ENVIRONMENT" \
        --type=json -p='[{"op": "remove", "path": "/metadata/annotations/nginx.ingress.kubernetes.io~1canary"}]'
    
    # Scale up main deployment with new version
    "${helm_cmd[@]}"
    
    # Clean up canary
    helm uninstall "$canary_release" -n "$ENVIRONMENT" || true
}

# Post-deployment validation
post_deployment_validation() {
    log "Running post-deployment validation..."
    
    # Check deployment status
    kubectl rollout status deployment/"metaads-$ENVIRONMENT" -n "$ENVIRONMENT" --timeout=300s
    
    # Check pod health
    local ready_pods=$(kubectl get deployment "metaads-$ENVIRONMENT" -n "$ENVIRONMENT" -o jsonpath='{.status.readyReplicas}')
    local desired_pods=$(kubectl get deployment "metaads-$ENVIRONMENT" -n "$ENVIRONMENT" -o jsonpath='{.status.replicas}')
    
    if [[ "$ready_pods" != "$desired_pods" ]]; then
        error "Not all pods are ready ($ready_pods/$desired_pods)"
        return 1
    fi
    
    # Health check endpoint
    local service_ip=$(kubectl get service "metaads-$ENVIRONMENT" -n "$ENVIRONMENT" -o jsonpath='{.spec.clusterIP}')
    if [[ -n "$service_ip" ]]; then
        log "Running health check against service..."
        
        if [[ "$DRY_RUN" != "true" ]]; then
            kubectl run health-check-${RANDOM} \
                --image=curlimages/curl:latest \
                --rm -i --restart=Never \
                --timeout=60s \
                -- curl -f "http://${service_ip}/api/health" || {
                error "Health check failed"
                return 1
            }
        fi
    fi
    
    # Run smoke tests
    if [[ -f "${PROJECT_ROOT}/scripts/smoke-tests.sh" ]] && [[ "$SKIP_TESTS" != "true" ]]; then
        log "Running smoke tests..."
        if [[ "$DRY_RUN" != "true" ]]; then
            bash "${PROJECT_ROOT}/scripts/smoke-tests.sh" "$ENVIRONMENT"
        fi
    fi
    
    success "Post-deployment validation completed"
}

# Backup before deployment
backup_before_deployment() {
    if [[ "$ENVIRONMENT" == "production" ]] && [[ -f "${PROJECT_ROOT}/scripts/backup-disaster-recovery.sh" ]]; then
        log "Creating backup before production deployment..."
        
        if [[ "$DRY_RUN" != "true" ]]; then
            bash "${PROJECT_ROOT}/scripts/backup-disaster-recovery.sh" backup
        fi
        
        success "Pre-deployment backup completed"
    fi
}

# Feature flag deployment
deploy_feature_flags() {
    if [[ -f "${PROJECT_ROOT}/scripts/feature-flag-manager.ts" ]]; then
        log "Deploying feature flags for $ENVIRONMENT..."
        
        if [[ "$DRY_RUN" != "true" ]]; then
            cd "$PROJECT_ROOT"
            npx ts-node scripts/feature-flag-manager.ts export "$ENVIRONMENT" > "/tmp/feature-flags-${ENVIRONMENT}.json"
            
            # Deploy as ConfigMap
            kubectl create configmap "feature-flags-$ENVIRONMENT" \
                --from-file="/tmp/feature-flags-${ENVIRONMENT}.json" \
                --namespace "$ENVIRONMENT" \
                --dry-run=client -o yaml | kubectl apply -f -
                
            rm -f "/tmp/feature-flags-${ENVIRONMENT}.json"
        fi
        
        success "Feature flags deployed"
    fi
}

# Monitoring setup
setup_monitoring() {
    if [[ -d "${PROJECT_ROOT}/monitoring" ]]; then
        log "Setting up monitoring and alerting..."
        
        if [[ "$DRY_RUN" != "true" ]]; then
            # Deploy Prometheus rules
            if [[ -f "${PROJECT_ROOT}/monitoring/alerting-rules.yml" ]]; then
                kubectl apply -f "${PROJECT_ROOT}/monitoring/alerting-rules.yml" -n monitoring
            fi
            
            # Deploy Grafana dashboards
            if [[ -d "${PROJECT_ROOT}/monitoring/grafana" ]]; then
                kubectl apply -f "${PROJECT_ROOT}/monitoring/grafana/" -n monitoring
            fi
        fi
        
        success "Monitoring setup completed"
    fi
}

# Notification
send_notification() {
    local status="$1"
    local message="$2"
    
    # Slack notification
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local color="good"
        if [[ "$status" == "FAILED" ]]; then
            color="danger"
        elif [[ "$status" == "WARNING" ]]; then
            color="warning"
        fi
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"Deployment $status\",
                    \"text\": \"$message\",
                    \"fields\": [
                        {\"title\": \"Environment\", \"value\": \"$ENVIRONMENT\", \"short\": true},
                        {\"title\": \"Strategy\", \"value\": \"$DEPLOYMENT_STRATEGY\", \"short\": true},
                        {\"title\": \"Commit\", \"value\": \"$(git rev-parse --short HEAD)\", \"short\": true}
                    ]
                }]
            }" \
            "$SLACK_WEBHOOK_URL" &> /dev/null || true
    fi
    
    # Email notification (if configured)
    if [[ -n "${NOTIFICATION_EMAIL:-}" ]] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "Deployment $status - $ENVIRONMENT" "$NOTIFICATION_EMAIL" &> /dev/null || true
    fi
}

# Rollback function
rollback_deployment() {
    local revision="${1:-}"
    
    log "Rolling back deployment..."
    
    if [[ -n "$revision" ]]; then
        kubectl rollout undo deployment/"metaads-$ENVIRONMENT" -n "$ENVIRONMENT" --to-revision="$revision"
    else
        kubectl rollout undo deployment/"metaads-$ENVIRONMENT" -n "$ENVIRONMENT"
    fi
    
    kubectl rollout status deployment/"metaads-$ENVIRONMENT" -n "$ENVIRONMENT" --timeout=300s
    
    success "Rollback completed"
}

# Cleanup
cleanup() {
    log "Cleaning up temporary files..."
    
    # Remove temporary files
    rm -f /tmp/k8s-manifest-*.yaml
    rm -f /tmp/feature-flags-*.json
    
    # Clean up old images
    if command -v docker &> /dev/null; then
        docker image prune -f || true
    fi
}

# Main deployment workflow
main() {
    local command="${1:-deploy}"
    
    setup_logging
    show_banner
    
    case "$command" in
        "deploy")
            log "Starting deployment to $ENVIRONMENT using $DEPLOYMENT_STRATEGY strategy"
            
            check_prerequisites
            pre_deployment_checks
            run_security_scans
            backup_before_deployment
            build_and_test
            build_and_push_container
            deploy_infrastructure
            deploy_feature_flags
            deploy_application
            post_deployment_validation
            setup_monitoring
            
            success "Deployment completed successfully!"
            send_notification "SUCCESS" "Deployment to $ENVIRONMENT completed successfully"
            ;;
            
        "rollback")
            rollback_deployment "$2"
            ;;
            
        "status")
            kubectl get all -n "$ENVIRONMENT"
            ;;
            
        "logs")
            kubectl logs -f deployment/"metaads-$ENVIRONMENT" -n "$ENVIRONMENT"
            ;;
            
        "test")
            post_deployment_validation
            ;;
            
        *)
            echo "Usage: $0 {deploy|rollback|status|logs|test}"
            echo ""
            echo "Commands:"
            echo "  deploy          - Deploy application"
            echo "  rollback [rev]  - Rollback deployment"
            echo "  status          - Show deployment status"
            echo "  logs            - Show application logs"
            echo "  test            - Run post-deployment tests"
            echo ""
            echo "Environment variables:"
            echo "  ENVIRONMENT           - Target environment (staging|production)"
            echo "  DEPLOYMENT_STRATEGY   - Deployment strategy (rolling|blue-green|canary)"
            echo "  SKIP_TESTS           - Skip tests (true|false)"
            echo "  SKIP_SECURITY_SCAN   - Skip security scans (true|false)"
            echo "  DRY_RUN              - Dry run mode (true|false)"
            echo "  VERBOSE              - Verbose logging (true|false)"
            exit 1
            ;;
    esac
}

# Error handling
trap 'error "Deployment failed at line $LINENO"; send_notification "FAILED" "Deployment to $ENVIRONMENT failed"; cleanup; exit 1' ERR
trap 'cleanup' EXIT

# Run main function
main "$@"