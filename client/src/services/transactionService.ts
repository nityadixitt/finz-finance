/**
 * transactionService.ts
 * Banking Transactions API Client: retrieval, filtering, category correction, and CSV ingestion.
 */
import { Transaction, FinancialCategory } from '../types';
import { apiFetch } from './apiClient';

export interface FetchTransactionsParams {
  search?: string;
  category?: string;
  month?: string;
  reviewOnly?: boolean;
  limit?: number;
  offset?: number;
  isDemo?: boolean;
}

export async function fetchTransactions(
  params: FetchTransactionsParams = {}
): Promise<{ transactions: Transaction[]; totalCount: number }> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.category) query.set('category', params.category);
  if (params.month) query.set('month', params.month);
  if (params.reviewOnly) query.set('reviewOnly', 'true');
  if (params.limit) query.set('limit', String(params.limit));
  if (params.offset) query.set('offset', String(params.offset));
  if (params.isDemo) query.set('isDemo', 'true');

  const qs = query.toString();
  return await apiFetch<{ transactions: Transaction[]; totalCount: number }>(
    `/transactions${qs ? `?${qs}` : ''}`
  );
}

export async function fetchTransactionById(id: string): Promise<Transaction> {
  return await apiFetch<Transaction>(`/transactions/${encodeURIComponent(id)}`);
}

export async function updateTransactionCategory(
  id: string,
  newCategory: FinancialCategory,
  reason?: string,
  includedInPnl?: boolean
): Promise<{ transaction: Transaction }> {
  return await apiFetch<{ transaction: Transaction }>(
    `/transactions/${encodeURIComponent(id)}/category`,
    {
      method: 'PATCH',
      body: JSON.stringify({ newCategory, reason, includedInPnl }),
    }
  );
}

export async function uploadCsvFile(
  file: File,
  isDemo?: boolean
): Promise<{
  insertedCount: number;
  reviewedCount: number;
}> {
  const formData = new FormData();
  formData.append('file', file);
  if (isDemo) formData.append('isDemo', 'true');

  return await apiFetch<{
    insertedCount: number;
    reviewedCount: number;
  }>('/transactions/upload', {
    method: 'POST',
    body: formData,
  });
}
