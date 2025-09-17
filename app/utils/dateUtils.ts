/**
 * Centralized date utility functions to handle timezone issues consistently
 *
 * The main issue: Date-only strings like "2025-01-03" are interpreted as UTC midnight
 * by JavaScript's Date constructor. When converted to local time in negative UTC
 * offset timezones (like PST UTC-8), this appears as the previous day.
 */

/**
 * Get a date string in YYYY-MM-DD format in the local timezone
 * This avoids UTC conversion issues by using local date components
 */
export function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a date for storage in the database
 * Uses local date to avoid timezone shifts
 */
export function formatDateForStorage(date: Date): string {
  return getLocalDateString(date);
}

/**
 * Parse a date string from storage correctly
 * Creates a date at noon local time to avoid timezone boundary issues
 */
export function parseDateFromStorage(dateString: string): Date {
  // Parse the date components
  const [year, month, day] = dateString.split('-').map(Number);

  // Create date at noon local time to avoid DST and timezone issues
  // Using noon ensures we stay on the same calendar day regardless of timezone
  return new Date(year, month - 1, day, 12, 0, 0);
}

/**
 * Format a date for display in the UI
 */
export function formatDateForDisplay(dateString: string, locale = 'en-US'): string {
  const date = parseDateFromStorage(dateString);
  return date.toLocaleDateString(locale);
}

/**
 * Format a date for display with custom format options
 */
export function formatDateWithOptions(
  dateString: string,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' },
  locale = 'en-US'
): string {
  const date = parseDateFromStorage(dateString);
  return date.toLocaleDateString(locale, options);
}

/**
 * Get the day of week from a date string (0 = Sunday, 6 = Saturday)
 */
export function getDayOfWeek(dateString: string): number {
  const date = parseDateFromStorage(dateString);
  return date.getDay();
}

/**
 * Check if a date falls on a weekend
 */
export function isWeekend(dateString: string): boolean {
  const day = getDayOfWeek(dateString);
  return day === 0 || day === 6;
}

/**
 * Format a date for HTML date input elements
 * These require YYYY-MM-DD format in local timezone
 */
export function formatDateForInput(date: Date): string {
  return getLocalDateString(date);
}

/**
 * Parse a date from an HTML date input
 * The input value is in YYYY-MM-DD format
 */
export function parseDateFromInput(dateString: string): Date {
  return parseDateFromStorage(dateString);
}

/**
 * Get start of day in local timezone
 */
export function getStartOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get end of day in local timezone
 */
export function getEndOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Format a timestamp (with time) for storage
 * Stores in ISO format with timezone information
 */
export function formatTimestampForStorage(date: Date): string {
  return date.toISOString();
}

/**
 * Parse a timestamp from storage
 */
export function parseTimestampFromStorage(timestamp: string): Date {
  return new Date(timestamp);
}

/**
 * Get hour from a timestamp (for time-based badges)
 * Returns null if no time information is available
 */
export function getHourFromTimestamp(timestamp: string | null): number | null {
  if (!timestamp || !timestamp.includes('T')) {
    return null;
  }
  return new Date(timestamp).getHours();
}

/**
 * Check if two dates are the same calendar day in local timezone
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Get the difference in days between two dates
 */
export function getDaysDifference(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  const diff = Math.abs(date1.getTime() - date2.getTime());
  return Math.floor(diff / oneDay);
}

/**
 * Check if dates are consecutive days
 */
export function areConsecutiveDays(date1String: string, date2String: string): boolean {
  const date1 = parseDateFromStorage(date1String);
  const date2 = parseDateFromStorage(date2String);
  const daysDiff = getDaysDifference(date1, date2);
  return daysDiff === 1;
}