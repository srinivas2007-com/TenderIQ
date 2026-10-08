import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { HistoricalAnalytics, Tender } from '../types';
import { useToast } from '../context/ToastContext';
import { BarChart3, Plus, Trophy, XCircle, TrendingUp, BookOpen, AlertCircle, Loader2 } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<HistoricalAnalytics | null>(null);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTenderId, setSelectedTenderId] = useState('');
  const [decision, setDecision] = useState('BID');
  const [outcome, setOutcome] = useState('WON');
  const [awardedValue, setAwardedValue] = useState<number | ''>('');
  const [quotedValue, setQuotedValue] = useState<number | ''>('');
  const [lossReason, setLossReason] = useState('Price L1 Competition');
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { success, error } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [analyticsData, tenderList] = await Promise.all([
        api.getAnalytics(),
        api.getTenders(),
      ]);
      setAnalytics(analyticsData);
      setTenders(tenderList);
      if (tenderList.length > 0) {
        setSelectedTenderId(tenderList[0].id);
      }
    } catch (err: any) {
      error('Failed to load analytics', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.recordOutcome({
        tender_id: selectedTenderId || undefined,
        decision,
        outcome,
        awarded_value: awardedValue ? Number(awardedValue) * 10000000 : undefined,
        quoted_value: quotedValue ? Number(quotedValue) * 10000000 : undefined,
        loss_reason: outcome === 'LOST' ? lossReason : undefined,
        lessons_learned: lessonsLearned || undefined,
      });
      setIsModalOpen(false);
      setLessonsLearned('');
      success('Tender outcome recorded', 'Historical outcome logged for company learning.');
      loadData();
    } catch (err: any) {
      error('Failed to record outcome', err.message);
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
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Historical Tender Intelligence & Learning</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Empirical win/loss metrics, loss reason audits, and continuous learning from historical tender submissions.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record Tender Outcome</span>
        </button>
      </div>

      {/* Model Calibration Status Notice */}
      {analytics && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            analytics.has_sufficient_history
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <BookOpen className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider">{analytics.history_status_label}</h3>
            <ul className="text-xs mt-1 space-y-1">
              {analytics.learning_insights.map((ins, idx) => (
                <li key={idx}>• {ins}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Analytics KPI Cards */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tenders Analyzed</span>
            <p className="text-3xl font-black text-slate-900 mt-2">{analytics.tenders_analyzed}</p>
            <p className="text-[11px] text-slate-400 mt-1">Total pipeline evaluations</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Submitted Bids</span>
            <p className="text-3xl font-black text-slate-900 mt-2">{analytics.tenders_submitted}</p>
            <p className="text-[11px] text-slate-400 mt-1">{analytics.tenders_won} Won / {analytics.tenders_lost} Lost</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Win Rate</span>
            <p className="text-3xl font-black text-emerald-600 mt-2">{analytics.win_rate_percentage}%</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">Based on recorded submissions</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Average Profit Margin</span>
            <p className="text-3xl font-black text-blue-600 mt-2">{analytics.average_margin_percentage}%</p>
            <p className="text-[11px] text-slate-400 mt-1">Expected project margin</p>
          </div>
        </div>
      )}

      {/* Recorded Outcomes History */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Recorded Tender Outcomes & Lessons Learned
          </span>
          <span className="text-xs text-slate-500">{analytics?.recorded_outcomes.length || 0} Records</span>
        </div>

        {analytics?.recorded_outcomes.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No tender outcomes recorded yet. Record wins and losses to train your company's win probability curves.
          </div>
        ) : (
          <div className="divide-y divide-slate-200 text-xs">
            {analytics?.recorded_outcomes.map((o: any) => (
              <div key={o.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        o.outcome === 'WON'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : o.outcome === 'LOST'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {o.outcome}
                    </span>
                    <span className="font-semibold text-slate-900">Bid Decision: {o.decision}</span>
                  </div>
                  {o.loss_reason && <p className="text-slate-600">Loss Reason: {o.loss_reason}</p>}
                  {o.lessons_learned && <p className="text-slate-500 italic">"{o.lessons_learned}"</p>}
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  {o.created_at ? new Date(o.created_at).toLocaleDateString() : 'Recent'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Record Outcome Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Record Tender Outcome</h2>
            <form onSubmit={handleRecordOutcome} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Select Tender</label>
                <select
                  value={selectedTenderId}
                  onChange={(e) => setSelectedTenderId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800"
                >
                  {tenders.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title.substring(0, 45)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Outcome Result</label>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800"
                >
                  <option value="WON">WON (Awarded)</option>
                  <option value="LOST">LOST (Disqualified or L2/L3)</option>
                  <option value="SUBMITTED">SUBMITTED (Pending Evaluation)</option>
                  <option value="WITHDRAWN">WITHDRAWN</option>
                </select>
              </div>

              {outcome === 'LOST' && (
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Loss Reason</label>
                  <select
                    value={lossReason}
                    onChange={(e) => setLossReason(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800"
                  >
                    <option value="Price L1 Competition">Price L1 Competition (Outpriced)</option>
                    <option value="Technical Envelope Disqualification">Technical Envelope Disqualification</option>
                    <option value="Missing Documentation">Missing Documentation / Affidavits</option>
                    <option value="Turnover Shortfall">Turnover Shortfall</option>
                    <option value="Client Evaluation Bias">Client Evaluation Bias</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">Quoted Price (₹ Cr)</label>
                <input
                  type="number"
                  step="0.1"
                  value={quotedValue}
                  onChange={(e) => setQuotedValue(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="e.g. 8.5"
                  className="w-full border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Lessons Learned / Strategic Notes</label>
                <textarea
                  rows={3}
                  value={lessonsLearned}
                  onChange={(e) => setLessonsLearned(e.target.value)}
                  placeholder="Key takeaway to improve future bid estimates..."
                  className="w-full border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Record Outcome
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
