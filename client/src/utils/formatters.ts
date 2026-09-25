/**
 * Unified Financial Formatting Utilities
 * Standardizes currency, percentages, and compact metrics.
 */

export function formatCurrency(
  val: number,
  options: { minimumFractionDigits?: number; maximumFractionDigits?: number } = {}
): string {
  const num = typeof val === 'number' && !isNaN(val) ? val : 0;
  const hasCents = num % 1 !== 0;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: options.minimumFractionDigits ?? (hasCents ? 2 : 0),
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
  }).format(num);
}

export function formatCompactCurrency(val: number): string {
  const num = typeof val === 'number' && !isNaN(val) ? val : 0;
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  }
  return `${sign}$${abs.toFixed(0)}`;
}

export function formatPercentage(val: number, decimals = 1): string {
  const num = typeof val === 'number' && !isNaN(val) ? val : 0;
  return `${num.toFixed(decimals)}%`;
}

export const formatPercent = formatPercentage;

