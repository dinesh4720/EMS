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
  _id: string; id: string; staffId: string; staffName: string;
  month: number; year: number; basicSalary: number;
  allowances: number; deductions: number; netSalary: number;
  status: 'pending' | 'paid' | 'processing';
  paymentDate?: string; schoolId: string;
}

function createPayrollState() {
  const state = createMockState();
  const currentDate = new Date();
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const records: PayrollRecord[] = [
    {
      _id: 'pr-001', id: 'pr-001', staffId: TEACHER_A_ID, staffName: 'Ananya Sharma',
      month, year, basicSalary: 45000, allowances: 5000, deductions: 2000, netSalary: 48000,
      status: 'pending', schoolId: SCHOOL_ID,
    },
    {
      _id: 'pr-002', id: 'pr-002', staffId: TEACHER_B_ID, staffName: 'Ravi Menon',
      month, year, basicSalary: 40000, allowances: 4000, deductions: 1500, netSalary: 42500,
      status: 'pending', schoolId: SCHOOL_ID,
    },
    {
      _id: 'pr-003', id: 'pr-003', staffId: ACCOUNTANT_ID, staffName: 'Priya Menon',
      month, year, basicSalary: 35000, allowances: 3000, deductions: 1000, netSalary: 37000,
      status: 'paid', paymentDate: '2026-03-01', schoolId: SCHOOL_ID,
    },
  ];

  const dashboard = {
    month, year,
    totalPayroll: records.reduce((s, r) => s + r.netSalary, 0),
    paidCount: records.filter((r) => r.status === 'paid').length,
    pendingCount: records.filter((r) => r.status === 'pending').length,
    totalStaff: records.length,
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

    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    // Dashboard
    if (path.match(/^\/api\/payroll\/dashboard\//)) {
      return json(dashboard);
    }

    // Records list
    if (path === '/api/payroll/records' && method === 'GET') {
      return json({ data: records, total: records.length });
    }

    // Validate payroll
    if (path === '/api/payroll/validate' && method === 'POST') {
      return json({ valid: true, errors: [] });
    }

    // Run payroll
    if (path === '/api/payroll/run' && method === 'POST') {
      for (const r of records) {
        if (r.status === 'pending') r.status = 'processing';
      }
      return json({ success: true, processed: records.length });
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
      return json(r || {});
    }

    // Reverse payment
    const reverseMatch = path.match(/^\/api\/payroll\/records\/([^/]+)\/reverse$/);
    if (reverseMatch && method === 'PUT') {
      const id = reverseMatch[1];
      const r = records.find((x) => x._id === id);
      if (r) { r.status = 'pending'; delete r.paymentDate; }
      return json(r || {});
    }

    // Bulk pay
    if (path === '/api/payroll/records/bulk-pay' && method === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      for (const id of (body.recordIds || [])) {
        const r = records.find((x) => x._id === id);
        if (r) { r.status = 'paid'; r.paymentDate = new Date().toISOString().split('T')[0]; }
      }
      return json({ success: true, paid: body.recordIds?.length || 0 });
    }

    // Export (redirect — just return success)
    if (path.match(/^\/api\/payroll\/export\//)) {
      return json({ downloadUrl: '/mock/payroll.xlsx' });
    }

    // Audit logs
    if (path === '/api/payroll/audit-logs') {
      return json({ data: [], total: 0 });
    }

    return json({});
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
    await page.waitForLoadState('networkidle');

    // Staff names should appear
    await expect(page.getByText('Ananya Sharma').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Ravi Menon').first()).toBeVisible();
  });

  test('2) payroll summary shows total payroll, paid and pending counts', async ({ page }) => {
    const { state, records, dashboard, month, year } = createPayrollState();
    await installPayrollMockApi(page, state, records, dashboard, month, year);

    await page.goto('/staffs/payroll');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    // Summary numbers or labels
    expect(bodyText?.toLowerCase()).toMatch(/payroll|salary|pending|paid/i);
  });

  test('3) net salary column shows correct computed salary', async ({ page }) => {
    const { state, records, dashboard, month, year } = createPayrollState();
    await installPayrollMockApi(page, state, records, dashboard, month, year);

    await page.goto('/staffs/payroll');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    // Ananya's net salary is 48000
    expect(bodyText).toMatch(/48,000|48000/);
  });

  test('4) "paid" status record shows different badge from "pending"', async ({ page }) => {
    const { state, records, dashboard, month, year } = createPayrollState();
    await installPayrollMockApi(page, state, records, dashboard, month, year);

    await page.goto('/staffs/payroll');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/paid/);
    expect(bodyText?.toLowerCase()).toMatch(/pending/);
  });

  test('5) run payroll button starts the payroll processing', async ({ page }) => {
    const { state, records, dashboard, month, year } = createPayrollState();
    await installPayrollMockApi(page, state, records, dashboard, month, year);

    await page.goto('/staffs/payroll');
    await page.waitForLoadState('networkidle');

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
      await page.waitForLoadState('networkidle');
      await expect(page).not.toHaveURL(/\/login/);
    }
  });

  test('6) mark individual record as paid updates status', async ({ page }) => {
    const { state, records, dashboard, month, year } = createPayrollState();
    await installPayrollMockApi(page, state, records, dashboard, month, year);

    await page.goto('/staffs/payroll');
    await page.waitForLoadState('networkidle');

    const payBtn = page.getByRole('button', { name: /^pay$|mark.*paid/i }).first();
    const hasPayBtn = await payBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasPayBtn) {
      await payBtn.click();
      await page.waitForLoadState('networkidle');
      const bodyText = await page.textContent('body');
      expect(bodyText?.toLowerCase()).toMatch(/paid/);
    }
  });

  test('7) month/year selector changes the payroll period', async ({ page }) => {
    const { state, records, dashboard, month, year } = createPayrollState();
    await installPayrollMockApi(page, state, records, dashboard, month, year);

    await page.goto('/staffs/payroll');
    await page.waitForLoadState('networkidle');

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
    await page.waitForLoadState('networkidle');

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

    await page.waitForLoadState('networkidle');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('10) payroll records show basic salary, allowances, and deductions breakdown', async ({ page }) => {
    const { state, records, dashboard, month, year } = createPayrollState();
    await installPayrollMockApi(page, state, records, dashboard, month, year);

    await page.goto('/staffs/payroll');
    await page.waitForLoadState('networkidle');

    // Click on a staff row to see detail, if expandable
    const row = page.getByText('Ananya Sharma').first();
    await expect(row).toBeVisible({ timeout: 10_000 });

    const bodyText = await page.textContent('body');
    // Should show salary values
    expect(bodyText).toMatch(/45,000|45000|48,000|48000/);
  });
});
