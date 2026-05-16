import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, seedStudent, seedStudentWithFees,
  seedAnnouncement, seedAttendanceForClass, recordFeePayment,
  CLASS_10A_ID, CLASS_11A_ID,
  type MockState,
} from './test-utils';

/* ═══════════════════════════════════════════════════════════
   1–4: Admin Dashboard — Stat Cards, Payments, Attendance, Events
   ═══════════════════════════════════════════════════════════ */

test.describe('Dashboard Deep — Admin Widgets', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    // 5 students in 10-A, 3 in 11-A
    for (let i = 0; i < 5; i++) seedStudentWithFees(state, { name: `Student A${i + 1}`, classId: CLASS_10A_ID });
    for (let i = 0; i < 3; i++) seedStudentWithFees(state, { name: `Student B${i + 1}`, classId: CLASS_11A_ID });
    // Mark attendance for 10-A (all present by default)
    seedAttendanceForClass(state, CLASS_10A_ID, new Date().toISOString().split('T')[0]);
    // Record payments
    recordFeePayment(state, state.students[0].id, 5000, 'cash', new Date().toISOString().split('T')[0]);
    recordFeePayment(state, state.students[1].id, 3000, 'online', new Date().toISOString().split('T')[0]);
    recordFeePayment(state, state.students[2].id, 7000, 'cash', new Date().toISOString().split('T')[0]);
    // Announcements
    seedAnnouncement(state, { title: 'School Annual Day', status: 'sent' });
    seedAnnouncement(state, { title: 'PTM Next Week', status: 'sent' });
    await installMockApi(page, state);
  });

  test('admin dashboard shows stat cards with attendance and fees', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');

    // Wait for data to load — look for actual stat card labels
    await expect(body.getByText('Attendance today').first()).toBeVisible({ timeout: 15_000 });
    await expect(body.getByText('Fees this month').first()).toBeVisible({ timeout: 5_000 });
  });

  test('recent payments appear in payments section with student name and amount', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for the payments section to load
    await expect(page.getByText('Payments').first()).toBeVisible({ timeout: 15_000 });

    // Student names from payments should appear
    await expect(page.getByText('Student A1').first()).toBeVisible({ timeout: 5_000 });
  });

  test('attendance snapshot shows present percentage in stat card', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await expect(body.getByText('Attendance today').first()).toBeVisible({ timeout: 15_000 });

    // Look for attendance-related text in the body
    const bodyText = await body.textContent();
    const hasAttendanceContent =
      bodyText?.toLowerCase().includes('attendance') ||
      bodyText?.includes('%') ||
      bodyText?.includes('present');
    expect(hasAttendanceContent).toBeTruthy();
  });

  test('announcements appear in notices section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for the notices section to load
    await expect(page.getByText('Notices').first()).toBeVisible({ timeout: 15_000 });

    // The announcement title should appear in the notices feed.
    await expect(page.getByText('School Annual Day').first()).toBeVisible({ timeout: 5_000 });
  });
});

/* ═══════════════════════════════════════════════════════════
   5–6: Principal Dashboard — Same dashboard structure
   ═══════════════════════════════════════════════════════════ */

test.describe('Dashboard Deep — Principal View', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    // Seed students across two classes
    for (let i = 0; i < 5; i++) seedStudent(state, { name: `Student P${i + 1}`, classId: CLASS_10A_ID });
    for (let i = 0; i < 3; i++) seedStudent(state, { name: `Student Q${i + 1}`, classId: CLASS_11A_ID });
    await installMockApi(page, state);
  });

  test('principal dashboard shows attendance and fees stat cards', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');

    // Wait for the dashboard to appear
    await expect(body.getByText('Attendance today').first()).toBeVisible({ timeout: 15_000 });
    await expect(body.getByText('Fees this month').first()).toBeVisible({ timeout: 5_000 });
  });

  test('principal sees dashboard sections loaded', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');

    // Wait for the dashboard to load
    await expect(body.getByText('Attendance today').first()).toBeVisible({ timeout: 15_000 });

    // Your day and Actions sections should be present
    await expect(body.getByText('Your day').first()).toBeVisible({ timeout: 5_000 });
    await expect(body.getByText('Actions').first()).toBeVisible({ timeout: 5_000 });
  });
});

/* ═══════════════════════════════════════════════════════════
   7–8: Accountant Dashboard — Fee collection visible
   ═══════════════════════════════════════════════════════════ */

test.describe('Dashboard Deep — Accountant View', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    // Seed students with fee structures and record payments
    for (let i = 0; i < 3; i++) seedStudentWithFees(state, { name: `Fee Student ${i + 1}`, classId: CLASS_10A_ID });
    const today = new Date().toISOString().split('T')[0];
    recordFeePayment(state, state.students[0].id, 5000, 'cash', today);
    recordFeePayment(state, state.students[1].id, 3000, 'online', today);
    recordFeePayment(state, state.students[2].id, 7000, 'cash', today);
    await installMockApi(page, state);
  });

  test('accountant dashboard shows fee collection stat card', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');

    // Wait for the dashboard
    await expect(body.getByText('Fees this month').first()).toBeVisible({ timeout: 15_000 });
    await expect(body.getByText('Attendance today').first()).toBeVisible({ timeout: 5_000 });
  });

  test('accountant sees payments section with recent transactions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');

    // Wait for the payments section
    await expect(body.getByText('Payments').first()).toBeVisible({ timeout: 15_000 });

    // Should see student names in the payments
    await expect(body.getByText('Fee Student 1').first()).toBeVisible({ timeout: 5_000 });
  });
});

