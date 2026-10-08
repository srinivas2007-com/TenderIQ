from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    company_name: str
    phone_number: Optional[str] = None
    industry: Optional[str] = None
    company_type: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)

class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    phone_number: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Company Schemas ---
class TurnoverHistoryItem(BaseModel):
    year: str
    turnover: float

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    company_type: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "India"
    website: Optional[str] = None
    
    annual_turnover: Optional[float] = None  # in Crores (INR)
    average_turnover: Optional[float] = None
    turnover_history: Optional[List[Dict[str, Any]]] = None
    financial_year: Optional[str] = None
    working_capital: Optional[float] = None
    credit_rating: Optional[str] = None
    
    years_in_business: Optional[int] = None
    relevant_experience_years: Optional[int] = None
    completed_projects_count: Optional[int] = None
    similar_projects_desc: Optional[str] = None
    major_projects: Optional[List[str]] = None
    
    certifications: Optional[List[str]] = None
    services: Optional[List[str]] = None
    products: Optional[List[str]] = None
    technologies: Optional[List[str]] = None
    equipment: Optional[List[str]] = None
    workforce_count: Optional[int] = None
    engineers_count: Optional[int] = None
    team_capacity_hours_weekly: Optional[float] = None
    technical_qualifications: Optional[str] = None
    
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    registration_number: Optional[str] = None
    pf_esi_compliance: Optional[bool] = None
    other_compliance: Optional[str] = None

class CompanyCreate(BaseModel):
    name: str
    company_type: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "India"
    website: Optional[str] = None
    
    annual_turnover: float = 0.0
    average_turnover: float = 0.0
    turnover_history: List[Dict[str, Any]] = []
    financial_year: Optional[str] = "FY 2023-24"
    working_capital: float = 0.0
    
    years_in_business: int = 0
    relevant_experience_years: int = 0
    completed_projects_count: int = 0
    similar_projects_desc: Optional[str] = None
    major_projects: List[str] = []
    
    certifications: List[str] = []
    workforce_count: int = 0
    engineers_count: int = 5
    technical_qualifications: Optional[str] = None
    
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    registration_number: Optional[str] = None

class CompanyFitCriterion(BaseModel):
    name: str
    status: str  # 'pass', 'fail', 'exceeds'
    required_value: str
    company_value: str
    message: str
    score: float
    max_score: float

class CompanyFitEvaluationOut(BaseModel):
    company_id: str
    company_name: str
    tender_id: Optional[str] = None
    tender_title: str
    fit_score: int  # 0-100
    is_eligible: bool
    result_label: str  # "Eligible" or "Not Eligible"
    criteria: Dict[str, CompanyFitCriterion]
    summary_reasons: List[str]

class CompanyListItemOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    name: str
    company_type: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    state: Optional[str] = None
    website: Optional[str] = None
    annual_turnover: float = 0.0
    average_turnover: float = 0.0
    years_in_business: int = 0
    workforce_count: int = 0
    certifications: List[str] = []
    is_sample: bool = False
    
    # Fit evaluation against current/sample tender
    fit_score: Optional[int] = None
    is_eligible: Optional[bool] = None
    result_label: Optional[str] = None

    class Config:
        from_attributes = True

class CompanyOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    name: str
    company_type: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "India"
    website: Optional[str] = None
    
    annual_turnover: float = 0.0
    average_turnover: float = 0.0
    turnover_history: List[Dict[str, Any]] = []
    financial_year: Optional[str] = None
    working_capital: float = 0.0
    credit_rating: Optional[str] = "CRISIL BBB+"
    
    years_in_business: int = 0
    relevant_experience_years: int = 0
    completed_projects_count: int = 0
    similar_projects_desc: Optional[str] = None
    major_projects: List[str] = []
    
    certifications: List[str] = []
    services: List[str] = []
    products: List[str] = []
    technologies: List[str] = []
    equipment: List[str] = []
    workforce_count: int = 0
    engineers_count: int = 5
    team_capacity_hours_weekly: float = 160.0
    technical_qualifications: Optional[str] = None
    
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    registration_number: Optional[str] = None
    pf_esi_compliance: bool = False
    other_compliance: Optional[str] = None
    is_sample: bool = False
    
    completeness_percentage: int = 0
    missing_items: List[str] = []
    
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CompanyDocumentOut(BaseModel):
    id: str
    company_id: str
    doc_type: str
    name: str
    file_path: str
    file_size: int
    mime_type: str
    uploaded_at: datetime

    class Config:
        from_attributes = True

