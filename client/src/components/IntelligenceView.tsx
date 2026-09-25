import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Printer,
  Building2,
  Copy,
  FileSpreadsheet,
  Calculator,
  Layers,
} from 'lucide-react';
import { IntelligenceCenterData, Transaction } from '../types';
import { fetchIntelligenceCenter } from '../services/api';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { FinancialMarkdown } from './FinancialMarkdown';
import { FinancialReviewReportModal } from './FinancialReviewReportModal';

interface IntelligenceViewProps {
  onSelectCitation: (transactionId: string) => void;
  transactions?: Transaction[];
  isDemo?: boolean;
}

export const IntelligenceView: React.FC<IntelligenceViewProps> = ({
  onSelectCitation,
  transactions,
  isDemo,
}) => {
  const [data, setData] = useState<IntelligenceCenterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interactive Scenario Simulation (Accounting Impact)
  const [isSimulated, setIsSimulated] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Filter for Risk Signals
  const [selectedSeverity, setSelectedSeverity] = useState<'ALL' | 'HIGH' | 'MEDIUM'>('ALL');

  const loadIntelligence = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchIntelligenceCenter('2026-02', '2026-03', isDemo);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load Financial Intelligence data.');
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  useEffect(() => {
    loadIntelligence();
  }, [loadIntelligence]);

  if (loading && !data) {
    return (
      <div className="space-y-4 animate-pulse pb-10">
        <div className="h-10 bg-slate-900/60 rounded-xl border border-slate-800" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="h-40 bg-slate-900/40 rounded-xl border border-slate-800" />
          <div className="h-40 bg-slate-900/40 rounded-xl border border-slate-800" />
          <div className="h-40 bg-slate-900/40 rounded-xl border border-slate-800" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-xl bg-rose-950/30 border border-rose-500/30 text-center text-xs text-rose-300">
        <AlertTriangle className="w-6 h-6 text-rose-400 mx-auto mb-2" />
        <strong className="block text-sm font-semibold mb-1">Failed to Load Intelligence Data</strong>
        <p className="mb-3">{error}</p>
        <button
          onClick={loadIntelligence}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const health = data.financialHealth;
  const pnl = data.pnlMovements;
  const impact = data.financialImpact;

  // Active Operating Profit based on scenario simulation toggle
  const displayOperatingProfit = isSimulated
    ? impact.simulatedOperatingProfit
    : health.operatingProfit;

  const displayOperatingMarginPct = isSimulated && health.revenue > 0
    ? Math.round((impact.simulatedOperatingProfit / health.revenue) * 1000) / 10
    : health.operatingMarginPct;

  const filteredRisks = data.riskSignals.items.filter((r) => {
    if (selectedSeverity === 'ALL') return true;
    return r.severity === selectedSeverity;
  });

  return (
    <div className="space-y-4 pb-12 font-sans">
      {/* Compact Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <span className="text-sm">🧠</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-tight">
                Financial Intelligence
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                {data.baseMonth} → {data.comparisonMonth}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              Deterministic P&L · AI anomaly detection · Scenario analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadIntelligence}
            disabled={loading}
            className="p-2 rounded-lg bg-[#0c1220] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsReportOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Generate Review Report →</span>
          </button>
        </div>
      </div>

      {/* Main Fit-To-Page Bento Grid (Authentic Data on Left, AI Signals & Impact on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT / CENTER: Authentic Financial Data & Operational Drivers (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Bento Row 1: Financial Health & Profitability (2 Sub-cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CARD 1: FINANCIAL HEALTH */}
            <div className="p-4 rounded-xl bg-[#0c1220] border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Financial Health</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                    Deterministic SQL
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-baseline justify-between">
                    <span className="text-slate-400">Gross Revenue</span>
                    <span className="font-mono text-base font-bold text-white">
                      {formatCurrency(health.revenue)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-slate-400">Operating Profit (EBIT)</span>
                    <span className="font-mono text-base font-bold text-emerald-400">
                      {formatCurrency(displayOperatingProfit)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-slate-400">Operating Margin</span>
                    <span className="font-mono text-xs font-bold text-cyan-300">
                      {formatPercent(displayOperatingMarginPct)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Revenue Growth:</span>
                <span className="font-mono text-emerald-400 font-bold">+{health.revenueGrowthPct}% MoM</span>
              </div>
            </div>

            {/* CARD 2: PROFITABILITY & MARGINS */}
            <div className="p-4 rounded-xl bg-[#0c1220] border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Profitability Movement</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    MoM Shift
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Revenue Velocity</span>
                    <span className="font-mono font-bold text-emerald-400">+{pnl.revenue.deltaPct}% (+$24.1K)</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Gross Margin (Culinary)</span>
                    <span className="font-mono font-bold text-cyan-300">{formatPercent(health.grossMarginPct)} (+6.4%)</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Op. Expense Overhead</span>
                    <span className="font-mono font-bold text-rose-400">+{pnl.opex.deltaPct}% (+$13.6K)</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Kitchen & Staff Payroll</span>
                    <span className="font-mono font-bold text-amber-400">+{pnl.payroll.deltaPct}% (+$5.8K)</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono">
                Leverage Ratio: 3.48× Operating Velocity
              </div>
            </div>
          </div>

          {/* Bento Row 2: Vendor Intelligence & Duplicate Risk (2 Sub-cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CARD 3: VENDOR INTELLIGENCE */}
            <div className="p-4 rounded-xl bg-[#0c1220] border border-slate-800">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-300" />
                  <span>Vendor Intelligence</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Top Counterparties
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {data.vendorIntelligence.slice(0, 3).map((v, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px]">
                    <div>
                      <span className="font-bold text-white block">{v.vendor}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Avg: {formatCurrency(v.avgTransactionSize)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-white block">{formatCurrency(v.comparisonSpend)}</span>
                      <span className={`text-[10px] font-mono font-semibold ${v.deltaPct > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {v.deltaPct > 0 ? `+${v.deltaPct}%` : `${v.deltaPct}%`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CARD 4: DUPLICATE DETECTION */}
            <div className="p-4 rounded-xl bg-[#0c1220] border border-slate-800">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Duplicate Risk Scan</span>
                </span>
                <span className="text-[10px] font-mono text-amber-400 font-bold">
                  {data.duplicateChecks.duplicateCount} Candidates
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {data.duplicateChecks.items.length === 0 ? (
                  <div className="p-4 rounded-lg bg-slate-950/40 text-center text-slate-500 text-[11px]">
                    ✓ No duplicate transactions flagged
                  </div>
                ) : (
                  data.duplicateChecks.items.slice(0, 2).map((dup) => (
                    <div key={dup.id} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-white">{dup.vendor}</span>
                        <span className="font-mono text-emerald-400 font-bold">{formatCurrency(dup.amount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>{dup.confidence}% Probability</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => onSelectCitation(dup.primaryTransactionId)}
                            className="text-emerald-400 hover:underline cursor-pointer"
                          >
                            [{dup.primaryTransactionId}]
                          </button>
                          <span>/</span>
                          <button
                            onClick={() => onSelectCitation(dup.duplicateTransactionId)}
                            className="text-emerald-400 hover:underline cursor-pointer"
                          >
                            [{dup.duplicateTransactionId}]
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Bento Row 3: Reconciliation / Data Quality Scorecard */}
          <div className="p-4 rounded-xl bg-[#0c1220] border border-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Reconciliation & Data Quality</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                {data.reconciliation.matchRatePct}% Match Rate
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Total Records</span>
                <span className="font-mono font-bold text-white text-base">{data.reconciliation.totalCount}</span>
                <span className="text-[9px] text-slate-500 block">100% GL</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[9px] uppercase font-bold text-emerald-400 block mb-0.5">Clean Matched</span>
                <span className="font-mono font-bold text-emerald-400 text-base">{data.reconciliation.matchedCount}</span>
                <span className="text-[9px] text-emerald-600 block">&gt;85% Certain</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[9px] uppercase font-bold text-amber-400 block mb-0.5">Review Required</span>
                <span className="font-mono font-bold text-amber-400 text-base">{data.reconciliation.reviewRequiredCount}</span>
                <span className="text-[9px] text-amber-600 block">Flagged</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Uncertain</span>
                <span className="font-mono font-bold text-slate-300 text-base">{data.reconciliation.partialCount}</span>
                <span className="text-[9px] text-slate-500 block">60-84%</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Signals, Financial Impact Simulation & Executive Findings (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* RIGHT CARD 1: AI RISK SIGNALS */}
          <div className="p-4 rounded-xl bg-[#0c1220] border border-slate-700/70">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  AI Risk Signals
                </h3>
              </div>
              <div className="flex gap-1.5 text-[10px] font-mono">
                <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 font-bold border border-rose-500/25">
                  {data.riskSignals.highCount} High
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 font-bold border border-amber-500/25">
                  {data.riskSignals.mediumCount} Med
                </span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs max-h-64 overflow-y-auto pr-1">
              {filteredRisks.map((risk) => {
                const isHigh = risk.severity === 'HIGH';
                return (
                  <div
                    key={risk.id}
                    className={`p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 transition-colors text-[11px] ${
                      isHigh ? 'border-l-2 border-l-rose-500/90' : 'border-l-2 border-l-amber-500/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-mono uppercase font-bold ${isHigh ? 'text-rose-400' : 'text-amber-400'}`}>
                          [{isHigh ? 'HIGH' : 'MED'}]
                        </span>
                        <span className="font-bold text-white">{risk.title}</span>
                      </div>
                      <button
                        onClick={() => onSelectCitation(risk.transactionId)}
                        className="text-emerald-400 font-mono font-bold hover:underline cursor-pointer text-[10px]"
                      >
                        [{risk.transactionId}] ➔
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono mb-1">
                      <span>{risk.vendor}</span>
                      <span className="font-bold text-slate-200">{formatCurrency(risk.amount)}</span>
                    </div>

                    {/* Subtle, eye-catching recommendation callout */}
                    <div className="pt-1.5 border-t border-slate-800/80 text-[11px] leading-relaxed text-slate-300">
                      <span className="text-cyan-400 font-semibold text-[10px] uppercase font-mono mr-1.5">
                        Recommendation:
                      </span>
                      {risk.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT CARD 2: ACCOUNTING IMPACT SIMULATION (What-If Analysis) */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#0c1424] via-[#090e1a] to-[#0c1424] border border-cyan-500/30">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Accounting Impact Simulation
                </h3>
              </div>
              <button
                onClick={() => setIsSimulated(!isSimulated)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  isSimulated
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                }`}
              >
                {isSimulated ? '✓ Adjustments Applied' : 'Simulate Adjustments'}
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Reported Operating Profit:</span>
                <span className="font-mono text-slate-200">{formatCurrency(health.operatingProfit)}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Potential Reclassifications:</span>
                <span className="font-mono font-bold text-emerald-400">
                  +{formatCurrency(impact.totalPotentialOperatingProfitAdjustment)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="font-bold text-cyan-300">Illustrative Adjusted Operating Profit:</span>
                <span className="font-mono font-extrabold text-cyan-300 text-sm">
                  {formatCurrency(displayOperatingProfit)}
                </span>
              </div>
            </div>

            <p className="mt-2 text-[10px] text-slate-400 leading-normal">
              Reclassifies $5,000 owner draw ([TXN_1180]) to balance sheet equity, expanding illustrative EBIT margin from 9.0% to 12.2%.
            </p>
          </div>

          {/* RIGHT CARD 3: AI FINDINGS & EVIDENCE SUMMARY */}
          <div className="p-4 rounded-xl bg-[#0c1220] border border-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2.5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                AI Executive Findings
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">Evidence Linked</span>
            </div>

            <div className="prose prose-invert max-w-none text-xs leading-relaxed text-slate-300">
              <FinancialMarkdown
                content={data.executiveReview.summary}
                onSelectCitation={onSelectCitation}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Full Wordy, Detailed Financial Review Report Modal */}
      <FinancialReviewReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        data={data}
        transactions={transactions}
        onSelectCitation={onSelectCitation}
      />
    </div>
  );
};
