from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
import pymongo
from typing import Dict, Optional, List, Any
import logging
from .models import TenantConnection
from core.encryption import encrypt_data, decrypt_data

logger = logging.getLogger(__name__)

class DatabaseConnectionManager:
    """
    Manages database connections for multiple tenants with persistence.
    """
    
    def __init__(self):
        self.connections: Dict[str, any] = {}
        logger.info("DatabaseConnectionManager initialized")
    
    def connect(self, tenant_id: str, credentials: dict, db: Session, user_id: int) -> bool:
        """
        Connect to a database, store it in memory, and persist encrypted credentials to system DB.
        """
        try:
            db_type = credentials['db_type']
            host = credentials['host']
            port = credentials['port']
            username = credentials['username']
            password = credentials['password']
            database = credentials.get('database', '')
            
            # 1. Try to establish connection first
            if db_type == 'mysql':
                conn_str = f"mysql+pymysql://{username}:{password}@{host}:{port}/{database}"
                engine = create_engine(
                    conn_str,
                    pool_size=5,
                    max_overflow=10,
                    pool_pre_ping=True
                )
                with engine.connect() as conn:
                    conn.execute(text("SELECT 1"))
            elif db_type == 'postgresql':
                conn_str = f"postgresql://{username}:{password}@{host}:{port}/{database}"
                engine = create_engine(
                    conn_str,
                    pool_size=5,
                    max_overflow=10,
                    pool_pre_ping=True
                )
                with engine.connect() as conn:
                    conn.execute(text("SELECT 1"))
            elif db_type == 'mongodb':
                # MongoDB connection string
                if username and password:
                    conn_str = f"mongodb://{username}:{password}@{host}:{port}/{database}"
                else:
                    conn_str = f"mongodb://{host}:{port}/{database}"
                
                engine = pymongo.MongoClient(conn_str, serverSelectionTimeoutMS=5000)
                # Verify connection
                engine.admin.command('ping')
            else:
                logger.error(f"Unsupported database type: {db_type}")
                return False
            
            # 2. Persist to System DB (Upsert logic)
            # Find connection belonging ONLY to this user
            existing_conn = db.query(TenantConnection).filter(
                TenantConnection.tenant_id == tenant_id,
                TenantConnection.user_id == user_id
            ).first()
            
            encrypted_password = encrypt_data(password)
            
            if existing_conn:
                existing_conn.db_type = db_type
                existing_conn.host = host
                existing_conn.port = port
                existing_conn.database_name = database
                existing_conn.username = username
                existing_conn.password = encrypted_password
            else:
                new_conn = TenantConnection(
                    tenant_id=tenant_id,
                    user_id=user_id,
                    db_type=db_type,
                    host=host,
                    port=port,
                    database_name=database,
                    username=username,
                    password=encrypted_password
                )
                db.add(new_conn)
            
            db.commit()
            
            # 3. Store in Memory
            self.connections[tenant_id] = engine
            logger.info(f"✅ Tenant {tenant_id} connected and persisted for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Connection failed for tenant {tenant_id}: {e}")
            return False
    
    def get_engine(self, tenant_id: str, user_id: int, db: Session):
        """
        Get the database engine for a tenant. 
        REQUIRES user_id to verify ownership in system DB.
        """
        # 1. Check Memory Cache
        # Note: We still check existence in DB to verify ownership even if in memory
        # to prevent unauthorized access via UUID poaching.
        
        conn_record = db.query(TenantConnection).filter(
            TenantConnection.tenant_id == tenant_id,
            TenantConnection.user_id == user_id
        ).first()

        if not conn_record:
            logger.warning(f"🚫 Access denied for user {user_id} to tenant {tenant_id}")
            return None

        # 2. If in memory, return it
        if tenant_id in self.connections:
            return self.connections[tenant_id]
        
        # 3. Restore connection if not in memory
        logger.info(f"Restoring connection for tenant {tenant_id} (owner: {user_id})")
        credentials = {
            'db_type': conn_record.db_type,
            'host': conn_record.host,
            'port': conn_record.port,
            'username': conn_record.username,
            'password': decrypt_data(conn_record.password),
            'database': conn_record.database_name
        }
        self.connect(tenant_id, credentials, db, user_id)
        return self.connections.get(tenant_id)
    
    def close_connection(self, tenant_id: str, user_id: Optional[int] = None, db: Optional[Session] = None):
        """Close database connection and optionally remove from persistence"""
        if tenant_id in self.connections:
            conn = self.connections[tenant_id]
            if isinstance(conn, pymongo.MongoClient):
                conn.close()
            else:
                conn.dispose()
            del self.connections[tenant_id]
            
        if db and user_id:
            db.query(TenantConnection).filter(
                TenantConnection.tenant_id == tenant_id,
                TenantConnection.user_id == user_id
            ).delete()
            db.commit()
            
        logger.info(f"🔌 Connection closed for tenant {tenant_id} (user: {user_id})")
        return True
    
    def get_active_connections(self):
        """Return list of active tenant IDs in memory"""
        return list(self.connections.keys())
