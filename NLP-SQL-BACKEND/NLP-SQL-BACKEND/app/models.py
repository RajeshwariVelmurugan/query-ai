from sqlalchemy import Column, Integer, String, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=True) # Nullable for Google Auth users
    full_name = Column(String)
    google_id = Column(String, unique=True, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    connections = relationship("TenantConnection", back_populates="owner")

class TenantConnection(Base):
    __tablename__ = "tenant_connections"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String, unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Encrypted fields or JSON config
    db_type = Column(String)
    host = Column(String)
    port = Column(String)
    database_name = Column(String)
    username = Column(String)
    password = Column(String) # This should be encrypted!
    
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="connections")
