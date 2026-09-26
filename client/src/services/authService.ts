/**
 * authService.ts
 * User Authentication, Session State & Token Management.
 */
import { User, AuthResponse, UserRole } from '../types';
import { apiFetch, getAuthHeaders, getAuthToken } from './apiClient';

export { getAuthToken, getAuthHeaders };

export function getStoredUser(): User | null {
  const u = localStorage.getItem('finz_auth_user');
  if (!u) return null;
  try {
    return JSON.parse(u);
  } catch {
    return null;
  }
}

export function storeAuth(token: string, user: User): void {
  localStorage.setItem('finz_auth_token', token);
  localStorage.setItem('finz_auth_user', JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem('finz_auth_token');
  localStorage.removeItem('finz_auth_user');
}

export async function registerUser(payload: {
  fullName: string;
  email: string;
  password: string;
  companyName: string;
  role?: UserRole;
  industry?: string;
}): Promise<{ user: any; message?: string }> {
  const data = await apiFetch<any>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const user = data?.user || data;
  return { user, message: data?.message };
}

export async function loginUser(payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  storeAuth(data.token, data.user);
  return data;
}
