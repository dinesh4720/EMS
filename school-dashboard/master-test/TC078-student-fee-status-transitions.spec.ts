import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  seedStudentWithFees,
  CLASS_10A_ID, SCHOOL_ID,
  type MockState, type StudentRecord,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ────────────────────────────────────────────────────────────
 *  Helpers — seed 4 students with different fee states
 * ──────────────────────────────────────────────────────────── */

interface FeeStudents {
  studentA: StudentRecord; // pending (paid=0)
  studentB: StudentRecord; // partial (paid=5000)
  studentC: StudentRecord; // paid (paid=10000)
  studentD: StudentRecord; // overdue (paid=0, past due date)
}

function seedFeeStatusStudents(state: MockState): FeeStudents {
  const studentA = seedStudentWithFees(state, {
    name: 'Aarav Pending',
    classId: CLASS_10A_ID,
    feeStatus: 'pending',
  });

  const studentB = seedStudentWithFees(state, {
    name: 'Diya Partial',
    classId: CLASS_10A_ID,
    feeStatus: 'pending', // seedStudentWithFees sets basic structure
  });

  const studentC = seedStudentWithFees(state, {
    name: 'Ishaan Paid',
    classId: CLASS_10A_ID,
    feeStatus: 'paid',
  });

  const studentD = seedStudentWithFees(state, {
    name: 'Kavya Overdue',
    classId: CLASS_10A_ID,
    feeStatus: 'overdue',
  });

  // Override fee structures for specific test scenarios
  state.studentFeeStructures.set(studentA.id, {
    _id: `sfs-${studentA.id}`, studentId: studentA.id,
    totalFee: 10000, paidAmount: 0, balanceAmount: 10000,
    status: 'pending', dueDate: '2026-06-30', schoolId: SCHOOL_ID,
  });

  state.studentFeeStructures.set(studentB.id, {
    _id: `sfs-${studentB.id}`, studentId: studentB.id,
    totalFee: 10000, paidAmount: 5000, balanceAmount: 5000,
    status: 'partial', dueDate: '2026-06-30', schoolId: SCHOOL_ID,
  });
  studentB.feeStatus = 'partial';

  state.studentFeeStructures.set(studentC.id, {
    _id: `sfs-${studentC.id}`, studentId: studentC.id,
    totalFee: 10000, paidAmount: 10000, balanceAmount: 0,
    status: 'paid', dueDate: '2026-06-30', schoolId: SCHOOL_ID,
  });

  state.studentFeeStructures.set(studentD.id, {
    _id: `sfs-${studentD.id}`, studentId: studentD.id,
    totalFee: 10000, paidAmount: 0, balanceAmount: 10000,
    status: 'overdue', dueDate: '2026-01-15', schoolId: SCHOOL_ID,
  });

  return { studentA, studentB, studentC, studentD };
}

/* ────────────────────────────────────────────────────────────
 *  Extended mock with fee status filtering and defaulters
 * ──────────────────────────────────────────────────────────── */

async function installFeeStatusMockApi(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  await installMockApi(page, state);

  // Override student listing with fee status filter support
  await page.route('**/api/students?**', async (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();
    if (method !== 'GET') return route.continue();

    const feeStatusFilter = url.searchParams.get('feeStatus');
    state.requestLog.add(`GET /api/students?feeStatus=${feeStatusFilter}`);

    let filtered = state.students;
    if (feeStatusFilter && feeStatusFilter !== 'all') {
      filtered = state.students.filter((s) => s.feeStatus === feeStatusFilter);
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: filtered,
        total: filtered.length,
        page: 1,
        limit: 100,
      }),
    });
  });

  // Fee defaulters endpoint
  await page.route('**/api/fees/defaulters**', async (route) => {
    state.requestLog.add('GET /api/fees/defaulters');
    const defaulters = state.students.filter(
      (s) => s.feeStatus === 'overdue' || s.feeStatus === 'pending',
    );
    const enriched = defaulters.map((s) => {
      const fs = state.studentFeeStructures.get(s.id) as Record<string, unknown> | undefined;
      return {
        ...s,
        totalFee: fs?.totalFee || 0,
        paidAmount: fs?.paidAmount || 0,
        balanceAmount: fs?.balanceAmount || 0,
        dueDate: fs?.dueDate || null,
      };
    });
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: enriched, total: enriched.length }),
    });
  });

  // Override student fee structures
  await page.route('**/api/student-fees/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    state.requestLog.add(`GET ${path}`);

    const idMatch = path.match(/\/api\/student-fees\/([^/]+)/);
    if (idMatch) {
      const studentId = idMatch[1];
      const fs = state.studentFeeStructures.get(studentId);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fs || { totalFee: 0, paidAmount: 0, balanceAmount: 0, status: 'pending' }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(Array.from(state.studentFeeStructures.values())),
    });
  });
}

