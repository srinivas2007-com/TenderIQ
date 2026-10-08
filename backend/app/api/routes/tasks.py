from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.models.models import User, Company, BidTask, Tender
from app.schemas.schemas import BidTaskOut, BidTaskCreate, BidTaskUpdate
from app.api.deps import get_current_user

router = APIRouter(prefix="/tasks", tags=["Bid Tasks"])

@router.get("", response_model=List[BidTaskOut])
async def list_tasks(
    tender_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    comp_res = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = comp_res.scalars().first()

    stmt = (
        select(BidTask)
        .join(Tender, BidTask.tender_id == Tender.id)
        .where(Tender.user_id == current_user.id)
        .order_by(BidTask.created_at.desc())
    )
    if tender_id:
        stmt = stmt.where(BidTask.tender_id == tender_id)
    if status:
        stmt = stmt.where(BidTask.status == status.upper())
    if category:
        stmt = stmt.where(BidTask.category == category)

    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("", response_model=BidTaskOut)
async def create_task(
    task_in: BidTaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify tender ownership
    t_res = await db.execute(select(Tender).where(Tender.id == task_in.tender_id, Tender.user_id == current_user.id))
    if not t_res.scalars().first():
        raise HTTPException(status_code=404, detail="Tender not found or unauthorized.")

    comp_res = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = comp_res.scalars().first()

    task = BidTask(
        tender_id=task_in.tender_id,
        company_id=company.id if company else None,
        title=task_in.title,
        description=task_in.description,
        category=task_in.category or "Documentation",
        assignee_name=task_in.assignee_name,
        assignee_role=task_in.assignee_role or "Bid Manager",
        priority=task_in.priority or "MEDIUM",
        status="TODO",
        due_date=task_in.due_date,
        is_ai_generated=False
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task

@router.put("/{task_id}", response_model=BidTaskOut)
async def update_task(
    task_id: str,
    task_in: BidTaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(BidTask)
        .join(Tender, BidTask.tender_id == Tender.id)
        .where(BidTask.id == task_id, Tender.user_id == current_user.id)
    )
    res = await db.execute(stmt)
    task = res.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    if task_in.title is not None: task.title = task_in.title
    if task_in.description is not None: task.description = task_in.description
    if task_in.category is not None: task.category = task_in.category
    if task_in.assignee_name is not None: task.assignee_name = task_in.assignee_name
    if task_in.assignee_role is not None: task.assignee_role = task_in.assignee_role
    if task_in.priority is not None: task.priority = task_in.priority
    if task_in.status is not None: task.status = task_in.status.upper()
    if task_in.due_date is not None: task.due_date = task_in.due_date

    await db.commit()
    await db.refresh(task)
    return task

@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(BidTask)
        .join(Tender, BidTask.tender_id == Tender.id)
        .where(BidTask.id == task_id, Tender.user_id == current_user.id)
    )
    res = await db.execute(stmt)
    task = res.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    await db.delete(task)
    await db.commit()
    return {"message": "Task removed successfully"}
