from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional

class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Redis configuration
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Encryption
    ENCRYPTION_KEY: str
    
    # Google Auth
    GOOGLE_CLIENT_ID: Optional[str] = None
    
    # Environment
    ENVIRONMENT: str = "development"
    
    # API settings
    API_TITLE: str = "NLP-to-SQL Chatbot API"
    API_VERSION: str = "1.0.0"
    
    # CORS settings (for frontend)
    ALLOWED_ORIGINS: str = "*"
    
    # Cache settings
    CACHE_TTL_SECONDS: int = 300
    
    # Auth settings
    SECRET_KEY: str = "your-secret-key-change-it-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200 # 30 days
    
    # Database connection pool settings
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    """Create cached instance of settings"""
    return Settings()

# Create global settings instance
settings = get_settings()