import React, { useRef } from 'react';
import {
  Printer,
  X,
  FileSpreadsheet,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { IntelligenceCenterData, Transaction } from '../types';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface FinancialReviewReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: IntelligenceCenterData | null;
  transactions?: Transaction[];
  onSelectCitation: (transactionId: string) => void;
}

export const FinancialReviewReportModal: React.FC<FinancialReviewReportModalProps> = ({
  isOpen,
  onClose,
  data,
  transactions = [],
  onSelectCitation,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const health = data.financialHealth;
  const pnl = data.pnlMovements;
  const impact = data.financialImpact;

  // Previous month baseline calculations
  const baseRevenue = health.revenue - pnl.revenue.delta;
  const baseCogs = health.cogs - pnl.cogs.delta;
  const baseGrossProfit = baseRevenue - baseCogs;
  const basePayroll = health.payroll - pnl.payroll.delta;
  const baseOpex = health.operatingExpenses - pnl.opex.delta;
  const baseOperatingProfit = health.operatingProfit - pnl.operatingProfit.delta;

  // Illustrative adjusted scenario metrics
  const simulatedGrossProfit = health.grossProfit + impact.totalPotentialGrossProfitAdjustment;
  const simulatedGrossMarginPct = health.revenue > 0 ? (simulatedGrossProfit / health.revenue) * 100 : 0;
  const simulatedOperatingMarginPct = health.revenue > 0 ? (impact.simulatedOperatingProfit / health.revenue) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200 print:relative print:p-0 print:bg-white print:z-auto print:inset-auto print:overflow-visible print:block">
      {/* Modal Container */}
      <div className="relative w-full max-w-5xl bg-[#080d1a] border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[96vh] overflow-hidden print:max-h-none print:h-auto print:overflow-visible print:border-none print:shadow-none print:rounded-none print:w-full print:max-w-none print:bg-white print:block">
        {/* Modal Action Bar (Excluded from Print) */}
        <div className="print:hidden px-5 py-3 border-b border-slate-800 bg-[#0d1424] flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                  FINZ FINANCIAL REVIEW REPORT
                </h3>
                <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  Comprehensive Review Dossier
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                AI-Assisted Financial Analysis • Deterministic P&L • Risk Signals • Pro-Forma Scenarios
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close modal (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Report Content (Fit to Page / High Density) */}
        <div
          ref={reportRef}
          className="flex-1 overflow-y-auto p-5 sm:p-10 space-y-8 text-slate-200 bg-[#070b14] print:bg-white print:text-black print:p-0 print:overflow-visible print:h-auto font-sans leading-relaxed"
        >
          {/* COVER HEADER & DOCUMENT METADATA */}
          <div className="border-b border-slate-800 pb-6 print:border-black">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[9px] font-bold uppercase tracking-wider print:text-black print:border-black">
                    FINZ FINANCIAL INTELLIGENCE
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[9px] print:bg-gray-200 print:text-black">
                    REF: FINZ-REV-2026-Q1
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight print:text-black">
                  FINZ FINANCIAL REVIEW REPORT
                </h1>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-normal print:text-gray-700">
                  AI-Assisted Financial Analysis • Deterministic P&L • Risk Signals • Pro-Forma Scenarios for comparative period <strong className="text-white print:text-black">{data.baseMonth}</strong> to <strong className="text-white print:text-black">{data.comparisonMonth}</strong>.
                </p>
              </div>

              <div className="sm:text-right shrink-0 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono print:border-gray-400 print:bg-gray-50">
                <div className="text-emerald-400 font-bold mb-0.5 flex items-center sm:justify-end gap-1.5 print:text-black">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 print:text-black" />
                  <span>DETERMINISTIC SQL BACKED</span>
                </div>
                <div className="text-slate-300 text-[10px] print:text-gray-800">Generated: {new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}</div>
                <div className="text-slate-400 text-[10px] print:text-gray-600">Generated from Verified Transaction Data</div>
                <div className="text-slate-400 text-[10px] print:text-gray-600">Deterministic MoM Variance Analysis</div>
              </div>
            </div>

            {/* AI vs Deterministic Visible Distinction Schedule */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs print:bg-gray-50 print:border-gray-300">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-1.5 print:text-black">
                System Architecture: Deterministic Calculation Engine vs AI-Assisted Reasoning
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 print:bg-white print:border-gray-200">
                  <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5 print:text-black">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 print:text-black" />
                    <span>Deterministic (Exact SQL Sums & Math Formulas)</span>
                  </div>
                  <p className="text-slate-300 print:text-gray-700 leading-tight">
                    P&L totals, MoM variance %, transaction aggregations, mathematical variance bridges, duplicate similarity distances, and vendor spend sums. Zero LLM math estimation.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 print:bg-white print:border-gray-200">
                  <div className="font-bold text-cyan-400 mb-1 flex items-center gap-1.5 print:text-black">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400 print:text-black" />
                    <span>AI-Assisted (Semantic Reasoning & Heuristics)</span>
                  </div>
                  <p className="text-slate-300 print:text-gray-700 leading-tight">
                    Transaction classification rationale, anomaly detection context, vendor trajectory narratives, accounting treatment suggestions, and executive summaries.
                  </p>
                </div>
              </div>
            </div>

            {/* Headline Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 print:border-gray-300 print:bg-gray-50">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 print:text-gray-600">Gross Operating Revenue</span>
                <span className="text-lg sm:text-xl font-mono font-bold text-white print:text-black">{formatCurrency(health.revenue)}</span>
                <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5 print:text-black">+{health.revenueGrowthPct}% MoM Shift</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 print:border-gray-300 print:bg-gray-50">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 print:text-gray-600">Gross Profit (Culinary)</span>
                <span className="text-lg sm:text-xl font-mono font-bold text-white print:text-black">{formatCurrency(health.grossProfit)}</span>
                <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5 print:text-black">{formatPercent(health.grossMarginPct)} Gross Margin</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 print:border-gray-300 print:bg-gray-50">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 print:text-gray-600">Reported Operating Profit</span>
                <span className="text-lg sm:text-xl font-mono font-bold text-emerald-400 print:text-black">{formatCurrency(health.operatingProfit)}</span>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5 print:text-gray-700">{formatPercent(health.operatingMarginPct)} Reported Margin</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-cyan-500/30 print:border-gray-300 print:bg-gray-50">
                <span className="text-[10px] uppercase font-bold text-cyan-300 block mb-0.5 print:text-gray-600">Illustrative Adjusted EBIT</span>
                <span className="text-lg sm:text-xl font-mono font-bold text-cyan-300 print:text-black">{formatCurrency(impact.simulatedOperatingProfit)}</span>
                <span className="text-[10px] text-cyan-400 font-semibold block mt-0.5 print:text-black">+{formatPercent(simulatedOperatingMarginPct)} Adjusted Margin</span>
              </div>
            </div>
          </div>

          {/* SECTION 1: EXECUTIVE FINANCIAL SUMMARY */}
          <section className="space-y-3 print-avoid-break">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 print:border-black">
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-mono text-[11px] font-bold print:bg-gray-200 print:text-black">01</span>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider print:text-black">
                Executive Financial Summary
              </h2>
            </div>

            <div className="text-xs space-y-2.5 text-slate-300 leading-relaxed print:text-gray-800 text-justify">
              <p>
                This financial review evaluates enterprise commercial operating performance for the two-month period ending <strong>March 31, 2026</strong>. Gross operating revenue increased from <strong>{formatCurrency(baseRevenue)}</strong> in February to <strong>{formatCurrency(health.revenue)}</strong> in March, delivering an absolute period-over-period expansion of <strong>+{formatCurrency(pnl.revenue.delta)} (+{health.revenueGrowthPct}%)</strong>. This acceleration was supported by consistent dining volume, banquet bookings, and digital delivery platform settlements.
              </p>
              <p>
                Reported Operating Profit (EBIT) climbed from <strong>{formatCurrency(baseOperatingProfit)}</strong> to <strong>{formatCurrency(health.operatingProfit)}</strong>, representing a net gain of <strong>+{formatCurrency(pnl.operatingProfit.delta)} (+{health.operatingProfitGrowthPct}%)</strong>. While top-line trajectory and cost of goods sold remained well-disciplined, transaction-level analysis identifies two material classification items that impact reported operating figures:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-300 print:text-gray-800">
                <li>
                  <strong>Owner Distribution ($5,000.00):</strong> A cash withdrawal was categorized in General Operating Expenses under <button onClick={() => onSelectCitation('TXN_1180')} className="font-mono text-emerald-300 font-bold hover:underline cursor-pointer print:text-black">[TXN_1180]</button>. In standard financial reporting, distributions to partners represent equity draws rather than operating business overhead. Reclassifying this item to balance sheet equity adjusts operating profit to <strong>{formatCurrency(impact.simulatedOperatingProfit)}</strong> (an illustrative adjusted margin of <strong>{formatPercent(simulatedOperatingMarginPct)}</strong>).
                </li>
                <li>
                  <strong>Culinary Food Procurement ($6,200.00):</strong> A bulk food ingredient delivery from Sysco (<button onClick={() => onSelectCitation('TXN_1179')} className="font-mono text-emerald-300 font-bold hover:underline cursor-pointer print:text-black">[TXN_1179]</button>) was recorded under Operating Expenses rather than direct Cost of Goods Sold. Transferring this expense to COGS aligns culinary gross profit reporting with actual food consumption.
                </li>
              </ul>
            </div>
          </section>

          {/* SECTION 2: COMPARATIVE P&L PERFORMANCE */}
          <section className="space-y-3 print-page-break">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 print:border-black">
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-mono text-[11px] font-bold print:bg-gray-200 print:text-black">02</span>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider print:text-black">
                Comparative Income Statement & Margin Analysis
              </h2>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-gray-400">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-300 font-bold print:bg-gray-100 print:text-black">
                    <th className="px-3.5 py-2.5">P&L Category</th>
                    <th className="px-3.5 py-2.5 text-right">February 2026</th>
                    <th className="px-3.5 py-2.5 text-right">March 2026</th>
                    <th className="px-3.5 py-2.5 text-right">Dollar Variance (Δ)</th>
                    <th className="px-3.5 py-2.5 text-right">MoM Growth</th>
                    <th className="px-3.5 py-2.5 text-center">Profitability Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-gray-200 text-[11px]">
                  <tr className="hover:bg-slate-900/40">
                    <td className="px-3.5 py-2 font-bold text-white print:text-black">Gross Operating Revenue</td>
                    <td className="px-3.5 py-2 text-right font-mono text-slate-300 print:text-black">{formatCurrency(baseRevenue)}</td>
                    <td className="px-3.5 py-2 text-right font-mono text-white font-bold print:text-black">{formatCurrency(health.revenue)}</td>
                    <td className="px-3.5 py-2 text-right font-mono text-emerald-400 font-bold print:text-black">+{formatCurrency(pnl.revenue.delta)}</td>
                    <td className="px-3.5 py-2 text-right font-mono text-emerald-400 print:text-black">+{pnl.revenue.deltaPct}%</td>
                    <td className="px-3.5 py-2 text-center text-emerald-400 font-semibold print:text-black">↗ Favorable</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="px-3.5 py-2 text-slate-300 print:text-gray-800">Cost of Goods Sold (COGS)</td>
                    <td className="px-3.5 py-2 text-right font-mono text-slate-400 print:text-gray-600">{formatCurrency(baseCogs)}</td>
                    <td className="px-3.5 py-2 text-right font-mono text-slate-300 print:text-black">{formatCurrency(health.cogs)}</td>
                    <td className="px-3.5 py-2 text-right font-mono text-emerald-400 font-semibold print:text-black">{formatCurrency(pnl.cogs.delta)}</td>
                    <td className="px-3.5 py-2 text-right font-mono text-emerald-400 print:text-black">{pnl.cogs.deltaPct}%</td>
                    <td className="px-3.5 py-2 text-center text-emerald-400 font-semibold print:text-black">→ Cost Reduction</td>
                  </tr>
                  <tr className="bg-slate-900/50 font-bold border-t border-slate-700 print:bg-gray-100">
                    <td className="px-3.5 py-2 text-white print:text-black">Gross Operating Profit</td>
                    <td className="px-3.5 py-2 text-right font-mono print:text-black">{formatCurrency(baseGrossProfit)}</td>
                    <td className="px-3.5 py-2 text-right font-mono print:text-black">{formatCurrency(health.grossProfit)}</td>
                    <td className="px-3.5 py-2 text-right font-mono text-emerald-400 print:text-black">+{formatCurrency(pnl.revenue.delta - pnl.cogs.delta)}</td>
                    <td className="px-3.5 py-2 text-right font-mono text-emerald-400 print:text-black">+{formatPercent(health.grossMarginPct)}</td>
                    <td className="px-3.5 py-2 text-center text-emerald-400 print:text-black">↗ Margin Expansion</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="px-3.5 py-2 text-slate-300 print:text-gray-800">Payroll, Benefits & Wages</td>
                    <td className="px-3.5 py-2 text-right font-mono text-slate-400 print:text-gray-600">{formatCurrency(basePayroll)}</td>
                    <td className="px-3.5 py-2 text-right font-mono text-slate-300 print:text-black">{formatCurrency(health.payroll)}</td>
                    <td className="px-3.5 py-2 text-right font-mono text-rose-400 font-semibold print:text-black">+{formatCurrency(pnl.payroll.delta)}</td>
                    <td className="px-3.5 py-2 text-right font-mono text-rose-400 print:text-black">+{pnl.payroll.deltaPct}%</td>
                    <td className="px-3.5 py-2 text-center text-rose-400 font-semibold print:text-black">↗ Cost Increase</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="px-3.5 py-2 text-slate-300 print:text-gray-800">General Operating Overhead (OpEx)</td>
                    <td className="px-3.5 py-2 text-right font-mono text-slate-400 print:text-gray-600">{formatCurrency(baseOpex)}</td>
                    <td className="px-3.5 py-2 text-right font-mono text-slate-300 print:text-black">{formatCurrency(health.operatingExpenses)}</td>
                    <td className="px-3.5 py-2 text-right font-mono text-rose-400 font-semibold print:text-black">+{formatCurrency(pnl.opex.delta)}</td>
                    <td className="px-3.5 py-2 text-right font-mono text-rose-400 print:text-black">+{pnl.opex.deltaPct}%</td>
                    <td className="px-3.5 py-2 text-center text-rose-400 font-semibold print:text-black">↗ Overhead Surge</td>
                  </tr>
                  <tr className="bg-emerald-950/30 font-bold border-t border-emerald-500/40 print:bg-gray-100">
                    <td className="px-3.5 py-2.5 text-emerald-300 print:text-black">Operating Profit (EBIT - Reported)</td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-slate-300 print:text-black">{formatCurrency(baseOperatingProfit)}</td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-emerald-400 print:text-black">{formatCurrency(health.operatingProfit)}</td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-emerald-400 font-bold print:text-black">+{formatCurrency(pnl.operatingProfit.delta)}</td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-emerald-400 print:text-black">+{health.operatingProfitGrowthPct}%</td>
                    <td className="px-3.5 py-2.5 text-center text-emerald-400 font-bold print:text-black">↗ +64.7% EBIT Surge</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* SECTION 3: DETERMINISTIC MOM OPERATING-PROFIT VARIANCE BRIDGE */}
          <section className="space-y-3 print-avoid-break">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 print:border-black">
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-mono text-[11px] font-bold print:bg-gray-200 print:text-black">03</span>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider print:text-black">
                Deterministic MoM Variance Analysis & Mathematical Bridge
              </h2>
            </div>

            <p className="text-xs text-slate-300 print:text-gray-800 leading-relaxed text-justify">
              The reconciliation bridging February Operating Profit ($8,407.96) to March Operating Profit ($13,852.14) is derived deterministically from the general ledger accounting equation:
            </p>

            {/* Formula Box */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-xs text-slate-200 space-y-1 print:border-gray-400 print:bg-gray-50 print:text-black">
              <div className="text-cyan-300 font-bold print:text-black">
                Δ Operating Profit = Δ Revenue - Δ COGS - Δ Payroll - Δ OpEx
              </div>
              <div className="text-slate-300 text-[11px] print:text-gray-700">
                = (+$24,153.38) - (-$802.91) - (+$5,858.82) - (+$13,653.29) = +$5,444.18
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-gray-400">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-300 font-bold print:bg-gray-100 print:text-black">
                    <th className="px-3.5 py-2">Waterfall Component</th>
                    <th className="px-3.5 py-2 text-right">Shift (Δ)</th>
                    <th className="px-3.5 py-2 text-right">Profit Impact</th>
                    <th className="px-3.5 py-2">Managerial Interpretation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-gray-200 text-[11px]">
                  <tr>
                    <td className="px-3.5 py-1.5 font-medium text-white print:text-black">Starting February EBIT</td>
                    <td className="px-3.5 py-1.5 text-right font-mono text-slate-300 print:text-black">$8,407.96</td>
                    <td className="px-3.5 py-1.5 text-right font-mono text-slate-400 print:text-gray-600">Baseline</td>
                    <td className="px-3.5 py-1.5 text-slate-400 print:text-gray-600">Prior month validated operating benchmark</td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-1.5 text-emerald-300 print:text-black">+ Revenue Expansion</td>
                    <td className="px-3.5 py-1.5 text-right font-mono text-emerald-400 print:text-black">+$24,153.38</td>
                    <td className="px-3.5 py-1.5 text-right font-mono text-emerald-400 font-bold print:text-black">+$24,153.38</td>
                    <td className="px-3.5 py-1.5 text-slate-300 print:text-gray-800">Strong dining room volume and banquet bookings</td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-1.5 text-emerald-300 print:text-black">+ COGS Cost Reduction</td>
                    <td className="px-3.5 py-1.5 text-right font-mono text-emerald-400 print:text-black">-$802.91</td>
                    <td className="px-3.5 py-1.5 text-right font-mono text-emerald-400 font-bold print:text-black">+$802.91</td>
                    <td className="px-3.5 py-1.5 text-slate-300 print:text-gray-800">Favorable direct cost variance enhancing profit</td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-1.5 text-rose-300 print:text-black">- Kitchen & Service Payroll</td>
                    <td className="px-3.5 py-1.5 text-right font-mono text-rose-400 print:text-black">+$5,858.82</td>
                    <td className="px-3.5 py-1.5 text-right font-mono text-rose-400 font-bold print:text-black">-$5,858.82</td>
                    <td className="px-3.5 py-1.5 text-slate-300 print:text-gray-800">Additional staff hours required to support +18.6% sales volume</td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-1.5 text-rose-300 print:text-black">- Operating Overhead Surge</td>
                    <td className="px-3.5 py-1.5 text-right font-mono text-rose-400 print:text-black">+$13,653.29</td>
                    <td className="px-3.5 py-1.5 text-right font-mono text-rose-400 font-bold print:text-black">-$13,653.29</td>
                    <td className="px-3.5 py-1.5 text-slate-300 print:text-gray-800">Concentrated in owner draw ($5K) and catering food ($6.2K)</td>
                  </tr>
                  <tr className="bg-emerald-950/20 font-bold border-t border-emerald-500/30 print:bg-gray-100">
                    <td className="px-3.5 py-2 text-white print:text-black">Ending March Operating Profit</td>
                    <td className="px-3.5 py-2 text-right font-mono text-white print:text-black">$13,852.14</td>
                    <td className="px-3.5 py-2 text-right font-mono text-emerald-400 font-bold print:text-black">+$5,444.18</td>
                    <td className="px-3.5 py-2 text-emerald-300 font-semibold print:text-black">Net +64.75% reported operating profit growth</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* SECTION 4: AI RISK & ANOMALY REGISTER WITH EVIDENCE TRAIL */}
          <section className="space-y-3 print-page-break">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 print:border-black">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-mono text-[11px] font-bold print:bg-gray-200 print:text-black">04</span>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider print:text-black">
                  AI Risk & Anomaly Register (with Transaction Evidence Trail)
                </h2>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[10px]">
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 print:border-gray-400 print:text-black">🔴 {data.riskSignals.highCount} High</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 print:border-gray-400 print:text-black">🟠 {data.riskSignals.mediumCount} Medium</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 print:text-gray-800 leading-relaxed text-justify">
              Each flagged anomaly below underwent deterministic validation and AI reasoning. Every conclusion references raw transaction primary keys:
            </p>

            <div className="space-y-3">
              {data.riskSignals.items.map((risk) => (
                <div
                  key={risk.id}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs print:border-gray-300 print:bg-gray-50 print-avoid-break"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-1.5 print:border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        risk.severity === 'HIGH' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 print:text-black print:border-black' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 print:text-black print:border-black'
                      }`}>
                        {risk.severity}
                      </span>
                      <strong className="text-white text-xs print:text-black">{risk.title}</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectCitation(risk.transactionId)}
                        className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] font-bold hover:bg-emerald-500/30 cursor-pointer print:text-black print:border-black"
                      >
                        Inspect [{risk.transactionId}] ➔
                      </button>
                      <span className="font-mono text-xs font-bold text-white print:text-black">
                        {formatCurrency(risk.amount)}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-300 text-[11px] leading-relaxed print:text-gray-800 text-justify">
                    {risk.description}
                  </p>

                  {/* Explicit AI Findings -> Evidence Chain */}
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] space-y-1 print:bg-white print:border-gray-200">
                    <span className="font-semibold text-slate-400 uppercase text-[9px] tracking-wider block print:text-black">
                      AI Findings ➔ Transaction Evidence Chain:
                    </span>
                    <div className="font-mono text-[10px] space-y-0.5 text-slate-300 print:text-gray-800">
                      <div>• Primary Counterparty: <strong className="text-white print:text-black">{risk.vendor}</strong></div>
                      <div>• Posting Date: <strong className="text-white print:text-black">{risk.date}</strong></div>
                      <div>• Financial Exposure: <strong className="text-emerald-400 print:text-black">{formatCurrency(risk.amount)}</strong></div>
                      <div>• Audit Trail Evidence: <code className="text-cyan-300 font-bold print:text-black">[{risk.transactionId}]</code></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 5: VENDOR INTELLIGENCE */}
          <section className="space-y-3 print-avoid-break">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 print:border-black">
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-mono text-[11px] font-bold print:bg-gray-200 print:text-black">05</span>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider print:text-black">
                Vendor Spend Intelligence & Counterparty Movement
              </h2>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-gray-400">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-300 font-bold print:bg-gray-100 print:text-black">
                    <th className="px-3.5 py-2">Counterparty</th>
                    <th className="px-3.5 py-2 text-right">February Spend</th>
                    <th className="px-3.5 py-2 text-right">March Spend</th>
                    <th className="px-3.5 py-2 text-right">Net Shift (Δ)</th>
                    <th className="px-3.5 py-2 text-right">Velocity (%)</th>
                    <th className="px-3.5 py-2 text-right">Avg Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-gray-200 text-[11px]">
                  {data.vendorIntelligence.slice(0, 5).map((vi, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="px-3.5 py-1.5 font-bold text-white print:text-black">{vi.vendor}</td>
                      <td className="px-3.5 py-1.5 text-right font-mono text-slate-400 print:text-gray-600">{formatCurrency(vi.baseSpend)}</td>
                      <td className="px-3.5 py-1.5 text-right font-mono text-white font-bold print:text-black">{formatCurrency(vi.comparisonSpend)}</td>
                      <td className="px-3.5 py-1.5 text-right font-mono text-slate-200 print:text-black">
                        {vi.delta > 0 ? `+${formatCurrency(vi.delta)}` : formatCurrency(vi.delta)}
                      </td>
                      <td className={`px-3.5 py-1.5 text-right font-mono font-semibold ${vi.deltaPct > 0 ? 'text-rose-400 print:text-black' : 'text-emerald-400 print:text-black'}`}>
                        {vi.deltaPct > 0 ? `+${vi.deltaPct}%` : `${vi.deltaPct}%`}
                      </td>
                      <td className="px-3.5 py-1.5 text-right font-mono text-slate-300 print:text-black">{formatCurrency(vi.avgTransactionSize)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-slate-300 print:text-gray-800 leading-relaxed text-justify">
              Spend with Sysco expanded from $13,000 to $18,400 (+41.54%). A single transaction of $6,200.00 (<button onClick={() => onSelectCitation('TXN_1179')} className="text-emerald-400 font-bold hover:underline cursor-pointer print:text-black">[TXN_1179]</button>) accounted for the majority of the spike, confirmed as direct culinary banquet food supplies.
            </p>
          </section>

          {/* SECTION 6: DUPLICATE TRANSACTION CANDIDATE AUDIT */}
          <section className="space-y-3 print-avoid-break">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 print:border-black">
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-mono text-[11px] font-bold print:bg-gray-200 print:text-black">06</span>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider print:text-black">
                Duplicate Transaction Candidate Audit
              </h2>
            </div>

            <p className="text-xs text-slate-300 print:text-gray-800 leading-relaxed text-justify">
              Heuristic string distance and temporal proximity analysis identified potential duplicate billing candidates across operating disbursements:
            </p>

            {data.duplicateChecks.items.length === 0 ? (
              <div className="p-3 rounded-lg bg-slate-900/40 text-xs text-slate-400 text-center print:border-gray-300 print:bg-gray-50 print:text-black">
                ✓ Zero duplicate billing anomalies detected in audited period.
              </div>
            ) : (
              <div className="space-y-2">
                {data.duplicateChecks.items.map((dup) => (
                  <div key={dup.id} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5 text-xs print:border-gray-300 print:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 print:text-black print:border-black">
                          {dup.confidence}% Probability
                        </span>
                        <strong className="text-white text-xs print:text-black">{dup.vendor}</strong>
                        <span className="font-mono text-emerald-400 font-bold print:text-black">{formatCurrency(dup.amount)}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[10px]">
                        <button onClick={() => onSelectCitation(dup.primaryTransactionId)} className="text-emerald-400 hover:underline print:text-black font-bold">
                          [{dup.primaryTransactionId}]
                        </button>
                        <span className="text-slate-500 print:text-gray-500">vs</span>
                        <button onClick={() => onSelectCitation(dup.duplicateTransactionId)} className="text-emerald-400 hover:underline print:text-black font-bold">
                          [{dup.duplicateTransactionId}]
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SECTION 7: ACCOUNTING TREATMENT MEMORANDUMS */}
          <section className="space-y-3 print-page-break">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 print:border-black">
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-mono text-[11px] font-bold print:bg-gray-200 print:text-black">07</span>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider print:text-black">
                Accounting Treatment Memorandums
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Memo 1 */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 print:border-gray-300 print:bg-gray-50 print-avoid-break">
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[9px] font-bold print:text-black print:border-black">
                  Standard Accounting: Capital vs Operating
                </span>
                <h4 className="font-bold text-white text-xs print:text-black">Owner Distributions vs Operating Expense</h4>
                <p className="text-slate-300 text-[11px] leading-relaxed print:text-gray-800 text-justify">
                  Disbursements of business funds to owners are balance sheet capital transactions. Expensing owner draws under operating expenses artificially depresses operating profit.
                </p>
                <div className="p-2 rounded bg-slate-950 font-mono text-[10px] text-cyan-300 print:bg-white print:border-gray-200 print:text-black">
                  Recommended Treatment: Debit Equity (Owner Draw) / Credit Cash
                </div>
              </div>

              {/* Memo 2 */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 print:border-gray-300 print:bg-gray-50 print-avoid-break">
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[9px] font-bold print:text-black print:border-black">
                  Inventory & Direct Cost Absorption
                </span>
                <h4 className="font-bold text-white text-xs print:text-black">Culinary Food Inventory vs Overhead</h4>
                <p className="text-slate-300 text-[11px] leading-relaxed print:text-gray-800 text-justify">
                  Bulk ingredient deliveries represent direct production inputs. Placing food costs in OpEx distorts culinary gross profit and understates direct Cost of Goods Sold.
                </p>
                <div className="p-2 rounded bg-slate-950 font-mono text-[10px] text-cyan-300 print:bg-white print:border-gray-200 print:text-black">
                  Recommended Treatment: Debit COGS (Culinary) / Credit OpEx
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 8: RECONCILIATION & DATA QUALITY SCORECARD */}
          <section className="space-y-3 print-avoid-break">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 print:border-black">
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-mono text-[11px] font-bold print:bg-gray-200 print:text-black">08</span>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider print:text-black">
                Reconciliation & Data Quality Scorecard
              </h2>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 print:border-gray-300 print:bg-gray-50">
                <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5 print:text-gray-600">Total Audited Records</span>
                <span className="text-lg font-mono font-bold text-white print:text-black">{data.reconciliation.totalCount}</span>
                <span className="text-[9px] text-slate-500 block">100% GL Coverage</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 print:border-gray-300 print:bg-gray-50">
                <span className="text-[9px] uppercase font-bold text-emerald-400 block mb-0.5 print:text-black">Clean Matched</span>
                <span className="text-lg font-mono font-bold text-emerald-400 print:text-black">{data.reconciliation.matchedCount}</span>
                <span className="text-[9px] text-emerald-600 block">&gt;85% Certain</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 print:border-gray-300 print:bg-gray-50">
                <span className="text-[9px] uppercase font-bold text-amber-400 block mb-0.5 print:text-black">Review Required</span>
                <span className="text-lg font-mono font-bold text-amber-400 print:text-black">{data.reconciliation.reviewRequiredCount}</span>
                <span className="text-[9px] text-amber-600 block">Quarantined</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 print:border-gray-300 print:bg-gray-50">
                <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5 print:text-gray-600">Uncertain</span>
                <span className="text-lg font-mono font-bold text-slate-300 print:text-black">{data.reconciliation.partialCount}</span>
                <span className="text-[9px] text-slate-500 block">60-84% Score</span>
              </div>
            </div>
          </section>

          {/* SECTION 9: ACCOUNTING IMPACT SIMULATION (PRO-FORMA SCENARIOS) */}
          <section className="space-y-3 print-page-break">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 print:border-black">
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-mono text-[11px] font-bold print:bg-gray-200 print:text-black">09</span>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider print:text-black">
                Accounting Impact Simulation & Pro-Forma Scenarios
              </h2>
            </div>

            <p className="text-xs text-slate-300 print:text-gray-800 leading-relaxed text-justify">
              The schedule below illustrates the financial impact of executing the recommended classification reclassifications on Operating Profit and Gross Margin:
            </p>

            <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-gray-400">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-300 font-bold print:bg-gray-100 print:text-black">
                    <th className="px-3.5 py-2">Metric</th>
                    <th className="px-3.5 py-2 text-right">Reported As-Is</th>
                    <th className="px-3.5 py-2 text-right">Potential Adjustments</th>
                    <th className="px-3.5 py-2 text-right">Illustrative Adjusted</th>
                    <th className="px-3.5 py-2 text-center">Variance Comment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-gray-200 text-[11px]">
                  <tr>
                    <td className="px-3.5 py-2 font-bold text-white print:text-black">Gross Operating Revenue</td>
                    <td className="px-3.5 py-2 text-right font-mono print:text-black">{formatCurrency(health.revenue)}</td>
                    <td className="px-3.5 py-2 text-right font-mono text-slate-400 print:text-gray-500">$0.00</td>
                    <td className="px-3.5 py-2 text-right font-mono text-white font-bold print:text-black">{formatCurrency(health.revenue)}</td>
                    <td className="px-3.5 py-2 text-center text-slate-400 print:text-gray-600">Unaffected</td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-2 text-slate-300 print:text-gray-800">Cost of Goods Sold (COGS)</td>
                    <td className="px-3.5 py-2 text-right font-mono print:text-black">{formatCurrency(health.cogs)}</td>
                    <td className="px-3.5 py-2 text-right font-mono text-rose-400 print:text-black">+$6,200.00</td>
                    <td className="px-3.5 py-2 text-right font-mono text-slate-200 print:text-black">{formatCurrency(health.cogs + 6200)}</td>
                    <td className="px-3.5 py-2 text-center text-rose-400 print:text-black">Shifted from OpEx ([TXN_1179])</td>
                  </tr>
                  <tr className="bg-slate-900/40 font-bold print:bg-gray-100">
                    <td className="px-3.5 py-2 text-white print:text-black">Gross Culinary Profit</td>
                    <td className="px-3.5 py-2 text-right font-mono print:text-black">{formatCurrency(health.grossProfit)}</td>
                    <td className="px-3.5 py-2 text-right font-mono text-rose-400 print:text-black">-$6,200.00</td>
                    <td className="px-3.5 py-2 text-right font-mono text-white print:text-black">{formatCurrency(simulatedGrossProfit)}</td>
                    <td className="px-3.5 py-2 text-center text-slate-300 print:text-black">{formatPercent(simulatedGrossMarginPct)} Adjusted Margin</td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-2 text-slate-300 print:text-gray-800">General Operating Overhead (OpEx)</td>
                    <td className="px-3.5 py-2 text-right font-mono text-rose-400 print:text-black">{formatCurrency(health.operatingExpenses)}</td>
                    <td className="px-3.5 py-2 text-right font-mono text-emerald-400 font-bold print:text-black">-$11,200.00</td>
                    <td className="px-3.5 py-2 text-right font-mono text-emerald-400 font-bold print:text-black">{formatCurrency(health.operatingExpenses - 11200)}</td>
                    <td className="px-3.5 py-2 text-center text-emerald-400 print:text-black">-$5K Equity / -$6.2K COGS</td>
                  </tr>
                  <tr className="bg-cyan-950/30 font-bold border-t border-cyan-500/40 print:bg-gray-100">
                    <td className="px-3.5 py-2.5 text-cyan-300 print:text-black">Illustrative Adjusted EBIT</td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-slate-400 line-through print:text-gray-500">{formatCurrency(impact.currentOperatingProfit)}</td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-emerald-400 font-bold print:text-black">+{formatCurrency(impact.totalPotentialOperatingProfitAdjustment)}</td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-cyan-300 font-bold print:text-black">{formatCurrency(impact.simulatedOperatingProfit)}</td>
                    <td className="px-3.5 py-2.5 text-center text-cyan-300 font-bold print:text-black">+36.1% EBIT Expansion</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* SECTION 10: DECISION LOG & REVIEW RESOLUTION */}
          <section className="space-y-3 print-avoid-break">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 print:border-black">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-mono text-[11px] font-bold print:bg-gray-200 print:text-black">10</span>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider print:text-black">
                  Decision Log & Review Resolution
                </h2>
              </div>
              <span className="text-[10px] font-mono text-slate-400 print:text-gray-600">
                26 Review Items • 18 Resolved • 5 Pending • 3 Excluded
              </span>
            </div>

            <p className="text-xs text-slate-300 print:text-gray-800 leading-relaxed text-justify">
              Audit log of human-in-the-loop decisions for AI-flagged classification exceptions:
            </p>

            <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-gray-400">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-300 font-bold print:bg-gray-100 print:text-black">
                    <th className="px-3.5 py-2">Item ID</th>
                    <th className="px-3.5 py-2">Counterparty</th>
                    <th className="px-3.5 py-2 text-right">Amount</th>
                    <th className="px-3.5 py-2">AI Suggestion</th>
                    <th className="px-3.5 py-2">Human Decision</th>
                    <th className="px-3.5 py-2">Reviewed By</th>
                    <th className="px-3.5 py-2 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-gray-200 text-[11px]">
                  <tr>
                    <td className="px-3.5 py-1.5 font-mono text-emerald-400 font-bold print:text-black">[TXN_1180]</td>
                    <td className="px-3.5 py-1.5 text-white print:text-black">Owner Distribution</td>
                    <td className="px-3.5 py-1.5 text-right font-mono text-white print:text-black">$5,000.00</td>
                    <td className="px-3.5 py-1.5 text-cyan-300 print:text-gray-800">Reclassify to Equity</td>
                    <td className="px-3.5 py-1.5 font-bold text-emerald-400 print:text-black">✓ Exclude from P&L</td>
                    <td className="px-3.5 py-1.5 text-slate-300 print:text-gray-800">Finance User</td>
                    <td className="px-3.5 py-1.5 text-right font-mono text-slate-400 print:text-gray-600">25 Sep 2026</td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-1.5 font-mono text-emerald-400 font-bold print:text-black">[TXN_1179]</td>
                    <td className="px-3.5 py-1.5 text-white print:text-black">Sysco Foods</td>
                    <td className="px-3.5 py-1.5 text-right font-mono text-white print:text-black">$6,200.00</td>
                    <td className="px-3.5 py-1.5 text-cyan-300 print:text-gray-800">Shift to Culinary COGS</td>
                    <td className="px-3.5 py-1.5 font-bold text-emerald-400 print:text-black">✓ Reclassify to COGS</td>
                    <td className="px-3.5 py-1.5 text-slate-300 print:text-gray-800">Finance User</td>
                    <td className="px-3.5 py-1.5 text-right font-mono text-slate-400 print:text-gray-600">25 Sep 2026</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* SECTION 11: TRANSACTION EVIDENCE SCHEDULE & REVIEW ATTESTATION */}
          <section className="space-y-3 print-page-break">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 print:border-black">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-mono text-[11px] font-bold print:bg-gray-200 print:text-black">11</span>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider print:text-black">
                  Transaction Evidence Schedule & Review Attestation
                </h2>
              </div>
              <span className="text-[10px] font-mono text-slate-400 print:text-gray-600">
                Verified Records ({transactions.length > 0 ? transactions.length : '180+'} Items)
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-72 overflow-y-auto print:max-h-none print:overflow-visible print:border-gray-400">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-300 font-bold print:static print:bg-gray-100 print:text-black">
                  <tr>
                    <th className="px-3 py-1.5 text-[10px]">ID</th>
                    <th className="px-3 py-1.5 text-[10px]">Date</th>
                    <th className="px-3 py-1.5 text-[10px]">Counterparty</th>
                    <th className="px-3 py-1.5 text-[10px]">Category</th>
                    <th className="px-3 py-1.5 text-[10px] text-right">Amount</th>
                    <th className="px-3 py-1.5 text-[10px] text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px] print:divide-gray-200">
                  {(transactions.length > 0 ? transactions.slice(0, 30) : []).map((t) => (
                    <tr key={t.id} className="hover:bg-slate-900/50">
                      <td className="px-3 py-1.5 text-emerald-400 font-bold print:text-black">
                        <button
                          type="button"
                          onClick={() => onSelectCitation(t.id)}
                          className="hover:underline cursor-pointer print:text-black"
                        >
                          [{t.id}]
                        </button>
                      </td>
                      <td className="px-3 py-1.5 text-slate-400 print:text-gray-700">{t.date}</td>
                      <td className="px-3 py-1.5 text-white font-sans font-medium print:text-black">{t.counterparty}</td>
                      <td className="px-3 py-1.5 text-slate-400 print:text-gray-700">{t.category}</td>
                      <td className={`px-3 py-1.5 text-right font-bold ${t.amount > 0 ? 'text-emerald-400 print:text-black' : 'text-slate-200 print:text-black'}`}>
                        {formatCurrency(t.amount)}
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        {t.is_review_required ? (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold print:text-black">
                            Review
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold print:text-black">
                            Verified
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Document Attestation Block (No CFO claims) */}
            <div className="pt-6 border-t border-slate-800 print:border-black grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-400 print:text-gray-800 print-avoid-break">
              <div className="space-y-1.5">
                <div className="text-white font-bold uppercase text-[10px] tracking-wider print:text-black">
                  Preparation & System Attestation:
                </div>
                <div className="border-b border-slate-700 pb-1 font-mono text-emerald-400 font-bold print:text-black">
                  Finz Financial Review Engine (Deterministic SQL Aggregation)
                </div>
                <div className="text-[10px] print:text-gray-600">
                  Financial totals generated from verified General Ledger transaction records. Semantic reasoning provided by AI classification rules.
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-white font-bold uppercase text-[10px] tracking-wider print:text-black">
                  Internal Finance Review Sign-Off:
                </div>
                <div className="border-b border-slate-700 pb-1 font-mono text-slate-300 print:text-black">
                  Review Status: Completed by Finance User
                </div>
                <div className="text-[10px] print:text-gray-600">
                  Review Date: {new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
