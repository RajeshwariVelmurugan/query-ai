from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
import logging
import time
import re
from typing import List, Dict, Any, Optional

from dependencies import get_db_service, get_schema_service, get_cache_service, get_query_service

router = APIRouter(prefix="/api", tags=["query"])
logger = logging.getLogger(__name__)

class AskRequest(BaseModel):
    tenant_id: str
    question: str

class AskResponse(BaseModel):
    answer: List[Dict[str, Any]]
    sql: Optional[str]
    execution_time: str
    cache_hit: bool
    error: Optional[str] = None

@router.post("/ask", response_model=AskResponse)
async def ask_question(
    request: AskRequest,
    query_service=Depends(get_query_service)
):
    try:
        result = query_service.ask(request.tenant_id, request.question)
        
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
    schema_service=Depends(get_schema_service)
):
    schema = schema_service.get_schema(tenant_id)
    if not schema:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return {"tenant_id": tenant_id, "schema": schema}

@router.get("/cache/stats")
async def get_cache_stats(
    cache_service=Depends(get_cache_service)
):
    return cache_service.get_stats()

@router.get("/stats/{tenant_id}")
async def get_tenant_stats(
    tenant_id: str,
    cache_service=Depends(get_cache_service)
):
    """Get real-time statistics for a specific tenant"""
    return cache_service.get_tenant_stats(tenant_id)

@router.get("/history/{tenant_id}")
async def get_tenant_history(
    tenant_id: str,
    cache_service=Depends(get_cache_service)
):
    """Get recent query history for a specific tenant"""
    return cache_service.get_tenant_history(tenant_id)