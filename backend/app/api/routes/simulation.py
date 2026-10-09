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

    base_match = MatchingEngine.evaluate_tender_match(company, req_dicts, doc_dicts)
    sim_match = MatchingEngine.evaluate_tender_match(sim_company, req_dicts, doc_dicts)

    # Capability augmentation helper: translates capacity levers (Turnover, Projects, Engineers)
    # into deterministic qualification points
    def augment_capability_breakdown(comp, raw_sb_dict):
        sb = {k: (dict(v) if isinstance(v, dict) else v) for k, v in raw_sb_dict.items()}
        # 1. Financial capability (max 15)
        to = float(getattr(comp, 'average_turnover', None) or getattr(comp, 'annual_turnover', None) or 1.0)
        wc = float(getattr(comp, 'working_capital', None) or 0.0) / 10000000.0  # in Cr
        if to >= 20.0: fin = 15.0
        elif to >= 10.0: fin = 11.0 + (to - 10.0) * 0.4
        elif to >= 5.0: fin = 7.0 + (to - 5.0) * 0.8
        else: fin = max(2.0, to * 1.4)
        if wc >= 5.0: fin = min(15.0, fin + 2.0)
        curr_fin = sb.get('financial', {}).get('earned', 0.0)
        sb['financial']['earned'] = max(curr_fin, round(min(15.0, fin), 1))

        # 2. Experience & Track record (max 15)
        cp = int(getattr(comp, 'completed_projects_count', None) or 0)
        if cp >= 12: exp = 15.0
        elif cp >= 6: exp = 10.0 + (cp - 6) * 0.8
        elif cp >= 2: exp = 5.0 + (cp - 2) * 1.25
        else: exp = cp * 2.5
        curr_exp = sb.get('experience', {}).get('earned', 0.0)
        sb['experience']['earned'] = max(curr_exp, round(min(15.0, exp), 1))

        # 3. Technical & Engineering capacity (max 20)
        eng = int(getattr(comp, 'engineers_count', None) or 0)
        if eng >= 15: tech = 20.0
        elif eng >= 8: tech = 14.0 + (eng - 8) * 0.85
        elif eng >= 4: tech = 8.0 + (eng - 4) * 1.5
        else: tech = eng * 2.0
        curr_tech = sb.get('technical', {}).get('earned', 0.0)
        sb['technical']['earned'] = max(curr_tech, round(min(20.0, tech), 1))

        tot = int(round(
            sb['eligibility'].get('earned', 0.0) +
            sb['technical'].get('earned', 0.0) +
            sb['experience'].get('earned', 0.0) +
            sb['financial'].get('earned', 0.0) +
            sb['documents'].get('earned', 0.0)
        ))
        sb['total'] = min(100, tot)
        return sb['total'], sb

    base_readiness_calc, base_full_sb = augment_capability_breakdown(company, base_match.get("score_breakdown", {}))
    sim_readiness_calc, sim_full_sb = augment_capability_breakdown(sim_company, sim_match.get("score_breakdown", {}))

    stored_readiness = (
        target_tender.analysis.readiness_score
        if target_tender.analysis and target_tender.analysis.readiness_score is not None
        else None
    )
    if stored_readiness is not None and stored_readiness > 0:
        base_readiness_val = float(stored_readiness)
        lift = max(0, sim_readiness_calc - base_readiness_calc)
        sim_readiness = round(min(100.0, base_readiness_val + lift), 1)
    else:
        base_readiness_val = float(base_readiness_calc)
        sim_readiness = float(sim_readiness_calc)

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
    base_opp = OpportunityEngine.calculate_opportunity_score(
        readiness_score=base_readiness_val,
        score_breakdown=base_full_sb,
        expected_profit_margin=target_tender.profit_margin or 15.0,
        risk_count=len(target_tender.risks or []),
        high_risk_count=high_risks,
        resource_gap_count=base_res.get("gap_engineers", 0),
        tender_value=target_tender.estimated_value
    )
    sim_opp = OpportunityEngine.calculate_opportunity_score(
        readiness_score=sim_readiness,
        score_breakdown=sim_full_sb,
        expected_profit_margin=sim_margin or 15.0,
        risk_count=len(target_tender.risks or []),
        high_risk_count=high_risks,
        resource_gap_count=sim_res.get("gap_engineers", 0),
        tender_value=target_tender.estimated_value
    )

    stored_opp = target_tender.opportunity_score if target_tender.opportunity_score is not None else None
    if stored_opp is not None and stored_opp > 0:
        base_opp_val = float(stored_opp)
        opp_lift = max(0.0, sim_opp["opportunity_score"] - base_opp["opportunity_score"])
        sim_opp_val = round(min(100.0, base_opp_val + opp_lift), 1)
    else:
        base_opp_val = float(base_opp["opportunity_score"])
        sim_opp_val = float(sim_opp["opportunity_score"])

    base_gap = int(base_res.get("gap_engineers") or 0)
    sim_gap = int(sim_res.get("gap_engineers") or 0)

    readiness_diff = round(sim_readiness - base_readiness_val, 1)
    opp_diff = round(sim_opp_val - base_opp_val, 1)
    gap_diff = base_gap - sim_gap

    eng_diff = sim_company.engineers_count - base_engineers
    to_diff = round(sim_company.average_turnover - base_turnover, 1)
    proj_diff = sim_company.completed_projects_count - (company.completed_projects_count or 0)

    if readiness_diff > 0 or opp_diff > 0:
        improvements = []
        if eng_diff > 0: improvements.append(f"+{eng_diff} engineers")
        if to_diff > 0: improvements.append(f"+₹{to_diff} Cr turnover")
        if proj_diff > 0: improvements.append(f"+{proj_diff} completed works")
        summary_str = ", ".join(improvements) if improvements else "Capability expansion"
        highest_impact_improvement = (
            f"{summary_str} boosted Bid Readiness by +{readiness_diff} pts and Opportunity Score by +{opp_diff} pts."
        )
    elif gap_diff > 0:
        highest_impact_improvement = f"Adding engineers eliminated {gap_diff} capacity gap(s) and boosted Opportunity Score by +{max(0.0, opp_diff)} pts."
    else:
        highest_impact_improvement = "Adjust scenario levers above to evaluate impact on Tender readiness and profit margin."

    return {
        "tender_title": target_tender.title,
        "tender_value_display": target_tender.estimated_value_display or "As per NIT",
        "current": {
            "readiness_score": base_readiness_val,
            "opportunity_score": base_opp_val,
            "expected_margin": base_margin,
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
            "margin_change": f"{'+' if sim_margin - base_margin > 0 else ''}{round(sim_margin - base_margin, 1)}%",
            "resource_gap_change": f"{'+' if sim_gap - base_gap > 0 else ''}{sim_gap - base_gap}"
        },
        "highest_impact_improvement": highest_impact_improvement
    }
