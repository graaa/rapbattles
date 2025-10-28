"""Database models."""

import uuid
from datetime import datetime
from enum import Enum as PyEnum
from typing import Optional

from sqlalchemy import Column, String, DateTime, Enum, BigInteger, Integer, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, INET
from sqlalchemy.sql import func

from database import Base


class BattleStatus(PyEnum):
    """Battle status enum."""
    SCHEDULED = "scheduled"
    OPEN = "open"
    CLOSED = "closed"


class VoteChoice(PyEnum):
    """Vote choice enum."""
    A = "A"
    B = "B"
    REPLICA = "REPLICA"


class Event(Base):
    """Event model."""
    __tablename__ = "events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Battle(Base):
    """Battle model."""
    __tablename__ = "battles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    mc_a = Column(String, nullable=False)
    mc_b = Column(String, nullable=False)
    starts_at = Column(DateTime(timezone=True), nullable=False)
    ends_at = Column(DateTime(timezone=True), nullable=False)
    status = Column(Enum(BattleStatus), nullable=False, default=BattleStatus.SCHEDULED)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Vote(Base):
    """Vote model."""
    __tablename__ = "votes"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    battle_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    choice = Column(Enum(VoteChoice), nullable=False)
    device_hash = Column(String, nullable=False)
    ip_address = Column(INET, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Unique constraint: one vote per device per battle
    __table_args__ = (
        UniqueConstraint('battle_id', 'device_hash', name='unique_battle_device_vote'),
        Index('idx_battle_choice', 'battle_id', 'choice'),
    )


class Invalidation(Base):
    """Vote invalidation model (optional)."""
    __tablename__ = "invalidations"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    vote_id = Column(BigInteger, nullable=False)
    reason = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
