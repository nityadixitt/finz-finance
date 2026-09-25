import React from 'react';
import {
  TrendingUp,
  FileSpreadsheet,
  Download,
  Info,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { PnLSummaryResponse } from '../types';
import { formatCurrency } from '../utils/formatters';

interface PnLViewProps {
  pnlData: PnLSummaryResponse | null;
  onNavigateTab: (tab: 'variance' | 'transactions') => void;
}

export const PnLView: React.FC<PnLViewProps> = ({ pnlData, onNavigateTab }) => {
  if (!pnlData || pnlData.statements.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-[#0c1220] border border-slate-800">
        <FileSpreadsheet className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">No Financial Data Available</h3>
        <p className="text-xs text-slate-400 mt-1">
          Upload a bank statement CSV or load the demo dataset to view the monthly P&L.
        </p>
      </div>
    );
  }

  const { statements, totals } = pnlData;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight">Monthly Profit &amp; Loss</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Income statement from verified transaction records
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigateTab('variance')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-all"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Analyze Month-over-Month Variances →</span>
          </button>
        </div>
      </div>

      {/* Financial Statement Table */}
      <div className="rounded-2xl bg-[#0c1220] border border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Multi-Month Income Statement</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Currency: USD ($)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3.5 px-5 font-sans">Line Item</th>
                {statements.map((s) => (
                  <th key={s.month} className="py-3.5 px-5 text-right font-sans">
                    {s.monthName}
                  </th>
                ))}
                <th className="py-3.5 px-5 text-right font-sans text-emerald-400 bg-slate-900/60">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {/* 1. REVENUE */}
              <tr className="bg-slate-900/20 hover:bg-slate-900/40 transition-colors">
                <td className="py-3.5 px-5 font-bold font-sans text-slate-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Revenue (Gross Inflows)</span>
                </td>
                {statements.map((s) => (
                  <td key={s.month} className="py-3.5 px-5 text-right font-bold text-emerald-400">
                    {formatCurrency(s.revenue)}
                  </td>
                ))}
                <td className="py-3.5 px-5 text-right font-bold text-emerald-400 bg-slate-900/40">
                  {formatCurrency(totals.totalRevenue)}
                </td>
              </tr>

              {/* 2. COGS */}
              <tr className="hover:bg-slate-900/30 transition-colors">
                <td className="py-3 px-5 text-slate-300 font-sans pl-8">
                  Cost of Goods Sold (COGS)
                </td>
                {statements.map((s) => (
                  <td key={s.month} className="py-3 px-5 text-right text-rose-400">
                    -{formatCurrency(s.cogs)}
                  </td>
                ))}
                <td className="py-3 px-5 text-right text-rose-400 bg-slate-900/40">
                  -{formatCurrency(totals.totalCogs)}
                </td>
              </tr>

              {/* 3. GROSS PROFIT */}
              <tr className="bg-slate-900/40 border-y border-slate-700/80 font-bold">
                <td className="py-3.5 px-5 font-sans text-white">
                  Gross Profit
                </td>
                {statements.map((s) => (
                  <td key={s.month} className="py-3.5 px-5 text-right text-white">
                    {formatCurrency(s.grossProfit)}
                  </td>
                ))}
                <td className="py-3.5 px-5 text-right text-white bg-slate-900/60">
                  {formatCurrency(totals.totalGrossProfit)}
                </td>
              </tr>

              {/* Gross Margin % */}
              <tr className="text-[11px] text-slate-400 bg-slate-950/30">
                <td className="py-2 px-5 font-sans pl-8 italic">
                  Gross Margin %
                </td>
                {statements.map((s) => (
                  <td key={s.month} className="py-2 px-5 text-right text-cyan-400">
                    {s.grossMarginPct}%
                  </td>
                ))}
                <td className="py-2 px-5 text-right text-cyan-400 bg-slate-900/40">
                  {totals.totalRevenue > 0
                    ? ((totals.totalGrossProfit / totals.totalRevenue) * 100).toFixed(1)
                    : 0}
                  %
                </td>
              </tr>

              {/* Header: Operating Expenses */}
              <tr className="bg-slate-900/10 text-[11px] font-sans font-semibold text-slate-400">
                <td colSpan={statements.length + 2} className="py-2 px-5 uppercase tracking-wider text-[10px]">
                  Operating Expenses
                </td>
              </tr>

              {/* 4. PAYROLL */}
              <tr className="hover:bg-slate-900/30 transition-colors">
                <td className="py-3 px-5 text-slate-300 font-sans pl-8">
                  Payroll & Staff Wages
                </td>
                {statements.map((s) => (
                  <td key={s.month} className="py-3 px-5 text-right text-rose-300">
                    -{formatCurrency(s.payroll)}
                  </td>
                ))}
                <td className="py-3 px-5 text-right text-rose-300 bg-slate-900/40">
                  -{formatCurrency(totals.totalPayroll)}
                </td>
              </tr>

              {/* 5. OPERATING EXPENSES */}
              <tr className="hover:bg-slate-900/30 transition-colors">
                <td className="py-3 px-5 text-slate-300 font-sans pl-8">
                  Operating Expenses (SaaS, Rent, Ads)
                </td>
                {statements.map((s) => (
                  <td key={s.month} className="py-3 px-5 text-right text-rose-300">
                    -{formatCurrency(s.operatingExpenses)}
                  </td>
                ))}
                <td className="py-3 px-5 text-right text-rose-300 bg-slate-900/40">
                  -{formatCurrency(totals.totalOperatingExpenses)}
                </td>
              </tr>

              {/* Total OpEx */}
              <tr className="text-slate-400 bg-slate-950/40">
                <td className="py-2.5 px-5 font-sans pl-8 font-semibold">
                  Total Operating Expenses
                </td>
                {statements.map((s) => (
                  <td key={s.month} className="py-2.5 px-5 text-right text-rose-400">
                    -{formatCurrency(s.totalOperatingExpenses)}
                  </td>
                ))}
                <td className="py-2.5 px-5 text-right text-rose-400 bg-slate-900/40">
                  -{formatCurrency(totals.totalPayroll + totals.totalOperatingExpenses)}
                </td>
              </tr>

              {/* 6. OPERATING PROFIT */}
              <tr className="bg-emerald-950/20 border-t-2 border-emerald-500/40 font-bold text-sm">
                <td className="py-4 px-5 font-sans text-emerald-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Operating Profit</span>
                </td>
                {statements.map((s) => (
                  <td
                    key={s.month}
                    className={`py-4 px-5 text-right ${
                      s.operatingProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {formatCurrency(s.operatingProfit)}
                  </td>
                ))}
                <td
                  className={`py-4 px-5 text-right bg-slate-900/60 ${
                    totals.totalOperatingProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatCurrency(totals.totalOperatingProfit)}
                </td>
              </tr>

              {/* Operating Margin % */}
              <tr className="text-[11px] text-slate-400 bg-slate-950/40">
                <td className="py-2 px-5 font-sans pl-8 italic">
                  Operating Margin %
                </td>
                {statements.map((s) => (
                  <td key={s.month} className="py-2 px-5 text-right text-cyan-400 font-bold">
                    {s.operatingMarginPct}%
                  </td>
                ))}
                <td className="py-2 px-5 text-right text-cyan-400 font-bold bg-slate-900/40">
                  {totals.totalRevenue > 0
                    ? ((totals.totalOperatingProfit / totals.totalRevenue) * 100).toFixed(1)
                    : 0}
                  %
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Note on Deterministic Math */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-200">Audit Guarantee:</strong> Every figure in this table is computed strictly via backend SQL arithmetic (<code className="text-emerald-400 font-mono">SUM(amount)</code> where <code className="text-emerald-400 font-mono">included_in_pnl = true</code>). Non-operating balance sheet movements (such as internal transfers or tax prepayments) are excluded from operating totals.
        </p>
      </div>
    </div>
  );
};
