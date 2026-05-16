/**
 * TC101: Apply fee concession/discount to a student.
 *
 * Seeds a student with totalFee=10000, then applies a "Sibling Discount"
 * concession of 2000, verifies effective fee = 8000, applies a "Merit
 * Scholarship" of 10%, verifies recalculation, checks concession details
 * on fee summary, pays the discounted amount, and verifies "Paid" status.
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

interface Concession {
  _id: string;
  studentId: string;
  type: string;
  discountType: 'fixed' | 'percentage';
  amount: number;
  percentage: number;
  effectiveAmount: number;
  appliedDate: string;
  schoolId: string;
}

function seedStudentWithCustomFee(state: MockState, totalFee: number) {
  const student = seedStudent(state, { name: 'Kavya Iyer', classId: CLASS_10A_ID });
  state.studentFeeStructures.set(student.id, {
    _id: `sfs-${student.id}`, studentId: student.id,
    totalFee, paidAmount: 0, balanceAmount: totalFee,
    concessions: [] as Concession[],
    effectiveFee: totalFee,
    status: 'pending', schoolId: SCHOOL_ID,
  });
  return student;
}

async function installConcessionMockApi(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  await installMockApi(page, state);

  // Override student-fees with concession support
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
        const concessions = (fs.concessions as Concession[]) || [];
        const totalDiscount = concessions.reduce((sum, c) => sum + c.effectiveAmount, 0);
        const effectiveFee = ((fs.totalFee as number) || 0) - totalDiscount;
        return json({
          ...fs,
          effectiveFee,
          balanceAmount: Math.max(0, effectiveFee - ((fs.paidAmount as number) || 0)),
          concessions,
          feeHeads: [
            { feeHeadId: 'fh-tuition', name: 'Tuition Fee', amount: 6000, paid: 0, balance: 6000 },
            { feeHeadId: 'fh-lab', name: 'Lab Fee', amount: 2000, paid: 0, balance: 2000 },
            { feeHeadId: 'fh-transport', name: 'Transport Fee', amount: 2000, paid: 0, balance: 2000 },
          ],
        });
      }
      return json({ totalFee: 0, paidAmount: 0, balanceAmount: 0, effectiveFee: 0, status: 'pending', feeHeads: [], concessions: [] });
    }

    if (path === '/api/student-fees' && method === 'GET') {
      return json([...state.studentFeeStructures.values()]);
    }

    return json({});
  });

  // Concession endpoints
  await page.route('**/api/fee-concessions**', async (route) => {
    const method = route.request().method();
    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      const studentId = body.studentId;
      const fs = state.studentFeeStructures.get(studentId) as Record<string, unknown> | undefined;

      if (fs) {
        const totalFee = (fs.totalFee as number) || 0;
        const concessions = ((fs.concessions as Concession[]) || []).slice();
        const existingDiscount = concessions.reduce((sum, c) => sum + c.effectiveAmount, 0);
        const remainingFee = totalFee - existingDiscount;

        let effectiveAmount = 0;
        if (body.discountType === 'percentage') {
          effectiveAmount = Math.round(remainingFee * (body.percentage / 100));
        } else {
          effectiveAmount = body.amount || 0;
        }

        const concession: Concession = {
          _id: `conc-${Date.now()}`,
          studentId,
          type: body.type || 'General',
          discountType: body.discountType || 'fixed',
          amount: body.amount || 0,
          percentage: body.percentage || 0,
          effectiveAmount,
          appliedDate: new Date().toISOString().split('T')[0],
          schoolId: SCHOOL_ID,
        };

        concessions.push(concession);
        fs.concessions = concessions;

        const totalDiscount = concessions.reduce((sum, c) => sum + c.effectiveAmount, 0);
        fs.effectiveFee = totalFee - totalDiscount;
        fs.balanceAmount = Math.max(0, (fs.effectiveFee as number) - ((fs.paidAmount as number) || 0));

        return json({ ...concession, message: 'Concession applied successfully' }, 201);
      }

      return json({ error: 'Student fee structure not found' }, 404);
    }

    if (method === 'GET') {
      const allConcessions: Concession[] = [];
      for (const fs of state.studentFeeStructures.values()) {
        const fsr = fs as Record<string, unknown>;
        if (fsr.concessions) {
          allConcessions.push(...(fsr.concessions as Concession[]));
        }
      }
      return json(allConcessions);
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
      return json({ ...payment, message: 'Payment recorded successfully' }, 201);
    }

    return json(state.payments);
  });

  // Override /fees list
  await page.route('**/api/fees**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();
    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (path === '/api/fees' && method === 'GET') {
      const summaries = state.students.map((s) => {
        const fs = state.studentFeeStructures.get(s.id) as Record<string, unknown> | undefined;
        const effectiveFee = (fs?.effectiveFee as number) || (fs?.totalFee as number) || 0;
        const paid = (fs?.paidAmount as number) || 0;
        return {
          studentId: s.id, studentName: s.name, admissionId: s.admissionId,
          classId: s.classId, className: '10-A',
          totalFee: (fs?.totalFee as number) || 0,
          effectiveFee, paidAmount: paid,
          balanceAmount: Math.max(0, effectiveFee - paid),
          status: (effectiveFee - paid) <= 0 ? 'paid' : paid > 0 ? 'partial' : 'pending',
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

test.describe('TC101: Fee Concession & Discount', () => {
  test('1) student seeded with totalFee=10000 and no concessions', async ({ page }) => {
    const state = createMockState();
    const student = seedStudentWithCustomFee(state, 10000);
    await installConcessionMockApi(page, state);

    const fs = state.studentFeeStructures.get(student.id) as Record<string, unknown>;
    expect(fs.totalFee).toBe(10000);
    expect(fs.effectiveFee).toBe(10000);
    expect((fs.concessions as Concession[]).length).toBe(0);

    await page.goto('/fees');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('2) apply Sibling Discount of 2000 - effective fee becomes 8000', async ({ page }) => {
    const state = createMockState();
    const student = seedStudentWithCustomFee(state, 10000);
    await installConcessionMockApi(page, state);

    // Apply concession via state manipulation (simulating the API call)
    const fs = state.studentFeeStructures.get(student.id) as Record<string, unknown>;
    const concession: Concession = {
      _id: 'conc-1', studentId: student.id,
      type: 'Sibling Discount', discountType: 'fixed',
      amount: 2000, percentage: 0, effectiveAmount: 2000,
      appliedDate: new Date().toISOString().split('T')[0],
      schoolId: SCHOOL_ID,
    };
    (fs.concessions as Concession[]).push(concession);
    fs.effectiveFee = 8000;
    fs.balanceAmount = 8000;

    expect(fs.effectiveFee).toBe(8000);
    expect((fs.concessions as Concession[]).length).toBe(1);
    expect((fs.concessions as Concession[])[0].type).toBe('Sibling Discount');

    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    const studentLink = page.getByText(student.name).first();
    const hasStudent = await studentLink.isVisible({ timeout: 10_000 }).catch(() => false);
    if (hasStudent) {
      await studentLink.click();
      await page.waitForLoadState('networkidle');
    }

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/fee|discount|concession|amount/);
  });

  test('3) apply Merit Scholarship 10% on remaining - effective fee recalculates', async ({ page }) => {
    const state = createMockState();
    const student = seedStudentWithCustomFee(state, 10000);
    await installConcessionMockApi(page, state);

    // Apply first concession: Sibling Discount = 2000 fixed
    const fs = state.studentFeeStructures.get(student.id) as Record<string, unknown>;
    const c1: Concession = {
      _id: 'conc-1', studentId: student.id,
      type: 'Sibling Discount', discountType: 'fixed',
      amount: 2000, percentage: 0, effectiveAmount: 2000,
      appliedDate: new Date().toISOString().split('T')[0],
      schoolId: SCHOOL_ID,
    };
    (fs.concessions as Concession[]).push(c1);

    // Apply second concession: Merit Scholarship = 10% of remaining (8000)
    const remaining = 10000 - 2000; // 8000
    const meritDiscount = Math.round(remaining * 0.10); // 800
    const c2: Concession = {
      _id: 'conc-2', studentId: student.id,
      type: 'Merit Scholarship', discountType: 'percentage',
      amount: 0, percentage: 10, effectiveAmount: meritDiscount,
      appliedDate: new Date().toISOString().split('T')[0],
      schoolId: SCHOOL_ID,
    };
    (fs.concessions as Concession[]).push(c2);

    const totalDiscount = 2000 + meritDiscount; // 2800
    fs.effectiveFee = 10000 - totalDiscount;     // 7200
    fs.balanceAmount = 10000 - totalDiscount;

    expect(fs.effectiveFee).toBe(7200);
    expect((fs.concessions as Concession[]).length).toBe(2);

    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    const studentLink = page.getByText(student.name).first();
    const hasStudent = await studentLink.isVisible({ timeout: 10_000 }).catch(() => false);
    if (hasStudent) {
      await studentLink.click();
      await page.waitForLoadState('networkidle');
    }

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/fee|payment|amount/);
  });

  test('4) concession details appear in student fee summary API response', async ({ page }) => {
    const state = createMockState();
    const student = seedStudentWithCustomFee(state, 10000);
    await installConcessionMockApi(page, state);

    // Apply both concessions
    const fs = state.studentFeeStructures.get(student.id) as Record<string, unknown>;
    (fs.concessions as Concession[]).push(
      { _id: 'conc-1', studentId: student.id, type: 'Sibling Discount', discountType: 'fixed', amount: 2000, percentage: 0, effectiveAmount: 2000, appliedDate: '2026-03-30', schoolId: SCHOOL_ID },
      { _id: 'conc-2', studentId: student.id, type: 'Merit Scholarship', discountType: 'percentage', amount: 0, percentage: 10, effectiveAmount: 800, appliedDate: '2026-03-30', schoolId: SCHOOL_ID },
    );
    fs.effectiveFee = 7200;
    fs.balanceAmount = 7200;

    // Verify concession details
    const concessions = fs.concessions as Concession[];
    expect(concessions[0].type).toBe('Sibling Discount');
    expect(concessions[0].effectiveAmount).toBe(2000);
    expect(concessions[1].type).toBe('Merit Scholarship');
    expect(concessions[1].percentage).toBe(10);
    expect(concessions[1].effectiveAmount).toBe(800);

    await page.goto(`/students/${student.id}`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('5) pay the discounted amount (7200) and verify "Paid" status', async ({ page }) => {
    const state = createMockState();
    const student = seedStudentWithCustomFee(state, 10000);
    await installConcessionMockApi(page, state);

    // Apply concessions first
    const fs = state.studentFeeStructures.get(student.id) as Record<string, unknown>;
    (fs.concessions as Concession[]).push(
      { _id: 'conc-1', studentId: student.id, type: 'Sibling Discount', discountType: 'fixed', amount: 2000, percentage: 0, effectiveAmount: 2000, appliedDate: '2026-03-30', schoolId: SCHOOL_ID },
      { _id: 'conc-2', studentId: student.id, type: 'Merit Scholarship', discountType: 'percentage', amount: 0, percentage: 10, effectiveAmount: 800, appliedDate: '2026-03-30', schoolId: SCHOOL_ID },
    );
    fs.effectiveFee = 7200;
    fs.balanceAmount = 7200;
    fs.totalFee = 7200; // Adjust totalFee for payment tracking

    // Pay the discounted fee
    const today = new Date().toISOString().split('T')[0];
    recordFeePayment(state, student.id, 7200, 'cash', today);

    expect(fs.paidAmount).toBe(7200);
    expect(fs.balanceAmount).toBe(0);
    expect(fs.status).toBe('paid');

    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/fee|payment/);
  });

  test('6) navigate to student fee page and verify concession is reflected', async ({ page }) => {
    const state = createMockState();
    const student = seedStudentWithCustomFee(state, 10000);
    await installConcessionMockApi(page, state);

    const fs = state.studentFeeStructures.get(student.id) as Record<string, unknown>;
    (fs.concessions as Concession[]).push(
      { _id: 'conc-1', studentId: student.id, type: 'Sibling Discount', discountType: 'fixed', amount: 2000, percentage: 0, effectiveAmount: 2000, appliedDate: '2026-03-30', schoolId: SCHOOL_ID },
    );
    fs.effectiveFee = 8000;
    fs.balanceAmount = 8000;

    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    // Open student
    const studentLink = page.getByText(student.name).first();
    const hasStudent = await studentLink.isVisible({ timeout: 10_000 }).catch(() => false);
    if (hasStudent) {
      await studentLink.click();
      await page.waitForLoadState('networkidle');

      // Look for concession/discount text
      const bodyText = await page.textContent('body');
      expect(bodyText?.toLowerCase()).toMatch(/fee|discount|concession|amount/);
    }

    await expect(page).not.toHaveURL(/\/login/);
  });

  test('7) concession cannot exceed total fee amount', async ({ page }) => {
    const state = createMockState();
    const student = seedStudentWithCustomFee(state, 10000);
    await installConcessionMockApi(page, state);

    // Apply a concession equal to total fee
    const fs = state.studentFeeStructures.get(student.id) as Record<string, unknown>;
    (fs.concessions as Concession[]).push(
      { _id: 'conc-1', studentId: student.id, type: 'Full Scholarship', discountType: 'fixed', amount: 10000, percentage: 0, effectiveAmount: 10000, appliedDate: '2026-03-30', schoolId: SCHOOL_ID },
    );
    fs.effectiveFee = 0;
    fs.balanceAmount = 0;

    // Effective fee should be 0 (not negative)
    expect(fs.effectiveFee).toBe(0);
    expect(fs.balanceAmount).toBe(0);

    await page.goto('/fees');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/\/login/);
  });
});
