from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.models.models import User, Company, TeamMember
from app.schemas.schemas import TeamMemberOut, TeamMemberCreate, TeamMemberUpdate
from app.api.deps import get_current_user

router = APIRouter(prefix="/team", tags=["Team Management"])

@router.get("", response_model=List[TeamMemberOut])
async def list_team_members(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    comp_res = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = comp_res.scalars().first()
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found.")

    res = await db.execute(select(TeamMember).where(TeamMember.company_id == company.id))
    members = res.scalars().all()

    # If no team members exist yet, seed standard role members for enterprise experience
    if not members:
        defaults = [
            {"name": current_user.full_name or "Bid Manager", "email": current_user.email, "role": "Bid Manager", "hours": 40.0},
            {"name": "Lead Solutions Architect", "email": "tech@company.in", "role": "Technical", "hours": 40.0},
            {"name": "Senior Commercial Analyst", "email": "finance@company.in", "role": "Finance", "hours": 35.0},
            {"name": "Compliance & Tenders Officer", "email": "docs@company.in", "role": "Documentation", "hours": 40.0}
        ]
        for d in defaults:
            tm = TeamMember(
                company_id=company.id,
                name=d["name"],
                email=d["email"],
                role=d["role"],
                allocated_hours_weekly=d["hours"]
            )
            db.add(tm)
        await db.commit()
        res = await db.execute(select(TeamMember).where(TeamMember.company_id == company.id))
        members = res.scalars().all()

    return members

@router.post("", response_model=TeamMemberOut)
async def create_team_member(
    member_in: TeamMemberCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    comp_res = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = comp_res.scalars().first()
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found.")

    tm = TeamMember(
        company_id=company.id,
        name=member_in.name,
        email=member_in.email,
        role=member_in.role or "Technical",
        allocated_hours_weekly=member_in.allocated_hours_weekly or 40.0
    )
    db.add(tm)
    await db.commit()
    await db.refresh(tm)
    return tm

@router.put("/{member_id}", response_model=TeamMemberOut)
async def update_team_member(
    member_id: str,
    member_in: TeamMemberUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    comp_res = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = comp_res.scalars().first()
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found.")

    res = await db.execute(
        select(TeamMember).where(TeamMember.id == member_id, TeamMember.company_id == company.id)
    )
    tm = res.scalars().first()
    if not tm:
        raise HTTPException(status_code=404, detail="Team member not found.")

    if member_in.name is not None: tm.name = member_in.name
    if member_in.email is not None: tm.email = member_in.email
    if member_in.role is not None: tm.role = member_in.role
    if member_in.allocated_hours_weekly is not None: tm.allocated_hours_weekly = member_in.allocated_hours_weekly

    await db.commit()
    await db.refresh(tm)
    return tm

@router.delete("/{member_id}")
async def delete_team_member(
    member_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    comp_res = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = comp_res.scalars().first()
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found.")

    res = await db.execute(
        select(TeamMember).where(TeamMember.id == member_id, TeamMember.company_id == company.id)
    )
    tm = res.scalars().first()
    if not tm:
        raise HTTPException(status_code=404, detail="Team member not found.")

    await db.delete(tm)
    await db.commit()
    return {"message": "Team member removed successfully"}
