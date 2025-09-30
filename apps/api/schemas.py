"""Pydantic schemas for API requests and responses."""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from models import BattleStatus, VoteChoice


class BattleResponse(BaseModel):
    """Battle response schema."""
    id: uuid.UUID
    event_id: uuid.UUID
    mc_a: str
    mc_b: str
    starts_at: datetime
    ends_at: datetime
    status: BattleStatus

    class Config:
        from_attributes = True


class VoteRequest(BaseModel):
    """Vote request schema."""
    battle_id: uuid.UUID
    choice: VoteChoice
    device_hash: str = Field(..., min_length=1)


class TallyResponse(BaseModel):
    """Tally response schema."""
    A: int
    B: int


class VoteResponse(BaseModel):
    """Vote response schema."""
    success: bool
    message: str
    tally: Optional[TallyResponse] = None


class AdminCreateBattleRequest(BaseModel):
    """Admin create battle request schema."""
    event_id: str
    mc_a: str
    mc_b: str
    starts_at: datetime
    ends_at: datetime


class AdminOpenBattleRequest(BaseModel):
    """Admin open battle request schema."""
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None


class HealthResponse(BaseModel):
    """Health check response schema."""
    status: str
