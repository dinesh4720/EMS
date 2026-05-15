import { useCallback } from "react";
import { formatCurrency } from "../../utils/numberFormatter";

/**
 * Returns a currency formatter bound to the school's currency settings.
 * Defaults to INR when no currency is configured.
 */
export function useCurrency() {
  const fmt = useCallback((amount) => {
    return formatCurrency(amount, "INR");
  }, []);

  return { fmt };
}
