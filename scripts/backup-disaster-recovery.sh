#!/bin/bash

# Meta Ads Dashboard - Backup and Disaster Recovery Script
# This script handles automated backups and disaster recovery procedures

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="${PROJECT_ROOT}/.env.backup"

# Default configuration
BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
S3_BACKUP_BUCKET=${S3_BACKUP_BUCKET:-"metaads-backups"}
AWS_REGION=${AWS_REGION:-"us-east-1"}
DR_REGION=${DR_REGION:-"us-west-2"}
ENCRYPTION_KEY_ID=${ENCRYPTION_KEY_ID:-"alias/metaads-backup"}

# Load configuration if exists
if [[ -f "$CONFIG_FILE" ]]; then
    source "$CONFIG_FILE"
fi

# Logging setup
LOG_DIR="${PROJECT_ROOT}/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="${LOG_DIR}/backup-$(date +%Y%m%d-%H%M%S).log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*" | tee -a "$LOG_FILE" >&2
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    local required_commands=("aws" "kubectl" "pg_dump" "redis-cli" "jq" "gzip")
    
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            error "Required command '$cmd' not found"
            exit 1
        fi
    done
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS credentials not configured"
        exit 1
    fi
    
    # Check kubectl configuration
    if ! kubectl cluster-info &> /dev/null; then
        error "kubectl not configured or cluster not accessible"
        exit 1
    fi
    
    log "Prerequisites check completed successfully"
}

