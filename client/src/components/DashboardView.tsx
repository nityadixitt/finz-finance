import React from 'react';
import {
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  BarChart3,
  GitCompare,
  ArrowRight,
  Cpu,
  Layers,
  UploadCloud,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { PnLSummaryResponse, Transaction, ReviewItem } from '../types';
import { formatCurrency, formatCompactCurrency } from '../utils/formatters';

interface DashboardViewProps {
  pnlData: PnLSummaryResponse | null;
  recentTransactions: Transaction[];
  reviewItems: ReviewItem[];
  onNavigateTab: (tab: 'transactions' | 'pnl' | 'variance' | 'review' | 'intelligence') => void;
  onSelectTransaction: (txn: Transaction) => void;
  onOpenUpload?: () => void;
  onEnterDemo?: () => void;
  onSelectCitation?: (transactionId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  pnlData,
  recentTransactions,
  reviewItems,
  onNavigateTab,
  onSelectTransaction,
  onOpenUpload,
  onEnterDemo,
  onSelectCitation,
}) => {
  if (recentTransactions.length === 0) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="p-8 rounded-2xl bg-[#0c1220] border border-slate-800 text-center max-w-md w-full">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3 text-emerald-400">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1.5">No Transactions In Workspace</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed mb-5">
            Upload a bank statement CSV to generate deterministic P&L metrics, MoM variance, and review queues.
          </p>
          <div className="flex items-center justify-center gap-3">
            {onOpenUpload && (
              <button
                onClick={onOpenUpload}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload CSV</span>
              </button>
            )}
            {onEnterDemo && (
              <button
                onClick={onEnterDemo}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-all cursor-pointer"
              >
                Load Demo
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const latestMonth = pnlData && pnlData.statements.length > 0
    ? pnlData.statements[pnlData.statements.length - 1]
    : null;
  const prevMonth = pnlData && pnlData.statements.length > 1
    ? pnlData.statements[pnlData.statements.length - 2]
    : null;

  const revenueMoM = latestMonth && prevMonth && prevMonth.revenue > 0
    ? ((latestMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100
    : 0;
  const profitMoM = latestMonth && prevMonth && prevMonth.operatingProfit !== 0
    ? ((latestMonth.operatingProfit - prevMonth.operatingProfit) / Math.abs(prevMonth.operatingProfit)) * 100
    : 0;

  const pendingReviews = reviewItems.filter((r) => r.status === 'PENDING');
  const resolvedReviews = reviewItems.filter((r) => r.status === 'RESOLVED');

  const chartData = (pnlData?.statements || []).map((s) => ({
    name: s.monthName,
    Revenue: s.revenue,
    COGS: s.cogs,
    Profit: s.operatingProfit,
    Payroll: s.payroll,
    OpEx: s.operatingExpenses,
  }));

  const totalTxns = pnlData?.statements.reduce((a, c) => a + c.transactionCount, 0) || 0;

  const handleCitationClick = (txnId: string) => {
    if (onSelectCitation) onSelectCitation(txnId);
    else {
      const found = recentTransactions.find((t) => t.id === txnId);
      if (found) onSelectTransaction(found);
    }
  };

  const grossMarginPct = latestMonth && latestMonth.revenue > 0
    ? ((latestMonth.grossProfit / latestMonth.revenue) * 100).toFixed(1)
    : '0.0';
  const opexPct = latestMonth && latestMonth.revenue > 0
    ? (((latestMonth.operatingExpenses + latestMonth.payroll) / latestMonth.revenue) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="pb-6 font-sans space-y-3.5">
      {/* ── TOP KPI STRIP ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Revenue */}
        <div className="p-3.5 rounded-xl bg-[#0c1220] border border-slate-800 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            <span>{latestMonth?.monthName || 'Latest'} Revenue</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono leading-none">
            {latestMonth ? formatCurrency(latestMonth.revenue) : '$0'}
          </div>
          <div className="flex items-center gap-1 text-[11px]">
            {revenueMoM >= 0 ? (
              <span className="flex items-center gap-0.5 font-bold text-emerald-400">
                <ArrowUpRight className="w-3 h-3" />+{revenueMoM.toFixed(1)}%
              </span>
            ) : (
              <span className="flex items-center gap-0.5 font-bold text-rose-400">
                <ArrowDownRight className="w-3 h-3" />{revenueMoM.toFixed(1)}%
              </span>
            )}
            <span className="text-slate-500">MoM</span>
          </div>
        </div>

        {/* Gross Profit */}
        <div className="p-3.5 rounded-xl bg-[#0c1220] border border-slate-800 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            <span>Gross Profit</span>
            <PieChart className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono leading-none">
            {latestMonth ? formatCurrency(latestMonth.grossProfit) : '$0'}
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Margin</span>
            <span className="font-bold text-cyan-400 font-mono">{grossMarginPct}%</span>
          </div>
        </div>

        {/* Operating Profit */}
        <div className="p-3.5 rounded-xl bg-[#0c1220] border border-slate-800 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            <span>Operating Profit</span>
            <BarChart3 className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono leading-none">
            {latestMonth ? formatCurrency(latestMonth.operatingProfit) : '$0'}
          </div>
          <div className="flex items-center gap-1 text-[11px]">
            {profitMoM >= 0 ? (
              <span className="flex items-center gap-0.5 font-bold text-emerald-400">
                <ArrowUpRight className="w-3 h-3" />+{profitMoM.toFixed(1)}%
              </span>
            ) : (
              <span className="flex items-center gap-0.5 font-bold text-rose-400">
                <ArrowDownRight className="w-3 h-3" />{profitMoM.toFixed(1)}%
              </span>
            )}
            <span className="text-slate-500">({latestMonth?.operatingMarginPct || 0}% margin)</span>
          </div>
        </div>

        {/* OpEx Overhead */}
        <div className="p-3.5 rounded-xl bg-[#0c1220] border border-slate-800 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            <span>Total Overhead</span>
            <Layers className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono leading-none">
            {latestMonth ? formatCurrency(latestMonth.operatingExpenses + latestMonth.payroll) : '$0'}
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">% of Revenue</span>
            <span className="font-bold text-amber-400 font-mono">{opexPct}%</span>
          </div>
        </div>
      </div>

      {/* ── MAIN BENTO GRID: Left 7 cols | Right 5 cols ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">

        {/* ──── LEFT / CENTER COLUMN ──── */}
        <div className="lg:col-span-7 flex flex-col gap-3.5">

          {/* Monthly Revenue, COGS, Profit Chart */}
          <div className="p-4 rounded-xl bg-[#0c1220] border border-slate-800 flex-1">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Monthly Trajectory</h3>
                <span className="text-[10px] text-slate-400 font-mono">Revenue · COGS · Operating Profit</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-sm" />Revenue</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-rose-500 rounded-sm" />COGS</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-cyan-400 rounded-sm" />Profit</span>
              </div>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 2, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => formatCompactCurrency(v)} width={55} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                    formatter={(value: any) => [formatCurrency(Number(value)), '']}
                  />
                  <Bar dataKey="Revenue" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="COGS" fill="#f43f5e" radius={[3, 3, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="Profit" fill="#06b6d4" radius={[3, 3, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2-Col row: Cost Allocation + Operating Profit Trend */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Cost Allocation */}
            <div className="p-4 rounded-xl bg-[#0c1220] border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Cost Allocation</h3>
                <span className="text-[10px] text-slate-400">{latestMonth?.monthName}</span>
              </div>
              <div className="space-y-2.5">
                {/* COGS */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">Cost of Goods Sold</span>
                    <span className="font-mono text-slate-200">{latestMonth ? formatCurrency(latestMonth.cogs) : '$0'}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${latestMonth && latestMonth.revenue > 0 ? ((latestMonth.cogs / latestMonth.revenue) * 100).toFixed(0) : 0}%` }} />
                  </div>
                  <div className="text-[9px] text-slate-500 text-right mt-0.5 font-mono">{latestMonth && latestMonth.revenue > 0 ? ((latestMonth.cogs / latestMonth.revenue) * 100).toFixed(1) : 0}% of revenue</div>
                </div>
                {/* Payroll */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">Payroll & Benefits</span>
                    <span className="font-mono text-slate-200">{latestMonth ? formatCurrency(latestMonth.payroll) : '$0'}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${latestMonth && latestMonth.revenue > 0 ? ((latestMonth.payroll / latestMonth.revenue) * 100).toFixed(0) : 0}%` }} />
                  </div>
                  <div className="text-[9px] text-slate-500 text-right mt-0.5 font-mono">{latestMonth && latestMonth.revenue > 0 ? ((latestMonth.payroll / latestMonth.revenue) * 100).toFixed(1) : 0}% of revenue</div>
                </div>
                {/* OpEx */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">General Operating Expenses</span>
                    <span className="font-mono text-slate-200">{latestMonth ? formatCurrency(latestMonth.operatingExpenses) : '$0'}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${latestMonth && latestMonth.revenue > 0 ? ((latestMonth.operatingExpenses / latestMonth.revenue) * 100).toFixed(0) : 0}%` }} />
                  </div>
                  <div className="text-[9px] text-slate-500 text-right mt-0.5 font-mono">{latestMonth && latestMonth.revenue > 0 ? ((latestMonth.operatingExpenses / latestMonth.revenue) * 100).toFixed(1) : 0}% of revenue</div>
                </div>
              </div>
            </div>

            {/* Operating Profit Trend (Line) */}
            <div className="p-4 rounded-xl bg-[#0c1220] border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Profit Trend</h3>
                <span className="text-[10px] text-slate-400 font-mono">EBIT over time</span>
              </div>
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 2, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 9 }} tickFormatter={(v) => formatCompactCurrency(v)} width={48} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                      formatter={(value: any) => [formatCurrency(Number(value)), 'EBIT']}
                    />
                    <Line type="monotone" dataKey="Profit" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2">
                <div className="text-[10px] text-slate-400">
                  <span className="block text-[9px] uppercase tracking-wider text-slate-500 mb-0.5">Transactions</span>
                  <span className="font-mono font-bold text-white text-xs">{totalTxns}</span>
                </div>
                <div className="text-[10px] text-slate-400 text-right">
                  <span className="block text-[9px] uppercase tracking-wider text-slate-500 mb-0.5">Data Periods</span>
                  <span className="font-mono font-bold text-white text-xs">{pnlData?.statements.length || 0} months</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ──── RIGHT COLUMN: AI Findings + Review Queue ──── */}
        <div className="lg:col-span-5 flex flex-col gap-3.5">

          {/* AI Findings & Evidence */}
          <div className="p-4 rounded-xl bg-[#0c1220] border border-slate-800 flex-1">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">AI Findings & Evidence</h3>
              </div>
              <button
                onClick={() => onNavigateTab('intelligence')}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5 transition-colors cursor-pointer"
              >
                Full Analysis <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-white">OpEx Overhead Surge</span>
                  <span className="font-mono font-bold text-rose-400">+$13,653</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-snug">
                  82% of OpEx increase driven by 2 non-operational transactions.
                </p>
                <div className="space-y-0.5 font-mono text-[10px] text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>• Owner Distribution ($5,000)</span>
                    <button onClick={() => handleCitationClick('TXN_1180')} className="text-emerald-400 hover:underline cursor-pointer font-bold">[TXN_1180] →</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>• Sysco Food Order ($6,200)</span>
                    <button onClick={() => handleCitationClick('TXN_1179')} className="text-emerald-400 hover:underline cursor-pointer font-bold">[TXN_1179] →</button>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-white">Culinary Margin Distortion</span>
                  <span className="font-mono font-bold text-cyan-400">68.9% Margin</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-snug">
                  Direct COGS dropped −$803 despite +18.6% volume. Sysco catering ($6.2K) likely belongs in COGS, not OpEx.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-white">Accounting Impact Scenario</span>
                  <span className="font-mono font-bold text-emerald-400">+$5,000 adj.</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-snug">
                  Reclassifying owner draw to equity expands illustrative EBIT margin from 9.0% → 12.2%.
                </p>
              </div>
            </div>
          </div>

          {/* Review Queue Summary */}
          <div className="p-4 rounded-xl bg-[#0c1220] border border-slate-800">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Review Queue</h3>
              </div>
              <span className="text-[11px] font-mono text-amber-400 font-bold">{pendingReviews.length} Pending</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Total</span>
                <span className="font-mono font-bold text-white">{reviewItems.length}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[9px] uppercase font-bold text-emerald-400 block mb-0.5">Resolved</span>
                <span className="font-mono font-bold text-emerald-400">{resolvedReviews.length}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[9px] uppercase font-bold text-amber-400 block mb-0.5">Pending</span>
                <span className="font-mono font-bold text-amber-400">{pendingReviews.length}</span>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('review')}
              className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Open Review Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Nav */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onNavigateTab('pnl')}
              className="p-2.5 rounded-xl bg-[#0c1220] border border-slate-800 hover:border-slate-700 text-[10px] text-slate-400 hover:text-white transition-all flex flex-col items-center gap-1.5 cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold">P&L</span>
            </button>
            <button
              onClick={() => onNavigateTab('variance')}
              className="p-2.5 rounded-xl bg-[#0c1220] border border-slate-800 hover:border-slate-700 text-[10px] text-slate-400 hover:text-white transition-all flex flex-col items-center gap-1.5 cursor-pointer"
            >
              <GitCompare className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold">Variance</span>
            </button>
            <button
              onClick={() => onNavigateTab('intelligence')}
              className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/50 text-[10px] text-emerald-400 hover:text-emerald-300 transition-all flex flex-col items-center gap-1.5 cursor-pointer"
            >
              <span className="text-sm">🧠</span>
              <span className="font-semibold">Intelligence</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
