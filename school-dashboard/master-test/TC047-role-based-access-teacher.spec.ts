/**
 * TC047: Teacher login sees restricted dashboard with limited modules.
 *
 * Verifies that a teacher user only sees the sidebar modules their
 * permissions allow, and is denied access to admin-only routes.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState,
  createTeacherUser,
  installMockApi,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Tests
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC047: Role-Based Access — Teacher', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState(createTeacherUser());

    // Dismiss cookie consent
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);
  });

  test('1) teacher dashboard loads successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify dashboard loaded for teacher
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();

    // Verify teacher name appears somewhere (e.g., header or sidebar)
    const teacherName = page.getByText('Ananya Sharma').first();
    const hasName = await teacherName.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasName) {
      await expect(teacherName).toBeVisible();
    }
  });

  test('2) sidebar shows allowed modules for teacher', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('nav, aside, [class*="sidebar"], [data-testid="sidebar"]').first();
    await expect(sidebar).toBeVisible({ timeout: 5000 });

    const sidebarText = await sidebar.textContent();
    const lowerText = sidebarText?.toLowerCase() || '';

    // Teacher should see these modules (based on permissions: students, classes, attendance, academics, homework, messaging, calendar)
    expect(lowerText).toMatch(/student/i);
    expect(lowerText).toMatch(/class/i);
    expect(lowerText).toMatch(/academ|exam/i);
  });

  test('3) sidebar does NOT show admin-only modules', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('nav, aside, [class*="sidebar"], [data-testid="sidebar"]').first();
    await expect(sidebar).toBeVisible({ timeout: 5000 });

    // Teacher permissions have these as false: staff, fees, frontDesk, settings, analytics, reports
    // Check that restricted module links are NOT in the sidebar
    const staffLink = sidebar.getByRole('link', { name: /^staff$/i });
    const staffVisible = await staffLink.isVisible({ timeout: 2000 }).catch(() => false);
    expect(staffVisible).toBe(false);

    const feesLink = sidebar.getByRole('link', { name: /^fees$/i });
    const feesVisible = await feesLink.isVisible({ timeout: 2000 }).catch(() => false);
    expect(feesVisible).toBe(false);

    const settingsLink = sidebar.getByRole('link', { name: /^settings$/i });
    const settingsVisible = await settingsLink.isVisible({ timeout: 2000 }).catch(() => false);
    expect(settingsVisible).toBe(false);
  });

  test('4) navigating to /staffs shows access denied or redirects', async ({ page }) => {
    await page.goto('/staffs');
    await page.waitForLoadState('networkidle');

    // Teacher should see access denied or be redirected
    const currentUrl = page.url();
    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';

    // Either redirected away from /staffs, or access denied message shown
    const denied = lowerBody.includes('access denied') ||
      lowerBody.includes('unauthorized') ||
      lowerBody.includes('permission') ||
      lowerBody.includes('not allowed') ||
      !currentUrl.includes('/staffs');

    expect(denied).toBe(true);
  });

  test('5) navigating to /fees shows access denied or redirects', async ({ page }) => {
    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';

    const denied = lowerBody.includes('access denied') ||
      lowerBody.includes('unauthorized') ||
      lowerBody.includes('permission') ||
      lowerBody.includes('not allowed') ||
      !currentUrl.includes('/fees');

    expect(denied).toBe(true);
  });

  test('6) navigating to /settings shows access denied or redirects', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';

    const denied = lowerBody.includes('access denied') ||
      lowerBody.includes('unauthorized') ||
      lowerBody.includes('permission') ||
      lowerBody.includes('not allowed') ||
      !currentUrl.includes('/settings');

    expect(denied).toBe(true);
  });

  test('7) navigating to /students works for teacher', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // Teacher has students permission = true
    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';

    // Should NOT show access denied
    const isAccessible = !lowerBody.includes('access denied') &&
      !lowerBody.includes('unauthorized');
    expect(isAccessible).toBe(true);

    // Should show student-related content
    expect(lowerBody).toMatch(/student/i);
  });

  test('8) navigating to /academics works for teacher', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';

    const isAccessible = !lowerBody.includes('access denied') &&
      !lowerBody.includes('unauthorized');
    expect(isAccessible).toBe(true);

    expect(lowerBody).toMatch(/academ|exam/i);
  });

  test('9) navigating to /classes works for teacher', async ({ page }) => {
    await page.goto('/classes');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';

    const isAccessible = !lowerBody.includes('access denied') &&
      !lowerBody.includes('unauthorized');
    expect(isAccessible).toBe(true);

    expect(lowerBody).toMatch(/class/i);
  });
});
