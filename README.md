# BIDREADY AI
### Intelligent Tender Eligibility & Bid Decision Platform

BidReady AI is a production-style B2B SaaS web application designed for MSMEs, contractors, startups, and suppliers to evaluate Indian government and institutional tenders (CPWD, GeM, NHAI, Indian Railways, State PWD, Municipal Corporations).

> **Core Value Proposition**: *"Don't just understand the tender. Know whether you are ready to bid."*

---

## Key Features

1. **Real Authentication & Security**:
   - JWT-based authentication with bcrypt password hashing.
   - User onboarding with full name, company name, phone, industry sector, and entity type.
   - Multi-tenant data isolation; complete Supabase PostgreSQL schema with Row-Level Security (RLS) policies provided in `backend/supabase_schema.sql`.

2. **Enterprise Company Profile**:
   - Audited financial turnover history & average turnover calculator.
   - Years in business, relevant experience, completed projects track record.
   - Quality certifications (ISO 9001, ISO 14001, ISO 27001, MSME/Udyam, GST, CMMI).
   - Technical capabilities, workforce size, and statutory compliance (GSTIN, PAN, CIN).
   - Dynamic profile completeness score meter with missing credential alerts.
   - Verified credential document repository.

3. **High-Precision PDF Processing & Source Page Referencing**:
   - PyMuPDF (`pymupdf`) and `pypdf` page-by-page text extraction.
   - Scanned PDF detection heuristics.
   - Every requirement, risk, and document checklist item preserves its physical PDF **Source Page** for auditability.

4. **Multi-Model AI & NLP Extraction**:
   - Secure backend integration with Google Gemini API and OpenAI GPT-4o.
   - High-fidelity built-in Indian Tender NLP rules engine for CPWD, GeM, and PWD tenders (operates reliably with zero external dependencies).

5. **Company vs Tender Matching Engine**:
   - Evaluates every clause: `PASS`, `PARTIAL`, `FAIL`, `UNKNOWN`.
   - Compares turnover thresholds against company average turnover.
   - Validates operating years and similar project experience.
   - Cross-references ISO standards and mandatory statutory documents.

6. **Transparent Bid Readiness Scoring (0–100)**:
   - Eligibility Criteria: **40%**
   - Technical Capability: **20%**
   - Operating Experience: **15%**
   - Financial Capability: **15%**
   - Required Documentation: **10%**
   - Final Verdict:
     - `92–100`: **SUITABLE TO APPLY** (Green)
     - `70–91`: **APPLY WITH CAUTION** (Amber)
     - `0–69`: **NOT RECOMMENDED** (Red)

7. **Explainable Recommendations**:
   - Explicit `PASS`, `WARNING`, and `FAIL` reason breakdowns.

8. **Tender Decision Workspace**:
   - **Overview / Analysis**: Executive summary, score breakdown, and explainable reasons.
   - **Requirements Comparison**: Status-filtered table with PASS/PARTIAL/FAIL badges and source page buttons.
   - **Document Checklist**: Interactive ready/partial/missing status toggling, notes editing, and ready count meter.
   - **Risk Analysis**: High, medium, and low risk clauses (Liquidated Damages, PBG, Escalation, Disqualification).
   - **Dates & Deadlines**: Submission, pre-bid, and technical opening schedule.
   - **Source PDF Viewer**: Embedded PDF reader with page jumping.
   - **Recalculate Button**: Instant re-assessment when company profile or documents change.

9. **Live Dashboard & Search**:
   - Real-time KPI metrics, readiness distribution charts, search across title/authority/NIT, and multi-parameter filtering.

---

## Directory Structure

```text
d:\kpr\
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── auth.py         # Sign up, sign in, me, reset password
│   │   │   │   ├── company.py      # Profile management, documents
│   │   │   │   ├── tenders.py      # Upload, extraction, matching, recalculate
│   │   │   │   ├── dashboard.py    # Live KPI metrics and charts
│   │   │   │   └── settings.py     # AI provider keys & preferences
│   │   │   └── deps.py             # Auth & DB dependencies
│   │   ├── core/
│   │   │   ├── config.py           # Pydantic BaseSettings
│   │   │   ├── database.py         # Async SQLAlchemy engine & sessions
│   │   │   └── security.py         # Password hash & JWT
│   │   ├── models/
│   │   │   └── models.py           # User, Company, Tender, Analysis, Requirements
│   │   ├── schemas/
│   │   │   └── schemas.py          # Pydantic v2 validation models
│   │   └── services/
│   │       ├── ai_analyzer.py      # Gemini, OpenAI & Indian Tender NLP parser
│   │       ├── matching_engine.py  # 0-100 scoring & recommendation logic
│   │       └── pdf_extractor.py    # PyMuPDF page-by-page parser
│   ├── main.py                     # FastAPI entrypoint with CORS
│   ├── supabase_schema.sql         # Supabase PostgreSQL schema with RLS
│   ├── create_sample_tenders.py    # Generates realistic CPWD & GeM tender PDFs
│   └── verify_e2e.py               # Complete end-to-end automated test suite
├── frontend/
│   ├── src/
│   │   ├── components/common/      # Sidebar, Layout, Badges, LoadingSteps, Cards
│   │   ├── context/AuthContext.tsx # React auth provider
│   │   ├── pages/
│   │   │   ├── tabs/               # Analysis, Requirements, Documents, Risks, Deadlines, PDF
│   │   │   ├── LandingPage.tsx     # Public marketing page
│   │   │   ├── LoginPage.tsx       # Sign in
│   │   │   ├── RegisterPage.tsx    # Onboarding sign up
│   │   │   ├── DashboardPage.tsx   # Metrics & pipeline
│   │   │   ├── CompanyProfilePage.tsx # Detailed company credentials & upload
│   │   │   ├── TendersListPage.tsx # Tenders repository
│   │   │   ├── TenderUploadPage.tsx # Drag & drop upload with live steps
│   │   │   ├── TenderDetailPage.tsx # Tabbed workspace
│   │   │   └── SettingsPage.tsx    # AI keys configuration
│   │   ├── services/api.ts         # REST API client
│   │   └── types/index.ts          # TypeScript interfaces
│   └── package.json
└── sample_tenders/                 # Generated realistic Indian tender PDFs
```

---

## Running the Application Locally

### 1. Backend Server (FastAPI)
The backend runs on Python 3.13 with virtual environment:
```powershell
cd d:\kpr\backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
API Documentation (Swagger UI): `http://127.0.0.1:8000/docs`

### 2. Frontend Application (React + Vite + Tailwind)
```powershell
cd d:\kpr\frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
Web Application: `http://127.0.0.1:5173/`

### 3. Automated End-to-End Test Suite
To verify the full pipeline (registration, profile, upload, AI extraction, score breakdown, checklist, and recalculation):
```powershell
$env:PYTHONIOENCODING="utf-8"; .\backend\venv\Scripts\python.exe .\backend\verify_e2e.py
```
