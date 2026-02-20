from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
import uuid
import logging
import time

from dependencies import get_db_service, get_schema_service, get_cleanup_service
from app.database import get_db
from app.auth_service import get_current_user
from app.models import User

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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    db_service=Depends(get_db_service),
    schema_service=Depends(get_schema_service)
):
    """Connect to a database and prepare for queries"""
    try:
        tenant_id = str(uuid.uuid4())
        logger.info(f"User {current_user.email} connecting - assigning tenant_id: {tenant_id}")
        
        success = db_service.connect(
            tenant_id=tenant_id, 
            credentials=request.dict(),
            db=db,
            user_id=current_user.id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Database connection failed. Check credentials and try again."
            )
        
        schema = schema_service.extract_and_store_schema(
            tenant_id=tenant_id, 
            user_id=current_user.id, 
            db=db
        )
        
        if not schema:
            db_service.close_connection(tenant_id, user_id=current_user.id, db=db)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
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
    db: Session = Depends(get_db),
    db_service=Depends(get_db_service),
    current_user: User = Depends(get_current_user) # Ensure only logged in users can check health
):
    """Actual database connectivity test for a specific tenant"""
    engine = db_service.get_engine(tenant_id, user_id=current_user.id, db=db)
    if not engine:
        raise HTTPException(status_code=404, detail="Tenant not connected or access denied")
    
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
    db: Session = Depends(get_db),
    cleanup_service=Depends(get_cleanup_service),
    current_user: User = Depends(get_current_user)
):
    """Disconnect database and cleanup all data"""
    try:
        logger.info(f"Disconnect request for tenant {tenant_id} from user {current_user.email}")
        
        # Verify ownership via get_engine before allowing cleanup
        engine = db_service.get_engine(tenant_id, user_id=current_user.id, db=db)
        if not engine:
            raise HTTPException(status_code=404, detail="Tenant not found or access denied")
            
        success = cleanup_service.cleanup_tenant(tenant_id, user_id=current_user.id, db=db)
        
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
