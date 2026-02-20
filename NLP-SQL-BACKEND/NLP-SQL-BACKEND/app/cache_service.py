import redis
import json
import hashlib
import time
from typing import Optional, Any
from datetime import datetime, date
from config import settings
import logging

logger = logging.getLogger(__name__)

class CacheManager:
    """
    Manages Redis caching for query results with in-memory fallback.
    """
    
    def __init__(self):
        self.available = False
        self.redis_client = None
        self.last_check = 0
        self.check_interval = 60 # Seconds between re-connection attempts
        
        # Local in-memory fallback for when Redis is down
        self.memory_cache = {} 
        self.memory_history = {} # NEW: Track history in memory
        self.hits = 0
        self.misses = 0
        
        self._check_redis()
    
    def _check_redis(self):
        """Check if Redis is available, attempt reconnect if needed"""
        current_time = time.time()
        
        # If already available, just use it
        if self.available and self.redis_client:
            return True
            
        # Avoid spamming connection attempts
        if current_time - self.last_check < self.check_interval:
            return False
            
        self.last_check = current_time
        try:
            self.redis_client = redis.Redis.from_url(
                settings.REDIS_URL, 
                socket_timeout=0.5, 
                socket_connect_timeout=0.5,
                retry_on_timeout=False
            )
            self.redis_client.ping()
            self.available = True
            logger.info("✅ Redis connected successfully")
            return True
        except Exception:
            self.available = False
            self.redis_client = None
            logger.debug("Redis still unavailable, sticking to memory cache.")
            return False

    def _generate_key(self, tenant_id: str, sql: str) -> str:
        """Generate unique cache key from tenant and SQL"""
        normalized_sql = ' '.join(sql.lower().split())
        sql_hash = hashlib.sha256(normalized_sql.encode()).hexdigest()[:16]
        return f"{tenant_id}:{sql_hash}"
    
    def get_cached_result(self, tenant_id: str, sql: str) -> Optional[Any]:
        """Get cached result from Memory or Redis"""
        key = self._generate_key(tenant_id, sql)
        
        # 1. Try Memory First (Fastest, works even if Redis is down)
        if key in self.memory_cache:
            self.hits += 1
            logger.info(f"⚡ Memory Cache HIT for {key}")
            return self.memory_cache[key]

        # 2. Try Redis if available
        if self._check_redis():
            try:
                result = self.redis_client.get(key)
                if result:
                    self.hits += 1
                    data = json.loads(result)
                    # Backfill memory cache
                    self.memory_cache[key] = data
                    logger.info(f"✅ Redis Cache HIT for {key}")
                    return data
            except Exception as e:
                logger.error(f"Redis get error: {e}")
                self.available = False # Mark as down on failure

        self.misses += 1
        return None
    
    def cache_result(self, tenant_id: str, sql: str, result: Any, ttl: int = 300):
        """Store result in memory and try Redis"""
        key = self._generate_key(tenant_id, sql)
        
        # Always update memory cache (LRU: keep last 50)
        self.memory_cache[key] = result
        if len(self.memory_cache) > 50:
            # Simple eviction: pop the oldest key
            old_key = next(iter(self.memory_cache))
            self.memory_cache.pop(old_key)

        # Try to persist to Redis
        if self._check_redis():
            try:
                json_result = json.dumps(result, default=self._json_serializer)
                self.redis_client.setex(key, ttl, json_result)
                logger.info(f"💾 Redis Cached result for {key}")
                
                # Add to history
                self._add_to_history(tenant_id, sql)
            except Exception as e:
                logger.error(f"Redis set error: {e}")
                self.available = False

    def get_tenant_stats(self, tenant_id: str) -> dict:
        """Get per-tenant statistics"""
        hits, misses = 0, 0
        if self._check_redis():
            try:
                hits = int(self.redis_client.get(f"stats:{tenant_id}:hits") or 0)
                misses = int(self.redis_client.get(f"stats:{tenant_id}:misses") or 0)
            except Exception:
                self.available = False
        
        total = hits + misses
        return {
            "hits": hits,
            "misses": misses,
            "total_queries": total,
            "hit_rate_percentage": round((hits / total * 100) if total > 0 else 0, 2),
            "redis_available": self.available,
            "memory_cache_entries": len([k for k in self.memory_cache if k.startswith(tenant_id)])
        }

    def get_tenant_history(self, tenant_id: str) -> list:
        """Get recent queries from Redis (with memory fallback)"""
        if self._check_redis():
            try:
                key = f"history:{tenant_id}"
                items = self.redis_client.lrange(key, 0, 19)
                return [json.loads(item) for item in items]
            except Exception:
                self.available = False
        
        # Fallback to memory
        return self.memory_history.get(tenant_id, [])
    
    def _json_serializer(self, obj):
        """Handle datetime objects for JSON"""
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        raise TypeError(f"Type {type(obj)} not serializable")
    
    def invalidate_tenant_cache(self, tenant_id: str):
        """Clear local and Redis entries for a tenant"""
        # Clear Memory
        self.memory_cache = {k: v for k, v in self.memory_cache.items() if not k.startswith(tenant_id)}
        
        if self._check_redis():
            try:
                patterns = [f"{tenant_id}:*", f"stats:{tenant_id}:*", f"history:{tenant_id}*"]
                for pattern in patterns:
                    cursor = 0
                    while True:
                        cursor, keys = self.redis_client.scan(cursor=cursor, match=pattern, count=100)
                        if keys:
                            self.redis_client.delete(*keys)
                        if cursor == 0:
                            break
            except Exception:
                self.available = False
        return True
    
    def get_stats(self):
        """Global cache stats"""
        total = self.hits + self.misses
        return {
            "hits": self.hits,
            "misses": self.misses,
            "total_requests": total,
            "hit_rate_percentage": round((self.hits / total * 100) if total > 0 else 0, 2),
            "redis_available": self.available,
            "memory_cache_size": len(self.memory_cache)
        }
    
    def prepare_tenant(self, tenant_id: str):
        self.invalidate_tenant_cache(tenant_id)

    def _increment_stat(self, tenant_id: str, stat_type: str):
        """Increment stats in Redis"""
        if self._check_redis():
            try:
                key = f"stats:{tenant_id}:{stat_type}"
                self.redis_client.incr(key)
            except Exception:
                self.available = False

    def _add_to_history(self, tenant_id: str, sql: str):
        """Add to Redis and memory history"""
        history_item = {
            "query": sql,
            "timestamp": datetime.now().isoformat(),
            "id": hashlib.md5(f"{sql}{time.time()}".encode()).hexdigest()[:8]
        }
        
        # 1. Update Memory History (Always)
        if tenant_id not in self.memory_history:
            self.memory_history[tenant_id] = []
        self.memory_history[tenant_id].insert(0, history_item)
        self.memory_history[tenant_id] = self.memory_history[tenant_id][:20]

        # 2. Try Redis
        if self._check_redis():
            try:
                key = f"history:{tenant_id}"
                json_item = json.dumps(history_item)
                self.redis_client.lpush(key, json_item)
                self.redis_client.ltrim(key, 0, 19)
            except Exception:
                self.available = False
