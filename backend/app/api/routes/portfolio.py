from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.models import User, Company, Tender, TenderResourceRequirement, TenderProfitScenario
from app.schemas.schemas import PortfolioOptimizeRequest
from app.api.deps import get_current_user
from app.services.portfolio_optimizer import PortfolioOptimizer
from app.services.resource_engine import ResourceEngine

router = APIRouter(prefix="/portfolio", tags=["Portfolio Optimizer"])

@router.get("")
async def get_portfolio_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    comp_res = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = comp_res.scalars().first()

    stmt = (
        select(Tender)
        .options(
            selectinload(Tender.analysis),
            selectinload(Tender.resource_requirement),
            selectinload(Tender.profit_scenario),
            selectinload(Tender.risks)
        )
        .where(Tender.user_id == current_user.id)
        .order_by(Tender.opportunity_score.desc())
    )
    res = await db.execute(stmt)
    tenders = res.scalars().all()

    total_value = sum(t.estimated_value or 0.0 for t in tenders)
    total_profit = sum(t.expected_profit or 0.0 for t in tenders)
    avg_margin = (total_profit / total_value * 100) if total_value > 0 else 0.0

    tender_list = []
    active_resource_demands = []

    for t in tenders:
        req_eng = t.resource_requirement.required_engineers if t.resource_requirement else 2
        prep_hrs = t.bid_effort_hours or 40.0
        tender_list.append({
            "id": t.id,
            "title": t.title,
            "organization": t.organization or "Procuring Entity",
            "estimated_value": t.estimated_value or 0.0,
            "estimated_value_display": t.estimated_value_display or "As per NIT",
            "opportunity_score": t.opportunity_score,
            "opportunity_verdict": t.opportunity_verdict,
            "expected_profit": t.expected_profit or 0.0,
            "profit_margin": t.profit_margin or 0.0,
            "required_engineers": req_eng,
            "bid_effort_hours": prep_hrs,
            "workspace_active": t.workspace_active,
            "bid_status": t.bid_status
        })
        active_resource_demands.append({
            "id": t.id,
            "title": t.title,
            "required_engineers": req_eng,
            "preparation_hours": prep_hrs,
            "deadline_display": "Upcoming"
        })

    conflicts = ResourceEngine.detect_multi_tender_conflicts(
        active_tenders=active_resource_demands,
        company_engineers_available=company.engineers_count if company else 5,
        company_weekly_capacity_hours=company.team_capacity_hours_weekly if company else 160.0
    )

    return {
        "total_active_tenders": len(tenders),
        "combined_tender_value": round(total_value, 2),
        "combined_expected_profit": round(total_profit, 2),
        "average_expected_margin": round(avg_margin, 1),
        "company_capacity": {
            "engineers": company.engineers_count if company else 5,
            "working_capital": company.working_capital if company else 0.0,
            "weekly_hours": company.team_capacity_hours_weekly if company else 160.0
        },
        "conflicts": conflicts,
        "tenders": tender_list
    }

@router.post("/optimize")
async def optimize_tender_portfolio(
    req: PortfolioOptimizeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    comp_res = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = comp_res.scalars().first()

    stmt = (
        select(Tender)
        .options(
            selectinload(Tender.analysis),
            selectinload(Tender.resource_requirement),
            selectinload(Tender.profit_scenario)
        )
        .where(Tender.user_id == current_user.id, Tender.status == "completed")
    )
    res = await db.execute(stmt)
    tenders = res.scalars().all()

    tender_records = []
    for t in tenders:
        tender_records.append({
            "id": t.id,
            "title": t.title,
            "organization": t.organization,
            "estimated_value": t.estimated_value or 5000000.0,
            "estimated_value_display": t.estimated_value_display,
            "opportunity_score": t.opportunity_score,
            "opportunity_verdict": t.opportunity_verdict,
            "expected_profit": t.expected_profit or 0.0,
            "profit_margin": t.profit_margin or 0.0,
            "required_engineers": t.resource_requirement.required_engineers if t.resource_requirement else 2,
            "bid_effort_hours": t.bid_effort_hours or 40.0
        })

    cap = req.available_capital or (company.working_capital if company and company.working_capital > 0 else 50000000.0)
    engs = req.available_engineers or (company.engineers_count if company else 10)
    hours = req.available_prep_hours or (company.team_capacity_hours_weekly if company else 180.0)

    return PortfolioOptimizer.optimize_portfolio(
        tenders=tender_records,
        available_capital=cap,
        available_engineers=engs,
        available_prep_hours=hours
    )
