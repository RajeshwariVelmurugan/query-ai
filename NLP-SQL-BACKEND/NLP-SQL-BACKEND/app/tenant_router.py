from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import uuid
import logging
import time

from dependencies import get_db_service, get_schema_service, get_cleanup_service
from core.encryption import encrypt_data, decrypt_data

router = APIRouter(prefix="/api", tags=["tenant"])
logger = logging.getLogger(__name__)

class DBConnectRequest(BaseModel):
    db_type: str
    host: str
    port: str
    username: str
    password: str
    database: str

class DBConnectResponse(BaseModel):
    tenant_id: str
    status: str
    message: str = ""

class DisconnectResponse(BaseModel):
    status: str
    message: str = ""

@router.post("/connect-db", response_model=DBConnectResponse)
async def connect_database(
    request: DBConnectRequest,
    db_service=Depends(get_db_service),
    schema_service=Depends(get_schema_service)
):
    """Connect to a database and prepare for queries"""
    try:
        tenant_id = str(uuid.uuid4())
        logger.info(f"New connection request - assigning tenant_id: {tenant_id}")
        
        success = db_service.connect(tenant_id, request.dict())
        
        if not success:
            raise HTTPException(
                status_code=400, 
                detail="Database connection failed. Check credentials and try again."
            )
        
        schema = schema_service.extract_and_store_schema(tenant_id)
        
        if not schema:
            db_service.close_connection(tenant_id)
            raise HTTPException(
                status_code=400,
                detail="Could not extract database schema. Check permissions."
            )
        
        table_count = len(schema)
        logger.info(f"✅ Tenant {tenant_id} connected with {table_count} tables")
        
        return DBConnectResponse(
            tenant_id=tenant_id,
            status="connected",
            message=f"Connected to {request.db_type} database with {table_count} tables"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/health/{tenant_id}")
async def check_tenant_health(
    tenant_id: str,
    db_service=Depends(get_db_service)
):
    """Actual database connectivity test for a specific tenant"""
    engine = db_service.get_engine(tenant_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Tenant not connected")
    
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            start = time.time()
            conn.execute(text("SELECT 1"))
            latency = round((time.time() - start) * 1000, 2)
            
        return {
            "status": "connected",
            "latency": latency,
            "tenant_id": tenant_id
        }
    except Exception as e:
        logger.error(f"Health check failed for tenant {tenant_id}: {e}")
        return {
            "status": "disconnected",
            "error": str(e),
            "tenant_id": tenant_id
        }

@router.delete("/disconnect/{tenant_id}", response_model=DisconnectResponse)
async def disconnect_database(
    tenant_id: str,
    cleanup_service=Depends(get_cleanup_service)
):
    """Disconnect database and cleanup all data"""
    try:
        logger.info(f"Disconnect request for tenant {tenant_id}")
        success = cleanup_service.cleanup_tenant(tenant_id)
        
        if not success:
            raise HTTPException(
                status_code=400,
                detail="Cleanup failed partially. Check logs."
            )
        
        return DisconnectResponse(
            status="disconnected",
            message="All tenant data cleaned up successfully"
        )
        
    except Exception as e:
        logger.error(f"Disconnect error: {e}")
        raise HTTPException(status_code=500, detail=str(e))