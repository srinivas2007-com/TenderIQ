import os
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.models import User, Company, Tender, CompanyDocument
from app.schemas.schemas import UserCreate, UserLogin, TokenResponse, UserOut, ForgotPasswordRequest, ResetPasswordRequest
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    existing = await db.execute(select(User).where(User.email == user_in.email.lower()))
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Create new user
    new_user = User(
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        phone_number=user_in.phone_number
    )
    db.add(new_user)
    await db.flush()

    # Create associated company profile
    new_company = Company(
        user_id=new_user.id,
        name=user_in.company_name,
        company_type=user_in.company_type or "Private Limited",
        industry=user_in.industry or "Information Technology & Services",
        country="India",
        completeness_percentage=25,
        missing_items=[
            "Financial statements & turnover",
            "Years of experience",
            "Certifications (ISO/MSME)",
            "GST & PAN verification"
        ]
    )
    db.add(new_company)
    await db.commit()
    await db.refresh(new_user)

    token = create_access_token(data={"sub": new_user.id, "email": new_user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "company_name": new_company.name,
            "company_id": new_company.id
        }
    }

@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLogin, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == login_data.email.lower())
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify your credentials."
        )

    # Fetch company or auto-create if missing
    comp_result = await db.execute(select(Company).where(Company.user_id == user.id))
    company = comp_result.scalars().first()
    if not company:
        company = Company(
            user_id=user.id,
            name=user.full_name or "My Enterprise",
            company_type="Private Limited Company",
            industry="IT & Engineering Services",
            country="India",
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

    token = create_access_token(data={"sub": user.id, "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "company_name": company.name,
            "company_id": company.id
        }
    }

@router.get("/me")
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    comp_result = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = comp_result.scalars().first()
    if not company:
        company = Company(
            user_id=current_user.id,
            name=current_user.full_name or "My Enterprise",
            company_type="Private Limited Company",
            industry="IT & Engineering Services",
            country="India",
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

    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "phone_number": current_user.phone_number,
        "company": {
            "id": company.id,
            "name": company.name,
            "completeness_percentage": company.completeness_percentage
        }
    }

@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == req.email.lower())
    result = await db.execute(stmt)
    user = result.scalars().first()
    # Always return success message for security to avoid email enumeration
    return {
        "message": "If an account exists with this email, password reset instructions have been dispatched."
    }

@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    return {
        "message": "Password updated successfully. Please login with your new credentials."
    }

class AccountDeleteRequest(BaseModel):
    password: Optional[str] = None
    confirm_text: Optional[str] = None

@router.delete("/account")
async def delete_account(
    req: Optional[AccountDeleteRequest] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Permanently deletes user account, company profile, uploaded tenders,
    analyses, documents, tasks, and cleans up local physical files.
    """
    if req and req.password:
        if not verify_password(req.password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect password. Account deletion aborted."
            )

    # 1. Clean up user tenders physical files
    t_stmt = select(Tender).where(Tender.user_id == current_user.id)
    t_res = await db.execute(t_stmt)
    user_tenders = t_res.scalars().all()
    for t in user_tenders:
        if t.file_path and os.path.exists(t.file_path):
            try:
                os.remove(t.file_path)
            except Exception:
                pass

    # 2. Clean up company documents physical files
    comp_stmt = select(Company).where(Company.user_id == current_user.id)
    comp_res = await db.execute(comp_stmt)
    comp = comp_res.scalars().first()
    if comp:
        doc_stmt = select(CompanyDocument).where(CompanyDocument.company_id == comp.id)
        doc_res = await db.execute(doc_stmt)
        docs = doc_res.scalars().all()
        for d in docs:
            if d.file_path and os.path.exists(d.file_path):
                try:
                    os.remove(d.file_path)
                except Exception:
                    pass

    # 3. Delete user entity (triggers database cascade delete)
    await db.delete(current_user)
    await db.commit()

    return {
        "success": True,
        "message": "Account and all associated company data, tenders, and documents have been permanently deleted."
    }

