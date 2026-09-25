import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Database,
  CheckCircle2,
  GitCompare,
  Download,
  Calculator,
  MessageSquare,
  Check,
  ChevronRight,
} from 'lucide-react';
import { getSampleCsvDownloadUrl } from '../services/api';

interface LandingPageProps {
  onEnterDemo: () => void;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterDemo, onOpenAuth }) => {
  // Interactive Feature Tab State
  const [activeTab, setActiveTab] = useState<'copilot' | 'variance' | 'simulation' | 'anomalies'>('copilot');

  // Interactive Simulation State in Landing Page
  const [simulationActive, setSimulationActive] = useState(false);

  // Interactive Copilot Query in Landing Page
  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0);

  const copilotPrompts = [
    {
      question: 'Why did March operating profit drop despite an 18.6% revenue increase?',
      toolCalled: 'get_variance_analysis("2026-02", "2026-03")',
      answer: `March revenue expanded from **$130,000** to **$154,122** (+18.6%), but Operating Profit fell by **$6,334** due to an asymmetric surge in expenses.

**Primary Cost Drivers Isolating the Drop:**
1. **Direct Culinary COGS (+$6,200)**: Expedited bulk purchase from **Sysco Food Supply** [TXN_1179] pushed raw food costs up +12.9%.
2. **Owner Distribution ($5,000)**: Non-operational owner draw [TXN_1180] was booked under general OpEx instead of equity withdrawal.
3. **Cloud & AI Compute (+$3,200)**: GPU infrastructure scaling on AWS [TXN_1142].

*Conclusion:* Reclassifying [TXN_1180] restores true operating profit to **$18,852** (12.2% margin).`,
      citations: ['TXN_1179', 'TXN_1180', 'TXN_1142'],
    },
    {
      question: 'Which specific vendors drove our COGS increase between Feb and Mar?',
      toolCalled: 'get_variance_drivers("COGS", "2026-02", "2026-03")',
      answer: `Cost of Goods Sold (COGS) increased by **+$6,167** (+12.9% MoM). 

**Exact Vendor Breakdown:**
• **Sysco Food Supply**: **+$6,200** (+28.8% spike) — Cites [TXN_1179] ($6,200 bulk kitchen replenishment).
• **Southern Glazer's Wine & Spirits**: **+$820** — Regular replenishment across [TXN_1165] and [TXN_1172].
• **Packaging Depot**: **-$853** — Bulk discount negotiated in early March.

*Variance Root Cause:* Food cost ratio increased from 36.9% to 41.2% of sales, indicating potential supplier price inflation or unbilled catering inventory.`,
      citations: ['TXN_1179', 'TXN_1165', 'TXN_1172'],
    },
    {
      question: 'Are there any duplicate charges or misclassified transactions in the ledger?',
      toolCalled: 'audit_risk_register("2026-03")',
      answer: `Our deterministic audit rules flagged **2 critical anomalies** in the March transaction stream:

1. **Potential Duplicate Billing ($350.00)**: Two identical charges to **SaaS Billing Sub** within 48 hours on 2026-03-14 ([TXN_1161]) and 2026-03-16 ([TXN_1164]).
2. **CapEx Misclassification ($4,200.00)**: Commercial kitchen refrigeration purchase from **Kitchen Equipment Co** [TXN_1155] booked as period OpEx. Should be capitalized to Balance Sheet Asset (Depreciation over 5 years).`,
      citations: ['TXN_1161', 'TXN_1164', 'TXN_1155'],
    },
  ];

  return (
    <div className="relative overflow-hidden pt-4 pb-24 text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Dynamic Ambient Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[420px] bg-gradient-to-b from-emerald-500/10 via-cyan-500/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-80 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-96 -right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* ─── 1. HERO SECTION ─────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-10 pb-16">
        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.14]">
          The AI Financial Analyst That{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Understands Your Finances.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
          Finz Finance combines a deterministic financial engine with an AI-powered financial copilot that analyzes cost drivers, flags anomalies, explains financial movements, and traces every answer back to the underlying transaction.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button
            onClick={onEnterDemo}
            id="hero-launch-demo-btn"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:opacity-95 rounded-xl shadow-lg shadow-emerald-500/15 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <span>Launch Live CFO Demo</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onOpenAuth('signup')}
            id="hero-signup-btn"
            className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all"
          >
            Create Workspace
          </button>

          <a
            href={getSampleCsvDownloadUrl()}
            download="finz_sample_transactions.csv"
            id="hero-download-csv-btn"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition-all"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download Bank CSV Template</span>
          </a>
        </div>

        {/* Proof Matrix Ribbon */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto text-left">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-xl font-bold font-mono text-emerald-400">0%</div>
            <div className="text-[11px] text-slate-400 font-medium">Math Hallucinations</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-xl font-bold font-mono text-cyan-400">100%</div>
            <div className="text-[11px] text-slate-400 font-medium">Verifiable GL Citations</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-xl font-bold font-mono text-teal-400">&lt;200ms</div>
            <div className="text-[11px] text-slate-400 font-medium">Deterministic SQL Aggregations</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-xl font-bold font-mono text-amber-400">1-Click</div>
            <div className="text-[11px] text-slate-400 font-medium">Reconciliation & Reclassifications</div>
          </div>
        </div>
      </section>

      {/* ─── 2. INTERACTIVE FEATURE SHOWCASE ─────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            Platform Capabilities
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
            Four Layers of Financial Intelligence
          </h2>
          <p className="mt-2 text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
            Interact with our live architectural modules below to see how Finz replaces manual spreadsheet analysis with verifiable AI.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab('copilot')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'copilot'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>1. Grounded Copilot (Ask AI)</span>
          </button>

          <button
            onClick={() => setActiveTab('variance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'variance'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>2. Root-Cause Variance Bridge</span>
          </button>

          <button
            onClick={() => setActiveTab('simulation')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'simulation'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>3. Pro-Forma Impact Simulation</span>
          </button>

          <button
            onClick={() => setActiveTab('anomalies')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'anomalies'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>4. Anomaly & Duplicate Audit</span>
          </button>
        </div>

        {/* Dynamic Interactive Tab Content */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1220] p-6 shadow-2xl">
          {/* TAB 1: GROUNDED COPILOT */}
          {activeTab === 'copilot' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Sample Inquiries */}
              <div className="lg:col-span-4 space-y-2.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                  Click Inquiries to Test Grounding:
                </span>
                {copilotPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedPromptIndex(idx)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                      selectedPromptIndex === idx
                        ? 'bg-slate-800/90 border-emerald-500/50 text-white font-medium shadow-sm'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <ChevronRight
                        className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                          selectedPromptIndex === idx ? 'text-emerald-400' : 'text-slate-600'
                        }`}
                      />
                      <span>{p.question}</span>
                    </div>
                  </button>
                ))}

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400">
                  <div className="font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-cyan-400" />
                    <span>How This Works Behind the Scenes</span>
                  </div>
                  The AI doesn't calculate math in text tokens. It calls deterministic SQL functions (<code className="text-cyan-300 font-mono">get_variance_analysis</code>) to obtain certified aggregations, then synthesizes a human narrative citing transaction IDs.
                </div>
              </div>

              {/* Right Column: Live Simulated Response */}
              <div className="lg:col-span-8 flex flex-col justify-between rounded-xl bg-slate-950/80 border border-slate-800 p-4">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold text-white">Finz Grounded Financial Copilot</span>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/50">
                      Tool: {copilotPrompts[selectedPromptIndex].toolCalled}
                    </span>
                  </div>

                  <div className="prose prose-invert max-w-none text-xs text-slate-200 leading-relaxed whitespace-pre-line space-y-2">
                    {copilotPrompts[selectedPromptIndex].answer}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-300">Auditable Citations:</span>
                    {copilotPrompts[selectedPromptIndex].citations.map((c) => (
                      <span
                        key={c}
                        className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono text-[10px] font-bold"
                      >
                        [{c}]
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={onEnterDemo}
                    className="text-emerald-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Test In Live Chat</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VARIANCE ENGINE */}
          {activeTab === 'variance' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-3">
                <h3 className="text-base font-bold text-white">
                  Automated Month-over-Month Variance Decomposition
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Financial controllers spend hours building Excel bridge models to explain why Operating Profit shifted. Finz Finance computes the entire MoM bridge automatically, isolating top supplier cost spikes and revenue drivers.
                </p>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>February Operating Profit:</span>
                    <span className="font-mono font-bold text-white">$7,518</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Revenue Expansion Driver:</span>
                    <span className="font-mono font-bold text-emerald-400">+$24,123</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>COGS Expansion Driver:</span>
                    <span className="font-mono font-bold text-rose-400">-$6,167</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Operating Expense Surge:</span>
                    <span className="font-mono font-bold text-rose-400">-$11,622</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center font-bold text-cyan-300">
                    <span>March Operating Profit:</span>
                    <span className="font-mono text-sm">$13,852 (+84.2%)</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 rounded-xl bg-slate-950/80 border border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                  <span className="font-bold text-white">Counterparty Driver Waterfall (March vs Feb)</span>
                  <span className="text-[10px] text-slate-400 font-mono">Ranked by Absolute Impact</span>
                </div>
                <div className="space-y-2 font-mono text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">Acme Global Enterprise Contract</div>
                      <div className="text-[10px] text-slate-400">Revenue Volume Expansion • Cites [TXN_021]</div>
                    </div>
                    <span className="text-emerald-400 font-bold text-sm">+$24,122</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">Sysco Food Supply Replenishment</div>
                      <div className="text-[10px] text-slate-400">Culinary COGS Cost Spike • Cites [TXN_1179]</div>
                    </div>
                    <span className="text-rose-400 font-bold text-sm">-$6,200</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">Owner Draw Disbursal</div>
                      <div className="text-[10px] text-slate-400">Non-Operational Outflow • Cites [TXN_1180]</div>
                    </div>
                    <span className="text-rose-400 font-bold text-sm">-$5,000</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SIMULATION ENGINE */}
          {activeTab === 'simulation' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 space-y-3">
                <h3 className="text-base font-bold text-white">
                  Pro-Forma Accounting Impact Simulation
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  In small business accounting, non-operational transactions (like founder equity draws or kitchen equipment CapEx) frequently get miscoded into Operating Expenses, artificially suppressing company valuation.
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Finz lets you simulate reclassifying these items before committing them to the permanent general ledger:
                </p>

                {/* Interactive Toggle */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Simulate Owner Draw Reclassification:</span>
                    <button
                      onClick={() => setSimulationActive(!simulationActive)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        simulationActive
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-800 text-slate-300 border border-slate-700 hover:text-white'
                      }`}
                    >
                      {simulationActive ? '✓ Reclassification Applied' : 'Simulate Removal'}
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Moves <strong className="text-white">$5,000</strong> owner draw ([TXN_1180]) out of Operating Expenses to Balance Sheet Equity.
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 rounded-xl bg-slate-950/80 border border-slate-800 p-5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-2">
                    EBITDA / Operating Profit Impact Comparison
                  </span>
                  <div className="grid grid-cols-2 gap-3 text-center mb-4">
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">Reported Operating Profit</div>
                      <div className="text-xl font-bold font-mono text-slate-200 mt-1">$13,852</div>
                      <div className="text-[10px] text-slate-500">9.0% EBIT Margin</div>
                    </div>
                    <div className={`p-3 rounded-lg border transition-all ${
                      simulationActive
                        ? 'bg-emerald-950/30 border-emerald-500/50'
                        : 'bg-slate-900 border-slate-800'
                    }`}>
                      <div className="text-[10px] text-emerald-400 uppercase font-semibold">Pro-Forma Operating Profit</div>
                      <div className={`text-xl font-bold font-mono mt-1 ${
                        simulationActive ? 'text-emerald-300' : 'text-slate-400'
                      }`}>
                        {simulationActive ? '$18,852' : '$13,852'}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-semibold">
                        {simulationActive ? '12.2% Margin (+3.2%)' : 'Toggle to simulate'}
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <strong>Valuation Impact:</strong> At a standard 6x EBITDA multiple, adjusting this $5,000 miscoded owner distribution increases company enterprise value by <strong className="text-emerald-400">+$30,000</strong>.
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={onEnterDemo}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open Live Simulator in Demo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ANOMALIES & AUDITING */}
          {activeTab === 'anomalies' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-3">
                <h3 className="text-base font-bold text-white">
                  Continuous Ledger Quality & Anomaly Radar
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Finz automatically flags ambiguous bank narratives, repeated duplicate wire transfers, and margin inconsistencies into a Human-In-The-Loop review queue.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>Flag 1: High-value owner distribution coded as OpEx</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Flag 2: 48-hour duplicate payment pattern to SaaS vendor</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-cyan-400" />
                    <span>Flag 3: Margin distortion in commercial culinary orders</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 rounded-xl bg-slate-950/80 border border-slate-800 p-4 space-y-3">
                <span className="text-xs font-bold text-white block">
                  AI Recommended Treatment & 1-Click Ledger Action:
                </span>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-500/30 border-l-4 border-l-cyan-400 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-cyan-400 font-bold text-[11px] uppercase">
                      Recommended Treatment: Equity Withdrawal
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      96% Confidence
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Transaction [TXN_1180] represents a $5,000 owner draw. Owner distributions are balance sheet equity withdrawals, not operating expenses.
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      Impact: Removes $5,000 from March Overhead
                    </span>
                    <button
                      onClick={onEnterDemo}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept Treatment</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── 3. GROUNDED AI VS GENERIC LLM BENCHMARK ────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            Why Generic AI Fails in Finance
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
            The Fundamental Flaw in "Chat With CSV" Apps
          </h2>
          <p className="mt-2 text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
            LLMs cannot do exact multi-column relational arithmetic without hallucinating. Finz Finance solves this with strict architectural separation.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0c1220] shadow-xl">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-4 px-6 w-1/4">Financial Capability</th>
                <th className="py-4 px-6 w-[37.5%] text-rose-400 bg-rose-950/20">Generic "Chat with CSV" Apps</th>
                <th className="py-4 px-6 w-[37.5%] text-emerald-400 bg-emerald-950/30 border-l border-emerald-500/20">Finz Finance Architecture</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              <tr className="hover:bg-slate-900/30 transition-colors">
                <td className="py-4 px-6 font-semibold text-white">Mathematical Accuracy</td>
                <td className="py-4 px-6 text-slate-300 bg-rose-950/5 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold shrink-0 mt-0.5">❌</span>
                    <span>LLMs are not reliable for deterministic financial arithmetic.</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-slate-200 bg-emerald-950/10 border-l border-emerald-500/20 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                    <span>Deterministic SQL calculations executed via database SUM/GROUP queries.</span>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-slate-900/30 transition-colors">
                <td className="py-4 px-6 font-semibold text-white">Audit Trail & Evidence</td>
                <td className="py-4 px-6 text-slate-300 bg-rose-950/5 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold shrink-0 mt-0.5">❌</span>
                    <span>Answers without transaction-level evidence are difficult to verify.</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-slate-200 bg-emerald-950/10 border-l border-emerald-500/20 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                    <span>Clickable citation pills <code className="text-emerald-400 font-mono text-[10px]">[TXN_...]</code> link directly to underlying bank transactions.</span>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-slate-900/30 transition-colors">
                <td className="py-4 px-6 font-semibold text-white">P&L & Accounting Logic</td>
                <td className="py-4 px-6 text-slate-300 bg-rose-950/5 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold shrink-0 mt-0.5">❌</span>
                    <span>Generic summaries can misclassify transactions or blur accounting treatment.</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-slate-200 bg-emerald-950/10 border-l border-emerald-500/20 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                    <span>Deterministic Revenue, COGS, Payroll, and OpEx classification engine.</span>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-slate-900/30 transition-colors">
                <td className="py-4 px-6 font-semibold text-white">Human-In-The-Loop Reviews</td>
                <td className="py-4 px-6 text-slate-300 bg-rose-950/5 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold shrink-0 mt-0.5">❌</span>
                    <span>Chat-only corrections don't necessarily persist to the financial data.</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-slate-200 bg-emerald-950/10 border-l border-emerald-500/20 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                    <span>Persistent review queue. Corrections recompute the live P&L.</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── 4. 4-STEP CONTROLLER WORKFLOW ──────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-800/80">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            Autonomous Pipeline
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
            How Bank CSVs Become Executive Intelligence
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs mb-3">
              1
            </div>
            <h4 className="text-sm font-bold text-white">Ingest Any Bank CSV</h4>
            <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
              Auto-detects transaction ID, dates, narrations, counterparties, amounts, and payment rails. Normalizes signed debits and credits.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs mb-3">
              2
            </div>
            <h4 className="text-sm font-bold text-white">Deterministic P&L Engine</h4>
            <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
              Computes Gross Profit, Operating Expenses, and Operating Margin across months with pure mathematical rigor.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs mb-3">
              3
            </div>
            <h4 className="text-sm font-bold text-white">Root-Cause Driver Isolation</h4>
            <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
              Automatically builds counterparty waterfalls to explain exactly which vendors drove margin expansion or contraction.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-xs mb-3">
              4
            </div>
            <h4 className="text-sm font-bold text-white">Grounded AI Copilot</h4>
            <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
              Answers complex financial inquiries by calling backend database tools, providing verifiable evidence chips for every number.
            </p>
          </div>
        </div>
      </section>

      {/* ─── 5. FINAL HIGH-CONVERTING CTA BANNER ─────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 text-center">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-500/30 p-8 sm:p-12 shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ready for Immediate Testing</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Experience the Financial Engine in Action
          </h2>
          <p className="mt-3 text-slate-300 text-xs sm:text-sm max-w-lg mx-auto">
            Test with our preloaded 3-month dataset showing revenue expansion, supplier cost spikes, and review queue items.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onEnterDemo}
              id="cta-bottom-demo-btn"
              className="px-8 py-3.5 text-sm font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:opacity-95 rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Launch Interactive Demo →
            </button>
            <button
              onClick={() => onOpenAuth('signup')}
              id="cta-bottom-signup-btn"
              className="px-6 py-3.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-800/80 rounded-xl border border-slate-700 transition-all"
            >
              Sign Up Free
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
