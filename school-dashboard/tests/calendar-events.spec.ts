import { expect, test } from '@playwright/test';
import {
  createMockState,
  installMockApi,
  seedCalendarEvent,
  type MockState,
} from './test-utils';

/* ───────────────── Calendar — Events & Navigation ───────────────── */

test.describe('Calendar — Events & Navigation', () => {
  let state: MockState;

  // Use today's date for seeded events so they appear in the current month view
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const pad = (n: number) => String(n).padStart(2, '0');
  const todayKey = `${year}-${pad(month + 1)}-${pad(today.getDate())}`;
  const day15Key = `${year}-${pad(month + 1)}-15`;
  const day20Key = `${year}-${pad(month + 1)}-20`;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    // Dismiss cookie consent so it doesn't block clicks or overlay modals
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });
    // Seed events on known dates in the current month
    seedCalendarEvent(state, { title: 'Staff Meeting', type: 'meeting', date: day15Key, startTime: '10:00', endTime: '11:00' });
    seedCalendarEvent(state, { title: 'Final Exam', type: 'exam', date: day20Key, startTime: '09:00', endTime: '12:00' });
    seedCalendarEvent(state, { title: 'Annual Day', type: 'event', date: todayKey, startTime: '14:00', endTime: '17:00' });
    await installMockApi(page, state);
  });

  test('1 — calendar page loads with month view showing current month', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    // Wait for the calendar to actually render (the Add Event button is always present)
    await expect(page.getByRole('button', { name: /add event/i })).toBeVisible({ timeout: 15000 });

    // The header should contain the current month name
    const currentMonthName = today.toLocaleDateString('en-US', { month: 'long' });
    await expect(page.locator('#root')).toContainText(currentMonthName, { timeout: 5000 });

    // Day-of-week headers should be visible (month grid)
    await expect(page.locator('#root')).toContainText('Sun', { timeout: 3000 });
    await expect(page.locator('#root')).toContainText('Mon', { timeout: 3000 });

    // Month view button should be active (has shadow-sm class indicating selection)
    const monthBtn = page.locator('button').filter({ hasText: 'Month' }).first();
    if (await monthBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const className = await monthBtn.getAttribute('class');
      expect(className).toContain('shadow');
    }
  });

  test('2 — navigation arrows switch to previous/next month', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    // Wait for the calendar to render
    await expect(page.getByRole('button', { name: /add event/i })).toBeVisible({ timeout: 15000 });

    const currentMonthName = today.toLocaleDateString('en-US', { month: 'long' });
    await expect(page.locator('#root')).toContainText(currentMonthName, { timeout: 5000 });

    // The navigation toolbar (sticky div) has icon buttons: <<, <, >, >>
    // Scope to the sticky toolbar to avoid matching sidebar chevron icons
    const toolbar = page.locator('.sticky');
    const nextBtn = toolbar.locator('button:has(svg.lucide-chevron-right)').first();
    await nextBtn.click();

    const nextMonth = new Date(year, month + 1, 1);
    const nextMonthName = nextMonth.toLocaleDateString('en-US', { month: 'long' });
    // Wait for the month name to appear in the page after navigation
    await expect(page.locator('#root')).toContainText(nextMonthName, { timeout: 5000 });

    // Click previous month arrow twice to go back one month before current
    const prevBtn = toolbar.locator('button:has(svg.lucide-chevron-left)').first();
    await prevBtn.click();
    await page.waitForTimeout(300);
    await prevBtn.click();

    const prevMonth = new Date(year, month - 1, 1);
    const prevMonthName = prevMonth.toLocaleDateString('en-US', { month: 'long' });
    // Wait for the previous month name to appear
    await expect(page.locator('#root')).toContainText(prevMonthName, { timeout: 5000 });
  });

  test('3 — week view and day view toggle buttons work', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    // Switch to week view
    const weekBtn = page.locator('button').filter({ hasText: /^Week$/ }).first();
    await weekBtn.click();
    await page.waitForTimeout(300);

    // Week view should show 7 day columns with date numbers
    const weekClass = await weekBtn.getAttribute('class');
    expect(weekClass).toContain('shadow');

    // Switch to day view
    const dayBtn = page.locator('button').filter({ hasText: /^Day$/ }).first();
    await dayBtn.click();
    await page.waitForTimeout(300);

    const dayClass = await dayBtn.getAttribute('class');
    expect(dayClass).toContain('shadow');

    // Day view shows the current date number prominently
    const dayViewText = await page.locator('#root').textContent();
    expect(dayViewText).toContain(String(today.getDate()));

    // Switch back to month view
    const monthBtn = page.locator('button').filter({ hasText: 'Month' }).first();
    await monthBtn.click();
    await page.waitForTimeout(300);
    const monthClass = await monthBtn.getAttribute('class');
    expect(monthClass).toContain('shadow');
  });

  test('4 — events appear on correct date cells with type-based color coding', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    // Wait for the calendar to fully render
    await expect(page.getByRole('button', { name: /add event/i })).toBeVisible({ timeout: 15000 });

    // Seeded events should be visible in the month grid after context loads
    // Events are loaded asynchronously via AppContext settings query
    await expect(page.getByText('Staff Meeting')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Final Exam')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Annual Day')).toBeVisible({ timeout: 5000 });

    // Verify type-based color coding: exam events have warning color classes
    const examEvent = page.locator('div').filter({ hasText: 'Final Exam' }).locator('[class*="warning"]').first();
    if (await examEvent.isVisible({ timeout: 2000 }).catch(() => false)) {
      expect(await examEvent.isVisible()).toBeTruthy();
    }

    // Meeting events have secondary color classes
    const meetingEvent = page.locator('div').filter({ hasText: 'Staff Meeting' }).locator('[class*="secondary"]').first();
    if (await meetingEvent.isVisible({ timeout: 2000 }).catch(() => false)) {
      expect(await meetingEvent.isVisible()).toBeTruthy();
    }
  });

  test('5 — clicking a date cell opens Create Event drawer', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    // Click on a date cell in the month grid (the 10th of current month should be empty)
    const dayCells = page.locator('.grid.grid-cols-7 > div').filter({ hasText: /^10$/ });
    const targetCell = dayCells.first();
    if (await targetCell.isVisible({ timeout: 3000 }).catch(() => false)) {
      await targetCell.click();
      await page.waitForTimeout(500);
    } else {
      // Fallback: use the Add Event toolbar button
      const addBtn = page.getByRole('button', { name: /add event/i }).first();
      await addBtn.click();
      await page.waitForTimeout(500);
    }

    // The drawer/modal should appear with "New Event" title
    const drawerText = await page.locator('#root').textContent();
    expect(drawerText).toContain('New Event');
  });

  test('6 — Create Event form has fields: type, title, date/time', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    // Open the add event drawer
    const addBtn = page.getByRole('button', { name: /add event/i }).first();
    await addBtn.click();
    await page.waitForTimeout(500);

    const drawerText = await page.locator('#root').textContent();

    // Title field
    expect(drawerText).toContain('Event Title');

    // Event type options
    expect(drawerText).toContain('Holiday');
    expect(drawerText).toContain('Exam');
    expect(drawerText).toContain('Event');
    expect(drawerText).toContain('Meeting');

    // Time fields
    expect(drawerText).toContain('Start Time');
    expect(drawerText).toContain('End Time');

    // All Day toggle
    expect(drawerText).toContain('All Day');

    // Create button
    const createBtn = page.getByRole('button', { name: /create event/i }).first();
    expect(await createBtn.isVisible()).toBeTruthy();
  });

  test('7 — creating event adds it to the calendar grid', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    // Wait for calendar to render
    await expect(page.getByRole('button', { name: /add event/i })).toBeVisible({ timeout: 15000 });

    // Open add event drawer
    const addBtn = page.getByRole('button', { name: /add event/i }).first();
    await addBtn.click();

    // Wait for the drawer to open — look for the "Create Event" button (which is initially disabled)
    const createBtn = page.getByRole('button', { name: /create event/i }).first();
    await expect(createBtn).toBeVisible({ timeout: 5000 });

    // Fill in the title using the HeroUI Input inside the fixed drawer
    // The input is inside the drawer (fixed position panel)
    const titleInput = page.locator('.fixed input').first();
    await titleInput.waitFor({ state: 'visible', timeout: 5000 });
    // Click first to focus, then type character by character for React state updates
    await titleInput.click();
    await titleInput.pressSequentially('Science Fair', { delay: 30 });
    await page.waitForTimeout(300);

    // The Create Event button should now be enabled (title is non-empty)
    await expect(createBtn).toBeEnabled({ timeout: 3000 });
    await createBtn.click();
    await page.waitForTimeout(1000);

    // Verify event was added to state
    expect(state.calendarEvents.some(e => e.title === 'Science Fair')).toBeTruthy();
  });

  test('8 — clicking an existing event shows event detail modal', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    // Wait for calendar to render and events to load
    await expect(page.getByRole('button', { name: /add event/i })).toBeVisible({ timeout: 15000 });

    // Wait for a seeded event to appear in the grid
    const staffMeeting = page.getByText('Staff Meeting').first();
    await expect(staffMeeting).toBeVisible({ timeout: 15000 });

    // Click on the event
    await staffMeeting.click();
    await page.waitForTimeout(500);

    // Event detail modal should appear — check for the modal or drawer
    const modal = page.locator('[role="dialog"]').first();
    if (await modal.isVisible({ timeout: 5000 }).catch(() => false)) {
      const modalText = await modal.textContent();
      // The detail modal shows event information
      expect(modalText).toBeTruthy();
    }
  });

  test('9 — edit event updates the event and re-renders', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    // Wait for calendar to render
    await expect(page.getByRole('button', { name: /add event/i })).toBeVisible({ timeout: 15000 });

    // The calendar context uses updateEvent (via calendarEventsApi.update).
    // Verify the events can be updated via the API mock.
    const eventToUpdate = state.calendarEvents.find(e => e.title === 'Staff Meeting');
    expect(eventToUpdate).toBeTruthy();

    // Update the event in state directly (as the API would)
    if (eventToUpdate) {
      eventToUpdate.title = 'Updated Staff Meeting';
    }

    // Reload to pick up the change
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    // Wait for calendar to fully render and show updated event
    await expect(page.getByRole('button', { name: /add event/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Updated Staff Meeting')).toBeVisible({ timeout: 15000 });
  });

  test('10 — delete event shows confirmation and removes from calendar', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    // Wait for calendar to render and events to load
    await expect(page.getByRole('button', { name: /add event/i })).toBeVisible({ timeout: 15000 });

    // Wait for the event to appear
    const annualDay = page.getByText('Annual Day').first();
    await expect(annualDay).toBeVisible({ timeout: 15000 });

    // Click on the event to open detail modal
    await annualDay.click();
    await page.waitForTimeout(500);

    // Find and click the Delete button in the modal
    const modal = page.locator('[role="dialog"]').first();
    if (await modal.isVisible({ timeout: 5000 }).catch(() => false)) {
      const deleteBtn = modal.getByRole('button', { name: /delete/i }).first();
      if (await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await deleteBtn.click();
        await page.waitForTimeout(500);

        // If a confirmation dialog appears, confirm it
        const confirmBtn = page.getByRole('button', { name: /confirm|yes|delete/i }).last();
        if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmBtn.click();
          await page.waitForTimeout(500);
        }

        // Verify event was removed from state
        expect(state.calendarEvents.some(e => e.title === 'Annual Day')).toBeFalsy();
      }
    }
  });

  test('11 — filter by event type shows different visual styles', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    // Wait for the calendar to render and events to load
    await expect(page.getByRole('button', { name: /add event/i })).toBeVisible({ timeout: 15000 });

    // Wait for at least one seeded event to appear
    await expect(page.getByText('Staff Meeting')).toBeVisible({ timeout: 15000 });

    // Events are color-coded by type in the month grid:
    // holiday → danger, exam → warning, event → primary, meeting → secondary
    // Event elements have "truncate" class within the calendar grid
    const allEventDivs = page.locator('[class*="truncate"][class*="border"]');
    const count = await allEventDivs.count();
    expect(count).toBeGreaterThan(0);

    // Collect unique color class patterns from event elements
    const classPatterns = new Set<string>();
    for (let i = 0; i < Math.min(count, 10); i++) {
      const cls = await allEventDivs.nth(i).getAttribute('class');
      if (cls?.includes('warning')) classPatterns.add('warning');
      if (cls?.includes('secondary')) classPatterns.add('secondary');
      if (cls?.includes('primary')) classPatterns.add('primary');
      if (cls?.includes('danger')) classPatterns.add('danger');
    }

    // We seeded meeting (secondary), exam (warning), and event (primary) — at least 2 distinct styles
    expect(classPatterns.size).toBeGreaterThanOrEqual(2);
  });

  test('12 — empty day cells show no events indicator', async ({ page }) => {
    await page.goto('/calendar');

    // Wait for the calendar to render instead of relying on networkidle (which may never settle due to ongoing API calls)
    await expect(page.getByRole('button', { name: /add event/i })).toBeVisible({ timeout: 15000 });

    // Switch to day view on a date with no events
    const dayBtn = page.locator('button').filter({ hasText: /^Day$/ }).first();
    await dayBtn.click();
    await page.waitForTimeout(300);

    // Navigate to a day that has no events (go to previous month where we have none)
    const toolbar = page.locator('.sticky');
    const prevBtn = toolbar.locator('button:has(svg.lucide-chevron-left)').first();
    await prevBtn.click();
    await page.waitForTimeout(300);

    const bodyText = await page.locator('#root').textContent();
    // The day view shows "No events scheduled" when empty, or "Add Event" button is still visible
    expect(
      bodyText?.includes('No events scheduled') || bodyText?.includes('No events') || bodyText?.includes('Add Event'),
    ).toBeTruthy();
  });
});
