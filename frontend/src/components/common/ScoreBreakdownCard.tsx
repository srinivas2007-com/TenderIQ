import React from 'react';
import { TenderAnalysis } from '../../types';
import { RecommendationBadge } from './RecommendationBadge';
import { ShieldCheck, Award, Briefcase, DollarSign, FileCheck } from 'lucide-react';

interface ScoreBreakdownCardProps {
  analysis: TenderAnalysis;
}

export const ScoreBreakdownCard: React.FC<ScoreBreakdownCardProps> = ({ analysis }) => {
  const categories = [
    {
      title: 'Eligibility Criteria',
      weight: '40%',
      earned: analysis.eligibility_score,
      max: 40,
      icon: ShieldCheck,
      color: 'bg-blue-600',
    },
    {
      title: 'Technical Capability',
      weight: '20%',
      earned: analysis.technical_score,
      max: 20,
      icon: Award,
      color: 'bg-emerald-600',
    },
    {
      title: 'Operating Experience',
      weight: '15%',
      earned: analysis.experience_score,
      max: 15,
      icon: Briefcase,
      color: 'bg-indigo-600',
    },
    {
      title: 'Financial Capability',
      weight: '15%',
      earned: analysis.financial_score,
      max: 15,
      icon: DollarSign,
      color: 'bg-amber-600',
    },
    {
      title: 'Required Documentation',
      weight: '10%',
      earned: analysis.documents_score,
      max: 10,
      icon: FileCheck,
      color: 'bg-slate-700',
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">Readiness Assessment</span>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
              {analysis.readiness_score}
            </span>
            <span className="text-base text-slate-400 font-medium">/ 100</span>
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1 font-medium">Recommendation</div>
          <RecommendationBadge recommendation={analysis.recommendation} size="lg" />
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Transparent Scoring Breakdown
        </div>

        {categories.map((cat, idx) => {
          const Icon = cat.icon;
          const pct = Math.min(100, Math.round((cat.earned / cat.max) * 100));

          return (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                  {cat.title}
                  <span className="text-slate-400 font-normal">({cat.weight})</span>
                </span>
                <span className="font-semibold text-slate-900">
                  {cat.earned} <span className="text-slate-400 font-normal">/ {cat.max}</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${cat.color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Scoring model: 92+ Suitable | 70-91 Caution | &lt;70 Not Recommended</span>
        <span className="font-semibold text-slate-700">Total: {analysis.readiness_score}/100</span>
      </div>
    </div>
  );
};
