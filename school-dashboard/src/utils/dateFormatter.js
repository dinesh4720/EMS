import { getDateLocale } from '../i18n/index';

/**
 * Locale-aware date formatting utilities.
 * All functions use getDateLocale() from the i18n module so that dates
 * automatically render in the user's selected language (hi-IN, ta-IN, etc.)
 * instead of the hardcoded "en-IN" / "en-US" that was scattered across pages.
 *
 * Usage:
 *   import { formatDate, formatDateTime, formatShortDate } from '../utils/dateFormatter';
 *   const label = formatDate(student.dateOfBirth);
 */

/**
 * Format a date in long form: "15 January 2024"
 * In Hindi this renders "15 जनवरी 2024" automatically.
 */
export function formatDate(value, fallback = '—') {
  if (!value) return fallback;
  try {
    return new Intl.DateTimeFormat(getDateLocale(), {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return fallback;
  }
}

/**
 * Format a date in short form: "15 Jan 2024"
 */
export function formatShortDate(value, fallback = '—') {
  if (!value) return fallback;
  try {
    return new Intl.DateTimeFormat(getDateLocale(), {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return fallback;
  }
}

/**
 * Format a date with time: "15 Jan 2024, 10:30 AM"
 */
export function formatDateTime(value, fallback = '—') {
  if (!value) return fallback;
  try {
    return new Intl.DateTimeFormat(getDateLocale(), {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return fallback;
  }
}

/**
 * Format only the time: "10:30 AM"
 */
export function formatTime(value, fallback = '—') {
  if (!value) return fallback;
  try {
    return new Intl.DateTimeFormat(getDateLocale(), {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return fallback;
  }
}

/**
 * Format month + year only: "January 2024"
 */
export function formatMonthYear(value, fallback = '—') {
  if (!value) return fallback;
  try {
    return new Intl.DateTimeFormat(getDateLocale(), {
      month: 'long',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return fallback;
  }
}

/**
 * Format as numeric date: "15/01/2024"
 */
export function formatNumericDate(value, fallback = '—') {
  if (!value) return fallback;
  try {
    return new Intl.DateTimeFormat(getDateLocale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return fallback;
  }
}

/**
 * Convert a Date (or date-like value) to "YYYY-MM-DD" for HTML <input type="date"> elements.
 * Always uses UTC-safe local date parts so the value doesn't shift across time zones.
 */
export function toDateInputValue(value, fallback = '') {
  if (!value) return fallback;
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return fallback;
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return fallback;
  }
}

/**
 * Format a date with the full weekday name: "Monday, 27 March 2026"
 * In Hindi this renders "सोमवार, 27 मार्च 2026" automatically.
 */
export function formatDateWithWeekday(value, fallback = '—') {
  if (!value) return fallback;
  try {
    return new Intl.DateTimeFormat(getDateLocale(), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return fallback;
  }
}

/**
 * Format a date with the abbreviated weekday: "Mon, 27 Mar 2026"
 */
export function formatDateShortWeekday(value, fallback = '—') {
  if (!value) return fallback;
  try {
    return new Intl.DateTimeFormat(getDateLocale(), {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return fallback;
  }
}

/**
 * Return relative time string: "3 days ago", "in 2 hours"
 * Falls back to formatShortDate if RelativeTimeFormat is unsupported.
 */
export function formatRelativeTime(value, fallback = '—') {
  if (!value) return fallback;
  try {
    const diff = Date.now() - new Date(value).getTime();
    const seconds = Math.round(diff / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);
    const months = Math.round(days / 30);
    const years = Math.round(months / 12);

    const rtf = new Intl.RelativeTimeFormat(getDateLocale(), { numeric: 'auto' });

    if (Math.abs(seconds) < 60) return rtf.format(-seconds, 'second');
    if (Math.abs(minutes) < 60) return rtf.format(-minutes, 'minute');
    if (Math.abs(hours) < 24) return rtf.format(-hours, 'hour');
    if (Math.abs(days) < 30) return rtf.format(-days, 'day');
    if (Math.abs(months) < 12) return rtf.format(-months, 'month');
    return rtf.format(-years, 'year');
  } catch {
    return formatShortDate(value, fallback);
  }
}

/**
 * Return today's date as "YYYY-MM-DD" (for HTML date inputs and API payloads).
 * Replaces the scattered `new Date().toISOString().split('T')[0]` pattern.
 */
export function toTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Return the current local time as "HH:MM" (24-hour, zero-padded).
 * Replaces the locale-dependent `new Date().toTimeString().slice(0, 5)` pattern.
 */
export function toCurrentTimeString() {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Format a number as Indian-locale currency: "1,23,456"
 * @param {number|string} amount - The amount to format
 * @param {string} [fallback='0'] - Fallback when amount is null/undefined
 * @returns {string} Formatted string WITHOUT the ₹ symbol (caller adds it)
 */
export function formatCurrency(amount, fallback = '0') {
  if (amount == null || amount === '') return fallback;
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (!Number.isFinite(num)) return fallback;
  return num.toLocaleString('en-IN');
}
