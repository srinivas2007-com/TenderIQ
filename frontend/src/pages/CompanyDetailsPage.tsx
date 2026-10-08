import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Company, CompanyFitEvaluation, SampleTenderRequirements } from '../types';
import { useToast } from '../context/ToastContext';
import {
  Building2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  TrendingUp,
  Award,
  Users,
  Briefcase,
  Globe,
  MapPin,
  FileText,
  Calendar,
  Layers,
  Scale,
  DollarSign,
  FileCheck,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const CompanyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [company, setCompany] = useState<Company | null>(null);
  const [fitData, setFitData] = useState<CompanyFitEvaluation | null>(null);
  const [sampleTender, setSampleTender] = useState<SampleTenderRequirements | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchCompanyData = async () => {
      try {
        setLoading(true);
        const [compRes, fitRes, tenderRes] = await Promise.all([
          api.getCompanyDetails(id),
          api.getCompanyFit(id),
          api.getSampleFitTender()
        ]);
        setCompany(compRes);
        setFitData(fitRes);
        setSampleTender(tenderRes);
      } catch (err: any) {
        toast.error(err.message || 'Failed to load company profile details');
      } finally {
        setLoading(false);
      }
    };
    fetchCompanyData();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-16 text-center text-slate-400">
        <Building2 className="w-8 h-8 animate-pulse mx-auto text-blue-500 mb-3" />
        <p className="text-xs font-medium">Loading comprehensive enterprise dossier...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-500">
        <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-3" />
        <p className="text-sm font-semibold text-slate-700">Company Not Found</p>
        <button
          onClick={() => navigate('/companies')}
          className="mt-4 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded"
        >
          Back to Companies Directory
        </button>
      </div>
    );
  }

  const isEligible = fitData?.is_eligible;
  const fitScore = fitData?.fit_score || 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Header */}
      <div>
        <button
          onClick={() => navigate('/companies')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Companies Directory
        </button>

        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 rounded border border-slate-200">
                {company.company_type || 'Enterprise'}
              </span>
              {company.is_sample && (
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded border border-blue-200">
                  Demo Enterprise
                </span>
              )}
              <span className="text-xs text-slate-500 font-medium">
                {company.industry || 'Technology & Engineering Services'}
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
              {company.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{company.location || 'Location Not Set'}, {company.state || 'India'}</span>
              </div>
              {company.website && (
                <a
                  href={`https://${company.website.replace(/^https?:\/\//, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-blue-600 hover:underline"
                >
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>{company.website}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Fit Score Spotlight */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center shrink-0 min-w-[200px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Tender Fit Score
            </span>
            <div className="text-3xl font-black text-slate-900 mt-1">
              <span className={isEligible ? 'text-emerald-600' : 'text-rose-600'}>
                {fitScore}
              </span>
              <span className="text-base text-slate-400 font-medium">/100</span>
            </div>
            <div
              className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded text-xs font-bold ${
                isEligible
                  ? 'bg-emerald-100/70 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100/70 text-rose-800 border border-rose-300'
              }`}
            >
              {isEligible ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-rose-700" />
              )}
              <span>{isEligible ? '✅ Eligible to Bid' : '❌ Not Eligible'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tender-Fit Evaluation Section (Prominent) */}
      {fitData && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Tender Qualification Analysis
                </span>
              </div>
              <h2 className="text-base font-bold text-white">
                Evaluation against: {fitData.tender_title}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-medium">Overall Decision Result</span>
              <span className={`text-sm font-bold ${isEligible ? 'text-emerald-400' : 'text-rose-400'}`}>
                {fitData.result_label} ({fitScore}/100)
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Criteria Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(fitData.criteria).map(([key, item]) => {
                const passed = item.status !== 'fail';
                const isExceeds = item.status === 'exceeds';

                return (
                  <div
                    key={key}
                    className={`p-4 rounded-lg border flex flex-col justify-between ${
                      passed
                        ? 'bg-emerald-50/40 border-emerald-200 text-slate-800'
                        : 'bg-rose-50/40 border-rose-200 text-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          {item.name}
                        </span>
                        {passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                      </div>

                      <div className="space-y-1 my-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Required:</span>
                          <span className="font-semibold text-slate-900">{item.required_value}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Company:</span>
                          <span className="font-semibold text-slate-900">{item.company_value}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/60 mt-2 flex items-center justify-between">
                      <span className={`text-xs font-bold ${passed ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {passed ? '✅ ' : '❌ '} {item.message}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500">
                        {item.score}/{item.max_score} pts
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Reasons Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Executive Fit Summary & Reason Breakdown
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {fitData.summary_reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-center gap-2 font-medium">
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Corporate Info, Financials, Experience, Workforce */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Scope, Financials & Experience */}
        <div className="lg:col-span-2 space-y-6">
          {/* Corporate Profile & Scope */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Corporate Profile & Scope
              </h2>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {company.description || 'No corporate scope description provided.'}
            </p>
          </div>

          {/* Financial Information & Audited Turnover */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Financial Information & Audited Turnover
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">INR (Crores)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                  Latest FY Annual Turnover
                </span>
                <span className="text-base font-bold text-slate-900 mt-1 block">
                  ₹{company.annual_turnover?.toFixed(2)} Cr
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                  Average Turnover (Last 3 FYs)
                </span>
                <span className="text-base font-bold text-slate-900 mt-1 block">
                  ₹{company.average_turnover?.toFixed(2)} Cr
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                  Working Capital
                </span>
                <span className="text-base font-bold text-slate-900 mt-1 block">
                  ₹{((company.working_capital || 0) / 10000000).toFixed(2)} Cr
                </span>
              </div>
            </div>

            {/* Audited Turnover Table */}
            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-2">
                Audited Financial Year Performance
              </span>
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                      <th className="py-2.5 px-4">Financial Year</th>
                      <th className="py-2.5 px-4 text-right">Audited Turnover</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {company.turnover_history && company.turnover_history.length > 0 ? (
                      company.turnover_history.map((th, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-4 font-medium text-slate-800">{th.year}</td>
                          <td className="py-2 px-4 text-right font-bold text-slate-900">
                            ₹{th.turnover?.toFixed(2)} Cr
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="py-3 px-4 text-center text-slate-400 italic">
                          No multi-year audit history recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Experience & Track Record */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Experience & Track Record
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                  Total Years in Business
                </span>
                <span className="text-base font-bold text-slate-900 mt-1 block">
                  {company.years_in_business} Years
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                  Relevant Domain Experience
                </span>
                <span className="text-base font-bold text-slate-900 mt-1 block">
                  {company.relevant_experience_years} Years
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                  Completed Similar Projects
                </span>
                <span className="text-base font-bold text-slate-900 mt-1 block">
                  {company.completed_projects_count} Works
                </span>
              </div>
            </div>

            {/* Major Completed Projects */}
            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-2">
                Major Completed Projects
              </span>
              <div className="space-y-1.5">
                {company.major_projects && company.major_projects.length > 0 ? (
                  company.major_projects.map((proj, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-800 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{proj}</span>
                    </div>
                  ))
                ) : company.similar_projects_desc ? (
                  <p className="text-xs text-slate-700 p-3 bg-slate-50 border border-slate-200 rounded">
                    {company.similar_projects_desc}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">No major project credentials listed.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Certifications, Workforce, Statutory */}
        <div className="space-y-6">
          {/* Certifications */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Award className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Certifications & Accreditations
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {company.certifications && company.certifications.length > 0 ? (
                company.certifications.map((cert, idx) => (
                  <span
                    key={idx}
                    className={`px-2.5 py-1 text-xs font-semibold rounded border ${
                      cert.includes('27001')
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                        : 'bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                  >
                    {cert}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No certifications registered</span>
              )}
            </div>
          </div>

          {/* Workforce Capacity */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Users className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Workforce Capacity
              </h2>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                Total Employees & Engineers
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {company.workforce_count} Staff
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Technical Qualifications Summary
              </span>
              <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200 leading-relaxed">
                {company.technical_qualifications || 'Full-stack engineering & support roster.'}
              </p>
            </div>
          </div>

          {/* Statutory & Tax Compliance */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileCheck className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Statutory & Tax Compliance
              </h2>
            </div>

            <div className="space-y-2 text-xs divide-y divide-slate-100">
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-medium">GSTIN</span>
                <span className="font-mono font-bold text-slate-900">{company.gst_number || 'NOT AVAILABLE'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-medium">PAN</span>
                <span className="font-mono font-bold text-slate-900">{company.pan_number || 'NOT AVAILABLE'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-medium">CIN / Reg No.</span>
                <span className="font-mono font-bold text-slate-900">{company.registration_number || 'NOT AVAILABLE'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetailsPage;
