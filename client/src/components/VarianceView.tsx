import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  Layers,
  Building2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  VarianceAnalysisReport,
  CategoryDriverBreakdown,
  CounterpartyDriver,
  FinancialCategory,
  Transaction,
} from '../types';
import { fetchVariance, fetchCategoryDrivers } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { AiVarianceDiagnosticCard } from './AiVarianceDiagnosticCard';

interface VarianceViewProps {
  availableMonths: string[];
  onSelectTransaction: (txn: Transaction) => void;
  transactions: Transaction[];
  onSelectCitation?: (transactionId: string) => void;
}

export const VarianceView: React.FC<VarianceViewProps> = ({
  availableMonths,
  onSelectTransaction,
  transactions,
  onSelectCitation,
}) => {
  const [baseMonth, setBaseMonth] = useState<string>(
    availableMonths.length > 1 ? availableMonths[availableMonths.length - 2] : '2026-02'
  );
  const [comparisonMonth, setComparisonMonth] = useState<string>(
    availableMonths.length > 0 ? availableMonths[availableMonths.length - 1] : '2026-03'
  );

  const [report, setReport] = useState<VarianceAnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected category for driver decomposition
  const [selectedCategory, setSelectedCategory] = useState<FinancialCategory>('COGS');
  const [driversData, setDriversData] = useState<CategoryDriverBreakdown | null>(null);
  const [driversLoading, setDriversLoading] = useState(false);
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);

  // Load variance report when months change
  useEffect(() => {
    if (!baseMonth || !comparisonMonth) return;
    loadReport();
  }, [baseMonth, comparisonMonth]);

  // Load category drivers when category or months change
  useEffect(() => {
    if (!baseMonth || !comparisonMonth || !selectedCategory) return;
    loadDrivers();
  }, [baseMonth, comparisonMonth, selectedCategory]);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVariance(baseMonth, comparisonMonth);
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to compute variance');
    } finally {
      setLoading(false);
    }
  };

  const loadDrivers = async () => {
    setDriversLoading(true);
    try {
      const data = await fetchCategoryDrivers(selectedCategory, baseMonth, comparisonMonth);
      setDriversData(data);
      // Auto-expand first driver
      if (data.drivers.length > 0) {
        setExpandedVendor(data.drivers[0].counterparty);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setDriversLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Month Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight">Variance &amp; Drivers</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            MoM bridge — what changed, by how much, and the exact vendor drivers
          </p>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#0c1220] border border-slate-800">
          <select
            value={baseMonth}
            onChange={(e) => setBaseMonth(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 focus:outline-none"
          >
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <span className="text-slate-500 font-bold text-xs">➔</span>

          <select
            value={comparisonMonth}
            onChange={(e) => setComparisonMonth(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-emerald-500/50 text-xs font-semibold text-emerald-400 focus:outline-none"
          >
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
          <span>Computing deterministic variance bridge...</span>
        </div>
      )}

      {report && (
        <>
          {/* Native AI Root-Cause Diagnostic Bridge */}
          <AiVarianceDiagnosticCard
            baseMonth={baseMonth}
            comparisonMonth={comparisonMonth}
            baseOperatingProfit={report.operatingProfitBridge.baseOperatingProfit}
            comparisonOperatingProfit={report.operatingProfitBridge.comparisonOperatingProfit}
            netChange={report.operatingProfitBridge.netChange}
            baseMonthName={report.baseMonthName}
            comparisonMonthName={report.comparisonMonthName}
            onSelectCitation={(txnId) => {
              if (onSelectCitation) {
                onSelectCitation(txnId);
              } else {
                const found = transactions.find((t) => t.id === txnId);
                if (found) onSelectTransaction(found);
              }
            }}
          />

          {/* Line Item Variance Table */}
          <div className="rounded-2xl bg-[#0c1220] border border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white">Line-Item Waterfall Comparison</span>
              <span className="text-[11px] text-slate-400">Click a category row below to drill into vendor drivers</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-3 px-4 font-sans">Line Item</th>
                    <th className="py-3 px-4 text-right font-sans">{report.baseMonthName}</th>
                    <th className="py-3 px-4 text-right font-sans">{report.comparisonMonthName}</th>
                    <th className="py-3 px-4 text-right font-sans">Change ($)</th>
                    <th className="py-3 px-4 text-right font-sans">Change (%)</th>
                    <th className="py-3 px-4 text-center font-sans">Impact</th>
                    <th className="py-3 px-4 text-center font-sans">Drilldown</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {report.lineItems.map((item) => {
                    const isSelectable =
                      item.categoryKey &&
                      ['REVENUE', 'COGS', 'PAYROLL', 'OPERATING_EXPENSE'].includes(item.categoryKey);
                    const isSelected = selectedCategory === item.categoryKey;

                    return (
                      <tr
                        key={item.lineItem}
                        onClick={
                          isSelectable
                            ? () => setSelectedCategory(item.categoryKey as FinancialCategory)
                            : undefined
                        }
                        className={`transition-colors ${
                          isSelectable ? 'cursor-pointer hover:bg-slate-900/60' : ''
                        } ${isSelected ? 'bg-emerald-950/20 border-l-2 border-emerald-400' : ''}`}
                      >
                        <td className="py-3.5 px-4 font-sans font-semibold text-slate-200">
                          {item.lineItem}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-300">
                          {formatCurrency(item.baseAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-300 font-bold">
                          {formatCurrency(item.comparisonAmount)}
                        </td>
                        <td
                          className={`py-3.5 px-4 text-right font-bold ${
                            item.absoluteDelta > 0 ? 'text-emerald-400' : item.absoluteDelta < 0 ? 'text-rose-400' : 'text-slate-400'
                          }`}
                        >
                          {item.absoluteDelta > 0 ? '+' : ''}
                          {formatCurrency(item.absoluteDelta)}
                        </td>
                        <td
                          className={`py-3.5 px-4 text-right font-bold ${
                            item.percentageDelta > 0 ? 'text-emerald-400' : item.percentageDelta < 0 ? 'text-rose-400' : 'text-slate-400'
                          }`}
                        >
                          {item.percentageDelta > 0 ? '+' : ''}
                          {item.percentageDelta}%
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.impactOnProfit === 'FAVORABLE'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : item.impactOnProfit === 'UNFAVORABLE'
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {item.impactOnProfit}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isSelectable ? (
                            <button className="text-xs font-semibold text-emerald-400 hover:underline flex items-center justify-center gap-1 mx-auto">
                              <span>Decompose</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Category Driver Decomposition Panel */}
          <div className="rounded-2xl bg-[#0c1220] border border-slate-800 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">
                    Vendor Driver Breakdown: {driversData?.categoryName || selectedCategory}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Explains the {formatCurrency(driversData?.categoryDelta || 0)} change by ranking top contributing counterparties
                </p>
              </div>

              {/* Category Pill Switcher */}
              <div className="flex items-center gap-1.5">
                {(['REVENUE', 'COGS', 'OPERATING_EXPENSE', 'PAYROLL'] as FinancialCategory[]).map(
                  (cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        selectedCategory === cat
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </div>

            {driversLoading && (
              <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Decomposing vendor drivers...</span>
              </div>
            )}

            {driversData && !driversLoading && (
              <div className="space-y-3">
                {driversData.drivers.map((driver) => {
                  const isExpanded = expandedVendor === driver.counterparty;
                  const matchingTxns = transactions.filter((t) =>
                    driver.transactionIds.includes(t.id)
                  );

                  return (
                    <div
                      key={driver.counterparty}
                      className="rounded-xl border border-slate-800/80 bg-slate-900/60 overflow-hidden"
                    >
                      {/* Driver Row Header */}
                      <div
                        onClick={() =>
                          setExpandedVendor(isExpanded ? null : driver.counterparty)
                        }
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-850/60 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <button className="text-slate-400">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white text-xs sm:text-sm">
                                {driver.counterparty}
                              </span>
                              <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded bg-slate-800 font-mono">
                                {driver.transactionCount} transactions
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                              Base: {formatCurrency(driver.baseAmount)} ➔ Target:{' '}
                              {formatCurrency(driver.comparisonAmount)}
                            </div>
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <div
                            className={`text-sm font-bold ${
                              driver.delta > 0 ? 'text-emerald-400' : driver.delta < 0 ? 'text-rose-400' : 'text-slate-400'
                            }`}
                          >
                            {driver.delta > 0 ? '+' : ''}
                            {formatCurrency(driver.delta)}
                          </div>
                          <span className="text-[10px] text-slate-500 font-sans">
                            {isExpanded ? 'Hide Traceability' : 'Inspect Transactions →'}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Traceability: Underlying Transactions */}
                      {isExpanded && (
                        <div className="p-4 bg-slate-950/80 border-t border-slate-800/80">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              Verifiable Source Transactions ({matchingTxns.length})
                            </span>
                            <span className="text-[10px] text-emerald-400">
                              Click any transaction to view full audit drawer
                            </span>
                          </div>

                          <div className="space-y-1.5 font-mono text-xs">
                            {matchingTxns.map((t) => (
                              <div
                                key={t.id}
                                onClick={() => onSelectTransaction(t)}
                                className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-850 cursor-pointer flex items-center justify-between transition-all group"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-emerald-400 font-bold text-[11px]">
                                    [{t.id}]
                                  </span>
                                  <span className="text-slate-400 text-[11px]">{t.date}</span>
                                  <span className="text-slate-200 font-sans text-xs truncate max-w-[200px] sm:max-w-xs">
                                    {t.description}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`font-bold ${
                                      t.amount > 0 ? 'text-emerald-400' : 'text-rose-400'
                                    }`}
                                  >
                                    {t.amount > 0 ? '+' : ''}
                                    {formatCurrency(t.amount)}
                                  </span>
                                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
