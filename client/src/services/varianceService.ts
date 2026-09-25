/**
 * varianceService.ts
 * Month-over-Month Variance Analysis and Driver Breakdown Service.
 */
import {
  VarianceAnalysisReport,
  CategoryDriverBreakdown,
  FinancialCategory,
} from '../types';
import { apiFetch } from './apiClient';

export async function fetchVariance(
  baseMonth: string,
  comparisonMonth: string,
  isDemo?: boolean
): Promise<VarianceAnalysisReport> {
  const query = new URLSearchParams({
    baseMonth,
    comparisonMonth,
  });
  if (isDemo) query.set('isDemo', 'true');

  return await apiFetch<VarianceAnalysisReport>(
    `/variance?${query.toString()}`
  );
}

export async function fetchCategoryDrivers(
  category: FinancialCategory,
  baseMonth: string,
  comparisonMonth: string,
  isDemo?: boolean
): Promise<CategoryDriverBreakdown> {
  const query = new URLSearchParams({
    baseMonth,
    comparisonMonth,
  });
  if (isDemo) query.set('isDemo', 'true');

  return await apiFetch<CategoryDriverBreakdown>(
    `/variance/drivers/${encodeURIComponent(category)}?${query.toString()}`
  );
}
