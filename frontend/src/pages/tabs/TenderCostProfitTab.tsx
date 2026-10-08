import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { CostEstimate, ProfitScenario } from '../../types';
import { DollarSign, TrendingUp, ShieldAlert, Sparkles, Loader2, Info } from 'lucide-react';

interface TenderCostProfitTabProps {
  tenderId: string;
}

export const TenderCostProfitTab: React.FC<TenderCostProfitTabProps> = ({ tenderId }) => {
  const [cost, setCost] = useState<CostEstimate | null>(null);
  const [profit, setProfit] = useState<ProfitScenario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [tenderId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [costData, profitData] = await Promise.all([
        api.getTenderCost(tenderId),
        api.getTenderProfit(tenderId),
      ]);
      setCost(costData);
      setProfit(profitData);
    } catch (err) {
      console.error('Failed to load cost/profit data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-xs">
      {/* Three Profit Scenarios Hero */}
      {profit && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Optimistic */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="font-bold uppercase tracking-wider text-[10px]">Optimistic Scenario</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                {profit.optimistic_margin}% Margin
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              ₹{(profit.optimistic_profit / 100000).toFixed(2)} Lakhs
            </p>
            <p className="text-[11px] text-slate-400">7% procurement savings, minimal rework</p>
          </div>

          {/* Expected Baseline */}
          <div className="bg-blue-50/60 p-5 rounded-xl border border-blue-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-blue-800">
              <span className="font-bold uppercase tracking-wider text-[10px]">Expected Baseline</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
                {profit.expected_margin}% Margin
              </span>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              ₹{(profit.expected_profit / 100000).toFixed(2)} Lakhs
            </p>
            <p className="text-[11px] text-blue-700">Deterministic procurement benchmark</p>
          </div>

          {/* Pessimistic */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="font-bold uppercase tracking-wider text-[10px]">Pessimistic Scenario</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700">
                {profit.pessimistic_margin}% Margin
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              ₹{(profit.pessimistic_profit / 100000).toFixed(2)} Lakhs
            </p>
            <p className="text-[11px] text-slate-400">8% cost overrun buffer + financing cost</p>
          </div>
        </div>
      )}

      {/* Itemized Cost Breakdown Table */}
      {cost && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold uppercase tracking-wider text-slate-700 text-[11px]">
              Itemized Cost Estimation Schedule
            </span>
            <span className="text-[11px] font-semibold text-slate-500">
              Total Execution Cost: ₹{(cost.total_estimated_cost / 100000).toFixed(2)} Lakhs
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            <div className="p-3.5 flex justify-between items-center hover:bg-slate-50">
              <span className="font-medium text-slate-700">Labour & Engineering Manpower</span>
              <span className="font-bold text-slate-900">₹{(cost.labour_cost / 100000).toFixed(2)} Lakhs</span>
            </div>
            <div className="p-3.5 flex justify-between items-center hover:bg-slate-50">
              <span className="font-medium text-slate-700">Materials & Consumables</span>
              <span className="font-bold text-slate-900">₹{(cost.materials_cost / 100000).toFixed(2)} Lakhs</span>
            </div>
            <div className="p-3.5 flex justify-between items-center hover:bg-slate-50">
              <span className="font-medium text-slate-700">Machinery & Equipment Rental</span>
              <span className="font-bold text-slate-900">₹{(cost.equipment_cost / 100000).toFixed(2)} Lakhs</span>
            </div>
            <div className="p-3.5 flex justify-between items-center hover:bg-slate-50">
              <span className="font-medium text-slate-700">Software, Licenses & Cloud Tech</span>
              <span className="font-bold text-slate-900">₹{(cost.software_tech_cost / 100000).toFixed(2)} Lakhs</span>
            </div>
            <div className="p-3.5 flex justify-between items-center hover:bg-slate-50">
              <span className="font-medium text-slate-700">Site Travel & Logistics</span>
              <span className="font-bold text-slate-900">₹{(cost.travel_cost / 100000).toFixed(2)} Lakhs</span>
            </div>
            <div className="p-3.5 flex justify-between items-center hover:bg-slate-50">
              <span className="font-medium text-slate-700">Subcontracting & Specialised Packages</span>
              <span className="font-bold text-slate-900">₹{(cost.subcontracting_cost / 100000).toFixed(2)} Lakhs</span>
            </div>
            <div className="p-3.5 flex justify-between items-center hover:bg-slate-50">
              <span className="font-medium text-slate-700">Overhead, Insurance & Compliance</span>
              <span className="font-bold text-slate-900">₹{(cost.overhead_admin_cost / 100000).toFixed(2)} Lakhs</span>
            </div>
            <div className="p-3.5 flex justify-between items-center hover:bg-slate-50 bg-amber-50/40">
              <span className="font-medium text-amber-800">Unforeseen Contingency Reserve</span>
              <span className="font-bold text-amber-900">₹{(cost.contingency_cost / 100000).toFixed(2)} Lakhs</span>
            </div>
          </div>
        </div>
      )}

      {/* Assumptions & Integrity Notice */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-600 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
          <Info className="w-3.5 h-3.5 text-blue-600" />
          <span>Cost Estimation Methodology</span>
        </div>
        <p className="text-[11px]">
          Estimated values are derived deterministically based on standard CPWD and GeM schedule of rates.
          Values are provided for decision prioritization and do not replace final vendor quote lockups.
        </p>
      </div>
    </div>
  );
};
