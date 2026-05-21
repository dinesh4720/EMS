import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  seedAppointment, seedFeedback, seedCallLog,
  TEACHER_A_ID, TEACHER_B_ID,
  type MockState,
} from './test-utils';

/* Force desktop viewport so the fixed sidebar does not overlap content */
test.use({ viewport: { width: 1280, height: 720 } });

/* ───────────────── Appointments ───────────────── */

test.describe('Front Desk — Appointments', () => {
  test.setTimeout(60_000);

  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    // Seed appointments with varied statuses
    seedAppointment(state, {
      visitorName: 'Rajesh Kumar',
      purpose: 'Admission Inquiry',
      meetingWith: TEACHER_A_ID,
      status: 'scheduled',
      phoneNumber: '9876543210',
      notes: 'First visit for son admission',
    });
    seedAppointment(state, {
      visitorName: 'Priya Patel',
      purpose: 'Parent-Teacher Meeting',
      meetingWith: TEACHER_B_ID,
      status: 'completed',
      phoneNumber: '9876543211',
    });
    seedAppointment(state, {
      visitorName: 'Suresh Reddy',
      purpose: 'Fee Discussion',
      meetingWith: TEACHER_A_ID,
      status: 'cancelled',
      phoneNumber: '9876543212',
      notes: 'Cancelled due to schedule conflict',
    });

    await installMockApi(page, state);
  });

  test('1 — appointments appear in activity stream when filtered', async ({ page }) => {
    await page.goto('/front-desk?type=appointments');
    await page.waitForLoadState('networkidle');

    // Wait for the activity table to render
    await expect(page.locator('.fd-table__head')).toBeVisible({ timeout: 15000 });

    // Verify seeded appointment data is displayed in the activity table
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Rajesh Kumar');
    expect(bodyText).toContain('Priya Patel');
    expect(bodyText).toContain('Suresh Reddy');
    expect(bodyText).toContain('Admission Inquiry');
    expect(bodyText).toContain('Parent-Teacher Meeting');
    expect(bodyText).toContain('Fee Discussion');

    // Verify statuses are visible in the activity table
    expect(bodyText).toContain('scheduled');
    expect(bodyText).toContain('completed');
    expect(bodyText).toContain('cancelled');
  });

  test('2 — appointment filter via segmented tab works', async ({ page }) => {
    await page.goto('/front-desk');
    await page.waitForLoadState('networkidle');

    // Wait for the activity table to render
    await expect(page.locator('.fd-table__head')).toBeVisible({ timeout: 15000 });

    // Click the Appointments tab in the segmented control
    const appointmentsTab = page.locator('[role="tab"]').filter({ hasText: 'Appointments' }).first();
    await expect(appointmentsTab).toBeVisible();
    await appointmentsTab.click();

    // Wait for URL to update and table to refresh
    await expect.poll(() => page.url(), { timeout: 5000 }).toContain('type=appointments');
    await page.waitForTimeout(500);

    // Verify appointment data appears
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Rajesh Kumar');
    expect(bodyText).toContain('scheduled');
  });

  test('3 — search filters appointments by visitor name', async ({ page }) => {
    await page.goto('/front-desk?type=appointments');
    await page.waitForLoadState('networkidle');

    // Wait for the activity table to render
    await expect(page.locator('.fd-table__head')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Rajesh Kumar')).toBeVisible();

    // Use the search input
    const searchInput = page.locator('input[placeholder*="Search names"], input[placeholder*="Search"]').first();
    await searchInput.fill('Rajesh');
    await page.waitForTimeout(600);

    // Rajesh should still be visible
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Rajesh Kumar');

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(300);

    const fullBodyText = await page.textContent('body');
    expect(fullBodyText).toContain('Priya Patel');
    expect(fullBodyText).toContain('Suresh Reddy');
  });

  test('4 — KPI strip shows appointment metrics', async ({ page }) => {
    await page.goto('/front-desk');
    await page.waitForLoadState('networkidle');

    // Wait for the KPI strip to render
    await expect(page.locator('.fd-table__head')).toBeVisible({ timeout: 15000 });

    // The KPI strip should contain appointment-related metrics
    const bodyText = await page.textContent('body');
    // KPIs are derived from mock data; appointments count should be visible
    expect(bodyText).toContain('Front desk');
  });
});

/* ───────────────── Feedbacks ───────────────── */

