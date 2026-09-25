/**
 * apiClient.ts
 * Core HTTP Client for Finz Finance Web App.
 *
 * Configures the base API URL dynamically from Vite environment variables:
 * `VITE_API_BASE_URL` (fallback: '/api' via Vite proxy).
 */

export const API_BASE_URL: string = (
  (import.meta.env.VITE_API_BASE_URL as string) || '/api'
).replace(/\/+$/, '');

export function getAuthToken(): string | null {
  return localStorage.getItem('finz_auth_token');
}

export function getAuthHeaders(custom: Record<string, string> = {}): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = { ...custom };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Standard typed HTTP fetch wrapper with authorization, JSON parsing,
 * and comprehensive error normalization.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${normalizedEndpoint}`;

  const headers = getAuthHeaders(
    options.body instanceof FormData
      ? (options.headers as Record<string, string>) || {}
      : {
          'Content-Type': 'application/json',
          ...((options.headers as Record<string, string>) || {}),
        }
  );

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let json: any;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      json = await response.json();
    } catch {
      json = null;
    }
  }

  if (!response.ok) {
    const errorMsg =
      json?.error ||
      json?.message ||
      `HTTP error ${response.status}: ${response.statusText}`;
    throw new Error(errorMsg);
  }

  if (json && typeof json === 'object' && 'success' in json && !json.success) {
    throw new Error(json.error || 'Request unsuccessful');
  }

  return (json?.data !== undefined ? json.data : json) as T;
}
