
import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "TenderIQ AI"
    TAGLINE: str = "Know Before You Bid."
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"
    
    # Environment
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "bidready-ai-production-super-secret-key-change-in-prod-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./bidready.db"
    
    # Supabase (optional production credentials)
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    
    # AI LLM Keys
    GEMINI_API_KEY: Optional[str] = "REDACTED_API_KEY"
    OPENAI_API_KEY: Optional[str] = None
    
    # Storage
    STORAGE_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
    MAX_FILE_SIZE_MB: int = 50

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_DIR, "tenders"), exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_DIR, "company_docs"), exist_ok=True)
