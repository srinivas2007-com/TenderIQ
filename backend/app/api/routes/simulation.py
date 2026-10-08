from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.models import User, Company, Tender
from app.schemas.schemas import SimulationRequest
from app.api.deps import get_current_user, get_current_user_company
from app.services.matching_engine import MatchingEngine
from app.services.cost_profit_engine import CostProfitEngine
from app.services.opportunity_engine import OpportunityEngine
from app.services.resource_engine import ResourceEngine

router = APIRouter(prefix="/simulation", tags=["What-If Simulator"])

@router.post("")
async def run_what_if_simulation(
    req: SimulationRequest,
    current_user: User = Depends(get_current_user),
    company: Company = Depends(get_current_user_company),
    db: AsyncSession = Depends(get_db)
):
    # 1. Target tender resolution
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
        # Pick the most recent tender belonging to current_user
        t_res = await db.execute(
            select(Tender)
            .options(
                selectinload(Tender.analysis),
                selectinload(Tender.requirements),
                selectinload(Tender.documents),
                selectinload(Tender.risks)
            )
            .where(Tender.user_id == current_user.id)
            .order_by(Tender.created_at.desc())
        )
        all_tenders = t_res.scalars().all()
        for t in all_tenders:
            if t.status == "completed" or t.analysis or (t.requirements and len(t.requirements) > 0) or (t.opportunity_score and t.opportunity_score > 0):
                target_tender = t
                break
        if not target_tender and all_tenders:
            target_tender = all_tenders[0]

    if not target_tender:
        raise HTTPException(
            status_code=404,
            detail="No analyzed tender available to simulate against. Please upload a tender document first."
        )

    # 2. Base values
    base_readiness = (
        target_tender.analysis.readiness_score
        if target_tender.analysis and target_tender.analysis.readiness_score is not None
        else 70.0
    )
    base_opportunity = target_tender.opportunity_score if target_tender.opportunity_score is not None else 65.0
    base_margin = target_tender.profit_margin if target_tender.profit_margin is not None else 18.0
    base_engineers = (company.engineers_count if company and company.engineers_count is not None else 5) or 5
    base_turnover = (company.average_turnover or company.annual_turnover or 5.0) if company else 5.0

    # 3. Build temporary virtual company object (in-memory only, NO DB commit)
    class VirtualCompany:
        pass

    sim_company = VirtualCompany()
    sim_company.name = getattr(company, "name", "My Enterprise") or "My Enterprise"
    sim_company.annual_turnover = req.turnover if req.turnover is not None else (getattr(company, "annual_turnover", 5.0) or 5.0)
    sim_company.average_turnover = req.turnover if req.turnover is not None else (getattr(company, "average_turnover", 5.0) or 5.0)
    sim_company.working_capital = req.working_capital if req.working_capital is not None else (getattr(company, "working_capital", 15000000.0) or 15000000.0)
    sim_company.years_in_business = getattr(company, "years_in_business", 3) or 3
    sim_company.relevant_experience_years = getattr(company, "relevant_experience_years", 3) or 3
    sim_company.completed_projects_count = req.completed_projects if req.completed_projects is not None else (getattr(company, "completed_projects_count", 3) or 3)
    sim_company.certifications = req.certifications if req.certifications is not None else (getattr(company, "certifications", []) or [])
    sim_company.workforce_count = req.workforce_count if req.workforce_count is not None else (getattr(company, "workforce_count", 20) or 20)
    sim_company.engineers_count = req.engineers_count if req.engineers_count is not None else (getattr(company, "engineers_count", 5) or 5)
    sim_company.services = getattr(company, "services", []) or []
    sim_company.gst_number = getattr(company, "gst_number", None)
    sim_company.pan_number = getattr(company, "pan_number", None)
    sim_company.technical_qualifications = getattr(company, "technical_qualifications", None)
    sim_company.description = getattr(company, "description", None)

    # 4. Simulate requirements & documents matching
    req_dicts = [
        {
            "category": getattr(r, "category", "general"),
            "requirement_title": getattr(r, "requirement_title", "Criteria"),
            "requirement": getattr(r, "tender_requirement", ""),
            "value": getattr(r, "tender_value", ""),
            "unit": getattr(r, "unit", ""),
            "mandatory": getattr(r, "mandatory", True),
            "source_page": getattr(r, "source_page", 1)
        }
        for r in (target_tender.requirements or [])
    ]
    doc_dicts = [
        {
            "name": getattr(d, "name", "Document"),
            "category": getattr(d, "category", "Statutory"),
            "mandatory": getattr(d, "mandatory", True),
            "source_page": getattr(d, "source_page", 1)
        }
        for d in (target_tender.documents or [])
    ]

    sim_match = MatchingEngine.evaluate_tender_match(sim_company, req_dicts, doc_dicts)
    sim_readiness = float(sim_match.get("readiness_score") or 0.0)

    # 5. Simulate cost & profit with possible overrides
    custom_cost_overrides = {}
    if req.labour_cost is not None: custom_cost_overrides["labour_cost"] = req.labour_cost
    if req.materials_cost is not None: custom_cost_overrides["materials_cost"] = req.materials_cost
    if req.subcontracting_cost is not None: custom_cost_overrides["subcontracting_cost"] = req.subcontracting_cost
    if req.contingency_cost is not None: custom_cost_overrides["contingency_cost"] = req.contingency_cost

    sim_cost = CostProfitEngine.estimate_cost(
        tender_value=target_tender.estimated_value,
        industry=target_tender.industry or "General",
        custom_overrides=custom_cost_overrides if custom_cost_overrides else None
    )
    sim_profit = CostProfitEngine.calculate_profit_scenarios(target_tender.estimated_value, sim_cost)
    sim_margin = float(sim_profit.get("expected_margin") or 0.0)

    # 6. Simulate resources
    sim_res = ResourceEngine.calculate_resource_requirements(
        tender_value=target_tender.estimated_value,
        industry=target_tender.industry or "General",
        company_engineers_available=sim_company.engineers_count
    )

    base_res = ResourceEngine.calculate_resource_requirements(
        tender_value=target_tender.estimated_value,
        industry=target_tender.industry or "General",
        company_engineers_available=base_engineers
    )

    # 7. Simulate opportunity score
    high_risks = sum(1 for rk in (target_tender.risks or []) if getattr(rk, "severity", "") == "HIGH")
    sim_opp = OpportunityEngine.calculate_opportunity_score(
        readiness_score=sim_readiness,
        score_breakdown=sim_match.get("score_breakdown", {}),
        expected_profit_margin=sim_margin,
        risk_count=len(target_tender.risks or []),
        high_risk_count=high_risks,
        resource_gap_count=sim_res.get("gap_engineers", 0),
        tender_value=target_tender.estimated_value
    )

    # 8. Impact insights & differences
    base_readiness_val = float(base_readiness if base_readiness is not None else 70.0)
    base_opp_val = float(base_opportunity if base_opportunity is not None else 65.0)
    base_margin_val = float(base_margin if base_margin is not None else 18.0)
    sim_opp_val = float(sim_opp.get("opportunity_score") or 0.0)

    base_gap = int(base_res.get("gap_engineers") or 0)
    sim_gap = int(sim_res.get("gap_engineers") or 0)

    readiness_diff = round(sim_readiness - base_readiness_val, 1)
    opp_diff = round(sim_opp_val - base_opp_val, 1)
    gap_diff = base_gap - sim_gap

    highest_impact_improvement = "Adjust scenario levers above to evaluate impact on Tender readiness and profit margin."
    if gap_diff > 0:
        highest_impact_improvement = f"Adding engineers eliminated {gap_diff} capacity gap(s) and boosted Opportunity Score by +{max(0.0, opp_diff)} pts."
    elif readiness_diff > 5:
        highest_impact_improvement = f"Turnover / Experience adjustment increased Bid Readiness by +{readiness_diff} points."
    elif opp_diff > 5:
        highest_impact_improvement = f"Optimized execution costs improved project margin and increased Opportunity Score by +{opp_diff} points."

    return {
        "tender_title": target_tender.title,
        "tender_value_display": target_tender.estimated_value_display or "As per NIT",
        "current": {
            "readiness_score": base_readiness_val,
            "opportunity_score": base_opp_val,
            "expected_margin": base_margin_val,
            "resource_gap": base_gap,
            "engineers": base_engineers,
            "turnover": base_turnover
        },
        "scenario": {
            "readiness_score": sim_readiness,
            "opportunity_score": sim_opp_val,
            "opportunity_verdict": sim_opp.get("opportunity_verdict", "REVIEW"),
            "expected_margin": sim_margin,
            "resource_gap": sim_gap,
            "engineers": sim_company.engineers_count,
            "turnover": sim_company.average_turnover
        },
        "differences": {
            "readiness_change": f"{'+' if readiness_diff > 0 else ''}{readiness_diff}",
            "opportunity_change": f"{'+' if opp_diff > 0 else ''}{opp_diff}",
            "margin_change": f"{'+' if sim_margin - base_margin_val > 0 else ''}{round(sim_margin - base_margin_val, 1)}%",
            "resource_gap_change": f"{'+' if sim_gap - base_gap > 0 else ''}{sim_gap - base_gap}"
        },
        "highest_impact_improvement": highest_impact_improvement
    }
