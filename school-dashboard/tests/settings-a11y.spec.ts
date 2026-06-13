import { expect, test } from '@playwright/test';
import { createMockState, installMockApi, type MockState } from './test-utils';

test.describe('Settings — Accessibility', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    // Seed parents so the action buttons render
    (state as any).parents = [
      { _id: 'parent-1', name: 'Ravi Kumar', phone: '9876543210', email: 'ravi@example.com', status: 'active', children: [] },
    ];
    // Seed trash items so restore/delete buttons render
    (state as any).trashItems = [
      { _id: 'trash-1', itemName: 'Rahul Sharma', itemType: 'Student', deletedAt: '2026-03-15T10:00:00Z', deletedBy: { name: 'Admin' }, expiresAt: '2026-04-14T10:00:00Z' },
    ];
    // Dismiss cookie consent so it doesn't block clicks
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });
    await installMockApi(page, state);
  });

  test('settings navigation search has an accessible label', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [id="main-content"], nav', { timeout: 15000 });

    const search = page.getByPlaceholder(/Search settings/i);
    await expect(search).toBeVisible();
    await expect(search).toHaveAttribute('aria-label', /Search settings/i);
  });

  test('parent management bulk-create button is visible (not white-on-surface)', async ({ page }) => {
    await page.goto('/settings/parents');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [id="main-content"], nav', { timeout: 15000 });

    const btn = page.getByRole('button', { name: /Bulk Create Accounts/i });
    await expect(btn).toBeVisible();

    // The button must not use the same foreground and background colors
    const color = await btn.evaluate((el) => window.getComputedStyle(el).color);
    const bg = await btn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(color).not.toBe(bg);
  });

  test('parent management action buttons have accessible names', async ({ page }) => {
    await page.goto('/settings/parents');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [id="main-content"], nav', { timeout: 15000 });

    // The initial StrictMode mount can abort the fetch before the request queue
    // dispatches it. If the seeded row doesn't appear, refresh to force a retry.
    const row = page.getByText('Ravi Kumar').first();
    const empty = page.getByText(/No parent accounts found yet/i).first();
    await expect(row.or(empty)).toBeVisible({ timeout: 10000 });
    if (await empty.isVisible().catch(() => false)) {
      await page.getByRole('button', { name: /refresh/i }).first().click();
    }

    // Wait for parent rows to render
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /refresh/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'View details' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset password' }).first()).toBeVisible();
  });

  test('promotion rules save button is visible (not white-on-surface)', async ({ page }) => {
    await page.goto('/settings/promotion-rules');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [id="main-content"], nav', { timeout: 15000 });

    const btn = page.getByRole('button', { name: /Save Rules/i });
    await expect(btn).toBeVisible();

    const color = await btn.evaluate((el) => window.getComputedStyle(el).color);
    const bg = await btn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(color).not.toBe(bg);
  });

  test('data cleanup confirmation input has an accessible label', async ({ page }) => {
    await page.goto('/settings/data-cleanup');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [id="main-content"], nav', { timeout: 15000 });

    await page.getByRole('button', { name: 'Select All', exact: true }).click();
    await page.getByRole('button', { name: /Remove All Data/i }).last().click();

    const modal = page.locator('[role="dialog"]').last();
    await expect(modal).toBeVisible({ timeout: 10000 });
    await expect(modal.getByPlaceholder('REMOVE ALL DATA')).toBeVisible();
    await expect(modal.locator('input')).toHaveAttribute('aria-label', /Type REMOVE ALL DATA to confirm/i);
  });

  test('trash action icon-only buttons have accessible names', async ({ page }) => {
    await page.goto('/settings/trash');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [id="main-content"], nav', { timeout: 15000 });

    // Same StrictMode/abort-queue timing safeguard as the parent test.
    const row = page.getByText('Rahul Sharma').first();
    const empty = page.getByText(/No items in trash/i).first();
    await expect(row.or(empty)).toBeVisible({ timeout: 10000 });
    if (await empty.isVisible().catch(() => false)) {
      await page.getByRole('button', { name: /Refresh/i }).first().click();
    }

    // Wait for trash items to render
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Restore item' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete permanently' }).first()).toBeVisible();
  });

  test('settings navigation Owlin toggle exposes switch semantics', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [id="main-content"], nav', { timeout: 15000 });

    const toggle = page.locator('button[role="switch"][aria-label="Toggle Owlin tracker"]');
    await expect(toggle).toBeVisible();
    const checked = await toggle.getAttribute('aria-checked');
    expect(['true', 'false']).toContain(checked);
  });
});
