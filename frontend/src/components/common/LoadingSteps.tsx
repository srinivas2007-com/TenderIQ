import React from 'react';
import { Check, Loader2 } from 'lucide-react';

interface LoadingStepsProps {
  currentStep: number; // 1 to 5
  status: string;
  errorMessage?: string;
}

export const LoadingSteps: React.FC<LoadingStepsProps> = ({ currentStep, status, errorMessage }) => {
  const steps = [
    { num: 1, title: 'Document uploaded', desc: 'PDF stored securely' },
    { num: 2, title: 'Text extracted', desc: 'PyMuPDF page-by-page parsing' },
    { num: 3, title: 'Requirements identified', desc: 'AI/NLP qualification & risk extraction' },
    { num: 4, title: 'Comparing company profile', desc: 'Evaluating against company credentials' },
    { num: 5, title: 'Generating recommendation', desc: 'Calculating Bid Readiness Score' },
  ];

  const isFailed = status === 'failed';

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-xl mx-auto shadow-sm">
      <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 text-base">Tender Analysis In Progress</h3>
          <p className="text-xs text-slate-500 mt-0.5">Please wait while BidReady AI processes the tender clauses</p>
        </div>
        {!isFailed && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 bg-brand-50 px-2.5 py-1 rounded">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Step {Math.min(currentStep, 5)} of 5
          </span>
        )}
      </div>

      <div className="space-y-4">
        {steps.map((step) => {
          const isDone = currentStep > step.num || status === 'completed';
          const isCurrent = currentStep === step.num && status !== 'completed' && !isFailed;
          const isPending = currentStep < step.num;
          const isErrorStep = isFailed && currentStep === step.num;

          return (
            <div key={step.num} className="flex items-start gap-3.5">
              <div className="shrink-0 mt-0.5">
                {isDone ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : isCurrent ? (
                  <div className="w-6 h-6 rounded-full border-2 border-brand-600 flex items-center justify-center bg-brand-50 text-brand-700">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  </div>
                ) : isErrorStep ? (
                  <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold">
                    !
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-xs text-slate-400 font-medium">
                    {step.num}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${isDone ? 'text-slate-900' : isCurrent ? 'text-brand-700 font-semibold' : isErrorStep ? 'text-red-700 font-semibold' : 'text-slate-400'}`}>
                    {step.title}
                  </span>
                  <span className="text-xs text-slate-400">
                    {isDone ? 'Completed' : isCurrent ? 'Processing...' : isErrorStep ? 'Failed' : 'Pending'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {isFailed && errorMessage && (
        <div className="mt-6 p-3.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-800">
          <p className="font-semibold mb-1">Analysis Error</p>
          <p>{errorMessage}</p>
        </div>
      )}
    </div>
  );
};
