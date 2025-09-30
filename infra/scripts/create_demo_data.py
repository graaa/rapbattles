#!/usr/bin/env python3
"""
Script to create demo data for RapBattle Voter
Creates sample events, battles, and generates QR codes
"""

import os
import sys
import uuid
from datetime import datetime, timedelta
import qrcode
from io import BytesIO
import base64

# Add the API directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../apps/api'))

from database import get_db, engine
from models import Event, Battle
from sqlalchemy.orm import Session
import secrets

def create_demo_event(db: Session) -> Event:
    """Create a demo event"""
    event = Event(
        id=str(uuid.uuid4()),
        name="Rap Battle Championship 2024",
        description="The ultimate rap battle tournament featuring the best MCs from around the city",
        created_at=datetime.utcnow(),
        signing_secret=secrets.token_urlsafe(32)
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

def create_demo_battles(db: Session, event_id: str) -> list[Battle]:
    """Create demo battles"""
    battles = []
    
    # Battle 1: Current/Active
    battle1 = Battle(
        id=str(uuid.uuid4()),
        event_id=event_id,
        mc_a="MC Thunder",
        mc_b="Rhyme Master",
        starts_at=datetime.utcnow() - timedelta(minutes=5),
        ends_at=datetime.utcnow() + timedelta(minutes=15),
        status="open"
    )
    db.add(battle1)
    battles.append(battle1)
    
    # Battle 2: Upcoming
    battle2 = Battle(
        id=str(uuid.uuid4()),
        event_id=event_id,
        mc_a="Word Wizard",
        mc_b="Flow King",
        starts_at=datetime.utcnow() + timedelta(minutes=20),
        ends_at=datetime.utcnow() + timedelta(minutes=40),
        status="scheduled"
    )
    db.add(battle2)
    battles.append(battle2)
    
    # Battle 3: Completed
    battle3 = Battle(
        id=str(uuid.uuid4()),
        event_id=event_id,
        mc_a="Beat Breaker",
        mc_b="Verse Master",
        starts_at=datetime.utcnow() - timedelta(hours=1),
        ends_at=datetime.utcnow() - timedelta(minutes=40),
        status="closed"
    )
    db.add(battle3)
    battles.append(battle3)
    
    db.commit()
    
    for battle in battles:
        db.refresh(battle)
    
    return battles

def generate_qr_code(url: str, battle_id: str) -> str:
    """Generate QR code for battle URL"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)
    
    # Create QR code image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64 for embedding
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return img_str

def create_demo_data():
    """Create complete demo dataset"""
    print("🎤 Creating RapBattle Voter Demo Data...")
    
    # Get database session
    db = next(get_db())
    
    try:
        # Create demo event
        print("📅 Creating demo event...")
        event = create_demo_event(db)
        print(f"✅ Event created: {event.name}")
        
        # Create demo battles
        print("⚔️ Creating demo battles...")
        battles = create_demo_battles(db, event.id)
        
        for battle in battles:
            print(f"✅ Battle created: {battle.mc_a} vs {battle.mc_b} ({battle.status})")
        
        # Generate QR codes and save them
        print("📱 Generating QR codes...")
        base_url = os.getenv('NEXT_PUBLIC_API_BASE', 'http://localhost:3000')
        
        for battle in battles:
            battle_url = f"{base_url}/battle/{battle.id}"
            qr_code = generate_qr_code(battle_url, battle.id)
            
            # Save QR code as HTML file
            qr_file = f"demo_qr_{battle.id[:8]}.html"
            with open(qr_file, 'w') as f:
                f.write(f"""
<!DOCTYPE html>
<html>
<head>
    <title>QR Code - {battle.mc_a} vs {battle.mc_b}</title>
    <style>
        body {{ font-family: Arial, sans-serif; text-align: center; padding: 20px; }}
        .qr-container {{ margin: 20px auto; max-width: 400px; }}
        .battle-info {{ background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0; }}
        .qr-code {{ margin: 20px 0; }}
        .url {{ font-family: monospace; background: #e0e0e0; padding: 10px; border-radius: 5px; word-break: break-all; }}
    </style>
</head>
<body>
    <h1>🎤 RapBattle Voter</h1>
    <div class="battle-info">
        <h2>{battle.mc_a} vs {battle.mc_b}</h2>
        <p><strong>Status:</strong> {battle.status.title()}</p>
        <p><strong>Starts:</strong> {battle.starts_at.strftime('%H:%M')}</p>
        <p><strong>Ends:</strong> {battle.ends_at.strftime('%H:%M')}</p>
    </div>
    
    <div class="qr-code">
        <h3>Scan to Vote</h3>
        <img src="data:image/png;base64,{qr_code}" alt="QR Code" />
    </div>
    
    <div class="url">
        <strong>Direct Link:</strong><br>
        <a href="{battle_url}" target="_blank">{battle_url}</a>
    </div>
    
    <p><em>Scan the QR code with your phone to vote in this battle!</em></p>
</body>
</html>
                """)
            print(f"✅ QR code saved: {qr_file}")
        
        print(f"\n🎉 Demo data created successfully!")
        print(f"📊 Event: {event.name}")
        print(f"⚔️ Battles: {len(battles)}")
        print(f"📱 QR codes: {len(battles)} files generated")
        
        print(f"\n🌐 Demo URLs:")
        for battle in battles:
            print(f"  • {battle.mc_a} vs {battle.mc_b}: http://localhost:3000/battle/{battle.id}")
        
        print(f"\n📱 QR Code Files:")
        for battle in battles:
            print(f"  • demo_qr_{battle.id[:8]}.html")
        
        print(f"\n🎯 To test the demo:")
        print(f"  1. Open http://localhost:3000/admin")
        print(f"  2. Use admin key: 'change-me'")
        print(f"  3. Open QR code files in browser")
        print(f"  4. Scan with phone to vote")
        
    except Exception as e:
        print(f"❌ Error creating demo data: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_demo_data()
