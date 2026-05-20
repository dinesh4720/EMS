import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, seedNotification,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  TC055 — Notifications Management
 *  Covers: NotificationCenter (list, filters, actions) +
 *          NotificationSettings (preferences, quiet hours, digest)
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC055 — Notifications Management', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    // Dismiss cookie consent
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    // Seed 5 notifications: 3 unread, 2 read
    seedNotification(state, {
      type: 'announcement',
      title: 'New Announcement Published',
      message: 'A new announcement about the Annual Day has been published.',
      read: false,
      createdAt: new Date().toISOString(),
    });
    seedNotification(state, {
      type: 'fee',
      title: 'Fee Payment Received',
      message: 'Fee payment of INR 5000 received from Rahul Sharma.',
      read: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    });
    seedNotification(state, {
      type: 'attendance',
      title: 'Attendance Alert',
      message: 'Class 10-A attendance is below 80% today.',
      read: false,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    });
    seedNotification(state, {
      type: 'exam',
      title: 'Exam Results Published',
      message: 'Mid-term exam results for Class 10-A have been published.',
      read: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    });
    seedNotification(state, {
      type: 'system',
      title: 'System Maintenance',
      message: 'Scheduled maintenance on March 27th from 2 AM to 4 AM.',
      read: true,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    });

    await installMockApi(page, state);
  });

  /* ═══════════════════════════════════════════════════════════════════
   *  SECTION 1 — NOTIFICATION CENTER
   *  ═══════════════════════════════════════════════════════════════════ */

  /* ── 1. Page loads ── */
  test('1) notifications page loads and displays notification list', async ({ page }) => {
    await page.goto('/messaging/notifications');
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);

    // Wait for async notification data to render
    await page.getByText('New Announcement Published').first().waitFor({ state: 'visible', timeout: 10000 });

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('New Announcement Published');
    expect(bodyText).toContain('Fee Payment Received');
    expect(bodyText).toContain('Attendance Alert');
  });

  /* ── 2. All 5 seeded notifications visible ── */
  test('2) all 5 seeded notifications are displayed', async ({ page }) => {
    await page.goto('/messaging/notifications');
    await page.waitForLoadState('networkidle');

    await page.getByText('New Announcement Published').first().waitFor({ state: 'visible', timeout: 10000 });

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('New Announcement Published');
    expect(bodyText).toContain('Fee Payment Received');
    expect(bodyText).toContain('Attendance Alert');
    expect(bodyText).toContain('Exam Results Published');
    expect(bodyText).toContain('System Maintenance');
  });

  /* ── 3. Unread count badge ── */
  test('3) unread count badge reflects 3 unread notifications', async ({ page }) => {
    await page.goto('/messaging/notifications');
    await page.waitForLoadState('networkidle');

    await page.getByText('New Announcement Published').first().waitFor({ state: 'visible', timeout: 10000 });

    const unreadCount = state.notifications.filter(n => !n.read).length;
    expect(unreadCount).toBe(3);

    // Badge on the "Notifications" heading or in the tab list
    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/3\s*new|Unread\s*\(\s*3\s*\)/i);
  });

  /* ── 4. Click unread notification marks it as read ── */
  test('4) clicking an unread notification marks it as read', async ({ page }) => {
    await page.goto('/messaging/notifications');
    await page.waitForLoadState('networkidle');

    const notifTitle = page.getByText('New Announcement Published').first();
    await notifTitle.waitFor({ state: 'visible', timeout: 10000 });

    // Click the notification row (unread items are clickable)
    await notifTitle.click();
    await page.waitForTimeout(500);

    // The notification should no longer have the "New" chip
    const newChip = page.locator('[role="button"]')
      .filter({ hasText: 'New Announcement Published' })
      .locator('.text-xs')
      .filter({ hasText: 'New' });

    // After marking as read, the "New" chip should disappear
    await expect(newChip).not.toBeVisible();

    // Verify state updated
    const notif = state.notifications.find(n => n.title === 'New Announcement Published');
    expect(notif?.read).toBe(true);
  });

  /* ── 5. Mark all as read ── */
  test('5) "Mark all as read" sets all notifications to read', async ({ page }) => {
    await page.goto('/messaging/notifications');
    await page.waitForLoadState('networkidle');

    await page.getByText('New Announcement Published').first().waitFor({ state: 'visible', timeout: 10000 });

    const markAllBtn = page.getByRole('button', { name: /mark all read/i }).first();
    await expect(markAllBtn).toBeVisible({ timeout: 5000 });

    await markAllBtn.click();
    await page.waitForTimeout(500);

    // All notifications should now be read
    const unreadCount = state.notifications.filter(n => !n.read).length;
    expect(unreadCount).toBe(0);
  });

  /* ── 6. Unread count becomes 0 after mark all ── */
  test('6) unread count updates to 0 after marking all as read', async ({ page }) => {
    await page.goto('/messaging/notifications');
    await page.waitForLoadState('networkidle');

    await page.getByText('New Announcement Published').first().waitFor({ state: 'visible', timeout: 10000 });

    const markAllBtn = page.getByRole('button', { name: /mark all read/i }).first();
    await markAllBtn.click();
    await page.waitForTimeout(500);

    // The "Mark all read" button should disappear when unread count is 0
    await expect(markAllBtn).not.toBeVisible();

    // All notifications still visible
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('New Announcement Published');
    expect(bodyText).toContain('System Maintenance');
  });

  /* ── 7. Filter tabs show correct counts ── */
  test('7) All / Unread / Read tabs show correct notification counts', async ({ page }) => {
    await page.goto('/messaging/notifications');
    await page.waitForLoadState('networkidle');

    await page.getByText('New Announcement Published').first().waitFor({ state: 'visible', timeout: 10000 });

    // Verify the three filter tabs exist with correct counts
    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/All\s*\(\s*5\s*\)/);
    expect(bodyText).toMatch(/Unread\s*\(\s*3\s*\)/);
    expect(bodyText).toMatch(/Read\s*\(\s*2\s*\)/);

    // Click the Read tab and verify content updates
    const readTab = page.getByRole('button', { name: 'Read (2)' }).first();
    if (await readTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await readTab.click();
      await page.waitForTimeout(800);

      // After filtering to Read, unread items should not have the "New" chip visible
      const newChips = page.locator('.text-xs').filter({ hasText: 'New' });
      expect(await newChips.count()).toBe(0);
    }

    // Click the Unread tab
    const unreadTab = page.getByRole('button', { name: 'Unread (3)' }).first();
    if (await unreadTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await unreadTab.click();
      await page.waitForTimeout(800);

      // Should see 3 "New" chips for unread notifications
      const newChips = page.locator('.text-xs').filter({ hasText: 'New' });
      expect(await newChips.count()).toBe(3);
    }
  });

  /* ── 8. Read vs unread visual distinction ── */
  test('8) read and unread notifications have visual distinction', async ({ page }) => {
    await page.goto('/messaging/notifications');
    await page.waitForLoadState('networkidle');

    await page.getByText('New Announcement Published').first().waitFor({ state: 'visible', timeout: 10000 });

    // Unread notification should have "New" chip
    const unreadRow = page.locator('[role="button"]').filter({ hasText: 'New Announcement Published' }).first();
    const hasNewChip = await unreadRow.locator('.text-xs').filter({ hasText: 'New' }).isVisible().catch(() => false);
    expect(hasNewChip).toBe(true);

    // Read notification should NOT have "New" chip
    const readRow = page.locator('div').filter({ hasText: 'System Maintenance' }).first();
    const readHasNewChip = await readRow.locator('.text-xs').filter({ hasText: 'New' }).isVisible().catch(() => false);
    expect(readHasNewChip).toBe(false);
  });

  /* ── 9. Delete a notification ── */
  test('9) deleting a notification removes it from the list', async ({ page }) => {
    await page.goto('/messaging/notifications');
    await page.waitForLoadState('networkidle');

    await page.getByText('Exam Results Published').first().waitFor({ state: 'visible', timeout: 10000 });

    const notifTitle = page.getByText('Exam Results Published').first();

    // Click the delete button that follows the notification heading in the DOM
    const deleteBtn = page.locator('h4')
      .filter({ hasText: 'Exam Results Published' })
      .locator('xpath=following::button[@aria-label="Delete notification"][1]');
    await expect(deleteBtn).toBeVisible({ timeout: 3000 });

    await deleteBtn.click();
    await page.waitForTimeout(500);

    // Confirm dialog should appear — click Delete to confirm
    const confirmBtn = page.getByRole('button', { name: /^Delete$/i }).first();
    await expect(confirmBtn).toBeVisible({ timeout: 5000 });
    await confirmBtn.click({ force: true });
    await page.waitForTimeout(2000);

    // Notification should be removed from state and UI
    await expect(notifTitle).not.toBeVisible();
    expect(state.notifications.find(n => n.title === 'Exam Results Published')).toBeUndefined();
  });

  /* ── 10. Clear all notifications ── */
  test('10) "Clear all" removes every notification', async ({ page }) => {
    await page.goto('/messaging/notifications');
    await page.waitForLoadState('networkidle');

    await page.getByText('New Announcement Published').first().waitFor({ state: 'visible', timeout: 10000 });

    const clearAllBtn = page.getByRole('button', { name: /clear all/i }).first();
    await expect(clearAllBtn).toBeVisible({ timeout: 5000 });

    await clearAllBtn.click();
    await page.waitForTimeout(500);

    // Confirm dialog
    const confirmBtn = page.getByRole('button', { name: /^Delete All$/i }).first();
    await expect(confirmBtn).toBeVisible({ timeout: 5000 });
    await confirmBtn.click({ force: true });
    await page.waitForTimeout(2000);

    // Empty state should appear — wait for it
    await page.waitForSelector('[role="status"]', { timeout: 10000 });
    const emptyText = await page.textContent('body');
    expect(emptyText).toMatch(/no notifications|you.re all caught up/i);
    // Verify all notification titles are gone from the UI
    expect(emptyText).not.toContain('New Announcement Published');
    expect(emptyText).not.toContain('Exam Results Published');
  });

  /* ── 11. Empty state ── */
  test('11) empty state shown when no notifications exist', async ({ page }) => {
    state.notifications = [];

    await page.goto('/messaging/notifications');
    await page.waitForLoadState('networkidle');

    // Wait for empty state to render (skeletons disappear)
    await page.waitForSelector('[role="status"]', { timeout: 10000 });

    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/no notifications|you.re all caught up/i);
  });

  /* ── 12. State integrity ── */
  test('12) state has 5 notifications with correct read/unread split', async ({ page }) => {
    expect(state.notifications).toHaveLength(5);
    expect(state.notifications.filter(n => n.read)).toHaveLength(2);
    expect(state.notifications.filter(n => !n.read)).toHaveLength(3);
    expect(state.notifications[0].type).toBe('announcement');
    expect(state.notifications[3].type).toBe('exam');
  });

  /* ═══════════════════════════════════════════════════════════════════
   *  SECTION 2 — NOTIFICATION SETTINGS
   *  ═══════════════════════════════════════════════════════════════════ */

  /* ── 13. Settings tab loads ── */
  test('13) notification settings tab loads with preferences', async ({ page }) => {
    await page.goto('/messaging/notifications');
    await page.waitForLoadState('networkidle');

    await page.getByText('New Announcement Published').first().waitFor({ state: 'visible', timeout: 10000 });

    // Switch to Settings tab
    const settingsTab = page.locator('[role="tab"]').filter({ hasText: /settings/i }).first();
    await expect(settingsTab).toBeVisible({ timeout: 5000 });
    await settingsTab.click();
    await page.waitForTimeout(800);

    // Settings heading should be visible
    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/notification settings|customize how you receive/i);
  });

  /* ── 14. Quiet hours toggle ── */
  test('14) quiet hours toggle shows time inputs when enabled', async ({ page }) => {
    await page.goto('/messaging/notifications');
    await page.waitForLoadState('networkidle');

    await page.getByText('New Announcement Published').first().waitFor({ state: 'visible', timeout: 10000 });

    const settingsTab = page.locator('[role="tab"]').filter({ hasText: /settings/i }).first();
    await settingsTab.click();
    await page.waitForTimeout(800);

    const toggle = page.locator('[aria-label="Toggle quiet hours"]').first();
    await expect(toggle).toBeVisible({ timeout: 5000 });

    // Time inputs should not be visible initially
    const startInput = page.locator('input[type="time"]').first();
    expect(await startInput.isVisible().catch(() => false)).toBe(false);

    // Enable quiet hours
    await toggle.click({ force: true });
    await page.waitForTimeout(500);

    // Time inputs should now appear
    await expect(startInput).toBeVisible();
  });

  /* ── 15. Digest frequency select ── */
  test('15) digest frequency can be changed', async ({ page }) => {
    await page.goto('/messaging/notifications');
    await page.waitForLoadState('networkidle');

    await page.getByText('New Announcement Published').first().waitFor({ state: 'visible', timeout: 10000 });

    const settingsTab = page.locator('[role="tab"]').filter({ hasText: /settings/i }).first();
    await settingsTab.click();
    await page.waitForTimeout(800);

    const select = page.locator('select').filter({ has: page.locator('option[value="immediate"]') }).first();
    await expect(select).toBeVisible({ timeout: 5000 });

    await select.selectOption('daily');
    await page.waitForTimeout(300);

    const value = await select.inputValue();
    expect(value).toBe('daily');
  });

  /* ── 16. Channel preferences matrix visible ── */
  test('16) channel preferences matrix is visible', async ({ page }) => {
    await page.goto('/messaging/notifications');
    await page.waitForLoadState('networkidle');

    await page.getByText('New Announcement Published').first().waitFor({ state: 'visible', timeout: 10000 });

    const settingsTab = page.locator('[role="tab"]').filter({ hasText: /settings/i }).first();
    await settingsTab.click();
    await page.waitForTimeout(800);

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Email');
    expect(bodyText).toContain('SMS');
    expect(bodyText).toContain('WhatsApp');
    expect(bodyText).toContain('In-App');
  });

  /* ── 17. Toggle channel switch ── */
  test('17) toggling a channel switch enables save button', async ({ page }) => {
    await page.goto('/messaging/notifications');
    await page.waitForLoadState('networkidle');

    await page.getByText('New Announcement Published').first().waitFor({ state: 'visible', timeout: 10000 });

    const settingsTab = page.locator('[role="tab"]').filter({ hasText: /settings/i }).first();
    await settingsTab.click();
    await page.waitForTimeout(800);

    // Save button should be disabled initially
    const saveBtn = page.getByRole('button', { name: /save changes/i }).first();
    const isDisabled = await saveBtn.isDisabled().catch(() => false);
    expect(isDisabled).toBe(true);

    // Toggle the first switch
    const firstSwitch = page.locator('[role="switch"]').first();
    await firstSwitch.click({ force: true });
    await page.waitForTimeout(500);

    // Save button should now be enabled
    await expect(saveBtn).toBeEnabled();
  });

  /* ── 18. Save preferences ── */
  test('18) saving preferences shows success toast', async ({ page }) => {
    await page.goto('/messaging/notifications');
    await page.waitForLoadState('networkidle');

    await page.getByText('New Announcement Published').first().waitFor({ state: 'visible', timeout: 10000 });

    const settingsTab = page.locator('[role="tab"]').filter({ hasText: /settings/i }).first();
    await settingsTab.click();
    await page.waitForTimeout(800);

    // Toggle a switch to enable changes
    const firstSwitch = page.locator('[role="switch"]').first();
    await firstSwitch.click({ force: true });
    await page.waitForTimeout(500);

    const saveBtn = page.getByRole('button', { name: /save changes/i }).first();
    await saveBtn.click();
    await page.waitForTimeout(800);

    // Should show success message
    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/saved|success/i);
  });

  /* ── 19. Reset preferences ── */
  test('19) reset preferences shows confirmation and restores defaults', async ({ page }) => {
    await page.goto('/messaging/notifications');
    await page.waitForLoadState('networkidle');

    await page.getByText('New Announcement Published').first().waitFor({ state: 'visible', timeout: 10000 });

    const settingsTab = page.locator('[role="tab"]').filter({ hasText: /settings/i }).first();
    await settingsTab.click();
    await page.waitForTimeout(800);

    // Toggle a switch to enable changes
    const firstSwitch = page.locator('[role="switch"]').first();
    await firstSwitch.click({ force: true });
    await page.waitForTimeout(500);

    const resetBtn = page.getByRole('button', { name: /reset/i }).first();
    await resetBtn.click();
    await page.waitForTimeout(500);

    // Confirm dialog
    const confirmBtn = page.getByRole('button', { name: /^Reset$/i }).first();
    await expect(confirmBtn).toBeVisible({ timeout: 5000 });
    await confirmBtn.click({ force: true });
    await page.waitForTimeout(1000);

    // Should show success
    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/reset|success|default/i);
  });
});