# --- Tender Requirement Schemas ---
class TenderRequirementOut(BaseModel):
    id: str
    tender_id: str
    category: str
    requirement_title: str
    tender_requirement: str
    tender_value: Optional[str] = None
    unit: Optional[str] = None
    mandatory: bool
    source_page: Optional[int] = None
    source_text: Optional[str] = None
    confidence: Optional[float] = 1.0
    company_status: Optional[str] = None
    match_result: str  # PASS, PARTIAL, FAIL, UNKNOWN
    match_reason: Optional[str] = None

    class Config:
        from_attributes = True

# --- Tender Document Checklist Schemas ---
class TenderDocumentOut(BaseModel):
    id: str
    tender_id: str
    name: str
    category: Optional[str] = None
    mandatory: bool
    source_page: Optional[int] = None
    source_text: Optional[str] = None
    confidence: Optional[float] = 1.0
    status: str  # READY, MISSING, PARTIAL
    notes: Optional[str] = None
    file_path: Optional[str] = None

    class Config:
        from_attributes = True

class TenderDocumentUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

# --- Tender Risk Schemas ---
class TenderRiskOut(BaseModel):
    id: str
    tender_id: str
    category: str
    title: str
    severity: str  # HIGH, MEDIUM, LOW
    description: str
    source_page: Optional[int] = None
    source_text: Optional[str] = None
    confidence: Optional[float] = 1.0
    mitigation_suggestion: Optional[str] = None

    class Config:
        from_attributes = True

# --- Tender Deadline Schemas ---
class TenderDeadlineOut(BaseModel):
    id: str
    tender_id: str
    title: str
    deadline_type: str
    deadline_date: Optional[datetime] = None
    deadline_date_display: Optional[str] = None
    description: Optional[str] = None
    source_page: Optional[int] = None
    is_internal: Optional[bool] = False
    milestone_type: Optional[str] = "OFFICIAL"

    class Config:
        from_attributes = True

# --- Tender Analysis Schemas ---
class RecommendationReasons(BaseModel):
    pass_reasons: List[str] = Field(default_factory=list, alias="pass")
    warning_reasons: List[str] = Field(default_factory=list, alias="warning")
    fail_reasons: List[str] = Field(default_factory=list, alias="fail")

    class Config:
        populate_by_name = True

class TenderAnalysisOut(BaseModel):
    id: str
    tender_id: str
    executive_summary: Optional[str] = None
    readiness_score: int
    eligibility_score: float
    technical_score: float
    experience_score: float
    financial_score: float
    documents_score: float
    recommendation: str  # SUITABLE TO APPLY, APPLY WITH CAUTION, NOT RECOMMENDED
    recommendation_reasons: Dict[str, List[str]]
    created_at: datetime

    class Config:
        from_attributes = True

# --- Tender Cost & Profit Schemas ---
class CostEstimateOut(BaseModel):
    tender_id: str
    labour_cost: float = 0.0
    materials_cost: float = 0.0
    equipment_cost: float = 0.0
    software_tech_cost: float = 0.0
    travel_cost: float = 0.0
    subcontracting_cost: float = 0.0
    overhead_admin_cost: float = 0.0
    contingency_cost: float = 0.0
    total_estimated_cost: float = 0.0
    assumptions: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class ProfitScenarioOut(BaseModel):
    tender_id: str
    tender_value: float = 0.0
    optimistic_profit: float = 0.0
    optimistic_margin: float = 0.0
    expected_profit: float = 0.0
    expected_margin: float = 0.0
    pessimistic_profit: float = 0.0
    pessimistic_margin: float = 0.0
    risk_reserve: float = 0.0
    financing_cost: float = 0.0

    class Config:
        from_attributes = True

class ResourceRequirementOut(BaseModel):
    tender_id: str
    required_engineers: int = 0
    available_engineers: int = 0
    gap_engineers: int = 0
    required_pm: int = 1
    required_technicians: int = 0
    preparation_hours_needed: float = 0.0
    action_recommended: str = "SUFFICIENT_INTERNAL_CAPACITY"
    notes: Optional[str] = None
    options: Optional[List[Dict[str, Any]]] = None

    class Config:
        from_attributes = True

