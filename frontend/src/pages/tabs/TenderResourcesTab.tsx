import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { ResourceRequirement, Clarification } from '../../types';
import { Users, AlertTriangle, CheckCircle2, HelpCircle, Loader2, ArrowRight } from 'lucide-react';

interface TenderResourcesTabProps {
  tenderId: string;
}

export const TenderResourcesTab: React.FC<TenderResourcesTabProps> = ({ tenderId }) => {
  const [resources, setResources] = useState<ResourceRequirement | null>(null);
  const [clarifications, setClarifications] = useState<Clarification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [tenderId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resData, clarData] = await Promise.all([
        api.getTenderResources(tenderId),
        api.getTenderClarifications(tenderId),
      ]);
      setResources(resData);
      setClarifications(clarData);
    } catch (err) {
      console.error('Failed to load resources tab', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClarification = async (clarId: string, newStatus: string) => {
    try {
      await api.updateClarification(tenderId, clarId, { status: newStatus });
      setClarifications(clarifications.map((c) => (c.id === clarId ? { ...c, status: newStatus as any } : c)));
    } catch (err) {
      console.error('Failed to update clarification', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-xs">
      {/* Engineering Resource KPI Strip */}
      {resources && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase text-slate-400">Required Engineers</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{resources.required_engineers} Staff</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Estimated site demand</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase text-slate-400">Company Available</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{resources.available_engineers} Staff</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Active company workforce</p>
          </div>

          <div className={`p-4 rounded-xl border shadow-sm ${resources.gap_engineers > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <span className="text-[10px] font-bold uppercase text-slate-500">Resource Gap</span>
            <p className={`text-2xl font-bold mt-1 ${resources.gap_engineers > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
              {resources.gap_engineers} Engineers
            </p>
            <p className="text-[10px] opacity-80 mt-0.5">
              {resources.gap_engineers > 0 ? 'Expansion needed' : 'Optimal capacity'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase text-slate-400">Proposal Prep Hours</span>
            <p className="text-2xl font-bold text-blue-600 mt-1">{resources.preparation_hours_needed} Hours</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Estimated team bandwidth</p>
          </div>
        </div>
      )}

      {/* Recommended Action & Remediation Levers */}
      {resources && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Workforce Allocation & Feasibility Assessment
            </h3>
          </div>
          <p className="text-slate-600">{resources.notes}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            {(resources.options || [
              { title: 'Internal Reallocation', feasible: true, description: 'Reassign engineers from lower priority maintenance streams' },
              { title: 'Specialized Subcontracting', feasible: true, description: 'Engage vetted regional technical partners' },
              { title: 'Consortium / JV', feasible: resources.gap_engineers >= 3, description: 'Partner with local engineering contractor' },
              { title: 'Lateral Hiring', feasible: true, description: 'Contingency recruitment upon LOA award' },
            ]).map((opt: any, idx: number) => (
              <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{opt.title}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${opt.feasible ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                    {opt.feasible ? 'Feasible' : 'Secondary'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 leading-snug">{opt.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pre-Bid Clarifications */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span className="font-bold uppercase tracking-wider text-slate-700 text-[11px]">
              Pre-Bid Clarification Questions ({clarifications.length})
            </span>
          </div>
          <span className="text-[10px] text-slate-500">
            Ambiguous clauses extracted for pre-bid submission
          </span>
        </div>

        {clarifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No ambiguous clauses identified in this tender notice.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {clarifications.map((c) => (
              <div key={c.id} className="p-4 space-y-2 hover:bg-slate-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {c.clause_reference || 'Clause Review'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.priority === 'HIGH' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700'}`}>
                        {c.priority} Priority
                      </span>
                      {c.source_page && (
                        <span className="text-[10px] text-slate-400">Page {c.source_page}</span>
                      )}
                    </div>
                    <p className="font-semibold text-slate-900">{c.question}</p>
                    {c.reason && <p className="text-slate-500 text-[11px]"><b>Reason:</b> {c.reason}</p>}
                    {c.answer && <p className="text-emerald-700 text-[11px] bg-emerald-50 p-2 rounded border border-emerald-100"><b>Official Response:</b> {c.answer}</p>}
                  </div>

                  <select
                    value={c.status}
                    onChange={(e) => handleUpdateClarification(c.id, e.target.value)}
                    className="text-[11px] border border-slate-300 rounded-md p-1 bg-white text-slate-700"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Review">Under Review</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Answered">Answered</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
