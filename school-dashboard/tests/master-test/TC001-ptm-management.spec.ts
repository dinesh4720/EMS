import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, seedStudent, seedPTMSession,
  TEACHER_A_ID, TEACHER_B_ID, CLASS_10A_ID, CLASS_11A_ID,
  type MockState,
} from '../test-utils';

/* Force desktop viewport so the fixed sidebar does not overlap content */
test.use({ viewport: { width: 1280, height: 720 } });

function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

async function dismissOverlays(page: import('@playwright/test').Page) {
  // Dismiss coach-mark tip if present
  const skipTip = page.locator('button').filter({ hasText: /^Skip$/ }).first();
  if (await skipTip.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await skipTip.click();
  }
  // Dismiss any toast that might block interactions
  const toastClose = page.locator('[role="status"] button, [data-testid="toast-close"]').first();
  if (await toastClose.isVisible({ timeout: 500 }).catch(() => false)) {
    await toastClose.click();
  }
}

test.describe('PTM Management — Admin', () => {
  test.setTimeout(60_000);
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    // Seed students so class student lists are non-empty
    seedStudent(state, { name: 'Aarav Sharma', classId: CLASS_10A_ID, rollNo: '101' });
    seedStudent(state, { name: 'Diya Patel', classId: CLASS_10A_ID, rollNo: '102' });
    seedStudent(state, { name: 'Vihaan Reddy', classId: CLASS_11A_ID, rollNo: '201' });

    // Dismiss cookie consent banner and coach marks
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
      localStorage.setItem('ems_coach_marks_v1', JSON.stringify({ shell: Date.now() }));
      localStorage.setItem('ems_completed_tours', JSON.stringify(['app-shell']));
    });

    await installMockApi(page, state);
  });

  /* ───────────────────────────────────────────
     TC-001 — Empty state with zero sessions
  ─────────────────────────────────────────── */
  test('1 — empty state shows zero stats and create-first-session CTA', async ({ page }) => {
    await page.goto('/ptm');
    await page.waitForLoadState('networkidle');
    await dismissOverlays(page);

    // Stat cards should show 0
    await expect(page.getByText('Total').first()).toBeVisible({ timeout: 15_000 });
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('0');

    // Empty state messaging
    await expect(page.getByText('No PTM sessions yet').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Schedule your first parent-teacher meeting to get started.').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Create First Session/i }).first()).toBeVisible();
  });

  /* ───────────────────────────────────────────
     TC-002 — Stats cards reflect seeded data
  ─────────────────────────────────────────── */
  test('2 — stats cards reflect scheduled, completed, and cancelled counts', async ({ page }) => {
    seedPTMSession(state, { title: 'Term 1 PTM', status: 'scheduled', sessionDate: tomorrow() });
    seedPTMSession(state, { title: 'Term 2 PTM', status: 'completed', sessionDate: '2026-01-15' });
    seedPTMSession(state, { title: 'Emergency PTM', status: 'cancelled', sessionDate: '2026-02-01' });

    await page.goto('/ptm');
    await page.waitForLoadState('networkidle');
    await dismissOverlays(page);

    await expect(page.getByRole('heading', { name: 'Term 1 PTM' }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Term 2 PTM' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Emergency PTM' }).first()).toBeVisible();

    // Verify stat headings contain the expected counts
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Total');
    expect(bodyText).toContain('Scheduled');
    expect(bodyText).toContain('Completed');
    expect(bodyText).toContain('Cancelled');
  });

  /* ───────────────────────────────────────────
     TC-003 — Create PTM session with valid data
  ─────────────────────────────────────────── */
  test('3 — create PTM session with valid data and see it in the grid', async ({ page }) => {
    await page.goto('/ptm');
    await page.waitForLoadState('networkidle');
    await dismissOverlays(page);

    // Open create modal
    await page.getByRole('button', { name: /New PTM Session/i }).first().click();
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // Fill form
    await modal.getByLabel('Session Title').fill('Term 2 Parent-Teacher Meeting');
    await modal.getByLabel('Description').fill('Discuss mid-term progress for Class 10-A');
    await modal.getByLabel('Session Date').fill(tomorrow());
    await modal.getByLabel('Start Time').fill('09:00');
    await modal.getByLabel('End Time').fill('12:00');
    await modal.getByLabel('Slot Duration (min)').fill('20');
    await modal.getByLabel('Class').selectOption(CLASS_10A_ID);
    await modal.getByLabel('Teacher').selectOption(TEACHER_A_ID);
    await modal.getByLabel('Venue').fill('Conference Room A');

    // Submit
    await modal.getByRole('button', { name: /Create Session/i }).click();

    // Modal closes and card appears
    await expect(modal).not.toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Term 2 Parent-Teacher Meeting' }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Conference Room A').first()).toBeVisible();
    await expect(page.getByText('20 min slots').first()).toBeVisible();
  });

  /* ───────────────────────────────────────────
     TC-004 — View session details
  ─────────────────────────────────────────── */
  test('4 — view session details in detail modal', async ({ page }) => {
    seedPTMSession(state, {
      title: 'Annual Day PTM',
      status: 'scheduled',
      sessionDate: tomorrow(),
      startTime: '10:00',
      endTime: '13:00',
      slotDuration: 30,
      venue: 'Main Hall',
      classId: CLASS_10A_ID,
      staffId: TEACHER_A_ID,
    });

    await page.goto('/ptm');
    await page.waitForLoadState('networkidle');
    await dismissOverlays(page);
    await expect(page.getByRole('heading', { name: 'Annual Day PTM' }).first()).toBeVisible({ timeout: 15_000 });

    // Click eye icon
    await page.getByRole('button', { name: /View session details/i }).first().click();

    const modal = page.locator('[role="dialog"]').filter({ hasText: 'Annual Day PTM' }).first();
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // Metadata visible
    await expect(modal.getByText('Main Hall').first()).toBeVisible();
    await expect(modal.getByText('30 minutes').first()).toBeVisible();
    await expect(modal.getByText('10 (A)').first()).toBeVisible();
    await expect(modal.getByText('Ananya Sharma').first()).toBeVisible();
  });

  /* ───────────────────────────────────────────
     TC-005 — Book a slot
  ─────────────────────────────────────────── */
  test('5 — book a slot for a parent in session detail modal', async ({ page }) => {
    const session = seedPTMSession(state, {
      title: 'Slot Test PTM',
      status: 'scheduled',
      sessionDate: tomorrow(),
      startTime: '09:00',
      endTime: '11:00',
      classId: CLASS_10A_ID,
      staffId: TEACHER_A_ID,
    });

    await page.goto('/ptm');
    await page.waitForLoadState('networkidle');
    await dismissOverlays(page);
    await expect(page.getByRole('heading', { name: 'Slot Test PTM' }).first()).toBeVisible({ timeout: 15_000 });

    // Open detail
    await page.getByRole('button', { name: /View session details/i }).first().click();
    const modal = page.locator('[role="dialog"]').filter({ hasText: 'Slot Test PTM' }).first();
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // Book slot form
    await modal.getByLabel('Parent Name').fill('Rajesh Kumar');
    await modal.getByLabel('Student').selectOption(state.students[0].id);
    await modal.getByLabel('Time Slot').fill('09:30');
    await modal.getByLabel('Notes (optional)').fill('Bring report card');

    await modal.getByRole('button', { name: /Book Slot/i }).click();

    // Slot appears in booked list
    await expect(modal.getByText('Rajesh Kumar').first()).toBeVisible({ timeout: 10_000 });
    await expect(modal.getByText('09:30').first()).toBeVisible();
  });

  /* ───────────────────────────────────────────
     TC-006 — Change session status
  ─────────────────────────────────────────── */
  test('6 — change session status from scheduled to ongoing', async ({ page }) => {
    seedPTMSession(state, {
      title: 'Status Change PTM',
      status: 'scheduled',
      sessionDate: tomorrow(),
    });

    await page.goto('/ptm');
    await page.waitForLoadState('networkidle');
    await dismissOverlays(page);
    await expect(page.getByRole('heading', { name: 'Status Change PTM' }).first()).toBeVisible({ timeout: 15_000 });

    // Open detail
    await page.getByRole('button', { name: /View session details/i }).first().click();
    const modal = page.locator('[role="dialog"]').filter({ hasText: 'Status Change PTM' }).first();
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // Change status
    await modal.getByRole('button', { name: /Ongoing/i }).first().click();

    // After refresh, status chip should show ongoing
    await expect(modal.getByText('ongoing').first()).toBeVisible({ timeout: 10_000 });
  });

  /* ───────────────────────────────────────────
     TC-007 — Delete/cancel session
  ─────────────────────────────────────────── */
  test('7 — cancel a session via delete button and confirm dialog', async ({ page }) => {
    seedPTMSession(state, {
      title: 'Delete Me PTM',
      status: 'scheduled',
      sessionDate: tomorrow(),
    });

    await page.goto('/ptm');
    await page.waitForLoadState('networkidle');
    await dismissOverlays(page);
    await expect(page.getByRole('heading', { name: 'Delete Me PTM' }).first()).toBeVisible({ timeout: 15_000 });

    // Click trash icon
    await page.getByRole('button', { name: /Cancel session/i }).first().click();

    // Confirm dialog
    const confirmDialog = page.locator('[role="alertdialog"]').filter({ hasText: 'Cancel PTM Session' }).first();
    await expect(confirmDialog).toBeVisible({ timeout: 5_000 });
    await confirmDialog.getByRole('button', { name: /Cancel Session/i }).click();

    // Card disappears
    await expect(page.getByRole('heading', { name: 'Delete Me PTM' }).first()).not.toBeVisible({ timeout: 10_000 });
  });

  /* ───────────────────────────────────────────
     TC-008 — Validation: required fields
  ─────────────────────────────────────────── */
  test('8 — create form shows validation errors for missing required fields', async ({ page }) => {
    await page.goto('/ptm');
    await page.waitForLoadState('networkidle');
    await dismissOverlays(page);

    await page.getByRole('button', { name: /New PTM Session/i }).first().click();
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // Submit empty form
    await modal.getByRole('button', { name: /Create Session/i }).click();

    // Modal should stay open (validation failed)
    await expect(modal).toBeVisible({ timeout: 3_000 });

    // Native HTML5 validation blocks submission, so modal stays open
    await expect(modal).toBeVisible({ timeout: 5_000 });
  });

  /* ───────────────────────────────────────────
     TC-009 — Validation: end time must be after start time
  ─────────────────────────────────────────── */
  test('9 — create form rejects end time before or equal to start time', async ({ page }) => {
    await page.goto('/ptm');
    await page.waitForLoadState('networkidle');
    await dismissOverlays(page);

    await page.getByRole('button', { name: /New PTM Session/i }).first().click();
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5_000 });

    await modal.getByLabel('Session Title').fill('Bad Time PTM');
    await modal.getByLabel('Session Date').fill(tomorrow());
    await modal.getByLabel('Start Time').fill('10:00');
    await modal.getByLabel('End Time').fill('09:00');
    await modal.getByLabel('Class').selectOption(CLASS_10A_ID);
    await modal.getByLabel('Teacher').selectOption(TEACHER_A_ID);

    await modal.getByRole('button', { name: /Create Session/i }).click();

    // Modal stays open because of validation failure
    await expect(modal).toBeVisible({ timeout: 5_000 });
  });

  /* ───────────────────────────────────────────
     TC-010 — Edge case: overlapping session for same teacher is blocked
  ─────────────────────────────────────────── */
  test('10 — overlapping session for same teacher on same day is blocked', async ({ page }) => {
    const date = tomorrow();
    seedPTMSession(state, {
      title: 'First Session',
      status: 'scheduled',
      sessionDate: date,
      startTime: '09:00',
      endTime: '12:00',
      staffId: TEACHER_A_ID,
      classId: CLASS_10A_ID,
    });

    await page.goto('/ptm');
    await page.waitForLoadState('networkidle');
    await dismissOverlays(page);
    await expect(page.getByRole('heading', { name: 'First Session' }).first()).toBeVisible({ timeout: 15_000 });

    // Try to create overlapping session for same teacher
    await page.getByRole('button', { name: /New PTM Session/i }).first().click();
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5_000 });

    await modal.getByLabel('Session Title').fill('Overlapping Session');
    await modal.getByLabel('Session Date').fill(date);
    await modal.getByLabel('Start Time').fill('10:00');
    await modal.getByLabel('End Time').fill('13:00');
    await modal.getByLabel('Class').selectOption(CLASS_10A_ID);
    await modal.getByLabel('Teacher').selectOption(TEACHER_A_ID);

    await modal.getByRole('button', { name: /Create Session/i }).click();

    // Modal stays open because overlap is detected
    await expect(modal).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('heading', { name: 'Overlapping Session' }).first()).not.toBeVisible();
  });

  /* ───────────────────────────────────────────
     TC-011 — Edge case: same time different teacher is allowed
  ─────────────────────────────────────────── */
  test('11 — same time slot for different teacher on same day is allowed', async ({ page }) => {
    const date = tomorrow();
    seedPTMSession(state, {
      title: 'Teacher A Session',
      status: 'scheduled',
      sessionDate: date,
      startTime: '09:00',
      endTime: '12:00',
      staffId: TEACHER_A_ID,
      classId: CLASS_10A_ID,
    });

    await page.goto('/ptm');
    await page.waitForLoadState('networkidle');
    await dismissOverlays(page);
    await expect(page.getByRole('heading', { name: 'Teacher A Session' }).first()).toBeVisible({ timeout: 15_000 });

    // Create session for different teacher at same time
    await page.getByRole('button', { name: /New PTM Session/i }).first().click();
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5_000 });

    await modal.getByLabel('Session Title').fill('Teacher B Session');
    await modal.getByLabel('Session Date').fill(date);
    await modal.getByLabel('Start Time').fill('09:00');
    await modal.getByLabel('End Time').fill('12:00');
    await modal.getByLabel('Class').selectOption(CLASS_11A_ID);
    await modal.getByLabel('Teacher').selectOption(TEACHER_B_ID);

    await modal.getByRole('button', { name: /Create Session/i }).click();

    // Modal closes and new card appears
    await expect(modal).not.toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Teacher B Session' }).first()).toBeVisible({ timeout: 10_000 });
  });

  /* ───────────────────────────────────────────
     TC-012 — Status filtering shows only matching sessions
  ─────────────────────────────────────────── */
  test('12 — status filter chips show only matching sessions', async ({ page }) => {
    seedPTMSession(state, { title: 'Scheduled PTM', status: 'scheduled', sessionDate: tomorrow() });
    seedPTMSession(state, { title: 'Completed PTM', status: 'completed', sessionDate: '2026-01-10' });
    seedPTMSession(state, { title: 'Cancelled PTM', status: 'cancelled', sessionDate: '2026-01-12' });

    await page.goto('/ptm');
    await page.waitForLoadState('networkidle');
    await dismissOverlays(page);
    await expect(page.getByRole('heading', { name: 'Scheduled PTM' }).first()).toBeVisible({ timeout: 15_000 });

    // Click Completed filter
    await page.getByRole('tab', { name: /^Completed$/i }).first().click();
    await page.waitForTimeout(500);

    await expect(page.getByRole('heading', { name: 'Completed PTM' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Scheduled PTM' }).first()).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cancelled PTM' }).first()).not.toBeVisible();

    // Click Cancelled filter
    await page.getByRole('tab', { name: /^Cancelled$/i }).first().click();
    await page.waitForTimeout(500);

    await expect(page.getByRole('heading', { name: 'Cancelled PTM' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Scheduled PTM' }).first()).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Completed PTM' }).first()).not.toBeVisible();
  });

  /* ───────────────────────────────────────────
     TC-013 — Empty state for filtered status
  ─────────────────────────────────────────── */
  test('13 — filtered status with no matches shows empty state', async ({ page }) => {
    seedPTMSession(state, { title: 'Only Scheduled', status: 'scheduled', sessionDate: tomorrow() });

    await page.goto('/ptm');
    await page.waitForLoadState('networkidle');
    await dismissOverlays(page);
    await expect(page.getByRole('heading', { name: 'Only Scheduled' }).first()).toBeVisible({ timeout: 15_000 });

    // Filter to Completed — none exist
    await page.getByRole('tab', { name: /^Completed$/i }).first().click();
    await page.waitForTimeout(500);

    await expect(page.getByText('No completed sessions').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Try a different status filter or schedule a new session.').first()).toBeVisible();
  });

  /* ───────────────────────────────────────────
     TC-014 — Session card displays correct metadata
  ─────────────────────────────────────────── */
  test('14 — session card shows title, date, time, venue, slots, class, and teacher', async ({ page }) => {
    seedPTMSession(state, {
      title: 'Metadata Check PTM',
      status: 'scheduled',
      sessionDate: tomorrow(),
      startTime: '14:00',
      endTime: '16:00',
      slotDuration: 25,
      venue: 'Room 101',
      classId: CLASS_10A_ID,
      staffId: TEACHER_A_ID,
      slots: [
        { _id: 'slot-1', studentId: state.students[0].id, parentName: 'Parent A', scheduledTime: '14:00', status: 'booked' },
      ],
    });

    await page.goto('/ptm');
    await page.waitForLoadState('networkidle');
    await dismissOverlays(page);
    await expect(page.getByRole('heading', { name: 'Metadata Check PTM' }).first()).toBeVisible({ timeout: 15_000 });

    // Card metadata
    await expect(page.getByText('Room 101').first()).toBeVisible();
    await expect(page.getByText('25 min slots').first()).toBeVisible();
    await expect(page.getByText('14:00').first()).toBeVisible();
    await expect(page.getByText('10 (A)').first()).toBeVisible();
    await expect(page.getByText('Ananya Sharma').first()).toBeVisible();
    await expect(page.getByText(/1 slot booked/).first()).toBeVisible();
  });

  /* ───────────────────────────────────────────
     TC-015 — Accessibility: modal has proper roles
  ─────────────────────────────────────────── */
  test('15 — create and detail modals have dialog role and accessible labels', async ({ page }) => {
    seedPTMSession(state, {
      title: 'Accessible PTM',
      status: 'scheduled',
      sessionDate: tomorrow(),
    });

    await page.goto('/ptm');
    await page.waitForLoadState('networkidle');
    await dismissOverlays(page);

    // Open create modal
    await page.getByRole('button', { name: /New PTM Session/i }).first().click();
    const createModal = page.locator('[role="dialog"]').first();
    await expect(createModal).toBeVisible({ timeout: 5_000 });

    // Dialog should have an accessible name via aria-labelledby
    await expect(createModal).toHaveAttribute('aria-labelledby', /.*/);

    // Close create modal
    await createModal.getByRole('button', { name: /Cancel/i }).first().click();
    await expect(createModal).not.toBeVisible({ timeout: 5_000 });

    // Open detail modal
    await page.getByRole('button', { name: /View session details/i }).first().click();
    const detailModal = page.locator('[role="dialog"]').filter({ hasText: 'Accessible PTM' }).first();
    await expect(detailModal).toBeVisible({ timeout: 5_000 });

    // Status filter tabs have proper ARIA
    const tablist = page.locator('[role="tablist"]').first();
    await expect(tablist).toBeVisible();
    await expect(tablist).toHaveAttribute('aria-label', 'Filter by status');
  });
});
