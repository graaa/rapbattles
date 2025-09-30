#!/bin/bash

# RapBattle Voter Demo Script
echo "🎤 RapBattle Voter - Full Demo Setup"
echo "=================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "🐳 Starting Docker services..."
docker compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if API is responding
echo "🔍 Checking API health..."
for i in {1..30}; do
    if curl -s http://localhost:8000/healthz > /dev/null 2>&1; then
        echo "✅ API is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ API failed to start. Check logs with: docker compose logs api"
        exit 1
    fi
    echo "⏳ Waiting for API... ($i/30)"
    sleep 2
done

# Check if Web is responding
echo "🔍 Checking Web app..."
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Web app is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Web app failed to start. Check logs with: docker compose logs web"
        exit 1
    fi
    echo "⏳ Waiting for Web app... ($i/30)"
    sleep 2
done

echo ""
echo "🎉 Demo is ready!"
echo "================="
echo ""
echo "📱 Demo URLs:"
echo "  🌐 Main App:     http://localhost:3000"
echo "  ⚙️  Admin Panel:  http://localhost:3000/admin"
echo "  🚀 API:          http://localhost:8000"
echo "  📚 API Docs:     http://localhost:8000/docs"
echo ""
echo "🔑 Admin Credentials:"
echo "  Admin Key: change-me"
echo ""
echo "📱 QR Code Pages (for mobile testing):"
echo "  After creating battles, visit:"
echo "  http://localhost:8000/battles/{battle_id}/qr-page"
echo ""
echo "🎯 Demo Steps:"
echo "  1. Open http://localhost:3000/admin"
echo "  2. Create a new battle (e.g., 'MC A vs MC B')"
echo "  3. Open the battle to voting"
echo "  4. Get the QR code URL from the battle details"
echo "  5. Open the QR page on your phone"
echo "  6. Scan and vote!"
echo ""
echo "📊 Real-time Updates:"
echo "  - Vote counts update automatically"
echo "  - Presenter screen shows live results"
echo "  - Works on iOS, Android, and desktop"
echo ""
echo "🛠️  Useful Commands:"
echo "  View logs:     docker compose logs -f"
echo "  Stop demo:     docker compose down"
echo "  Restart:       docker compose restart"
echo ""
echo "🎤 Enjoy your RapBattle demo!"
