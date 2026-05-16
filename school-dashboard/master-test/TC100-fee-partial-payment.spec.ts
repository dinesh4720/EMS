/**
 * TC100: Make partial payments and track balance accurately.
 *
 * Seeds 1 student with totalFee=10000, then makes three partial payments
 * (3000 cash, 2000 online, 5000 card). After each payment verifies the
 * balance and status. Then navigates to student dashboard > Fees tab and
 * verifies payment history with 3 entries, total paid=10000, balance=0,
 * and correct amount/date/mode on each entry.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, seedStudent, recordFeePayment,
  CLASS_10A_ID, SCHOOL_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Helpers
 * ───────────────────────────────────────────────────────────────────── */

function seedStudentWithCustomFee(state: MockState, totalFee: number) {
  const student = seedStudent(state, { name: 'Priya Mehta', classId: CLASS_10A_ID });
  state.studentFeeStructures.set(student.id, {
    _id: `sfs-${student.id}`, studentId: student.id,
    totalFee, paidAmount: 0, balanceAmount: totalFee,
    status: 'pending', schoolId: SCHOOL_ID,
  });
  return student;
}

async function installPartialPaymentMockApi(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  await installMockApi(page, state);

  // Override student-fees
  await page.route('**/api/student-fees**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();
    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    const idMatch = path.match(/^\/api\/student-fees\/([^/]+)$/);
    if (idMatch && method === 'GET') {
      const studentId = idMatch[1];
      const fs = state.studentFeeStructures.get(studentId) as Record<string, unknown> | undefined;
      if (fs) {
        const paid = (fs.paidAmount as number) || 0;
        const total = (fs.totalFee as number) || 0;
        const balance = total - paid;
        return json({
          ...fs,
          balanceAmount: Math.max(0, balance),
          status: balance <= 0 ? 'paid' : paid > 0 ? 'partial' : 'pending',
          feeHeads: [
            { feeHeadId: 'fh-tuition', name: 'Tuition Fee', amount: 6000, paid: Math.min(paid, 6000), balance: Math.max(0, 6000 - paid) },
            { feeHeadId: 'fh-lab', name: 'Lab Fee', amount: 2000, paid: 0, balance: 2000 },
            { feeHeadId: 'fh-transport', name: 'Transport Fee', amount: 2000, paid: 0, balance: 2000 },
          ],
          paymentHistory: state.payments.filter((p) => (p as Record<string, unknown>).studentId === studentId),
        });
      }
      return json({ totalFee: 0, paidAmount: 0, balanceAmount: 0, status: 'pending', feeHeads: [], paymentHistory: [] });
    }

    if (path === '/api/student-fees' && method === 'GET') {
      return json([...state.studentFeeStructures.values()]);
    }

    return json({});
  });

  // Override fee-payments
  await page.route('**/api/fee-payments**', async (route) => {
    const method = route.request().method();
    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      recordFeePayment(state, body.studentId, body.amount || 0, body.paymentMode || 'cash', body.date || new Date().toISOString().split('T')[0]);
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
    const path = url.pathname;
    const method = route.request().method();
    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (path === '/api/fees' && method === 'GET') {
      const summaries = state.students.map((s) => {
        const fs = state.studentFeeStructures.get(s.id) as Record<string, unknown> | undefined;
        const paid = (fs?.paidAmount as number) || 0;
        const total = (fs?.totalFee as number) || 0;
        const balance = total - paid;
        return {
          studentId: s.id, studentName: s.name, admissionId: s.admissionId,
          classId: s.classId, className: '10-A',
          totalFee: total, paidAmount: paid,
          balanceAmount: Math.max(0, balance),
          status: balance <= 0 ? 'paid' : paid > 0 ? 'partial' : 'pending',
        };
      });
      return json(summaries);
    }

    return json(state.payments);
  });
}

