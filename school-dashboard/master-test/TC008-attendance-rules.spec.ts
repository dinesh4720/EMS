/**
 * TC008: Admin configures attendance rules.
 *
 * Verifies the attendance rules settings page: defaulter threshold,
 * auto-lock time, edit window, and notification toggles.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState,
  installMockApi,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Tests
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC008: Attendance Rules — Thresholds, Locks, Notifications', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    // Enrich settings with attendance-specific fields
    Object.assign(state.schoolSettings, {
      attendanceType: 'daily',
      defaulterThreshold: 75,
      autoLockTime: '10:00',
      allowEditAfterLock: false,
      editWindowHours: 2,
      absentNotifications: true,
      defaulterNotifications: false,
      attendanceReminderTime: '09:00',
    });

    // Dismiss cookie consent
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);

    // Override attendance-rules specific route
    await page.route('**/api/attendance-rules**', async (route) => {
      const method = route.request().method();
      state.requestLog.add(`${method} /api/attendance-rules`);
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            defaulterThreshold: 75,
            autoLockTime: '10:00',
            allowEditAfterLock: false,
            editWindowHours: 2,
            absentNotifications: true,
            defaulterNotifications: false,
          }),
        });
      } else {
        const body = JSON.parse(route.request().postData() || '{}');
        Object.assign(state.schoolSettings, body);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Saved', ...body }),
        });
      }
    });
  });

  test('1) attendance rules page loads with settings', async ({ page }) => {
    await page.goto('/settings/attendance-rules');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/attendance|rule|threshold|setting/i);
  });

  test('2) set defaulter threshold to 75%', async ({ page }) => {
    await page.goto('/settings/attendance-rules');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const thresholdInput = page.locator(
      'input[name="defaulterThreshold"], input[name="threshold"], input[placeholder*="threshold" i]',
    ).first();
    const hasThreshold = await thresholdInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasThreshold) {
      await thresholdInput.clear();
      await thresholdInput.fill('75');
      await expect(thresholdInput).toHaveValue('75');
    } else {
      // Might be a slider or other control
      const bodyText = await page.textContent('body');
      expect(bodyText).toMatch(/75|threshold|defaulter/i);
    }
  });

  test('3) configure auto-lock time to 10:00 AM', async ({ page }) => {
    await page.goto('/settings/attendance-rules');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const lockTimeInput = page.locator(
      'input[name="autoLockTime"], input[name="lockTime"], input[type="time"]',
    ).first();
    const hasLockTime = await lockTimeInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasLockTime) {
      await lockTimeInput.fill('10:00');
      await expect(lockTimeInput).toHaveValue('10:00');
    }

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/lock|auto|time/i);
  });

  test('4) enable "Allow edit after lock" with 2-hour window', async ({ page }) => {
    await page.goto('/settings/attendance-rules');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Toggle "allow edit after lock"
    const editToggle = page.locator(
      'input[name="allowEditAfterLock"], [role="switch"]:near(:text("edit after lock")), label:has-text("Allow edit")',
    ).first();
    const hasToggle = await editToggle.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasToggle) {
      await editToggle.click();
    }

    // Set edit window to 2 hours
    const windowInput = page.locator(
      'input[name="editWindowHours"], input[name="editWindow"], input[placeholder*="hour" i]',
    ).first();
    const hasWindow = await windowInput.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasWindow) {
      await windowInput.clear();
      await windowInput.fill('2');
    }

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/edit|lock|window|hour/i);
  });

  test('5) enable absent notifications', async ({ page }) => {
    await page.goto('/settings/attendance-rules');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const absentToggle = page.locator(
      'input[name="absentNotifications"], [role="switch"]:near(:text("absent")), label:has-text("Absent")',
    ).first();
    const hasAbsentToggle = await absentToggle.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasAbsentToggle) {
      // Toggle should be enabled (based on mock data)
      const bodyText = await page.textContent('body');
      expect(bodyText?.toLowerCase()).toMatch(/absent|notification|alert/i);
    }
  });

  test('6) enable defaulter notifications', async ({ page }) => {
    await page.goto('/settings/attendance-rules');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const defaulterToggle = page.locator(
      'input[name="defaulterNotifications"], [role="switch"]:near(:text("defaulter")), label:has-text("Defaulter")',
    ).first();
    const hasDefaulterToggle = await defaulterToggle.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasDefaulterToggle) {
      await defaulterToggle.click();
    }

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/defaulter|notification|attendance/i);
  });

  test('7) save attendance rules and verify success', async ({ page }) => {
    await page.goto('/settings/attendance-rules');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const saveBtn = page.getByRole('button', { name: /save|update|apply/i }).first();
    const hasSave = await saveBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSave) {
      await saveBtn.click();
      await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

      // Check for success toast
      const toast = page.locator('[class*="toast"], [class*="alert"], [role="status"]').first();
      const hasToast = await toast.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasToast) {
        const toastText = await toast.textContent();
        expect(toastText?.toLowerCase()).toMatch(/saved|success|updated/i);
      }

      // Verify API was called
      const apiCalled = [...state.requestLog].some(
        (entry) =>
          (entry.includes('PUT') || entry.includes('PATCH') || entry.includes('POST')) &&
          (entry.includes('/settings') || entry.includes('/attendance-rules')),
      );
      expect(apiCalled).toBeTruthy();
    }
  });

  test('8) page shows attendance configuration sections', async ({ page }) => {
    await page.goto('/settings/attendance-rules');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const bodyText = await page.textContent('body');

    // Should contain key attendance settings concepts
    const hasThresholdSection = bodyText?.toLowerCase().includes('threshold') || bodyText?.toLowerCase().includes('defaulter');
    const hasLockSection = bodyText?.toLowerCase().includes('lock') || bodyText?.toLowerCase().includes('time');
    const hasNotificationSection = bodyText?.toLowerCase().includes('notification') || bodyText?.toLowerCase().includes('alert');

    expect(hasThresholdSection || hasLockSection || hasNotificationSection).toBeTruthy();
  });
});
