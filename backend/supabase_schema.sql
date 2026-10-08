-- ==============================================================================
-- BIDREADY AI - SUPABASE POSTGRESQL SCHEMA WITH ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Supabase Auth link)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. COMPANIES TABLE
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    company_type TEXT,
    industry TEXT,
    description TEXT,
    location TEXT,
    state TEXT,
    country TEXT DEFAULT 'India',
    website TEXT,
    
    annual_turnover NUMERIC(15, 2) DEFAULT 0.00,
    average_turnover NUMERIC(15, 2) DEFAULT 0.00,
    turnover_history JSONB DEFAULT '[]'::jsonb,
    financial_year TEXT DEFAULT '2023-2024',
    
    years_in_business INTEGER DEFAULT 0,
    relevant_experience_years INTEGER DEFAULT 0,
    completed_projects_count INTEGER DEFAULT 0,
    similar_projects_desc TEXT,
    
    certifications JSONB DEFAULT '[]'::jsonb,
    services JSONB DEFAULT '[]'::jsonb,
    products JSONB DEFAULT '[]'::jsonb,
    technologies JSONB DEFAULT '[]'::jsonb,
    equipment JSONB DEFAULT '[]'::jsonb,
    workforce_count INTEGER DEFAULT 0,
    technical_qualifications TEXT,
    
    gst_number TEXT,
    pan_number TEXT,
    registration_number TEXT,
    pf_esi_compliance BOOLEAN DEFAULT FALSE,
    other_compliance TEXT,
    
    completeness_percentage INTEGER DEFAULT 0,
    missing_items JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. COMPANY DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.company_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT DEFAULT 0,
    mime_type TEXT DEFAULT 'application/pdf',
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TENDERS TABLE
CREATE TABLE IF NOT EXISTS public.tenders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    reference_number TEXT,
    organization TEXT,
    department TEXT,
    location TEXT,
    industry TEXT,
    
    estimated_value NUMERIC(15, 2),
    estimated_value_display TEXT,
    emd_amount NUMERIC(15, 2),
    emd_display TEXT,
    performance_security TEXT,
    contract_duration TEXT,
    
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT DEFAULT 0,
    page_count INTEGER DEFAULT 0,
    
    status TEXT DEFAULT 'uploading',
    status_step INTEGER DEFAULT 1,
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TENDER ANALYSIS TABLE
CREATE TABLE IF NOT EXISTS public.tender_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID UNIQUE NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
    executive_summary TEXT,
    
    readiness_score INTEGER DEFAULT 0,
    eligibility_score NUMERIC(5, 2) DEFAULT 0.00,
    technical_score NUMERIC(5, 2) DEFAULT 0.00,
    experience_score NUMERIC(5, 2) DEFAULT 0.00,
    financial_score NUMERIC(5, 2) DEFAULT 0.00,
    documents_score NUMERIC(5, 2) DEFAULT 0.00,
    
    recommendation TEXT NOT NULL,
    recommendation_reasons JSONB DEFAULT '{"pass": [], "warning": [], "fail": []}'::jsonb,
    raw_ai_response JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TENDER REQUIREMENTS TABLE
CREATE TABLE IF NOT EXISTS public.tender_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    requirement_title TEXT NOT NULL,
    tender_requirement TEXT NOT NULL,
    tender_value TEXT,
    unit TEXT,
    mandatory BOOLEAN DEFAULT TRUE,
    source_page INTEGER,
    
    company_status TEXT,
    match_result TEXT DEFAULT 'UNKNOWN',
    match_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TENDER DOCUMENTS CHECKLIST TABLE
CREATE TABLE IF NOT EXISTS public.tender_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'statutory',
    mandatory BOOLEAN DEFAULT TRUE,
    source_page INTEGER,
    status TEXT DEFAULT 'MISSING',
    notes TEXT,
    file_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. TENDER RISKS TABLE
CREATE TABLE IF NOT EXISTS public.tender_risks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    severity TEXT NOT NULL,
    description TEXT NOT NULL,
    source_page INTEGER,
    mitigation_suggestion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. TENDER DEADLINES TABLE
CREATE TABLE IF NOT EXISTS public.tender_deadlines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    deadline_type TEXT NOT NULL,
    deadline_date TIMESTAMP WITH TIME ZONE,
    deadline_date_display TEXT,
    description TEXT,
    source_page INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tender_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tender_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tender_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tender_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tender_deadlines ENABLE ROW LEVEL SECURITY;

-- 1. Profiles: users can select/update only their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Companies: users can manage only their own company
CREATE POLICY "Users can view their company" 
ON public.companies FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their company" 
ON public.companies FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their company" 
ON public.companies FOR UPDATE USING (auth.uid() = user_id);

-- 3. Tenders: users can manage only their own tenders
CREATE POLICY "Users can view their tenders" 
ON public.tenders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their tenders" 
ON public.tenders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their tenders" 
ON public.tenders FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their tenders" 
ON public.tenders FOR DELETE USING (auth.uid() = user_id);

-- 4. Tender Sub-tables: cascade security through parent tender ownership
CREATE POLICY "Users view analysis for their tenders" 
ON public.tender_analysis FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.tenders WHERE public.tenders.id = tender_analysis.tender_id AND public.tenders.user_id = auth.uid()));

CREATE POLICY "Users view requirements for their tenders" 
ON public.tender_requirements FOR ALL 
USING (EXISTS (SELECT 1 FROM public.tenders WHERE public.tenders.id = tender_requirements.tender_id AND public.tenders.user_id = auth.uid()));

CREATE POLICY "Users manage documents for their tenders" 
ON public.tender_documents FOR ALL 
USING (EXISTS (SELECT 1 FROM public.tenders WHERE public.tenders.id = tender_documents.tender_id AND public.tenders.user_id = auth.uid()));

CREATE POLICY "Users view risks for their tenders" 
ON public.tender_risks FOR ALL 
USING (EXISTS (SELECT 1 FROM public.tenders WHERE public.tenders.id = tender_risks.tender_id AND public.tenders.user_id = auth.uid()));

CREATE POLICY "Users view deadlines for their tenders" 
ON public.tender_deadlines FOR ALL 
USING (EXISTS (SELECT 1 FROM public.tenders WHERE public.tenders.id = tender_deadlines.tender_id AND public.tenders.user_id = auth.uid()));