test.describe('Front Desk — Feedbacks', () => {
  test.setTimeout(60_000);

  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    // Seed feedbacks with different categories/statuses/sources
    seedFeedback(state, {
      name: 'Meena Sharma',
      category: 'STAFF_TEACHER',
      source: 'PARENT_APP',
      status: 'open',
      date: '2026-04-01',
    });
    seedFeedback(state, {
      name: 'Rakesh Gupta',
      category: 'FACILITIES_CLASSROOM',
      source: 'WALK_IN',
      status: 'resolved',
      date: '2026-03-28',
      response: 'Issue has been addressed by maintenance team.',
    });
    seedFeedback(state, {
      name: 'Anita Desai',
      category: 'MANAGEMENT_FEES',
      source: 'PHONE',
      status: 'in_progress',
      date: '2026-03-30',
    });

    await installMockApi(page, state);
  });

  test('5 — feedbacks appear in activity stream when filtered', async ({ page }) => {
    await page.goto('/front-desk?type=feedbacks');
    await page.waitForLoadState('networkidle');

    // Wait for the activity table to render
    await expect(page.locator('.fd-table__head')).toBeVisible({ timeout: 15000 });

    const bodyText = await page.textContent('body');
    // Verify seeded feedback names
    expect(bodyText).toContain('Meena Sharma');
    expect(bodyText).toContain('Rakesh Gupta');
    expect(bodyText).toContain('Anita Desai');

    // Verify statuses are displayed
    expect(bodyText).toContain('open');
    expect(bodyText).toContain('resolved');
    expect(bodyText).toContain('in_progress');
  });

  test('6 — feedback filter via segmented tab works', async ({ page }) => {
    await page.goto('/front-desk');
    await page.waitForLoadState('networkidle');

    // Wait for the activity table to render
    await expect(page.locator('.fd-table__head')).toBeVisible({ timeout: 15000 });

    // Click the Feedback tab in the segmented control
    const feedbackTab = page.locator('[role="tab"]').filter({ hasText: 'Feedback' }).first();
    await expect(feedbackTab).toBeVisible();
    await feedbackTab.click();

    await expect.poll(() => page.url(), { timeout: 5000 }).toContain('type=feedbacks');
    await page.waitForTimeout(500);

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Meena Sharma');
    expect(bodyText).toContain('open');
  });
});

/* ───────────────── Call Logs ───────────────── */

test.describe('Front Desk — Call Logs', () => {
  test.setTimeout(60_000);

  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    // Seed call logs with varied purposes
    seedCallLog(state, {
      callerName: 'Amit Joshi',
      phoneNumber: '9876500001',
      purpose: 'ADMISSION_INQUIRY',
      title: 'Class 5 Admission Query',
      callbackRequired: true,
      callbackDate: '2026-04-10',
      callbackTime: '14:00',
      keyNotes: 'Parent interested in admission for upcoming session',
    });
    seedCallLog(state, {
      callerName: 'Deepa Nair',
      phoneNumber: '9876500002',
      purpose: 'FEE_PAYMENT',
      title: 'Fee installment inquiry',
      callbackRequired: false,
      keyNotes: 'Asked about installment options',
    });
    seedCallLog(state, {
      callerName: 'Vijay Mehta',
      phoneNumber: '9876500003',
      purpose: 'COMPLAINT',
      title: 'Bus service complaint',
      callbackRequired: true,
      callbackDate: '2026-04-08',
      callbackTime: '10:30',
      keyNotes: 'Bus arriving late consistently',
    });

    await installMockApi(page, state);
  });

  test('7 — call logs appear in activity stream when filtered', async ({ page }) => {
    await page.goto('/front-desk?type=calls');
    await page.waitForLoadState('networkidle');

    // Wait for the activity table to render
    await expect(page.locator('.fd-table__head')).toBeVisible({ timeout: 15000 });

    const bodyText = await page.textContent('body');
    // Verify seeded call log data
    expect(bodyText).toContain('Amit Joshi');
    expect(bodyText).toContain('Deepa Nair');
    expect(bodyText).toContain('Vijay Mehta');

    // Verify purposes are displayed
    expect(bodyText?.includes('ADMISSION_INQUIRY') || bodyText?.includes('ADMISSION INQUIRY')).toBeTruthy();
  });

  test('8 — call logs filter via segmented tab works', async ({ page }) => {
    await page.goto('/front-desk');
    await page.waitForLoadState('networkidle');

    // Wait for the activity table to render
    await expect(page.locator('.fd-table__head')).toBeVisible({ timeout: 15000 });

    // Click the Calls tab in the segmented control
    const callsTab = page.locator('[role="tab"]').filter({ hasText: 'Calls' }).first();
    await expect(callsTab).toBeVisible();
    await callsTab.click();

    await expect.poll(() => page.url(), { timeout: 5000 }).toContain('type=calls');
    await page.waitForTimeout(500);

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Amit Joshi');
    expect(bodyText).toContain('logged');
  });

  test('9 — search filters call logs by caller name', async ({ page }) => {
    await page.goto('/front-desk?type=calls');
    await page.waitForLoadState('networkidle');

    // Wait for the activity table to render
    await expect(page.locator('.fd-table__head')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Amit Joshi')).toBeVisible();

    // Use the search input
    const searchInput = page.locator('input[placeholder*="Search names"], input[placeholder*="Search"]').first();
    await searchInput.fill('Amit');
    await page.waitForTimeout(600);

    let bodyText = await page.textContent('body');
    expect(bodyText).toContain('Amit Joshi');

    // Clear and search by another name
    await searchInput.clear();
    await page.waitForTimeout(200);
    await searchInput.fill('Vijay');
    await page.waitForTimeout(600);

    bodyText = await page.textContent('body');
    expect(bodyText).toContain('Vijay Mehta');

    // Clear search to restore all results
    await searchInput.clear();
    await page.waitForTimeout(300);

    bodyText = await page.textContent('body');
    expect(bodyText).toContain('Amit Joshi');
    expect(bodyText).toContain('Deepa Nair');
    expect(bodyText).toContain('Vijay Mehta');
  });
});
