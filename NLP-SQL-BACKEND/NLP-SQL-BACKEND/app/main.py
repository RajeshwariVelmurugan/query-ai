from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from datetime import datetime

from app.tenant_router import router as tenant_router
from app.query_router import router as query_router
from app.auth_router import router as auth_router
from app.database import engine, Base
from app import models

# Create system database tables
Base.metadata.create_all(bind=engine)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Create FastAPI app
app = FastAPI(
    title="NLP-to-SQL Chatbot API",
    description="Backend infrastructure for multi-tenant NLP-to-SQL system",
    version="1.0.0"
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(tenant_router)
app.include_router(query_router)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "NLP-to-SQL Chatbot API",
        "status": "running",
        "version": "1.0.0",
        "endpoints": [
            "POST /api/connect-db - Connect database",
            "POST /api/ask - Ask question",
            "DELETE /api/disconnect/{tenant_id} - Disconnect",
            "GET /api/health - Health check",
            "GET /api/schema/{tenant_id} - View schema",
            "GET /api/cache/stats - Cache statistics"
        ]
    }

@app.get("/api/health")
async def api_health():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}