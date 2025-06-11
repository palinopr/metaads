# Variables for Meta Ads Dashboard Infrastructure

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "metaads"
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

# EKS Configuration
variable "kubernetes_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.28"
}

variable "node_instance_types" {
  description = "Instance types for EKS node groups"
  type        = list(string)
  default     = ["t3.large", "t3.xlarge"]
}

variable "spot_instance_types" {
  description = "Instance types for spot node groups"
  type        = list(string)
  default     = ["t3.medium", "t3.large", "t3.xlarge"]
}

variable "node_group_min_size" {
  description = "Minimum size of node group"
  type        = number
  default     = 1
}

variable "node_group_max_size" {
  description = "Maximum size of node group"
  type        = number
  default     = 10
}

variable "node_group_desired_size" {
  description = "Desired size of node group"
  type        = number
  default     = 3
}

# RDS Configuration
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
  validation {
    condition     = can(regex("^db\\.", var.db_instance_class))
    error_message = "DB instance class must start with 'db.'."
  }
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS instance (GB)"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage for RDS instance (GB)"
  type        = number
  default     = 100
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "metaads"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "metaads_user"
}

variable "db_backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

# Redis Configuration
variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes in the Redis cluster"
  type        = number
  default     = 1
}

# Domain and SSL
variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "metaads.com"
}

variable "create_route53_zone" {
  description = "Whether to create Route53 hosted zone"
  type        = bool
  default     = false
}

# Logging
variable "log_retention_days" {
  description = "Log retention period in days"
  type        = number
  default     = 7
}

# Secrets
variable "meta_app_secret" {
  description = "Meta App Secret"
  type        = string
  sensitive   = true
}

variable "claude_api_key" {
  description = "Claude API Key"
  type        = string
  sensitive   = true
}

variable "nextauth_secret" {
  description = "NextAuth Secret"
  type        = string
  sensitive   = true
}

# Environment-specific variables
variable "environment_configs" {
  description = "Environment-specific configurations"
  type = map(object({
    node_group_desired_size = number
    node_group_max_size     = number
    db_instance_class       = string
    redis_node_type         = string
    log_retention_days      = number
  }))
  
  default = {
    dev = {
      node_group_desired_size = 1
      node_group_max_size     = 3
      db_instance_class       = "db.t3.micro"
      redis_node_type         = "cache.t3.micro"
      log_retention_days      = 3
    }
    staging = {
      node_group_desired_size = 2
      node_group_max_size     = 5
      db_instance_class       = "db.t3.small"
      redis_node_type         = "cache.t3.small"
      log_retention_days      = 7
    }
    production = {
      node_group_desired_size = 3
      node_group_max_size     = 10
      db_instance_class       = "db.t3.medium"
      redis_node_type         = "cache.t3.medium"
      log_retention_days      = 30
    }
  }
}

# Monitoring and Alerting
variable "enable_monitoring" {
  description = "Enable monitoring stack (Prometheus, Grafana)"
  type        = bool
  default     = true
}

variable "enable_logging" {
  description = "Enable centralized logging (Fluentd, CloudWatch)"
  type        = bool
  default     = true
}

variable "enable_tracing" {
  description = "Enable distributed tracing (Jaeger)"
  type        = bool
  default     = false
}

# Security
variable "enable_network_policy" {
  description = "Enable Kubernetes network policies"
  type        = bool
  default     = true
}

variable "enable_pod_security_policy" {
  description = "Enable Kubernetes pod security policies"
  type        = bool
  default     = true
}

variable "enable_secrets_encryption" {
  description = "Enable secrets encryption at rest"
  type        = bool
  default     = true
}

# Backup and Disaster Recovery
variable "enable_automated_backups" {
  description = "Enable automated database backups"
  type        = bool
  default     = true
}

variable "backup_schedule" {
  description = "Cron schedule for automated backups"
  type        = string
  default     = "0 2 * * *"  # Daily at 2 AM
}

variable "dr_region" {
  description = "Disaster recovery region"
  type        = string
  default     = "us-west-2"
}

# Cost Optimization
variable "enable_spot_instances" {
  description = "Enable spot instances for cost optimization"
  type        = bool
  default     = true
}

variable "enable_cluster_autoscaler" {
  description = "Enable cluster autoscaler"
  type        = bool
  default     = true
}

variable "enable_node_termination_handler" {
  description = "Enable AWS Node Termination Handler for spot instances"
  type        = bool
  default     = true
}

# Feature Flags
variable "feature_flags" {
  description = "Feature flags for infrastructure components"
  type = map(bool)
  default = {
    enable_service_mesh    = false
    enable_external_dns    = true
    enable_cert_manager    = true
    enable_ingress_nginx   = true
    enable_metrics_server  = true
    enable_dashboard       = false
    enable_gpu_support     = false
  }
}

# Tags
variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}