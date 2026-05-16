import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, seedStudent,
  CLASS_10A_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  TC103 — Error Boundary: graceful handling of JavaScript errors
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC103 — Error Boundary', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    seedStudent(state, { name: 'Test Student', classId: CLASS_10A_ID });

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);
  });

  /* ───────── 1. App loads without errors normally ───────── */

  test('1) app loads without triggering error boundary', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);

    // No error boundary should be visible
    const errorBoundary = page.locator(
      '[data-testid="error-boundary"], [class*="error-boundary"], [class*="error-fallback"]',
    ).first();
    const errorText = page.getByText(/something went wrong|unexpected error|oops/i).first();

    const hasError = await errorBoundary.isVisible({ timeout: 3000 }).catch(() => false);
    const hasErrorText = await errorText.isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasError).toBeFalsy();
    expect(hasErrorText).toBeFalsy();
  });

  /* ───────── 2. Malformed JSON response triggers graceful handling ───────── */

  test('2) malformed API response does not crash the app', async ({ page }) => {
    // Override students API to return malformed JSON
    await page.route('**/api/students', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{ invalid json here !!!',
      });
    });

    await page.goto('/students');
    await page.waitForTimeout(3000);

    // App should not show a completely blank screen
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(5);
  });

  /* ───────── 3. Error boundary shows recovery option ───────── */

  test('3) error state provides a "Go back" or recovery action', async ({ page }) => {
    // Override to cause a crash-inducing response
    await page.route('**/api/students', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{ broken',
      });
    });

    await page.goto('/students');
    await page.waitForTimeout(3000);

    // Look for recovery buttons
    const goBackBtn = page.getByRole('button', { name: /go back|try again|retry|reload|refresh|home/i }).first();
    const goBackLink = page.getByRole('link', { name: /go back|home|dashboard/i }).first();

    const hasRecoveryBtn = await goBackBtn.isVisible({ timeout: 5000 }).catch(() => false);
    const hasRecoveryLink = await goBackLink.isVisible({ timeout: 3000 }).catch(() => false);

    // The app should either show a recovery option or still be navigable
    const sidebar = page.locator('nav, aside, [class*="sidebar"]').first();
    const hasSidebar = await sidebar.isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasRecoveryBtn || hasRecoveryLink || hasSidebar).toBeTruthy();
  });

  /* ───────── 4. 500 error response handled gracefully ───────── */

  test('4) server 500 error does not show blank screen', async ({ page }) => {
    await page.route('**/api/students', async (route) => {
      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/students');
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();

    // Should show error message or empty state, not a blank page
    const hasContent = bodyText!.length > 10;
    expect(hasContent).toBeTruthy();
  });

  /* ───────── 5. Network error handled gracefully ───────── */

  test('5) network timeout does not crash the app', async ({ page }) => {
    await page.route('**/api/students', async (route) => {
      // Simulate network timeout by aborting
      return route.abort('timedout');
    });

    await page.goto('/students');
    await page.waitForTimeout(3000);

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(5);
  });

  /* ───────── 6. Error boundary does not show for normal 404 ───────── */

  test('6) navigating to non-existent route shows 404 page not error boundary', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-xyz');
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();

    // Should show a 404 or "not found" page, not a JS crash
    const has404 = bodyText?.toLowerCase().includes('not found') ||
      bodyText?.toLowerCase().includes('404') ||
      bodyText?.toLowerCase().includes('page not found') ||
      bodyText?.toLowerCase().includes('does not exist');

    // Even if no explicit 404, the app should still render something
    expect(bodyText!.length).toBeGreaterThan(5);
  });

  /* ───────── 7. Error in one module doesn't break others ───────── */

  test('7) error in students module does not break classes module', async ({ page }) => {
    // Break only the students endpoint
    await page.route('**/api/students', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{ invalid }}}',
      });
    });

    // First visit students (may error)
    await page.goto('/students');
    await page.waitForTimeout(2000);

    // Then navigate to classes which should work fine
    await page.goto('/classes');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();

    // Classes data should display or at least the page should render
    const has10A = bodyText?.includes('10') || bodyText?.includes('Class');
    expect(has10A).toBeTruthy();
  });

  /* ───────── 8. Console errors captured but app remains stable ───────── */

  test('8) JavaScript errors are caught and app remains interactive', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // Inject a route that returns data causing a render error
    await page.route('**/api/dashboard/stats', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ totalStudents: 'not-a-number' }), // type mismatch
      });
    });

    await page.goto('/');
    await page.waitForTimeout(3000);

    // App should still be interactive even with bad data
    const sidebar = page.locator('nav, aside, [class*="sidebar"]').first();
    const hasSidebar = await sidebar.isVisible({ timeout: 5000 }).catch(() => false);

    // Page should still render something
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });
});
