"""
Dependency Injection container
Creates single instances of services to be shared across the app
"""

from app.db_service import DatabaseConnectionManager
from app.schema_service import SchemaExtractor
from app.cache_service import CacheManager
from app.cleanup_service import CleanupService
from app.services.nlp.query_service import QueryService

# Create singleton instances
db_service = DatabaseConnectionManager()
cache_service = CacheManager()
schema_service = SchemaExtractor(db_service)
cleanup_service = CleanupService(db_service, schema_service, cache_service)
query_service = QueryService(db_service, schema_service, cache_service)

# Dependency functions for FastAPI
def get_db_service():
    """Dependency to get DB service instance"""
    return db_service

def get_cache_service():
    """Dependency to get cache service instance"""
    return cache_service

def get_schema_service():
    """Dependency to get schema service instance"""
    return schema_service

def get_cleanup_service():
    """Dependency to get cleanup service instance"""
    return cleanup_service

def get_query_service():
    """Dependency to get Query service instance"""
    return query_service