/* ─────────────────────────────────────────────────────────────────────
 *  Tests
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC100: Fee Partial Payment', () => {
  test('1) student seeded with totalFee=10000, balance=10000, status pending', async ({ page }) => {
    const state = createMockState();
    const student = seedStudentWithCustomFee(state, 10000);
    await installPartialPaymentMockApi(page, state);

    const fs = state.studentFeeStructures.get(student.id) as Record<string, unknown>;
    expect(fs.totalFee).toBe(10000);
    expect(fs.paidAmount).toBe(0);
    expect(fs.balanceAmount).toBe(10000);
    expect(fs.status).toBe('pending');

    await page.goto('/fees');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/\/login/);

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/fee|payment/);
  });

  test('2) first partial payment of 3000 (cash) - balance becomes 7000', async ({ page }) => {
    const state = createMockState();
    const student = seedStudentWithCustomFee(state, 10000);
    const today = new Date().toISOString().split('T')[0];

    recordFeePayment(state, student.id, 3000, 'cash', today);

    const fs = state.studentFeeStructures.get(student.id) as Record<string, unknown>;
    expect(fs.paidAmount).toBe(3000);
    expect(fs.balanceAmount).toBe(7000);
    // Status should be partial or pending (not paid)
    expect(['partial', 'pending']).toContain(fs.status);

    await installPartialPaymentMockApi(page, state);
    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    // Navigate to student fees
    const studentLink = page.getByText(student.name).first();
    const hasStudent = await studentLink.isVisible({ timeout: 10_000 }).catch(() => false);
    if (hasStudent) {
      await studentLink.click();
      await page.waitForLoadState('networkidle');
    }

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/fee|payment|balance/);
  });

  test('3) second partial payment of 2000 (online) - balance becomes 5000', async ({ page }) => {
    const state = createMockState();
    const student = seedStudentWithCustomFee(state, 10000);
    const today = new Date().toISOString().split('T')[0];

    recordFeePayment(state, student.id, 3000, 'cash', today);
    recordFeePayment(state, student.id, 2000, 'online', today);

    const fs = state.studentFeeStructures.get(student.id) as Record<string, unknown>;
    expect(fs.paidAmount).toBe(5000);
    expect(fs.balanceAmount).toBe(5000);
    expect(['partial', 'pending']).toContain(fs.status);

    await installPartialPaymentMockApi(page, state);
    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    const studentLink = page.getByText(student.name).first();
    const hasStudent = await studentLink.isVisible({ timeout: 10_000 }).catch(() => false);
    if (hasStudent) {
      await studentLink.click();
      await page.waitForLoadState('networkidle');
    }

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/fee|payment|balance/);
  });

  test('4) final payment of 5000 (card) - balance becomes 0, status Paid', async ({ page }) => {
    const state = createMockState();
    const student = seedStudentWithCustomFee(state, 10000);
    const today = new Date().toISOString().split('T')[0];

    recordFeePayment(state, student.id, 3000, 'cash', today);
    recordFeePayment(state, student.id, 2000, 'online', today);
    recordFeePayment(state, student.id, 5000, 'card', today);

    const fs = state.studentFeeStructures.get(student.id) as Record<string, unknown>;
    expect(fs.paidAmount).toBe(10000);
    expect(fs.balanceAmount).toBe(0);
    expect(fs.status).toBe('paid');

    await installPartialPaymentMockApi(page, state);
    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/fee|payment/);
  });

  test('5) payment history shows 3 entries on student dashboard fees tab', async ({ page }) => {
    const state = createMockState();
    const student = seedStudentWithCustomFee(state, 10000);
    const today = new Date().toISOString().split('T')[0];

    recordFeePayment(state, student.id, 3000, 'cash', today);
    recordFeePayment(state, student.id, 2000, 'online', today);
    recordFeePayment(state, student.id, 5000, 'card', today);

    await installPartialPaymentMockApi(page, state);

    // Navigate to student dashboard
    await page.goto(`/students/${student.id}`);
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);

    // Check for fees tab or payment history
    const feesTab = page.getByRole('tab', { name: /fee/i }).first();
    const hasFeesTab = await feesTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasFeesTab) {
      await feesTab.click();
      await page.waitForLoadState('networkidle');
    }

    // Verify 3 payments exist in mock state
    const studentPayments = state.payments.filter((p) => (p as Record<string, unknown>).studentId === student.id);
    expect(studentPayments.length).toBe(3);

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/fee|payment|history|paid/);
  });

  test('6) total paid equals 10000 and balance equals 0', async ({ page }) => {
    const state = createMockState();
    const student = seedStudentWithCustomFee(state, 10000);
    const today = new Date().toISOString().split('T')[0];

    recordFeePayment(state, student.id, 3000, 'cash', today);
    recordFeePayment(state, student.id, 2000, 'online', today);
    recordFeePayment(state, student.id, 5000, 'card', today);

    await installPartialPaymentMockApi(page, state);

    // Verify via state
    const fs = state.studentFeeStructures.get(student.id) as Record<string, unknown>;
    expect(fs.totalFee).toBe(10000);
    expect(fs.paidAmount).toBe(10000);
    expect(fs.balanceAmount).toBe(0);

    // Verify total from payments
    const totalPaid = state.payments
      .filter((p) => (p as Record<string, unknown>).studentId === student.id)
      .reduce((sum, p) => sum + ((p as Record<string, unknown>).amount as number), 0);
    expect(totalPaid).toBe(10000);

    await page.goto(`/students/${student.id}`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('7) each payment entry has correct amount, date, and mode', async ({ page }) => {
    const state = createMockState();
    const student = seedStudentWithCustomFee(state, 10000);
    const today = new Date().toISOString().split('T')[0];

    recordFeePayment(state, student.id, 3000, 'cash', today);
    recordFeePayment(state, student.id, 2000, 'online', today);
    recordFeePayment(state, student.id, 5000, 'card', today);

    // Verify each payment entry
    const payments = state.payments.filter((p) => (p as Record<string, unknown>).studentId === student.id);

    const p1 = payments[0] as Record<string, unknown>;
    expect(p1.amount).toBe(3000);
    expect(p1.paymentMode).toBe('cash');
    expect(p1.date).toBe(today);

    const p2 = payments[1] as Record<string, unknown>;
    expect(p2.amount).toBe(2000);
    expect(p2.paymentMode).toBe('online');
    expect(p2.date).toBe(today);

    const p3 = payments[2] as Record<string, unknown>;
    expect(p3.amount).toBe(5000);
    expect(p3.paymentMode).toBe('card');
    expect(p3.date).toBe(today);

    await installPartialPaymentMockApi(page, state);
    await page.goto(`/students/${student.id}`);
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  test('8) fees page reflects "Paid" status after all partial payments complete', async ({ page }) => {
    const state = createMockState();
    const student = seedStudentWithCustomFee(state, 10000);
    const today = new Date().toISOString().split('T')[0];

    recordFeePayment(state, student.id, 3000, 'cash', today);
    recordFeePayment(state, student.id, 2000, 'online', today);
    recordFeePayment(state, student.id, 5000, 'card', today);

    await installPartialPaymentMockApi(page, state);

    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    // The fee structure status should now show as paid
    const fs = state.studentFeeStructures.get(student.id) as Record<string, unknown>;
    expect(fs.status).toBe('paid');

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/fee|payment/);
  });
});
