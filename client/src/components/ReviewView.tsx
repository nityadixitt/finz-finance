import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react';
import { ReviewItem, FinancialCategory, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';

function getAiRecommendation(item: ReviewItem): {
  treatmentTitle: string;
  recommendedCategory: FinancialCategory;
  includedInPnl: boolean;
  explanation: string;
  confidence: number;
} {
  const txn = item.transaction;
  const desc = (txn?.description || '').toLowerCase();
  const cp = (txn?.counterparty || '').toLowerCase();

  // Owner Distribution / Equity
  if (desc.includes('distribution') || desc.includes('equity') || cp.includes('owner') || desc.includes('draw')) {
    return {
      treatmentTitle: 'Equity Withdrawal (Capital Treatment)',
      recommendedCategory: 'NON_OPERATING',
      includedInPnl: false,
      explanation: 'Owner distributions represent balance sheet equity withdrawals, not operating expenses. This item should be excluded from Operating Profit.',
      confidence: 96,
    };
  }

  // Delivery Platforms (DoorDash / UberEats)
  if (cp.includes('doordash') || cp.includes('ubereats') || cp.includes('grubhub') || desc.includes('payout')) {
    return {
      treatmentTitle: 'Marketplace Commission Deduction (Gross vs Net)',
      recommendedCategory: 'OPERATING_EXPENSE',
      includedInPnl: true,
      explanation: 'Net payout includes deducted marketplace commission fees. Recommend classifying service fees as selling OpEx and gross orders as Revenue.',
      confidence: 88,
    };
  }

  // Commercial food suppliers (Sysco, Butcher, Produce)
  if (cp.includes('sysco') || cp.includes('us foods') || cp.includes('butcher') || cp.includes('produce') || cp.includes('beverage')) {
    return {
      treatmentTitle: 'Direct Culinary Food Cost (COGS vs OpEx)',
      recommendedCategory: 'COGS',
      includedInPnl: true,
      explanation: 'Commercial food & beverage inventory supplier directly tied to culinary output. Should be classified as COGS.',
      confidence: 95,
    };
  }

  // CapEx
  if (cp.includes('equipment') || desc.includes('appliance') || desc.includes('oven') || desc.includes('refrigerat')) {
    return {
      treatmentTitle: 'Capital Asset Acquisition (CapEx Treatment)',
      recommendedCategory: 'NON_OPERATING',
      includedInPnl: false,
      explanation: 'Long-term commercial equipment meeting capitalization thresholds. Should reside on Balance Sheet rather than period expense.',
      confidence: 91,
    };
  }

  return {
    treatmentTitle: 'Accounting Classification Review',
    recommendedCategory: (item.suggested_category as FinancialCategory) || 'OPERATING_EXPENSE',
    includedInPnl: true,
    explanation: item.notes || 'Unclassified transaction requires finance review to verify correct categorization.',
    confidence: Math.round(item.confidence * 100),
  };
}

interface ReviewViewProps {
  reviewItems: ReviewItem[];
  onResolveReview: (id: string, status: 'RESOLVED' | 'DISMISSED', notes?: string) => Promise<void>;
  onUpdateCategory: (
    txnId: string,
    newCategory: FinancialCategory,
    reason?: string,
    includedInPnl?: boolean
  ) => Promise<void>;
  onSelectTransaction: (txn: Transaction) => void;
}

export const ReviewView: React.FC<ReviewViewProps> = ({
  reviewItems,
  onResolveReview,
  onUpdateCategory,
  onSelectTransaction,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('PENDING');
  const [categoryOverrides, setCategoryOverrides] = useState<{ [itemId: string]: FinancialCategory }>({});
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const categories: FinancialCategory[] = [
    'REVENUE',
    'COGS',
    'PAYROLL',
    'OPERATING_EXPENSE',
    'NON_OPERATING',
  ];

  const filteredItems = reviewItems.filter((item) => {
    if (selectedStatus === 'ALL') return true;
    return item.status === selectedStatus;
  });

  const handleCategorySelect = (itemId: string, cat: FinancialCategory) => {
    setCategoryOverrides((prev) => ({ ...prev, [itemId]: cat }));
  };

  const _handleAcceptSuggested = async (item: ReviewItem) => {
    setResolvingId(item.id);
    try {
      // Confirm the suggested category
      await onUpdateCategory(
        item.transaction_id,
        item.suggested_category as FinancialCategory,
        'Accepted system suggested category'
      );
      await onResolveReview(item.id, 'RESOLVED', 'Accepted suggested category');
    } finally {
      setResolvingId(null);
    }
  };

  const handleApplyOverride = async (item: ReviewItem) => {
    const chosenCategory = categoryOverrides[item.id] || item.suggested_category;
    setResolvingId(item.id);
    try {
      await onUpdateCategory(
        item.transaction_id,
        chosenCategory as FinancialCategory,
        `Controller manual override to ${chosenCategory}`
      );
      await onResolveReview(item.id, 'RESOLVED', `Manually corrected to ${chosenCategory}`);
    } finally {
      setResolvingId(null);
    }
  };

  const handleExcludeFromPnl = async (item: ReviewItem) => {
    setResolvingId(item.id);
    try {
      await onUpdateCategory(
        item.transaction_id,
        'NON_OPERATING',
        'Excluded from operating P&L (Balance sheet / Inter-account movement)',
        false
      );
      await onResolveReview(item.id, 'RESOLVED', 'Excluded from P&L');
    } finally {
      setResolvingId(null);
    }
  };

  const handleDismiss = async (item: ReviewItem) => {
    setResolvingId(item.id);
    try {
      await onResolveReview(item.id, 'DISMISSED', 'Dismissed by controller without changes');
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight">Review Queue</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Items where classification confidence is low, transfers require judgment, or accounting treatment is ambiguous
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0c1220] border border-slate-800 text-xs">
          <button
            onClick={() => setSelectedStatus('PENDING')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              selectedStatus === 'PENDING'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending ({reviewItems.filter((i) => i.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setSelectedStatus('RESOLVED')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              selectedStatus === 'RESOLVED'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Resolved
          </button>
          <button
            onClick={() => setSelectedStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              selectedStatus === 'ALL'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Items
          </button>
        </div>
      </div>

      {/* Review Cards List */}
      <div className="space-y-4">
        {filteredItems.map((item) => {
          const txn = item.transaction;
          const currentCategory = categoryOverrides[item.id] || item.suggested_category;
          const isBusy = resolvingId === item.id;
          const pct = Math.round(item.confidence * 100);
          const isPending = item.status === 'PENDING';
          const rec = getAiRecommendation(item);

          return (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all ${
                isPending
                  ? 'bg-[#0d1424] border-amber-500/30 shadow-lg shadow-amber-500/5'
                  : 'bg-[#0c1220] border-slate-800 opacity-80'
              }`}
            >
              {/* Header: Flag Type, Transaction ID & Confidence / Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 mb-4 gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                    {item.flag_type.replace(/_/g, ' ')}
                  </span>
                  {txn && (
                    <span className="font-mono text-emerald-400 text-xs font-semibold">
                      [{txn.id}]
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-slate-400">
                    Confidence: <strong className="text-amber-400">{pct}%</strong>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isPending
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>

              {isPending ? (
                /* Split Layout: Evidence & Overrides on Left (7 cols) | AI Recommendation on Right (5 cols) */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                  {/* LEFT COLUMN: Transaction Record & Controller Override */}
                  <div className="lg:col-span-7 space-y-3 flex flex-col justify-between">
                    <div>
                      {txn && (
                        <div
                          onClick={() => onSelectTransaction(txn)}
                          className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 mb-3 cursor-pointer hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-mono text-slate-300 font-semibold">{txn.counterparty}</span>
                            <span className="text-slate-400 text-[11px] font-mono">{txn.date}</span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <div className="text-xs text-slate-400 max-w-[280px] truncate">{txn.description}</div>
                            <div className="text-right">
                              <span
                                className={`text-sm font-extrabold font-mono ${
                                  txn.amount > 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {txn.amount > 0 ? '+' : ''}
                                {formatCurrency(txn.amount)}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono ml-2">({txn.method})</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Engine Audit Flag */}
                      <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
                        <span className="text-slate-400 font-semibold block text-[10px] uppercase tracking-wider mb-0.5">
                          Engine Audit Flag:
                        </span>
                        {item.notes}
                      </div>
                    </div>

                    {/* Manual Controller Override */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-2">
                      <label className="block text-[11px] font-medium text-slate-400">
                        Manual Accounting Category Override:
                      </label>
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <select
                          value={currentCategory}
                          onChange={(e) =>
                            handleCategorySelect(item.id, e.target.value as FinancialCategory)
                          }
                          className="w-full sm:flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-medium focus:outline-none focus:border-emerald-500"
                        >
                          {categories.map((c) => (
                            <option key={c} value={c}>
                              {c} {c === item.suggested_category ? '(Suggested)' : ''}
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-1.5 w-full sm:w-auto">
                          <button
                            onClick={() => handleApplyOverride(item)}
                            disabled={isBusy}
                            className="flex-1 sm:flex-none py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Save</span>
                          </button>
                          <button
                            onClick={() => handleExcludeFromPnl(item)}
                            disabled={isBusy}
                            title="Exclude from P&L (Balance Sheet Transfer)"
                            className="py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs border border-slate-800 transition-colors cursor-pointer"
                          >
                            Exclude P&L
                          </button>
                          <button
                            onClick={() => handleDismiss(item)}
                            disabled={isBusy}
                            title="Dismiss Review Item"
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: AI Recommended Treatment */}
                  <div className="lg:col-span-5 flex flex-col justify-between p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 border-l-2 border-l-cyan-500 shadow-sm space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                        <div className="flex items-center gap-1.5 text-cyan-400">
                          <ShieldCheck className="w-4 h-4" />
                          <span className="text-[10px] font-mono uppercase font-bold tracking-wider">
                            Recommended Treatment
                          </span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700">
                          {rec.confidence}% confidence
                        </span>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase font-mono text-slate-400">Treatment Plan:</div>
                        <div className="text-xs font-bold text-white mt-0.5 text-cyan-300">
                          {rec.treatmentTitle}
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {rec.explanation}
                      </p>

                      <div className="text-[10px] font-mono text-emerald-400 pt-1">
                        P&L Impact: {rec.includedInPnl ? 'Included in Operating P&L' : 'Excluded from Operating P&L (Balance Sheet)'}
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        setResolvingId(item.id);
                        try {
                          await onUpdateCategory(
                            item.transaction_id,
                            rec.recommendedCategory,
                            `Applied treatment: ${rec.treatmentTitle}`,
                            rec.includedInPnl
                          );
                          await onResolveReview(
                            item.id,
                            'RESOLVED',
                            `Accepted recommendation (${rec.treatmentTitle})`
                          );
                        } finally {
                          setResolvingId(null);
                        }
                      }}
                      disabled={isBusy}
                      className="w-full py-2.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 mt-2"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>
                        Accept: {rec.recommendedCategory}{' '}
                        {rec.includedInPnl ? '(In P&L)' : '(Balance Sheet)'}
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Resolved View */
                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <CheckCircle className="w-4 h-4" />
                    <span>Resolved & Audited into General Ledger</span>
                  </div>
                  {txn && (
                    <span className="font-mono text-slate-400 text-[11px]">
                      {txn.counterparty} • {formatCurrency(txn.amount)}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="col-span-2 p-12 text-center rounded-2xl bg-[#0c1220] border border-slate-800">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No Review Items In Queue</h3>
            <p className="text-xs text-slate-400 mt-1">
              All transactions have passed confidence thresholds or have been manually reconciled.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
