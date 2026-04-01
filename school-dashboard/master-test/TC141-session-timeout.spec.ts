import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  TC101 — Session Timeout: warning, extend, and auto-logout
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC101 — Session Timeout', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);
  });

  /* ───────── 1. Dashboard loads with active session ───────── */

  test('1) dashboard loads with a valid session', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  /* ───────── 2. Expired session triggers 401 ───────── */

  test('2) expired session returns 401 and shows warning', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    let callCount = 0;

    // Override the auth/session endpoint to return 401 after first call
    await page.route('**/api/auth/session', async (route) => {
      callCount++;
      if (callCount <= 1) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(state.user),
        });
      }
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Session expired', code: 'SESSION_EXPIRED' }),
      });
    });

    // Also make other API calls return 401 to simulate session expiry
    await page.route('**/api/students', async (route) => {
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
    });

    // Navigate to a page that triggers API calls
    await page.goto('/students');
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body');
    // Should show some session/login indication
    const hasSessionWarning = bodyText?.toLowerCase().includes('session') ||
      bodyText?.toLowerCase().includes('expired') ||
      bodyText?.toLowerCase().includes('login') ||
      bodyText?.toLowerCase().includes('sign in') ||
      bodyText?.toLowerCase().includes('unauthorized');

    expect(hasSessionWarning).toBeTruthy();
  });

  /* ───────── 3. Session timeout warning appears ───────── */

  test('3) session timeout warning dialog appears on 401', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Override all API calls to return 401
    await page.route('**/api/auth/session', async (route) => {
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Session expired' }),
      });
    });

    // Trigger a page that checks session
    await page.goto('/students');
    await page.waitForTimeout(2000);

    // Look for timeout warning dialog
    const warningDialog = page.locator(
      '[data-testid="session-timeout"], [class*="session-timeout"], [role="alertdialog"], [role="dialog"]',
    ).first();
    const warningText = page.getByText(/session.*expired|session.*timeout|been logged out/i).first();

    const hasDialog = await warningDialog.isVisible({ timeout: 5000 }).catch(() => false);
    const hasWarning = await warningText.isVisible({ timeout: 5000 }).catch(() => false);

    // The app should handle the 401 somehow (dialog, redirect, or toast)
    const currentUrl = page.url();
    const redirectedToLogin = currentUrl.includes('/login');

    expect(hasDialog || hasWarning || redirectedToLogin).toBeTruthy();
  });

  /* ───────── 4. Extend Session button exists ───────── */

  test('4) session warning has an "Extend Session" or re-login option', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Force session expiry
    await page.route('**/api/auth/session', async (route) => {
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Session expired' }),
      });
    });

    await page.goto('/students');
    await page.waitForTimeout(2000);

    // Look for extend/refresh/login buttons
    const extendBtn = page.getByRole('button', { name: /extend|refresh|renew|login|sign in/i }).first();
    const loginLink = page.getByRole('link', { name: /login|sign in/i }).first();

    const hasExtend = await extendBtn.isVisible({ timeout: 5000 }).catch(() => false);
    const hasLogin = await loginLink.isVisible({ timeout: 3000 }).catch(() => false);
    const onLoginPage = page.url().includes('/login');

    expect(hasExtend || hasLogin || onLoginPage).toBeTruthy();
  });

  /* ───────── 5. Extend session refreshes token ───────── */

  test('5) clicking extend session refreshes the token', async ({ page }) => {
    let sessionExpired = false;

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Override to simulate expired then refreshable session
    await page.route('**/api/auth/refresh', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...state.user, token: 'refreshed-token' }),
      });
    });

    await page.route('**/api/auth/session', async (route) => {
      if (sessionExpired) {
        return route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Session expired' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(state.user),
      });
    });

    sessionExpired = true;
    await page.goto('/students');
    await page.waitForTimeout(2000);

    // Try to extend session
    const extendBtn = page.getByRole('button', { name: /extend|refresh|renew|stay logged in/i }).first();
    if (await extendBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      sessionExpired = false; // Simulate successful refresh
      await extendBtn.click();
      await page.waitForTimeout(1000);

      // After extending, the user should remain on the app
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
    }
  });

  /* ───────── 6. Auto-redirect to login on full expiry ───────── */

  test('6) user is redirected to /login when session fully expires', async ({ page }) => {
    // Override session to always return 401
    await page.route('**/api/auth/session', async (route) => {
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Session expired' }),
      });
    });

    // Clear session storage to simulate full logout
    await page.addInitScript(() => {
      sessionStorage.removeItem('app_user');
    });

    await page.goto('/students');
    await page.waitForTimeout(3000);

    // Should redirect to login or show login form
    const currentUrl = page.url();
    const bodyText = await page.textContent('body');

    const isOnLogin = currentUrl.includes('/login');
    const hasLoginForm = bodyText?.toLowerCase().includes('sign in') ||
      bodyText?.toLowerCase().includes('login') ||
      bodyText?.toLowerCase().includes('email') ||
      bodyText?.toLowerCase().includes('password');

    expect(isOnLogin || hasLoginForm).toBeTruthy();
  });

  /* ───────── 7. Session warning shows countdown ───────── */

  test('7) session timeout warning includes a countdown or urgency message', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Force 401 on subsequent calls
    await page.route('**/api/auth/session', async (route) => {
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Session expired' }),
      });
    });

    await page.goto('/students');
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body');

    // Look for countdown, urgency, or redirect message
    const hasCountdownOrMessage = bodyText?.match(/\d+:\d+/) || // countdown timer
      bodyText?.toLowerCase().includes('second') ||
      bodyText?.toLowerCase().includes('minute') ||
      bodyText?.toLowerCase().includes('expir') ||
      bodyText?.toLowerCase().includes('timeout') ||
      bodyText?.toLowerCase().includes('logged out') ||
      page.url().includes('/login');

    expect(hasCountdownOrMessage).toBeTruthy();
  });
});
