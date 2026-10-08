import React from 'react';
import { CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react';

interface RecommendationBadgeProps {
  recommendation: 'SUITABLE TO APPLY' | 'APPLY WITH CAUTION' | 'NOT RECOMMENDED' | string;
  size?: 'sm' | 'md' | 'lg';
}

export const RecommendationBadge: React.FC<RecommendationBadgeProps> = ({ recommendation, size = 'md' }) => {
  const norm = recommendation?.toUpperCase() || '';

  if (norm.includes('SUITABLE')) {
    return (
      <span className={`inline-flex items-center gap-1.5 font-semibold rounded-md bg-emerald-600 text-white shadow-sm ${
        size === 'lg' ? 'px-4 py-2 text-sm tracking-wide' : size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'
      }`}>
        <CheckCircle className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
        SUITABLE TO APPLY
      </span>
    );
  }

  if (norm.includes('CAUTION')) {
    return (
      <span className={`inline-flex items-center gap-1.5 font-semibold rounded-md bg-amber-600 text-white shadow-sm ${
        size === 'lg' ? 'px-4 py-2 text-sm tracking-wide' : size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'
      }`}>
        <AlertTriangle className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
        APPLY WITH CAUTION
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-md bg-red-600 text-white shadow-sm ${
      size === 'lg' ? 'px-4 py-2 text-sm tracking-wide' : size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'
    }`}>
      <AlertOctagon className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      NOT RECOMMENDED
    </span>
  );
};
