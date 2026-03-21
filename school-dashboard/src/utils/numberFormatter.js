import { getDateLocale } from '../i18n/index';

/**
 * Shared number/currency formatting utilities.
 * All functions use getDateLocale() for locale-aware output,
 * mirroring the pattern in dateFormatter.js.
 */

/** Format a plain number with locale-aware grouping. e.g. 1,23,456 */
export function formatNumber(value, fallback = '0') {
  if (value == null || isNaN(value)) return fallback;
  return new Intl.NumberFormat(getDateLocale()).format(value);
}

/** Format as currency with no decimals. e.g. ₹1,23,456 */
export function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat(getDateLocale(), {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

/** Format as currency with up to 2 decimal places. e.g. ₹1,234.56 */
export function formatCurrencyPrecise(amount, currency = 'INR') {
  return new Intl.NumberFormat(getDateLocale(), {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

/** Format with compact notation. e.g. 1.2L or 123K */
export function formatCompactNumber(value, fallback = '0') {
  if (value == null || isNaN(value)) return fallback;
  return new Intl.NumberFormat(getDateLocale(), {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}
