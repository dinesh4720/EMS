/**
 * Fee math — annualised totals across heads of varying collection frequency.
 *
 * Extracted verbatim from FeeStructureAssignment so the (historically bug-prone,
 * see REVAMP-28) totalling logic can be unit-tested in isolation.
 */

// Frequency multipliers for annual sum. Treat unknown frequencies as one-shot
// instead of silently dropping them — fixes "totals not summing" bug surfaced
// in the REVAMP-28 brief.
export const FREQUENCY_MULTIPLIER = {
  monthly: 12,
  quarterly: 4,
  yearly: 1,
  "one-time": 1,
};

/**
 * Annualised total of a list of fee heads.
 *
 * - `term` frequency multiplies by the number of applicable terms (min 1,
 *   defaulting to 2 when `applicableTerms` is not an array).
 * - Any other/unknown frequency falls back to a ×1 multiplier (never dropped).
 *
 * @param {Array<{ amount?: number|string, frequency?: string, applicableTerms?: unknown[] }>} feeHeads
 * @returns {number}
 */
export const calculateAnnualTotal = (feeHeads) =>
  feeHeads.reduce((sum, head) => {
    const amount = Number(head.amount) || 0;
    if (head.frequency === "term") {
      const terms = Array.isArray(head.applicableTerms) ? head.applicableTerms.length : 2;
      return sum + amount * Math.max(terms, 1);
    }
    const mult = FREQUENCY_MULTIPLIER[head.frequency] ?? 1;
    return sum + amount * mult;
  }, 0);
