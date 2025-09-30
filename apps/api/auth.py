"""Authentication and authorization utilities."""

import time
from typing import Optional, Dict, Any
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from config import settings
from models import Battle

security = HTTPBearer()


def create_event_token(event_id: str, expires_in: int = None) -> str:
    """Create a signed event token."""
    if expires_in is None:
        expires_in = settings.event_default_window
    
    payload = {
        "event_id": event_id,
        "exp": time.time() + expires_in,
        "iat": time.time(),
    }
    
    return jwt.encode(payload, settings.signing_secret, algorithm="HS256")


def verify_event_token(token: str) -> Dict[str, Any]:
    """Verify and decode event token."""
    try:
        payload = jwt.decode(token, settings.signing_secret, algorithms=["HS256"])
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        ) from e


async def get_current_event(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Get current event from token."""
    token = credentials.credentials
    return verify_event_token(token)


async def verify_admin_key(request: Request) -> None:
    """Verify admin key from request headers."""
    admin_key = request.headers.get("X-Admin-Key")
    if not admin_key or admin_key != settings.admin_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin key"
        )


def get_client_ip(request: Request) -> str:
    """Get client IP address from request."""
    # Check for forwarded headers first (for reverse proxies)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fallback to direct client IP
    return request.client.host if request.client else "unknown"
