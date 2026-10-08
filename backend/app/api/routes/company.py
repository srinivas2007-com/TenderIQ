import os
import uuid
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.config import settings
from app.models.models import User, Company, CompanyDocument, Tender, TenderRequirement
from app.schemas.schemas import (
    CompanyOut, CompanyUpdate, CompanyCreate, CompanyDocumentOut,
    CompanyListItemOut, CompanyFitEvaluationOut
)
from app.api.deps import get_current_user
from app.services.matching_engine import MatchingEngine
from app.services.company_fit_engine import CompanyFitEngine

router = APIRouter(prefix="/company", tags=["Company Profile & Intelligence"])
companies_router = APIRouter(prefix="/companies", tags=["Company Management"])

# --- Helper to automatically ensure user has a valid company record ---
async def _get_or_create_user_company(user: User, db: AsyncSession) -> Company:
    result = await db.execute(select(Company).where(Company.user_id == user.id))
    company = result.scalars().first()
    if not company:
        # Check if there is any company with user's name or create clean default
        company_name = user.full_name or "My Enterprise"
        company = Company(
            id=str(uuid.uuid4()),
            user_id=user.id,
            name=company_name,
            company_type="Private Limited Company",
            industry="IT & Engineering Services",
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

# --- Helper to list real user companies with fit evaluations ---
async def _get_all_companies_with_fit(db: AsyncSession, tender_req: Optional[Dict[str, Any]] = None) -> List[CompanyListItemOut]:
    result = await db.execute(select(Company).order_by(Company.created_at.desc()))
    companies = result.scalars().all()
    
    items = []
    for c in companies:
        fit = CompanyFitEngine.evaluate_fit(c, tender_req)
        items.append(CompanyListItemOut(
            id=c.id,
            user_id=c.user_id,
            name=c.name,
            company_type=c.company_type,
            industry=c.industry,
            location=c.location,
            state=c.state,
            website=c.website,
            annual_turnover=c.annual_turnover or 0.0,
            average_turnover=c.average_turnover or 0.0,
            years_in_business=c.years_in_business or 0,
            workforce_count=c.workforce_count or 0,
            certifications=c.certifications or [],
            is_sample=bool(c.is_sample),
            fit_score=fit["fit_score"],
            is_eligible=fit["is_eligible"],
            result_label=fit["result_label"]
        ))
    return items

# --- Companies Listing & Management ---
@router.get("/all", response_model=List[CompanyListItemOut])
@companies_router.get("", response_model=List[CompanyListItemOut])
async def list_all_companies(
    db: AsyncSession = Depends(get_db)
):
    """
    List user registered company profiles with dynamic qualification evaluations.
    """
    return await _get_all_companies_with_fit(db)

@companies_router.post("", response_model=CompanyOut)
async def create_company(
    data: CompanyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    new_comp = Company(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        name=data.name,
        company_type=data.company_type,
        industry=data.industry,
        description=data.description,
        location=data.location,
        state=data.state,
        country=data.country or "India",
        website=data.website,
        annual_turnover=data.annual_turnover,
        average_turnover=data.average_turnover,
        turnover_history=data.turnover_history,
        financial_year=data.financial_year,
        working_capital=data.working_capital,
        years_in_business=data.years_in_business,
        relevant_experience_years=data.relevant_experience_years,
        completed_projects_count=data.completed_projects_count,
        similar_projects_desc=data.similar_projects_desc,
        major_projects=data.major_projects,
        certifications=data.certifications,
        workforce_count=data.workforce_count,
        engineers_count=data.engineers_count,
        technical_qualifications=data.technical_qualifications,
        gst_number=data.gst_number,
        pan_number=data.pan_number,
        registration_number=data.registration_number,
        is_sample=False
    )
    db.add(new_comp)
    await db.commit()
    await db.refresh(new_comp)
    return new_comp

@companies_router.get("/sample-tender")
async def get_sample_fit_tender(db: AsyncSession = Depends(get_db)):
    t_res = await db.execute(select(Tender).order_by(Tender.created_at.desc()).limit(1))
    latest_tender = t_res.scalars().first()
    if latest_tender:
        val = getattr(latest_tender, "estimated_value", None) or 50000000.0
        min_to = round(val * 0.3 / 10000000.0, 1)
        org = getattr(latest_tender, "organization", None) or "Procurement Authority"
        return {
            "title": latest_tender.title,
            "authority": org,
            "min_turnover_cr": min_to if min_to > 0 else 5.0,
            "min_experience_years": 3,
            "mandatory_certification": "ISO 9001:2015",
            "min_team_size": 20
        }
    return {
        "title": "Indian Enterprise Procurement Eligibility Benchmark",
        "authority": "Standard Procurement Framework",
        "min_turnover_cr": 5.0,
        "min_experience_years": 3,
        "mandatory_certification": "ISO 9001:2015",
        "min_team_size": 20
    }

@router.get("/details/{company_id}", response_model=CompanyOut)
@companies_router.get("/{company_id}", response_model=CompanyOut)
async def get_company_details(
    company_id: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalars().first()
    if not company:
        # Fallback to first available company or create default
        first_comp_res = await db.execute(select(Company).limit(1))
        company = first_comp_res.scalars().first()
        if not company:
            raise HTTPException(status_code=404, detail="No company profile found in database.")
    return company

@companies_router.put("/{company_id}", response_model=CompanyOut)
async def update_company_by_id(
    company_id: str,
    update_data: CompanyUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalars().first()
    if not company:
        company = await _get_or_create_user_company(current_user, db)

    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(company, field, value)

    await db.commit()
    await db.refresh(company)
    return company

@router.get("/details/{company_id}/fit", response_model=CompanyFitEvaluationOut)
@companies_router.get("/{company_id}/fit", response_model=CompanyFitEvaluationOut)
async def evaluate_company_fit(
    company_id: str,
    tender_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalars().first()
    if not company:
        first_comp_res = await db.execute(select(Company).limit(1))
        company = first_comp_res.scalars().first()
        if not company:
            raise HTTPException(status_code=404, detail="Company not found.")
    
    tender_req = None
    if tender_id:
        t_res = await db.execute(select(Tender).where(Tender.id == tender_id))
        t = t_res.scalars().first()
        if t:
            val = getattr(t, "estimated_value", None) or 50000000.0
            org = getattr(t, "organization", None) or "Procurement Authority"
            tender_req = {
                "id": t.id,
                "title": t.title,
                "authority": org,
                "tender_value": val,
                "min_turnover_cr": val * 0.3 / 10000000.0,
                "min_experience_years": 3,
                "mandatory_certification": "ISO 9001",
                "min_team_size": 15
            }

    return CompanyFitEngine.evaluate_fit(company, tender_req)

@companies_router.post("/{company_id}/fit", response_model=CompanyFitEvaluationOut)
async def evaluate_company_fit_custom(
    company_id: str,
    custom_req: Dict[str, Any],
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalars().first()
    if not company:
        first_comp_res = await db.execute(select(Company).limit(1))
        company = first_comp_res.scalars().first()
        if not company:
            raise HTTPException(status_code=404, detail="Company not found.")
    
    return CompanyFitEngine.evaluate_fit(company, custom_req)

# --- Authenticated User Company Profile ---
@router.get("/profile", response_model=CompanyOut)
async def get_company_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    company = await _get_or_create_user_company(current_user, db)
    pct, missing = MatchingEngine.calculate_company_completeness(company)
    company.completeness_percentage = pct
    company.missing_items = missing
    await db.commit()
    await db.refresh(company)
    return company

@router.put("/profile", response_model=CompanyOut)
async def update_company_profile(
    update_data: CompanyUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    company = await _get_or_create_user_company(current_user, db)

    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(company, field, value)

    pct, missing = MatchingEngine.calculate_company_completeness(company)
    company.completeness_percentage = pct
    company.missing_items = missing

    # Re-evaluate all user tenders against updated company credentials
    t_stmt = (
        select(Tender)
        .options(
            selectinload(Tender.analysis),
            selectinload(Tender.requirements),
            selectinload(Tender.documents),
            selectinload(Tender.risks),
            selectinload(Tender.cost_estimate),
            selectinload(Tender.profit_scenario),
            selectinload(Tender.resource_requirement)
        )
        .where(Tender.user_id == current_user.id, Tender.status == "completed")
    )
    t_res = await db.execute(t_stmt)
    user_tenders = t_res.scalars().all()

    for tender in user_tenders:
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
            for r in tender.requirements
        ]
        doc_dicts = [
            {
                "name": d.name,
                "category": d.category,
                "mandatory": d.mandatory,
                "source_page": d.source_page
            }
            for d in tender.documents
        ]

        eval_result = MatchingEngine.evaluate_tender_match(company, req_dicts, doc_dicts)

        for idx, r_eval in enumerate(eval_result["evaluated_requirements"]):
            if idx < len(tender.requirements):
                tender.requirements[idx].company_status = r_eval["company_status"]
                tender.requirements[idx].match_result = r_eval["match_result"]
                tender.requirements[idx].match_reason = r_eval["match_reason"]

        for idx, d_eval in enumerate(eval_result["evaluated_documents"]):
            if idx < len(tender.documents):
                tender.documents[idx].status = d_eval["status"]
                tender.documents[idx].notes = d_eval.get("notes")

        if tender.analysis:
            sb = eval_result["score_breakdown"]
            tender.analysis.readiness_score = eval_result["readiness_score"]
            tender.analysis.eligibility_score = sb["eligibility"]["earned"]
            tender.analysis.technical_score = sb["technical"]["earned"]
            tender.analysis.experience_score = sb["experience"]["earned"]
            tender.analysis.financial_score = sb["financial"]["earned"]
            tender.analysis.documents_score = sb["documents"]["earned"]
            tender.analysis.recommendation = eval_result["recommendation"]
            tender.analysis.recommendation_reasons = eval_result["reasons"]
            tender.bid_readiness_score = eval_result["readiness_score"]

    await db.commit()
    await db.refresh(company)
    return company

@router.get("/competitiveness")
async def get_company_competitiveness(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Computes Company Competitiveness Score (0-100) based on the Company Digital Twin model.
    """
    company = await _get_or_create_user_company(current_user, db)

    # 1. Financial Strength (max 25)
    to = company.average_turnover or company.annual_turnover or 0.0
    fin_pts = min(20.0, (to / 15.0) * 20.0) # 15 Cr benchmark
    wc = company.working_capital or 0.0
    wc_pts = min(5.0, (wc / 30000000.0) * 5.0) # 3 Cr working capital benchmark
    financial_score = round(fin_pts + wc_pts, 1)

    # 2. Technical Capability (max 20)
    techs_count = len(company.technologies or [])
    serv_count = len(company.services or [])
    tech_score = min(20.0, round(techs_count * 2.0 + serv_count * 1.5, 1))

    # 3. Experience & Past Performance (max 20)
    years = company.relevant_experience_years or company.years_in_business or 0
    projects = company.completed_projects_count or 0
    exp_score = min(20.0, round(min(10.0, years * 1.5) + min(10.0, projects * 1.0), 1))

    # 4. Certifications (max 15)
    certs = company.certifications or []
    has_iso = any("9001" in str(c) or "ISO" in str(c).upper() for c in certs)
    has_msme = any("MSME" in str(c).upper() or "UDYAM" in str(c).upper() for c in certs)
    cert_score = (8.0 if has_iso else 2.0) + (4.0 if has_msme else 0.0) + min(3.0, len(certs) * 1.0)
    cert_score = min(15.0, round(cert_score, 1))

    # 5. Resources & Engineers (max 10)
    engs = company.engineers_count or 0
    res_score = min(10.0, round(engs * 1.0, 1))

    # 6. Compliance & Documentation (max 10)
    has_gst = bool(company.gst_number)
    has_pan = bool(company.pan_number)
    comp_score = (5.0 if has_gst else 0.0) + (3.0 if has_pan else 0.0) + (2.0 if company.pf_esi_compliance else 0.0)

    total_score = round(financial_score + tech_score + exp_score + cert_score + res_score + comp_score, 1)
    total_score = min(100.0, max(0.0, total_score))

    strengths = []
    weaknesses = []
    opportunities = []

    if financial_score >= 18: strengths.append(f"Strong financial turnover (₹{to:.2f} Cr)")
    else: weaknesses.append("Turnover limits qualification on large central PSU tenders (> ₹10 Cr)")

    if exp_score >= 15: strengths.append(f"Established track record ({years}+ years, {projects} completed projects)")
    else: opportunities.append("Record additional historical project credentials to boost experience weighting")

    if has_iso: strengths.append("Quality standard certification (ISO) verified")
    else: weaknesses.append("Missing ISO 9001 certificate restricts eligibility on CPWD/GeM tenders")

    if engs >= 8: strengths.append(f"Substantial internal technical workforce ({engs} engineers)")
    else: opportunities.append("Scale engineering roster or formalize technical subcontracting partnerships")

    return {
        "competitiveness_score": total_score,
        "breakdown": {
            "financial_strength": {"score": financial_score, "max": 25},
            "technical_capability": {"score": tech_score, "max": 20},
            "experience": {"score": exp_score, "max": 20},
            "certifications": {"score": cert_score, "max": 15},
            "resources": {"score": res_score, "max": 10},
            "compliance": {"score": comp_score, "max": 10}
        },
        "strengths": strengths,
        "weaknesses": weaknesses,
        "improvement_opportunities": opportunities
    }

@router.get("/gaps")
async def get_reverse_gap_analysis(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Reverse Gap Analysis.
    Exposes exact shortfalls across active tenders and impact on tender disqualifications.
    """
    company = await _get_or_create_user_company(current_user, db)

    stmt = (
        select(TenderRequirement)
        .join(Tender, TenderRequirement.tender_id == Tender.id)
        .where(
            Tender.user_id == current_user.id,
            TenderRequirement.match_result.in_(["FAIL", "PARTIAL"])
        )
    )
    res = await db.execute(stmt)
    reqs = res.scalars().all()

    gaps = []
    c_to = company.average_turnover or company.annual_turnover or 0.0
    c_exp = company.relevant_experience_years or company.years_in_business or 0

    turnover_failures = [r for r in reqs if "turnover" in (r.category or "").lower() or "turnover" in (r.requirement_title or "").lower()]
    if turnover_failures:
        gaps.append({
            "category": "Turnover",
            "requirement_name": "Minimum Annual Turnover",
            "company_value": f"₹{c_to:.2f} Cr",
            "required_benchmark": "₹8.0 - ₹15.0 Cr across target tenders",
            "gap_description": f"Shortfall of approximately ₹{max(0.0, 10.0 - c_to):.2f} Cr for high-value tenders",
            "impact": "Causes financial eligibility disqualification on tier-1 NIT notices",
            "affected_tenders_count": len(turnover_failures),
            "remediation_path": "Form a Consortium / Joint Venture (JV) where lead partner meets turnover criteria."
        })

    exp_failures = [r for r in reqs if "experience" in (r.category or "").lower()]
    if exp_failures:
        gaps.append({
            "category": "Experience",
            "requirement_name": "Past Operating Experience & Completed Projects",
            "company_value": f"{c_exp} Years / {company.completed_projects_count or 0} Works",
            "required_benchmark": "3 similar completed projects in last 5-7 years",
            "gap_description": "Project credential count or domain similarity gap",
            "impact": "Restricts qualification as single-entity bidder",
            "affected_tenders_count": len(exp_failures),
            "remediation_path": "Submit client completion certificates with clear BoQ value endorsements."
        })

    cert_failures = [r for r in reqs if "certification" in (r.category or "").lower()]
    if cert_failures:
        gaps.append({
            "category": "Certifications",
            "requirement_name": "ISO Quality & Standards Certification",
            "company_value": f"{len(company.certifications or [])} Certifications registered",
            "required_benchmark": "ISO 9001:2015, ISO 27001",
            "gap_description": "Missing accredited quality certificate",
            "impact": "Mandatory checklist failure during technical envelope opening",
            "affected_tenders_count": len(cert_failures),
            "remediation_path": "Initiate fast-track ISO 9001 audit or upload valid provisional audit receipt."
        })

    return {
        "company_name": company.name,
        "total_active_gaps": len(gaps),
        "gaps": gaps
    }

@router.get("/documents", response_model=list[CompanyDocumentOut])
async def list_company_documents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    company = await _get_or_create_user_company(current_user, db)
    docs_result = await db.execute(select(CompanyDocument).where(CompanyDocument.company_id == company.id))
    return docs_result.scalars().all()

@router.post("/documents", response_model=CompanyDocumentOut)
async def upload_company_document(
    doc_type: str = Form(...),
    name: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    company = await _get_or_create_user_company(current_user, db)

    docs_dir = os.path.join(settings.STORAGE_DIR, "company_docs")
    os.makedirs(docs_dir, exist_ok=True)
    
    safe_filename = f"{uuid.uuid4()}_{file.filename}"
    upload_path = os.path.join(docs_dir, safe_filename)
    
    content = await file.read()
    with open(upload_path, "wb") as f:
        f.write(content)

    new_doc = CompanyDocument(
        company_id=company.id,
        doc_type=doc_type,
        name=name or file.filename,
        file_path=upload_path,
        file_size=len(content),
        mime_type=file.content_type or "application/pdf"
    )
    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)
    return new_doc

@router.delete("/documents/{doc_id}")
async def delete_company_document(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    company = await _get_or_create_user_company(current_user, db)

    doc_result = await db.execute(
        select(CompanyDocument).where(CompanyDocument.id == doc_id, CompanyDocument.company_id == company.id)
    )
    doc = doc_result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    try:
        if os.path.exists(doc.file_path):
            os.remove(doc.file_path)
    except Exception:
        pass

    await db.delete(doc)
    await db.commit()
    return {"message": "Document deleted successfully"}
