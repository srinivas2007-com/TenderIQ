import os
import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status, BackgroundTasks
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db, AsyncSessionLocal
from app.core.config import settings
from app.models.models import (
    User, Company, Tender, TenderAnalysis, TenderRequirement,
    TenderDocumentChecklist, TenderRisk, TenderDeadline,
    TenderCostEstimate, TenderProfitScenario, TenderResourceRequirement,
    TenderClarification, BidTask, TeamMember
)
from app.schemas.schemas import (
    TenderOut, TenderAnalysisOut, TenderRequirementOut,
    TenderDocumentOut, TenderDocumentUpdate, TenderRiskOut, TenderDeadlineOut,
    CostEstimateOut, ProfitScenarioOut, ResourceRequirementOut,
    ClarificationOut, ClarificationUpdate, CompareRequest
)
from app.api.deps import get_current_user
from app.services.pdf_extractor import PDFExtractor
from app.services.ai_analyzer import AIAnalyzer
from app.services.matching_engine import MatchingEngine
from app.services.cost_profit_engine import CostProfitEngine
from app.services.opportunity_engine import OpportunityEngine
from app.services.resource_engine import ResourceEngine
from app.services.complexity_effort_engine import ComplexityEffortEngine
from app.services.portfolio_optimizer import PortfolioOptimizer
from app.services.task_generator import TaskGenerator
from app.services.report_generator import ReportGenerator

router = APIRouter(prefix="/tenders", tags=["Tenders"])

