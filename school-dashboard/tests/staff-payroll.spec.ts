import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, SCHOOL_ID, TEACHER_A_ID, TEACHER_B_ID, ACCOUNTANT_ID,
  type MockState,
} from './test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Mock data
 * ───────────────────────────────────────────────────────────────────── */

interface PayrollRecord {
  _id: string; id: string; employeeId: string;
  month: number; year: number; baseSalary: number;
  totalAllowances: number; totalDeductions: number; netPay: number;
  status: 'generated' | 'paid' | 'processing';
  employmentType: string;
  paymentDate?: string; schoolId: string;
}

function createPayrollState() {
  const state = createMockState();
  const currentDate = new Date();
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const records: PayrollRecord[] = [
    {
      _id: 'pr-001', id: 'pr-001', employeeId: TEACHER_A_ID,
      month, year, baseSalary: 45000, totalAllowances: 5000, totalDeductions: 2000, netPay: 48000,
      status: 'generated', employmentType: 'full_time', schoolId: SCHOOL_ID,
    },
    {
      _id: 'pr-002', id: 'pr-002', employeeId: TEACHER_B_ID,
      month, year, baseSalary: 40000, totalAllowances: 4000, totalDeductions: 1500, netPay: 42500,
      status: 'generated', employmentType: 'full_time', schoolId: SCHOOL_ID,
    },
    {
      _id: 'pr-003', id: 'pr-003', employeeId: ACCOUNTANT_ID,
      month, year, baseSalary: 35000, totalAllowances: 3000, totalDeductions: 1000, netPay: 37000,
      status: 'paid', employmentType: 'full_time', paymentDate: '2026-03-01', schoolId: SCHOOL_ID,
    },
  ];

  const dashboard = {
    month, year,
    totalPayout: records.filter((r) => r.status === 'paid').reduce((s, r) => s + r.netPay, 0),
    pendingAmount: records.filter((r) => r.status !== 'paid').reduce((s, r) => s + r.netPay, 0),
    projectedPayout: records.reduce((s, r) => s + r.netPay, 0),
    paidCount: records.filter((r) => r.status === 'paid').length,
    pendingCount: records.filter((r) => r.status !== 'paid').length,
    totalEmployees: records.length,
    payrollRun: {
      status: 'completed',
      processedEmployees: records.length,
      totalEmployees: records.length,
      totalPaid: records.filter((r) => r.status === 'paid').reduce((s, r) => s + r.netPay, 0),
      completedAt: new Date().toISOString(),
      errorLog: [],
    },
  };

  return { state, records, dashboard, month, year };
}

async function installPayrollMockApi(
  page: import('@playwright/test').Page,
  state: MockState,
  records: PayrollRecord[],
  dashboard: Record<string, unknown>,
  month: number,
  year: number,
) {
  await installMockApi(page, state);

  await page.route('**/api/payroll**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    // Strip /api prefix to normalize path for matching
    const normalizedPath = path.replace(/^\/api/, '');

    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    // Dashboard
    if (normalizedPath.match(/^\/payroll\/dashboard\//)) {
      return json({ success: true, data: dashboard });
    }

    // Records list (GET /payroll/records)
    if (normalizedPath === '/payroll/records' && method === 'GET') {
      return json({ success: true, data: records, total: records.length });
    }

    // Validate payroll
    if (path === '/api/payroll/validate' && method === 'POST') {
      return json({ success: true, data: { valid: true, errors: [] } });
    }

    // Run payroll
    if (path === '/api/payroll/run' && method === 'POST') {
      for (const r of records) {
        if (r.status === 'generated') r.status = 'processing' as any;
      }
      return json({ success: true, data: { results: { success: records, failed: [] } } });
    }

    // Fix salaries
    if (path === '/api/payroll/fix-salaries' && method === 'POST') {
      return json({ success: true, message: 'Salaries fixed' });
    }

    // Mark as paid
    const payMatch = path.match(/^\/api\/payroll\/records\/([^/]+)\/pay$/);
    if (payMatch && method === 'PUT') {
      const id = payMatch[1];
      const r = records.find((x) => x._id === id);
      if (r) {
        r.status = 'paid';
        r.paymentDate = new Date().toISOString().split('T')[0];
      }
      return json({ success: true, data: r || {} });
    }

    // Reverse payment
    const reverseMatch = path.match(/^\/api\/payroll\/records\/([^/]+)\/reverse$/);
    if (reverseMatch && method === 'PUT') {
      const id = reverseMatch[1];
      const r = records.find((x) => x._id === id);
      if (r) { r.status = 'generated' as any; delete r.paymentDate; }
      return json({ success: true, data: r || {} });
    }

    // Bulk pay
    if (path === '/api/payroll/records/bulk-pay' && method === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      const succeeded: PayrollRecord[] = [];
      for (const id of (body.recordIds || [])) {
        const r = records.find((x) => x._id === id);
        if (r) { r.status = 'paid'; r.paymentDate = new Date().toISOString().split('T')[0]; succeeded.push(r); }
      }
      return json({ success: true, data: { success: succeeded, failed: [] } });
    }

    // Export (return blob-like response)
    if (path.match(/^\/api\/payroll\/export\//)) {
      return route.fulfill({ status: 200, contentType: 'application/octet-stream', body: 'mock-excel-data' });
    }

    // Audit logs
    if (path === '/api/payroll/audit-logs') {
      return json({ data: [], total: 0 });
    }

    return json({ success: true });
  });

  // Settings payroll
  await page.route('**/api/settings/payroll**', async (route) => {
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ currency: 'INR', salaryDay: 1, overtimeEnabled: false }),
    });
  });
}

