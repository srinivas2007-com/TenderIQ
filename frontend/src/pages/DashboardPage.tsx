import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { DashboardStats, Tender } from '../types';
import { RecommendationBadge } from '../components/common/RecommendationBadge';
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  Search,
  UploadCloud,
  ArrowRight,
  TrendingUp,
  Loader2,
  Briefcase,
  CheckSquare,
  Sparkles,
  Sliders,
  Scale,
  Building2
} from 'lucide-react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip as RechartsTooltip,
  Cell
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [heatMapAxis, setHeatMapAxis] = useState<'profit_vs_risk' | 'readiness_vs_profit'>('profit_vs_risk');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const filteredTenders = (stats?.recent_tenders || []).filter((tender) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      tender.title.toLowerCase().includes(q) ||
      (tender.organization && tender.organization.toLowerCase().includes(q)) ||
      (tender.reference_number && tender.reference_number.toLowerCase().includes(q));

    if (!matchSearch) return false;

    if (statusFilter === 'ALL') return true;
    const opp = tender.opportunity_verdict || tender.analysis?.recommendation || '';
    if (statusFilter === 'RECOMMENDED') return opp.includes('RECOMMENDED');
    if (statusFilter === 'CAUTION') return opp.includes('CAUTION') || opp.includes('REVIEW');
    if (statusFilter === 'NOT_RECOMMENDED') return opp.includes('HIGH RISK') || opp.includes('NOT RECOMMENDED');
    return true;
  });

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-xs">Loading TenderIQ intelligence dashboard...</p>
      </div>
    );
  }

  // Prepare Heat Map Points
  const heatMapData = (stats?.heat_map_points || []).map((pt) => ({
    ...pt,
    x: heatMapAxis === 'profit_vs_risk' ? pt.risk_score : pt.readiness,
    y: heatMapAxis === 'profit_vs_risk' ? pt.profit_margin : pt.profit_margin,
    z: pt.opportunity,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Commercial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
        {/* Total Tenders */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Tenders</span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats?.total_tenders || 0}</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Pipeline database</p>
        </div>

        {/* Recommended */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Recommended</span>
          <h3 className="text-2xl font-bold text-emerald-700 mt-1">{stats?.suitable_count || 0}</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">High opportunity bids</p>
        </div>

        {/* Potential Value */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Potential Value</span>
          <h3 className="text-2xl font-bold text-blue-700 mt-1">
            ₹{((stats?.potential_tender_value || 0) / 10000000).toFixed(1)} Cr
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Combined contract pool</p>
        </div>

        {/* Expected Profit */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Expected Profit</span>
          <h3 className="text-2xl font-bold text-emerald-700 mt-1">
            ₹{((stats?.expected_profit_total || 0) / 10000000).toFixed(2)} Cr
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Projected net surplus</p>
        </div>

        {/* Open Tasks */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">Open Tasks</span>
          <h3 className="text-2xl font-bold text-purple-700 mt-1">{stats?.open_tasks_count || 0}</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Milestones pending</p>
        </div>

        {/* Deadlines */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Deadlines</span>
          <h3 className="text-2xl font-bold text-amber-700 mt-1">{stats?.upcoming_deadlines_count || 0}</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Submission milestones</p>
        </div>
      </div>

      {/* Fresh Account Quick-Start Guide */}
      {stats?.total_tenders === 0 && (
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-xl p-6 border border-slate-800 shadow-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-300 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-blue-400/30 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Account Setup Guide</span>
              </div>
              <h2 className="text-base font-bold text-white">Welcome to TenderIQ AI</h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Your database is fresh and ready for your organization. Follow these two simple steps to get automated bid readiness scores:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 max-w-xl">
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">Step 1</span>
                  <p className="text-xs font-semibold text-white mt-0.5">Complete Company Profile</p>
                  <p className="text-[11px] text-slate-400 mt-1">Configure your annual turnover, years in business, team size, and ISO/MSME certifications.</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">Step 2</span>
                  <p className="text-xs font-semibold text-white mt-0.5">Upload Tender PDF</p>
                  <p className="text-[11px] text-slate-400 mt-1">Upload tender notice (NIT) to automatically extract requirements, calculate fit, and forecast profits.</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
              <Link
                to="/company-profile"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2.5 rounded-lg border border-white/20 transition-colors"
              >
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>Edit Company Profile</span>
              </Link>
              <Link
                to="/tenders/upload"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload First Tender</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Multi-tender Resource Conflict Alert (if any) */}
      {stats?.resource_conflicts && stats.resource_conflicts.has_conflict && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Concurrent Resource Conflict Alert ({stats.resource_conflicts.severity} Severity)
            </h4>
            <p className="text-xs mt-0.5">{stats.resource_conflicts.recommendation}</p>
          </div>
          <Link
            to="/portfolio"
            className="text-xs font-semibold text-amber-800 hover:text-amber-950 underline shrink-0"
          >
            Resolve in Portfolio &rarr;
          </Link>
        </div>
      )}

      {/* Middle Grid: Top Opportunities & Tender Heat Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Opportunities List */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Top Rated Opportunities</h3>
              </div>
              <Link to="/compare" className="text-xs text-blue-600 hover:underline font-semibold">
                Compare All
              </Link>
            </div>

            <div className="space-y-2.5">
              {(stats?.top_opportunities || []).slice(0, 4).map((opp, idx) => (
                <Link
                  key={opp.id}
                  to={`/tenders/${opp.id}`}
                  className="block p-3 rounded-lg border border-slate-100 hover:border-blue-300 hover:bg-blue-50/20 transition-all text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-900 line-clamp-1">{opp.title}</p>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 shrink-0">
                      Opp {opp.opportunity_score?.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
                    <span>{opp.estimated_value_display || 'Value N/A'}</span>
                    <span className="font-semibold text-emerald-700">{opp.profit_margin?.toFixed(1)}% Expected Margin</span>
                  </div>
                </Link>
              ))}

              {(!stats?.top_opportunities || stats.top_opportunities.length === 0) && (
                <div className="p-8 text-center text-xs text-slate-400">
                  Upload tenders to populate automated opportunity rankings.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link to="/simulator" className="text-slate-600 hover:text-blue-600 flex items-center gap-1 font-medium">
              <Sliders className="w-3.5 h-3.5" /> What-If Simulator
            </Link>
            <Link to="/company-profile" className="text-slate-600 hover:text-blue-600 flex items-center gap-1 font-medium">
              <Building2 className="w-3.5 h-3.5" /> Company Profile
            </Link>
          </div>
        </div>

        {/* Visual Tender Heat Map */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Tender Portfolio Heat Map</h3>
              <p className="text-[11px] text-slate-500">
                Quadrant distribution by profitability, risk exposure, and qualification readiness
              </p>
            </div>

            {/* Axis Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-medium">
              <button
                onClick={() => setHeatMapAxis('profit_vs_risk')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  heatMapAxis === 'profit_vs_risk' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600'
                }`}
              >
                Profit vs Risk
              </button>
              <button
                onClick={() => setHeatMapAxis('readiness_vs_profit')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  heatMapAxis === 'readiness_vs_profit' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600'
                }`}
              >
                Readiness vs Profit
              </button>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                <XAxis
                  type="number"
                  dataKey="x"
                  name={heatMapAxis === 'profit_vs_risk' ? 'Contractual Risk Index' : 'Bid Readiness'}
                  unit={heatMapAxis === 'profit_vs_risk' ? ' /100' : '%'}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Expected Profit Margin"
                  unit="%"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                />
                <ZAxis type="number" dataKey="z" range={[60, 220]} name="Opportunity Score" />
                <RechartsTooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-lg space-y-1">
                          <p className="font-bold">{d.title}</p>
                          <p className="text-[11px] text-slate-300">Opportunity Score: {d.opportunity?.toFixed(0)}</p>
                          <p className="text-[11px] text-emerald-400">Profit Margin: {d.profit_margin}%</p>
                          <p className="text-[11px] text-amber-300">Readiness: {d.readiness}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter data={heatMapData}>
                  {heatMapData.map((entry, index) => {
                    const colorMap: Record<string, string> = {
                      green: '#16a34a',
                      yellow: '#eab308',
                      orange: '#f97316',
                      red: '#dc2626',
                      gray: '#94a3b8',
                    };
                    return <Cell key={`cell-${index}`} fill={colorMap[entry.status_color] || '#3b82f6'} />;
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" /> Recommended</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" /> Review Carefully</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" /> High Risk</span>
          </div>
        </div>
      </div>

      {/* Tender Pipeline Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Filters Header */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Active Tender Pipeline</h3>
            <span className="text-xs text-slate-400">({filteredTenders.length})</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search tenders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
            >
              <option value="ALL">All Verdicts</option>
              <option value="RECOMMENDED">Recommended</option>
              <option value="CAUTION">Caution / Review</option>
              <option value="NOT_RECOMMENDED">High Risk</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="p-3.5">Tender Title & Reference</th>
                <th className="p-3.5">Authority</th>
                <th className="p-3.5">Value</th>
                <th className="p-3.5">Readiness</th>
                <th className="p-3.5">Opportunity</th>
                <th className="p-3.5">Expected Margin</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTenders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                    No active tenders found. Upload a tender PDF to begin.
                  </td>
                </tr>
              ) : (
                filteredTenders.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 max-w-xs">
                      <Link to={`/tenders/${t.id}`} className="font-semibold text-slate-900 hover:text-blue-600 line-clamp-1">
                        {t.title}
                      </Link>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{t.reference_number || 'NIT Reference Pending'}</span>
                    </td>
                    <td className="p-3.5 text-slate-600">{t.organization || 'Procuring Authority'}</td>
                    <td className="p-3.5 font-semibold text-slate-800">{t.estimated_value_display || 'As per NIT'}</td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {t.analysis?.readiness_score || 0}%
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {t.opportunity_score ? `${t.opportunity_score.toFixed(0)}/100` : 'Pending'}
                      </span>
                    </td>
                    <td className="p-3.5 font-semibold text-emerald-700">
                      {t.profit_margin ? `${t.profit_margin.toFixed(1)}%` : 'Pending'}
                    </td>
                    <td className="p-3.5 text-right">
                      <Link
                        to={`/tenders/${t.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        <span>Workspace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
