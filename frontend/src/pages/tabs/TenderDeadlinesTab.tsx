import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { TenderDeadline } from '../../types';
import {
  Calendar,
  Clock,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Bell
} from 'lucide-react';

interface TenderDeadlinesTabProps {
  tenderId: string;
  onNavigateToPage?: (pageNum: number) => void;
}

export const TenderDeadlinesTab: React.FC<TenderDeadlinesTabProps> = ({
  tenderId,
  onNavigateToPage
}) => {
  const [deadlines, setDeadlines] = useState<TenderDeadline[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeadlines = async () => {
    try {
      setLoading(true);
      const data = await api.getTenderDeadlines(tenderId);
      setDeadlines(data);
    } catch (err) {
      console.error('Failed to load deadlines', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeadlines();
  }, [tenderId]);

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-2" />
        <p className="text-xs">Loading tender deadlines & milestones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-semibold text-slate-900">Critical Procurement Milestones</h3>
        </div>
        <p className="text-xs text-slate-500">
          Official timeline extracted from the Notice Inviting Tender (NIT) schedule
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {deadlines.length === 0 ? (
          <div className="col-span-3 bg-white rounded-lg border border-slate-200 p-8 text-center text-xs text-slate-400">
            No specific timeline milestones detected in tender document.
          </div>
        ) : (
          deadlines.map((dl) => {
            const isSubmission = dl.deadline_type === 'submission';
            const isPreBid = dl.deadline_type === 'pre_bid';

            return (
              <div
                key={dl.id}
                className={`bg-white rounded-lg border p-5 shadow-sm flex flex-col justify-between ${
                  isSubmission
                    ? 'border-brand-300 ring-1 ring-brand-500/20'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        isSubmission
                          ? 'bg-brand-100 text-brand-800'
                          : isPreBid
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {dl.title}
                    </span>

                    {dl.source_page && (
                      <button
                        onClick={() => onNavigateToPage?.(dl.source_page!)}
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-brand-600 hover:text-brand-800"
                      >
                        Page {dl.source_page}
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="my-3">
                    <div className="text-xl font-extrabold text-slate-900 tracking-tight">
                      {dl.deadline_date_display || 'Refer Schedule'}
                    </div>
                    {isSubmission && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-semibold mt-1">
                        <AlertCircle className="w-3 h-3" /> Hard online portal cutoff
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {dl.description || 'Mandatory milestone for all eligible bidders.'}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Indian Standard Time (IST)
                  </span>
                  <span className="font-semibold text-slate-700">Official Clause</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
