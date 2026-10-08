import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { PortfolioOverview } from '../types';
import { useToast } from '../context/ToastContext';
import { Briefcase, AlertTriangle, CheckCircle2, TrendingUp, Users, Clock, Loader2, Sparkles } from 'lucide-react';

export const PortfolioPage: React.FC = () => {
  const [overview, setOverview] = useState<PortfolioOverview | null>(null);
  const [optimizedResult, setOptimizedResult] = useState<any | null>(null);
  const [capitalCr, setCapitalCr] = useState<number>(5.0);
  const [engineers, setEngineers] = useState<number>(10);
  const [prepHours, setPrepHours] = useState<number>(180);
  const [isLoading, setIsLoading] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      setIsLoading(true);
      const res = await api.getPortfolio();
      setOverview(res);
      if (res.company_capacity) {
        setEngineers(res.company_capacity.engineers || 10);
        setCapitalCr(res.company_capacity.working_capital ? res.company_capacity.working_capital / 10000000 : 5.0);
        setPrepHours(res.company_capacity.weekly_hours || 180);
      }
    } catch (err: any) {
      error('Portfolio load error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptimize = async () => {
    try {
      setIsOptimizing(true);
      const res = await api.optimizePortfolio({
        available_capital: capitalCr * 10000000,
        available_engineers: engineers,
        available_prep_hours: prepHours,
      });
      setOptimizedResult(res);
      success('Portfolio optimized', 'Calculated highest-return tender combination within capacity limits.');
    } catch (err: any) {
      error('Optimization error', err.message);
    } finally {
      setIsOptimizing(false);
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
            <Briefcase className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Tender Portfolio Optimizer</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Optimize your active bidding group to maximize expected profit under capital, technical personnel, and deadline preparation limits.
          </p>
        </div>

        <button
          onClick={handleOptimize}
          disabled={isOptimizing}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50 self-start sm:self-auto"
        >
          {isOptimizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>Run Portfolio Optimization</span>
        </button>
      </div>

      {/* KPI Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Combined Tender Value</span>
              <Briefcase className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              ₹{(overview.combined_tender_value / 10000000).toFixed(2)} Cr
            </p>
            <p className="text-[11px] text-slate-500 mt-1">{overview.total_active_tenders} active candidate tenders</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Expected Total Profit</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-700 mt-2">
              ₹{(overview.combined_expected_profit / 10000000).toFixed(2)} Cr
            </p>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">
              Average margin: {overview.average_expected_margin}%
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Engineering Capacity</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {overview.company_capacity.engineers} Engineers
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Available company payroll team</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Proposal Capacity</span>
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {overview.company_capacity.weekly_hours} hrs/wk
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Available preparation bandwidth</p>
          </div>
        </div>
      )}

      {/* Multi-Tender Resource Conflict Alert */}
      {overview?.conflicts && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            overview.conflicts.has_conflict
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          {overview.conflicts.has_conflict ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider">
                {overview.conflicts.has_conflict
                  ? `Resource Conflict Detected (${overview.conflicts.severity} Severity)`
                  : 'Resource Capacity Optimal'}
              </h3>
            </div>
            <p className="text-xs mt-0.5">{overview.conflicts.recommendation}</p>
          </div>
        </div>
      )}

      {/* Constraints Input Form */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4">
          Optimization Constraints & Boundaries
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Available Working Capital (₹ Crores)
            </label>
            <input
              type="number"
              step="0.5"
              value={capitalCr}
              onChange={(e) => setCapitalCr(parseFloat(e.target.value) || 0)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Available Execution Engineers
            </label>
            <input
              type="number"
              step="1"
              value={engineers}
              onChange={(e) => setEngineers(parseInt(e.target.value) || 0)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Available Proposal Preparation Hours
            </label>
            <input
              type="number"
              step="10"
              value={prepHours}
              onChange={(e) => setPrepHours(parseFloat(e.target.value) || 0)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Optimization Results */}
      {optimizedResult && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recommended Optimal Portfolio Combination</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Selected {optimizedResult.portfolio_count} tenders yielding highest combined return without capacity violation.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">Projected Portfolio Profit</span>
              <p className="text-lg font-bold text-emerald-700">
                ₹{(optimizedResult.expected_combined_profit / 10000000).toFixed(2)} Cr
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500">Engineers Allocated:</span>
              <p className="text-base font-bold text-slate-800 mt-1">
                {optimizedResult.engineers_utilized} / {optimizedResult.engineers_capacity} ({optimizedResult.engineer_utilization_pct}%)
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500">Capital Utilized:</span>
              <p className="text-base font-bold text-slate-800 mt-1">
                ₹{(optimizedResult.capital_utilized / 10000000).toFixed(2)} Cr
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500">Combined Value:</span>
              <p className="text-base font-bold text-slate-800 mt-1">
                ₹{(optimizedResult.combined_tender_value / 10000000).toFixed(2)} Cr ({optimizedResult.combined_margin}% margin)
              </p>
            </div>
          </div>

          {/* Selected Tenders List */}
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden mt-4">
            {optimizedResult.selected_tenders.map((t: any, idx: number) => (
              <div key={t.id || idx} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div className="min-w-0 flex-1 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                      {idx + 1}
                    </span>
                    <p className="text-xs font-semibold text-slate-900 truncate">{t.title}</p>
                  </div>
                  <p className="text-[11px] text-slate-500 ml-7">{t.organization || 'Procuring Authority'}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-blue-700">{t.estimated_value_display || 'Value N/A'}</span>
                  <span className="block text-[11px] text-emerald-600 font-medium">Opp: {t.opportunity_score?.toFixed(0) || '0'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
