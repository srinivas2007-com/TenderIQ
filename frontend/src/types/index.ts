export interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  company_name?: string;
  company_id?: string;
}

export interface TurnoverHistoryItem {
  year: string;
  turnover: number;
}

export interface Company {
  id: string;
  user_id?: string;
  name: string;
  company_type?: string;
  industry?: string;
  description?: string;
  location?: string;
  state?: string;
  country?: string;
  website?: string;
  
  annual_turnover: number;
  average_turnover: number;
  turnover_history: TurnoverHistoryItem[];
  financial_year?: string;
  working_capital?: number;
  credit_rating?: string;
  
  years_in_business: number;
  relevant_experience_years: number;
  completed_projects_count: number;
  similar_projects_desc?: string;
  major_projects?: string[];
  
  certifications: string[];
  services: string[];
  products: string[];
  technologies: string[];
  equipment: string[];
  workforce_count: number;
  engineers_count: number;
  team_capacity_hours_weekly: number;
  technical_qualifications?: string;
  
  gst_number?: string;
  pan_number?: string;
  registration_number?: string;
  pf_esi_compliance: boolean;
  other_compliance?: string;
  is_sample?: boolean;
  
  completeness_percentage: number;
  missing_items: string[];
}

export interface CompanyListItem {
  id: string;
  user_id?: string;
  name: string;
  company_type?: string;
  industry?: string;
  location?: string;
  state?: string;
  website?: string;
  annual_turnover: number;
  average_turnover: number;
  years_in_business: number;
  workforce_count: number;
  certifications: string[];
  is_sample: boolean;
  fit_score?: number;
  is_eligible?: boolean;
  result_label?: string;
}

export interface CompanyFitCriterion {
  name: string;
  status: 'pass' | 'fail' | 'exceeds';
  required_value: string;
  company_value: string;
  message: string;
  score: number;
  max_score: number;
}

export interface CompanyFitEvaluation {
  company_id: string;
  company_name: string;
  tender_id?: string;
  tender_title: string;
  fit_score: number;
  is_eligible: boolean;
  result_label: string;
  criteria: Record<string, CompanyFitCriterion>;
  summary_reasons: string[];
}

export interface SampleTenderRequirements {
  id: string;
  title: string;
  authority: string;
  tender_value: number;
  min_turnover_cr: number;
  min_experience_years: number;
  mandatory_certification: string;
  min_team_size: number;
}

export interface CompanyDocument {
  id: string;
  company_id: string;
  doc_type: string;
  name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

export interface TenderRequirement {
  id: string;
  tender_id: string;
  category: string;
  requirement_title: string;
  tender_requirement: string;
  tender_value?: string;
  unit?: string;
  mandatory: boolean;
  source_page?: number;
  source_text?: string;
  confidence?: number;
  company_status?: string;
  match_result: 'PASS' | 'PARTIAL' | 'FAIL' | 'UNKNOWN';
  match_reason?: string;
}

export interface TenderDocument {
  id: string;
  tender_id: string;
  name: string;
  category?: string;
  mandatory: boolean;
  source_page?: number;
  source_text?: string;
  confidence?: number;
  status: 'READY' | 'MISSING' | 'PARTIAL';
  notes?: string;
  file_path?: string;
}

export interface TenderRisk {
  id: string;
  tender_id: string;
  category: string;
  title: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  source_page?: number;
  source_text?: string;
  confidence?: number;
  mitigation_suggestion?: string;
}

export interface TenderDeadline {
  id: string;
  tender_id: string;
  title: string;
  deadline_type: string;
  deadline_date?: string;
  deadline_date_display?: string;
  description?: string;
  source_page?: number;
  is_internal?: boolean;
  milestone_type?: string;
}

export interface TenderAnalysis {
  id: string;
  tender_id: string;
  executive_summary?: string;
  readiness_score: number;
  eligibility_score: number;
  technical_score: number;
  experience_score: number;
  financial_score: number;
  documents_score: number;
  recommendation: 'SUITABLE TO APPLY' | 'APPLY WITH CAUTION' | 'NOT RECOMMENDED';
  recommendation_reasons: {
    pass?: string[];
    warning?: string[];
    fail?: string[];
  };
  created_at: string;
}

export interface CostEstimate {
  tender_id: string;
  labour_cost: number;
  materials_cost: number;
  equipment_cost: number;
  software_tech_cost: number;
  travel_cost: number;
  subcontracting_cost: number;
  overhead_admin_cost: number;
  contingency_cost: number;
  total_estimated_cost: number;
  assumptions?: {
    is_estimated: boolean;
    cost_to_value_ratio: number;
    duration_months: number;
    industry_profile: string;
    confidence_label: string;
    notes: string;
  };
}

export interface ProfitScenario {
  tender_id: string;
  tender_value: number;
  optimistic_profit: number;
  optimistic_margin: number;
  expected_profit: number;
  expected_margin: number;
  pessimistic_profit: number;
  pessimistic_margin: number;
  risk_reserve: number;
  financing_cost: number;
  notes?: string;
}

export interface ResourceRequirement {
  tender_id: string;
  required_engineers: number;
  available_engineers: number;
  gap_engineers: number;
  required_pm: number;
  required_technicians: number;
  preparation_hours_needed: number;
  action_recommended: string;
  notes?: string;
  options?: { title: string; feasible: boolean; description: string }[];
}

export interface Clarification {
  id: string;
  tender_id: string;
  clause_reference?: string;
  question: string;
  reason?: string;
  source_page?: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'Draft' | 'Review' | 'Submitted' | 'Answered';
  answer?: string;
}

export interface BidTask {
  id: string;
  tender_id: string;
  company_id?: string;
  title: string;
  description?: string;
  category: string;
  assignee_name?: string;
  assignee_role: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  due_date?: string;
  is_ai_generated: boolean;
  created_at: string;
}

export interface TeamMember {
  id: string;
  company_id: string;
  name: string;
  email?: string;
  role: string;
  allocated_hours_weekly: number;
}

export interface Tender {
  id: string;
  user_id: string;
  title: string;
  reference_number?: string;
  organization?: string;
  department?: string;
  location?: string;
  industry?: string;
  estimated_value?: number;
  estimated_value_display?: string;
  emd_amount?: number;
  emd_display?: string;
  performance_security?: string;
  contract_duration?: string;
  file_name: string;
  file_size: number;
  page_count: number;
  status: 'uploading' | 'extracting' | 'analyzing' | 'matching' | 'calculating' | 'completed' | 'failed';
  status_step: number;
  error_message?: string;

