import React from 'react';
import { CheckCircle2, AlertCircle, XCircle, HelpCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'PASS' | 'PARTIAL' | 'FAIL' | 'UNKNOWN' | 'READY' | 'MISSING' | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = status?.toUpperCase() || 'UNKNOWN';

  if (norm === 'PASS' || norm === 'READY' || norm === 'SUITABLE') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200 ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}>
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        {norm === 'PASS' ? 'PASS' : norm === 'READY' ? 'READY' : 'SUITABLE'}
      </span>
    );
  }

  if (norm === 'PARTIAL' || norm === 'CAUTION' || norm === 'WARNING') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded-md border bg-amber-50 text-amber-800 border-amber-200 ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}>
        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        {norm}
      </span>
    );
  }

  if (norm === 'FAIL' || norm === 'MISSING' || norm === 'HIGH' || norm === 'NOT RECOMMENDED') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded-md border bg-red-50 text-red-700 border-red-200 ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}>
        <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
        {norm}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-md border bg-slate-100 text-slate-700 border-slate-200 ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}>
      <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
      {norm}
    </span>
  );
};
