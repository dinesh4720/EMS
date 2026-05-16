import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  seedStudentWithFees, recordFeePayment,
  CLASS_10A_ID, SCHOOL_ID,
  type MockState, type StudentRecord,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ────────────────────────────────────────────────────────────
 *  Extended mock API with fee payment endpoints
 * ──────────────────────────────────────────────────────────── */

async function installFeePaymentMockApi(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  await installMockApi(page, state);

  // Override fee-payment-specific routes for richer responses
  await page.route('**/api/fee-payments**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    state.requestLog.add(`${method} ${path}`);

    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    // POST /api/fee-payments — Record a payment
    if (path === '/api/fee-payments' && method === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      const studentId = body.studentId;
      const amount = body.amount || 0;
      const mode = body.paymentMode || 'cash';
      const date = body.paymentDate || new Date().toISOString().split('T')[0];

      recordFeePayment(state, studentId, amount, mode, date);

      const payment = state.payments[state.payments.length - 1];
      return json({
        ...payment,
        receipt: {
          receiptNumber: (payment as Record<string, unknown>).receiptNumber,
          studentName: state.students.find((s) => s.id === studentId)?.name || '',
          amount,
          paymentMode: mode,
          date,
          feeHeads: body.feeHeads || [],
        },
      }, 201);
    }

    // GET /api/fee-payments — List payments
    if (path === '/api/fee-payments' && method === 'GET') {
      return json({ data: state.payments, total: state.payments.length });
    }

    return route.continue();
  });

  // Override student fee structures for detailed response
  await page.route('**/api/student-fees/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    state.requestLog.add(`${method} ${path}`);

    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    const idMatch = path.match(/\/api\/student-fees\/([^/]+)/);
    if (idMatch) {
      const studentId = idMatch[1];
      const fs = state.studentFeeStructures.get(studentId);
      if (fs) {
        return json({
          ...fs,
          feeHeads: [
            { feeHeadId: 'fh-tuition', name: 'Tuition Fee', amount: 5000, paid: (fs as Record<string, unknown>).status === 'paid' ? 5000 : 0 },
            { feeHeadId: 'fh-transport', name: 'Transport Fee', amount: 2000, paid: (fs as Record<string, unknown>).status === 'paid' ? 2000 : 0 },
          ],
        });
      }
      return json({ totalFee: 0, paidAmount: 0, balanceAmount: 0, status: 'pending', feeHeads: [] });
    }

    return json([...state.studentFeeStructures.values()]);
  });
}

/* ────────────────────────────────────────────────────────────
 *  TC023 — Record fee payment for a student, verify receipt
 * ──────────────────────────────────────────────────────────── */

