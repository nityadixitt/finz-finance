import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  FileText,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Building2,
  Cpu,
} from 'lucide-react';
import { fetchExecutiveBriefing, ExecutiveBriefingData } from '../services/api';
import { formatCurrency } from '../utils/formatters';

interface AiExecutiveBriefingCardProps {
  isDemo?: boolean;
  onSelectCitation: (transactionId: string) => void;
}

export const AiExecutiveBriefingCard: React.FC<AiExecutiveBriefingCardProps> = ({
  isDemo,
  onSelectCitation,
}) => {
  const [briefing, setBriefing] = useState<ExecutiveBriefingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBriefing();
  }, [isDemo]);

  const loadBriefing = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchExecutiveBriefing(isDemo);
      setBriefing(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate executive briefing');
    } finally {
      setLoading(false);
    }
  };

  // Helper to parse citations like [TXN_...] and bold text
  const renderFormattedLine = (text: string) => {
    const citationRegex = /(\[?TXN[_-][A-Za-z0-9_-]+\]?)/g;
    const parts = text.split(citationRegex);

    return parts.map((part, idx) => {
      const match = part.match(/\[?(TXN[_-][A-Za-z0-9_-]+)\]?/);
      if (match) {
        const txnId = match[1];
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectCitation(txnId)}
            className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-300 font-mono text-[11px] font-semibold transition-all group cursor-pointer shadow-sm align-middle"
            title={`Inspect transaction [${txnId}] in ledger`}
          >
            <FileText className="w-2.5 h-2.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>[{txnId}]</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
          </button>
        );
      }

      if (part.includes('**')) {
        const segments = part.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={idx}>
            {segments.map((seg, sIdx) => {
              if (seg.startsWith('**') && seg.endsWith('**')) {
                return (
                  <strong key={sIdx} className="font-semibold text-white">
                    {seg.slice(2, -2)}
                  </strong>
                );
              }
              return seg;
            })}
          </span>
        );
      }

      return <span key={idx}>{part}</span>;
    });
  };

  if (loading && !briefing) {
    return (
      <div className="p-6 rounded-2xl bg-[#0b101d] border border-emerald-500/20 shadow-lg relative overflow-hidden animate-pulse">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <RefreshCw className="w-4 h-4 animate-spin" />
          </div>
          <div className="h-4 bg-slate-800 rounded w-48"></div>
        </div>
        <div className="h-4 bg-slate-800/80 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-slate-800/60 rounded w-1/2"></div>
      </div>
    );
  }

  if (error || !briefing) {
    return null;
  }

  const { metrics, keyDriver } = briefing;

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#0c1424] via-[#090e1a] to-[#0c1424] border border-emerald-500/25 shadow-xl relative overflow-hidden group">
      {/* Ambient background glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3.5 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                AI Executive Briefing
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Deterministic Math</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Grounded in underlying general ledger transactions</span>
            </p>
          </div>
        </div>

        {/* Quick Metrics Badges & Refresh */}
        <div className="flex items-center gap-2">
          {metrics.revenueGrowthPct !== 0 && (
            <div
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 border ${
                metrics.revenueGrowthPct >= 0
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}
            >
              {metrics.revenueGrowthPct >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>
                Revenue: {metrics.revenueGrowthPct >= 0 ? '+' : ''}
                {metrics.revenueGrowthPct}% MoM
              </span>
            </div>
          )}

          {metrics.grossMarginPct > 0 && (
            <div className="hidden md:flex px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-900 text-slate-300 border border-slate-800">
              GM: {metrics.grossMarginPct}%
            </div>
          )}

          <button
            onClick={loadBriefing}
            disabled={loading}
            title="Refresh AI briefing"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Headline */}
      <h4 className="text-sm sm:text-base font-bold text-slate-100 tracking-tight mb-3 relative z-10 leading-snug">
        {briefing.headline}
      </h4>

      {/* Bullet Points */}
      <div className="space-y-2 mb-4 relative z-10">
        {briefing.bulletPoints.map((bullet, idx) => (
          <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
            <div className="flex-1">{renderFormattedLine(bullet)}</div>
          </div>
        ))}
      </div>

      {/* Key Cost Driver Callout Banner */}
      {keyDriver && keyDriver.counterparty && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs relative z-10">
          <div className="flex items-center gap-2 text-slate-400">
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Primary Variance Driver:</span>
            <strong className="text-white font-medium">{keyDriver.counterparty}</strong>
            <span className="font-mono text-rose-400 font-bold">
              (+{formatCurrency(keyDriver.delta)})
            </span>
          </div>

          {keyDriver.transactionId && (
            <button
              onClick={() => onSelectCitation(keyDriver.transactionId)}
              className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
            >
              <span>Verify raw invoice [{keyDriver.transactionId}]</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
