#!/bin/bash

# Create demo data script
echo "🎤 Creating RapBattle Demo Data..."

# Check if API is running
if ! curl -s http://localhost:8000/healthz > /dev/null 2>&1; then
    echo "❌ API is not running. Please start the demo first with: ./scripts/demo.sh"
    exit 1
fi

echo "📊 Creating demo battles..."

# Create demo battles using the API
BATTLE1_ID=$(curl -s -X POST "http://localhost:8000/admin/battles" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: change-me" \
  -d '{
    "event_id": "demo-event-123",
    "mc_a": "MC Thunder",
    "mc_b": "Rhyme Master",
    "starts_at": "'$(date -u +"%Y-%m-%dT%H:%M:%S")'",
    "ends_at": "'$(date -u -d "+20 minutes" +"%Y-%m-%dT%H:%M:%S")'"
  }' | jq -r '.id')

BATTLE2_ID=$(curl -s -X POST "http://localhost:8000/admin/battles" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: change-me" \
  -d '{
    "event_id": "demo-event-123",
    "mc_a": "Word Wizard",
    "mc_b": "Flow King",
    "starts_at": "'$(date -u -d "+25 minutes" +"%Y-%m-%dT%H:%M:%S")'",
    "ends_at": "'$(date -u -d "+45 minutes" +"%Y-%m-%dT%H:%M:%S")'"
  }' | jq -r '.id')

if [ "$BATTLE1_ID" != "null" ] && [ "$BATTLE2_ID" != "null" ]; then
    echo "✅ Demo battles created!"
    echo ""
    echo "🎯 Demo Battle URLs:"
    echo "  Battle 1 (MC Thunder vs Rhyme Master):"
    echo "    Vote: http://localhost:3000/battle/$BATTLE1_ID"
    echo "    QR:   http://localhost:8000/battles/$BATTLE1_ID/qr-page"
    echo ""
    echo "  Battle 2 (Word Wizard vs Flow King):"
    echo "    Vote: http://localhost:3000/battle/$BATTLE2_ID"
    echo "    QR:   http://localhost:8000/battles/$BATTLE2_ID/qr-page"
    echo ""
    echo "📱 Mobile Testing:"
    echo "  1. Open the QR URLs on your computer"
    echo "  2. Scan with your phone camera"
    echo "  3. Vote and see real-time updates!"
    echo ""
    echo "🎮 Open the first battle for voting:"
    echo "  http://localhost:8000/admin/battles/$BATTLE1_ID/open"
else
    echo "❌ Failed to create demo battles. Make sure the API is running."
fi
