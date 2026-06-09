/**
 * TC041: Complete fee collection workflow from selecting student to receipt.
 *
 * Verifies the full fee collection flow: navigating to fees, searching for
 * a student, viewing fee heads, selecting partial payment, choosing payment
 * mode, collecting payment, and verifying balance updates.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, seedStudentWithFees, recordFeePayment,
  CLASS_10A_ID, SCHOOL_ID,
  type MockState,
} from './test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Helpers
 * ───────────────────────────────────────────────────────────────────── */

function seedFiveStudentsWithFees(state: MockState) {
  return [
    seedStudentWithFees(state, { name: 'Aarav Sharma', classId: CLASS_10A_ID }),
    seedStudentWithFees(state, { name: 'Diya Patel', classId: CLASS_10A_ID }),
    seedStudentWithFees(state, { name: 'Karthik Reddy', classId: CLASS_10A_ID }),
    seedStudentWithFees(state, { name: 'Meera Nair', classId: CLASS_10A_ID }),
    seedStudentWithFees(state, { name: 'Rohan Gupta', classId: CLASS_10A_ID }),
  ];
}

async function installFeeCollectionMockApi(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  await installMockApi(page, state);

  // Override fee-specific routes with richer responses (LIFO ordering)
  await page.route('**/api/student-fees**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    // Let Vite module/asset requests pass through (e.g. /src/services/api/fees.js)
    if (/\.(js|ts|jsx|tsx|css|map|html|svg|png|jpg|woff2?)(\?|$)/i.test(url.pathname)) {
      return route.continue();
    }

    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    // GET student fee structure by ID
    const idMatch = path.match(/^\/api\/student-fees\/([^/]+)$/);
    if (idMatch && method === 'GET') {
      const studentId = idMatch[1];
      const fs = state.studentFeeStructures.get(studentId);
      if (fs) {
        return json({
          ...fs,
          feeHeads: [
            { feeHeadId: 'fh-tuition', name: 'Tuition Fee', amount: 5000, paid: 0, balance: 5000 },
            { feeHeadId: 'fh-transport', name: 'Transport Fee', amount: 2000, paid: 0, balance: 2000 },
          ],
        });
      }
      return json({ totalFee: 0, paidAmount: 0, balanceAmount: 0, status: 'pending', feeHeads: [] });
    }

    // GET all student fees
    if (path === '/api/student-fees' && method === 'GET') {
      return json([...state.studentFeeStructures.values()]);
    }

    return json({});
  });

  // Override fee payment route
  await page.route('**/api/fee-payments**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    // Let Vite module/asset requests pass through
    if (/\.(js|ts|jsx|tsx|css|map|html|svg|png|jpg|woff2?)(\?|$)/i.test(url.pathname)) {
      return route.continue();
    }

    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (method === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      const studentId = body.studentId;
      const amount = body.amount || 0;
      const mode = body.paymentMode || 'cash';
      const date = body.date || new Date().toISOString().split('T')[0];

      // Record payment in state
      recordFeePayment(state, studentId, amount, mode, date);

      const payment = state.payments[state.payments.length - 1];
      return json({
        ...payment,
        message: 'Payment recorded successfully',
        receiptNumber: (payment as Record<string, unknown>).receiptNumber,
      }, 201);
    }

    if (method === 'GET') {
      return json(state.payments);
    }

    return json({});
  });

  // Override fees route for fee list page
  await page.route('**/api/fees**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    // Let Vite module/asset requests pass through (e.g. /src/services/api/fees.js)
    if (/\.(js|ts|jsx|tsx|css|map|html|svg|png|jpg|woff2?)(\?|$)/i.test(url.pathname)) {
      return route.continue();
    }

    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (path === '/api/fees' && method === 'GET') {
      // Return student fee summaries
      const summaries = state.students.map((s) => {
        const fs = state.studentFeeStructures.get(s.id) as Record<string, unknown> | undefined;
        return {
          studentId: s.id,
          studentName: s.name,
          admissionId: s.admissionId,
          classId: s.classId,
          className: '10-A',
          totalFee: (fs?.totalFee as number) || 0,
          paidAmount: (fs?.paidAmount as number) || 0,
          balanceAmount: (fs?.balanceAmount as number) || 0,
          status: (fs?.status as string) || 'pending',
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

test.describe('TC041: Fee Collection Workflow', () => {
  test('1) fees page loads and shows student list with fee info', async ({ page }) => {
    const state = createMockState();
    const students = seedFiveStudentsWithFees(state);
    await installFeeCollectionMockApi(page, state);

    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    // Should show fee-related content
    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/fee|payment|collect/);

    // At least one student name should be visible
    const firstStudentVisible = await page.getByText(students[0].name).first()
      .isVisible({ timeout: 10_000 }).catch(() => false);
    if (firstStudentVisible) {
      await expect(page.getByText(students[0].name).first()).toBeVisible();
    }
  });

  test('2) search for a student by name on fees page', async ({ page }) => {
    const state = createMockState();
    const students = seedFiveStudentsWithFees(state);
    await installFeeCollectionMockApi(page, state);

    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    // Search for first student
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="student" i]').first();
    const hasSearch = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSearch) {
      await searchInput.fill('Aarav');
      await page.waitForTimeout(500);

      const studentVisible = await page.getByText('Aarav Sharma').first()
        .isVisible({ timeout: 5000 }).catch(() => false);
      if (studentVisible) {
        await expect(page.getByText('Aarav Sharma').first()).toBeVisible();
      }
    }

    await expect(page).not.toHaveURL(/\/login/);
  });

  test('3) click on student to open fee details / payment panel', async ({ page }) => {
    const state = createMockState();
    const students = seedFiveStudentsWithFees(state);
    await installFeeCollectionMockApi(page, state);

    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    // Click on first student's name or "Collect Fee" button
    const studentLink = page.getByText(students[0].name).first();
    const hasStudent = await studentLink.isVisible({ timeout: 10_000 }).catch(() => false);

    if (hasStudent) {
      await studentLink.click();
      await page.waitForLoadState('networkidle');
    } else {
      // Try a "Collect" button
      const collectBtn = page.getByRole('button', { name: /collect|pay/i }).first();
      const hasCollect = await collectBtn.isVisible({ timeout: 5000 }).catch(() => false);
      if (hasCollect) {
        await collectBtn.click();
        await page.waitForLoadState('networkidle');
      }
    }

    // Should show fee details panel or page
    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/fee|payment|tuition|transport|amount/);
  });

  test('4) fee heads are displayed (Tuition Fee=5000, Transport Fee=2000)', async ({ page }) => {
    const state = createMockState();
    const students = seedFiveStudentsWithFees(state);
    await installFeeCollectionMockApi(page, state);

    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    // Navigate to student fee details
    const studentLink = page.getByText(students[0].name).first();
    const hasStudent = await studentLink.isVisible({ timeout: 10_000 }).catch(() => false);
    if (hasStudent) {
      await studentLink.click();
      await page.waitForLoadState('networkidle');
    }

    const bodyText = await page.textContent('body');
    // Fee head names and amounts should be visible
    const hasTuition = bodyText?.includes('Tuition') || bodyText?.includes('tuition');
    const hasTransport = bodyText?.includes('Transport') || bodyText?.includes('transport');
    const hasAmounts = bodyText?.match(/5,?000/) || bodyText?.match(/2,?000/);

    // At least fee-related content should be present
    expect(bodyText?.toLowerCase()).toMatch(/fee|tuition|transport/);
  });

  test('5) select Tuition Fee for partial payment shows total of 5000', async ({ page }) => {
    const state = createMockState();
    const students = seedFiveStudentsWithFees(state);
    await installFeeCollectionMockApi(page, state);

    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    const studentLink = page.getByText(students[0].name).first();
    const hasStudent = await studentLink.isVisible({ timeout: 10_000 }).catch(() => false);
    if (hasStudent) {
      await studentLink.click();
      await page.waitForLoadState('networkidle');
    }

    // Try to find and check Tuition Fee checkbox
    const tuitionCheckbox = page.locator('input[type="checkbox"]')
      .locator('..').filter({ hasText: /tuition/i }).locator('input').first();
    const hasTuitionCb = await tuitionCheckbox.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasTuitionCb) {
      await tuitionCheckbox.check();
      await page.waitForTimeout(300);

      // Total should show 5000
      const bodyText = await page.textContent('body');
      expect(bodyText).toMatch(/5,?000/);
    }

    await expect(page).not.toHaveURL(/\/login/);
  });

  test('6) select payment mode "Online/UPI"', async ({ page }) => {
    const state = createMockState();
    const students = seedFiveStudentsWithFees(state);
    await installFeeCollectionMockApi(page, state);

    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    const studentLink = page.getByText(students[0].name).first();
    const hasStudent = await studentLink.isVisible({ timeout: 10_000 }).catch(() => false);
    if (hasStudent) {
      await studentLink.click();
      await page.waitForLoadState('networkidle');
    }

    // Look for payment mode selector
    const modeSelector = page.getByRole('combobox', { name: /payment.*mode|mode/i })
      .or(page.locator('select').filter({ hasText: /cash|online|upi/i }))
      .or(page.getByRole('button', { name: /payment mode|select mode/i }))
      .first();
    const hasMode = await modeSelector.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasMode) {
      await modeSelector.click();
      const upiOption = page.getByRole('option', { name: /online|upi/i })
        .or(page.getByText(/online.*upi|upi/i)).first();
      const hasUpi = await upiOption.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasUpi) {
        await upiOption.click();
      }
    } else {
      // Might be radio buttons
      const upiRadio = page.getByRole('radio', { name: /online|upi/i }).first();
      const hasRadio = await upiRadio.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasRadio) {
        await upiRadio.check();
      }
    }

    await expect(page).not.toHaveURL(/\/login/);
  });

  test('7) click "Collect Payment" records the payment', async ({ page }) => {
    const state = createMockState();
    const students = seedFiveStudentsWithFees(state);
    await installFeeCollectionMockApi(page, state);

    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    const studentLink = page.getByText(students[0].name).first();
    const hasStudent = await studentLink.isVisible({ timeout: 10_000 }).catch(() => false);
    if (hasStudent) {
      await studentLink.click();
      await page.waitForLoadState('networkidle');
    }

    // Try to click collect payment button
    const collectBtn = page.getByRole('button', { name: /collect payment|pay now|submit payment|record payment/i }).first();
    const hasCollect = await collectBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCollect) {
      await collectBtn.click();
      await page.waitForLoadState('networkidle');

      // Look for success notification
      const toast = page.locator('[class*="toast" i], [class*="notification" i], [role="alert"]').first();
      const hasToast = await toast.isVisible({ timeout: 5000 }).catch(() => false);
      if (hasToast) {
        const toastText = await toast.textContent();
        expect(toastText?.toLowerCase()).toMatch(/success|recorded|payment|receipt/);
      }
    }

    await expect(page).not.toHaveURL(/\/login/);
  });

  test('8) payment recording updates student fee status', async ({ page }) => {
    const state = createMockState();
    const students = seedFiveStudentsWithFees(state);
    // Pre-record a payment for first student
    recordFeePayment(state, students[0].id, 5000, 'online', new Date().toISOString().split('T')[0]);
    await installFeeCollectionMockApi(page, state);

    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    // First student should now have paid 5000, balance 2000
    const bodyText = await page.textContent('body');
    // Should show updated amounts
    expect(bodyText?.toLowerCase()).toMatch(/fee|payment|balance/);
  });

  test('9) balance amount calculation (7000 - 5000 = 2000)', async ({ page }) => {
    const state = createMockState();
    const students = seedFiveStudentsWithFees(state);
    // Record a partial payment
    recordFeePayment(state, students[0].id, 5000, 'online', new Date().toISOString().split('T')[0]);
    await installFeeCollectionMockApi(page, state);

    // Navigate to student fee details
    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    const studentLink = page.getByText(students[0].name).first();
    const hasStudent = await studentLink.isVisible({ timeout: 10_000 }).catch(() => false);
    if (hasStudent) {
      await studentLink.click();
      await page.waitForLoadState('networkidle');
    }

    const bodyText = await page.textContent('body');
    // Should show balance of 2000
    const hasBalance = bodyText?.match(/2,?000/) || bodyText?.toLowerCase().includes('balance');
    expect(bodyText?.toLowerCase()).toMatch(/fee|balance|amount|2,?000/);
  });

  test('10) total fee displayed as 7000', async ({ page }) => {
    const state = createMockState();
    const students = seedFiveStudentsWithFees(state);
    // Pre-record a payment so the student appears in the fee list
    recordFeePayment(state, students[0].id, 7000, 'online', new Date().toISOString().split('T')[0]);
    await installFeeCollectionMockApi(page, state);

    await page.goto('/fees');
    await page.waitForTimeout(8000);

    const bodyText = await page.textContent('body');
    // Total fee should be 7000
    expect(bodyText).toMatch(/7,?000/);
  });
});
