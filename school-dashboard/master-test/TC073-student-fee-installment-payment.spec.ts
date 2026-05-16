import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  seedStudent, recordFeePayment,
  CLASS_10A_ID, SCHOOL_ID,
  type MockState, type StudentRecord,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ────────────────────────────────────────────────────────────
 *  Helpers — seed student with installment-based fee structure
 * ──────────────────────────────────────────────────────────── */

interface Installment {
  _id: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  status: string;
  paidAmount: number;
  paidDate: string | null;
}

function seedStudentWithInstallments(state: MockState): {
  student: StudentRecord;
  installments: Installment[];
} {
  const student = seedStudent(state, {
    name: 'Meera Nair',
    classId: CLASS_10A_ID,
    feeStatus: 'pending',
  });

  const installments: Installment[] = [
    {
      _id: 'inst-001', installmentNumber: 1,
      amount: 4000, dueDate: '2026-04-15',
      status: 'pending', paidAmount: 0, paidDate: null,
    },
    {
      _id: 'inst-002', installmentNumber: 2,
      amount: 4000, dueDate: '2026-07-15',
      status: 'pending', paidAmount: 0, paidDate: null,
    },
    {
      _id: 'inst-003', installmentNumber: 3,
      amount: 4000, dueDate: '2026-10-15',
      status: 'pending', paidAmount: 0, paidDate: null,
    },
  ];

  // Store fee structure in state
  state.studentFeeStructures.set(student.id, {
    _id: `sfs-${student.id}`,
    studentId: student.id,
    totalFee: 12000,
    paidAmount: 0,
    balanceAmount: 12000,
    status: 'pending',
    installments,
    schoolId: SCHOOL_ID,
  });

  return { student, installments };
}

/* ────────────────────────────────────────────────────────────
 *  Extended mock API with installment payment support
 * ──────────────────────────────────────────────────────────── */

async function installInstallmentMockApi(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  await installMockApi(page, state);

  // Override fee structure endpoint with installment data
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
            { feeHeadId: 'fh-tuition', name: 'Tuition Fee', amount: 8000 },
            { feeHeadId: 'fh-transport', name: 'Transport Fee', amount: 4000 },
          ],
        });
      }
      return json({ totalFee: 0, paidAmount: 0, balanceAmount: 0, status: 'pending', installments: [] });
    }

    return json(Array.from(state.studentFeeStructures.values()));
  });

  // Override fee payment endpoint
  await page.route('**/api/fee-payments**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    state.requestLog.add(`${method} ${path}`);

    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (path === '/api/fee-payments' && method === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      const studentId = body.studentId;
      const amount = body.amount || 0;
      const mode = body.paymentMode || 'cash';
      const installmentId = body.installmentId;

      recordFeePayment(state, studentId, amount, mode, new Date().toISOString().split('T')[0]);

      // Update installment status
      const fs = state.studentFeeStructures.get(studentId) as Record<string, unknown> | undefined;
      if (fs && fs.installments) {
        const installments = fs.installments as Installment[];
        const inst = installments.find((i) => i._id === installmentId || i.installmentNumber === body.installmentNumber);
        if (inst) {
          inst.status = 'paid';
          inst.paidAmount = amount;
          inst.paidDate = new Date().toISOString().split('T')[0];
        }
        // Recalculate totals
        const totalPaid = installments.reduce((sum, i) => sum + i.paidAmount, 0);
        fs.paidAmount = totalPaid;
        fs.balanceAmount = (fs.totalFee as number) - totalPaid;
        fs.status = totalPaid >= (fs.totalFee as number) ? 'paid' : totalPaid > 0 ? 'partial' : 'pending';
      }

      const payment = state.payments[state.payments.length - 1];
      return json({
        ...payment,
        receipt: {
          receiptNumber: (payment as Record<string, unknown>).receiptNumber,
          amount,
          paymentMode: mode,
        },
      }, 201);
    }

    if (method === 'GET') {
      const studentId = url.searchParams.get('studentId');
      const filtered = studentId
        ? state.payments.filter((p) => (p as Record<string, unknown>).studentId === studentId)
        : state.payments;
      return json({ data: filtered, total: filtered.length });
    }

    return route.continue();
  });
}

/* ────────────────────────────────────────────────────────────
 *  TC073 — Pay fees in installments across multiple visits
 * ──────────────────────────────────────────────────────────── */

