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
