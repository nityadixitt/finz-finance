import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  FileText,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Building2,
  GitCompare,
} from 'lucide-react';
import { fetchVarianceNarrative, VarianceNarrativeData } from '../services/api';
import { formatCurrency } from '../utils/formatters';

interface AiVarianceDiagnosticCardProps {
  baseMonth: string;
  comparisonMonth: string;
  baseOperatingProfit: number;
  comparisonOperatingProfit: number;
  netChange: number;
  baseMonthName: string;
  comparisonMonthName: string;
  onSelectCitation: (transactionId: string) => void;
  isDemo?: boolean;
}

export const AiVarianceDiagnosticCard: React.FC<AiVarianceDiagnosticCardProps> = ({
  baseMonth,
  comparisonMonth,
  baseOperatingProfit,
  comparisonOperatingProfit,
  netChange,
  baseMonthName,
  comparisonMonthName,
  onSelectCitation,
  isDemo,
}) => {
  const [data, setData] = useState<VarianceNarrativeData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDiagnostic();
  }, [baseMonth, comparisonMonth, isDemo]);

  const loadDiagnostic = async () => {
    setLoading(true);
    try {
      const res = await fetchVarianceNarrative(baseMonth, comparisonMonth, isDemo);
      setData(res);
    } catch (err) {
      console.warn('Variance narrative lookup notice:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to parse citations
  const renderFormattedText = (text: string) => {
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
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#0c1424] via-[#0a0f1d] to-[#0c1424] border border-emerald-500/25 shadow-xl relative overflow-hidden group">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
            <GitCompare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                AI Root-Cause Diagnostic Bridge
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-semibold">
                Variance AI Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Explaining mathematical bridge deltas with underlying evidence</span>
            </p>
          </div>
        </div>

        <button
          onClick={loadDiagnostic}
          disabled={loading}
          title="Re-compute AI diagnostic"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Narrative Body */}
      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal mb-4">
        {data ? renderFormattedText(data.narrative) : 'Analyzing operating profit bridge drivers across general ledger entries...'}
      </p>

      {/* Top Favorable / Unfavorable Driver Badges */}
      {data && data.topDrivers && data.topDrivers.length > 0 && (
        <div className="flex flex-wrap items-center gap-2.5 mb-4">
          {data.topDrivers.map((d, idx) => (
            <div
              key={idx}
              className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 ${
                d.impact === 'FAVORABLE'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              }`}
            >
              {d.impact === 'FAVORABLE' ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span className="font-semibold text-white">{d.counterparty}:</span>
              <span className="font-mono font-bold">
                {d.impact === 'FAVORABLE' ? '+' : '-'}
                {formatCurrency(Math.abs(d.delta))}
              </span>
              {d.transactionId && (
                <button
                  type="button"
                  onClick={() => onSelectCitation(d.transactionId)}
                  className="ml-1 text-[11px] font-mono text-cyan-400 hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  <span>[{d.transactionId}]</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Mathematical Bridge Summary Bar */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-mono text-slate-400 border-t border-slate-800/80 pt-3">
        <span>
          Base ({baseMonthName}):{' '}
          <strong className="text-white">{formatCurrency(baseOperatingProfit)}</strong>
        </span>
        <span className="text-slate-600">➔</span>
        <span>
          Target ({comparisonMonthName}):{' '}
          <strong className="text-white">{formatCurrency(comparisonOperatingProfit)}</strong>
        </span>
        <span className="text-slate-600">=</span>
        <span
          className={`font-bold ${
            netChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          Net Delta: {netChange >= 0 ? '+' : ''}
          {formatCurrency(netChange)}
        </span>
      </div>
    </div>
  );
};
