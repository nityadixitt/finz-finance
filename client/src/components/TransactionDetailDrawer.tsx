import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  AlertTriangle,
  History,
  Save,
  CheckCircle,
  Building2,
  Calendar,
  CreditCard,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Transaction, FinancialCategory } from '../types';
import { formatCurrency } from '../utils/formatters';

interface TransactionDetailDrawerProps {
  transaction: Transaction | null;
  onClose: () => void;
  onUpdateCategory: (
    id: string,
    newCategory: FinancialCategory,
    reason?: string,
    includedInPnl?: boolean
  ) => Promise<void>;
}

export const TransactionDetailDrawer: React.FC<TransactionDetailDrawerProps> = ({
  transaction,
  onClose,
  onUpdateCategory,
}) => {
  if (!transaction) return null;

  const [selectedCategory, setSelectedCategory] = useState<FinancialCategory>(transaction.category);
  const [reason, setReason] = useState('');
  const [includedInPnl, setIncludedInPnl] = useState(transaction.included_in_pnl);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const categories: FinancialCategory[] = [
    'REVENUE',
    'COGS',
    'PAYROLL',
    'OPERATING_EXPENSE',
    'NON_OPERATING',
  ];

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await onUpdateCategory(
        transaction.id,
        selectedCategory,
        reason || 'Manual update via Transaction Detail Modal',
        includedInPnl
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-[#0c1322] border border-emerald-500/30 rounded-2xl p-6 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_35px_rgba(16,185,129,0.15)] flex flex-col max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <span className="font-mono text-sm font-bold text-white">
                [{transaction.id}]
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                Ledger Record
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

            {/* Amount Banner */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 mb-6 text-center">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                Net Transaction Amount
              </span>
              <div
                className={`text-3xl font-extrabold font-mono ${
                  transaction.amount > 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {transaction.amount > 0 ? '+' : ''}
                {formatCurrency(transaction.amount)}
              </div>
              <div className="mt-1 flex items-center justify-center gap-2 text-xs text-slate-400">
                <span>{transaction.date}</span>
                <span>•</span>
                <span className="font-mono">{transaction.method}</span>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="space-y-3 mb-6 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-800/80">
                <span className="text-slate-400 font-medium">Counterparty</span>
                <span className="text-white font-semibold">{transaction.counterparty}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/80">
                <span className="text-slate-400 font-medium">Bank Narration</span>
                <span className="text-slate-200 text-right max-w-[200px] truncate">
                  {transaction.description}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/80">
                <span className="text-slate-400 font-medium">Classification Confidence</span>
                <span className="text-emerald-400 font-mono font-bold">
                  {(transaction.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/80">
                <span className="text-slate-400 font-medium">P&L Treatment</span>
                <span
                  className={`font-semibold ${
                    transaction.included_in_pnl ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {transaction.included_in_pnl ? 'Included in Operating P&L' : 'Excluded (Balance Sheet)'}
                </span>
              </div>
            </div>

            {/* Classification Override Form */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 mb-6">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Classification & Accounting Treatment</span>
              </h4>

              <form onSubmit={handleSave} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as FinancialCategory)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Audit Note / Reason for Change
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Verified raw material vendor invoice #1029"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="includeInPnlCheck"
                    checked={includedInPnl}
                    onChange={(e) => setIncludedInPnl(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                  />
                  <label htmlFor="includeInPnlCheck" className="text-xs text-slate-300 cursor-pointer">
                    Include in Operating P&L calculations
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Updating Ledger...' : 'Persist Classification Change'}</span>
                </button>

                {saveSuccess && (
                  <div className="text-[11px] text-emerald-400 text-center flex items-center justify-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Correction saved & P&L recomputed.</span>
                  </div>
                )}
              </form>
            </div>

            {/* Audit Trail Section */}
            {transaction.corrections && transaction.corrections.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-3">
                  <History className="w-4 h-4 text-cyan-400" />
                  <span>Correction Audit Trail</span>
                </div>
                <div className="space-y-2">
                  {transaction.corrections.map((corr) => (
                    <div
                      key={corr.id}
                      className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px]"
                    >
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="font-semibold text-white">
                          {corr.old_category} ➔ {corr.new_category}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(corr.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[10px]">{corr.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 text-center">
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Dismiss Record</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-750 text-[10px] text-slate-400 font-mono">
                Esc
              </kbd>
            </button>
          </div>
        </div>
      </div>
    );
  };
