"""Main FastAPI application."""

import sys
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException, status, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db, engine
from models import Base, Battle, Vote, BattleStatus, VoteChoice
from schemas import (
    HealthResponse, VoteRequest, VoteResponse, TallyResponse, 
    BattleResponse, AdminOpenBattleRequest
)
from auth import get_current_event, verify_admin_key, get_client_ip, create_event_token
from redis_client import redis_client
from config import settings

# Create tables
Base.metadata.create_all(bind=engine)


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
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(status="ok")


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
    vote_request: VoteRequest,
    event_data: dict = Depends(get_current_event),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """Cast a vote for a battle."""
    # Get battle
    battle = db.query(Battle).filter(Battle.id == vote_request.battle_id).first()
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
    
    # Check for existing vote from this device
    existing_vote = db.query(Vote).filter(
        Vote.battle_id == vote_request.battle_id,
        Vote.device_hash == vote_request.device_hash
    ).first()
    
    if existing_vote:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already voted in this battle"
        )
    
    # Create vote
    vote = Vote(
        battle_id=vote_request.battle_id,
        choice=vote_request.choice,
        device_hash=vote_request.device_hash,
        ip_address=ip_address
    )
    
    db.add(vote)
    db.commit()
    db.refresh(vote)
    
    # Update Redis counters
    await redis_client.increment_vote(str(vote_request.battle_id), vote_request.choice.value)
    
    # Get current tally and publish update
    tally = await get_tallies_from_db(str(vote_request.battle_id), db)
    await redis_client.set_tally(str(vote_request.battle_id), {"A": tally.A, "B": tally.B})
    await redis_client.publish_tally(str(vote_request.battle_id), {"A": tally.A, "B": tally.B})
    
    return VoteResponse(
        success=True,
        message="Vote recorded successfully",
        tally=tally
    )


@app.get("/tallies/{battle_id}", response_model=TallyResponse)
async def get_tallies(battle_id: str, db: Session = Depends(get_db)):
    """Get current tallies for a battle."""
    return await get_tallies_from_db(battle_id, db)


async def get_tallies_from_db(battle_id: str, db: Session) -> TallyResponse:
    """Get tallies from database."""
    # Check Redis cache first
    cached_tally = await redis_client.get_tally(battle_id)
    if cached_tally:
        return TallyResponse(A=cached_tally["A"], B=cached_tally["B"])
    
    # Query database
    result = db.query(
        Vote.choice,
        func.count(Vote.id).label('count')
    ).filter(
        Vote.battle_id == battle_id
    ).group_by(Vote.choice).all()
    
    tally = {"A": 0, "B": 0}
    for choice, count in result:
        tally[choice.value] = count
    
    # Cache the result
    await redis_client.set_tally(battle_id, tally)
    
    return TallyResponse(A=tally["A"], B=tally["B"])


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
    request_data: AdminOpenBattleRequest,
    _: None = Depends(verify_admin_key),
    db: Session = Depends(get_db)
):
    """Open a battle for voting (admin only)."""
    battle = db.query(Battle).filter(Battle.id == battle_id).first()
    if not battle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battle not found"
        )
    
    battle.status = BattleStatus.OPEN
    
    if request_data.starts_at:
        battle.starts_at = request_data.starts_at
    if request_data.ends_at:
        battle.ends_at = request_data.ends_at
    
    db.commit()
    
    return {"message": "Battle opened successfully"}


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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
