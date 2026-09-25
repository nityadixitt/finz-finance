/**
 * demoService.ts
 * Demo Environment Seeding & Sample Dataset Download Service.
 */
import { apiFetch, API_BASE_URL } from './apiClient';

export async function seedDemoData(): Promise<{
  insertedCount: number;
  reviewedCount: number;
}> {
  return await apiFetch<{
    insertedCount: number;
    reviewedCount: number;
  }>('/demo/seed', {
    method: 'POST',
  });
}

export function getSampleCsvDownloadUrl(): string {
  return `${API_BASE_URL}/demo/sample-csv`;
}
