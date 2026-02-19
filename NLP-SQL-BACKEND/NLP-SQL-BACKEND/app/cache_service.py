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
    Manages Redis caching for query results
    """
    
    def __init__(self):
        self.redis_client = redis.Redis.from_url(settings.REDIS_URL)
        self.hits = 0
        self.misses = 0
        logger.info(f"CacheManager connected to Redis at {settings.REDIS_URL}")
    
    def _generate_key(self, tenant_id: str, sql: str) -> str:
        """Generate unique cache key from tenant and SQL"""
        normalized_sql = ' '.join(sql.lower().split())
        sql_hash = hashlib.sha256(normalized_sql.encode()).hexdigest()[:16]
        return f"{tenant_id}:{sql_hash}"
    
    def get_cached_result(self, tenant_id: str, sql: str) -> Optional[Any]:
        """Get cached result if exists"""
        key = self._generate_key(tenant_id, sql)
        
        try:
            result = self.redis_client.get(key)
            
            if result:
                self.hits += 1
                self._increment_stat(tenant_id, "hits")
                logger.info(f"✅ Cache HIT for {key}")
                return json.loads(result)
            else:
                self.misses += 1
                self._increment_stat(tenant_id, "misses")
                logger.info(f"❌ Cache MISS for {key}")
                return None
                
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            self.misses += 1
            return None
    
    def cache_result(self, tenant_id: str, sql: str, result: Any, ttl: int = 300):
        """Store result in cache"""
        key = self._generate_key(tenant_id, sql)
        
        try:
            json_result = json.dumps(result, default=self._json_serializer)
            self.redis_client.setex(key, ttl, json_result)
            logger.info(f"💾 Cached result for {key} (TTL: {ttl}s)")
            
            # Add to history
            self._add_to_history(tenant_id, sql)
        except Exception as e:
            logger.error(f"Cache set error: {e}")

    def _increment_stat(self, tenant_id: str, stat_type: str):
        """Increment per-tenant statistics"""
        try:
            key = f"stats:{tenant_id}:{stat_type}"
            self.redis_client.incr(key)
        except Exception as e:
            logger.error(f"Failed to increment stat: {e}")

    def _add_to_history(self, tenant_id: str, sql: str):
        """Add query to tenant history"""
        try:
            key = f"history:{tenant_id}"
            history_item = json.dumps({
                "query": sql,
                "timestamp": datetime.now().isoformat(),
                "id": hashlib.md5(f"{sql}{time.time()}".encode()).hexdigest()[:8]
            })
            self.redis_client.lpush(key, history_item)
            self.redis_client.ltrim(key, 0, 19) # Keep last 20 queries
        except Exception as e:
            logger.error(f"History log error: {e}")

    def get_tenant_stats(self, tenant_id: str) -> dict:
        """Get per-tenant statistics"""
        try:
            hits = int(self.redis_client.get(f"stats:{tenant_id}:hits") or 0)
            misses = int(self.redis_client.get(f"stats:{tenant_id}:misses") or 0)
            total = hits + misses
            hit_rate = (hits / total * 100) if total > 0 else 0
            
            return {
                "hits": hits,
                "misses": misses,
                "total_queries": total,
                "hit_rate_percentage": round(hit_rate, 2)
            }
        except Exception as e:
            logger.error(f"Failed to get tenant stats: {e}")
            return {"hits": 0, "misses": 0, "total_queries": 0, "hit_rate_percentage": 0}

    def get_tenant_history(self, tenant_id: str) -> list:
        """Get recent queries for a tenant"""
        try:
            key = f"history:{tenant_id}"
            items = self.redis_client.lrange(key, 0, 19)
            return [json.loads(item) for item in items]
        except Exception as e:
            logger.error(f"Failed to get tenant history: {e}")
            return []
    
    def _json_serializer(self, obj):
        """Handle datetime objects for JSON"""
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        raise TypeError(f"Type {type(obj)} not serializable")
    
    def invalidate_tenant_cache(self, tenant_id: str):
        """Delete ALL cache entries for a tenant"""
        try:
            patterns = [f"{tenant_id}:*", f"stats:{tenant_id}:*", f"history:{tenant_id}*"]
            deleted_total = 0
            for pattern in patterns:
                cursor = 0
                while True:
                    cursor, keys = self.redis_client.scan(cursor=cursor, match=pattern, count=100)
                    if keys:
                        deleted_total += len(keys)
                        self.redis_client.delete(*keys)
                    if cursor == 0:
                        break
            
            logger.info(f"🧹 Deleted {deleted_total} keys for tenant {tenant_id}")
            return deleted_total
        except Exception as e:
            logger.error(f"Cache invalidation error: {e}")
            return 0
    
    def get_stats(self):
        """Get global cache hit/miss statistics"""
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100) if total > 0 else 0
        return {
            "hits": self.hits,
            "misses": self.misses,
            "total_requests": total,
            "hit_rate_percentage": round(hit_rate, 2)
        }
    
    def prepare_tenant(self, tenant_id: str):
        """Prepare cache namespace for a new tenant"""
        count = self.invalidate_tenant_cache(tenant_id)
        logger.info(f"Prepared cache for tenant {tenant_id} (Purged {count} legacy keys)")
