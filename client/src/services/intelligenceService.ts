/**
 * intelligenceService.ts
 * Finz Intelligence Center & Executive Risk Signals API Service.
 */
import { IntelligenceCenterData } from '../types';
import { apiFetch } from './apiClient';

export async function fetchIntelligenceCenter(
  baseMonth: string = '2026-02',
  comparisonMonth: string = '2026-03',
  isDemo?: boolean
): Promise<IntelligenceCenterData> {
  const query = new URLSearchParams({ baseMonth, comparisonMonth });
  if (isDemo) query.set('isDemo', 'true');

  return await apiFetch<IntelligenceCenterData>(
    `/ai/intelligence?${query.toString()}`
  );
}
