/**
 * TC169: Dashboard Widget Customization — add, remove, reorder, persist.
 *
 * Covers the DK-600 Dashboard Enhancement widget customizer:
 * - Opening the customizer modal
 * - Hiding and showing widgets
 * - Reordering widgets via move up/down
 * - Resetting to defaults
 * - localStorage persistence across reloads
 * - Edge case: hiding all but one widget
 */
import { expect, test } from '@playwright/test';
import {
  createMockState,
  installMockApi,
  seedStudentWithFees,
  seedAttendanceForClass,
  seedAnnouncement,
  CLASS_10A_ID,
  CLASS_11A_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Constants
 * ───────────────────────────────────────────────────────────────────── */

// Default widget keys from widgetRegistry (in order)
const DEFAULT_WIDGET_KEYS = [
  'kpiStrip',
  'feeTrend',
  'attendanceTrend',
  'enrollmentStats',
  'recentActivity',
  'yourDay',
  'actions',
  'people',
  'announcements',
  'recentPayments',
];

/* ─────────────────────────────────────────────────────────────────────
 *  Helpers
 * ───────────────────────────────────────────────────────────────────── */

async function openCustomizer(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  // Wait for the real widget grid (not the skeleton)
  await page.locator('.widget-grid').waitFor({ state: 'visible', timeout: 10000 });
  await page.getByRole('button', { name: 'Customize dashboard' }).click();
  await page.locator('.widget-customizer-overlay').waitFor({ state: 'visible' });
}

async function getVisibleWidgetKeys(page: import('@playwright/test').Page): Promise<string[]> {
  const wrappers = await page.locator('.widget-grid > .widget-wrapper').all();
  const keys: string[] = [];
  for (const wrapper of wrappers) {
    const classAttr = await wrapper.getAttribute('class');
    const match = classAttr?.match(/widget-wrapper--(\w+)/);
    if (match) keys.push(match[1]);
  }
  return keys;
}

async function getCustomizerItems(page: import('@playwright/test').Page): Promise<string[]> {
  return page.locator('.widget-customizer__name').allTextContents();
}

/* ─────────────────────────────────────────────────────────────────────
 *  Tests
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC169: Dashboard Widget Customization', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    // Seed 4 students with varied classes and fee statuses
    const s1 = seedStudentWithFees(state, { name: 'Aarav Sharma', classId: CLASS_10A_ID, feeStatus: 'paid', gender: 'Male' });
    const s2 = seedStudentWithFees(state, { name: 'Diya Patel', classId: CLASS_10A_ID, feeStatus: 'pending', gender: 'Female' });
    const s3 = seedStudentWithFees(state, { name: 'Rishi Kumar', classId: CLASS_11A_ID, feeStatus: 'overdue', gender: 'Male' });
    const s4 = seedStudentWithFees(state, { name: 'Ananya Gupta', classId: CLASS_11A_ID, feeStatus: 'paid', gender: 'Female' });

    // Seed attendance for today so the KPI strip has real data
    const today = new Date().toISOString().split('T')[0];
    seedAttendanceForClass(state, CLASS_10A_ID, today);
    seedAttendanceForClass(state, CLASS_11A_ID, today);

    // Seed announcements for the Recent Activity widget
    seedAnnouncement(state, { title: 'Annual Day Rehearsal', content: 'All students must attend.', status: 'published' });
    seedAnnouncement(state, { title: 'Fee Reminder', content: 'Last date for Term 2 fees is May 31.', status: 'published' });

    // Seed payments so Fee Trend widget renders with data
    state.payments.push(
      { _id: 'pay-1', id: 'pay-1', amount: 5000, date: new Date().toISOString(), status: 'paid', studentId: s1.id, studentName: s1.name },
      { _id: 'pay-2', id: 'pay-2', amount: 3500, date: new Date().toISOString(), status: 'paid', studentId: s2.id, studentName: s2.name },
      { _id: 'pay-3', id: 'pay-3', amount: 7000, date: new Date().toISOString(), status: 'paid', studentId: s4.id, studentName: s4.name },
    );

    await installMockApi(page, state);
  });

  test('1) dashboard loads with all default widgets visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('.widget-grid').waitFor({ state: 'visible' });

    const keys = await getVisibleWidgetKeys(page);
    expect(keys).toEqual(DEFAULT_WIDGET_KEYS);
  });

  test('2) hide a widget via customizer and save', async ({ page }) => {
    await openCustomizer(page);

    // Hide "Fee collection trend" widget
    const item = page.locator('.widget-customizer__item').filter({ hasText: 'Fee collection trend' });
    await item.getByRole('button', { name: 'Hide widget' }).click();

    // Click Done to save changes
    await page.locator('.widget-customizer__foot .btn--accent').click();
    await page.locator('.widget-customizer-overlay').waitFor({ state: 'hidden' });

    // Verify the widget is no longer on the dashboard
    const keys = await getVisibleWidgetKeys(page);
    expect(keys).not.toContain('feeTrend');
    expect(keys).toContain('kpiStrip');
    expect(keys).toContain('attendanceTrend');
    expect(keys).toContain('enrollmentStats');
  });

  test('3) reorder widgets via move up and move down', async ({ page }) => {
    await openCustomizer(page);

    // "Recent activity" is 5th by default; move it up twice
    const item = page.locator('.widget-customizer__item').filter({ hasText: 'Recent activity' });
    await item.getByRole('button', { name: 'Move up' }).click();
    await item.getByRole('button', { name: 'Move up' }).click();

    // Save
    await page.locator('.widget-customizer__foot .btn--accent').click();
    await page.locator('.widget-customizer-overlay').waitFor({ state: 'hidden' });

    // Verify DOM order changed: recentActivity should now be 3rd
    const keys = await getVisibleWidgetKeys(page);
    expect(keys[2]).toBe('recentActivity');
  });

  test('4) show a previously hidden widget', async ({ page }) => {
    await openCustomizer(page);

    // Hide "Enrollment stats"
    let item = page.locator('.widget-customizer__item').filter({ hasText: 'Enrollment stats' });
    await item.getByRole('button', { name: 'Hide widget' }).click();
    await page.locator('.widget-customizer__foot .btn--accent').click();
    await page.locator('.widget-customizer-overlay').waitFor({ state: 'hidden' });

    let keys = await getVisibleWidgetKeys(page);
    expect(keys).not.toContain('enrollmentStats');

    // Re-open customizer and show it again
    await page.getByRole('button', { name: 'Customize dashboard' }).click();
    await page.locator('.widget-customizer-overlay').waitFor({ state: 'visible' });

    item = page.locator('.widget-customizer__item').filter({ hasText: 'Enrollment stats' });
    await item.getByRole('button', { name: 'Show widget' }).click();
    await page.locator('.widget-customizer__foot .btn--accent').click();
    await page.locator('.widget-customizer-overlay').waitFor({ state: 'hidden' });

    keys = await getVisibleWidgetKeys(page);
    expect(keys).toContain('enrollmentStats');
  });

  test('5) reset to defaults restores original order and visibility', async ({ page }) => {
    await openCustomizer(page);

    // Hide "Actions" and move "People" up
    let item = page.locator('.widget-customizer__item').filter({ hasText: 'Actions' });
    await item.getByRole('button', { name: 'Hide widget' }).click();

    item = page.locator('.widget-customizer__item').filter({ hasText: 'People' });
    await item.getByRole('button', { name: 'Move up' }).click();

    // Click Reset to default
    await page.locator('.widget-customizer__foot .btn--ghost').click();

    // Verify the modal reflects defaults again
    const items = await getCustomizerItems(page);
    expect(items[0]).toBe('KPI strip');
    expect(items[1]).toBe('Fee collection trend');
    expect(items[2]).toBe('Attendance trend');
    expect(items[3]).toBe('Enrollment stats');

    // "Actions" should be visible again inside the modal
    const actionsItem = page.locator('.widget-customizer__item').filter({ hasText: 'Actions' });
    await expect(actionsItem.getByRole('button', { name: 'Hide widget' })).toBeVisible();
  });

  test('6) persistence: hidden widgets stay hidden after page reload', async ({ page }) => {
    await openCustomizer(page);

    // Hide "Your day" and "Notices"
    let item = page.locator('.widget-customizer__item').filter({ hasText: 'Your day' });
    await item.getByRole('button', { name: 'Hide widget' }).click();
    item = page.locator('.widget-customizer__item').filter({ hasText: 'Notices' });
    await item.getByRole('button', { name: 'Hide widget' }).click();

    await page.locator('.widget-customizer__foot .btn--accent').click();
    await page.locator('.widget-customizer-overlay').waitFor({ state: 'hidden' });

    let keys = await getVisibleWidgetKeys(page);
    expect(keys).not.toContain('yourDay');
    expect(keys).not.toContain('announcements');

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.locator('.widget-grid').waitFor({ state: 'visible' });

    keys = await getVisibleWidgetKeys(page);
    expect(keys).not.toContain('yourDay');
    expect(keys).not.toContain('announcements');
    expect(keys).toContain('kpiStrip');
    expect(keys).toContain('feeTrend');
  });

  test('7) edge case: hide all widgets except one', async ({ page }) => {
    await openCustomizer(page);

    // Hide every widget except "KPI strip"
    const widgetsToHide = [
      'Fee collection trend',
      'Attendance trend',
      'Enrollment stats',
      'Recent activity',
      'Your day',
      'Actions',
      'People',
      'Notices',
      'Recent payments',
    ];

    for (const name of widgetsToHide) {
      const item = page.locator('.widget-customizer__item').filter({ hasText: name });
      const hideBtn = item.getByRole('button', { name: 'Hide widget' });
      // Guard against race: only click if the button is present
      if (await hideBtn.isVisible().catch(() => false)) {
        await hideBtn.click();
      }
    }

    await page.locator('.widget-customizer__foot .btn--accent').click();
    await page.locator('.widget-customizer-overlay').waitFor({ state: 'hidden' });

    const keys = await getVisibleWidgetKeys(page);
    expect(keys).toEqual(['kpiStrip']);
  });
});