async def _ensure_company_for_user(user_id: str, db: AsyncSession) -> Company:
    c_res = await db.execute(select(Company).where(Company.user_id == user_id))
    company = c_res.scalars().first()
    if not company:
        u_res = await db.execute(select(User).where(User.id == user_id))
        user = u_res.scalars().first()
        company_name = user.full_name if user else "My Enterprise"
        company = Company(
            id=str(uuid.uuid4()),
            user_id=user_id,
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

async def run_tender_processing_pipeline(tender_id: str, company_id: str, file_path: str):
    """
    Background worker pipeline executing end-to-end tender intelligence.
    Extracting -> Analyzing -> Matching -> Calculating -> Completed.
    """
    async with AsyncSessionLocal() as db:
        try:
            # 1. Load Tender & Company
            t_res = await db.execute(
                select(Tender)
                .options(
                    selectinload(Tender.requirements),
                    selectinload(Tender.documents),
                    selectinload(Tender.risks),
                    selectinload(Tender.deadlines),
                    selectinload(Tender.analysis)
                )
                .where(Tender.id == tender_id)
            )
            tender = t_res.scalars().first()
            if not tender:
                return

            company = await _ensure_company_for_user(tender.user_id, db)

            # Step 1: Extraction
            tender.status = "extracting"
            tender.status_step = 1
            await db.commit()

            pdf_res = PDFExtractor.extract(file_path)
            tender.page_count = pdf_res.page_count

            # Step 2: AI / NLP Analysis
            tender.status = "analyzing"
            tender.status_step = 2
            await db.commit()

            ai_data = await AIAnalyzer.analyze_tender(pdf_res.text, pdf_res.pages)

            t_meta = ai_data.get("tender", {})
            tender.title = t_meta.get("title") or tender.title
            tender.reference_number = t_meta.get("reference_number")
            tender.organization = t_meta.get("organization")
            tender.department = t_meta.get("department")
            tender.location = t_meta.get("location")
            tender.industry = t_meta.get("industry") or "Infrastructure & Technology"
            tender.estimated_value = t_meta.get("estimated_value")
            tender.estimated_value_display = t_meta.get("estimated_value_display")
            tender.emd_amount = t_meta.get("emd_amount")
            tender.emd_display = t_meta.get("emd_display")
            tender.performance_security = t_meta.get("performance_security")
            tender.contract_duration = t_meta.get("contract_duration")

            # Step 3: Matching Engine
            tender.status = "matching"
            tender.status_step = 3
            await db.commit()

            eval_result = MatchingEngine.evaluate_tender_match(
                company=company,
                requirements=ai_data.get("eligibility", []),
                documents=ai_data.get("documents", [])
            )

            # Persist Requirements
            for r in eval_result["evaluated_requirements"]:
                req_row = TenderRequirement(
                    tender_id=tender.id,
                    category=r["category"],
                    requirement_title=r["requirement_title"],
                    tender_requirement=r["tender_requirement"],
                    tender_value=r["tender_value"],
                    unit=r["unit"],
                    mandatory=r["mandatory"],
                    source_page=r["source_page"],
                    source_text=r.get("source_text"),
                    confidence=r.get("confidence", 0.95),
                    company_status=r["company_status"],
                    match_result=r["match_result"],
                    match_reason=r["match_reason"]
                )
                db.add(req_row)

            # Persist Documents
            for d in eval_result["evaluated_documents"]:
                doc_row = TenderDocumentChecklist(
                    tender_id=tender.id,
                    name=d["name"],
                    category=d.get("category", "statutory"),
                    mandatory=d["mandatory"],
                    source_page=d["source_page"],
                    source_text=d.get("source_text"),
                    confidence=d.get("confidence", 0.95),
                    status=d["status"],
                    notes=d["notes"]
                )
                db.add(doc_row)

            # Persist Risks
            for rk in ai_data.get("risks", []):
                risk_row = TenderRisk(
                    tender_id=tender.id,
                    category=rk.get("category", "Operational Risk"),
                    title=rk.get("title", "Tender Clause Risk"),
                    severity=rk.get("severity", "MEDIUM"),
                    description=rk.get("description", ""),
                    source_page=rk.get("source_page", 1),
                    source_text=rk.get("source_text"),
                    confidence=rk.get("confidence", 0.90),
                    mitigation_suggestion=rk.get("mitigation_suggestion")
                )
                db.add(risk_row)

            # Persist Deadlines
            submission_deadline_str = None
            for dl in ai_data.get("deadlines", []):
                if dl.get("deadline_type") == "submission":
                    submission_deadline_str = dl.get("deadline_date_display")
                dl_row = TenderDeadline(
                    tender_id=tender.id,
                    title=dl.get("title", "Important Date"),
                    deadline_type=dl.get("deadline_type", "submission"),
                    deadline_date_display=dl.get("deadline_date_display"),
                    description=dl.get("description"),
                    source_page=dl.get("source_page", 1),
                    is_internal=False,
                    milestone_type="OFFICIAL"
                )
                db.add(dl_row)

            # Add Internal Milestones
            internal_milestones = ComplexityEffortEngine.generate_internal_milestones(submission_deadline_str)
            for im in internal_milestones:
                im_row = TenderDeadline(
                    tender_id=tender.id,
                    title=im["title"],
                    deadline_type="internal_milestone",
                    deadline_date_display=im["target_date"],
                    description=im["description"],
                    source_page=1,
                    is_internal=True,
                    milestone_type=im["milestone_type"]
                )
                db.add(im_row)

            # Persist Clarifications
            for cl in ai_data.get("clarifications", []):
                clar_row = TenderClarification(
                    tender_id=tender.id,
                    clause_reference=cl.get("clause_reference"),
                    question=cl.get("question"),
                    reason=cl.get("reason"),
                    source_page=cl.get("source_page", 1),
                    priority=cl.get("priority", "MEDIUM"),
                    status="Draft"
                )
                db.add(clar_row)

            # Step 4: Deterministic Calculations
            tender.status = "calculating"
            tender.status_step = 4
            await db.commit()

            # Cost Estimation
            cost_res = CostProfitEngine.estimate_cost(
                tender_value=tender.estimated_value,
                industry=tender.industry,
                contract_duration_months=12
            )
            cost_row = TenderCostEstimate(
                tender_id=tender.id,
                labour_cost=cost_res["labour_cost"],
                materials_cost=cost_res["materials_cost"],
                equipment_cost=cost_res["equipment_cost"],
                software_tech_cost=cost_res["software_tech_cost"],
                travel_cost=cost_res["travel_cost"],
                subcontracting_cost=cost_res["subcontracting_cost"],
                overhead_admin_cost=cost_res["overhead_admin_cost"],
                contingency_cost=cost_res["contingency_cost"],
                total_estimated_cost=cost_res["total_estimated_cost"],
                assumptions=cost_res["assumptions"]
            )
            db.add(cost_row)
            tender.estimated_cost = cost_res["total_estimated_cost"]

            # Profit Scenarios
            profit_res = CostProfitEngine.calculate_profit_scenarios(
                tender_value=tender.estimated_value,
                cost_breakdown=cost_res
            )
            profit_row = TenderProfitScenario(
                tender_id=tender.id,
                tender_value=profit_res["tender_value"],
                optimistic_profit=profit_res["optimistic_profit"],
                optimistic_margin=profit_res["optimistic_margin"],
                expected_profit=profit_res["expected_profit"],
                expected_margin=profit_res["expected_margin"],
                pessimistic_profit=profit_res["pessimistic_profit"],
                pessimistic_margin=profit_res["pessimistic_margin"],
                risk_reserve=profit_res["risk_reserve"],
                financing_cost=profit_res["financing_cost"]
            )
            db.add(profit_row)
            tender.expected_profit = profit_res["expected_profit"]
            tender.profit_margin = profit_res["expected_margin"]

            # Resource Capacity
            res_calc = ResourceEngine.calculate_resource_requirements(
                tender_value=tender.estimated_value,
                industry=tender.industry,
                company_engineers_available=company.engineers_count,
                company_workforce_total=company.workforce_count
            )
            res_row = TenderResourceRequirement(
                tender_id=tender.id,
                required_engineers=res_calc["required_engineers"],
                available_engineers=res_calc["available_engineers"],
                gap_engineers=res_calc["gap_engineers"],
                required_pm=res_calc["required_pm"],
                required_technicians=res_calc["required_technicians"],
                preparation_hours_needed=res_calc["preparation_hours_needed"],
                action_recommended=res_calc["action_recommended"],
                notes=res_calc["notes"]
            )
            db.add(res_row)

            # Complexity & Effort
            comp_score = ComplexityEffortEngine.calculate_complexity(
                page_count=tender.page_count,
                requirements_count=len(ai_data.get("eligibility", [])),
                risks_count=len(ai_data.get("risks", [])),
                documents_count=len(ai_data.get("documents", [])),
                estimated_value=tender.estimated_value
            )
            tender.complexity_score = comp_score
            effort_res = ComplexityEffortEngine.estimate_bid_effort(comp_score)
            tender.bid_effort_hours = effort_res["total_effort_hours"]

            # Opportunity Score
            high_risks = sum(1 for rk in ai_data.get("risks", []) if rk.get("severity") == "HIGH")
            opp_res = OpportunityEngine.calculate_opportunity_score(
                readiness_score=eval_result["readiness_score"],
                score_breakdown=eval_result["score_breakdown"],
                expected_profit_margin=profit_res["expected_margin"],
                risk_count=len(ai_data.get("risks", [])),
                high_risk_count=high_risks,
                resource_gap_count=res_calc["gap_engineers"],
                tender_value=tender.estimated_value
            )
            tender.opportunity_score = opp_res["opportunity_score"]
            tender.opportunity_verdict = opp_res["opportunity_verdict"]
            tender.opportunity_breakdown = opp_res["breakdown"]

            # Save Tender Analysis
            sb = eval_result["score_breakdown"]
            analysis_record = TenderAnalysis(
                tender_id=tender.id,
                executive_summary=ai_data.get("executive_summary"),
                readiness_score=eval_result["readiness_score"],
                eligibility_score=sb["eligibility"]["earned"],
                technical_score=sb["technical"]["earned"],
                experience_score=sb["experience"]["earned"],
                financial_score=sb["financial"]["earned"],
                documents_score=sb["documents"]["earned"],
                recommendation=eval_result["recommendation"],
                recommendation_reasons=eval_result["reasons"],
                raw_ai_response=ai_data
            )
            db.add(analysis_record)

            # Auto-generate initial actionable tasks
            initial_tasks = TaskGenerator.generate_tasks_for_tender(
                tender_id=tender.id,
                company_id=company.id,
                evaluated_requirements=eval_result["evaluated_requirements"],
                evaluated_documents=eval_result["evaluated_documents"],
                risks=ai_data.get("risks", []),
                deadline_date_str=submission_deadline_str
            )
            for tsk in initial_tasks:
                task_row = BidTask(
                    tender_id=tsk["tender_id"],
                    company_id=tsk["company_id"],
                    title=tsk["title"],
                    description=tsk["description"],
                    category=tsk["category"],
                    assignee_role=tsk["assignee_role"],
                    priority=tsk["priority"],
                    status=tsk["status"],
                    due_date=tsk["due_date"],
                    is_ai_generated=True
                )
                db.add(task_row)

            # Step 5: Completed
            tender.status = "completed"
            tender.status_step = 5
            await db.commit()

        except Exception as e:
            await db.rollback()
            t_err = await db.execute(select(Tender).where(Tender.id == tender_id))
            tend = t_err.scalars().first()
            if tend:
                tend.status = "failed"
                tend.error_message = str(e)
                await db.commit()
            print(f"Background tender processing failed: {e}")

@router.post("/upload")
async def upload_tender(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a standard PDF document."
        )

    company = await _ensure_company_for_user(current_user.id, db)

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="The uploaded PDF file is empty.")

    if len(content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB."
        )

    file_id = str(uuid.uuid4())
    stored_filename = f"{file_id}_{file.filename}"
    file_path = os.path.join(settings.STORAGE_DIR, "tenders", stored_filename)

    with open(file_path, "wb") as f:
        f.write(content)

    new_tender = Tender(
        id=file_id,
        user_id=current_user.id,
        title=file.filename.replace(".pdf", "").replace("_", " "),
        file_name=file.filename,
        file_path=file_path,
        file_size=len(content),
        status="extracting",
        status_step=1
    )
    db.add(new_tender)
    await db.commit()

    # Enqueue background intelligence processing
    background_tasks.add_task(
        run_tender_processing_pipeline,
        tender_id=file_id,
        company_id=company.id,
        file_path=file_path
    )

    return {
        "id": new_tender.id,
        "title": new_tender.title,
        "status": "extracting",
        "status_step": 1,
        "message": "Tender uploaded successfully. Intelligence processing initiated in background."
    }

