# Deployment Guide

This guide covers deploying the RapBattle Voter system to production.

## Architecture Overview

The system consists of:
- **Frontend**: Next.js web application
- **Backend**: FastAPI service
- **Database**: PostgreSQL
- **Cache**: Redis
- **Load Balancer**: Nginx (recommended)

## Prerequisites

- Docker and Docker Compose
- Domain name with SSL certificate
- Server with at least 2GB RAM and 2 CPU cores
- Basic knowledge of Linux server administration

## Production Environment Setup

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx
sudo apt install nginx -y
```

### 2. Application Deployment

```bash
# Clone repository
git clone <repository-url>
cd rapbattles

# Create production environment file
cp env.example .env.production

# Edit production configuration
nano .env.production
```

### 3. Environment Configuration

```bash
# .env.production
SIGNING_SECRET=your-super-secret-key-here
NEXT_PUBLIC_API_BASE=https://api.yourdomain.com
DATABASE_URL=postgresql+psycopg://postgres:secure_password@postgres:5432/rapbattles_prod
REDIS_URL=redis://redis:6379/0
ADMIN_KEY=your-admin-key-here
EVENT_DEFAULT_WINDOW=180
```

### 4. Docker Compose Production

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: rapbattles_prod
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: unless-stopped
    networks:
      - rapbattles

  redis:
    image: redis:7
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - rapbattles

  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=postgresql+psycopg://postgres:secure_password@postgres:5432/rapbattles_prod
      - REDIS_URL=redis://redis:6379/0
      - SIGNING_SECRET=your-super-secret-key-here
      - ADMIN_KEY=your-admin-key-here
      - EVENT_DEFAULT_WINDOW=180
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    networks:
      - rapbattles

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    environment:
      - NEXT_PUBLIC_API_BASE=https://api.yourdomain.com
    restart: unless-stopped
    networks:
      - rapbattles

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - /path/to/ssl/certs:/etc/nginx/ssl
    depends_on:
      - web
      - api
    restart: unless-stopped
    networks:
      - rapbattles

volumes:
  postgres_data:
  redis_data:

networks:
  rapbattles:
    driver: bridge
```

### 5. Dockerfiles

**apps/api/Dockerfile**:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**apps/web/Dockerfile**:
```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN corepack enable pnpm && pnpm build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### 6. Nginx Configuration

**nginx.conf**:
```nginx
events {
    worker_connections 1024;
}

http {
    upstream api {
        server api:8000;
    }

    upstream web {
        server web:3000;
    }

    server {
        listen 80;
        server_name yourdomain.com api.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://web;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    server {
        listen 443 ssl http2;
        server_name api.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### 7. SSL Certificate

```bash
# Using Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

### 8. Database Setup

```bash
# Run migrations
docker compose -f docker-compose.prod.yml exec api alembic upgrade head
```

### 9. Deploy

```bash
# Build and start services
docker compose -f docker-compose.prod.yml up -d --build

# Check logs
docker compose -f docker-compose.prod.yml logs -f
```

## Monitoring and Maintenance

### Health Checks

```bash
# Check service health
curl https://yourdomain.com/api/healthz

# Check database
docker compose -f docker-compose.prod.yml exec postgres pg_isready

# Check Redis
docker compose -f docker-compose.prod.yml exec redis redis-cli ping
```

### Backup Strategy

```bash
# Database backup
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres rapbattles_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres rapbattles_prod > /backups/rapbattles_$DATE.sql
find /backups -name "rapbattles_*.sql" -mtime +7 -delete
```

### Log Rotation

```bash
# Configure logrotate
sudo nano /etc/logrotate.d/docker-compose

# Add:
/var/lib/docker/containers/*/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
}
```

## Scaling Considerations

### Horizontal Scaling

1. **Load Balancer**: Use multiple Nginx instances behind a load balancer
2. **Database**: Consider read replicas for PostgreSQL
3. **Redis**: Use Redis Cluster for high availability
4. **API**: Run multiple API instances

### Performance Optimization

1. **CDN**: Use CloudFlare or AWS CloudFront for static assets
2. **Caching**: Implement Redis caching for frequently accessed data
3. **Database Indexing**: Ensure proper indexes on vote tables
4. **Connection Pooling**: Configure SQLAlchemy connection pools

## Troubleshooting

### Common Issues

1. **Database Connection**: Check DATABASE_URL and network connectivity
2. **Redis Connection**: Verify REDIS_URL and Redis service status
3. **SSL Issues**: Ensure certificates are valid and properly configured
4. **Memory Issues**: Monitor container memory usage and adjust limits

### Logs

```bash
# View all logs
docker compose -f docker-compose.prod.yml logs

# View specific service logs
docker compose -f docker-compose.prod.yml logs api
docker compose -f docker-compose.prod.yml logs web
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong SIGNING_SECRET and ADMIN_KEY
- [ ] Enable SSL/TLS encryption
- [ ] Configure firewall rules
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity
- [ ] Backup strategy in place
- [ ] Test disaster recovery procedures
