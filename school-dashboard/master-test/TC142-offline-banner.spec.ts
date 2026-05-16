import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ────────────────────��────────────────────────────────────────────────
 *  TC102 — Offline Banner: network disconnection handling
 * ────────────────────��──────────────────────────────��───────────────── */

test.describe('TC102 — Offline Banner', () => {
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

  /* ──────���── 1. App loads normally with network ───────── */

  test('1) app loads normally when online', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();

    // No offline banner should be visible
    const offlineBanner = page.locator(
      '[data-testid="offline-banner"], [class*="offline"], [class*="no-connection"]',
    ).first();
    const bannerVisible = await offlineBanner.isVisible({ timeout: 2000 }).catch(() => false);
    expect(bannerVisible).toBeFalsy();
  });

  /* ──��────── 2. Simulate offline by aborting all routes ──���────── */

  test('2) offline banner appears when network is lost', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Simulate going offline by emitting the offline event
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });
    await page.waitForTimeout(1000);

    // Check for offline banner or indicator
    const offlineBanner = page.locator(
      '[data-testid="offline-banner"], [class*="offline"], [class*="no-connection"]',
    ).first();
    const offlineText = page.getByText(/offline|no.*connection|network.*unavailable|disconnected/i).first();

    const hasBanner = await offlineBanner.isVisible({ timeout: 5000 }).catch(() => false);
    const hasText = await offlineText.isVisible({ timeout: 5000 }).catch(() => false);

    // The app should indicate offline status somehow
    expect(hasBanner || hasText).toBeTruthy();
  });

  /* ───────── 3. Offline banner has appropriate messaging ─────���─── */

  test('3) offline banner displays appropriate message', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });
    await page.waitForTimeout(1000);

    const bodyText = await page.textContent('body');

    const hasOfflineMessage = bodyText?.toLowerCase().includes('offline') ||
      bodyText?.toLowerCase().includes('connection') ||
      bodyText?.toLowerCase().includes('network') ||
      bodyText?.toLowerCase().includes('internet');

    expect(hasOfflineMessage).toBeTruthy();
  });

  /* ───────── 4. Restoring network removes offline banner ───────── */

  test('4) offline banner disappears when network is restored', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Go offline
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });
    await page.waitForTimeout(1000);

    // Go back online
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });
    await page.waitForTimeout(1500);

    // Offline banner should disappear
    const offlineBanner = page.locator(
      '[data-testid="offline-banner"], [class*="offline"], [class*="no-connection"]',
    ).first();
    const offlineText = page.getByText(/offline|no.*connection|disconnected/i).first();

    const bannerGone = !(await offlineBanner.isVisible({ timeout: 3000 }).catch(() => false));
    const textGone = !(await offlineText.isVisible({ timeout: 3000 }).catch(() => false));

    expect(bannerGone || textGone).toBeTruthy();
  });

  /* ───────── 5. App recovers after going back online ───────── */

  test('5) app recovers and functions after going back online', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Go offline then back online
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });
    await page.waitForTimeout(1500);

    // Navigate to verify app still works
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    await expect(page).not.toHaveURL(/\/login/);
  });

  /* ���──────── 6. Failed API calls during offline show error ───────── */

  test('6) API calls during offline show appropriate error handling', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Abort all new API requests to simulate network failure
    await page.route('**/api/students', (route) => route.abort('connectionfailed'));

    // Try navigating to students page
    await page.goto('/students');
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body');
    // App should handle the error gracefully (not crash or show blank)
    expect(bodyText).toBeTruthy();
  });

  /* ───────── 7. Offline state does not crash the app ───────── */

  test('7) app does not crash or show blank screen when offline', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Simulate offline
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });
    await page.waitForTimeout(1000);

    // The page should still have content (not completely blank)
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(10);

    // The sidebar should still be visible
    const sidebar = page.locator('nav, aside, [class*="sidebar"]').first();
    const hasSidebar = await sidebar.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasSidebar).toBeTruthy();
  });
});