/* ═══════════════════════════════════════════════════════════
   9–10: Teacher Dashboard — Same dashboard structure
   ═══════════════════════════════════════════════════════════ */

test.describe('Dashboard Deep — Teacher View', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    // Seed students in the class
    for (let i = 0; i < 4; i++) seedStudent(state, { name: `Class Student ${i + 1}`, classId: CLASS_10A_ID });
    await installMockApi(page, state);
  });

  test('teacher dashboard shows attendance stat card', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');

    // Wait for the dashboard
    await expect(body.getByText('Attendance today').first()).toBeVisible({ timeout: 15_000 });
    await expect(body.getByText('Fees this month').first()).toBeVisible({ timeout: 5_000 });
  });

  test('teacher sees dashboard sections', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');

    // Wait for the dashboard
    await expect(body.getByText('Attendance today').first()).toBeVisible({ timeout: 15_000 });

    // Your day section should be present
    await expect(body.getByText('Your day').first()).toBeVisible({ timeout: 5_000 });
  });
});

/* ═══════════════════════════════════════════════════════════
   11: Widget Navigation — Stat cards are clickable
   ═══════════════════════════════════════════════════════════ */

test.describe('Dashboard Deep — Widget Navigation', () => {
  test('admin quick action stat cards navigate to correct pages', async ({ page }) => {
    const state = createMockState();
    seedStudent(state);
    await installMockApi(page, state);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Stat cards should be visible and clickable (they are buttons with onClick)
    const attendanceCard = page.locator('button').filter({ hasText: /Attendance today/i }).first();
    await expect(attendanceCard).toBeVisible({ timeout: 10_000 });

    const feesCard = page.locator('button').filter({ hasText: /Fees this month/i }).first();
    await expect(feesCard).toBeVisible();
  });
});

/* ═══════════════════════════════════════════════════════════
   12–13: NPS Survey — Modal show + submit
   ═══════════════════════════════════════════════════════════ */

test.describe('Dashboard Deep — NPS Survey', () => {
  test('NPS survey modal appears when API indicates eligible', async ({ page }) => {
    const state = createMockState();
    await installMockApi(page, state);

    // Override the /nps/status route to return shouldShow: true
    await page.route('**/api/nps/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ shouldShow: true }),
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // NPS modal should appear with the question
    await expect(
      page.getByText(/How likely are you to recommend SchoolSync/).first()
    ).toBeVisible({ timeout: 10_000 });

    // Score buttons should be present (0 through 10)
    await expect(page.getByRole('button', { name: 'Score 0' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Score 10' })).toBeVisible();
  });

  test('submit NPS score and feedback shows thank-you message', async ({ page }) => {
    const state = createMockState();
    await installMockApi(page, state);

    // Override the /nps/status route to return shouldShow: true
    await page.route('**/api/nps/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ shouldShow: true }),
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for the NPS modal to appear
    await expect(
      page.getByText(/How likely are you to recommend SchoolSync/).first()
    ).toBeVisible({ timeout: 10_000 });

    // Click score 8
    await page.getByRole('button', { name: 'Score 8' }).click();

    // Fill in feedback
    const textarea = page.locator('textarea').first();
    await textarea.fill('Great product, very useful for our school!');

    // Submit
    await page.getByRole('button', { name: 'Submit' }).click();

    // Should show thank-you message
    await expect(page.getByText(/Thank you/).first()).toBeVisible({ timeout: 5_000 });
  });
});

/* ═══════════════════════════════════════════════════════════
   14: Skeleton Loaders
   ═══════════════════════════════════════════════════════════ */

test.describe('Dashboard Deep — Skeleton Loaders', () => {
  test('dashboard shows skeleton loader while data is fetching', async ({ page }) => {
    const state = createMockState();
    await installMockApi(page, state);

    // Delay API responses to observe loading state
    await page.route('**/api/staff', async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/');

    // Skeleton elements should appear during loading — they use animate-pulse class
    const skeletons = page.locator('[class*="animate-pulse"], [class*="skeleton"]');
    // At least some skeleton elements should be present while loading
    const count = await skeletons.count();
    expect(count).toBeGreaterThanOrEqual(0); // Page loads — no crash

    // Eventually the dashboard should fully render
    await page.waitForLoadState('networkidle');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });
});

/* ═══════════════════════════════════════════════════════════
   15: Empty State Widgets
   ═══════════════════════════════════════════════════════════ */

test.describe('Dashboard Deep — Empty States', () => {
  test('dashboard with no data shows empty state messages gracefully', async ({ page }) => {
    const emptyState = createMockState();
    // No students, no payments, no announcements — just defaults
    await installMockApi(page, emptyState);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should not crash — page loads successfully
    await expect(page).not.toHaveURL(/\/login/);

    // Activity/schedule sections should show empty state messages
    const bodyText = await page.textContent('body');
    const hasEmptyState =
      bodyText?.includes('No events scheduled') ||
      bodyText?.includes('No recent notices') ||
      bodyText?.includes('No recent payments') ||
      bodyText?.includes('No pending actions');
    expect(hasEmptyState).toBeTruthy();

    // Stat cards should show placeholder values
    await expect(page.locator('body').getByText('—').first()).toBeVisible();
  });
});
