#!/bin/bash

# Production script - everything in Docker
echo "🐳 Starting production environment (everything in Docker)..."

# Build and start all services
docker compose up -d --build

echo "✅ All services started:"
echo "   📊 PostgreSQL: localhost:5432"
echo "   🔴 Redis: localhost:6379"
echo "   🚀 API: http://localhost:8000"
echo "   📚 API Docs: http://localhost:8000/docs"
echo "   🌐 Web App: http://localhost:3000"
echo "   ⚙️  Admin Panel: http://localhost:3000/admin"
echo ""
echo "🎉 Complete rap battle voting system is ready!"
