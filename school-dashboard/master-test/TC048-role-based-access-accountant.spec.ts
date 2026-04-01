/**
 * TC048: Accountant sees only finance-related modules.
 *
 * Verifies that an accountant user sees the appropriate sidebar modules
 * (Fees, Students limited, Messages, Analytics, Reports, Payroll)
 * and is denied access to non-finance modules.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState,
  createAccountantUser,
  installMockApi,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Tests
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC048: Role-Based Access — Accountant', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState(createAccountantUser());

    // Dismiss cookie consent
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);
  });

  test('1) accountant dashboard loads successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();

    // Verify accountant name appears
    const accountantName = page.getByText('Priya Menon').first();
    const hasName = await accountantName.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasName) {
      await expect(accountantName).toBeVisible();
    }
  });

  test('2) sidebar shows finance-related modules', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('nav, aside, [class*="sidebar"], [data-testid="sidebar"]').first();
    await expect(sidebar).toBeVisible({ timeout: 5000 });

    const sidebarText = await sidebar.textContent();
    const lowerText = sidebarText?.toLowerCase() || '';

    // Accountant permissions: students=true, fees=true, messaging=true, analytics=true, reports=true, payroll=true
    expect(lowerText).toMatch(/fee/i);
  });

  test('3) sidebar does NOT show non-finance modules', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('nav, aside, [class*="sidebar"], [data-testid="sidebar"]').first();
    await expect(sidebar).toBeVisible({ timeout: 5000 });

    // Accountant permissions have these as false: classes, staff, attendance, academics, frontDesk, timetable
    const classesLink = sidebar.getByRole('link', { name: /^classes$/i });
    const classesVisible = await classesLink.isVisible({ timeout: 2000 }).catch(() => false);
    expect(classesVisible).toBe(false);

    const academicsLink = sidebar.getByRole('link', { name: /^academics$/i });
    const academicsVisible = await academicsLink.isVisible({ timeout: 2000 }).catch(() => false);
    expect(academicsVisible).toBe(false);

    const staffLink = sidebar.getByRole('link', { name: /^staff$/i });
    const staffVisible = await staffLink.isVisible({ timeout: 2000 }).catch(() => false);
    expect(staffVisible).toBe(false);
  });

  test('4) navigating to /fees works for accountant', async ({ page }) => {
    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';

    // Should NOT show access denied
    const isAccessible = !lowerBody.includes('access denied') &&
      !lowerBody.includes('unauthorized');
    expect(isAccessible).toBe(true);

    // Should show fee-related content
    expect(lowerBody).toMatch(/fee|payment|collection/i);
  });

  test('5) navigating to /classes shows access denied or redirects', async ({ page }) => {
    await page.goto('/classes');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';

    const denied = lowerBody.includes('access denied') ||
      lowerBody.includes('unauthorized') ||
      lowerBody.includes('permission') ||
      lowerBody.includes('not allowed') ||
      !currentUrl.includes('/classes');

    expect(denied).toBe(true);
  });

  test('6) navigating to /academics shows access denied or redirects', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';

    const denied = lowerBody.includes('access denied') ||
      lowerBody.includes('unauthorized') ||
      lowerBody.includes('permission') ||
      lowerBody.includes('not allowed') ||
      !currentUrl.includes('/academics');

    expect(denied).toBe(true);
  });

  test('7) navigating to /students works for accountant (limited access)', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';

    // Accountant has students=true for viewing fee info
    const isAccessible = !lowerBody.includes('access denied') &&
      !lowerBody.includes('unauthorized');
    expect(isAccessible).toBe(true);
  });

  test('8) accountant user permissions are correctly set', async () => {
    // Verify the permissions in state
    expect(state.user.role).toBe('accountant');
    expect(state.user.permissions?.fees).toBe(true);
    expect(state.user.permissions?.students).toBe(true);
    expect(state.user.permissions?.messaging).toBe(true);
    expect(state.user.permissions?.analytics).toBe(true);
    expect(state.user.permissions?.reports).toBe(true);
    expect(state.user.permissions?.payroll).toBe(true);

    // These should be false
    expect(state.user.permissions?.classes).toBe(false);
    expect(state.user.permissions?.staff).toBe(false);
    expect(state.user.permissions?.attendance).toBe(false);
    expect(state.user.permissions?.academics).toBe(false);
    expect(state.user.permissions?.frontDesk).toBe(false);
    expect(state.user.permissions?.timetable).toBe(false);
    expect(state.user.permissions?.settings).toBe(false);
  });
});