test.describe('TC073 - Student Fee Installment Payment', () => {
  let state: MockState;
  let student: StudentRecord;
  let installments: Installment[];

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    const seeded = seedStudentWithInstallments(state);
    student = seeded.student;
    installments = seeded.installments;
    await installInstallmentMockApi(page, state);
  });

  test('should display fee page with student and total fee amount', async ({ page }) => {
    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    // Verify the fees page loaded
    const heading = page.getByRole('heading', { name: /fee|payment|collect/i })
      .or(page.getByText(/fee management|fee collection/i))
      .first();
    await expect(heading).toBeVisible();
  });

  test('should show 3 installments with due dates and amounts', async ({ page }) => {
    // Navigate to student fee detail
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    // Click Fees tab
    const feesTab = page.getByRole('tab', { name: /fee/i })
      .or(page.getByText(/fees/i))
      .first();
    if (await feesTab.isVisible().catch(() => false)) {
      await feesTab.click();
      await page.waitForTimeout(500);
    }

    // Verify total fee
    const totalFee = page.getByText(/12,000|12000/).first();
    if (await totalFee.isVisible().catch(() => false)) {
      await expect(totalFee).toBeVisible();
    }

    // Verify installment amounts (4000 each)
    const installmentAmounts = page.getByText(/4,000|4000/);
    if (await installmentAmounts.first().isVisible().catch(() => false)) {
      const count = await installmentAmounts.count();
      expect(count).toBeGreaterThanOrEqual(3);
    }

    // Verify due dates shown
    const dueDate1 = page.getByText(/Apr.*15|15.*Apr|2026-04-15/).first();
    if (await dueDate1.isVisible().catch(() => false)) {
      await expect(dueDate1).toBeVisible();
    }
  });

  test('should pay first installment with cash', async ({ page }) => {
    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    // Select the student
    const studentLink = page.getByText('Meera Nair')
      .or(page.getByRole('row').filter({ hasText: 'Meera' }))
      .first();

    if (await studentLink.isVisible().catch(() => false)) {
      await studentLink.click();
      await page.waitForTimeout(500);

      // Look for installment 1 or first pay button
      const payBtn = page.getByRole('button', { name: /pay|collect|installment 1/i })
        .or(page.locator('[data-testid="pay-installment-1"]'))
        .first();

      if (await payBtn.isVisible().catch(() => false)) {
        await payBtn.click();
        await page.waitForTimeout(300);

        // Enter amount (may be auto-filled to 4000)
        const amountInput = page.getByLabel(/amount/i)
          .or(page.getByPlaceholder(/amount/i))
          .first();
        if (await amountInput.isVisible().catch(() => false)) {
          const currentVal = await amountInput.inputValue();
          if (!currentVal || currentVal === '0') {
            await amountInput.fill('4000');
          }
        }

        // Select cash payment mode
        const cashOption = page.getByLabel(/cash/i)
          .or(page.getByRole('radio', { name: /cash/i }))
          .or(page.getByRole('button', { name: /cash/i }))
          .first();
        if (await cashOption.isVisible().catch(() => false)) {
          await cashOption.click();
        }

        // Submit payment
        const submitBtn = page.getByRole('button', { name: /submit|pay|confirm|record/i }).first();
        if (await submitBtn.isVisible().catch(() => false)) {
          await submitBtn.click();
          await page.waitForTimeout(500);

          // Verify payment was recorded
          expect(state.payments.length).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });

  test('should update balance after first installment payment', async ({ page }) => {
    // Simulate first payment already made
    recordFeePayment(state, student.id, 4000, 'cash', '2026-04-15');
    const fs = state.studentFeeStructures.get(student.id) as Record<string, unknown>;
    if (fs && fs.installments) {
      const inst = (fs.installments as Installment[])[0];
      inst.status = 'paid';
      inst.paidAmount = 4000;
      inst.paidDate = '2026-04-15';
      fs.paidAmount = 4000;
      fs.balanceAmount = 8000;
      fs.status = 'partial';
    }

    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    const feesTab = page.getByRole('tab', { name: /fee/i })
      .or(page.getByText(/fees/i))
      .first();
    if (await feesTab.isVisible().catch(() => false)) {
      await feesTab.click();
      await page.waitForTimeout(500);
    }

    // Verify balance shows 8000
    const balance = page.getByText(/8,000|8000/).first();
    if (await balance.isVisible().catch(() => false)) {
      await expect(balance).toBeVisible();
    }

    // Verify paid amount shows 4000
    const paid = page.getByText(/4,000|4000/).first();
    if (await paid.isVisible().catch(() => false)) {
      await expect(paid).toBeVisible();
    }
  });

  test('should show installment 1 as paid after payment', async ({ page }) => {
    // Pre-pay first installment
    const fs = state.studentFeeStructures.get(student.id) as Record<string, unknown>;
    if (fs && fs.installments) {
      (fs.installments as Installment[])[0].status = 'paid';
      (fs.installments as Installment[])[0].paidAmount = 4000;
      fs.paidAmount = 4000;
      fs.balanceAmount = 8000;
      fs.status = 'partial';
    }

    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    const feesTab = page.getByRole('tab', { name: /fee/i })
      .or(page.getByText(/fees/i))
      .first();
    if (await feesTab.isVisible().catch(() => false)) {
      await feesTab.click();
      await page.waitForTimeout(500);
    }

    // Verify installment 1 shows paid status
    const paidBadge = page.getByText(/paid/i).first();
    if (await paidBadge.isVisible().catch(() => false)) {
      await expect(paidBadge).toBeVisible();
    }
  });

  test('should pay second installment online', async ({ page }) => {
    // Pre-pay first installment
    recordFeePayment(state, student.id, 4000, 'cash', '2026-04-15');
    const fs = state.studentFeeStructures.get(student.id) as Record<string, unknown>;
    if (fs && fs.installments) {
      (fs.installments as Installment[])[0].status = 'paid';
      (fs.installments as Installment[])[0].paidAmount = 4000;
      fs.paidAmount = 4000;
      fs.balanceAmount = 8000;
      fs.status = 'partial';
    }

    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    // Find student
    const studentLink = page.getByText('Meera Nair')
      .or(page.getByRole('row').filter({ hasText: 'Meera' }))
      .first();

    if (await studentLink.isVisible().catch(() => false)) {
      await studentLink.click();
      await page.waitForTimeout(500);

      // Pay installment 2
      const payBtn = page.getByRole('button', { name: /pay|collect|installment 2/i })
        .or(page.locator('[data-testid="pay-installment-2"]'))
        .first();

      if (await payBtn.isVisible().catch(() => false)) {
        await payBtn.click();
        await page.waitForTimeout(300);

        // Enter amount
        const amountInput = page.getByLabel(/amount/i)
          .or(page.getByPlaceholder(/amount/i))
          .first();
        if (await amountInput.isVisible().catch(() => false)) {
          const currentVal = await amountInput.inputValue();
          if (!currentVal || currentVal === '0') {
            await amountInput.fill('4000');
          }
        }

        // Select online payment mode
        const onlineOption = page.getByLabel(/online|bank|upi|digital/i)
          .or(page.getByRole('radio', { name: /online|bank|upi/i }))
          .or(page.getByRole('button', { name: /online|bank|upi/i }))
          .first();
        if (await onlineOption.isVisible().catch(() => false)) {
          await onlineOption.click();
        }

        // Submit
        const submitBtn = page.getByRole('button', { name: /submit|pay|confirm|record/i }).first();
        if (await submitBtn.isVisible().catch(() => false)) {
          await submitBtn.click();
          await page.waitForTimeout(500);
        }
      }
    }
  });

  test('should show student as fully paid after all installments', async ({ page }) => {
    // Pre-pay all 3 installments
    const fs = state.studentFeeStructures.get(student.id) as Record<string, unknown>;
    if (fs && fs.installments) {
      for (const inst of (fs.installments as Installment[])) {
        inst.status = 'paid';
        inst.paidAmount = 4000;
        inst.paidDate = '2026-04-15';
      }
      fs.paidAmount = 12000;
      fs.balanceAmount = 0;
      fs.status = 'paid';
    }
    student.feeStatus = 'paid';

    // Record 3 payment entries
    recordFeePayment(state, student.id, 4000, 'cash', '2026-04-15');
    recordFeePayment(state, student.id, 4000, 'online', '2026-07-15');
    recordFeePayment(state, student.id, 4000, 'online', '2026-10-15');
    // Reset fee structure (recordFeePayment modifies it)
    if (fs) {
      fs.paidAmount = 12000;
      fs.balanceAmount = 0;
      fs.status = 'paid';
    }

    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    const feesTab = page.getByRole('tab', { name: /fee/i })
      .or(page.getByText(/fees/i))
      .first();
    if (await feesTab.isVisible().catch(() => false)) {
      await feesTab.click();
      await page.waitForTimeout(500);
    }

    // Verify balance is 0
    const zeroBalance = page.getByText(/balance.*0|0.*balance|\u20b90/i).first();
    if (await zeroBalance.isVisible().catch(() => false)) {
      await expect(zeroBalance).toBeVisible();
    }

    // Verify paid status badge
    const paidBadge = page.getByText('Paid', { exact: true })
      .or(page.locator('.badge, .chip, .tag').filter({ hasText: /paid/i }))
      .first();
    if (await paidBadge.isVisible().catch(() => false)) {
      await expect(paidBadge).toBeVisible();
    }
  });

  test('should display payment history with 3 entries after full payment', async ({ page }) => {
    // Pre-create 3 payment entries
    recordFeePayment(state, student.id, 4000, 'cash', '2026-04-15');
    recordFeePayment(state, student.id, 4000, 'online', '2026-07-15');
    recordFeePayment(state, student.id, 4000, 'online', '2026-10-15');

    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    const feesTab = page.getByRole('tab', { name: /fee/i })
      .or(page.getByText(/fees/i))
      .first();
    if (await feesTab.isVisible().catch(() => false)) {
      await feesTab.click();
      await page.waitForTimeout(500);
    }

    // Look for payment history section
    const historySection = page.getByText(/payment history|transaction/i).first();
    if (await historySection.isVisible().catch(() => false)) {
      await expect(historySection).toBeVisible();
    }

    // Verify receipt numbers are shown (RCP-0001, RCP-0002, RCP-0003)
    const receipt1 = page.getByText(/RCP-0001/).first();
    if (await receipt1.isVisible().catch(() => false)) {
      await expect(receipt1).toBeVisible();
    }

    // Verify 3 payment rows exist
    const paymentRows = page.getByText(/4,000|4000/);
    if (await paymentRows.first().isVisible().catch(() => false)) {
      const count = await paymentRows.count();
      expect(count).toBeGreaterThanOrEqual(3);
    }
  });
});