  // TenderIQ Commercial & Decision Attributes
  opportunity_score: number;
  opportunity_verdict: string;
  opportunity_breakdown?: any;
  complexity_score: number;
  bid_effort_hours: number;
  estimated_cost?: number;
  expected_profit?: number;
  profit_margin?: number;
  bid_decision: string;
  workspace_active: boolean;
  bid_status: string;

  created_at: string;
  updated_at: string;
  analysis?: TenderAnalysis;
}

export interface CompetitivenessReport {
  competitiveness_score: number;
  breakdown: Record<string, { score: number; max: number }>;
  strengths: string[];
  weaknesses: string[];
  improvement_opportunities: string[];
}

export interface ReverseGapItem {
  category: string;
  requirement_name: string;
  company_value: string;
  required_benchmark: string;
  gap_description: string;
  impact: string;
  affected_tenders_count: number;
  remediation_path: string;
}

export interface ReverseGapReport {
  company_name: string;
  total_active_gaps: number;
  gaps: ReverseGapItem[];
}

export interface SimulationResult {
  tender_title: string;
  tender_value_display: string;
  current: {
    readiness_score: number;
    opportunity_score: number;
    expected_margin: number;
    resource_gap: number;
    engineers: number;
    turnover: number;
  };
  scenario: {
    readiness_score: number;
    opportunity_score: number;
    opportunity_verdict: string;
    expected_margin: number;
    resource_gap: number;
    engineers: number;
    turnover: number;
  };
  differences: {
    readiness_change: string;
    opportunity_change: string;
    margin_change: string;
    resource_gap_change: string;
  };
  highest_impact_improvement: string;
}

export interface PortfolioOverview {
  total_active_tenders: number;
  combined_tender_value: number;
  combined_expected_profit: number;
  average_expected_margin: number;
  company_capacity: {
    engineers: number;
    working_capital: number;
    weekly_hours: number;
  };
  conflicts: {
    has_conflict: boolean;
    severity: string;
    total_engineers_demanded: number;
    company_engineers_available: number;
    engineer_deficit: number;
    total_prep_hours_demanded: number;
    available_weekly_capacity_hours: number;
    hours_deficit: number;
    affected_tenders_count: number;
    recommendation: string;
  };
  tenders: any[];
}

export interface HistoricalAnalytics {
  has_sufficient_history: boolean;
  history_status_label: string;
  tenders_analyzed: number;
  tenders_submitted: number;
  tenders_won: number;
  tenders_lost: number;
  win_rate_percentage: number;
  average_tender_value: number;
  average_margin_percentage: number;
  loss_reasons_breakdown: { reason: string; count: number }[];
  learning_insights: string[];
  recorded_outcomes: any[];
}

export interface DashboardStats {
  total_tenders: number;
  suitable_count: number;
  caution_count: number;
  not_recommended_count: number;
  upcoming_deadlines_count: number;
  average_readiness_score: number;
  potential_tender_value?: number;
  expected_profit_total?: number;
  open_tasks_count?: number;
  recent_tenders: Tender[];
  score_distribution: { name: string; count: number }[];
  top_opportunities?: {
    id: string;
    title: string;
    organization?: string;
    opportunity_score: number;
    opportunity_verdict: string;
    readiness_score: number;
    profit_margin: number;
    estimated_value_display?: string;
  }[];
  resource_conflicts?: {
    has_conflict: boolean;
    severity: string;
    engineer_deficit: number;
    recommendation: string;
  };
  deadline_risks?: {
    id: string;
    tender_id: string;
    title: string;
    deadline_date_display: string;
    is_internal: boolean;
  }[];
  heat_map_points?: {
    id: string;
    title: string;
    organization: string;
    readiness: number;
    opportunity: number;
    profit_margin: number;
    expected_profit: number;
    risk_score: number;
    value: number;
    status_color: string;
  }[];
}
