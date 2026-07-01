import { describe, it, expect } from 'vitest';
import { calculatePayrollTotals } from './payrollMath';

const settings = {
  earnings: [{ id: 'basic' }, { id: 'hra' }, { id: 'special' }],
  deductions: [{ id: 'pf' }, { id: 'tax' }],
};

describe('calculatePayrollTotals', () => {
  it('sums configured earnings and deductions and computes net', () => {
    const r = calculatePayrollTotals(
      { basic: 40000, hra: 8000, special: 2000, pf: 4800, tax: 1200 },
      settings,
    );
    expect(r.totalEarnings).toBe(50000);
    expect(r.totalDeductions).toBe(6000);
    expect(r.netSalary).toBe(44000);
  });

  it('returns all zeros when salaryData is null/undefined (no salary set)', () => {
    const zero = { totalEarnings: 0, totalDeductions: 0, netSalary: 0 };
    expect(calculatePayrollTotals(null, settings)).toEqual(zero);
    expect(calculatePayrollTotals(undefined, settings)).toEqual(zero);
  });

  it('treats missing component amounts as 0', () => {
    const r = calculatePayrollTotals({ basic: 30000 }, settings);
    expect(r.totalEarnings).toBe(30000);
    expect(r.totalDeductions).toBe(0);
    expect(r.netSalary).toBe(30000);
  });

  it('coerces numeric string amounts', () => {
    const r = calculatePayrollTotals({ basic: '25000', pf: '2000' }, settings);
    expect(r.totalEarnings).toBe(25000);
    expect(r.totalDeductions).toBe(2000);
    expect(r.netSalary).toBe(23000);
  });

  it('treats an empty-string amount as 0', () => {
    const r = calculatePayrollTotals({ basic: '', hra: 1000 }, settings);
    expect(r.totalEarnings).toBe(1000);
  });

  it('produces a negative net when deductions exceed earnings', () => {
    const r = calculatePayrollTotals({ basic: 1000, pf: 5000 }, settings);
    expect(r.netSalary).toBe(-4000);
  });

  it('returns zeros when salarySettings is undefined', () => {
    expect(calculatePayrollTotals({ basic: 1000 }, undefined)).toEqual({
      totalEarnings: 0,
      totalDeductions: 0,
      netSalary: 0,
    });
  });

  it('ignores salaryData keys not present in settings', () => {
    const r = calculatePayrollTotals({ basic: 1000, bonus: 99999 }, settings);
    expect(r.totalEarnings).toBe(1000); // `bonus` is not a configured earning
  });

  it('treats a non-numeric amount as 0 instead of poisoning the total to NaN', () => {
    // Guarded by `Number(x) || 0`: a single bad value no longer invalidates the
    // whole total (regression fix — this previously produced NaN).
    const r = calculatePayrollTotals({ basic: 'abc', hra: 1000 }, settings);
    expect(r.totalEarnings).toBe(1000);
    expect(r.netSalary).toBe(1000);
  });
});