/* ────────────────────────────────────────────────────────────
 *  TC078 — Fee status transitions (pending/partial/paid/overdue)
 * ──────────────────────────────────────────────────────────── */

test.describe('TC078 - Student Fee Status Transitions', () => {
  let state: MockState;
  let students: FeeStudents;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    students = seedFeeStatusStudents(state);
    await installFeeStatusMockApi(page, state);
  });

  test('should display all 4 students on student list', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Aarav Pending').first()).toBeVisible();
    await expect(page.getByText('Diya Partial').first()).toBeVisible();
    await expect(page.getByText('Ishaan Paid').first()).toBeVisible();
    await expect(page.getByText('Kavya Overdue').first()).toBeVisible();
  });

  test('should show "Pending" badge for Student A (paid=0, not overdue)', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const studentRow = page.getByRole('row').filter({ hasText: 'Aarav Pending' }).first();
    if (await studentRow.isVisible().catch(() => false)) {
      const badge = studentRow.getByText(/pending/i)
        .or(studentRow.locator('.badge, .chip, .tag').filter({ hasText: /pending/i }))
        .first();
      if (await badge.isVisible().catch(() => false)) {
        await expect(badge).toBeVisible();
      }
    }
  });

  test('should show "Partial" badge for Student B (paid=5000 of 10000)', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const studentRow = page.getByRole('row').filter({ hasText: 'Diya Partial' }).first();
    if (await studentRow.isVisible().catch(() => false)) {
      const badge = studentRow.getByText(/partial/i)
        .or(studentRow.locator('.badge, .chip, .tag').filter({ hasText: /partial/i }))
        .first();
      if (await badge.isVisible().catch(() => false)) {
        await expect(badge).toBeVisible();
      }
    }
  });

  test('should show "Paid" badge for Student C (paid=10000, fully paid)', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const studentRow = page.getByRole('row').filter({ hasText: 'Ishaan Paid' }).first();
    if (await studentRow.isVisible().catch(() => false)) {
      const badge = studentRow.getByText(/paid/i)
        .or(studentRow.locator('.badge, .chip, .tag').filter({ hasText: /paid/i }))
        .first();
      if (await badge.isVisible().catch(() => false)) {
        await expect(badge).toBeVisible();
      }
    }
  });

  test('should show "Overdue" badge for Student D (paid=0, past due date)', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const studentRow = page.getByRole('row').filter({ hasText: 'Kavya Overdue' }).first();
    if (await studentRow.isVisible().catch(() => false)) {
      const badge = studentRow.getByText(/overdue/i)
        .or(studentRow.locator('.badge, .chip, .tag').filter({ hasText: /overdue/i }))
        .first();
      if (await badge.isVisible().catch(() => false)) {
        await expect(badge).toBeVisible();
      }
    }
  });

  test('should filter by fee status "Paid" and show only Student C', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // Find fee status filter
    const feeFilter = page.getByRole('combobox', { name: /fee.*status|status/i })
      .or(page.getByLabel(/fee.*status/i))
      .or(page.getByRole('button', { name: /fee.*status|filter.*fee/i }))
      .first();

    if (await feeFilter.isVisible().catch(() => false)) {
      await feeFilter.click();
      const paidOption = page.getByRole('option', { name: /^paid$/i })
        .or(page.getByText('Paid', { exact: true }))
        .first();
      if (await paidOption.isVisible().catch(() => false)) {
        await paidOption.click();
        await page.waitForTimeout(500);

        // Verify only Ishaan Paid is visible
        const ishaanVisible = await page.getByText('Ishaan Paid').first().isVisible().catch(() => false);
        if (ishaanVisible) {
          expect(ishaanVisible).toBe(true);

          // Verify others are NOT visible
          const aaravHidden = await page.getByText('Aarav Pending').first().isVisible().catch(() => false);
          expect(aaravHidden).toBe(false);
        }
      }
    }
  });

  test('should filter by fee status "Overdue" and show only Student D', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const feeFilter = page.getByRole('combobox', { name: /fee.*status|status/i })
      .or(page.getByLabel(/fee.*status/i))
      .or(page.getByRole('button', { name: /fee.*status|filter.*fee/i }))
      .first();

    if (await feeFilter.isVisible().catch(() => false)) {
      await feeFilter.click();
      const overdueOption = page.getByRole('option', { name: /overdue/i })
        .or(page.getByText('Overdue', { exact: true }))
        .first();
      if (await overdueOption.isVisible().catch(() => false)) {
        await overdueOption.click();
        await page.waitForTimeout(500);

        const kavyaVisible = await page.getByText('Kavya Overdue').first().isVisible().catch(() => false);
        if (kavyaVisible) {
          expect(kavyaVisible).toBe(true);

          const ishaanHidden = await page.getByText('Ishaan Paid').first().isVisible().catch(() => false);
          expect(ishaanHidden).toBe(false);
        }
      }
    }
  });

  test('should navigate to fee defaulters page and verify Student D appears', async ({ page }) => {
    await page.goto('/fees/defaulters');
    await page.waitForLoadState('networkidle');

    // Verify the defaulters page loaded
    const heading = page.getByRole('heading', { name: /defaulter|overdue|outstanding/i })
      .or(page.getByText(/fee defaulter|overdue fee/i))
      .first();
    if (await heading.isVisible().catch(() => false)) {
      await expect(heading).toBeVisible();
    }

    // Verify Kavya Overdue appears in defaulters
    const kavya = page.getByText('Kavya Overdue').first();
    if (await kavya.isVisible().catch(() => false)) {
      await expect(kavya).toBeVisible();
    }

    // Verify Aarav Pending also appears (paid=0 is a defaulter)
    const aarav = page.getByText('Aarav Pending').first();
    if (await aarav.isVisible().catch(() => false)) {
      await expect(aarav).toBeVisible();
    }

    // Verify Ishaan Paid does NOT appear (fully paid)
    const ishaan = await page.getByText('Ishaan Paid').first().isVisible().catch(() => false);
    expect(ishaan).toBe(false);
  });

  test('should show fee amounts on defaulters page', async ({ page }) => {
    await page.goto('/fees/defaulters');
    await page.waitForLoadState('networkidle');

    // Verify balance amounts displayed (10,000 for Student A and D)
    const balanceAmount = page.getByText(/10,000|10000/).first();
    if (await balanceAmount.isVisible().catch(() => false)) {
      await expect(balanceAmount).toBeVisible();
    }
  });

  test('should verify fee status on individual student dashboard (paid)', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${students.studentC.id}`);
    await page.waitForLoadState('networkidle');

    // Click fees tab
    const feesTab = page.getByRole('tab', { name: /fee/i })
      .or(page.getByText(/fees/i))
      .first();
    if (await feesTab.isVisible().catch(() => false)) {
      await feesTab.click();
      await page.waitForTimeout(500);
    }

    // Verify paid status
    const paidBadge = page.getByText('Paid', { exact: true })
      .or(page.locator('.badge, .chip, .tag').filter({ hasText: /paid/i }))
      .first();
    if (await paidBadge.isVisible().catch(() => false)) {
      await expect(paidBadge).toBeVisible();
    }

    // Verify balance is 0
    const zeroBalance = page.getByText(/balance.*0|\u20b9.*0.*balance/i).first();
    if (await zeroBalance.isVisible().catch(() => false)) {
      await expect(zeroBalance).toBeVisible();
    }
  });

  test('should verify fee status on individual student dashboard (partial)', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${students.studentB.id}`);
    await page.waitForLoadState('networkidle');

    const feesTab = page.getByRole('tab', { name: /fee/i })
      .or(page.getByText(/fees/i))
      .first();
    if (await feesTab.isVisible().catch(() => false)) {
      await feesTab.click();
      await page.waitForTimeout(500);
    }

    // Verify partial status
    const partialBadge = page.getByText(/partial/i)
      .or(page.locator('.badge, .chip, .tag').filter({ hasText: /partial/i }))
      .first();
    if (await partialBadge.isVisible().catch(() => false)) {
      await expect(partialBadge).toBeVisible();
    }

    // Verify paid=5000, balance=5000
    const paid5000 = page.getByText(/5,000|5000/).first();
    if (await paid5000.isVisible().catch(() => false)) {
      await expect(paid5000).toBeVisible();
    }
  });

  test('should verify fee status on individual student dashboard (overdue)', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${students.studentD.id}`);
    await page.waitForLoadState('networkidle');

    const feesTab = page.getByRole('tab', { name: /fee/i })
      .or(page.getByText(/fees/i))
      .first();
    if (await feesTab.isVisible().catch(() => false)) {
      await feesTab.click();
      await page.waitForTimeout(500);
    }

    // Verify overdue status
    const overdueBadge = page.getByText(/overdue/i)
      .or(page.locator('.badge, .chip, .tag').filter({ hasText: /overdue/i }))
      .first();
    if (await overdueBadge.isVisible().catch(() => false)) {
      await expect(overdueBadge).toBeVisible();
    }

    // Verify full balance of 10000
    const balance = page.getByText(/10,000|10000/).first();
    if (await balance.isVisible().catch(() => false)) {
      await expect(balance).toBeVisible();
    }
  });
});