class ClarificationOut(BaseModel):
    id: str
    tender_id: str
    clause_reference: Optional[str] = None
    question: str
    reason: Optional[str] = None
    source_page: Optional[int] = None
    priority: str = "MEDIUM"
    status: str = "Draft"
    answer: Optional[str] = None

    class Config:
        from_attributes = True

class ClarificationUpdate(BaseModel):
    status: Optional[str] = None
    answer: Optional[str] = None

class BidTaskOut(BaseModel):
    id: str
    tender_id: str
    company_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    category: str = "Documentation"
    assignee_name: Optional[str] = None
    assignee_role: str = "Bid Manager"
    priority: str = "MEDIUM"
    status: str = "TODO"
    due_date: Optional[datetime] = None
    is_ai_generated: bool = True
    created_at: datetime

    class Config:
        from_attributes = True

class BidTaskCreate(BaseModel):
    tender_id: str
    title: str
    description: Optional[str] = None
    category: Optional[str] = "Documentation"
    assignee_name: Optional[str] = None
    assignee_role: Optional[str] = "Bid Manager"
    priority: Optional[str] = "MEDIUM"
    due_date: Optional[datetime] = None

class BidTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    assignee_name: Optional[str] = None
    assignee_role: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None

class TeamMemberOut(BaseModel):
    id: str
    company_id: str
    name: str
    email: Optional[str] = None
    role: str = "Technical"
    allocated_hours_weekly: float = 40.0

    class Config:
        from_attributes = True

class TeamMemberCreate(BaseModel):
    name: str
    email: Optional[str] = None
    role: Optional[str] = "Technical"
    allocated_hours_weekly: Optional[float] = 40.0

class TeamMemberUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    allocated_hours_weekly: Optional[float] = None

# --- Comparison & Simulation Schemas ---
class CompareRequest(BaseModel):
    tender_ids: List[str]

class SimulationRequest(BaseModel):
    tender_id: Optional[str] = None
    turnover: Optional[float] = None
    working_capital: Optional[float] = None
    engineers_count: Optional[int] = None
    workforce_count: Optional[int] = None
    completed_projects: Optional[int] = None
    certifications: Optional[List[str]] = None
    labour_cost: Optional[float] = None
    materials_cost: Optional[float] = None
    subcontracting_cost: Optional[float] = None
    contingency_cost: Optional[float] = None

class PortfolioOptimizeRequest(BaseModel):
    available_capital: Optional[float] = 0.0
    available_engineers: Optional[int] = 10
    available_prep_hours: Optional[float] = 180.0

# --- Tender Out Schemas ---
class TenderOut(BaseModel):
    id: str
    user_id: str
    title: str
    reference_number: Optional[str] = None
    organization: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    industry: Optional[str] = None
    estimated_value: Optional[float] = None
    estimated_value_display: Optional[str] = None
    emd_amount: Optional[float] = None
    emd_display: Optional[str] = None
    performance_security: Optional[str] = None
    contract_duration: Optional[str] = None
    file_name: str
    file_size: int
    page_count: int
    status: str
    status_step: int
    error_message: Optional[str] = None
    
    # TenderIQ Expanded Metrics
    opportunity_score: float = 0.0
    opportunity_verdict: str = "NOT EVALUATED"
    opportunity_breakdown: Optional[Dict[str, Any]] = None
    complexity_score: float = 0.0
    bid_effort_hours: float = 0.0
    estimated_cost: Optional[float] = None
    expected_profit: Optional[float] = None
    profit_margin: Optional[float] = None
    bid_decision: str = "PENDING"
    workspace_active: bool = False
    bid_status: str = "DRAFT"

    created_at: datetime
    updated_at: datetime
    analysis: Optional[TenderAnalysisOut] = None

    class Config:
        from_attributes = True

class DashboardStatsOut(BaseModel):
    total_tenders: int
    suitable_count: int
    caution_count: int
    not_recommended_count: int
    upcoming_deadlines_count: int
    average_readiness_score: float
    potential_tender_value: float = 0.0
    expected_profit_total: float = 0.0
    open_tasks_count: int = 0
    recent_tenders: List[TenderOut]
    score_distribution: List[Dict[str, Any]]
    top_opportunities: List[Dict[str, Any]] = []
    resource_conflicts: Optional[Dict[str, Any]] = None
    deadline_risks: List[Dict[str, Any]] = []
    heat_map_points: List[Dict[str, Any]] = []
