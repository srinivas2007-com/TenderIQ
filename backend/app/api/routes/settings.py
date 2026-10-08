from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.core.config import settings
from app.models.models import User
from app.api.deps import get_current_user

router = APIRouter(prefix="/settings", tags=["Settings"])

class SettingsUpdate(BaseModel):
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    email_alerts: Optional[bool] = True
    auto_recalculate: Optional[bool] = True

@router.get("")
async def get_settings(current_user: User = Depends(get_current_user)):
    return {
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "openai_configured": bool(settings.OPENAI_API_KEY),
        "supabase_configured": bool(settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY),
        "environment": settings.ENVIRONMENT,
        "email_alerts": True,
        "auto_recalculate": True,
        "storage_mode": "Local / Supabase Storage Ready"
    }

@router.post("")
async def update_settings(
    settings_in: SettingsUpdate,
    current_user: User = Depends(get_current_user)
):
    if settings_in.gemini_api_key:
        settings.GEMINI_API_KEY = settings_in.gemini_api_key.strip()
    if settings_in.openai_api_key:
        settings.OPENAI_API_KEY = settings_in.openai_api_key.strip()

    return {
        "message": "Settings updated successfully",
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "openai_configured": bool(settings.OPENAI_API_KEY)
    }