@router.get("", response_model=List[TenderOut])
async def list_tenders(
    q: Optional[str] = Query(None, description="Search term for title, organization, reference number"),
    recommendation: Optional[str] = Query(None, description="Filter: suitable, caution, not_recommended"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Tender)
        .options(selectinload(Tender.analysis))
        .where(Tender.user_id == current_user.id)
        .order_by(Tender.created_at.desc())
    )
    result = await db.execute(stmt)
    tenders = result.scalars().all()

    filtered = tenders
    if q:
        query_str = q.lower()
        filtered = [
            t for t in filtered
            if (t.title and query_str in t.title.lower())
            or (t.organization and query_str in t.organization.lower())
            or (t.reference_number and query_str in t.reference_number.lower())
            or (t.industry and query_str in t.industry.lower())
        ]

    if recommendation:
        rec_val = recommendation.upper().replace("_", " ")
        filtered = [
            t for t in filtered
            if t.analysis and rec_val in t.analysis.recommendation.upper()
        ]

    return filtered

@router.post("/compare")
async def compare_tenders(
    req: CompareRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not req.tender_ids or len(req.tender_ids) < 2:
        raise HTTPException(status_code=400, detail="Please select at least 2 tenders to compare.")

    stmt = (
        select(Tender)
        .options(
            selectinload(Tender.analysis),
            selectinload(Tender.cost_estimate),
            selectinload(Tender.profit_scenario),
            selectinload(Tender.resource_requirement),
            selectinload(Tender.risks)
        )
        .where(Tender.id.in_(req.tender_ids), Tender.user_id == current_user.id)
    )
    result = await db.execute(stmt)
    tenders = result.scalars().all()

    tender_records = []
    for t in tenders:
        high_r_cnt = sum(1 for rk in t.risks if rk.severity == "HIGH") if t.risks else 0
        tender_records.append({
            "id": t.id,
            "title": t.title,
            "organization": t.organization or "Procuring Authority",
            "estimated_value": t.estimated_value,
            "estimated_value_display": t.estimated_value_display,
            "readiness_score": t.analysis.readiness_score if t.analysis else 0,
            "opportunity_score": t.opportunity_score,
            "opportunity_verdict": t.opportunity_verdict,
            "estimated_cost": t.estimated_cost,
            "expected_profit": t.expected_profit,
            "profit_margin": t.profit_margin or 0.0,
            "high_risk_count": high_r_cnt,
            "gap_engineers": t.resource_requirement.gap_engineers if t.resource_requirement else 0,
            "bid_effort_hours": t.bid_effort_hours,
            "complexity_score": t.complexity_score,
            "submission_deadline": "Refer Tender Doc"
        })

    return PortfolioOptimizer.compare_tenders(tender_records)

@router.get("/best")
async def get_best_tenders(
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
            selectinload(Tender.risks)
        )
        .where(Tender.user_id == current_user.id, Tender.status == "completed")
    )
    result = await db.execute(stmt)
    tenders = result.scalars().all()

    tender_dicts = []
    for t in tenders:
        high_r_cnt = sum(1 for rk in t.risks if rk.severity == "HIGH") if t.risks else 0
        tender_dicts.append({
            "id": t.id,
            "title": t.title,
            "opportunity_score": t.opportunity_score,
            "opportunity_verdict": t.opportunity_verdict,
            "readiness_score": t.analysis.readiness_score if t.analysis else 0,
            "expected_profit": t.expected_profit or 0.0,
            "profit_margin": t.profit_margin or 0.0,
            "estimated_value": t.estimated_value or 0.0,
            "gap_engineers": t.resource_requirement.gap_engineers if t.resource_requirement else 0,
            "high_risk_count": high_r_cnt
        })

    return PortfolioOptimizer.rank_best_tenders(
        tenders=tender_dicts,
        company_capital=company.working_capital if company else 0.0,
        company_engineers=company.engineers_count if company else 5
    )

