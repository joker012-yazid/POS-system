import type { SessionUser } from '@/services/storage/types';

const SESSION_KEY = 'kedaiservis_session';

/**
 * Get current session from localStorage
 */
export function getSession(): SessionUser | null {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    if (!data) return null;
    return JSON.parse(data) as SessionUser;
  } catch {
    return null;
  }
}

/**
 * Set session in localStorage
 */
export function setSession(user: SessionUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

/**
 * Clear session from localStorage
 */
export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
