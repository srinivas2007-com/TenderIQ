import {
  Tender, TenderRequirement, TenderDocument, TenderRisk, TenderDeadline,
  TenderAnalysis, DashboardStats, Company, CompanyDocument,
  CostEstimate, ProfitScenario, ResourceRequirement, Clarification,
  BidTask, TeamMember, CompetitivenessReport, ReverseGapReport,
  SimulationResult, PortfolioOverview, HistoricalAnalytics
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('bidready_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      localStorage.removeItem('bidready_token');
      localStorage.removeItem('bidready_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
      throw new Error('Your session has expired. Please log in again.');
    }

    if (!response.ok) {
      let errorMessage = 'An unexpected error occurred';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        errorMessage = response.statusText;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // --- Auth APIs ---
  async login(credentials: { email: string; password: string }) {
    return this.request<{ access_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(data: {
    email: string;
    password: string;
    full_name: string;
    company_name: string;
    phone_number?: string;
    industry?: string;
    company_type?: string;
  }) {
    return this.request<{ access_token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  async forgotPassword(email: string) {
    return this.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async deleteAccount(payload?: { password?: string; confirm_text?: string }): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/auth/account', {
      method: 'DELETE',
      body: payload ? JSON.stringify(payload) : undefined,
    });
  }

  // --- Company APIs ---
  async getCompanyProfile(): Promise<Company> {
    return this.request<Company>('/company/profile');
  }

  async updateCompanyProfile(data: Partial<Company>): Promise<Company> {
    return this.request<Company>('/company/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // --- Company Management & Multi-Company Directory ---
  async getCompanies(): Promise<import('../types').CompanyListItem[]> {
    return this.request<import('../types').CompanyListItem[]>('/companies');
  }

  async getCompanyDetails(id: string): Promise<Company> {
    return this.request<Company>(`/companies/${id}`);
  }

  async createCompany(data: Partial<Company>): Promise<Company> {
    return this.request<Company>('/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCompany(id: string, data: Partial<Company>): Promise<Company> {
    return this.request<Company>(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getCompanyFit(id: string, tenderId?: string): Promise<import('../types').CompanyFitEvaluation> {
    const qs = tenderId ? `?tender_id=${tenderId}` : '';
    return this.request<import('../types').CompanyFitEvaluation>(`/companies/${id}/fit${qs}`);
  }

  async getSampleFitTender(): Promise<import('../types').SampleTenderRequirements> {
    return this.request<import('../types').SampleTenderRequirements>('/companies/sample-tender');
  }

  async getCompanyCompetitiveness(): Promise<CompetitivenessReport> {
    return this.request<CompetitivenessReport>('/company/competitiveness');
  }

  async getReverseGapAnalysis(): Promise<ReverseGapReport> {
    return this.request<ReverseGapReport>('/company/gaps');
  }

  async getCompanyDocuments(): Promise<CompanyDocument[]> {
    return this.request<CompanyDocument[]>('/company/documents');
  }

  async uploadCompanyDocument(formData: FormData): Promise<CompanyDocument> {
    return this.request<CompanyDocument>('/company/documents', {
      method: 'POST',
      body: formData,
    });
  }

  async deleteCompanyDocument(docId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/company/documents/${docId}`, {
      method: 'DELETE',
    });
  }

  // --- Tenders APIs ---
  async getTenders(params?: { q?: string; recommendation?: string }): Promise<Tender[]> {
    const query = new URLSearchParams();
    if (params?.q) query.append('q', params.q);
    if (params?.recommendation) query.append('recommendation', params.recommendation);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<Tender[]>(`/tenders${qs}`);
  }

  async getTender(id: string): Promise<Tender> {
    return this.request<Tender>(`/tenders/${id}`);
  }

  async uploadTender(formData: FormData): Promise<{ id: string; title: string; status: string; status_step: number; message: string }> {
    return this.request<{ id: string; title: string; status: string; status_step: number; message: string }>('/tenders/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async getTenderAnalysis(id: string): Promise<TenderAnalysis> {
    return this.request<TenderAnalysis>(`/tenders/${id}/analysis`);
  }

  async getTenderRequirements(id: string, matchResult?: string): Promise<TenderRequirement[]> {
    const qs = matchResult ? `?match_result=${matchResult}` : '';
    return this.request<TenderRequirement[]>(`/tenders/${id}/requirements${qs}`);
  }

  async getTenderDocuments(id: string): Promise<TenderDocument[]> {
    return this.request<TenderDocument[]>(`/tenders/${id}/documents`);
  }

  async updateTenderDocument(tenderId: string, docId: string, data: { status?: string; notes?: string }): Promise<TenderDocument> {
    return this.request<TenderDocument>(`/tenders/${tenderId}/documents/${docId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getTenderRisks(id: string, severity?: string): Promise<TenderRisk[]> {
    const qs = severity ? `?severity=${severity}` : '';
    return this.request<TenderRisk[]>(`/tenders/${id}/risks${qs}`);
  }

  async getTenderDeadlines(id: string): Promise<TenderDeadline[]> {
    return this.request<TenderDeadline[]>(`/tenders/${id}/deadlines`);
  }

  async getTenderCost(id: string): Promise<CostEstimate> {
    return this.request<CostEstimate>(`/tenders/${id}/cost`);
  }

  async getTenderProfit(id: string): Promise<ProfitScenario> {
    return this.request<ProfitScenario>(`/tenders/${id}/profit`);
  }

  async getTenderResources(id: string): Promise<ResourceRequirement> {
    return this.request<ResourceRequirement>(`/tenders/${id}/resources`);
  }

  async getTenderClarifications(id: string): Promise<Clarification[]> {
    return this.request<Clarification[]>(`/tenders/${id}/clarifications`);
  }

  async updateClarification(tenderId: string, clarificationId: string, data: { status?: string; answer?: string }): Promise<any> {
    return this.request<any>(`/tenders/${tenderId}/clarifications/${clarificationId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async startBidWorkspace(id: string): Promise<{ message: string; workspace_active: boolean }> {
    return this.request<{ message: string; workspace_active: boolean }>(`/tenders/${id}/start-bid`, {
      method: 'POST'
    });
  }

  async compareTenders(tenderIds: string[]): Promise<any> {
    return this.request<any>('/tenders/compare', {
      method: 'POST',
      body: JSON.stringify({ tender_ids: tenderIds })
    });
  }

  async getBestTenders(): Promise<any[]> {
    return this.request<any[]>('/tenders/best');
  }

  async recalculateTender(id: string): Promise<any> {
    return this.request<any>(`/tenders/${id}/recalculate`, {
      method: 'POST',
    });
  }

  async deleteTender(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/tenders/${id}`, {
      method: 'DELETE',
    });
  }

  getTenderPdfUrl(id: string): string {
    return `${API_BASE_URL}/tenders/${id}/pdf`;
  }

  getTenderExportPdfUrl(id: string): string {
    return `${API_BASE_URL}/tenders/${id}/export-pdf`;
  }

  // --- What-If Simulation API ---
  async runSimulation(data: any): Promise<SimulationResult> {
    return this.request<SimulationResult>('/simulation', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // --- Portfolio APIs ---
  async getPortfolio(): Promise<PortfolioOverview> {
    return this.request<PortfolioOverview>('/portfolio');
  }

  async optimizePortfolio(data: { available_capital?: number; available_engineers?: number; available_prep_hours?: number }): Promise<any> {
    return this.request<any>('/portfolio/optimize', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // --- Tasks APIs ---
  async getTasks(params?: { tender_id?: string; status?: string; category?: string }): Promise<BidTask[]> {
    const query = new URLSearchParams();
    if (params?.tender_id) query.append('tender_id', params.tender_id);
    if (params?.status) query.append('status', params.status);
    if (params?.category) query.append('category', params.category);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<BidTask[]>(`/tasks${qs}`);
  }

  async createTask(data: Partial<BidTask>): Promise<BidTask> {
    return this.request<BidTask>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateTask(id: string, data: Partial<BidTask>): Promise<BidTask> {
    return this.request<BidTask>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteTask(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/tasks/${id}`, {
      method: 'DELETE'
    });
  }

  // --- Team APIs ---
  async getTeamMembers(): Promise<TeamMember[]> {
    return this.request<TeamMember[]>('/team');
  }

  async createTeamMember(data: Partial<TeamMember>): Promise<TeamMember> {
    return this.request<TeamMember>('/team', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateTeamMember(id: string, data: Partial<TeamMember>): Promise<TeamMember> {
    return this.request<TeamMember>(`/team/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteTeamMember(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/team/${id}`, {
      method: 'DELETE'
    });
  }

  // --- Analytics & Learning APIs ---
  async getAnalytics(): Promise<HistoricalAnalytics> {
    return this.request<HistoricalAnalytics>('/analytics');
  }

  async recordOutcome(data: any): Promise<{ message: string; id: string }> {
    return this.request<{ message: string; id: string }>('/analytics/outcome', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // --- Dashboard APIs ---
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/dashboard/stats');
  }

  // --- Settings APIs ---
  async getSettings() {
    return this.request<any>('/settings');
  }

  async updateSettings(data: { gemini_api_key?: string; openai_api_key?: string }) {
    return this.request<any>('/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiService();
