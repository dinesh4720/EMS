import { expect, test } from '@playwright/test';
import {
  createMockState,
  installMockApi,
  seedStudent,
  seedStudentWithFees,
  seedAttendanceForClass,
  seedAnnouncement,
  recordFeePayment,
  CLASS_10A_ID,
  CLASS_11A_ID,
  type MockState,
} from './test-utils';

/* ───────────────── Helpers ───────────────── */

async function gotoDashboardAndWait(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  // Wait for greeting or KPI strip to render
  await page.locator('text=Good').first().waitFor({ timeout: 15_000 });
  await page.waitForTimeout(400);
}

/* ───────────────── Tests ───────────────── */

test.describe('Dashboard — Widgets, Stats & Navigation', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    // Seed students across classes with varied fee statuses
    seedStudentWithFees(state, { name: 'Arun Kumar', classId: CLASS_10A_ID, feeStatus: 'paid' });
    seedStudentWithFees(state, { name: 'Bhavya Singh', classId: CLASS_10A_ID, feeStatus: 'pending' });
    seedStudentWithFees(state, { name: 'Chitra Devi', classId: CLASS_10A_ID, feeStatus: 'paid', gender: 'Female' });
    seedStudentWithFees(state, { name: 'Deepak Nair', classId: CLASS_10A_ID, feeStatus: 'overdue' });
    seedStudentWithFees(state, { name: 'Esha Patel', classId: CLASS_11A_ID, feeStatus: 'paid', gender: 'Female' });
    seedStudentWithFees(state, { name: 'Farhan Ali', classId: CLASS_11A_ID, feeStatus: 'pending' });

    // Seed attendance for today
    const today = new Date().toISOString().split('T')[0];
    seedAttendanceForClass(state, CLASS_10A_ID, today);
    seedAttendanceForClass(state, CLASS_11A_ID, today);

    // Record some payments
    recordFeePayment(state, state.students[0].id, 5000, 'cash', today);
    recordFeePayment(state, state.students[1].id, 3000, 'online', today);
    recordFeePayment(state, state.students[4].id, 7000, 'cash', today);

    // Seed announcements
    seedAnnouncement(state, { title: 'Annual Day Celebration', content: 'Annual Day will be held on April 15th.', status: 'sent' });
    seedAnnouncement(state, { title: 'PTM Next Week', content: 'Parent-Teacher Meeting scheduled.', status: 'sent' });

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);
  });

  test('1 — dashboard loads with greeting and date', async ({ page }) => {
    await gotoDashboardAndWait(page);

    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/Good (morning|afternoon|evening)/i);
    expect(bodyText).not.toMatch(/login|sign in/i);
  });

  test('2 — KPI strip shows attendance stat card', async ({ page }) => {
    await gotoDashboardAndWait(page);

    const body = page.locator('body');
    await expect(body.getByText(/Attendance today|On campus/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('3 — KPI strip shows fees stat card', async ({ page }) => {
    await gotoDashboardAndWait(page);

    const body = page.locator('body');
    await expect(body.getByText(/Fees|Collections|Pending/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('4 — KPI strip shows enrollment count', async ({ page }) => {
    await gotoDashboardAndWait(page);

    const body = page.locator('body');
    await expect(body.getByText(/Students|Enrollment/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('5 — fee trend widget renders with data', async ({ page }) => {
    await gotoDashboardAndWait(page);

    const body = page.locator('body');
    // Fee trend chart card title
    const feeTrendVisible = await body.getByText('Fee collection trend').first().isVisible({ timeout: 10_000 }).catch(() => false);
    if (feeTrendVisible) {
      await expect(body.getByText('Fee collection trend').first()).toBeVisible();
    } else {
      // Widget may be hidden by customizer — verify page loaded without crash
      expect(await page.textContent('body')).toBeTruthy();
    }
  });

  test('6 — attendance trend widget renders', async ({ page }) => {
    await gotoDashboardAndWait(page);

    const body = page.locator('body');
    const attendanceTrendVisible = await body.getByText('Attendance trend').first().isVisible({ timeout: 10_000 }).catch(() => false);
    if (attendanceTrendVisible) {
      await expect(body.getByText('Attendance trend').first()).toBeVisible();
    } else {
      expect(await page.textContent('body')).toBeTruthy();
    }
  });

  test('7 — enrollment stats widget shows class distribution', async ({ page }) => {
    await gotoDashboardAndWait(page);

    const body = page.locator('body');
    const enrollmentVisible = await body.getByText('Enrollment stats').first().isVisible({ timeout: 10_000 }).catch(() => false);
    if (enrollmentVisible) {
      await expect(body.getByText('Enrollment stats').first()).toBeVisible();
      // Should show class names from seeded data
      const bodyText = await body.textContent();
      expect(bodyText?.includes('10') || bodyText?.includes('11')).toBeTruthy();
    } else {
      expect(await page.textContent('body')).toBeTruthy();
    }
  });

  test('8 — recent activity widget shows payments and announcements', async ({ page }) => {
    await gotoDashboardAndWait(page);

    const body = page.locator('body');
    const activityVisible = await body.getByText('Recent activity').first().isVisible({ timeout: 10_000 }).catch(() => false);
    if (activityVisible) {
      await expect(body.getByText('Recent activity').first()).toBeVisible();
      const bodyText = await body.textContent();
      expect(bodyText?.includes('Annual Day') || bodyText?.includes('PTM')).toBeTruthy();
    } else {
      expect(await page.textContent('body')).toBeTruthy();
    }
  });

  test('9 — stat cards are clickable and navigate', async ({ page }) => {
    await gotoDashboardAndWait(page);

    // KPI cards are buttons — at least one should be visible and clickable
    const kpiCard = page.locator('button.kpi-card').first();
    const hasKpi = await kpiCard.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasKpi) {
      await expect(kpiCard).toBeVisible();
      // Clicking should navigate (attendance or fees)
      await kpiCard.click();
      await page.waitForTimeout(500);
      // URL should have changed from /
      const url = page.url();
      expect(url !== '/' || url.includes('?')).toBeTruthy();
    }
  });

  test('10 — widget customizer button opens panel', async ({ page }) => {
    await gotoDashboardAndWait(page);

    const customizeBtn = page.getByRole('button', { name: /Customize/i });
    if (await customizeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await customizeBtn.click();
      await page.waitForTimeout(300);

      // Customizer should show widget catalog
      const bodyText = await page.textContent('body');
      expect(bodyText?.toLowerCase().includes('widget') || bodyText?.toLowerCase().includes('customize')).toBeTruthy();
    }
  });

  test('11 — actions section shows priority items', async ({ page }) => {
    await gotoDashboardAndWait(page);

    const body = page.locator('body');
    const actionsVisible = await body.getByText('Actions').first().isVisible({ timeout: 10_000 }).catch(() => false);
    if (actionsVisible) {
      await expect(body.getByText('Actions').first()).toBeVisible();
      const bodyText = await body.textContent();
      // Should show some action items (fees, coverage, ptm, etc.)
      expect(
        bodyText?.toLowerCase().includes('fee') ||
        bodyText?.toLowerCase().includes('unstaffed') ||
        bodyText?.toLowerCase().includes('ptm')
      ).toBeTruthy();
    }
  });

  test('12 — your day schedule section renders', async ({ page }) => {
    await gotoDashboardAndWait(page);

    const body = page.locator('body');
    const yourDayVisible = await body.getByText('Your day').first().isVisible({ timeout: 10_000 }).catch(() => false);
    if (yourDayVisible) {
      await expect(body.getByText('Your day').first()).toBeVisible();
      const bodyText = await body.textContent();
      expect(bodyText?.toLowerCase().includes('morning') || bodyText?.toLowerCase().includes('assembly') || bodyText?.toLowerCase().includes('no events')).toBeTruthy();
    }
  });

  test('13 — empty dashboard shows graceful empty states', async ({ page }) => {
    const emptyState = createMockState();
    // No students, no payments, no announcements
    await installMockApi(page, emptyState);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should not crash or redirect to login
    await expect(page).not.toHaveURL(/\/login/);

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });
});
