"""Redis client for caching and pub/sub."""

import json
import redis.asyncio as redis
from typing import Dict, Any, Optional

from config import settings


class RedisClient:
    """Redis client wrapper."""
    
    def __init__(self):
        self.redis = redis.from_url(settings.redis_url, decode_responses=True)
    
    async def get_tally(self, battle_id: str) -> Optional[Dict[str, int]]:
        """Get tally from Redis cache."""
        key = f"battle:{battle_id}:tally"
        data = await self.redis.get(key)
        if data:
            return json.loads(data)
        return None
    
    async def set_tally(self, battle_id: str, tally: Dict[str, int]) -> None:
        """Set tally in Redis cache."""
        key = f"battle:{battle_id}:tally"
        await self.redis.setex(key, 3600, json.dumps(tally))  # 1 hour TTL
    
    async def increment_vote(self, battle_id: str, choice: str) -> int:
        """Increment vote counter in Redis."""
        key = f"battle:{battle_id}:{choice}"
        return await self.redis.incr(key)
    
    async def publish_tally(self, battle_id: str, tally: Dict[str, int]) -> None:
        """Publish tally update to Redis channel."""
        channel = f"battle:{battle_id}:tally"
        await self.redis.publish(channel, json.dumps(tally))
    
    async def check_rate_limit(self, ip_address: str) -> bool:
        """Check if IP has exceeded rate limit."""
        key = f"rate_limit:{ip_address}"
        current_count = await self.redis.incr(key)
        
        if current_count == 1:
            await self.redis.expire(key, settings.rate_limit_window)
        
        return current_count <= settings.ip_rate_limit
    
    async def close(self) -> None:
        """Close Redis connection."""
        await self.redis.close()


# Global Redis client instance
redis_client = RedisClient()
