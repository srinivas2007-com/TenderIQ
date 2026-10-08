import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { TenderRisk } from '../../types';
import {
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  ExternalLink,
  Loader2,
  Filter,
  CheckCircle
} from 'lucide-react';

interface TenderRisksTabProps {
  tenderId: string;
  onNavigateToPage?: (pageNum: number) => void;
}

export const TenderRisksTab: React.FC<TenderRisksTabProps> = ({
  tenderId,
  onNavigateToPage
}) => {
  const [risks, setRisks] = useState<TenderRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const fetchRisks = async () => {
    try {
      setLoading(true);
      const data = await api.getTenderRisks(tenderId);
      setRisks(data);
    } catch (err) {
      console.error('Failed to load tender risks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRisks();
  }, [tenderId]);

  const filtered = risks.filter((r) => {
    if (severityFilter === 'ALL') return true;
    return r.severity === severityFilter;
  });

  const highCount = risks.filter((r) => r.severity === 'HIGH').length;
  const mediumCount = risks.filter((r) => r.severity === 'MEDIUM').length;
  const lowCount = risks.filter((r) => r.severity === 'LOW').length;

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-2" />
        <p className="text-xs">Loading tender risk assessment...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Risks Summary Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700">Filter By Severity:</span>

          <div className="flex items-center gap-1.5 ml-2">
            {[
              { id: 'ALL', label: `All Risks (${risks.length})` },
              { id: 'HIGH', label: `High Risk (${highCount})` },
              { id: 'MEDIUM', label: `Medium Risk (${mediumCount})` },
              { id: 'LOW', label: `Low Risk (${lowCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSeverityFilter(tab.id)}
                className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                  severityFilter === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Identified from contractual penalty clauses and special conditions
        </div>
      </div>

      {/* Risks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-2 bg-white rounded-lg border border-slate-200 p-8 text-center text-xs text-slate-400">
            No risks identified matching the selected criteria.
          </div>
        ) : (
          filtered.map((risk) => {
            const isHigh = risk.severity === 'HIGH';
            const isMedium = risk.severity === 'MEDIUM';

            return (
              <div
                key={risk.id}
                className={`bg-white rounded-lg border p-5 shadow-sm transition-all flex flex-col justify-between ${
                  isHigh
                    ? 'border-red-200 hover:border-red-300'
                    : isMedium
                    ? 'border-amber-200 hover:border-amber-300'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Severity Badge & Category */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        isHigh
                          ? 'bg-red-100 text-red-800'
                          : isMedium
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {risk.severity} RISK
                    </span>

                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                      {risk.category}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-bold text-slate-900 mb-2">{risk.title}</h4>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {risk.description}
                  </p>
                </div>

                {/* Mitigation & Source Page */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  {risk.mitigation_suggestion && (
                    <div className="bg-slate-50 p-2.5 rounded text-[11px] text-slate-700">
                      <span className="font-semibold text-slate-900">Recommended Mitigation: </span>
                      {risk.mitigation_suggestion}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span>Contract Clause Reference</span>
                    {risk.source_page ? (
                      <button
                        onClick={() => onNavigateToPage?.(risk.source_page!)}
                        className="inline-flex items-center gap-1 font-mono font-semibold text-brand-600 hover:text-brand-800 bg-brand-50 px-2 py-0.5 rounded text-[11px]"
                      >
                        Page {risk.source_page}
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="font-mono text-[11px]">NIT Document</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
