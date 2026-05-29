import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  seedPTMSession, seedStudent,
  TEACHER_A_ID, TEACHER_B_ID, CLASS_10A_ID, CLASS_11A_ID,
  type MockState,
} from './test-utils';

/* Force desktop viewport so the fixed sidebar does not overlap content */
test.use({ viewport: { width: 1280, height: 720 } });

function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

async function dismissOverlays(page: import('@playwright/test').Page) {
  const skipTip = page.locator('button').filter({ hasText: /^Skip$/ }).first();
  if (await skipTip.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await skipTip.click();
  }
}

test.describe('PTM Management', () => {
  test.setTimeout(60_000);
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    seedStudent(state, { name: 'Aarav Sharma', classId: CLASS_10A_ID, rollNo: '101' });
    seedStudent(state, { name: 'Diya Patel', classId: CLASS_10A_ID, rollNo: '102' });
    seedStudent(state, { name: 'Vihaan Reddy', classId: CLASS_11A_ID, rollNo: '201' });

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);
  });

  /* ── 1. Empty state ── */
  test('empty state shows zero stats and create-first-session CTA', async ({ page }) => {
    await page.goto('/ptm');
    await page.waitForLoadState('networkidle');
    await dismissOverlays(page);

    await expect(page.getByText('Total').first()).toBeVisible({ timeout: 15_000 });
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('0');

    await expect(page.getByText('No PTM sessions yet').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Schedule your first parent-teacher meeting to get started.').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Create First Session/i }).first()).toBeVisible();
  });

  /* ── 2. List load ── */
  test('PTM list loads with meeting cards showing title, date, status, and venue', async ({ page }) => {
    seedPTMSession(state, { title: 'Term 1 PTM', status: 'scheduled', sessionDate: tomorrow(), venue: 'Conference Room A' });
    seedPTMSession(state, { title: 'Term 2 PTM', status: 'completed', sessionDate: '2026-01-15', venue: 'Main Hall' });
    seedPTMSession(state, { title: 'Emergency PTM', status: 'cancelled', sessionDate: '2026-02-01', venue: 'Room 101' });

    await page.goto('/ptm');
    await page.waitForLoadState('networkidle');
    await dismissOverlays(page);

    await expect(page.getByRole('heading', { name: 'Term 1 PTM' }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Term 2 PTM' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Emergency PTM' }).first()).toBeVisible();

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Conference Room A');
    expect(bodyText).toContain('Main Hall');
    expect(bodyText).toContain('scheduled');
    expect(bodyText).toContain('completed');
    expect(bodyText).toContain('cancelled');
  });

  /* ── 3. Create ── */
  test('creating a new PTM session adds it to the grid', async ({ page }) => {
    await page.goto('/ptm');
    await page.waitForLoadState('networkidle');
    await dismissOverlays(page);

    await page.getByRole('button', { name: /New PTM Session/i }).first().click();
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5_000 });

    await modal.getByLabel('Session Title').fill('Mid-Term PTM');
    await modal.getByLabel('Description').fill('Discuss mid-term progress');
    await modal.getByLabel('Session Date').fill(tomorrow());
    await modal.getByLabel('Start Time').fill('09:00');
    await modal.getByLabel('End Time').fill('12:00');
    await modal.getByLabel('Slot Duration (min)').fill('20');
    await modal.getByLabel('Class').selectOption(CLASS_10A_ID);
    await modal.getByLabel('Teacher').selectOption(TEACHER_A_ID);
    await modal.getByLabel('Venue').fill('Conference Room B');

    await modal.getByRole('button', { name: /Create Session/i }).click();

    await expect(modal).not.toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Mid-Term PTM' }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Conference Room B').first()).toBeVisible();
    await expect(page.getByText('20 min slots').first()).toBeVisible();
  });

  /* ── 4. Edit (status change via detail modal) ── */
  test('editing a PTM session changes its status', async ({ page }) => {
    seedPTMSession(state, {
      title: 'Status Edit PTM',
      status: 'scheduled',
      sessionDate: tomorrow(),
      startTime: '10:00',
      endTime: '13:00',
      classId: CLASS_10A_ID,
      staffId: TEACHER_A_ID,
    });

    await page.goto('/ptm');
    await page.waitForLoadState('networkidle');
    await dismissOverlays(page);
    await expect(page.getByRole('heading', { name: 'Status Edit PTM' }).first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /View session details/i }).first().click();
    const modal = page.locator('[role="dialog"]').filter({ hasText: 'Status Edit PTM' }).first();
    await expect(modal).toBeVisible({ timeout: 5_000 });

    await modal.getByRole('button', { name: /Ongoing/i }).first().click();
    await expect(modal.getByText('ongoing').first()).toBeVisible({ timeout: 10_000 });

    await modal.getByRole('button', { name: /Close/i }).first().click();
    await expect(modal).not.toBeVisible({ timeout: 5_000 });

    // Status chip on the card should also update after refresh
    await page.reload();
    await page.waitForLoadState('networkidle');
    await dismissOverlays(page);
    await expect(page.getByRole('heading', { name: 'Status Edit PTM' }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('ongoing').first()).toBeVisible();
  });

  /* ── 5. Cancel / delete ── */
  test('canceling a PTM session removes it from the list', async ({ page }) => {
    seedPTMSession(state, {
      title: 'Delete Me PTM',
      status: 'scheduled',
      sessionDate: tomorrow(),
    });

    await page.goto('/ptm');
    await page.waitForLoadState('networkidle');
    await dismissOverlays(page);
    await expect(page.getByRole('heading', { name: 'Delete Me PTM' }).first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /Cancel session/i }).first().click();

    const confirmDialog = page.locator('[role="alertdialog"]').filter({ hasText: 'Cancel PTM Session' }).first();
    await expect(confirmDialog).toBeVisible({ timeout: 5_000 });
    await confirmDialog.getByRole('button', { name: /Cancel Session/i }).click();

    await expect(page.getByRole('heading', { name: 'Delete Me PTM' }).first()).not.toBeVisible({ timeout: 10_000 });
  });

  /* ── 6. Empty state for filtered status ── */
  test('filtered status with no matches shows empty state', async ({ page }) => {
    seedPTMSession(state, { title: 'Only Scheduled', status: 'scheduled', sessionDate: tomorrow() });

    await page.goto('/ptm');
    await page.waitForLoadState('networkidle');
    await dismissOverlays(page);
    await expect(page.getByRole('heading', { name: 'Only Scheduled' }).first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole('tab', { name: /^Completed$/i }).first().click();
    await page.waitForTimeout(500);

    await expect(page.getByText('No completed sessions').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Try a different status filter or schedule a new session.').first()).toBeVisible();
  });
});
