import { useSchool } from '../SchoolContext';
import { formatCurrency, formatCurrencyPrecise } from '../../utils/numberFormatter';

/**
 * useCurrency — returns currency-aware formatting utilities.
 *
 * Reads the currency code from schoolSettings (e.g. 'INR', 'USD', 'EUR').
 * Falls back to 'INR' when settings are not yet loaded.
 *
 * Usage:
 *   const { currency, currencySymbol, fmt, fmtPrecise } = useCurrency();
 *   <span>{fmt(amount)}</span>            // e.g. "₹1,23,456" or "$1,234"
 *   <Input startContent={currencySymbol} />
 */
export function useCurrency() {
  const { schoolSettings } = useSchool();
  const currency = schoolSettings?.currency || 'INR';

  const currencySymbol = (() => {
    try {
      const parts = new Intl.NumberFormat('en', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).formatToParts(0);
      return parts.find((p) => p.type === 'currency')?.value ?? currency;
    } catch {
      return currency;
    }
  })();

  return {
    currency,
    currencySymbol,
    /** Format amount as full currency string, e.g. "₹1,23,456" */
    fmt: (amount) => formatCurrency(amount, currency),
    /** Format amount with decimals, e.g. "₹1,234.50" */
    fmtPrecise: (amount) => formatCurrencyPrecise(amount, currency),
  };
}