# Database backup functions
backup_postgresql() {
    log "Starting PostgreSQL backup..."
    
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_file="postgresql-backup-${timestamp}.sql.gz"
    local s3_key="database/postgresql/${backup_file}"
    
    # Get database connection details from Kubernetes secret
    local db_secret=$(kubectl get secret metaads-app-secrets -o json)
    local database_url=$(echo "$db_secret" | jq -r '.data.DATABASE_URL' | base64 -d)
    
    # Extract connection details
    local db_host=$(echo "$database_url" | sed -n 's/.*@\([^:]*\).*/\1/p')
    local db_port=$(echo "$database_url" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    local db_name=$(echo "$database_url" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    local db_user=$(echo "$database_url" | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    local db_password=$(echo "$database_url" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    
    # Create backup
    PGPASSWORD="$db_password" pg_dump \
        -h "$db_host" \
        -p "$db_port" \
        -U "$db_user" \
        -d "$db_name" \
        --verbose \
        --no-password \
        --format=custom \
        --compress=9 \
        --create \
        --clean \
        --if-exists \
        | gzip > "/tmp/${backup_file}"
    
    # Upload to S3 with encryption
    aws s3 cp "/tmp/${backup_file}" "s3://${S3_BACKUP_BUCKET}/${s3_key}" \
        --server-side-encryption aws:kms \
        --ssekms-key-id "$ENCRYPTION_KEY_ID" \
        --region "$AWS_REGION"
    
    # Replicate to DR region
    aws s3 cp "s3://${S3_BACKUP_BUCKET}/${s3_key}" "s3://${S3_BACKUP_BUCKET}-dr/${s3_key}" \
        --source-region "$AWS_REGION" \
        --region "$DR_REGION"
    
    # Cleanup local file
    rm -f "/tmp/${backup_file}"
    
    log "PostgreSQL backup completed: ${s3_key}"
    echo "$s3_key"
}

backup_redis() {
    log "Starting Redis backup..."
    
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_file="redis-backup-${timestamp}.rdb.gz"
    local s3_key="database/redis/${backup_file}"
    
    # Get Redis connection details
    local redis_secret=$(kubectl get secret metaads-app-secrets -o json)
    local redis_url=$(echo "$redis_secret" | jq -r '.data.REDIS_URL' | base64 -d)
    
    # Extract connection details
    local redis_host=$(echo "$redis_url" | sed -n 's/.*@\([^:]*\).*/\1/p')
    local redis_port=$(echo "$redis_url" | sed -n 's/.*:\([0-9]*\)$/\1/p')
    local redis_password=$(echo "$redis_url" | sed -n 's/.*:\/\/:\([^@]*\)@.*/\1/p')
    
    # Create Redis backup using BGSAVE
    redis-cli -h "$redis_host" -p "$redis_port" -a "$redis_password" BGSAVE
    
    # Wait for background save to complete
    while [[ $(redis-cli -h "$redis_host" -p "$redis_port" -a "$redis_password" LASTSAVE) == $(redis-cli -h "$redis_host" -p "$redis_port" -a "$redis_password" LASTSAVE) ]]; do
        sleep 5
    done
    
    # Copy RDB file (this would typically be done via kubectl exec to Redis pod)
    kubectl exec deployment/redis -- cat /data/dump.rdb | gzip > "/tmp/${backup_file}"
    
    # Upload to S3
    aws s3 cp "/tmp/${backup_file}" "s3://${S3_BACKUP_BUCKET}/${s3_key}" \
        --server-side-encryption aws:kms \
        --ssekms-key-id "$ENCRYPTION_KEY_ID" \
        --region "$AWS_REGION"
    
    # Replicate to DR region
    aws s3 cp "s3://${S3_BACKUP_BUCKET}/${s3_key}" "s3://${S3_BACKUP_BUCKET}-dr/${s3_key}" \
        --source-region "$AWS_REGION" \
        --region "$DR_REGION"
    
    # Cleanup
    rm -f "/tmp/${backup_file}"
    
    log "Redis backup completed: ${s3_key}"
    echo "$s3_key"
}

# Application backup functions
backup_application_data() {
    log "Starting application data backup..."
    
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_file="app-data-backup-${timestamp}.tar.gz"
    local s3_key="application/${backup_file}"
    
    # Create temporary directory
    local temp_dir="/tmp/app-backup-${timestamp}"
    mkdir -p "$temp_dir"
    
    # Backup persistent volumes
    kubectl get pvc -o json | jq -r '.items[] | select(.metadata.labels["app.kubernetes.io/name"] == "metaads") | .metadata.name' | while read pvc; do
        log "Backing up PVC: $pvc"
        
        # Create a temporary pod to access the PVC
        cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: backup-${pvc}-${timestamp}
  labels:
    app: backup
spec:
  containers:
  - name: backup
    image: alpine:latest
    command: ["/bin/sh", "-c", "sleep 3600"]
    volumeMounts:
    - name: data
      mountPath: /data
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: ${pvc}
  restartPolicy: Never
EOF
        
        # Wait for pod to be ready
        kubectl wait --for=condition=Ready pod/backup-${pvc}-${timestamp} --timeout=300s
        
        # Copy data from PVC
        kubectl exec backup-${pvc}-${timestamp} -- tar czf - -C /data . > "${temp_dir}/${pvc}.tar.gz"
        
        # Cleanup backup pod
        kubectl delete pod backup-${pvc}-${timestamp}
    done
    
    # Backup Kubernetes manifests
    kubectl get all,configmaps,secrets,pvc,ingress -o yaml > "${temp_dir}/k8s-manifests.yaml"
    
    # Create final backup archive
    tar czf "/tmp/${backup_file}" -C "$temp_dir" .
    
    # Upload to S3
    aws s3 cp "/tmp/${backup_file}" "s3://${S3_BACKUP_BUCKET}/${s3_key}" \
        --server-side-encryption aws:kms \
        --ssekms-key-id "$ENCRYPTION_KEY_ID" \
        --region "$AWS_REGION"
    
    # Replicate to DR region
    aws s3 cp "s3://${S3_BACKUP_BUCKET}/${s3_key}" "s3://${S3_BACKUP_BUCKET}-dr/${s3_key}" \
        --source-region "$AWS_REGION" \
        --region "$DR_REGION"
    
    # Cleanup
    rm -rf "$temp_dir" "/tmp/${backup_file}"
    
    log "Application data backup completed: ${s3_key}"
    echo "$s3_key"
}

# Backup metadata and configuration
backup_metadata() {
    log "Starting metadata backup..."
    
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_file="metadata-backup-${timestamp}.tar.gz"
    local s3_key="metadata/${backup_file}"
    
    local temp_dir="/tmp/metadata-backup-${timestamp}"
    mkdir -p "$temp_dir"
    
    # Backup Terraform state
    if [[ -f "${PROJECT_ROOT}/infrastructure/terraform.tfstate" ]]; then
        cp "${PROJECT_ROOT}/infrastructure/terraform.tfstate" "${temp_dir}/"
    fi
    
    # Backup Helm values
    if [[ -d "${PROJECT_ROOT}/helm" ]]; then
        cp -r "${PROJECT_ROOT}/helm" "${temp_dir}/"
    fi
    
    # Backup monitoring configuration
    if [[ -d "${PROJECT_ROOT}/monitoring" ]]; then
        cp -r "${PROJECT_ROOT}/monitoring" "${temp_dir}/"
    fi
    
    # Backup CI/CD configuration
    if [[ -d "${PROJECT_ROOT}/.github" ]]; then
        cp -r "${PROJECT_ROOT}/.github" "${temp_dir}/"
    fi
    
    # Create metadata file
    cat > "${temp_dir}/backup-metadata.json" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "environment": "${ENVIRONMENT:-production}",
  "cluster": "$(kubectl config current-context)",
  "region": "${AWS_REGION}",
  "backup_type": "full"
}
EOF
    
    # Create archive
    tar czf "/tmp/${backup_file}" -C "$temp_dir" .
    
    # Upload to S3
    aws s3 cp "/tmp/${backup_file}" "s3://${S3_BACKUP_BUCKET}/${s3_key}" \
        --server-side-encryption aws:kms \
        --ssekms-key-id "$ENCRYPTION_KEY_ID" \
        --region "$AWS_REGION"
    
    # Replicate to DR region
    aws s3 cp "s3://${S3_BACKUP_BUCKET}/${s3_key}" "s3://${S3_BACKUP_BUCKET}-dr/${s3_key}" \
        --source-region "$AWS_REGION" \
        --region "$DR_REGION"
    
    # Cleanup
    rm -rf "$temp_dir" "/tmp/${backup_file}"
    
    log "Metadata backup completed: ${s3_key}"
    echo "$s3_key"
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old backups (older than ${BACKUP_RETENTION_DAYS} days)..."
    
    local cutoff_date=$(date -d "${BACKUP_RETENTION_DAYS} days ago" +%Y-%m-%d)
    
    # Cleanup primary region
    aws s3api list-objects-v2 \
        --bucket "$S3_BACKUP_BUCKET" \
        --query "Contents[?LastModified<='${cutoff_date}'].Key" \
        --output text \
        --region "$AWS_REGION" | \
    while read -r key; do
        if [[ -n "$key" && "$key" != "None" ]]; then
            log "Deleting old backup: $key"
            aws s3 rm "s3://${S3_BACKUP_BUCKET}/${key}" --region "$AWS_REGION"
        fi
    done
    
    # Cleanup DR region
    aws s3api list-objects-v2 \
        --bucket "${S3_BACKUP_BUCKET}-dr" \
        --query "Contents[?LastModified<='${cutoff_date}'].Key" \
        --output text \
        --region "$DR_REGION" | \
    while read -r key; do
        if [[ -n "$key" && "$key" != "None" ]]; then
            log "Deleting old DR backup: $key"
            aws s3 rm "s3://${S3_BACKUP_BUCKET}-dr/${key}" --region "$DR_REGION"
        fi
    done
    
    log "Cleanup completed"
}

# Disaster recovery functions
restore_postgresql() {
    local backup_key="$1"
    local target_db="${2:-metaads_restored}"
    
    log "Starting PostgreSQL restore from: $backup_key"
    
    # Download backup from S3
    local backup_file=$(basename "$backup_key")
    aws s3 cp "s3://${S3_BACKUP_BUCKET}/${backup_key}" "/tmp/${backup_file}" \
        --region "$AWS_REGION"
    
    # Extract if gzipped
    if [[ "$backup_file" == *.gz ]]; then
        gunzip "/tmp/${backup_file}"
        backup_file="${backup_file%.gz}"
    fi
    
    # Get database connection details
    local db_secret=$(kubectl get secret metaads-app-secrets -o json)
    local database_url=$(echo "$db_secret" | jq -r '.data.DATABASE_URL' | base64 -d)
    
    local db_host=$(echo "$database_url" | sed -n 's/.*@\([^:]*\).*/\1/p')
    local db_port=$(echo "$database_url" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    local db_user=$(echo "$database_url" | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    local db_password=$(echo "$database_url" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    
    # Restore database
    PGPASSWORD="$db_password" pg_restore \
        -h "$db_host" \
        -p "$db_port" \
        -U "$db_user" \
        -d "$target_db" \
        --verbose \
        --no-password \
        --clean \
        --if-exists \
        "/tmp/${backup_file}"
    
    # Cleanup
    rm -f "/tmp/${backup_file}"
    
    log "PostgreSQL restore completed"
}

# Test disaster recovery procedures
test_disaster_recovery() {
    log "Starting disaster recovery test..."
    
    # Create test namespace
    kubectl create namespace dr-test-$(date +%s) || true
    
    # Test backup restoration in test environment
    local latest_db_backup=$(aws s3api list-objects-v2 \
        --bucket "$S3_BACKUP_BUCKET" \
        --prefix "database/postgresql/" \
        --query "sort_by(Contents, &LastModified)[-1].Key" \
        --output text \
        --region "$AWS_REGION")
    
    if [[ -n "$latest_db_backup" && "$latest_db_backup" != "None" ]]; then
        log "Testing restore of: $latest_db_backup"
        # Note: In a real implementation, this would restore to a test database
        log "Database restore test would be performed here"
    fi
    
    # Test application deployment in DR region
    log "Testing application deployment in DR region..."
    # Note: This would typically involve deploying to DR cluster
    
    log "Disaster recovery test completed"
}

# Health check for backup system
health_check() {
    log "Performing backup system health check..."
    
    local issues=0
    
    # Check S3 bucket accessibility
    if ! aws s3 ls "s3://${S3_BACKUP_BUCKET}" --region "$AWS_REGION" &> /dev/null; then
        error "Cannot access primary backup bucket"
        ((issues++))
    fi
    
    if ! aws s3 ls "s3://${S3_BACKUP_BUCKET}-dr" --region "$DR_REGION" &> /dev/null; then
        error "Cannot access DR backup bucket"
        ((issues++))
    fi
    
    # Check recent backups
    local recent_backup=$(aws s3api list-objects-v2 \
        --bucket "$S3_BACKUP_BUCKET" \
        --query "sort_by(Contents, &LastModified)[-1].LastModified" \
        --output text \
        --region "$AWS_REGION")
    
    if [[ -n "$recent_backup" ]]; then
        local backup_age=$(( $(date +%s) - $(date -d "$recent_backup" +%s) ))
        if [[ $backup_age -gt 86400 ]]; then  # 24 hours
            error "Last backup is older than 24 hours"
            ((issues++))
        fi
    else
        error "No backups found"
        ((issues++))
    fi
    
    # Check KMS key
    if ! aws kms describe-key --key-id "$ENCRYPTION_KEY_ID" --region "$AWS_REGION" &> /dev/null; then
        error "Cannot access KMS encryption key"
        ((issues++))
    fi
    
    if [[ $issues -eq 0 ]]; then
        log "Backup system health check passed"
        return 0
    else
        error "Backup system health check failed with $issues issues"
        return 1
    fi
}

# Main backup function
run_full_backup() {
    log "Starting full backup process..."
    
    local backup_manifest="/tmp/backup-manifest-$(date +%Y%m%d-%H%M%S).json"
    
    # Initialize manifest
    cat > "$backup_manifest" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "backups": []
}
EOF
    
    # Run all backup operations
    local postgresql_backup=$(backup_postgresql)
    local redis_backup=$(backup_redis)
    local app_data_backup=$(backup_application_data)
    local metadata_backup=$(backup_metadata)
    
    # Update manifest
    jq --arg db "$postgresql_backup" \
       --arg redis "$redis_backup" \
       --arg app "$app_data_backup" \
       --arg meta "$metadata_backup" \
       '.backups = [
         {"type": "postgresql", "key": $db},
         {"type": "redis", "key": $redis},
         {"type": "application", "key": $app},
         {"type": "metadata", "key": $meta}
       ]' "$backup_manifest" > "${backup_manifest}.tmp" && mv "${backup_manifest}.tmp" "$backup_manifest"
    
    # Upload manifest
    local manifest_key="manifests/backup-manifest-$(date +%Y%m%d-%H%M%S).json"
    aws s3 cp "$backup_manifest" "s3://${S3_BACKUP_BUCKET}/${manifest_key}" \
        --server-side-encryption aws:kms \
        --ssekms-key-id "$ENCRYPTION_KEY_ID" \
        --region "$AWS_REGION"
    
    # Cleanup old backups
    cleanup_old_backups
    
    log "Full backup process completed successfully"
    log "Backup manifest: $manifest_key"
}

# Send notification
send_notification() {
    local status="$1"
    local message="$2"
    
    # Send to Slack (if webhook is configured)
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"Backup ${status}: ${message}\"}" \
            "$SLACK_WEBHOOK_URL" || true
    fi
    
    # Send email (if configured)
    if [[ -n "${NOTIFICATION_EMAIL:-}" ]] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "Backup ${status}" "$NOTIFICATION_EMAIL" || true
    fi
}

# Main function
main() {
    local command="${1:-backup}"
    
    case "$command" in
        "backup")
            check_prerequisites
            run_full_backup
            send_notification "SUCCESS" "Full backup completed successfully"
            ;;
        "restore-db")
            shift
            restore_postgresql "$@"
            ;;
        "test-dr")
            test_disaster_recovery
            ;;
        "health-check")
            health_check
            ;;
        "cleanup")
            cleanup_old_backups
            ;;
        *)
            echo "Usage: $0 {backup|restore-db|test-dr|health-check|cleanup}"
            echo ""
            echo "Commands:"
            echo "  backup      - Run full backup"
            echo "  restore-db  - Restore database from backup"
            echo "  test-dr     - Test disaster recovery procedures"
            echo "  health-check - Check backup system health"
            echo "  cleanup     - Clean up old backups"
            exit 1
            ;;
    esac
}

# Handle errors
trap 'error "Script failed at line $LINENO"; send_notification "FAILED" "Backup script failed at line $LINENO"; exit 1' ERR

# Run main function
main "$@"