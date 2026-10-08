import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Tender } from '../types';
import { useToast } from '../context/ToastContext';
import { Scale, CheckCircle2, Trophy, Loader2, UploadCloud } from 'lucide-react';

export const ComparePage: React.FC = () => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isComparing, setIsComparing] = useState(false);
  const { error } = useToast();

  useEffect(() => {
    loadTenders();
  }, []);

  const loadTenders = async () => {
    try {
      setIsLoading(true);
      const data = await api.getTenders();
      const completed = data.filter((t) => t.status === 'completed');
      setTenders(completed);
      // Auto-select top 2-3 tenders if available
      if (completed.length >= 2) {
        setSelectedIds(completed.slice(0, 3).map((t) => t.id));
      }
    } catch (err: any) {
      error('Failed to load tenders', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length <= 2 && comparisonData) {
        // Minimum 2
        return;
      }
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      if (selectedIds.length >= 8) return;
      setSelectedIds([...selectedIds, id]);
    }
  };

  const runComparison = async () => {
    if (selectedIds.length < 2) {
      error('Selection required', 'Please select at least 2 tenders to compare.');
      return;
    }
    try {
      setIsComparing(true);
      const res = await api.compareTenders(selectedIds);
      setComparisonData(res);
    } catch (err: any) {
      error('Comparison error', err.message);
    } finally {
      setIsComparing(false);
    }
  };

  useEffect(() => {
    if (selectedIds.length >= 2) {
      runComparison();
    }
  }, [selectedIds]);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Smart Tender Comparison Matrix</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Evaluate 2 to 8 candidate tenders side-by-side across commercial viability, eligibility readiness, profitability, and resource gap.
          </p>
        </div>

        <button
          onClick={runComparison}
          disabled={isComparing || selectedIds.length < 2}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm self-start sm:self-auto"
        >
          {isComparing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scale className="w-4 h-4" />}
          <span>Re-Evaluate Matrix ({selectedIds.length})</span>
        </button>
      </div>

      {tenders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <Scale className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No candidate tenders to compare yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4 max-w-md mx-auto">
            The Comparison Matrix evaluates 2 or more candidate tenders side-by-side across commercial feasibility, win potential, and resource requirements.
          </p>
          <Link
            to="/tenders/upload"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Tender
          </Link>
        </div>
      ) : (
        <>
          {tenders.length === 1 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-xs flex items-center justify-between">
              <span>You have 1 tender in your pipeline. Upload at least 1 more tender to enable side-by-side comparison.</span>
              <Link to="/tenders/upload" className="font-semibold text-blue-600 hover:underline shrink-0 ml-4">
                Upload another tender →
              </Link>
            </div>
          )}

          {/* Tender Selection Chips */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Select Candidate Tenders to Compare ({selectedIds.length} Selected)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {tenders.map((t) => {
                const isSelected = selectedIds.includes(t.id);
                return (
                  <div
                    key={t.id}
                    onClick={() => handleToggleSelect(t.id)}
                    className={`cursor-pointer p-3 rounded-lg border text-xs transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-900 line-clamp-1">{t.title}</p>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{t.estimated_value_display || 'Value N/A'}</span>
                      <span className="font-medium text-blue-700">Opp: {t.opportunity_score?.toFixed(0) || '0'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}


      {/* Comparison Matrix Table */}
      {comparisonData && comparisonData.tenders && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Side-by-Side Procurement Parameters
            </span>
            {comparisonData.best_tender_id && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                <span>Rank #1 Opportunity Highlighted</span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70">
                  <th className="p-3.5 font-semibold text-slate-700 w-48 sticky left-0 bg-slate-100 z-10 border-r border-slate-200">
                    Metric / Clause
                  </th>
                  {comparisonData.tenders.map((t: any) => {
                    const isBest = t.id === comparisonData.best_tender_id;
                    return (
                      <th
                        key={t.id}
                        className={`p-3.5 font-semibold min-w-[200px] border-r border-slate-200 ${
                          isBest ? 'bg-emerald-50/70 text-emerald-950 border-t-2 border-t-emerald-600' : 'text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {isBest && <Trophy className="w-4 h-4 text-emerald-600 shrink-0" />}
                          <span className="truncate">{t.title}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {comparisonData.metrics.map((metric: any) => (
                  <tr key={metric.key} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-medium text-slate-600 sticky left-0 bg-white z-10 border-r border-slate-200 shadow-sm">
                      {metric.label}
                    </td>
                    {comparisonData.tenders.map((t: any) => {
                      const isBest = t.id === comparisonData.best_tender_id;
                      const val = t[metric.key];
                      const isScore = metric.key.includes('score');
                      const isProfit = metric.key.includes('profit');

                      return (
                        <td
                          key={t.id}
                          className={`p-3.5 border-r border-slate-200 text-slate-800 ${
                            isBest ? 'bg-emerald-50/20 font-medium' : ''
                          }`}
                        >
                          {isScore ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              {val}
                            </span>
                          ) : isProfit ? (
                            <span className="font-semibold text-emerald-700">{val}</span>
                          ) : (
                            val || 'N/A'
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
