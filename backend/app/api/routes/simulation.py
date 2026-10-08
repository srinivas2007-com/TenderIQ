from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.models import User, Company, Tender
from app.schemas.schemas import SimulationRequest
from app.api.deps import get_current_user
from app.services.matching_engine import MatchingEngine
from app.services.cost_profit_engine import CostProfitEngine
from app.services.opportunity_engine import OpportunityEngine
from app.services.resource_engine import ResourceEngine

router = APIRouter(prefix="/simulation", tags=["What-If Simulator"])

@router.post("")
async def run_what_if_simulation(
    req: SimulationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch user's company profile
    comp_res = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = comp_res.scalars().first()
    if not company:
        raise HTTPException(status_code=400, detail="Company profile not found.")

    # Target tender
    target_tender = None
    if req.tender_id:
        t_res = await db.execute(
            select(Tender)
            .options(
                selectinload(Tender.analysis),
                selectinload(Tender.requirements),
                selectinload(Tender.documents),
                selectinload(Tender.risks)
            )
            .where(Tender.id == req.tender_id, Tender.user_id == current_user.id)
        )
        target_tender = t_res.scalars().first()

    if not target_tender:
        # Pick the most recent completed tender
        t_res = await db.execute(
            select(Tender)
            .options(
                selectinload(Tender.analysis),
                selectinload(Tender.requirements),
                selectinload(Tender.documents),
                selectinload(Tender.risks)
            )
            .where(Tender.user_id == current_user.id, Tender.status == "completed")
            .order_by(Tender.created_at.desc())
        )
        target_tender = t_res.scalars().first()

    if not target_tender:
        raise HTTPException(status_code=404, detail="No analyzed tender available to simulate against.")

    # 1. Base values
    base_readiness = target_tender.analysis.readiness_score if target_tender.analysis else 70
    base_opportunity = target_tender.opportunity_score or 65.0
    base_margin = target_tender.profit_margin or 18.0
    base_engineers = company.engineers_count or 5
    base_turnover = company.average_turnover or company.annual_turnover or 5.0

    # 2. Build temporary virtual company object (in-memory only, NO DB commit)
    class VirtualCompany:
        pass

    sim_company = VirtualCompany()
    sim_company.name = company.name
    sim_company.annual_turnover = req.turnover if req.turnover is not None else company.annual_turnover
    sim_company.average_turnover = req.turnover if req.turnover is not None else company.average_turnover
    sim_company.working_capital = req.working_capital if req.working_capital is not None else company.working_capital
    sim_company.years_in_business = company.years_in_business
    sim_company.relevant_experience_years = company.relevant_experience_years
    sim_company.completed_projects_count = req.completed_projects if req.completed_projects is not None else company.completed_projects_count
    sim_company.certifications = req.certifications if req.certifications is not None else company.certifications
    sim_company.workforce_count = req.workforce_count if req.workforce_count is not None else company.workforce_count
    sim_company.engineers_count = req.engineers_count if req.engineers_count is not None else company.engineers_count
    sim_company.services = company.services
    sim_company.gst_number = company.gst_number
    sim_company.pan_number = company.pan_number

    # 3. Simulate requirements & documents matching
    req_dicts = [
        {
            "category": r.category,
            "requirement_title": r.requirement_title,
            "requirement": r.tender_requirement,
            "value": r.tender_value,
            "unit": r.unit,
            "mandatory": r.mandatory,
            "source_page": r.source_page
        }
        for r in target_tender.requirements
    ]
    doc_dicts = [
        {
            "name": d.name,
            "category": d.category,
            "mandatory": d.mandatory,
            "source_page": d.source_page
        }
        for d in target_tender.documents
    ]

    sim_match = MatchingEngine.evaluate_tender_match(sim_company, req_dicts, doc_dicts)
    sim_readiness = sim_match["readiness_score"]

    # 4. Simulate cost & profit with possible overrides
    custom_cost_overrides = {}
    if req.labour_cost is not None: custom_cost_overrides["labour_cost"] = req.labour_cost
    if req.materials_cost is not None: custom_cost_overrides["materials_cost"] = req.materials_cost
    if req.subcontracting_cost is not None: custom_cost_overrides["subcontracting_cost"] = req.subcontracting_cost
    if req.contingency_cost is not None: custom_cost_overrides["contingency_cost"] = req.contingency_cost

    sim_cost = CostProfitEngine.estimate_cost(
        tender_value=target_tender.estimated_value,
        industry=target_tender.industry,
        custom_overrides=custom_cost_overrides if custom_cost_overrides else None
    )
    sim_profit = CostProfitEngine.calculate_profit_scenarios(target_tender.estimated_value, sim_cost)
    sim_margin = sim_profit["expected_margin"]

    # 5. Simulate resources
    sim_res = ResourceEngine.calculate_resource_requirements(
        tender_value=target_tender.estimated_value,
        industry=target_tender.industry,
        company_engineers_available=sim_company.engineers_count
    )

    base_res = ResourceEngine.calculate_resource_requirements(
        tender_value=target_tender.estimated_value,
        industry=target_tender.industry,
        company_engineers_available=base_engineers
    )

    # 6. Simulate opportunity score
    high_risks = sum(1 for rk in target_tender.risks if rk.severity == "HIGH") if target_tender.risks else 0
    sim_opp = OpportunityEngine.calculate_opportunity_score(
        readiness_score=sim_readiness,
        score_breakdown=sim_match["score_breakdown"],
        expected_profit_margin=sim_margin,
        risk_count=len(target_tender.risks) if target_tender.risks else 0,
        high_risk_count=high_risks,
        resource_gap_count=sim_res["gap_engineers"],
        tender_value=target_tender.estimated_value
    )

    # Impact insights
    readiness_diff = round(sim_readiness - base_readiness, 1)
    opp_diff = round(sim_opp["opportunity_score"] - base_opportunity, 1)
    gap_diff = base_res["gap_engineers"] - sim_res["gap_engineers"]

    highest_impact_improvement = "Adjust scenario levers above to evaluate impact on Tender readiness and profit margin."
    if gap_diff > 0:
        highest_impact_improvement = f"Adding engineers eliminated {gap_diff} capacity gap(s) and boosted Opportunity Score by +{max(0, opp_diff)} pts."
    elif readiness_diff > 5:
        highest_impact_improvement = f"Turnover / Experience adjustment increased Bid Readiness by +{readiness_diff} points."
    elif opp_diff > 5:
        highest_impact_improvement = f"Optimized execution costs improved project margin and increased Opportunity Score by +{opp_diff} points."

    return {
        "tender_title": target_tender.title,
        "tender_value_display": target_tender.estimated_value_display or "As per NIT",
        "current": {
            "readiness_score": base_readiness,
            "opportunity_score": base_opportunity,
            "expected_margin": base_margin,
            "resource_gap": base_res["gap_engineers"],
            "engineers": base_engineers,
            "turnover": base_turnover
        },
        "scenario": {
            "readiness_score": sim_readiness,
            "opportunity_score": sim_opp["opportunity_score"],
            "opportunity_verdict": sim_opp["opportunity_verdict"],
            "expected_margin": sim_margin,
            "resource_gap": sim_res["gap_engineers"],
            "engineers": sim_company.engineers_count,
            "turnover": sim_company.average_turnover
        },
        "differences": {
            "readiness_change": f"{'+' if readiness_diff > 0 else ''}{readiness_diff}",
            "opportunity_change": f"{'+' if opp_diff > 0 else ''}{opp_diff}",
            "margin_change": f"{'+' if sim_margin - base_margin > 0 else ''}{round(sim_margin - base_margin, 1)}%",
            "resource_gap_change": f"{'+' if sim_res['gap_engineers'] - base_res['gap_engineers'] > 0 else ''}{sim_res['gap_engineers'] - base_res['gap_engineers']}"
        },
        "highest_impact_improvement": highest_impact_improvement
    }
