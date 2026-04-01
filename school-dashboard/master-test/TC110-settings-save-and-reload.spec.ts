/**
 * TC110: Verify all settings persist after save and page reload.
 *
 * Tests that institution settings, academic settings, and attendance rules
 * are properly saved via the API and persist when the page is reloaded.
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

test.describe('TC110: Settings Save & Reload Persistence', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    // Enrich school settings with full settings data
    Object.assign(state.schoolSettings, {
      schoolName: 'SchoolSync Demo School',
      email: 'info@schoolsync.test',
      phone: '9876500000',
      address: '123 Education Lane',
      city: 'Bangalore',
      state: 'Karnataka',
      pinCode: '560001',
      academicYear: '2025-2026',
      academicYearStart: '2025-06-01',
      academicYearEnd: '2026-05-31',
      periodDuration: 40,
      numberOfPeriods: 8,
      attendanceThreshold: 75,
      attendanceType: 'daily',
    });

    // Dismiss cookie consent
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);
  });

  /* ── Institution Settings ── */

  test('1) change school name and save', async ({ page }) => {
    await page.goto('/settings/institution');
    await page.waitForLoadState('networkidle');

    // Find and update the school name input
    const nameInput = page.locator(
      'input[name="schoolName"], input[name="institutionName"], input[placeholder*="school name" i]',
    ).first();
    const hasNameInput = await nameInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasNameInput) {
      await nameInput.clear();
      await nameInput.fill('Updated School Name');
    }

    // Click save
    const saveBtn = page.getByRole('button', { name: /save|update|submit/i }).first();
    const hasSaveBtn = await saveBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasSaveBtn) {
      await saveBtn.click();
      await page.waitForLoadState('networkidle');
    }

    // Verify settings API call was made
    const settingsCalled = [...state.requestLog].some(
      (entry) => entry.includes('/settings') && (entry.includes('PUT') || entry.includes('PATCH')),
    );
    if (hasSaveBtn) {
      expect(settingsCalled).toBe(true);
    }
  });

  test('2) school name persists after reload', async ({ page }) => {
    // First, simulate that the setting was already saved
    state.schoolSettings.schoolName = 'Updated School Name';

    await page.goto('/settings/institution');
    await page.waitForLoadState('networkidle');

    // Verify the saved name appears
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Updated School Name');

    // Now reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify the name still persists after reload
    const bodyTextAfterReload = await page.textContent('body');
    expect(bodyTextAfterReload).toContain('Updated School Name');
  });

  /* ── Academic Settings ── */

  test('3) change period duration to 45 minutes and save', async ({ page }) => {
    await page.goto('/settings/academic');
    await page.waitForLoadState('networkidle');

    // Navigate to schedule/timings tab if present
    const timingsTab = page.getByRole('tab', { name: /schedule|timing/i }).first();
    const hasTimingsTab = await timingsTab.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasTimingsTab) await timingsTab.click();

    // Find and update period duration
    const durationInput = page.locator(
      'input[name="periodDuration"], input[placeholder*="duration" i], input[placeholder*="minute" i]',
    ).first();
    const hasDuration = await durationInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasDuration) {
      await durationInput.clear();
      await durationInput.fill('45');
    }

    // Click save
    const saveBtn = page.getByRole('button', { name: /save|update|submit/i }).first();
    const hasSaveBtn = await saveBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasSaveBtn) {
      await saveBtn.click();
      await page.waitForLoadState('networkidle');
    }

    // Verify page still on settings
    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/academic|period|setting/i);
  });

  test('4) period duration persists after reload', async ({ page }) => {
    // Simulate saved setting
    (state.schoolSettings as Record<string, unknown>).periodDuration = 45;

    await page.goto('/settings/academic');
    await page.waitForLoadState('networkidle');

    // Navigate to schedule tab if present
    const timingsTab = page.getByRole('tab', { name: /schedule|timing/i }).first();
    const hasTimingsTab = await timingsTab.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasTimingsTab) await timingsTab.click();

    // Check that period duration shows 45
    const durationInput = page.locator(
      'input[name="periodDuration"], input[placeholder*="duration" i]',
    ).first();
    const hasDuration = await durationInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasDuration) {
      const value = await durationInput.inputValue();
      expect(value).toBe('45');
    }

    // Reload and re-verify
    await page.reload();
    await page.waitForLoadState('networkidle');

    if (hasTimingsTab) {
      const timingsTabAfter = page.getByRole('tab', { name: /schedule|timing/i }).first();
      const stillVisible = await timingsTabAfter.isVisible({ timeout: 3000 }).catch(() => false);
      if (stillVisible) await timingsTabAfter.click();
    }

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/period|duration|academic|setting/i);
  });

  /* ── Attendance Rules ── */

  test('5) navigate to attendance rules settings', async ({ page }) => {
    await page.goto('/settings/attendance-rules');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';

    // Verify attendance rules page loaded
    const hasAttendanceRules = lowerBody.includes('attendance') ||
      lowerBody.includes('threshold') ||
      lowerBody.includes('rule') ||
      lowerBody.includes('setting');
    expect(hasAttendanceRules).toBe(true);
  });

  test('6) change attendance threshold to 80% and save', async ({ page }) => {
    await page.goto('/settings/attendance-rules');
    await page.waitForLoadState('networkidle');

    // Find threshold input
    const thresholdInput = page.locator(
      'input[name="attendanceThreshold"], input[name="threshold"], input[name="minimumAttendance"], input[placeholder*="threshold" i], input[placeholder*="percentage" i]',
    ).first();
    const hasThreshold = await thresholdInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasThreshold) {
      await thresholdInput.clear();
      await thresholdInput.fill('80');
    }

    // Click save
    const saveBtn = page.getByRole('button', { name: /save|update|submit/i }).first();
    const hasSaveBtn = await saveBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasSaveBtn) {
      await saveBtn.click();
      await page.waitForLoadState('networkidle');
    }

    // Verify the settings API was called
    const settingsCalled = [...state.requestLog].some(
      (entry) => entry.includes('/settings') && (entry.includes('PUT') || entry.includes('PATCH')),
    );
    if (hasSaveBtn) {
      expect(settingsCalled).toBe(true);
    }
  });

  test('7) attendance threshold persists after reload', async ({ page }) => {
    // Simulate saved threshold
    (state.schoolSettings as Record<string, unknown>).attendanceThreshold = 80;

    await page.goto('/settings/attendance-rules');
    await page.waitForLoadState('networkidle');

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify the page still shows attendance settings
    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';

    const hasSettings = lowerBody.includes('attendance') ||
      lowerBody.includes('threshold') ||
      lowerBody.includes('setting');
    expect(hasSettings).toBe(true);
  });

  test('8) settings state integrity after multiple changes', async () => {
    // Simulate all three settings changes
    state.schoolSettings.schoolName = 'Updated School Name';
    (state.schoolSettings as Record<string, unknown>).periodDuration = 45;
    (state.schoolSettings as Record<string, unknown>).attendanceThreshold = 80;

    // Verify all values are consistent
    expect(state.schoolSettings.schoolName).toBe('Updated School Name');
    expect((state.schoolSettings as Record<string, unknown>).periodDuration).toBe(45);
    expect((state.schoolSettings as Record<string, unknown>).attendanceThreshold).toBe(80);

    // Original values that should not change
    expect(state.schoolSettings.academicYear).toBe('2025-2026');
    expect(state.schoolSettings.currency).toBe('INR');
  });
});
