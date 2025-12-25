import {
  format,
  formatDistanceToNow,
  parseISO,
  isValid,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  addDays,
  isBefore,
  isAfter,
  differenceInDays,
} from 'date-fns';
import { ms } from 'date-fns/locale';

/**
 * Get current timestamp in ISO format
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Get current date string (YYYY-MM-DD)
 */
export function today(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Get current year
 */
export function currentYear(): number {
  return new Date().getFullYear();
}

/**
 * Format ISO timestamp to readable date
 */
export function formatDate(isoString: string): string {
  const date = parseISO(isoString);
  if (!isValid(date)) return '-';
  return format(date, 'dd/MM/yyyy', { locale: ms });
}

/**
 * Format ISO timestamp to readable date and time
 */
export function formatDateTime(isoString: string): string {
  const date = parseISO(isoString);
  if (!isValid(date)) return '-';
  return format(date, 'dd/MM/yyyy HH:mm', { locale: ms });
}

/**
 * Format ISO timestamp to readable time only
 */
export function formatTime(isoString: string): string {
  const date = parseISO(isoString);
  if (!isValid(date)) return '-';
  return format(date, 'HH:mm', { locale: ms });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelative(isoString: string): string {
  const date = parseISO(isoString);
  if (!isValid(date)) return '-';
  return formatDistanceToNow(date, { addSuffix: true, locale: ms });
}

/**
 * Format date for display in documents (e.g., "22 Disember 2025")
 */
export function formatDocumentDate(isoString: string): string {
  const date = parseISO(isoString);
  if (!isValid(date)) return '-';
  return format(date, 'd MMMM yyyy', { locale: ms });
}

/**
 * Parse date string to Date object
 */
export function parseDate(dateString: string): Date | null {
  const date = parseISO(dateString);
  return isValid(date) ? date : null;
}

/**
 * Check if date is in the past
 */
export function isPast(dateString: string): boolean {
  const date = parseISO(dateString);
  return isValid(date) && isBefore(date, new Date());
}

/**
 * Check if date is in the future
 */
export function isFuture(dateString: string): boolean {
  const date = parseISO(dateString);
  return isValid(date) && isAfter(date, new Date());
}

/**
 * Get date range for today
 */
export function getTodayRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfDay(now),
    end: endOfDay(now),
  };
}

/**
 * Get date range for current month
 */
export function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfMonth(now),
    end: endOfMonth(now),
  };
}

/**
 * Get default validity date (e.g., 30 days from now)
 */
export function getDefaultValidityDate(days: number = 30): string {
  return format(addDays(new Date(), days), 'yyyy-MM-dd');
}

/**
 * Get days until date
 */
export function getDaysUntil(dateString: string): number {
  const date = parseISO(dateString);
  if (!isValid(date)) return 0;
  return differenceInDays(date, new Date());
}

/**
 * Check if quotation is expired
 */
export function isExpired(validUntil: string | undefined): boolean {
  if (!validUntil) return false;
  return isPast(validUntil + 'T23:59:59');
}
