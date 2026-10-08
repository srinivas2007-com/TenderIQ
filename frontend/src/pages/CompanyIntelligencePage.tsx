import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { CompetitivenessReport, ReverseGapReport, Company } from '../types';
import { useToast } from '../context/ToastContext';
import { Building2, ShieldCheck, AlertCircle, TrendingUp, CheckCircle2, XCircle, ArrowUpRight, Loader2 } from 'lucide-react';

export const CompanyIntelligencePage: React.FC = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [competitiveness, setCompetitiveness] = useState<CompetitivenessReport | null>(null);
  const [gapsReport, setGapsReport] = useState<ReverseGapReport | null>(null);
  const [activeTab, setActiveTab] = useState<'competitiveness' | 'gaps' | 'profile'>('competitiveness');
  const [isLoading, setIsLoading] = useState(true);
  const { error } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [compData, scoreData, gapData] = await Promise.all([
        api.getCompanyProfile(),
        api.getCompanyCompetitiveness(),
        api.getReverseGapAnalysis(),
      ]);
      setCompany(compData);
      setCompetitiveness(scoreData);
      setGapsReport(gapData);
    } catch (err: any) {
      error('Failed to load company intelligence', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Company Digital Twin & Intelligence</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise procurement profile model, automated competitiveness benchmark, and reverse gap analysis across active tenders.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('competitiveness')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'competitiveness' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Competitiveness Score
          </button>
          <button
            onClick={() => setActiveTab('gaps')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'gaps' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Reverse Gap Analysis ({gapsReport?.total_active_gaps || 0})
          </button>
        </div>
      </div>

      {/* Tab 1: Competitiveness Score */}
      {activeTab === 'competitiveness' && competitiveness && (
        <div className="space-y-6">
          {/* Main Score Hero Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-4 text-center md:text-left border-b md:border-b-0 md:border-r border-slate-200 pb-6 md:pb-0 md:pr-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Company Competitiveness</span>
              <div className="mt-2 flex items-baseline justify-center md:justify-start gap-2">
                <span className="text-5xl font-black text-slate-900 tracking-tight">
                  {competitiveness.competitiveness_score}
                </span>
                <span className="text-sm font-semibold text-slate-400">/ 100</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Derived deterministically across financial capacity, technical capabilities, completed works, and ISO standards.
              </p>
            </div>

            {/* Dimension Breakdown Progress Bars */}
            <div className="md:col-span-8 space-y-3">
              {Object.entries(competitiveness.breakdown).map(([dim, val]: [string, any]) => {
                const label = dim.replace('_', ' ').toUpperCase();
                const pct = Math.round((val.score / val.max) * 100);
                return (
                  <div key={dim} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{label}</span>
                      <span>{val.score} / {val.max} pts</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strengths, Weaknesses, Opportunities */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Strengths */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Identified Strengths</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {competitiveness.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Vulnerabilities / Limits</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {competitiveness.weaknesses.map((w, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Opportunities */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wider">
                <ArrowUpRight className="w-4 h-4 text-blue-600" />
                <span>Growth Opportunities</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {competitiveness.improvement_opportunities.map((opp, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>{opp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Reverse Gap Analysis */}
      {activeTab === 'gaps' && gapsReport && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Eligibility Shortfalls & Remediation Roadmap
            </span>
            <span className="text-xs text-slate-500">
              Evaluated across active tender requirements
            </span>
          </div>

          {gapsReport.gaps.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              No qualification gaps detected across your analyzed tenders.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {gapsReport.gaps.map((gap, idx) => (
                <div key={idx} className="p-5 hover:bg-slate-50/50 transition-colors space-y-2 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                        {gap.category}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm">{gap.requirement_name}</h3>
                    </div>
                    <span className="text-xs font-semibold text-rose-600">
                      Impacts {gap.affected_tenders_count} analyzed tenders
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-slate-400 block">Company Current</span>
                      <span className="font-medium">{gap.company_value}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-slate-400 block">Tender Benchmark</span>
                      <span className="font-medium">{gap.required_benchmark}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-rose-500 block">Identified Gap</span>
                      <span className="font-semibold text-rose-700">{gap.gap_description}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-1 text-slate-600">
                    <TrendingUp className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span><b>Actionable Remediation:</b> {gap.remediation_path}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