@router.get("/{tender_id}", response_model=TenderOut)
async def get_tender(
    tender_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Tender)
        .options(selectinload(Tender.analysis))
        .where(Tender.id == tender_id, Tender.user_id == current_user.id)
    )
    result = await db.execute(stmt)
    tender = result.scalars().first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found or access denied.")
    return tender

@router.get("/{tender_id}/analysis", response_model=TenderAnalysisOut)
async def get_tender_analysis(
    tender_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    t_stmt = select(Tender).where(Tender.id == tender_id, Tender.user_id == current_user.id)
    t_res = await db.execute(t_stmt)
    if not t_res.scalars().first():
        raise HTTPException(status_code=404, detail="Tender not found.")

    stmt = select(TenderAnalysis).where(TenderAnalysis.tender_id == tender_id)
    result = await db.execute(stmt)
    analysis = result.scalars().first()
    if not analysis:
        return TenderAnalysisOut(
            id=str(uuid.uuid4()),
            tender_id=tender_id,
            executive_summary="AI processing in progress. Parsing tender clauses and evaluating qualifications...",
            readiness_score=0.0,
            eligibility_score=0.0,
            technical_score=0.0,
            financial_score=0.0,
            experience_score=0.0,
            documents_score=0.0,
            recommendation="PROCESSING",
            recommendation_reasons=["Document ingestion and clause extraction in progress."],
            key_highlights=[],
            critical_warnings=[],
            action_items=[]
        )
    return analysis

@router.get("/{tender_id}/requirements", response_model=List[TenderRequirementOut])
async def get_tender_requirements(
    tender_id: str,
    match_result: Optional[str] = Query(None, description="Filter: PASS, PARTIAL, FAIL, UNKNOWN"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    t_stmt = select(Tender).where(Tender.id == tender_id, Tender.user_id == current_user.id)
    t_res = await db.execute(t_stmt)
    if not t_res.scalars().first():
        raise HTTPException(status_code=404, detail="Tender not found.")

    stmt = select(TenderRequirement).where(TenderRequirement.tender_id == tender_id)
    if match_result:
        stmt = stmt.where(TenderRequirement.match_result == match_result.upper())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{tender_id}/documents", response_model=List[TenderDocumentOut])
async def get_tender_documents(
    tender_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    t_stmt = select(Tender).where(Tender.id == tender_id, Tender.user_id == current_user.id)
    t_res = await db.execute(t_stmt)
    if not t_res.scalars().first():
        raise HTTPException(status_code=404, detail="Tender not found.")

    stmt = select(TenderDocumentChecklist).where(TenderDocumentChecklist.tender_id == tender_id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.patch("/{tender_id}/documents/{doc_id}", response_model=TenderDocumentOut)
async def update_tender_document(
    tender_id: str,
    doc_id: str,
    update_data: TenderDocumentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    t_stmt = select(Tender).where(Tender.id == tender_id, Tender.user_id == current_user.id)
    t_res = await db.execute(t_stmt)
    if not t_res.scalars().first():
        raise HTTPException(status_code=404, detail="Tender not found.")

    stmt = select(TenderDocumentChecklist).where(
        TenderDocumentChecklist.id == doc_id,
        TenderDocumentChecklist.tender_id == tender_id
    )
    result = await db.execute(stmt)
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Checklist document not found.")

    if update_data.status is not None:
        doc.status = update_data.status
    if update_data.notes is not None:
        doc.notes = update_data.notes

    await db.commit()
    await db.refresh(doc)
    return doc

@router.get("/{tender_id}/risks", response_model=List[TenderRiskOut])
async def get_tender_risks(
    tender_id: str,
    severity: Optional[str] = Query(None, description="HIGH, MEDIUM, LOW"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    t_stmt = select(Tender).where(Tender.id == tender_id, Tender.user_id == current_user.id)
    t_res = await db.execute(t_stmt)
    if not t_res.scalars().first():
        raise HTTPException(status_code=404, detail="Tender not found.")

    stmt = select(TenderRisk).where(TenderRisk.tender_id == tender_id)
    if severity:
        stmt = stmt.where(TenderRisk.severity == severity.upper())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{tender_id}/deadlines", response_model=List[TenderDeadlineOut])
async def get_tender_deadlines(
    tender_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    t_stmt = select(Tender).where(Tender.id == tender_id, Tender.user_id == current_user.id)
    t_res = await db.execute(t_stmt)
    if not t_res.scalars().first():
        raise HTTPException(status_code=404, detail="Tender not found.")

    stmt = select(TenderDeadline).where(TenderDeadline.tender_id == tender_id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{tender_id}/cost", response_model=CostEstimateOut)
async def get_tender_cost(
    tender_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(TenderCostEstimate).where(TenderCostEstimate.tender_id == tender_id)
    result = await db.execute(stmt)
    cost = result.scalars().first()
    if not cost:
        # Fallback calculate on the fly
        t_res = await db.execute(select(Tender).where(Tender.id == tender_id))
        tender = t_res.scalars().first()
        if not tender:
            raise HTTPException(status_code=404, detail="Tender not found.")
        c_calc = CostProfitEngine.estimate_cost(tender.estimated_value, tender.industry)
        cost = TenderCostEstimate(
            tender_id=tender.id,
            labour_cost=c_calc["labour_cost"],
            materials_cost=c_calc["materials_cost"],
            equipment_cost=c_calc["equipment_cost"],
            software_tech_cost=c_calc["software_tech_cost"],
            travel_cost=c_calc["travel_cost"],
            subcontracting_cost=c_calc["subcontracting_cost"],
            overhead_admin_cost=c_calc["overhead_admin_cost"],
            contingency_cost=c_calc["contingency_cost"],
            total_estimated_cost=c_calc["total_estimated_cost"],
            assumptions=c_calc["assumptions"]
        )
        db.add(cost)
        await db.commit()
        await db.refresh(cost)
    return cost

@router.get("/{tender_id}/profit", response_model=ProfitScenarioOut)
async def get_tender_profit(
    tender_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(TenderProfitScenario).where(TenderProfitScenario.tender_id == tender_id)
    result = await db.execute(stmt)
    profit = result.scalars().first()
    if not profit:
        # Calculate from cost
        t_res = await db.execute(select(Tender).where(Tender.id == tender_id))
        tender = t_res.scalars().first()
        if not tender:
            raise HTTPException(status_code=404, detail="Tender not found.")
        c_calc = CostProfitEngine.estimate_cost(tender.estimated_value, tender.industry)
        p_calc = CostProfitEngine.calculate_profit_scenarios(tender.estimated_value, c_calc)
        profit = TenderProfitScenario(
            tender_id=tender.id,
            tender_value=p_calc["tender_value"],
            optimistic_profit=p_calc["optimistic_profit"],
            optimistic_margin=p_calc["optimistic_margin"],
            expected_profit=p_calc["expected_profit"],
            expected_margin=p_calc["expected_margin"],
            pessimistic_profit=p_calc["pessimistic_profit"],
            pessimistic_margin=p_calc["pessimistic_margin"],
            risk_reserve=p_calc["risk_reserve"],
            financing_cost=p_calc["financing_cost"]
        )
        db.add(profit)
        await db.commit()
        await db.refresh(profit)
    return profit

@router.get("/{tender_id}/resources", response_model=ResourceRequirementOut)
async def get_tender_resources(
    tender_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(TenderResourceRequirement).where(TenderResourceRequirement.tender_id == tender_id)
    result = await db.execute(stmt)
    res = result.scalars().first()
    if not res:
        t_res = await db.execute(select(Tender).where(Tender.id == tender_id))
        tender = t_res.scalars().first()
        comp_res = await db.execute(select(Company).where(Company.user_id == current_user.id))
        company = comp_res.scalars().first()
        r_calc = ResourceEngine.calculate_resource_requirements(
            tender_value=tender.estimated_value if tender else None,
            industry=tender.industry if tender else "IT",
            company_engineers_available=company.engineers_count if company else 5
        )
        res = TenderResourceRequirement(
            tender_id=tender_id,
            required_engineers=r_calc["required_engineers"],
            available_engineers=r_calc["available_engineers"],
            gap_engineers=r_calc["gap_engineers"],
            required_pm=r_calc["required_pm"],
            required_technicians=r_calc["required_technicians"],
            preparation_hours_needed=r_calc["preparation_hours_needed"],
            action_recommended=r_calc["action_recommended"],
            notes=r_calc["notes"]
        )
        db.add(res)
        await db.commit()
        await db.refresh(res)
    return res

@router.get("/{tender_id}/clarifications", response_model=List[ClarificationOut])
async def get_tender_clarifications(
    tender_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(TenderClarification).where(TenderClarification.tender_id == tender_id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.put("/{tender_id}/clarifications/{clarification_id}")
async def update_clarification(
    tender_id: str,
    clarification_id: str,
    body: ClarificationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(TenderClarification).where(
        TenderClarification.id == clarification_id,
        TenderClarification.tender_id == tender_id
    )
    res = await db.execute(stmt)
    clar = res.scalars().first()
    if not clar:
        raise HTTPException(status_code=404, detail="Clarification not found.")
    if body.status: clar.status = body.status
    if body.answer: clar.answer = body.answer
    await db.commit()
    return {"message": "Clarification updated successfully"}

@router.post("/{tender_id}/start-bid")
async def start_bid_workspace(
    tender_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Activates bid workspace for this tender and auto-creates milestone tasks if not existing.
    """
    stmt = select(Tender).where(Tender.id == tender_id, Tender.user_id == current_user.id)
    res = await db.execute(stmt)
    tender = res.scalars().first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found.")

    tender.workspace_active = True
    tender.bid_decision = "BID"
    tender.bid_status = "IN_PROGRESS"
    await db.commit()
    return {"message": "Bid Workspace activated successfully", "workspace_active": True}

@router.post("/{tender_id}/recalculate")
async def recalculate_readiness(
    tender_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Fixes recalculation: correctly updates document statuses in DB AND re-evaluates
    Opportunity, Cost, Profit, and Resource capacity.
    """
    stmt = (
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
        .where(Tender.id == tender_id, Tender.user_id == current_user.id)
    )
    result = await db.execute(stmt)
    tender = result.scalars().first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found.")

    company = await _ensure_company_for_user(current_user.id, db)

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

    # 1. Update Requirements
    for idx, r_eval in enumerate(eval_result["evaluated_requirements"]):
        if idx < len(tender.requirements):
            t_req = tender.requirements[idx]
            t_req.company_status = r_eval["company_status"]
            t_req.match_result = r_eval["match_result"]
            t_req.match_reason = r_eval["match_reason"]

    # 2. FIX CRITICAL BUG: Update Document Checklist statuses in DB!
    for idx, d_eval in enumerate(eval_result["evaluated_documents"]):
        if idx < len(tender.documents):
            t_doc = tender.documents[idx]
            t_doc.status = d_eval["status"]
            t_doc.notes = d_eval.get("notes")

    # 3. Update Analysis Record
    sb = eval_result["score_breakdown"]
    if tender.analysis:
        tender.analysis.readiness_score = eval_result["readiness_score"]
        tender.analysis.eligibility_score = sb["eligibility"]["earned"]
        tender.analysis.technical_score = sb["technical"]["earned"]
        tender.analysis.experience_score = sb["experience"]["earned"]
        tender.analysis.financial_score = sb["financial"]["earned"]
        tender.analysis.documents_score = sb["documents"]["earned"]
        tender.analysis.recommendation = eval_result["recommendation"]
        tender.analysis.recommendation_reasons = eval_result["reasons"]

    # 4. Re-calculate Cost & Profit
    cost_calc = CostProfitEngine.estimate_cost(tender.estimated_value, tender.industry)
    profit_calc = CostProfitEngine.calculate_profit_scenarios(tender.estimated_value, cost_calc)
    tender.estimated_cost = cost_calc["total_estimated_cost"]
    tender.expected_profit = profit_calc["expected_profit"]
    tender.profit_margin = profit_calc["expected_margin"]

    if tender.cost_estimate:
        tender.cost_estimate.total_estimated_cost = cost_calc["total_estimated_cost"]
        tender.cost_estimate.labour_cost = cost_calc["labour_cost"]
        tender.cost_estimate.materials_cost = cost_calc["materials_cost"]

    if tender.profit_scenario:
        tender.profit_scenario.expected_profit = profit_calc["expected_profit"]
        tender.profit_scenario.expected_margin = profit_calc["expected_margin"]

    # 5. Re-calculate Resources
    res_calc = ResourceEngine.calculate_resource_requirements(
        tender_value=tender.estimated_value,
        industry=tender.industry,
        company_engineers_available=company.engineers_count
    )
    if tender.resource_requirement:
        tender.resource_requirement.available_engineers = res_calc["available_engineers"]
        tender.resource_requirement.gap_engineers = res_calc["gap_engineers"]
        tender.resource_requirement.action_recommended = res_calc["action_recommended"]

    # 6. Re-calculate Opportunity Score
    high_risks = sum(1 for rk in tender.risks if rk.severity == "HIGH") if tender.risks else 0
    opp_calc = OpportunityEngine.calculate_opportunity_score(
        readiness_score=eval_result["readiness_score"],
        score_breakdown=sb,
        expected_profit_margin=profit_calc["expected_margin"],
        risk_count=len(tender.risks) if tender.risks else 0,
        high_risk_count=high_risks,
        resource_gap_count=res_calc["gap_engineers"],
        tender_value=tender.estimated_value
    )
    tender.opportunity_score = opp_calc["opportunity_score"]
    tender.opportunity_verdict = opp_calc["opportunity_verdict"]
    tender.opportunity_breakdown = opp_calc["breakdown"]

    await db.commit()
    return {
        "message": "Tender readiness and intelligence recalculated successfully",
        "readiness_score": eval_result["readiness_score"],
        "opportunity_score": opp_calc["opportunity_score"],
        "opportunity_verdict": opp_calc["opportunity_verdict"],
        "recommendation": eval_result["recommendation"]
    }

@router.get("/{tender_id}/export-pdf")
@router.get("/{tender_id}/report/pdf")
async def export_tender_report_pdf(
    tender_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Tender)
        .options(
            selectinload(Tender.analysis),
            selectinload(Tender.requirements),
            selectinload(Tender.documents),
            selectinload(Tender.risks),
            selectinload(Tender.deadlines),
            selectinload(Tender.cost_estimate),
            selectinload(Tender.profit_scenario),
            selectinload(Tender.resource_requirement)
        )
        .where(Tender.id == tender_id, Tender.user_id == current_user.id)
    )
    res = await db.execute(stmt)
    tender = res.scalars().first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found.")

    tender_data = {
        "tender": {
            "title": tender.title,
            "reference_number": tender.reference_number,
            "organization": tender.organization,
            "location": tender.location,
            "contract_duration": tender.contract_duration,
            "estimated_value_display": tender.estimated_value_display,
            "opportunity_score": tender.opportunity_score,
            "opportunity_verdict": tender.opportunity_verdict
        },
        "analysis": {
            "readiness_score": tender.analysis.readiness_score if tender.analysis else 0,
            "recommendation": tender.analysis.recommendation if tender.analysis else "PENDING",
            "executive_summary": tender.analysis.executive_summary if tender.analysis else ""
        },
        "cost_estimate": {
            "labour_cost": tender.cost_estimate.labour_cost if tender.cost_estimate else 0,
            "materials_cost": tender.cost_estimate.materials_cost if tender.cost_estimate else 0,
            "equipment_cost": tender.cost_estimate.equipment_cost if tender.cost_estimate else 0,
            "software_tech_cost": tender.cost_estimate.software_tech_cost if tender.cost_estimate else 0,
            "subcontracting_cost": tender.cost_estimate.subcontracting_cost if tender.cost_estimate else 0,
            "overhead_admin_cost": tender.cost_estimate.overhead_admin_cost if tender.cost_estimate else 0,
            "contingency_cost": tender.cost_estimate.contingency_cost if tender.cost_estimate else 0,
            "total_estimated_cost": tender.cost_estimate.total_estimated_cost if tender.cost_estimate else 0
        },
        "profit_scenario": {
            "optimistic_profit": tender.profit_scenario.optimistic_profit if tender.profit_scenario else 0,
            "optimistic_margin": tender.profit_scenario.optimistic_margin if tender.profit_scenario else 0,
            "expected_profit": tender.profit_scenario.expected_profit if tender.profit_scenario else 0,
            "expected_margin": tender.profit_scenario.expected_margin if tender.profit_scenario else 0,
            "pessimistic_profit": tender.profit_scenario.pessimistic_profit if tender.profit_scenario else 0,
            "pessimistic_margin": tender.profit_scenario.pessimistic_margin if tender.profit_scenario else 0,
            "risk_reserve": tender.profit_scenario.risk_reserve if tender.profit_scenario else 0
        },
        "requirements": [
            {
                "requirement_title": r.requirement_title,
                "tender_requirement": r.tender_requirement,
                "company_status": r.company_status,
                "match_result": r.match_result,
                "source_page": r.source_page
            }
            for r in tender.requirements
        ],
        "risks": [
            {
                "title": r.title,
                "severity": r.severity,
                "description": r.description,
                "mitigation_suggestion": r.mitigation_suggestion
            }
            for r in tender.risks
        ]
    }

    pdf_buffer = ReportGenerator.generate_tender_pdf(tender_data)
    filename = f"TenderIQ_Report_{tender.reference_number or tender.id[:8]}.pdf".replace("/", "_")
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/{tender_id}/pdf")
async def get_tender_pdf(
    tender_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Tender).where(Tender.id == tender_id, Tender.user_id == current_user.id)
    result = await db.execute(stmt)
    tender = result.scalars().first()
    if not tender or not os.path.exists(tender.file_path):
        raise HTTPException(status_code=404, detail="PDF document not found.")

    return FileResponse(
        tender.file_path,
        media_type="application/pdf",
        filename=tender.file_name
    )

@router.delete("/{tender_id}")
async def delete_tender(
    tender_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Tender).where(Tender.id == tender_id, Tender.user_id == current_user.id)
    result = await db.execute(stmt)
    tender = result.scalars().first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found.")

    try:
        if os.path.exists(tender.file_path):
            os.remove(tender.file_path)
    except Exception:
        pass

    await db.delete(tender)
    await db.commit()
    return {"message": "Tender and associated analysis removed successfully"}
