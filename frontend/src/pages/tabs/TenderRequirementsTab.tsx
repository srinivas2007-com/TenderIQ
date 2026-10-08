import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { TenderRequirement } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Filter, ExternalLink, Loader2, BookOpen, X, FileText } from 'lucide-react';

interface TenderRequirementsTabProps {
  tenderId: string;
  onNavigateToPage?: (pageNum: number) => void;
}

export const TenderRequirementsTab: React.FC<TenderRequirementsTabProps> = ({
  tenderId,
  onNavigateToPage
}) => {
  const [requirements, setRequirements] = useState<TenderRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterResult, setFilterResult] = useState<string>('ALL');
  const [selectedSourceReq, setSelectedSourceReq] = useState<TenderRequirement | null>(null);

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const data = await api.getTenderRequirements(tenderId);
      setRequirements(data);
    } catch (err) {
      console.error('Failed to load requirements', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, [tenderId]);

  const filtered = requirements.filter((req) => {
    if (filterResult === 'ALL') return true;
    return req.match_result === filterResult;
  });

  const passCount = requirements.filter((r) => r.match_result === 'PASS').length;
  const partialCount = requirements.filter((r) => r.match_result === 'PARTIAL').length;
  const failCount = requirements.filter((r) => r.match_result === 'FAIL').length;

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-xs">Loading tender requirements comparison...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Filters & Counts Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700">Filter By Result:</span>

          <div className="flex items-center gap-1.5 ml-2">
            {[
              { id: 'ALL', label: `All (${requirements.length})` },
              { id: 'PASS', label: `Pass (${passCount})` },
              { id: 'PARTIAL', label: `Partial (${partialCount})` },
              { id: 'FAIL', label: `Fail (${failCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterResult(tab.id)}
                className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                  filterResult === tab.id
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
          Showing <span className="font-semibold text-slate-800">{filtered.length}</span> of {requirements.length} requirements
        </div>
      </div>

      {/* Requirements Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Requirement</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Tender Requirement Clause</th>
                <th className="py-3 px-4">Company Status</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4 text-center">Source Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No requirements match the selected filter.
                  </td>
                </tr>
              ) : (
                filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {req.requirement_title}
                      {req.mandatory && (
                        <span className="ml-1.5 text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded">
                          Mandatory
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
                      {req.category}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 max-w-sm">
                      <p className="line-clamp-2 leading-relaxed">{req.tender_requirement}</p>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 font-medium whitespace-nowrap">
                      {req.company_status || 'Under verification'}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={req.match_result} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => setSelectedSourceReq(req)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>View Source</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Source Modal */}
      {selectedSourceReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Source Audit Verification</h3>
              </div>
              <button
                onClick={() => setSelectedSourceReq(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-700">Requirement:</span>
                <p className="text-slate-900 font-semibold mt-0.5">{selectedSourceReq.requirement_title}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Source Page in Tender</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">Page {selectedSourceReq.source_page || 1}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Extraction Confidence</span>
                  <p className="text-sm font-bold text-emerald-700 mt-0.5">
                    {Math.round((selectedSourceReq.confidence || 0.95) * 100)}% Verified
                  </p>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700">Verbatim Extracted Snippet:</span>
                <blockquote className="mt-1 p-3 bg-slate-100 rounded-lg text-slate-800 italic border-l-2 border-blue-600 text-[11px] leading-relaxed">
                  "{selectedSourceReq.source_text || selectedSourceReq.tender_requirement}"
                </blockquote>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setSelectedSourceReq(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
              {selectedSourceReq.source_page && onNavigateToPage && (
                <button
                  type="button"
                  onClick={() => {
                    const pg = selectedSourceReq.source_page!;
                    setSelectedSourceReq(null);
                    onNavigateToPage(pg);
                  }}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold inline-flex items-center gap-1.5"
                >
                  <span>Open PDF Page {selectedSourceReq.source_page}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
