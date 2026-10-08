import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Tender, TenderAnalysis } from '../types';
import { RecommendationBadge } from '../components/common/RecommendationBadge';
import { LoadingSteps } from '../components/common/LoadingSteps';
import { useToast } from '../context/ToastContext';
import { TenderAnalysisTab } from './tabs/TenderAnalysisTab';
import { TenderRequirementsTab } from './tabs/TenderRequirementsTab';
import { TenderDocumentsTab } from './tabs/TenderDocumentsTab';
import { TenderRisksTab } from './tabs/TenderRisksTab';
import { TenderDeadlinesTab } from './tabs/TenderDeadlinesTab';
import { TenderPdfTab } from './tabs/TenderPdfTab';
import { TenderCostProfitTab } from './tabs/TenderCostProfitTab';
import { TenderResourcesTab } from './tabs/TenderResourcesTab';
import {
  FileText,
  ShieldCheck,
  CheckSquare,
  AlertTriangle,
  Clock,
  FileCode,
  ArrowLeft,
  Loader2,
  RotateCw,
  DollarSign,
  Users,
  Download,
  Briefcase
} from 'lucide-react';

export const TenderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tender, setTender] = useState<Tender | null>(null);
  const [analysis, setAnalysis] = useState<TenderAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'analysis' | 'requirements' | 'documents' | 'risks' | 'deadlines' | 'cost_profit' | 'resources' | 'pdf'
  >('analysis');
  const [pdfTargetPage, setPdfTargetPage] = useState<number>(1);
  const [recalculating, setRecalculating] = useState(false);
  const [isStartingBid, setIsStartingBid] = useState(false);
  const { success, error } = useToast();
  const pollingRef = useRef<any>(null);

  const fetchTenderData = async (isBackgroundPoll = false) => {
    if (!id) return;
    try {
      if (!isBackgroundPoll) setLoading(true);
      const tData = await api.getTender(id);
      setTender(tData);

      if (tData.status === 'completed') {
        const aData = await api.getTenderAnalysis(id);
        setAnalysis(aData);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      } else if (tData.status === 'failed') {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    } catch (err: any) {
      if (!isBackgroundPoll) {
        error('Failed to load tender details', err.message);
      }
    } finally {
      if (!isBackgroundPoll) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenderData();

    // Start auto-polling if tender is not yet completed
    pollingRef.current = setInterval(() => {
      fetchTenderData(true);
    }, 1500);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [id]);

  const handleRecalculate = async () => {
    if (!id) return;
    try {
      setRecalculating(true);
      await api.recalculateTender(id);
      await fetchTenderData();
      success('Readiness recalculated', 'Updated qualification scores, document checklist, and cost analysis.');
    } catch (err: any) {
      error('Recalculate failed', err.message);
    } finally {
      setRecalculating(false);
    }
  };

  const handleStartBid = async () => {
    if (!id) return;
    try {
      setIsStartingBid(true);
      await api.startBidWorkspace(id);
      if (tender) {
        setTender({ ...tender, workspace_active: true, bid_decision: 'BID' });
      }
      success('Bid Workspace Activated', 'Tender designated as active target. Workspace initialized.');
    } catch (err: any) {
      error('Failed to activate bid', err.message);
    } finally {
      setIsStartingBid(false);
    }
  };

  const handleNavigateToPage = (pageNum: number) => {
    setPdfTargetPage(pageNum);
    setActiveTab('pdf');
  };

  if (loading && !tender) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-xs">Loading tender workspace & decision data...</p>
      </div>
    );
  }

  // Live In-Progress Extraction & Analysis State
  if (tender && tender.status !== 'completed') {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        <div>
          <Link
            to="/tenders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Pipeline
          </Link>
        </div>

        <LoadingSteps
          currentStep={tender.status_step || (tender.status === 'extracting' ? 2 : tender.status === 'analyzing' ? 3 : tender.status === 'matching' ? 4 : 4)}
          status={tender.status}
          errorMessage={tender.error_message || undefined}
        />

        {tender.status === 'failed' && (
          <div className="text-center pt-2">
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-sm transition-colors"
            >
              <RotateCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
              Retry Document Processing
            </button>
          </div>
        )}
      </div>
    );
  }

  const score = analysis?.readiness_score ?? (tender?.analysis?.readiness_score ?? 0);
  const recommendation = analysis?.recommendation || tender?.opportunity_verdict || 'PROCESSING';

  const navTabs = [
    { id: 'analysis', label: 'Decision Overview', icon: ShieldCheck },
    { id: 'requirements', label: 'Requirements & Sources', icon: CheckSquare },
    { id: 'documents', label: 'Document Checklist', icon: FileText },
    { id: 'cost_profit', label: 'Cost & Profit Scenarios', icon: DollarSign },
    { id: 'resources', label: 'Resources & Clarifications', icon: Users },
    { id: 'risks', label: 'Risk Analysis', icon: AlertTriangle },
    { id: 'deadlines', label: 'Dates & Deadlines', icon: Clock },
    { id: 'pdf', label: 'Source PDF', icon: FileCode },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back button & Breadcrumb */}
      <div>
        <Link
          to="/tenders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Pipeline
        </Link>
      </div>

      {/* Tender Header Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <RecommendationBadge recommendation={recommendation} />
              {tender?.reference_number && (
                <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Ref: {tender.reference_number}
                </span>
              )}
              {tender?.workspace_active && (
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Target Bid Active
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
              {tender?.title}
            </h1>
            <p className="text-xs text-slate-500">
              {tender?.organization || 'Procuring Authority'} {tender?.location ? `· ${tender.location}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
              title="Recalculate bid readiness score against updated company profile"
            >
              <RotateCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
              <span>{recalculating ? 'Evaluating...' : 'Recalculate'}</span>
            </button>

            <a
              href={`http://127.0.0.1:8000/api/tenders/${id}/report/pdf`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF Report</span>
            </a>

            {!tender?.workspace_active ? (
              <button
                onClick={handleStartBid}
                disabled={isStartingBid}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>{isStartingBid ? 'Activating...' : 'Designate as Bid Target'}</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
                Active Bid Target
              </span>
            )}
          </div>
        </div>

        {/* Quick KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Estimated Value</span>
            <span className="font-bold text-slate-900">{tender?.estimated_value_display || 'As per NIT'}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">EMD Amount</span>
            <span className="font-bold text-slate-900">{tender?.emd_display || 'Exempted / Unspecified'}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Readiness Score</span>
            <span className="font-bold text-blue-600">{score}%</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Opportunity Score</span>
            <span className="font-bold text-emerald-600">
              {tender?.opportunity_score ? `${tender.opportunity_score.toFixed(0)}/100` : 'Pending'}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Contract Duration</span>
            <span className="font-bold text-slate-900">{tender?.contract_duration || 'As per schedule'}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Pages Extracted</span>
            <span className="font-bold text-slate-900">{tender?.page_count || 0} Pages</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 bg-white rounded-t-xl px-2 shadow-sm overflow-x-auto">
        <div className="flex space-x-1 min-w-max">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Panels */}
      <div className="space-y-6">
        {activeTab === 'analysis' && analysis && tender && (
          <TenderAnalysisTab
            analysis={analysis}
            tender={tender}
            onRecalculate={handleRecalculate}
            recalculating={recalculating}
          />
        )}
        {activeTab === 'requirements' && (
          <TenderRequirementsTab
            tenderId={id!}
            onNavigateToPage={handleNavigateToPage}
          />
        )}
        {activeTab === 'documents' && (
          <TenderDocumentsTab
            tenderId={id!}
            onNavigateToPage={handleNavigateToPage}
          />
        )}
        {activeTab === 'cost_profit' && (
          <TenderCostProfitTab tenderId={id!} />
        )}
        {activeTab === 'resources' && (
          <TenderResourcesTab tenderId={id!} />
        )}
        {activeTab === 'risks' && (
          <TenderRisksTab
            tenderId={id!}
            onNavigateToPage={handleNavigateToPage}
          />
        )}
        {activeTab === 'deadlines' && (
          <TenderDeadlinesTab tenderId={id!} />
        )}
        {activeTab === 'pdf' && tender && (
          <TenderPdfTab
            tenderId={id!}
            currentPage={pdfTargetPage}
            fileName={tender.file_name || tender.title}
          />
        )}
      </div>
    </div>
  );
};
