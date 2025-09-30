#!/usr/bin/env python3
"""
Script to create sample battle data for testing.
Run this after setting up the database and API.
"""

import sys
import os
import uuid
from datetime import datetime, timedelta

# Add the API directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../apps/api'))

from database import SessionLocal
from models import Battle, BattleStatus
from auth import create_event_token

def create_sample_battles():
    """Create sample battles for testing."""
    db = SessionLocal()
    
    try:
        # Create a sample event
        event_id = str(uuid.uuid4())
        
        # Create battles
        battles = [
            {
                "mc_a": "MC Rhyme",
                "mc_b": "Flow Master",
                "starts_at": datetime.utcnow(),
                "ends_at": datetime.utcnow() + timedelta(hours=1),
                "status": BattleStatus.OPEN,
            },
            {
                "mc_a": "Word Smith",
                "mc_b": "Beat Breaker",
                "starts_at": datetime.utcnow() + timedelta(hours=2),
                "ends_at": datetime.utcnow() + timedelta(hours=3),
                "status": BattleStatus.SCHEDULED,
            },
            {
                "mc_a": "Verse King",
                "mc_b": "Rap Legend",
                "starts_at": datetime.utcnow() - timedelta(hours=1),
                "ends_at": datetime.utcnow() - timedelta(minutes=30),
                "status": BattleStatus.CLOSED,
            },
        ]
        
        created_battles = []
        for battle_data in battles:
            battle = Battle(
                event_id=event_id,
                mc_a=battle_data["mc_a"],
                mc_b=battle_data["mc_b"],
                starts_at=battle_data["starts_at"],
                ends_at=battle_data["ends_at"],
                status=battle_data["status"],
            )
            db.add(battle)
            created_battles.append(battle)
        
        db.commit()
        
        # Refresh to get IDs
        for battle in created_battles:
            db.refresh(battle)
        
        # Generate event token
        token = create_event_token(event_id)
        
        print("Sample battles created successfully!")
        print(f"Event ID: {event_id}")
        print(f"Event Token: {token}")
        print("\nBattles:")
        
        for battle in created_battles:
            print(f"- {battle.mc_a} vs {battle.mc_b} (ID: {battle.id}, Status: {battle.status.value})")
        
        print(f"\nQR Code URLs:")
        for battle in created_battles:
            qr_url = f"http://localhost:3000/battle/{battle.id}?t={token}"
            print(f"- {qr_url}")
        
        print(f"\nPresenter URLs:")
        for battle in created_battles:
            presenter_url = f"http://localhost:3000/presenter/{battle.id}"
            print(f"- {presenter_url}")
        
    except Exception as e:
        print(f"Error creating sample data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_battles()
