import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, Integer, Float, Boolean, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone_number = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    company = relationship("Company", back_populates="user", uselist=False, cascade="all, delete-orphan")
    tenders = relationship("Tender", back_populates="user", cascade="all, delete-orphan")


class Company(Base):
    __tablename__ = "companies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    is_sample = Column(Boolean, default=False)
    
    # Basic Information
    name = Column(String(255), nullable=False)
    company_type = Column(String(100), nullable=True)  # Private Limited, Proprietorship, LLP, Partnership, etc.
    industry = Column(String(100), nullable=True)  # IT, Civil Construction, Electrical, Healthcare, etc.
    description = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), default="India")
    website = Column(String(255), nullable=True)
    
    # Financial Information
    annual_turnover = Column(Float, default=0.0)  # in INR (Crores or exact amount)
    average_turnover = Column(Float, default=0.0)
    turnover_history = Column(JSON, default=list)  # [{"year": "FY 2023-24", "turnover": 8.5}, ...]
    financial_year = Column(String(50), default="2023-2024")
    working_capital = Column(Float, default=0.0)  # in INR
    credit_rating = Column(String(50), default="CRISIL BBB+")
    
    # Experience
    years_in_business = Column(Integer, default=0)
    relevant_experience_years = Column(Integer, default=0)
    completed_projects_count = Column(Integer, default=0)
    similar_projects_desc = Column(Text, nullable=True)
    major_projects = Column(JSON, default=list)  # ["College ERP System", ...]
    
    # Certifications & Registrations
    certifications = Column(JSON, default=list)  # ["ISO 9001", "ISO 27001", "MSME/Udyam", "GST"]
    
    # Technical Capabilities & Resources (Digital Twin)
    services = Column(JSON, default=list)
    products = Column(JSON, default=list)
    technologies = Column(JSON, default=list)
    equipment = Column(JSON, default=list)
    workforce_count = Column(Integer, default=0)
    engineers_count = Column(Integer, default=5)
    team_capacity_hours_weekly = Column(Float, default=160.0)
    active_bids_count = Column(Integer, default=0)
    technical_qualifications = Column(Text, nullable=True)
    
    # Legal & Compliance
    gst_number = Column(String(50), nullable=True)
    pan_number = Column(String(50), nullable=True)
    registration_number = Column(String(100), nullable=True)
    pf_esi_compliance = Column(Boolean, default=False)
    other_compliance = Column(Text, nullable=True)
    
    # Metrics
    completeness_percentage = Column(Integer, default=0)
    missing_items = Column(JSON, default=list)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="company")
    documents = relationship("CompanyDocument", back_populates="company", cascade="all, delete-orphan")
    tasks = relationship("BidTask", back_populates="company", cascade="all, delete-orphan")
    team_members = relationship("TeamMember", back_populates="company", cascade="all, delete-orphan")
    outcomes = relationship("TenderOutcome", back_populates="company", cascade="all, delete-orphan")


class CompanyDocument(Base):
    __tablename__ = "company_documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    doc_type = Column(String(100), nullable=False)  # GST, PAN, ISO, MSME, Audit_Report, Experience_Cert
    name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)
    mime_type = Column(String(100), default="application/pdf")
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="documents")


class Tender(Base):
    __tablename__ = "tenders"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String(500), nullable=False)
    reference_number = Column(String(200), nullable=True)
    organization = Column(String(255), nullable=True)
    department = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    industry = Column(String(100), nullable=True)
    
    estimated_value = Column(Float, nullable=True)  # in INR
    estimated_value_display = Column(String(100), nullable=True)
    emd_amount = Column(Float, nullable=True)
    emd_display = Column(String(100), nullable=True)
    performance_security = Column(String(255), nullable=True)
    contract_duration = Column(String(100), nullable=True)
    
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)
    page_count = Column(Integer, default=0)
    
    # Status: uploading, extracting, analyzing, matching, calculating, completed, failed
    status = Column(String(50), default="uploading")
    status_step = Column(Integer, default=1)  # 1 to 5
    error_message = Column(Text, nullable=True)

    # Opportunity, Financial & Operational Metrics
    opportunity_score = Column(Float, default=0.0)
    opportunity_verdict = Column(String(100), default="NOT EVALUATED")  # HIGHLY RECOMMENDED, RECOMMENDED, REVIEW CAREFULLY, HIGH RISK, NOT RECOMMENDED
    opportunity_breakdown = Column(JSON, nullable=True)
    complexity_score = Column(Float, default=0.0)
    bid_effort_hours = Column(Float, default=0.0)
    estimated_cost = Column(Float, nullable=True)
    expected_profit = Column(Float, nullable=True)
    profit_margin = Column(Float, nullable=True)
    
    # Workspace & Bid Operation Tracking
    bid_decision = Column(String(50), default="PENDING")  # BID, NO_BID, PENDING
    workspace_active = Column(Boolean, default=False)
    bid_status = Column(String(50), default="DRAFT")  # DRAFT, IN_PROGRESS, REVIEW, SUBMITTED, WON, LOST
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="tenders")
    analysis = relationship("TenderAnalysis", back_populates="tender", uselist=False, cascade="all, delete-orphan")
    requirements = relationship("TenderRequirement", back_populates="tender", cascade="all, delete-orphan")
    documents = relationship("TenderDocumentChecklist", back_populates="tender", cascade="all, delete-orphan")
    risks = relationship("TenderRisk", back_populates="tender", cascade="all, delete-orphan")
    deadlines = relationship("TenderDeadline", back_populates="tender", cascade="all, delete-orphan")
    cost_estimate = relationship("TenderCostEstimate", back_populates="tender", uselist=False, cascade="all, delete-orphan")
    profit_scenario = relationship("TenderProfitScenario", back_populates="tender", uselist=False, cascade="all, delete-orphan")
    resource_requirement = relationship("TenderResourceRequirement", back_populates="tender", uselist=False, cascade="all, delete-orphan")
    clarifications = relationship("TenderClarification", back_populates="tender", cascade="all, delete-orphan")
    tasks = relationship("BidTask", back_populates="tender", cascade="all, delete-orphan")
    outcomes = relationship("TenderOutcome", back_populates="tender", cascade="all, delete-orphan")


