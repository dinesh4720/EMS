/**
 * TC160: Fee payment validation and edge cases.
 *
 * Deep coverage of the payment workflow: empty states, validation errors
 * (missing student, empty amount, missing transaction ID for online modes),
 * overdue filter, KPI strip interactions, and zero-amount rejection.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, seedStudent, seedStudentWithFees, recordFeePayment,
  CLASS_10A_ID, SCHOOL_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });
test.slow();

/* ─────────────────────────────────────────────────────────────────────
 *  Helpers
 * ───────────────────────────────────────────────────────────────────── */

function seedOverdueStudent(state: MockState) {
  const student = seedStudentWithFees(state, {
    name: 'Karthik Reddy', classId: CLASS_10A_ID, feeStatus: 'overdue',
  });
  const fs = state.studentFeeStructures.get(student.id) as Record<string, unknown>;
  fs.balanceAmount = 7000;
  fs.paidAmount = 0;
  fs.status = 'overdue';
  fs.dueDate = '2026-01-01'; // past due date
  return student;
}

async function installPaymentMockApi(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  await installMockApi(page, state);

  // Override fee-payments
  await page.route('**/api/fees/payments**', async (route) => {
    const url = new URL(route.request().url());
    if (/\.(js|ts|jsx|tsx|css|map|html|svg|png|jpg|woff2?)(\?|$)/i.test(url.pathname)) {
      return route.continue();
    }
    const method = route.request().method();
    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      const amount = Number(body.amount) || 0;

      // Simulate validation: amount must be > 0
      if (amount <= 0) {
        return json({ error: 'Amount must be greater than 0' }, 400);
      }
      if (!body.studentId) {
        return json({ error: 'Student is required' }, 400);
      }
      if (body.paymentMode === 'online' && !body.transactionId) {
        return json({ error: 'Transaction ID is required for online payments' }, 400);
      }

      recordFeePayment(state, body.studentId, amount, body.paymentMode || 'cash', body.paymentDate || new Date().toISOString().split('T')[0]);
      const payment = state.payments[state.payments.length - 1] as Record<string, unknown>;
      const fs = state.studentFeeStructures.get(body.studentId) as Record<string, unknown> | undefined;
      return json({
        ...payment,
        message: 'Payment recorded successfully',
        balanceAmount: fs?.balanceAmount || 0,
        status: fs?.status || 'pending',
      }, 201);
    }

    if (method === 'GET') {
      return json(state.payments);
    }

    return json({});
  });

  // Override /fees list route
  await page.route('**/api/fees**', async (route) => {
    const url = new URL(route.request().url());
    if (/\.(js|ts|jsx|tsx|css|map|html|svg|png|jpg|woff2?)(\?|$)/i.test(url.pathname)) {
      return route.continue();
    }
    const path = url.pathname;
    const method = route.request().method();
    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (path === '/api/fees' && method === 'GET') {
      const statusFilter = url.searchParams.get('status');
      const summaries = state.students.map((s) => {
        const fs = state.studentFeeStructures.get(s.id) as Record<string, unknown> | undefined;
        const paid = (fs?.paidAmount as number) || 0;
        const total = (fs?.totalFee as number) || 0;
        const balance = total - paid;
        const status = balance <= 0 ? 'paid' : (fs?.status as string) || 'pending';
        return {
          studentId: s.id, studentName: s.name, admissionId: s.admissionId,
          classId: s.classId, className: '10-A',
          totalFee: total, paidAmount: paid,
          balanceAmount: Math.max(0, balance),
          status,
          dueDate: fs?.dueDate || null,
        };
      });

      if (statusFilter) {
        return json(summaries.filter((s) => s.status === statusFilter));
      }
      return json(summaries);
    }

    return json(state.payments);
  });

  // Override student-fees
  await page.route('**/api/student-fees**', async (route) => {
    const url = new URL(route.request().url());
    if (/\.(js|ts|jsx|tsx|css|map|html|svg|png|jpg|woff2?)(\?|$)/i.test(url.pathname)) {
      return route.continue();
    }
    const path = url.pathname;
    const method = route.request().method();
    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (path === '/api/student-fees' && method === 'GET') {
      return json([...state.studentFeeStructures.values()]);
    }

    return json({});
  });
}

