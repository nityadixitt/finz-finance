/**
 * pnlService.ts
 * Deterministic Monthly Profit & Loss (P&L) Statement Service.
 */
import { PnLSummaryResponse } from '../types';
import { apiFetch } from './apiClient';

export async function fetchPnL(
  month?: string,
  isDemo?: boolean
): Promise<PnLSummaryResponse> {
  const query = new URLSearchParams();
  if (month) query.set('month', month);
  if (isDemo) query.set('isDemo', 'true');
  const qs = query.toString() ? `?${query.toString()}` : '';

  return await apiFetch<PnLSummaryResponse>(`/pnl${qs}`);
}
