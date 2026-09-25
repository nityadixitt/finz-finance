/**
 * reviewService.ts
 * Controller Review Queue & Exception Management Service.
 */
import { ReviewItem } from '../types';
import { apiFetch } from './apiClient';

export async function fetchReviewQueue(
  status?: string,
  isDemo?: boolean
): Promise<ReviewItem[]> {
  const query = new URLSearchParams();
  if (status) query.set('status', status);
  if (isDemo) query.set('isDemo', 'true');
  const qs = query.toString() ? `?${query.toString()}` : '';

  return await apiFetch<ReviewItem[]>(`/review${qs}`);
}

export async function resolveReviewItem(
  id: string,
  status: 'RESOLVED' | 'DISMISSED',
  notes?: string
): Promise<ReviewItem> {
  return await apiFetch<ReviewItem>(`/review/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, notes }),
  });
}
