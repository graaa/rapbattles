terraform {
  required_version = ">= 1.0"
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

# Resource names
locals {
  app_name = "rapbattles-voter"  # Usado como tag y prefijo de nombre
}

# Droplet resource
resource "digitalocean_droplet" "app" {
  image    = "docker-20-04"
  name     = "${local.app_name}-${formatdate("YYYYMMDDhhmm", timestamp())}"
  region   = var.region
  size     = var.droplet_size
  ssh_keys = [var.ssh_key_fingerprint]

  tags = [local.app_name]

  user_data = <<-EOF
    #!/bin/bash
    # Update system
    apt-get update -y
    apt-get upgrade -y
    
    # Install git
    apt-get install -y git
    
    # Docker ya está instalado en docker-20-04 image
    
    # Clone repository
    cd /root
    git clone ${var.repository_url} app
    cd app
    
    # Create .env file
    cat > .env << ENVFILE
    POSTGRES_DB=${var.postgres_db}
    POSTGRES_USER=${var.postgres_user}
    POSTGRES_PASSWORD=${var.postgres_password}
    
    DATABASE_URL=postgresql+psycopg://${var.postgres_user}:${var.postgres_password}@postgres:5432/${var.postgres_db}
    REDIS_URL=redis://redis:6379/0
    SIGNING_SECRET=${var.signing_secret}
    ADMIN_KEY=${var.admin_key}
    
    API_BASE_URL=${var.api_base_url}
    
    API_PORT=8000
    WEB_PORT=3000
    ENVFILE
    
    # Start application
    docker compose -f docker-compose.prod.yml up -d --build
    
    # Setup firewall
    ufw allow 22/tcp
    ufw allow 3000/tcp
    ufw allow 8000/tcp
    ufw --force enable
  EOF

  lifecycle {
    create_before_destroy = true
  }
}

# Firewall rules
resource "digitalocean_firewall" "app_firewall" {
  name = "${local.app_name}-firewall"

  droplet_ids = [digitalocean_droplet.app.id]

  inbound_rule {
    protocol   = "tcp"
    port_range = "22"
    source_addresses = ["0.0.0.0/0"]
  }

  inbound_rule {
    protocol   = "tcp"
    port_range = "3000"
    source_addresses = ["0.0.0.0/0"]
  }

  inbound_rule {
    protocol   = "tcp"
    port_range = "8000"
    source_addresses = ["0.0.0.0/0"]
  }

  outbound_rule {
    protocol         = "tcp"
    port_range       = "1-65535"
    destination_addresses = ["0.0.0.0/0"]
  }

  outbound_rule {
    protocol         = "udp"
    port_range       = "1-65535"
    destination_addresses = ["0.0.0.0/0"]
  }
}

# Outputs
output "droplet_ip" {
  value       = digitalocean_droplet.app.ipv4_address
  description = "Droplet IP address"
}

output "web_url" {
  value       = "http://${digitalocean_droplet.app.ipv4_address}:3000"
  description = "Web application URL"
}

output "admin_url" {
  value       = "http://${digitalocean_droplet.app.ipv4_address}:3000/admin"
  description = "Admin panel URL"
}

output "api_url" {
  value       = "http://${digitalocean_droplet.app.ipv4_address}:8000"
  description = "API URL"
}

output "api_docs_url" {
  value       = "http://${digitalocean_droplet.app.ipv4_address}:8000/docs"
  description = "API documentation URL"
}
