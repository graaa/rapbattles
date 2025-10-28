"""Main FastAPI application."""

import sys
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException, status, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, HTMLResponse
import qrcode
from io import BytesIO
import base64
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db, engine
from models import Base, Battle, Vote, Event, BattleStatus, VoteChoice
from schemas import (
    HealthResponse, VoteRequest, VoteResponse, TallyResponse, 
    BattleResponse, AdminOpenBattleRequest, AdminCreateBattleRequest
)
from auth import get_current_event, verify_admin_key, get_client_ip, create_event_token
from redis_client import redis_client
from config import settings

# Create tables
Base.metadata.create_all(bind=engine)

# Run migrations on startup
try:
    from migrations import run_migrations
    run_migrations()
    print("✅ Migrations completed")
except Exception as e:
    print(f"⚠️ Migration check: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager."""
    # Startup
    yield
    # Shutdown
    await redis_client.close()


app = FastAPI(
    title="RapBattle Voter API",
    description="API for live rap battle voting system",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://167.71.80.114:3000"],  # Next.js servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(status="ok")


@app.get("/events/{event_id}")
async def get_event(event_id: str, db: Session = Depends(get_db)):
    """Get event details."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    return {
        "id": str(event.id),
        "name": event.name,
        "created_at": event.created_at.isoformat()
    }


@app.get("/battles/{battle_id}", response_model=BattleResponse)
async def get_battle(battle_id: str, db: Session = Depends(get_db)):
    """Get battle details."""
    battle = db.query(Battle).filter(Battle.id == battle_id).first()
    if not battle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battle not found"
        )
    return battle


@app.post("/vote", response_model=VoteResponse)
async def vote(
    request: Request,
    event_data: dict = Depends(get_current_event),
    db: Session = Depends(get_db)
):
    """Cast a vote for a battle."""
    import json
    
    # Debug the raw request
    body = await request.body()
    print(f"DEBUG VOTE: Raw request body: {body}")
    print(f"DEBUG VOTE: Request headers: {dict(request.headers)}")
    
    try:
        # Parse JSON manually
        data = json.loads(body) if body else {}
        print(f"DEBUG VOTE: Parsed JSON data: {data}")
        
        # Extract vote data
        battle_id = data.get('battle_id')
        choice = data.get('choice')
        device_hash = data.get('device_hash')
        
        if not battle_id or not choice or not device_hash:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required fields: battle_id, choice, device_hash"
            )
            
    except json.JSONDecodeError as e:
        print(f"DEBUG VOTE: JSON decode error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON format"
        )
    
    # Get battle
    battle = db.query(Battle).filter(Battle.id == battle_id).first()
    if not battle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battle not found"
        )
    
    # Check if battle is open
    if battle.status != BattleStatus.OPEN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Battle is not open for voting"
        )
    
    # Check if battle belongs to the event
    if str(battle.event_id) != event_data["event_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Battle does not belong to this event"
        )
    
    # Get client IP and check rate limit
    ip_address = get_client_ip(request)
    if not await redis_client.check_rate_limit(ip_address):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later."
        )
    
    # Check for existing vote from this device (allow changing vote)
    existing_vote = db.query(Vote).filter(
        Vote.battle_id == battle_id,
        Vote.device_hash == device_hash
    ).first()
    
    if existing_vote:
        # Update existing vote instead of rejecting
        existing_vote.choice = VoteChoice(choice)
        db.commit()
        db.refresh(existing_vote)
    else:
        # Create new vote
        vote = Vote(
            battle_id=battle_id,
            choice=VoteChoice(choice),
            device_hash=device_hash,
            ip_address=ip_address
        )
        db.add(vote)
        db.commit()
        db.refresh(vote)
    
    # Get current tally and publish update
    tally = await get_tallies_from_db(str(battle_id), db)
    await redis_client.set_tally(str(battle_id), {"A": tally.A, "B": tally.B, "REPLICA": tally.REPLICA})
    await redis_client.publish_tally(str(battle_id), {"A": tally.A, "B": tally.B, "REPLICA": tally.REPLICA})
    
    return VoteResponse(
        success=True,
        message="Vote recorded successfully",
        tally=tally
    )


@app.get("/tallies/{battle_id}", response_model=TallyResponse)
async def get_tallies(battle_id: str, db: Session = Depends(get_db)):
    """Get current tallies for a battle."""
    return await get_tallies_from_db(battle_id, db)


@app.get("/votes/{battle_id}/check/{device_hash}")
async def check_if_voted(battle_id: str, device_hash: str, db: Session = Depends(get_db)):
    """Check if a device has already voted in a battle."""
    vote = db.query(Vote).filter(
        Vote.battle_id == battle_id,
        Vote.device_hash == device_hash
    ).first()
    
    return {
        "has_voted": vote is not None,
        "choice": vote.choice.value if vote else None
    }


async def get_tallies_from_db(battle_id: str, db: Session) -> TallyResponse:
    """Get tallies from database."""
    # Don't use Redis cache for real-time results
    # Always query from database for accuracy
    
    # Query database
    result = db.query(
        Vote.choice,
        func.count(Vote.id).label('count')
    ).filter(
        Vote.battle_id == battle_id
    ).group_by(Vote.choice).all()
    
    tally = {"A": 0, "B": 0, "REPLICA": 0}
    for choice, count in result:
        # choice is a VoteChoice enum, get its value
        choice_value = choice.value if hasattr(choice, 'value') else str(choice)
        tally[choice_value] = count
    
    # Cache the result
    await redis_client.set_tally(battle_id, tally)
    
    return TallyResponse(A=tally["A"], B=tally["B"], REPLICA=tally["REPLICA"])


@app.get("/sse/battles/{battle_id}")
async def battle_sse(battle_id: str, db: Session = Depends(get_db)):
    """Server-Sent Events endpoint for live battle updates."""
    import redis.asyncio as redis
    import json
    
    # Verify battle exists
    battle = db.query(Battle).filter(Battle.id == battle_id).first()
    if not battle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battle not found"
        )
    
    async def event_generator():
        """Generate SSE events."""
        r = redis.from_url(settings.redis_url, decode_responses=True)
        pubsub = r.pubsub()
        
        try:
            await pubsub.subscribe(f"battle:{battle_id}:tally")
            
            # Send initial tally
            initial_tally = await get_tallies_from_db(battle_id, db)
            yield f"data: {initial_tally.json()}\n\n"
            
            # Listen for updates
            async for message in pubsub.listen():
                if message['type'] == 'message':
                    yield f"data: {message['data']}\n\n"
                    
        finally:
            await pubsub.unsubscribe(f"battle:{battle_id}:tally")
            await r.close()
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
        }
    )


# Admin endpoints
@app.post("/admin/battles/{battle_id}/open")
async def open_battle(
    battle_id: str,
    request: Request,
    _: None = Depends(verify_admin_key),
    db: Session = Depends(get_db)
):
    """Open a battle for voting (admin only)."""
    import json
    
    # Debug the raw request
    body = await request.body()
    print(f"DEBUG OPEN: Raw request body: {body}")
    print(f"DEBUG OPEN: Request headers: {dict(request.headers)}")
    
    try:
        # Parse JSON manually
        data = json.loads(body) if body else {}
        print(f"DEBUG OPEN: Parsed JSON data: {data}")
        
        battle = db.query(Battle).filter(Battle.id == battle_id).first()
        if not battle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Battle not found"
            )
        
        battle.status = BattleStatus.OPEN
        
        # Optional: update start/end times if provided
        if data.get("starts_at"):
            battle.starts_at = data["starts_at"]
        if data.get("ends_at"):
            battle.ends_at = data["ends_at"]
        
        db.commit()
        
        return {"message": "Battle opened successfully"}
    except Exception as e:
        print(f"DEBUG OPEN: Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/admin/battles/{battle_id}/close")
async def close_battle(
    battle_id: str,
    _: None = Depends(verify_admin_key),
    db: Session = Depends(get_db)
):
    """Close a battle for voting (admin only)."""
    battle = db.query(Battle).filter(Battle.id == battle_id).first()
    if not battle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battle not found"
        )
    
    battle.status = BattleStatus.CLOSED
    db.commit()
    
    return {"message": "Battle closed successfully"}


@app.post("/admin/events/{event_id}/token")
async def create_event_token_endpoint(
    event_id: str,
    _: None = Depends(verify_admin_key)
):
    """Create an event token (admin only)."""
    token = create_event_token(event_id)
    return {"event_id": event_id, "token": token}


@app.post("/admin/battles")
async def create_battle(
    request: Request,
    _: None = Depends(verify_admin_key),
    db: Session = Depends(get_db)
):
    """Create a new battle (admin only)."""
    import uuid
    import json
    
    # Debug the raw request first
    body = await request.body()
    print(f"DEBUG: Raw request body: {body}")
    print(f"DEBUG: Request headers: {dict(request.headers)}")
    
    try:
        # Parse JSON manually
        data = json.loads(body)
        print(f"DEBUG: Parsed JSON data: {data}")
        
        # Create battle manually
        battle = Battle(
            id=str(uuid.uuid4()),
            event_id=data["event_id"],
            mc_a=data["mc_a"],
            mc_b=data["mc_b"],
            starts_at=data["starts_at"],
            ends_at=data["ends_at"],
            status=BattleStatus.SCHEDULED
        )
        
        db.add(battle)
        db.commit()
        db.refresh(battle)
        
        return {
            "id": battle.id,
            "mc_a": battle.mc_a,
            "mc_b": battle.mc_b,
            "status": battle.status,
            "starts_at": battle.starts_at,
            "ends_at": battle.ends_at
        }
    except Exception as e:
        print(f"DEBUG: Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/admin/events")
async def get_all_events(
    _: None = Depends(verify_admin_key),
    db: Session = Depends(get_db)
):
    """Get all events (admin only)."""
    # Get all events from the events table
    events = db.query(Event).all()
    
    # Don't auto-create default event - let the list be empty if no events exist
    
    return [
        {
            "id": str(event.id),
            "name": event.name,
            "created_at": event.created_at.isoformat()
        }
        for event in events
    ]


@app.post("/admin/events")
async def create_event(
    request: Request,
    _: None = Depends(verify_admin_key),
    db: Session = Depends(get_db)
):
    """Create a new event (admin only)."""
    try:
        # Manually parse the request body
        body = await request.body()
        print(f"DEBUG CREATE EVENT: Raw request body: {body}")
        print(f"DEBUG CREATE EVENT: Request headers: {dict(request.headers)}")
        
        import json
        event_data = json.loads(body)
        print(f"DEBUG CREATE EVENT: Parsed JSON data: {event_data}")
        
        # Create new event
        new_event = Event(
            name=event_data["name"]
        )
        db.add(new_event)
        db.commit()
        db.refresh(new_event)
        
        return {
            "id": str(new_event.id),
            "name": new_event.name,
            "created_at": new_event.created_at.isoformat()
        }
    except Exception as e:
        db.rollback()
        print(f"DEBUG: Error creating event: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/admin/events/{event_id}")
async def delete_event(
    event_id: str,
    _: None = Depends(verify_admin_key),
    db: Session = Depends(get_db)
):
    """Delete an event (admin only)."""
    try:
        # Check if event exists
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Delete all battles associated with this event first
        battles_count = db.query(Battle).filter(Battle.event_id == event_id).count()
        if battles_count > 0:
            # Delete all battles for this event
            db.query(Battle).filter(Battle.event_id == event_id).delete()
            print(f"DEBUG: Deleted {battles_count} battles for event {event_id}")
        
        # Delete the event
        db.delete(event)
        db.commit()
        
        return {"message": "Event deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"DEBUG: Error deleting event: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/admin/events/{event_id}/battles")
async def get_battles_by_event(
    event_id: str,
    _: None = Depends(verify_admin_key),
    db: Session = Depends(get_db)
):
    """Get all battles for an event (admin only)."""
    battles = db.query(Battle).filter(Battle.event_id == event_id).all()
    
    return [
        {
            "id": battle.id,
            "event_id": battle.event_id,
            "mc_a": battle.mc_a,
            "mc_b": battle.mc_b,
            "status": battle.status,
            "starts_at": battle.starts_at,
            "ends_at": battle.ends_at
        }
        for battle in battles
    ]


@app.get("/battles/{battle_id}/qr")
async def get_battle_qr_code(
    battle_id: str,
    db: Session = Depends(get_db)
):
    """Generate QR code for a battle."""
    battle = db.query(Battle).filter(Battle.id == battle_id).first()
    if not battle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battle not found"
        )
    
    # Create QR code
    battle_url = f"http://localhost:3000/battle/{battle_id}"
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(battle_url)
    qr.make(fit=True)
    
    # Create QR code image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return {
        "battle_id": battle_id,
        "battle_name": f"{battle.mc_a} vs {battle.mc_b}",
        "qr_code": f"data:image/png;base64,{img_str}",
        "url": battle_url,
        "status": battle.status
    }


@app.get("/battles/{battle_id}/qr-page", response_class=HTMLResponse)
async def get_battle_qr_page(
    battle_id: str,
    db: Session = Depends(get_db)
):
    """Generate QR code page for a battle."""
    battle = db.query(Battle).filter(Battle.id == battle_id).first()
    if not battle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battle not found"
        )
    
    # Create QR code
    battle_url = f"http://localhost:3000/battle/{battle_id}"
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(battle_url)
    qr.make(fit=True)
    
    # Create QR code image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    # Generate HTML page
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>QR Code - {battle.mc_a} vs {battle.mc_b}</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                text-align: center;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
            }}
            .container {{
                background: white;
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                max-width: 400px;
                width: 100%;
            }}
            h1 {{
                color: #333;
                margin-bottom: 10px;
                font-size: 2em;
            }}
            .battle-info {{
                background: #f8f9fa;
                padding: 20px;
                border-radius: 15px;
                margin: 20px 0;
                border: 2px solid #e9ecef;
            }}
            .mc-names {{
                font-size: 1.5em;
                font-weight: bold;
                color: #495057;
                margin-bottom: 10px;
            }}
            .status {{
                display: inline-block;
                padding: 5px 15px;
                border-radius: 20px;
                font-weight: bold;
                margin: 10px 0;
            }}
            .status.open {{ background: #d4edda; color: #155724; }}
            .status.closed {{ background: #f8d7da; color: #721c24; }}
            .status.scheduled {{ background: #fff3cd; color: #856404; }}
            .qr-code {{
                margin: 30px 0;
            }}
            .qr-code img {{
                border: 3px solid #e9ecef;
                border-radius: 15px;
                padding: 20px;
                background: white;
            }}
            .url {{
                font-family: monospace;
                background: #e9ecef;
                padding: 15px;
                border-radius: 10px;
                word-break: break-all;
                margin: 20px 0;
                font-size: 0.9em;
            }}
            .instructions {{
                color: #6c757d;
                font-size: 0.9em;
                margin-top: 20px;
            }}
            .live-indicator {{
                display: inline-block;
                width: 10px;
                height: 10px;
                background: #28a745;
                border-radius: 50%;
                margin-right: 8px;
                animation: pulse 2s infinite;
            }}
            @keyframes pulse {{
                0% {{ opacity: 1; }}
                50% {{ opacity: 0.5; }}
                100% {{ opacity: 1; }}
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎤 RapBattle Voter</h1>
            
            <div class="battle-info">
                <div class="mc-names">{battle.mc_a} vs {battle.mc_b}</div>
                <div class="status {battle.status}">
                    {f'<span class="live-indicator"></span>' if battle.status == 'open' else ''}
                    {battle.status.title()}
                </div>
                <div><strong>Starts:</strong> {battle.starts_at.strftime('%H:%M')}</div>
                <div><strong>Ends:</strong> {battle.ends_at.strftime('%H:%M')}</div>
            </div>
            
            <div class="qr-code">
                <h3>📱 Scan to Vote</h3>
                <img src="data:image/png;base64,{img_str}" alt="QR Code" />
            </div>
            
            <div class="url">
                <strong>Direct Link:</strong><br>
                <a href="{battle_url}" target="_blank">{battle_url}</a>
            </div>
            
            <div class="instructions">
                <p><strong>How to vote:</strong></p>
                <p>1. Scan the QR code with your phone camera</p>
                <p>2. Tap the notification to open the voting page</p>
                <p>3. Choose your favorite MC</p>
                <p>4. Watch the live results update!</p>
            </div>
        </div>
        
        <script>
            // Auto-refresh page every 30 seconds to check status
            if ('{battle.status}' === 'scheduled') {{
                setTimeout(() => location.reload(), 30000);
            }}
        </script>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_content)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
