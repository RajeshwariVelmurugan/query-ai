from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from .database import get_db
from . import models, auth_service
from pydantic import BaseModel, EmailStr
from datetime import timedelta
from typing import Optional

router = APIRouter(prefix="/api/auth", tags=["auth"])

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserResponse(BaseModel):
    email: str
    full_name: str
    id: int

    model_config = {
        "from_attributes": True
    }

class Token(BaseModel):
    access_token: str
    token_type: str

class GoogleAuthRequest(BaseModel):
    token: str

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pass = auth_service.get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        hashed_password=hashed_pass,
        full_name=user.full_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth_service.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth_service.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/google", response_model=Token)
async def google_auth(request: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Authenticate with Google ID Token.
    Synchronously verifies token and returns application access token.
    """
    # 1. Verify Google Token
    idinfo = auth_service.verify_google_token(request.token)
    
    if not idinfo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token"
        )
    
    email = idinfo['email']
    full_name = idinfo.get('name', 'Google User')
    google_id = idinfo['sub']
    
    # 2. Upsert User
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        # Create new user for first-time Google login
        user = models.User(
            email=email,
            full_name=full_name,
            google_id=google_id,
            hashed_password="" # No password for Google-only users
        )
        db.add(user)
    else:
        # Link Google ID if not already linked
        if not user.google_id:
            user.google_id = google_id
            
    db.commit()
    db.refresh(user)
    
    # 3. Issue JWT
    access_token = auth_service.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
