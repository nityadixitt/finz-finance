import React, { useState } from 'react';
import {
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  ArrowUpDown,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import { Transaction, FinancialCategory } from '../types';
import { formatCurrency } from '../utils/formatters';

interface TransactionsViewProps {
  transactions: Transaction[];
  onSelectTransaction: (txn: Transaction) => void;
  onUpdateCategory: (id: string, newCategory: FinancialCategory, reason?: string) => Promise<void>;
  selectedMonthFilter?: string;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  onSelectTransaction,
  onUpdateCategory,
  selectedMonthFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [reviewOnlyFilter, setReviewOnlyFilter] = useState(false);
  const [editingTxnId, setEditingTxnId] = useState<string | null>(null);
  const [tempCategory, setTempCategory] = useState<FinancialCategory>('OPERATING_EXPENSE');
  const [savingId, setSavingId] = useState<string | null>(null);

  const categories: FinancialCategory[] = [
    'REVENUE',
    'COGS',
    'PAYROLL',
    'OPERATING_EXPENSE',
    'NON_OPERATING',
  ];

  const filteredTransactions = transactions.filter((t) => {
    if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
    if (reviewOnlyFilter && !t.is_review_required) return false;
    if (selectedMonthFilter && !t.date.startsWith(selectedMonthFilter)) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        t.id.toLowerCase().includes(q) ||
        t.counterparty.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.method.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleStartEdit = (txn: Transaction, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTxnId(txn.id);
    setTempCategory(txn.category);
  };

  const handleSaveEdit = async (txnId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavingId(txnId);
    try {
      await onUpdateCategory(txnId, tempCategory, 'Manual correction from Ledger table');
      setEditingTxnId(null);
    } finally {
      setSavingId(null);
    }
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTxnId(null);
  };

  const getConfidenceBadge = (confidence: number, isReview: boolean) => {
    const pct = Math.round(confidence * 100);
    if (isReview || pct < 70) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <AlertTriangle className="w-3 h-3" />
          {pct}% Review
        </span>
      );
    }
    if (pct >= 90) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <CheckCircle className="w-3 h-3" />
          {pct}%
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
        {pct}%
      </span>
    );
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight">General Ledger</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Transaction ID · Date · Counterparty · Amount · Classification
          </p>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Showing <strong className="text-white">{filteredTransactions.length}</strong> of{' '}
          <strong className="text-white">{transactions.length}</strong> transactions
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0c1220] border border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Counterparty, ID, Description..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 text-xs text-slate-400 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={() => setReviewOnlyFilter(!reviewOnlyFilter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              reviewOnlyFilter
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Review Items Only</span>
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-2xl bg-[#0c1220] border border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/70 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Counterparty</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Confidence</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredTransactions.map((txn) => {
                const isEditing = editingTxnId === txn.id;
                const amt = txn.amount;

                return (
                  <tr
                    key={txn.id}
                    onClick={() => onSelectTransaction(txn)}
                    className="hover:bg-slate-900/50 cursor-pointer transition-colors"
                  >
                    {/* ID */}
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {txn.id}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">{txn.date}</td>

                    {/* Counterparty */}
                    <td className="py-3 px-4 text-white font-sans font-semibold max-w-[150px] truncate">
                      {txn.counterparty}
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 text-slate-400 font-sans max-w-[200px] truncate">
                      {txn.description}
                    </td>

                    {/* Amount */}
                    <td
                      className={`py-3 px-4 text-right font-bold whitespace-nowrap ${
                        amt > 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {amt > 0 ? '+' : ''}
                      {formatCurrency(amt)}
                    </td>

                    {/* Method */}
                    <td className="py-3 px-4 text-slate-400 text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono">
                        {txn.method}
                      </span>
                    </td>

                    {/* Category (Editable) */}
                    <td className="py-3 px-4 font-sans" onClick={(e) => e.stopPropagation()}>
                      {isEditing ? (
                        <select
                          value={tempCategory}
                          onChange={(e) => setTempCategory(e.target.value as FinancialCategory)}
                          className="px-2 py-1 rounded bg-slate-900 border border-emerald-500 text-xs text-white focus:outline-none"
                        >
                          {categories.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            txn.category === 'REVENUE'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : txn.category === 'COGS'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : txn.category === 'PAYROLL'
                              ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                              : txn.category === 'OPERATING_EXPENSE'
                              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {txn.category}
                        </span>
                      )}
                    </td>

                    {/* Confidence Badge */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {getConfidenceBadge(txn.confidence, txn.is_review_required)}
                    </td>

                    {/* Inline Correction Actions */}
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={(e) => handleSaveEdit(txn.id, e)}
                            disabled={savingId === txn.id}
                            title="Save Category Correction"
                            className="p-1 rounded bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            title="Cancel"
                            className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => handleStartEdit(txn, e)}
                          title="Correct Classification"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 text-xs font-sans">
                    {transactions.length === 0
                      ? 'No transactions in your workspace ledger yet. Upload a Bank Statement CSV to populate the ledger.'
                      : 'No transactions matched your current filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
