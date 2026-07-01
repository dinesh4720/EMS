/**
 * Payroll — pure salary arithmetic.
 *
 * Extracted verbatim from StaffDashboard's inline `calculateTotals` so the money
 * math can be unit-tested in isolation. `salarySettings` (which earning/deduction
 * components exist) is now an explicit argument instead of a closed-over value.
 */

/**
 * Sum a staff member's earnings and deductions and return the net salary.
 *
 * @param {Record<string, number>|null|undefined} salaryData - amounts keyed by component id.
 * @param {{ earnings?: Array<{id: string}>, deductions?: Array<{id: string}> }} [salarySettings]
 * @returns {{ totalEarnings: number, totalDeductions: number, netSalary: number }}
 */
export function calculatePayrollTotals(salaryData, salarySettings) {
  if (!salaryData) return { totalEarnings: 0, totalDeductions: 0, netSalary: 0 };
  let totalEarnings = 0;
  salarySettings?.earnings?.forEach(item => { totalEarnings += (Number(salaryData[item.id]) || 0); });
  let totalDeductions = 0;
  salarySettings?.deductions?.forEach(item => { totalDeductions += (Number(salaryData[item.id]) || 0); });
  return { totalEarnings, totalDeductions, netSalary: totalEarnings - totalDeductions };
}
