from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or session expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")
    return user

async def get_current_user_company(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    import uuid
    from app.models.models import Company
    result = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = result.scalars().first()
    if not company:
        company = Company(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            name=current_user.full_name or "My Enterprise",
            company_type="Private Limited Company",
            industry="Civil Construction & Infrastructure",
            country="India",
            annual_turnover=0.0,
            average_turnover=0.0,
            years_in_business=0,
            relevant_experience_years=0,
            completed_projects_count=0,
            workforce_count=0,
            engineers_count=0,
            certifications=[],
            completeness_percentage=10,
            missing_items=[
                "Financial statements & turnover",
                "Years of experience",
                "Certifications (ISO/MSME)",
                "GST & PAN verification"
            ],
            is_sample=False
        )
        db.add(company)
        await db.commit()
        await db.refresh(company)
    return company

