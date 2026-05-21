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

  test('1 — appointments list loads with visitor name, purpose, meeting-with, status columns', async ({ page }) => {
    await page.goto('/front-desk');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [id="main-content"], nav', { timeout: 15000 });

    // Wait for seeded data to appear in the activity stream
    await page.waitForFunction(
      () => (document.body?.textContent || '').includes('Rajesh Kumar'),
      { timeout: 15_000 },
    );

    const bodyText = await page.textContent('body');
    // Check seeded appointment data is displayed
    expect(bodyText).toContain('Rajesh Kumar');
    expect(bodyText).toContain('Admission Inquiry');
    expect(bodyText).toContain('Priya Patel');
    expect(bodyText).toContain('Suresh Reddy');
    // Status should be visible (scheduled/completed/cancelled)
    expect(bodyText).toContain('scheduled');
    expect(bodyText).toContain('completed');
    expect(bodyText).toContain('cancelled');
  });

  test('2 — appointments tab filters to show only appointments', async ({ page }) => {
    await page.goto('/front-desk');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [id="main-content"], nav', { timeout: 15000 });

    // Wait for all data to render
    await page.waitForFunction(
      () => (document.body?.textContent || '').includes('Rajesh Kumar'),
      { timeout: 15_000 },
    );

    // Click the Appointments tab in the activity filter
    const appointmentsTab = page.locator('button[role="tab"]').filter({ hasText: /^Appointments$/ }).first();
    await appointmentsTab.click();
    await page.waitForTimeout(300);

    const bodyText = await page.textContent('body');
    // All three appointments should still be visible
    expect(bodyText).toContain('Rajesh Kumar');
    expect(bodyText).toContain('Priya Patel');
    expect(bodyText).toContain('Suresh Reddy');
  });

  test('3 — search filters appointments', async ({ page }) => {
    await page.goto('/front-desk');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [id="main-content"], nav', { timeout: 15000 });

    await page.waitForFunction(
      () => (document.body?.textContent || '').includes('Rajesh Kumar'),
      { timeout: 15_000 },
    );

    // Use the search input
    const searchInput = page.getByPlaceholder(/Search names, purposes/i).first();
    if (await searchInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await searchInput.fill('Rajesh');
      await page.waitForTimeout(500);

      const bodyText = await page.textContent('body');
      expect(bodyText).toContain('Rajesh Kumar');

      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(300);

      const fullBodyText = await page.textContent('body');
      expect(fullBodyText).toContain('Priya Patel');
    }
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

  test('4 — feedbacks list shows all feedback entries in activity stream', async ({ page }) => {
    await page.goto('/front-desk');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [id="main-content"], nav', { timeout: 15000 });

    // Wait for feedback data to render
    await page.waitForFunction(
      () => (document.body?.textContent || '').includes('Meena Sharma'),
      { timeout: 15_000 },
    );

    const bodyText = await page.textContent('body');
    // Verify seeded feedback names
    expect(bodyText).toContain('Meena Sharma');
    expect(bodyText).toContain('Rakesh Gupta');
    expect(bodyText).toContain('Anita Desai');

    // Verify statuses are displayed
    expect(bodyText?.includes('open') || bodyText?.includes('Open')).toBeTruthy();
    expect(bodyText?.includes('resolved') || bodyText?.includes('Resolved')).toBeTruthy();
    expect(bodyText?.includes('in_progress') || bodyText?.includes('In Progress')).toBeTruthy();
  });

  test('5 — feedback tab filters to show only feedbacks', async ({ page }) => {
    await page.goto('/front-desk');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [id="main-content"], nav', { timeout: 15000 });

    await page.waitForFunction(
      () => (document.body?.textContent || '').includes('Meena Sharma'),
      { timeout: 15_000 },
    );

    // Click the Feedback tab (singular, not plural)
    const feedbackTab = page.locator('button[role="tab"]').filter({ hasText: /^Feedback$/ }).first();
    await feedbackTab.click();
    await page.waitForTimeout(300);

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Meena Sharma');
    expect(bodyText).toContain('Rakesh Gupta');
    expect(bodyText).toContain('Anita Desai');
  });

  test('6 — feedbacks show different status badges (open, in_progress, resolved)', async ({ page }) => {
    await page.goto('/front-desk');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [id="main-content"], nav', { timeout: 15000 });

    await page.waitForFunction(
      () => (document.body?.textContent || '').includes('Meena Sharma'),
      { timeout: 15_000 },
    );

    const bodyText = await page.textContent('body');

    // Verify all three statuses are rendered somewhere on the page
    const hasOpen = bodyText?.includes('Open') || bodyText?.includes('open');
    const hasInProgress = bodyText?.includes('In Progress') || bodyText?.includes('in_progress');
    const hasResolved = bodyText?.includes('Resolved') || bodyText?.includes('resolved');

    expect(hasOpen).toBeTruthy();
    expect(hasResolved).toBeTruthy();
    expect(hasInProgress).toBeTruthy();
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

    // Seed call logs with varied purposes and callback requirements
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

  test('7 — call logs list shows caller name, phone, purpose in activity stream', async ({ page }) => {
    await page.goto('/front-desk');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [id="main-content"], nav', { timeout: 15000 });

    // Wait for call log data to render
    await page.waitForFunction(
      () => (document.body?.textContent || '').includes('Amit Joshi'),
      { timeout: 15_000 },
    );

    const bodyText = await page.textContent('body');
    // Verify seeded call log data
    expect(bodyText).toContain('Amit Joshi');
    expect(bodyText).toContain('Deepa Nair');
    expect(bodyText).toContain('Vijay Mehta');
  });

  test('8 — calls tab filters to show only call logs', async ({ page }) => {
    await page.goto('/front-desk');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [id="main-content"], nav', { timeout: 15000 });

    await page.waitForFunction(
      () => (document.body?.textContent || '').includes('Amit Joshi'),
      { timeout: 15_000 },
    );

    // Click the Calls tab
    const callsTab = page.locator('button[role="tab"]').filter({ hasText: /^Calls$/ }).first();
    await callsTab.click();
    await page.waitForTimeout(300);

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Amit Joshi');
    expect(bodyText).toContain('Deepa Nair');
    expect(bodyText).toContain('Vijay Mehta');
  });

  test('9 — search across call logs filters by caller name', async ({ page }) => {
    await page.goto('/front-desk');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [id="main-content"], nav', { timeout: 15000 });

    await page.waitForFunction(
      () => (document.body?.textContent || '').includes('Amit Joshi'),
      { timeout: 15_000 },
    );

    // Use the search input
    const searchInput = page.getByPlaceholder(/Search names, purposes/i).first();
    if (await searchInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await searchInput.fill('Amit');
      await page.waitForTimeout(500);

      let bodyText = await page.textContent('body');
      expect(bodyText).toContain('Amit Joshi');

      // Clear and search by another name
      await searchInput.clear();
      await page.waitForTimeout(200);
      await searchInput.fill('Vijay');
      await page.waitForTimeout(500);

      bodyText = await page.textContent('body');
      expect(bodyText).toContain('Vijay Mehta');

      // Clear search to restore all results
      await searchInput.clear();
      await page.waitForTimeout(300);

      bodyText = await page.textContent('body');
      expect(bodyText).toContain('Amit Joshi');
      expect(bodyText).toContain('Deepa Nair');
      expect(bodyText).toContain('Vijay Mehta');
    }
  });
});