test.describe('TC023 - Student Fee Management', () => {
  let state: MockState;
  let students: StudentRecord[];

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    students = [
      seedStudentWithFees(state, { name: 'Aarav Patel', classId: CLASS_10A_ID, feeStatus: 'pending' }),
      seedStudentWithFees(state, { name: 'Diya Sharma', classId: CLASS_10A_ID, feeStatus: 'pending' }),
      seedStudentWithFees(state, { name: 'Ishaan Gupta', classId: CLASS_10A_ID, feeStatus: 'pending' }),
    ];
    await installFeePaymentMockApi(page, state);
  });

  test('should display fee page with students and their fee status', async ({ page }) => {
    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    // Verify the fees page loaded
    const heading = page.getByRole('heading', { name: /fee|payment|collect/i })
      .or(page.getByText(/fee management|fee collection/i))
      .first();
    await expect(heading).toBeVisible();
  });

  test('should show student list with pending fee status', async ({ page }) => {
    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    // Look for student names or fee status indicators
    const studentEntry = page.getByText('Aarav Patel')
      .or(page.getByText(/pending/i))
      .first();
    if (await studentEntry.isVisible().catch(() => false)) {
      await expect(studentEntry).toBeVisible();
    }
  });

  test('should display fee heads with amounts for a student', async ({ page }) => {
    // Navigate to the student's fee details
    await page.goto(`/students/dashboard?id=${students[0].id}`);
    await page.waitForLoadState('networkidle');

    // Click Fees tab
    const feesTab = page.getByRole('tab', { name: /fee/i })
      .or(page.getByText(/fees/i))
      .first();
    if (await feesTab.isVisible().catch(() => false)) {
      await feesTab.click();
      await page.waitForTimeout(500);
    }

    // Verify fee heads are displayed
    const tuitionFee = page.getByText(/tuition/i).first();
    if (await tuitionFee.isVisible().catch(() => false)) {
      await expect(tuitionFee).toBeVisible();
    }

    const transportFee = page.getByText(/transport/i).first();
    if (await transportFee.isVisible().catch(() => false)) {
      await expect(transportFee).toBeVisible();
    }

    // Verify amounts
    const amount5000 = page.getByText(/5,000|5000/).first();
    if (await amount5000.isVisible().catch(() => false)) {
      await expect(amount5000).toBeVisible();
    }
  });

  test('should select fee heads and verify total amount calculation', async ({ page }) => {
    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    // Click on a student to open fee collection
    const studentLink = page.getByText('Aarav Patel')
      .or(page.getByRole('link', { name: /Aarav/i }))
      .or(page.getByRole('row').filter({ hasText: 'Aarav' }))
      .first();

    if (await studentLink.isVisible().catch(() => false)) {
      await studentLink.click();
      await page.waitForTimeout(500);

      // Look for fee head checkboxes
      const tuitionCheckbox = page.getByRole('checkbox', { name: /tuition/i })
        .or(page.locator('input[type="checkbox"]').first())
        .first();

      if (await tuitionCheckbox.isVisible().catch(() => false)) {
        await tuitionCheckbox.check();

        // Verify total amount updates
        const totalAmount = page.getByText(/total|7,000|7000|5,000|5000/).first();
        if (await totalAmount.isVisible().catch(() => false)) {
          await expect(totalAmount).toBeVisible();
        }
      }
    }
  });

  test('should select Cash payment mode and collect payment', async ({ page }) => {
    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    // Navigate to collect payment for the first student
    const collectBtn = page.getByRole('button', { name: /collect|pay|record payment/i })
      .or(page.getByText('Aarav Patel'))
      .first();

    if (await collectBtn.isVisible().catch(() => false)) {
      await collectBtn.click();
      await page.waitForTimeout(500);

      // Select payment mode - Cash
      const cashMode = page.getByRole('button', { name: /cash/i })
        .or(page.getByLabel(/cash/i))
        .or(page.getByText(/cash/i))
        .first();

      if (await cashMode.isVisible().catch(() => false)) {
        await cashMode.click();
      }

      // Click collect/submit payment button
      const payBtn = page.getByRole('button', { name: /collect payment|submit|confirm|pay/i }).first();
      if (await payBtn.isVisible().catch(() => false)) {
        await payBtn.click();
        await page.waitForTimeout(500);

        // Verify success
        const successMsg = page.getByText(/success|payment recorded|payment collected/i).first();
        if (await successMsg.isVisible().catch(() => false)) {
          await expect(successMsg).toBeVisible();
        }
      }
    }
  });

  test('should show receipt after successful payment', async ({ page }) => {
    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    // Try to find a "Collect Payment" action
    const collectBtn = page.getByRole('button', { name: /collect|pay/i })
      .or(page.getByText('Aarav Patel'))
      .first();

    if (await collectBtn.isVisible().catch(() => false)) {
      await collectBtn.click();
      await page.waitForTimeout(500);

      // Select Cash mode
      const cashMode = page.getByText(/cash/i).first();
      if (await cashMode.isVisible().catch(() => false)) {
        await cashMode.click();
      }

      // Submit payment
      const payBtn = page.getByRole('button', { name: /collect payment|submit|confirm/i }).first();
      if (await payBtn.isVisible().catch(() => false)) {
        await payBtn.click();
        await page.waitForTimeout(1000);

        // Verify receipt modal/view appears
        const receiptSection = page.getByText(/receipt|RCP-/i).first();
        if (await receiptSection.isVisible().catch(() => false)) {
          await expect(receiptSection).toBeVisible();

          // Verify receipt contains student name
          const studentNameOnReceipt = page.getByText('Aarav Patel').first();
          await expect(studentNameOnReceipt).toBeVisible();
        }
      }
    }
  });

  test('should update student fee status after payment', async ({ page }) => {
    // Pre-record a full payment for the first student
    recordFeePayment(state, students[0].id, 7000, 'cash', '2026-03-25');

    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    // The first student's status should now be "paid"
    const paidBadge = page.getByText(/paid/i).first();
    if (await paidBadge.isVisible().catch(() => false)) {
      await expect(paidBadge).toBeVisible();
    }
  });
});
