import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Tender, SimulationResult } from '../types';
import { useToast } from '../context/ToastContext';
import { Sliders, TrendingUp, Sparkles, RefreshCw, Loader2, ArrowRight, UploadCloud } from 'lucide-react';

export const SimulatorPage: React.FC = () => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [selectedTenderId, setSelectedTenderId] = useState<string>('');
  const [engineers, setEngineers] = useState<number>(6);
  const [turnover, setTurnover] = useState<number>(5.0);
  const [workingCapital, setWorkingCapital] = useState<number>(1.5);
  const [completedProjects, setCompletedProjects] = useState<number>(3);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const tenderList = await api.getTenders();
      const completed = tenderList.filter((t) => t.status === 'completed');
      setTenders(completed);

      const comp = await api.getCompanyProfile();
      if (comp) {
        setEngineers(comp.engineers_count || 6);
        setTurnover(comp.average_turnover || comp.annual_turnover || 5.0);
        setWorkingCapital(comp.working_capital ? comp.working_capital / 10000000 : 1.5);
        setCompletedProjects(comp.completed_projects_count || 3);
      }

      if (completed.length > 0) {
        setSelectedTenderId(completed[0].id);
        triggerSimulation(completed[0].id, comp?.engineers_count || 6, comp?.average_turnover || 5.0);
      }
    } catch (err: any) {
      error('Failed to load simulator data', err.message);
    }
  };

  const triggerSimulation = async (tenderId?: string, eng?: number, to?: number) => {
    try {
      setIsLoading(true);
      const res = await api.runSimulation({
        tender_id: tenderId || selectedTenderId,
        engineers_count: eng !== undefined ? eng : engineers,
        turnover: to !== undefined ? to : turnover,
        working_capital: workingCapital * 10000000,
        completed_projects: completedProjects,
      });
      setSimulationResult(res);
    } catch (err: any) {
      error('Simulation failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRun = () => {
    triggerSimulation();
    success('Scenario recalculated', 'What-If simulation evaluated successfully.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">What-If Commercial & Capacity Simulator</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simulate company capability expansions (e.g. +3 engineers, higher working capital, increased turnover) without modifying your production company profile.
          </p>
        </div>

        {tenders.length > 0 && (
          <div className="flex items-center gap-3">
            <select
              value={selectedTenderId}
              onChange={(e) => {
                setSelectedTenderId(e.target.value);
                triggerSimulation(e.target.value);
              }}
              className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {tenders.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title.substring(0, 50)}...
                </option>
              ))}
            </select>

            <button
              onClick={handleRun}
              disabled={isLoading}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span>Recalculate Scenario</span>
            </button>
          </div>
        )}
      </div>

      {tenders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <Sliders className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No analyzed tenders available for simulation</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4 max-w-md mx-auto">
            The What-If Simulator tests hypothetical capability expansions (e.g. +5 engineers, higher turnover) against candidate tenders in your pipeline. Upload a tender document first to begin.
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


      {/* Highest Impact Alert Banner */}
      {simulationResult && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Highest-Impact Improvement Identified</h3>
            <p className="text-sm font-medium text-blue-800 mt-0.5">{simulationResult.highest_impact_improvement}</p>
          </div>
        </div>
      )}

      {/* Controls and Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scenario Levers */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">Simulated Capability Levers</h2>

          {/* Engineers */}
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-2">
              <span>Technical Engineers ({engineers} active)</span>
              <span className="font-bold text-blue-600">{engineers} Staff</span>
            </div>
            <input
              type="range"
              min="2"
              max="25"
              step="1"
              value={engineers}
              onChange={(e) => setEngineers(parseInt(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>2</span>
              <span>12</span>
              <span>25</span>
            </div>
          </div>

          {/* Turnover */}
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-2">
              <span>Annual Financial Turnover (₹ Cr)</span>
              <span className="font-bold text-blue-600">₹{turnover.toFixed(1)} Cr</span>
            </div>
            <input
              type="range"
              min="1"
              max="40"
              step="0.5"
              value={turnover}
              onChange={(e) => setTurnover(parseFloat(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>₹1 Cr</span>
              <span>₹20 Cr</span>
              <span>₹40 Cr</span>
            </div>
          </div>

          {/* Working Capital */}
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-2">
              <span>Liquid Working Capital (₹ Cr)</span>
              <span className="font-bold text-blue-600">₹{workingCapital.toFixed(1)} Cr</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="15"
              step="0.5"
              value={workingCapital}
              onChange={(e) => setWorkingCapital(parseFloat(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>₹0.5 Cr</span>
              <span>₹7.5 Cr</span>
              <span>₹15 Cr</span>
            </div>
          </div>

          {/* Completed Projects */}
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-2">
              <span>Completed Similar Projects ({completedProjects})</span>
              <span className="font-bold text-blue-600">{completedProjects} Works</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={completedProjects}
              onChange={(e) => setCompletedProjects(parseInt(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0</span>
              <span>10</span>
              <span>20</span>
            </div>
          </div>
        </div>

        {/* Comparison Cards: Current vs Scenario vs Diff */}
        <div className="lg:col-span-7 space-y-4">
          {simulationResult && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Current */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current Profile</span>
                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-[11px] text-slate-500">Readiness Score</p>
                    <p className="text-2xl font-bold text-slate-800">{simulationResult.current.readiness_score}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">Opportunity Score</p>
                    <p className="text-xl font-bold text-slate-800">{simulationResult.current.opportunity_score.toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">Resource Gap</p>
                    <p className="text-sm font-semibold text-rose-600">{simulationResult.current.resource_gap} Engineers</p>
                  </div>
                </div>
              </div>

              {/* Scenario */}
              <div className="bg-blue-50/70 p-5 rounded-xl border border-blue-200 shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Simulated Scenario</span>
                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-[11px] text-blue-600">Readiness Score</p>
                    <p className="text-2xl font-bold text-blue-900">{simulationResult.scenario.readiness_score}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-blue-600">Opportunity Score</p>
                    <p className="text-xl font-bold text-blue-900">{simulationResult.scenario.opportunity_score.toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-blue-600">Resource Gap</p>
                    <p className="text-sm font-semibold text-emerald-700">{simulationResult.scenario.resource_gap} Engineers</p>
                  </div>
                </div>
              </div>

              {/* Difference Delta */}
              <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-200 shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Projected Delta</span>
                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-[11px] text-slate-500">Readiness Lift</p>
                    <p className="text-2xl font-bold text-emerald-700">{simulationResult.differences.readiness_change}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">Opportunity Lift</p>
                    <p className="text-xl font-bold text-emerald-700">{simulationResult.differences.opportunity_change}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">Capacity Deficit</p>
                    <p className="text-sm font-semibold text-slate-800">{simulationResult.differences.resource_gap_change} Engineers</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Details & Recommendation Card */}
          {simulationResult && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Simulated Recommendation for {simulationResult.tender_title}
              </h3>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="p-3 bg-blue-100 rounded-lg text-blue-700">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500">Commercial Verdict</span>
                  <p className="text-base font-bold text-slate-900">{simulationResult.scenario.opportunity_verdict}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Expected project margin remains stable at {simulationResult.scenario.expected_margin}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
};