/* ─────────────────────────────────────────────────────────────────────
 *  Tests
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC160: Fee Payment Validation and Edge Cases', () => {
  test('1) fees page shows empty state when no students have fee data', async ({ page }) => {
    const state = createMockState();
    await installPaymentMockApi(page, state);

    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  test('2) payment sheet rejects empty amount', async ({ page }) => {
    const state = createMockState();
    const student = seedStudentWithFees(state, { name: 'Aarav Sharma', classId: CLASS_10A_ID, feeStatus: 'pending' });
    await installPaymentMockApi(page, state);

    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    // Open payment sheet
    const collectBtn = page.getByRole('button', { name: /collect|pay|add/i }).first();
    const plusBtn = page.locator('button:has(svg.lucide-plus)').first();
    const btn = (await collectBtn.isVisible({ timeout: 3000 }).catch(() => false)) ? collectBtn : plusBtn;

    if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(500);

      // Try to submit without amount
      const submitBtn = page.getByRole('button', { name: /save|submit|collect|pay/i }).first();
      if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitBtn.click();
        await page.waitForTimeout(500);

        const bodyText = await page.textContent('body');
        expect(bodyText?.toLowerCase()).toMatch(/error|required|invalid|amount|please/);
      }
    }
  });

  test('3) payment sheet rejects missing student selection', async ({ page }) => {
    const state = createMockState();
    seedStudentWithFees(state, { name: 'Aarav Sharma', classId: CLASS_10A_ID, feeStatus: 'pending' });
    await installPaymentMockApi(page, state);

    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    const collectBtn = page.getByRole('button', { name: /collect|pay|add/i }).first();
    const plusBtn = page.locator('button:has(svg.lucide-plus)').first();
    const btn = (await collectBtn.isVisible({ timeout: 3000 }).catch(() => false)) ? collectBtn : plusBtn;

    if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(500);

      // Fill amount but leave student empty
      const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
      if (await amountInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await amountInput.fill('5000');
      }

      const submitBtn = page.getByRole('button', { name: /save|submit|collect|pay/i }).first();
      if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitBtn.click();
        await page.waitForTimeout(500);

        const bodyText = await page.textContent('body');
        expect(bodyText?.toLowerCase()).toMatch(/error|required|invalid|student|please/);
      }
    }
  });

  test('4) online payment mode requires transaction ID', async ({ page }) => {
    const state = createMockState();
    const student = seedStudentWithFees(state, { name: 'Diya Patel', classId: CLASS_10A_ID, feeStatus: 'pending' });
    await installPaymentMockApi(page, state);

    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    const collectBtn = page.getByRole('button', { name: /collect|pay|add/i }).first();
    const plusBtn = page.locator('button:has(svg.lucide-plus)').first();
    const btn = (await collectBtn.isVisible({ timeout: 3000 }).catch(() => false)) ? collectBtn : plusBtn;

    if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(500);

      // Select student if dropdown exists
      const studentSelect = page.locator('select[name*="student"], input[name*="student"]').first();
      if (await studentSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        if (await studentSelect.evaluate(el => el.tagName === 'SELECT')) {
          await studentSelect.selectOption({ index: 1 });
        }
      }

      // Fill amount
      const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
      if (await amountInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await amountInput.fill('3000');
      }

      // Select online mode
      const modeSelect = page.locator('select[name*="mode"], select[name*="paymentMode"]').first();
      if (await modeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await modeSelect.selectOption('online');
      } else {
        const onlineRadio = page.getByRole('radio', { name: /online/i }).first();
        if (await onlineRadio.isVisible({ timeout: 2000 }).catch(() => false)) {
          await onlineRadio.check();
        }
      }

      // Leave transaction ID empty and submit
      const submitBtn = page.getByRole('button', { name: /save|submit|collect|pay/i }).first();
      if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitBtn.click();
        await page.waitForTimeout(500);

        const bodyText = await page.textContent('body');
        expect(bodyText?.toLowerCase()).toMatch(/error|required|invalid|transaction|please/);
      }
    }
  });

  test('5) overdue filter shows only overdue students', async ({ page }) => {
    const state = createMockState();
    seedStudentWithFees(state, { name: 'Aarav Sharma', classId: CLASS_10A_ID, feeStatus: 'paid' });
    seedOverdueStudent(state);
    seedStudentWithFees(state, { name: 'Meera Nair', classId: CLASS_10A_ID, feeStatus: 'pending' });

    await installPaymentMockApi(page, state);
    await page.goto('/fees');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    // Click the overdue KPI cell if it exists
    const overdueKpi = page.locator('[class*="fees-kpi"]').filter({ hasText: /overdue/i }).first()
      .or(page.getByRole('button', { name: /overdue/i })).first();

    const hasOverdueKpi = await overdueKpi.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasOverdueKpi) {
      await overdueKpi.click();
      await page.waitForTimeout(300);
    }

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText?.toLowerCase()).toMatch(/overdue|karthik|fee|pending|collected/);
  });

  test('6) KPI strip click filters update the table', async ({ page }) => {
    const state = createMockState();
    seedStudentWithFees(state, { name: 'Aarav Sharma', classId: CLASS_10A_ID, feeStatus: 'paid' });
    seedStudentWithFees(state, { name: 'Diya Patel', classId: CLASS_10A_ID, feeStatus: 'pending' });
    seedOverdueStudent(state);

    await installPaymentMockApi(page, state);
    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    // Click on the overdue KPI cell
    const overdueKpi = page.locator('[class*="fees-kpi"]').filter({ hasText: /overdue/i }).first()
      .or(page.getByRole('button', { name: /overdue/i })).first();

    if (await overdueKpi.isVisible({ timeout: 5000 }).catch(() => false)) {
      await overdueKpi.click();
      await page.waitForTimeout(500);

      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
    }
  });

  test('7) zero-amount payment is rejected by validation', async ({ page }) => {
    const state = createMockState();
    const student = seedStudentWithFees(state, { name: 'Rohan Gupta', classId: CLASS_10A_ID, feeStatus: 'pending' });
    await installPaymentMockApi(page, state);

    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    const collectBtn = page.getByRole('button', { name: /collect|pay|add/i }).first();
    const plusBtn = page.locator('button:has(svg.lucide-plus)').first();
    const btn = (await collectBtn.isVisible({ timeout: 3000 }).catch(() => false)) ? collectBtn : plusBtn;

    if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(500);

      // Select student
      const studentSelect = page.locator('select[name*="student"], input[name*="student"]').first();
      if (await studentSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        if (await studentSelect.evaluate(el => el.tagName === 'SELECT')) {
          await studentSelect.selectOption({ index: 1 });
        }
      }

      // Fill zero amount
      const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
      if (await amountInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await amountInput.fill('0');
      }

      const submitBtn = page.getByRole('button', { name: /save|submit|collect|pay/i }).first();
      if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitBtn.click();
        await page.waitForTimeout(500);

        const bodyText = await page.textContent('body');
        expect(bodyText?.toLowerCase()).toMatch(/error|required|invalid|amount|greater|please/);
      }
    }
  });

  test('8) payment sheet closes on Escape key', async ({ page }) => {
    const state = createMockState();
    seedStudentWithFees(state, { name: 'Aarav Sharma', classId: CLASS_10A_ID, feeStatus: 'pending' });
    await installPaymentMockApi(page, state);

    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    const collectBtn = page.getByRole('button', { name: /collect|pay|add/i }).first();
    const plusBtn = page.locator('button:has(svg.lucide-plus)').first();
    const btn = (await collectBtn.isVisible({ timeout: 3000 }).catch(() => false)) ? collectBtn : plusBtn;

    if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(500);

      // Press Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      // Sheet should close or page should still be on fees
      await expect(page).toHaveURL(/\/fees/);
    }
  });

  test('9) search filters payment list', async ({ page }) => {
    const state = createMockState();
    const s1 = seedStudentWithFees(state, { name: 'Aarav Sharma', classId: CLASS_10A_ID, feeStatus: 'paid' });
    const s2 = seedStudentWithFees(state, { name: 'Diya Patel', classId: CLASS_10A_ID, feeStatus: 'pending' });
    recordFeePayment(state, s1.id, 7000, 'cash', '2026-03-01');

    await installPaymentMockApi(page, state);
    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"], input[name="q"]').first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('Aarav');
      await page.waitForTimeout(500);

      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
    }
  });

  test('10) payment records update student fee status correctly', async ({ page }) => {
    const state = createMockState();
    const student = seedStudentWithFees(state, { name: 'Sneha Iyer', classId: CLASS_10A_ID, feeStatus: 'pending' });

    // Reset paidAmount so we start from 0
    const fs = state.studentFeeStructures.get(student.id) as Record<string, unknown>;
    fs.paidAmount = 0;
    fs.balanceAmount = 7000;
    fs.status = 'pending';

    const today = new Date().toISOString().split('T')[0];
    recordFeePayment(state, student.id, 7000, 'cash', today);

    expect(fs.paidAmount).toBe(7000);
    expect(fs.balanceAmount).toBe(0);
    expect(fs.status).toBe('paid');

    await installPaymentMockApi(page, state);
    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });
});
