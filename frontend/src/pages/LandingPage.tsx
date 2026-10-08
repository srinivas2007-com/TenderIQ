import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Scale,
  Clock,
  ArrowRight,
  Check,
  Building,
  TrendingUp,
  FileCheck2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-brand-600 flex items-center justify-center text-white font-bold shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">BIDREADY AI</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#problem" className="hover:text-slate-900">Problem</a>
          <a href="#how-it-works" className="hover:text-slate-900">How It Works</a>
          <a href="#sample-analysis" className="hover:text-slate-900">Sample Analysis</a>
          <a href="#faq" className="hover:text-slate-900">FAQ</a>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2 rounded-md shadow-sm transition-colors"
            >
              Go to Dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-2"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2 rounded-md shadow-sm transition-colors"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 sm:px-12 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 border border-brand-200 rounded-full text-xs font-medium text-brand-700 mb-6">
          <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse"></span>
          Intelligent Tender Eligibility & Bid Decision Platform for Indian Bidders
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
          Bid smarter. <br />
          <span className="text-brand-600">Know if you're ready to bid.</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          BidReady AI analyzes complex tender documents, compares requirements with your company's capabilities, 
          and gives you an explainable bid-readiness assessment.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to={isAuthenticated ? "/tenders/upload" : "/register"}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-6 py-3.5 rounded-md shadow-sm transition-colors"
          >
            Analyze a Tender
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to={isAuthenticated ? "/company-profile" : "/register"}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-sm font-semibold px-6 py-3.5 rounded-md shadow-sm transition-colors"
          >
            Create Company Profile
          </Link>
        </div>

        <div className="mt-8 flex items-center justify-center gap-8 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-600" /> CPWD, GeM & Railway Tenders</span>
          <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-600" /> 100% Explainable Scoring</span>
          <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-600" /> Page Reference Auditing</span>
        </div>
      </section>

      {/* Value Proposition / Workflow */}
      <section id="problem" className="bg-white border-y border-slate-200 py-16 px-6 sm:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs uppercase font-bold tracking-wider text-brand-600 mb-2">Our Philosophy</h2>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">
              "Don't just understand the tender. Know whether you are ready to bid."
            </p>
            <p className="mt-3 text-sm text-slate-600">
              Unlike generic AI summarizers that regurgitate text, BidReady AI cross-examines your company's real balance sheets, 
              experience records, and certifications against every mandatory clause in the tender.
            </p>
          </div>

          <div id="how-it-works" className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 border border-slate-200 rounded-lg bg-slate-50">
              <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center text-sm font-bold mb-3">1</div>
              <h3 className="font-semibold text-sm text-slate-900">Company Profile</h3>
              <p className="text-xs text-slate-600 mt-1">Register audited turnover, experience years, completed projects, and ISO/MSME credentials.</p>
            </div>
            <div className="p-5 border border-slate-200 rounded-lg bg-slate-50">
              <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center text-sm font-bold mb-3">2</div>
              <h3 className="font-semibold text-sm text-slate-900">Tender Extraction</h3>
              <p className="text-xs text-slate-600 mt-1">PyMuPDF extracts every clause, preserving exact page numbers for audited traceability.</p>
            </div>
            <div className="p-5 border border-slate-200 rounded-lg bg-slate-50">
              <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center text-sm font-bold mb-3">3</div>
              <h3 className="font-semibold text-sm text-slate-900">Comparison Engine</h3>
              <p className="text-xs text-slate-600 mt-1">Structured comparison calculates PASS, PARTIAL, FAIL for financial, technical, and statutory clauses.</p>
            </div>
            <div className="p-5 border border-slate-200 rounded-lg bg-slate-50">
              <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center text-sm font-bold mb-3">4</div>
              <h3 className="font-semibold text-sm text-slate-900">Bid Decision</h3>
              <p className="text-xs text-slate-600 mt-1">Receive a transparent 0–100 score and explainable recommendation before committing EMD.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Analysis Preview (Clearly Labeled Sample Data) */}
      <section id="sample-analysis" className="py-20 px-6 sm:px-12 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs uppercase font-bold tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 border border-amber-200 rounded">
            SAMPLE ANALYSIS DEMONSTRATION
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3">
            What a Real Bid Decision Looks Like
          </h2>
          <p className="mt-2 text-xs text-slate-500">
            Below is an illustrative sample of how BidReady AI structures tender eligibility and decision rationale.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8 max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sample Tender</span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">CPWD Multi-Storey Infrastructure Complex (NIT-894)</h3>
              <p className="text-xs text-slate-500">Central Public Works Department • Tender Value: ₹14.50 Cr</p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xs text-slate-400 font-medium mb-1">Bid Readiness Score</div>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-extrabold text-slate-900">78<span className="text-sm font-normal text-slate-400">/100</span></span>
                <span className="bg-amber-600 text-white text-xs font-semibold px-2.5 py-1 rounded shadow-sm">
                  APPLY WITH CAUTION
                </span>
              </div>
            </div>
          </div>

          {/* Metrics summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-slate-100 text-center">
            <div className="p-3 bg-slate-50 rounded border border-slate-100">
              <div className="text-xs text-slate-500 font-medium">Requirements</div>
              <div className="text-xl font-bold text-slate-900 mt-1">12</div>
            </div>
            <div className="p-3 bg-emerald-50 rounded border border-emerald-100">
              <div className="text-xs text-emerald-700 font-medium">Passed</div>
              <div className="text-xl font-bold text-emerald-800 mt-1">9</div>
            </div>
            <div className="p-3 bg-amber-50 rounded border border-amber-100">
              <div className="text-xs text-amber-700 font-medium">Warnings / Partial</div>
              <div className="text-xl font-bold text-amber-800 mt-1">2</div>
            </div>
            <div className="p-3 bg-red-50 rounded border border-red-100">
              <div className="text-xs text-red-700 font-medium">Failed Shortfall</div>
              <div className="text-xl font-bold text-red-800 mt-1">1</div>
            </div>
          </div>

          {/* Explainable Rationale */}
          <div className="pt-6 space-y-4">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Explainable Decision Reasons</h4>
            
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded flex items-start gap-2.5 text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">PASS:</span> 5-year operating experience requirement satisfied (Company has 7 years experience). Verified against page 2.
                </div>
              </div>

              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded flex items-start gap-2.5 text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">PASS:</span> ISO 9001:2015 active quality certification confirmed in company profile.
                </div>
              </div>

              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded flex items-start gap-2.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">WARNING:</span> Average turnover of company (₹8.50 Cr) is marginally below the preferred ₹10.00 Cr threshold. Consortium/JV partner recommended.
                </div>
              </div>

              <div className="p-3 bg-red-50/80 border border-red-200 rounded flex items-start gap-2.5 text-red-900">
                <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">FAIL:</span> Mandatory audited turnover certificate with UDIN seal is not yet uploaded to checklist.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience */}
      <section className="bg-slate-100/70 border-y border-slate-200 py-16 px-6 sm:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-2">Designed For Bidders</h2>
            <p className="text-2xl font-bold text-slate-900">Built specifically for Indian businesses navigating government tenders</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <Building className="w-6 h-6 text-brand-600 mb-3" />
              <h3 className="font-semibold text-slate-900 text-sm mb-1">MSMEs & Startups</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Take advantage of MSME purchase preferences, verify EMD exemptions, and avoid disqualification due to missing statutory declarations.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <Scale className="w-6 h-6 text-brand-600 mb-3" />
              <h3 className="font-semibold text-slate-900 text-sm mb-1">Contractors & Builders</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automate financial turnover ratio checks, past similar completed works calculations, and liquidated damages penalty auditing.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <TrendingUp className="w-6 h-6 text-brand-600 mb-3" />
              <h3 className="font-semibold text-slate-900 text-sm mb-1">Procurement & BD Teams</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Eliminate 20 hours of manual RFP document review per tender. Accelerate the Go/No-Go decision process with explainable data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6 sm:px-12 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>
          <p className="text-xs text-slate-500 mt-1">Understanding BidReady AI capabilities</p>
        </div>

        <div className="space-y-4 text-left">
          <div className="p-5 bg-white border border-slate-200 rounded-lg">
            <h3 className="text-sm font-semibold text-slate-900">How does BidReady AI calculate the readiness score?</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              We use a weighted, deterministic model: Eligibility (40%), Technical capability (20%), Experience (15%), 
              Financial turnover (15%), and Document completeness (10%). Every score is fully explainable with exact pass/fail reasons.
            </p>
          </div>
          <div className="p-5 bg-white border border-slate-200 rounded-lg">
            <h3 className="text-sm font-semibold text-slate-900">How do source page numbers work?</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              When our PDF engine processes the tender, it indexes clauses by physical PDF page number. 
              In the Requirements and Risk tabs, every requirement shows the exact source page so you can verify the original text instantly.
            </p>
          </div>
          <div className="p-5 bg-white border border-slate-200 rounded-lg">
            <h3 className="text-sm font-semibold text-slate-900">Can I update my company profile and recalculate?</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Yes. Whenever you upload a new certification or update your turnover figures, you can click "Recalculate Readiness" on any tender to update the score immediately.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="mt-auto bg-slate-950 text-slate-400 py-12 px-6 sm:px-12 border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-brand-600 flex items-center justify-center text-white font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight">BIDREADY AI</span>
              <p className="text-[11px] text-slate-500">Intelligent Tender Eligibility & Bid Decision Platform</p>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            © 2026 BidReady AI. Built for enterprise tender intelligence.
          </div>
        </div>
      </footer>
    </div>
  );
};
