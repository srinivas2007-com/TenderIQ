from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.models import User, Company, Tender, TenderAnalysis, TenderDeadline, BidTask, TenderResourceRequirement
from app.api.deps import get_current_user
from app.services.resource_engine import ResourceEngine

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch company profile for resource capacity context
    c_res = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = c_res.scalars().first()

    # Fetch all user tenders with analysis, resource requirement, and risks
    stmt = (
        select(Tender)
        .options(
            selectinload(Tender.analysis),
            selectinload(Tender.resource_requirement),
            selectinload(Tender.risks)
        )
        .where(Tender.user_id == current_user.id)
        .order_by(Tender.created_at.desc())
    )
    result = await db.execute(stmt)
    tenders = result.scalars().all()

    total_tenders = len(tenders)
    suitable_count = 0
    caution_count = 0
    not_recommended_count = 0
    score_sum = 0
    analyzed_count = 0

    potential_tender_value = 0.0
    expected_profit_total = 0.0

    score_ranges = {
        "High Opportunity (85-100)": 0,
        "Recommended (70-84)": 0,
        "Review / Caution (55-69)": 0,
        "High Risk (0-54)": 0
    }

    active_tender_resources = []
    heat_map_points = []

    for t in tenders:
        if t.estimated_value:
            potential_tender_value += t.estimated_value
        if t.expected_profit:
            expected_profit_total += t.expected_profit

        opp = t.opportunity_score
        readiness = t.analysis.readiness_score if t.analysis else 0
        rec = (t.opportunity_verdict or (t.analysis.recommendation if t.analysis else "")).upper()

        if t.analysis:
            analyzed_count += 1
            score_sum += readiness

        if "HIGHLY" in rec or "SUITABLE" in rec or opp >= 85:
            suitable_count += 1
            score_ranges["High Opportunity (85-100)"] += 1
            status_color = "green"
        elif "RECOMMENDED" in rec or (70 <= opp < 85):
            caution_count += 1
            score_ranges["Recommended (70-84)"] += 1
            status_color = "yellow"
        elif "REVIEW" in rec or (55 <= opp < 70):
            caution_count += 1
            score_ranges["Review / Caution (55-69)"] += 1
            status_color = "orange"
        else:
            not_recommended_count += 1
            score_ranges["High Risk (0-54)"] += 1
            status_color = "red" if opp > 0 else "gray"

        # Heat map points (Profit margin vs Risk or Readiness vs Profit)
        high_r_count = sum(1 for rk in t.risks if rk.severity == "HIGH") if t.risks else 0
        risk_score = min(100, high_r_count * 25 + len(t.risks or []) * 5)
        heat_map_points.append({
            "id": t.id,
            "title": t.title[:45] + "..." if len(t.title) > 45 else t.title,
            "organization": t.organization or "Public Entity",
            "readiness": readiness,
            "opportunity": opp,
            "profit_margin": round(t.profit_margin or 0.0, 1),
            "expected_profit": t.expected_profit or 0.0,
            "risk_score": risk_score,
            "value": t.estimated_value or 0.0,
            "status_color": status_color,
            "status": t.status
        })

        if t.status in ["completed", "comparing"] and t.resource_requirement:
            active_tender_resources.append({
                "id": t.id,
                "title": t.title,
                "required_engineers": t.resource_requirement.required_engineers,
                "preparation_hours": t.bid_effort_hours or 40.0,
                "deadline_display": "Active"
            })

    avg_score = round(score_sum / analyzed_count, 1) if analyzed_count > 0 else 0.0

    # Deadlines count across tenders
    dl_stmt = (
        select(TenderDeadline)
        .join(Tender, TenderDeadline.tender_id == Tender.id)
        .where(Tender.user_id == current_user.id)
        .order_by(TenderDeadline.created_at.desc())
    )
    dl_res = await db.execute(dl_stmt)
    deadlines = dl_res.scalars().all()
    upcoming_deadlines_count = len(deadlines)

    # Open tasks count
    task_stmt = (
        select(BidTask)
        .join(Tender, BidTask.tender_id == Tender.id)
        .where(Tender.user_id == current_user.id, BidTask.status != "COMPLETED")
    )
    task_res = await db.execute(task_stmt)
    open_tasks = task_res.scalars().all()

    # Resource Conflicts cross-check
    conflict_data = ResourceEngine.detect_multi_tender_conflicts(
        active_tenders=active_tender_resources,
        company_engineers_available=company.engineers_count if company else 5,
        company_weekly_capacity_hours=company.team_capacity_hours_weekly if company else 160.0
    )

    # Top Opportunities (sorted by opportunity score)
    completed_tenders = [t for t in tenders if t.status == "completed"]
    top_opportunities = sorted(completed_tenders, key=lambda x: x.opportunity_score, reverse=True)[:5]

    score_distribution = [
        {"name": k, "count": v} for k, v in score_ranges.items()
    ]

    return {
        "total_tenders": total_tenders,
        "suitable_count": suitable_count,
        "caution_count": caution_count,
        "not_recommended_count": not_recommended_count,
        "upcoming_deadlines_count": upcoming_deadlines_count,
        "average_readiness_score": avg_score,
        "potential_tender_value": round(potential_tender_value, 2),
        "expected_profit_total": round(expected_profit_total, 2),
        "open_tasks_count": len(open_tasks),
        "recent_tenders": tenders[:8],
        "top_opportunities": [
            {
                "id": o.id,
                "title": o.title,
                "organization": o.organization,
                "opportunity_score": o.opportunity_score,
                "opportunity_verdict": o.opportunity_verdict,
                "readiness_score": o.analysis.readiness_score if o.analysis else 0,
                "profit_margin": o.profit_margin or 0.0,
                "estimated_value_display": o.estimated_value_display
            }
            for o in top_opportunities
        ],
        "score_distribution": score_distribution,
        "resource_conflicts": conflict_data,
        "heat_map_points": heat_map_points,
        "deadline_risks": [
            {
                "id": d.id,
                "tender_id": d.tender_id,
                "title": d.title,
                "deadline_date_display": d.deadline_date_display,
                "is_internal": d.is_internal,
                "milestone_type": d.milestone_type
            }
            for d in deadlines[:6]
        ]
    }
