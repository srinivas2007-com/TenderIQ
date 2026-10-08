import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Tender } from '../types';
import { useToast } from '../context/ToastContext';
import {
  FileText,
  Search,
  UploadCloud,
  ArrowRight,
  Trash2,
  Loader2,
  Calendar,
  Building,
  TrendingUp,
  Scale,
  Sparkles
} from 'lucide-react';

export const TendersListPage: React.FC = () => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendationFilter, setRecommendationFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'value'>('date');
  const { success, error } = useToast();

  const fetchTenders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await api.getTenders({
        q: searchQuery,
        recommendation: recommendationFilter || undefined,
      });
      setTenders(data);
    } catch (err: any) {
      if (!silent) error('Failed to load tenders', err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenders();
  }, [recommendationFilter, searchQuery]);

  // Polling loop for background processing status updates
  useEffect(() => {
    const hasProcessing = tenders.some((t) =>
      ['uploading', 'extracting', 'analyzing', 'matching', 'calculating'].includes(t.status)
    );
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      fetchTenders(true);
    }, 3500);

    return () => clearInterval(interval);
  }, [tenders]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.deleteTender(id);
      setTenders(tenders.filter((t) => t.id !== id));
      success('Tender deleted', 'Tender record and related intelligence removed.');
    } catch (err: any) {
      error('Delete failed', err.message);
    }
  };

  const sortedTenders = [...tenders].sort((a, b) => {
    if (sortBy === 'score') {
      return (b.analysis?.readiness_score || 0) - (a.analysis?.readiness_score || 0);
    }
    if (sortBy === 'value') {
      return (b.estimated_value || 0) - (a.estimated_value || 0);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const getStatusBadge = (t: Tender) => {
    if (t.status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          COMPLETED
        </span>
      );
    }
    if (t.status === 'failed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          FAILED
        </span>
      );
    }
    const stepLabels: Record<string, string> = {
      uploading: 'UPLOADING',
      extracting: 'EXTRACTING',
      analyzing: 'ANALYZING',
      matching: 'MATCHING',
      calculating: 'CALCULATING',
    };
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
        <Loader2 className="w-3 h-3 animate-spin" />
        {stepLabels[t.status] || t.status.toUpperCase()} ({t.status_step}/5)
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Tender Pipeline & Intelligence</h2>
          <p className="text-xs text-slate-500 mt-0.5">Track, audit, and benchmark all public and private procurement opportunities</p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/compare"
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors border border-slate-200"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Compare Matrix</span>
          </Link>

          <Link
            to="/tenders/upload"
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Tender PDF</span>
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tenders by title, organization, or ref number..."
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={recommendationFilter}
            onChange={(e) => setRecommendationFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none"
          >
            <option value="">All Recommendations</option>
            <option value="SUITABLE">Suitable to Apply</option>
            <option value="CAUTION">Apply with Caution</option>
            <option value="NOT_RECOMMENDED">Not Recommended</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none"
          >
            <option value="date">Sort by Recent</option>
            <option value="score">Sort by Score</option>
            <option value="value">Sort by Value</option>
          </select>
        </div>
      </div>

      {/* Tenders Cards Grid */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <p className="text-xs">Loading tender pipeline records...</p>
        </div>
      ) : sortedTenders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No tenders found in this view</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Upload your first tender document PDF to run automated intelligence extraction and qualification scoring.
          </p>
          <Link
            to="/tenders/upload"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Tender Document
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedTenders.map((t) => {
            const isProcessing = ['uploading', 'extracting', 'analyzing', 'matching', 'calculating'].includes(t.status);
            return (
              <div
                key={t.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    {getStatusBadge(t)}
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(t.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <Link
                      to={`/tenders/${t.id}`}
                      className="font-bold text-slate-900 hover:text-blue-600 line-clamp-2 text-sm leading-snug"
                    >
                      {t.title}
                    </Link>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 truncate">
                      <Building className="w-3 h-3 text-slate-400 shrink-0" />
                      {t.organization || 'Procuring Authority'}
                    </p>
                  </div>

                  {/* Commercial Metrics Strip */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Tender Value</span>
                      <span className="font-bold text-slate-800">{t.estimated_value_display || 'As per NIT'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Opportunity Score</span>
                      <span className="font-bold text-blue-700">
                        {t.opportunity_score ? `${t.opportunity_score.toFixed(0)}/100` : 'Evaluating...'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={(e) => handleDelete(t.id, e)}
                    className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                    title="Delete Tender"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <Link
                    to={`/tenders/${t.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <span>{isProcessing ? 'View Status' : 'Open Workspace'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
