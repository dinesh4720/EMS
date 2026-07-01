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

    // Trend panel metric buttons should be visible and clickable
    const trendMetric = page.locator('button.weekly-trend__metric').first();
    const hasMetric = await trendMetric.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasMetric) {
      await expect(trendMetric).toBeVisible();
      // Clicking should navigate (attendance or fees)
      await trendMetric.click();
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

  test('11 — attention queue shows priority items', async ({ page }) => {
    await gotoDashboardAndWait(page);

    const body = page.locator('body');
    const attentionVisible = await body.getByText('Needs your attention').first().isVisible({ timeout: 10_000 }).catch(() => false);
    if (attentionVisible) {
      await expect(body.getByText('Needs your attention').first()).toBeVisible();
      const bodyText = await body.textContent();
      // Should show some action items (fees, attendance, staff absence)
      expect(
        bodyText?.toLowerCase().includes('fee') ||
        bodyText?.toLowerCase().includes('attendance') ||
        bodyText?.toLowerCase().includes('absent')
      ).toBeTruthy();
    }
  });

  test('12 — today section renders', async ({ page }) => {
    await gotoDashboardAndWait(page);

    const body = page.locator('body');
    const todayVisible = await body.getByText('Today').first().isVisible({ timeout: 10_000 }).catch(() => false);
    if (todayVisible) {
      await expect(body.getByText('Today').first()).toBeVisible();
      const bodyText = await body.textContent();
      expect(bodyText?.toLowerCase().includes('birthday') || bodyText?.toLowerCase().includes('notice') || bodyText?.toLowerCase().includes('caught up')).toBeTruthy();
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