class TenderAnalysis(Base):
    __tablename__ = "tender_analysis"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tender_id = Column(String(36), ForeignKey("tenders.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    executive_summary = Column(Text, nullable=True)
    
    # Bid Readiness Score (0 - 100)
    readiness_score = Column(Integer, default=0)
    eligibility_score = Column(Float, default=0.0)      # max 40
    technical_score = Column(Float, default=0.0)        # max 20
    experience_score = Column(Float, default=0.0)       # max 15
    financial_score = Column(Float, default=0.0)        # max 15
    documents_score = Column(Float, default=0.0)        # max 10
    
    # Recommendation: SUITABLE TO APPLY, APPLY WITH CAUTION, NOT RECOMMENDED
    recommendation = Column(String(100), nullable=False)
    recommendation_reasons = Column(JSON, default=dict)  # {"pass": [...], "warning": [...], "fail": [...]}
    raw_ai_response = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tender = relationship("Tender", back_populates="analysis")


class TenderRequirement(Base):
    __tablename__ = "tender_requirements"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tender_id = Column(String(36), ForeignKey("tenders.id", ondelete="CASCADE"), nullable=False)
    
    category = Column(String(100), nullable=False)  # turnover, experience, certification, technical, legal, financial
    requirement_title = Column(String(255), nullable=False)
    tender_requirement = Column(Text, nullable=False)
    tender_value = Column(String(100), nullable=True)
    unit = Column(String(50), nullable=True)
    mandatory = Column(Boolean, default=True)
    source_page = Column(Integer, nullable=True)
    source_text = Column(Text, nullable=True)
    confidence = Column(Float, default=1.0)
    
    # Evaluation against company
    company_status = Column(Text, nullable=True)
    match_result = Column(String(50), default="UNKNOWN")  # PASS, PARTIAL, FAIL, UNKNOWN
    match_reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    tender = relationship("Tender", back_populates="requirements")


class TenderDocumentChecklist(Base):
    __tablename__ = "tender_documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tender_id = Column(String(36), ForeignKey("tenders.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=True)  # statutory, technical, financial, qualification
    mandatory = Column(Boolean, default=True)
    source_page = Column(Integer, nullable=True)
    source_text = Column(Text, nullable=True)
    confidence = Column(Float, default=1.0)
    status = Column(String(50), default="MISSING")  # READY, MISSING, PARTIAL
    notes = Column(Text, nullable=True)
    file_path = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    tender = relationship("Tender", back_populates="documents")


class TenderRisk(Base):
    __tablename__ = "tender_risks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tender_id = Column(String(36), ForeignKey("tenders.id", ondelete="CASCADE"), nullable=False)
    
    category = Column(String(100), nullable=False)  # Financial Risk, Eligibility Risk, Compliance Risk, Technical Risk, Timeline Risk, Penalty Risk
    title = Column(String(255), nullable=False)
    severity = Column(String(50), nullable=False)  # HIGH, MEDIUM, LOW
    description = Column(Text, nullable=False)
    source_page = Column(Integer, nullable=True)
    source_text = Column(Text, nullable=True)
    confidence = Column(Float, default=1.0)
    mitigation_suggestion = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    tender = relationship("Tender", back_populates="risks")


class TenderDeadline(Base):
    __tablename__ = "tender_deadlines"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tender_id = Column(String(36), ForeignKey("tenders.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String(255), nullable=False)
    deadline_type = Column(String(100), nullable=False)  # pre_bid, submission, technical_opening, financial_opening, query_end
    deadline_date = Column(DateTime, nullable=True)
    deadline_date_display = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    source_page = Column(Integer, nullable=True)
    is_internal = Column(Boolean, default=False)
    milestone_type = Column(String(50), default="OFFICIAL")  # OFFICIAL, INTERNAL_TECH, INTERNAL_FIN, INTERNAL_MGMT, INTERNAL_DOCS
    
    created_at = Column(DateTime, default=datetime.utcnow)

    tender = relationship("Tender", back_populates="deadlines")


class TenderCostEstimate(Base):
    __tablename__ = "tender_cost_estimates"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tender_id = Column(String(36), ForeignKey("tenders.id", ondelete="CASCADE"), unique=True, nullable=False)

    labour_cost = Column(Float, default=0.0)
    materials_cost = Column(Float, default=0.0)
    equipment_cost = Column(Float, default=0.0)
    software_tech_cost = Column(Float, default=0.0)
    travel_cost = Column(Float, default=0.0)
    subcontracting_cost = Column(Float, default=0.0)
    overhead_admin_cost = Column(Float, default=0.0)
    contingency_cost = Column(Float, default=0.0)
    total_estimated_cost = Column(Float, default=0.0)
    assumptions = Column(JSON, default=dict)

    created_at = Column(DateTime, default=datetime.utcnow)

    tender = relationship("Tender", back_populates="cost_estimate")


class TenderProfitScenario(Base):
    __tablename__ = "tender_profit_scenarios"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tender_id = Column(String(36), ForeignKey("tenders.id", ondelete="CASCADE"), unique=True, nullable=False)

    tender_value = Column(Float, default=0.0)
    optimistic_profit = Column(Float, default=0.0)
    optimistic_margin = Column(Float, default=0.0)
    expected_profit = Column(Float, default=0.0)
    expected_margin = Column(Float, default=0.0)
    pessimistic_profit = Column(Float, default=0.0)
    pessimistic_margin = Column(Float, default=0.0)
    risk_reserve = Column(Float, default=0.0)
    financing_cost = Column(Float, default=0.0)

    created_at = Column(DateTime, default=datetime.utcnow)

    tender = relationship("Tender", back_populates="profit_scenario")


class TenderResourceRequirement(Base):
    __tablename__ = "tender_resource_requirements"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tender_id = Column(String(36), ForeignKey("tenders.id", ondelete="CASCADE"), unique=True, nullable=False)

    required_engineers = Column(Integer, default=0)
    available_engineers = Column(Integer, default=0)
    gap_engineers = Column(Integer, default=0)
    required_pm = Column(Integer, default=1)
    required_technicians = Column(Integer, default=0)
    preparation_hours_needed = Column(Float, default=0.0)
    action_recommended = Column(String(255), default="SUFFICIENT_INTERNAL_CAPACITY")
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    tender = relationship("Tender", back_populates="resource_requirement")


class TenderClarification(Base):
    __tablename__ = "tender_clarifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tender_id = Column(String(36), ForeignKey("tenders.id", ondelete="CASCADE"), nullable=False)

    clause_reference = Column(String(255), nullable=True)
    question = Column(Text, nullable=False)
    reason = Column(Text, nullable=True)
    source_page = Column(Integer, nullable=True)
    priority = Column(String(50), default="MEDIUM")  # HIGH, MEDIUM, LOW
    status = Column(String(50), default="Draft")      # Draft, Review, Submitted, Answered
    answer = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    tender = relationship("Tender", back_populates="clarifications")


class BidTask(Base):
    __tablename__ = "bid_tasks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tender_id = Column(String(36), ForeignKey("tenders.id", ondelete="CASCADE"), nullable=False)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), default="Documentation")  # Eligibility, Technical, Financial, Documentation, Review, Submission
    assignee_name = Column(String(255), nullable=True)
    assignee_role = Column(String(100), default="Bid Manager")
    priority = Column(String(50), default="MEDIUM")  # HIGH, MEDIUM, LOW
    status = Column(String(50), default="TODO")      # TODO, IN_PROGRESS, COMPLETED
    due_date = Column(DateTime, nullable=True)
    is_ai_generated = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    tender = relationship("Tender", back_populates="tasks")
    company = relationship("Company", back_populates="tasks")


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)

    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    role = Column(String(100), default="Technical")  # Admin, Bid Manager, Technical, Finance, Documentation, Management, Viewer
    allocated_hours_weekly = Column(Float, default=40.0)

    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="team_members")


class TenderOutcome(Base):
    __tablename__ = "tender_outcomes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tender_id = Column(String(36), ForeignKey("tenders.id", ondelete="CASCADE"), nullable=True)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)

    decision = Column(String(50), default="BID")  # BID, NO_BID
    outcome = Column(String(50), default="SUBMITTED")  # WON, LOST, SUBMITTED, WITHDRAWN
    awarded_value = Column(Float, nullable=True)
    quoted_value = Column(Float, nullable=True)
    loss_reason = Column(Text, nullable=True)
    actual_cost = Column(Float, nullable=True)
    actual_profit = Column(Float, nullable=True)
    lessons_learned = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    tender = relationship("Tender", back_populates="outcomes")
    company = relationship("Company", back_populates="outcomes")
