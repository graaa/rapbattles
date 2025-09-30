"""Configuration settings for the API."""

import os
from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # Database
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/rapbattles"
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # Security
    signing_secret: str = "change-me"
    admin_key: str = "change-me"
    
    # Event settings
    event_default_window: int = 180  # seconds
    
    # Anti-abuse
    ip_rate_limit: int = 5  # votes per IP per sliding window
    rate_limit_window: int = 300  # seconds (5 minutes)
    
    class Config:
        env_file = ".env"


settings = Settings()
