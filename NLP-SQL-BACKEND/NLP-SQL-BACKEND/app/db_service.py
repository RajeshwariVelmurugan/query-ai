from sqlalchemy import create_engine, text
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

class DatabaseConnectionManager:
    """
    Manages database connections for multiple tenants.
    """
    
    def __init__(self):
        self.connections: Dict[str, any] = {}
        self.credentials: Dict[str, dict] = {}
        logger.info("DatabaseConnectionManager initialized")
    
    def connect(self, tenant_id: str, credentials: dict) -> bool:
        """
        Connect to a database and store the connection
        """
        try:
            db_type = credentials['db_type']
            host = credentials['host']
            port = credentials['port']
            username = credentials['username']
            password = credentials['password']
            database = credentials.get('database', '')
            
            if db_type == 'mysql':
                conn_str = f"mysql+pymysql://{username}:{password}@{host}:{port}/{database}"
                logger.info(f"Connecting to MySQL at {host}:{port}/{database}")
            elif db_type == 'postgresql':
                conn_str = f"postgresql://{username}:{password}@{host}:{port}/{database}"
                logger.info(f"Connecting to PostgreSQL at {host}:{port}/{database}")
            else:
                logger.error(f"Unsupported database type: {db_type}")
                return False
            
            engine = create_engine(
                conn_str,
                pool_size=5,
                max_overflow=10,
                pool_pre_ping=True,
                echo=False
            )
            
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                logger.info(f"Connection test successful for tenant {tenant_id}")
            
            self.connections[tenant_id] = engine
            self.credentials[tenant_id] = credentials
            
            logger.info(f"✅ Tenant {tenant_id} connected successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Connection failed for tenant {tenant_id}: {e}")
            return False
    
    def get_engine(self, tenant_id: str):
        """Get the database engine for a tenant"""
        return self.connections.get(tenant_id)
    
    def close_connection(self, tenant_id: str):
        """Close database connection for a tenant"""
        if tenant_id in self.connections:
            self.connections[tenant_id].dispose()
            del self.connections[tenant_id]
            if tenant_id in self.credentials:
                del self.credentials[tenant_id]
            logger.info(f"🔌 Connection closed for tenant {tenant_id}")
            return True
        return False
    
    def get_active_connections(self):
        """Return list of active tenant IDs"""
        return list(self.connections.keys())