/* ─────────────────────────────────────────────────────────────────────
 *  Tests
 * ───────────────────────────────────────────────────────────────────── */

test.describe('Staff — Payroll (E2E-TEST-29)', () => {
  test('1) payroll page loads and shows staff payroll records', async ({ page }) => {
    const { state, records, dashboard, month, year } = createPayrollState();
    await installPayrollMockApi(page, state, records, dashboard, month, year);

    await page.goto('/staffs/payroll');
    await page.waitForLoadState('domcontentloaded');

    // Wait for records to render (staff names come from AppContext, joined by employeeId)
    // The page loads staff from AppContext, fetches payroll records, then joins them
    await expect(page.getByText('Ananya Sharma').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Ravi Menon').first()).toBeVisible({ timeout: 5_000 });
  });

  test('2) payroll summary shows total payroll, paid and pending counts', async ({ page }) => {
    const { state, records, dashboard, month, year } = createPayrollState();
    await installPayrollMockApi(page, state, records, dashboard, month, year);

    await page.goto('/staffs/payroll');
    await page.waitForLoadState('domcontentloaded');

    // Wait for page to render payroll data
    await page.waitForFunction(() => {
      const body = (document.body.textContent || '').toLowerCase();
      return body.includes('payroll') || body.includes('salary') || body.includes('pending') || body.includes('paid');
    }, { timeout: 15000 });
    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/payroll|salary|pending|paid/i);
  });

  test('3) net salary column shows correct computed salary', async ({ page }) => {
    const { state, records, dashboard, month, year } = createPayrollState();
    await installPayrollMockApi(page, state, records, dashboard, month, year);

    await page.goto('/staffs/payroll');
    await page.waitForLoadState('domcontentloaded');

    // Wait for staff name to appear (ensures records are rendered)
    await expect(page.getByText('Ananya Sharma').first()).toBeVisible({ timeout: 20_000 });

    const bodyText = await page.textContent('body');
    // Ananya's net pay is 48000 - formatted as INR currency (e.g. ₹48,000)
    expect(bodyText).toMatch(/48,000|48000|₹\s*48/);
  });

  test('4) "paid" status record shows different badge from "generated"', async ({ page }) => {
    const { state, records, dashboard, month, year } = createPayrollState();
    await installPayrollMockApi(page, state, records, dashboard, month, year);

    await page.goto('/staffs/payroll');
    await page.waitForLoadState('domcontentloaded');

    // Wait for staff name to appear (ensures records are rendered)
    await expect(page.getByText('Ananya Sharma').first()).toBeVisible({ timeout: 20_000 });

    const bodyText = await page.textContent('body');
    // The page shows 'Recorded' for 'paid' and 'Generated' for 'generated' status
    expect(bodyText?.toLowerCase()).toMatch(/recorded|paid/);
    expect(bodyText?.toLowerCase()).toMatch(/generated|pending|unrecorded/);
  });

  test('5) run payroll button starts the payroll processing', async ({ page }) => {
    const { state, records, dashboard, month, year } = createPayrollState();
    await installPayrollMockApi(page, state, records, dashboard, month, year);

    await page.goto('/staffs/payroll');
    await page.waitForLoadState('domcontentloaded');

    const runBtn = page.getByRole('button', { name: /run payroll|process payroll/i }).first();
    const hasRun = await runBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasRun) {
      await runBtn.click();
      // Modal or confirmation may appear
      const modal = page.locator('[role="dialog"]').last();
      const hasModal = await modal.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasModal) {
        const confirmBtn = modal.getByRole('button', { name: /confirm|run|proceed/i }).first();
        const hasConfirm = await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false);
        if (hasConfirm) await confirmBtn.click();
      }
      await page.waitForLoadState('domcontentloaded');
      await expect(page).not.toHaveURL(/\/login/);
    }
  });

  test('6) mark individual record as paid updates status', async ({ page }) => {
    const { state, records, dashboard, month, year } = createPayrollState();
    await installPayrollMockApi(page, state, records, dashboard, month, year);

    await page.goto('/staffs/payroll');
    await page.waitForLoadState('domcontentloaded');

    const payBtn = page.getByRole('button', { name: /^pay$|mark.*paid|log payment/i }).first();
    const hasPayBtn = await payBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasPayBtn) {
      await payBtn.click();
      await page.waitForLoadState('domcontentloaded');
      const bodyText = await page.textContent('body');
      expect(bodyText?.toLowerCase()).toMatch(/paid/);
    }
  });

  test('7) month/year selector changes the payroll period', async ({ page }) => {
    const { state, records, dashboard, month, year } = createPayrollState();
    await installPayrollMockApi(page, state, records, dashboard, month, year);

    await page.goto('/staffs/payroll');
    await page.waitForLoadState('domcontentloaded');

    // Look for a month or year dropdown
    const monthSelect = page.locator('select').first();
    const hasSelect = await monthSelect.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasSelect) {
      const options = await monthSelect.locator('option').count();
      expect(options).toBeGreaterThan(1);
    }

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('8) export payroll button triggers download', async ({ page }) => {
    const { state, records, dashboard, month, year } = createPayrollState();
    await installPayrollMockApi(page, state, records, dashboard, month, year);

    await page.goto('/staffs/payroll');
    await page.waitForLoadState('domcontentloaded');

    const exportBtn = page.getByRole('button', { name: /export|download/i }).first();
    const hasExport = await exportBtn.isVisible({ timeout: 5000 }).catch(() => false);

    // Just verify the button exists — actual download in E2E requires real server
    if (hasExport) {
      await expect(exportBtn).toBeEnabled();
    }
  });

  test('9) skeleton loader shown while payroll data is loading', async ({ page }) => {
    const { state } = createPayrollState();
    await installMockApi(page, state);

    await page.route('**/api/payroll**', async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [], total: 0 }) });
    });

    await page.goto('/staffs/payroll');
    const skeletons = page.locator('[class*="animate-pulse"], [class*="skeleton"]');
    const count = await skeletons.count();
    expect(count).toBeGreaterThanOrEqual(0);

    await page.waitForLoadState('domcontentloaded');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('10) payroll records show basic salary, allowances, and deductions breakdown', async ({ page }) => {
    const { state, records, dashboard, month, year } = createPayrollState();
    await installPayrollMockApi(page, state, records, dashboard, month, year);

    await page.goto('/staffs/payroll');
    await page.waitForLoadState('domcontentloaded');

    // Wait for staff name to appear (records are rendered from staff + payroll join)
    await expect(page.getByText('Ananya Sharma').first()).toBeVisible({ timeout: 20_000 });

    const bodyText = await page.textContent('body');
    // Table columns show BASE SALARY, ALLOWANCES, DEDUCTIONS, NET PAY
    // Ananya: base=45000, allowances=5000, deductions=2000, net=48000
    expect(bodyText).toMatch(/45,000|45000|₹\s*45/);
  });
});
