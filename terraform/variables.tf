variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "DigitalOcean region for the droplet"
  type        = string
  default     = "nyc3"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "juezbatalla.online"
}

variable "droplet_size" {
  description = "Size of the droplet"
  type        = string
  default     = "s-2vcpu-4gb"
  
  # Available sizes:
  # - s-1vcpu-1gb: $6/mo (1 vCPU, 1GB RAM) - Tight, may struggle
  # - s-1vcpu-2gb: $12/mo (1 vCPU, 2GB RAM) - PERFECT for demo ✨
  # - s-2vcpu-4gb: $24/mo (2 vCPU, 4GB RAM) - Recommended for production
  # - s-4vcpu-8gb: $48/mo (4 vCPU, 8GB RAM) - High traffic
  # See: https://docs.digitalocean.com/reference/api/api-reference/#tag/Droplets
}

variable "ssh_key_fingerprint" {
  description = "SSH key fingerprint for droplet access"
  type        = string
}

variable "repository_url" {
  description = "URL of the git repository to clone"
  type        = string
}

# Database credentials
variable "postgres_db" {
  description = "PostgreSQL database name"
  type        = string
  default     = "rapbattles"
}

variable "postgres_user" {
  description = "PostgreSQL username"
  type        = string
  default     = "postgres"
}

variable "postgres_password" {
  description = "PostgreSQL password"
  type        = string
  sensitive   = true
}

# Application secrets
variable "signing_secret" {
  description = "Secret for signing JWT tokens"
  type        = string
  sensitive   = true
}

variable "admin_key" {
  description = "Admin key for protected endpoints"
  type        = string
  sensitive   = true
}

# Application URLs
variable "api_base_url" {
  description = "Base URL for the API"
  type        = string
  default     = "http://localhost:8000"
}
