from typing import Optional
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)

class CleanupService:
    """
    Orchestrates complete cleanup when tenant disconnects
    """
    
    def __init__(self, db_service, schema_service, cache_service):
        self.db_service = db_service
        self.schema_service = schema_service
        self.cache_service = cache_service
        logger.info("CleanupService initialized")
    
    def cleanup_tenant(self, tenant_id: str, user_id: Optional[int] = None, db: Optional[Session] = None) -> bool:
        """Perform complete cleanup for a tenant"""
        logger.info(f"Starting cleanup for tenant {tenant_id} (user {user_id})")
        
        try:
            logger.info(f"Step 1/3: Clearing cache...")
            self.cache_service.invalidate_tenant_cache(tenant_id)
            
            logger.info(f"Step 2/3: Removing schema...")
            self.schema_service.remove_schema(tenant_id)
            
            logger.info(f"Step 3/4: Closing database connection...")
            self.db_service.close_connection(tenant_id, user_id=user_id, db=db)
            
            logger.info(f"Step 4/4: Wiping query history...")
            if db:
                from app.models import QueryHistory
                db.query(QueryHistory).filter(QueryHistory.tenant_id == tenant_id).delete()
                db.commit()
            
            logger.info(f"✅ Complete cleanup finished for tenant {tenant_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Cleanup failed for tenant {tenant_id}: {e}")
            return False
    
    def cleanup_all(self, db: Optional[Session] = None):
        """Cleanup ALL tenants"""
        tenants = self.db_service.get_active_connections()
        results = {}
        for tenant_id in tenants:
            results[tenant_id] = self.cleanup_tenant(tenant_id, user_id=None, db=db)
        logger.info(f"Cleaned up {len(tenants)} tenants")
        return results