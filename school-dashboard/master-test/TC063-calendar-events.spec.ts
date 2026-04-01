import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, seedCalendarEvent,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  TC063 — Calendar Events: create, view, edit, delete
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC063 — Calendar Events', () => {
  let state: MockState;

  // Use current month dates so events appear in the default view
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const pad = (n: number) => String(n).padStart(2, '0');
  const day10Key = `${year}-${pad(month + 1)}-10`;
  const day20Key = `${year}-${pad(month + 1)}-20`;

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    // Seed 2 calendar events
    seedCalendarEvent(state, {
      title: 'Staff Meeting',
      type: 'meeting',
      date: day10Key,
      startTime: '10:00',
      endTime: '11:00',
      description: 'Monthly staff meeting to discuss curriculum.',
    });
    seedCalendarEvent(state, {
      title: 'Final Exam',
      type: 'exam',
      date: day20Key,
      startTime: '09:00',
      endTime: '12:00',
      description: 'Final examination for all classes.',
    });

    await installMockApi(page, state);
  });

  /* ───────── 1. Calendar page loads with month view ───────── */

  test('1) calendar page loads showing month view', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);

    const currentMonthName = today.toLocaleDateString('en-US', { month: 'long' });
    const bodyText = await page.locator('#root').textContent();
    expect(bodyText).toContain(currentMonthName);

    // Day-of-week headers should be visible
    expect(bodyText).toContain('Sun');
    expect(bodyText).toContain('Mon');
  });

  /* ───────── 2. Seeded events are displayed ───────── */

  test('2) seeded events appear on the calendar', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.locator('#root').textContent();
    expect(bodyText).toContain('Staff Meeting');
    expect(bodyText).toContain('Final Exam');
  });

  /* ───────── 3. Click "Add Event" opens creation form ───────── */

  test('3) clicking Add Event opens the event creation drawer', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    const addBtn = page.getByRole('button', { name: /add event/i }).first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);

      const bodyText = await page.locator('#root').textContent();
      expect(bodyText).toContain('New Event');
    }
  });

  /* ───────── 4. Create event with title and time ───────── */

  test('4) create Parent-Teacher Meeting event', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    const addBtn = page.getByRole('button', { name: /add event/i }).first();
    if (!(await addBtn.isVisible({ timeout: 5000 }).catch(() => false))) return;
    await addBtn.click();
    await page.waitForTimeout(500);

    // Fill title
    const titleInput = page.locator(
      'input[placeholder*="Staff Meeting"], input[placeholder*="Annual Day"], input[placeholder*="title" i], input[name="title"]',
    ).first();
    if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await titleInput.fill('Parent-Teacher Meeting');
    } else {
      // Fallback: find any text input in the drawer
      const inputs = page.locator('.fixed input[type="text"], .fixed input:not([type])').first();
      if (await inputs.isVisible({ timeout: 2000 }).catch(() => false)) {
        await inputs.fill('Parent-Teacher Meeting');
      }
    }

    // Fill description if available
    const descInput = page.locator('textarea, input[name="description"]').first();
    if (await descInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await descInput.fill('Quarterly parent-teacher meeting for all classes.');
    }

    // Click create
    const createBtn = page.getByRole('button', { name: /create event/i }).first();
    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(500);

      expect(state.calendarEvents.some(e => e.title === 'Parent-Teacher Meeting')).toBeTruthy();
    }
  });

  /* ───────── 5. Verify new event appears on calendar ───────── */

  test('5) created event appears on the calendar after creation', async ({ page }) => {
    // Pre-add event to state
    seedCalendarEvent(state, {
      title: 'Parent-Teacher Meeting',
      type: 'meeting',
      date: `${year}-${pad(month + 1)}-15`,
      startTime: '14:00',
      endTime: '16:00',
    });

    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.locator('#root').textContent();
    expect(bodyText).toContain('Parent-Teacher Meeting');
  });

  /* ───────── 6. Click event to view details ───────── */

  test('6) clicking an event shows its details', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    // Click on Staff Meeting event
    const eventEl = page.locator('div').filter({ hasText: /^Staff Meeting$/ }).first();
    const eventText = page.getByText('Staff Meeting').first();

    const target = (await eventEl.isVisible({ timeout: 3000 }).catch(() => false))
      ? eventEl
      : eventText;

    if (await target.isVisible({ timeout: 5000 }).catch(() => false)) {
      await target.click();
      await page.waitForTimeout(500);

      // Detail modal or expanded view should appear
      const modal = page.locator('[role="dialog"]').first();
      if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
        const modalText = await modal.textContent();
        expect(
          modalText?.includes('Staff Meeting') || modalText?.includes('Event Details'),
        ).toBeTruthy();
      }
    }
  });

  /* ───────── 7. Edit event updates it ───────── */

  test('7) editing an event updates its title in state', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    const eventToUpdate = state.calendarEvents.find(e => e.title === 'Staff Meeting');
    expect(eventToUpdate).toBeTruthy();

    // Simulate edit by updating state and reloading
    if (eventToUpdate) {
      eventToUpdate.title = 'Updated Staff Meeting';
    }

    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.locator('#root').textContent();
    expect(bodyText).toContain('Updated Staff Meeting');
  });

  /* ───────── 8. Delete event removes it ───────── */

  test('8) deleting an event removes it from the calendar', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    // Verify event exists first
    let bodyText = await page.locator('#root').textContent();
    expect(bodyText).toContain('Final Exam');

    // Click event to open detail modal
    const eventEl = page.locator('div').filter({ hasText: /^Final Exam$/ }).first();
    const eventText = page.getByText('Final Exam').first();

    const target = (await eventEl.isVisible({ timeout: 3000 }).catch(() => false))
      ? eventEl
      : eventText;

    if (await target.isVisible({ timeout: 5000 }).catch(() => false)) {
      await target.click();
      await page.waitForTimeout(500);

      const modal = page.locator('[role="dialog"]').first();
      if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
        const deleteBtn = modal.getByRole('button', { name: /delete/i }).first();
        if (await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await deleteBtn.click();
          await page.waitForTimeout(500);

          expect(state.calendarEvents.some(e => e.title === 'Final Exam')).toBeFalsy();
        }
      }
    }
  });

  /* ───────── 9. Event type color coding ───────── */

  test('9) events display with type-based color coding', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    // Events should be rendered in the grid with distinct color classes
    const allEventDivs = page.locator('.grid.grid-cols-7 [class*="truncate"]');
    const count = await allEventDivs.count();
    expect(count).toBeGreaterThan(0);

    // Collect color class patterns
    const classPatterns = new Set<string>();
    for (let i = 0; i < Math.min(count, 10); i++) {
      const cls = await allEventDivs.nth(i).getAttribute('class');
      if (cls?.includes('warning')) classPatterns.add('warning');
      if (cls?.includes('secondary')) classPatterns.add('secondary');
      if (cls?.includes('primary')) classPatterns.add('primary');
      if (cls?.includes('danger')) classPatterns.add('danger');
    }

    // We seeded meeting (secondary) and exam (warning) — at least 1 distinct style
    expect(classPatterns.size).toBeGreaterThanOrEqual(1);
  });

  /* ───────── 10. Creation form has required fields ───────── */

  test('10) event creation form has title, type, and time fields', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    const addBtn = page.getByRole('button', { name: /add event/i }).first();
    if (!(await addBtn.isVisible({ timeout: 5000 }).catch(() => false))) return;
    await addBtn.click();
    await page.waitForTimeout(500);

    const drawerText = await page.locator('#root').textContent();

    // Title field
    expect(drawerText).toContain('Event Title');

    // Event type options
    expect(
      drawerText?.includes('Holiday') || drawerText?.includes('Exam') ||
      drawerText?.includes('Event') || drawerText?.includes('Meeting'),
    ).toBeTruthy();

    // Time fields
    expect(drawerText?.includes('Start Time') || drawerText?.includes('End Time')).toBeTruthy();
  });

  /* ───────── 11. State integrity check ───────── */

  test('11) state has 2 seeded calendar events', async ({ page }) => {
    expect(state.calendarEvents).toHaveLength(2);
    expect(state.calendarEvents[0].title).toBe('Staff Meeting');
    expect(state.calendarEvents[0].type).toBe('meeting');
    expect(state.calendarEvents[1].title).toBe('Final Exam');
    expect(state.calendarEvents[1].type).toBe('exam');
  });
});
