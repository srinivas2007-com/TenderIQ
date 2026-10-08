import React from 'react';
import { Tender, TenderAnalysis } from '../../types';
import { ScoreBreakdownCard } from '../../components/common/ScoreBreakdownCard';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building,
  Calendar,
  Clock,
  Coins,
  Shield,
  FileText,
  RotateCw,
  MapPin
} from 'lucide-react';

interface TenderAnalysisTabProps {
  tender: Tender;
  analysis: TenderAnalysis;
  onRecalculate: () => void;
  recalculating: boolean;
}

export const TenderAnalysisTab: React.FC<TenderAnalysisTabProps> = ({
  tender,
  analysis,
  onRecalculate,
  recalculating
}) => {
  const reasons = analysis.recommendation_reasons || {};
  const passList = reasons.pass || [];
  const warningList = reasons.warning || [];
  const failList = reasons.fail || [];

  return (
    <div className="space-y-6">
      {/* Top Banner: Key Parameters & Recalculate Button */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Estimated Value</span>
            <span className="font-bold text-slate-900 mt-0.5 block text-sm">
              {tender.estimated_value_display || (tender.estimated_value ? `₹${(tender.estimated_value / 10000000).toFixed(2)} Cr` : 'As per Tender')}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">EMD Amount</span>
            <span className="font-semibold text-slate-900 mt-0.5 block">
              {tender.emd_display || (tender.emd_amount ? `₹${tender.emd_amount.toLocaleString()}` : 'Exempt / Specified')}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">Contract Duration</span>
            <span className="font-semibold text-slate-900 mt-0.5 block">
              {tender.contract_duration || '12 Months'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">Location</span>
            <span className="font-semibold text-slate-900 mt-0.5 block truncate max-w-[140px]">
              {tender.location || 'India'}
            </span>
          </div>
        </div>

        <button
          onClick={onRecalculate}
          disabled={recalculating}
          className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded shadow-sm transition-colors disabled:opacity-50 self-end md:self-auto"
        >
          <RotateCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
          {recalculating ? 'Recalculating...' : 'Recalculate with Latest Profile'}
        </button>
      </div>

      {/* Grid: Score Breakdown Card & Executive Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Transparent Score Breakdown */}
        <ScoreBreakdownCard analysis={analysis} />

        {/* Executive Summary */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <FileText className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900">Executive Summary & Scope</h3>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
            {analysis.executive_summary || 'No executive summary generated.'}
          </p>

          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded border border-slate-100">
              <span className="text-slate-400 block text-[11px]">Issuing Department</span>
              <span className="font-semibold text-slate-900 mt-0.5 block truncate">
                {tender.department || tender.organization || 'Public Authority'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-100">
              <span className="text-slate-400 block text-[11px]">Security Deposit / PBG</span>
              <span className="font-semibold text-slate-900 mt-0.5 block truncate">
                {tender.performance_security || '5% of contract value'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 14: Explainable Decision Rationale */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Explainable Recommendation Reasons</h3>
          <p className="text-xs text-slate-500">
            Transparent breakdown of why this tender received "{analysis.recommendation}"
          </p>
        </div>

        <div className="space-y-3">
          {/* PASS reasons */}
          {passList.map((reason, idx) => (
            <div key={`pass-${idx}`} className="p-3 bg-emerald-50/80 border border-emerald-200 rounded flex items-start gap-2.5 text-xs text-emerald-950">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-800">PASS: </span>
                {reason}
              </div>
            </div>
          ))}

          {/* WARNING reasons */}
          {warningList.map((reason, idx) => (
            <div key={`warn-${idx}`} className="p-3 bg-amber-50/80 border border-amber-200 rounded flex items-start gap-2.5 text-xs text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-800">WARNING: </span>
                {reason}
              </div>
            </div>
          ))}

          {/* FAIL reasons */}
          {failList.map((reason, idx) => (
            <div key={`fail-${idx}`} className="p-3 bg-red-50/80 border border-red-200 rounded flex items-start gap-2.5 text-xs text-red-950">
              <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-red-800">FAIL: </span>
                {reason}
              </div>
            </div>
          ))}

          {passList.length === 0 && warningList.length === 0 && failList.length === 0 && (
            <p className="text-xs text-slate-500 py-3">No specific disqualifications or warnings identified.</p>
          )}
        </div>
      </div>
    </div>
  );
};
