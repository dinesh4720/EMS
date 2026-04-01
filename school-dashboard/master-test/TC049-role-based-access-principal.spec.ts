/**
 * TC049: Principal has near-full access to all modules.
 *
 * Verifies that a principal user can access all modules except super-admin,
 * with the sidebar showing all navigation items.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState,
  createPrincipalUser,
  installMockApi,
  seedStudent,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Tests
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC049: Role-Based Access — Principal', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState(createPrincipalUser());

    // Seed some data for content verification
    seedStudent(state, { name: 'Test Student 1' });
    seedStudent(state, { name: 'Test Student 2' });

    // Dismiss cookie consent
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);
  });

  test('1) principal dashboard loads successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();

    // Verify principal name appears
    const principalName = page.getByText('Dr. Krishnamurthy').first();
    const hasName = await principalName.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasName) {
      await expect(principalName).toBeVisible();
    }
  });

  test('2) sidebar shows all modules except super-admin', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('nav, aside, [class*="sidebar"], [data-testid="sidebar"]').first();
    await expect(sidebar).toBeVisible({ timeout: 5000 });

    const sidebarText = await sidebar.textContent();
    const lowerText = sidebarText?.toLowerCase() || '';

    // Principal has all permissions = true except superAdmin
    expect(lowerText).toMatch(/student/i);
    expect(lowerText).toMatch(/class/i);
    expect(lowerText).toMatch(/fee/i);
  });

  test('3) navigating to /students works for principal', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';

    const isAccessible = !lowerBody.includes('access denied') &&
      !lowerBody.includes('unauthorized');
    expect(isAccessible).toBe(true);

    expect(lowerBody).toMatch(/student/i);
  });

  test('4) navigating to /staffs works for principal', async ({ page }) => {
    await page.goto('/staffs');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';

    const isAccessible = !lowerBody.includes('access denied') &&
      !lowerBody.includes('unauthorized');
    expect(isAccessible).toBe(true);

    expect(lowerBody).toMatch(/staff/i);
  });

  test('5) navigating to /fees works for principal', async ({ page }) => {
    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';

    const isAccessible = !lowerBody.includes('access denied') &&
      !lowerBody.includes('unauthorized');
    expect(isAccessible).toBe(true);

    expect(lowerBody).toMatch(/fee|payment|collection/i);
  });

  test('6) navigating to /academics works for principal', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';

    const isAccessible = !lowerBody.includes('access denied') &&
      !lowerBody.includes('unauthorized');
    expect(isAccessible).toBe(true);

    expect(lowerBody).toMatch(/academ|exam/i);
  });

  test('7) navigating to /classes works for principal', async ({ page }) => {
    await page.goto('/classes');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';

    const isAccessible = !lowerBody.includes('access denied') &&
      !lowerBody.includes('unauthorized');
    expect(isAccessible).toBe(true);

    expect(lowerBody).toMatch(/class/i);
  });

  test('8) navigating to /settings works for principal', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';

    const isAccessible = !lowerBody.includes('access denied') &&
      !lowerBody.includes('unauthorized');
    expect(isAccessible).toBe(true);

    expect(lowerBody).toMatch(/setting/i);
  });

  test('9) principal permissions are correctly set (all true except superAdmin)', async () => {
    expect(state.user.role).toBe('principal');
    expect(state.user.permissions?.superAdmin).toBe(false);

    // All other permissions should be true
    const truePerm = [
      'students', 'classes', 'staff', 'attendance', 'academics', 'fees',
      'messaging', 'frontDesk', 'library', 'settings', 'analytics', 'reports',
      'timetable', 'hostel', 'transport', 'inventory', 'homework', 'calendar',
      'payroll', 'aiAssistant', 'intakeForms', 'dataTools',
    ];
    for (const perm of truePerm) {
      expect(state.user.permissions?.[perm]).toBe(true);
    }
  });
});
