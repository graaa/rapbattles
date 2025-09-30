#!/bin/bash

# Development script - only Docker services (no web)
echo "🐳 Starting development environment (Docker services only)..."
docker compose up -d postgres redis api

echo "✅ Services started:"
echo "   📊 PostgreSQL: localhost:5432"
echo "   🔴 Redis: localhost:6379" 
echo "   🚀 API: http://localhost:8000"
echo "   📚 API Docs: http://localhost:8000/docs"
echo ""
echo "💡 To start the web app:"
echo "   pnpm --filter @rapbattles/web dev"
