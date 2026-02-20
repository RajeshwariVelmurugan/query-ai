from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from sqlalchemy import text
import logging
import time
import re
from typing import List, Dict, Any, Optional

from dependencies import get_db_service, get_schema_service, get_cache_service, get_query_service
from app.database import get_db
from app.auth_service import get_current_user
from app.models import User, TenantConnection

router = APIRouter(prefix="/api", tags=["query"])
logger = logging.getLogger(__name__)

class AskRequest(BaseModel):
    tenant_id: str
    question: str

class AskResponse(BaseModel):
    answer: List[Dict[Any, Any]]
    sql: Optional[str]
    execution_time: str
    cache_hit: bool
    error: Optional[str] = None

@router.post("/ask", response_model=AskResponse)
async def ask_question(
    request: AskRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    query_service=Depends(get_query_service)
):
    try:
        result = query_service.ask(
            tenant_id=request.tenant_id, 
            question=request.question, 
            user_id=current_user.id,
            db=db
        )
        
        return AskResponse(
            answer=result.get("answer", []),
            sql=result.get("sql"),
            execution_time=result.get("execution_time", "0s"),
            cache_hit=result.get("cache_hit", False),
            error=result.get("error")
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Query error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/schema/{tenant_id}")
async def get_tenant_schema(
    tenant_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    db_service = Depends(get_db_service),
    schema_service = Depends(get_schema_service)
):
    # 1. Try to get schema from cache
    schema = schema_service.get_schema(tenant_id)
    
    # 2. If not in memory (e.g. server restart), re-extract it
    if schema is None:
        logger.info(f"Schema not in memory for tenant {tenant_id}, re-extracting...")
        schema = schema_service.extract_and_store_schema(tenant_id, current_user.id, db)
    
    # 3. Get connection metadata for UI context
    conn_record = db.query(TenantConnection).filter(
        TenantConnection.tenant_id == tenant_id,
        TenantConnection.user_id == current_user.id
    ).first()

    return {
        "tenant_id": tenant_id, 
        "schema": schema,
        "db_type": conn_record.db_type if conn_record else None,
        "database_name": conn_record.database_name if conn_record else None,
        "host": conn_record.host if conn_record else None
    }

@router.get("/cache/stats")
async def get_cache_stats(
    cache_service=Depends(get_cache_service)
):
    return cache_service.get_stats()

@router.get("/stats/{tenant_id}")
async def get_tenant_stats(
    tenant_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    db_service = Depends(get_db_service),
    cache_service=Depends(get_cache_service)
):
    """Get real-time statistics for a specific tenant"""
    # Verify ownership
    engine = db_service.get_engine(tenant_id, user_id=current_user.id, db=db)
    if not engine:
        raise HTTPException(status_code=404, detail="Tenant not found or access denied")
        
    return cache_service.get_tenant_stats(tenant_id)

@router.get("/history/{tenant_id}")
async def get_tenant_history(
    tenant_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    db_service = Depends(get_db_service)
):
    """Get recent query history for a specific tenant from database"""
    # Verify ownership
    engine = db_service.get_engine(tenant_id, user_id=current_user.id, db=db)
    if not engine:
        raise HTTPException(status_code=404, detail="Tenant not connected or access denied")
        
    from app.models import QueryHistory
    history = db.query(QueryHistory).filter(
        QueryHistory.tenant_id == tenant_id,
        QueryHistory.user_id == current_user.id
    ).order_by(QueryHistory.created_at.desc()).limit(20).all()

    return [
        {
            "id": h.id,
            "query": h.question, # Frontend expects 'query' to be the NL question
            "sql": h.query_text,
            "timestamp": h.created_at.isoformat()
        } for h in history
    ]