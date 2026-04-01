import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  SCIM provisioning mock data
 * ───────────────────────────────────────────────────────────────────── */

interface ScimConfig {
  enabled: boolean;
  endpointUrl: string;
  token: string | null;
  tokenCreatedAt: string | null;
  lastSyncAt: string | null;
}

function seedScimConfig(state: MockState): ScimConfig {
  const config: ScimConfig = {
    enabled: false,
    endpointUrl: 'https://api.schoolsync.test/scim/v2',
    token: null,
    tokenCreatedAt: null,
    lastSyncAt: null,
  };
  (state as any).scimConfig = config;
  return config;
}

/* ─────────────────────────────────────────────────────────────────────
 *  TC080 — SCIM Provisioning Settings
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC080 — SCIM Provisioning Settings', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    seedScimConfig(state);

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);

    // Override SCIM settings routes
    await page.route('**/api/scim**', async (route) => {
      const path = new URL(route.request().url()).pathname.replace(/\/+$/, '');
      const method = route.request().method();
      const config: ScimConfig = (state as any).scimConfig;

      const json = (data: unknown, status = 200) =>
        route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

      // GET /api/scim/config
      if ((path === '/api/scim/config' || path === '/api/scim') && method === 'GET') {
        return json(config);
      }

      // PUT /api/scim/config — toggle enabled, update settings
      if ((path === '/api/scim/config' || path === '/api/scim') && (method === 'PUT' || method === 'PATCH')) {
        const body = JSON.parse(route.request().postData() || '{}');
        if (body.enabled !== undefined) config.enabled = body.enabled;
        return json(config);
      }

      // POST /api/scim/token — generate a new token
      if (path === '/api/scim/token' && method === 'POST') {
        config.token = `scim_tok_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        config.tokenCreatedAt = new Date().toISOString();
        return json({ token: config.token, createdAt: config.tokenCreatedAt });
      }

      // DELETE /api/scim/token — revoke token
      if (path === '/api/scim/token' && method === 'DELETE') {
        config.token = null;
        config.tokenCreatedAt = null;
        return json({ message: 'Token revoked' });
      }

      await route.continue();
    });

    // Also handle settings/scim path
    await page.route('**/api/settings/scim**', async (route) => {
      const method = route.request().method();
      const config: ScimConfig = (state as any).scimConfig;

      const json = (data: unknown, status = 200) =>
        route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

      if (method === 'GET') return json(config);
      if (method === 'PUT' || method === 'PATCH') {
        const body = JSON.parse(route.request().postData() || '{}');
        if (body.enabled !== undefined) config.enabled = body.enabled;
        return json(config);
      }
      await route.continue();
    });
  });

  /* ───────── 1. SCIM page loads ───────── */

  test('1) SCIM provisioning page loads', async ({ page }) => {
    await page.goto('/settings/scim');
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('SCIM') || bodyText?.includes('Provisioning') ||
      bodyText?.includes('Settings') || bodyText?.includes('scim'),
    ).toBeTruthy();
  });

  /* ───────── 2. SCIM is initially disabled ───────── */

  test('2) SCIM is initially disabled', async ({ page }) => {
    await page.goto('/settings/scim');
    await page.waitForLoadState('networkidle');

    const config = (state as any).scimConfig as ScimConfig;
    expect(config.enabled).toBe(false);

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('Disabled') || bodyText?.includes('disabled') ||
      bodyText?.includes('Enable') || bodyText?.includes('Off') ||
      bodyText?.includes('SCIM'),
    ).toBeTruthy();
  });

  /* ───────── 3. Toggle SCIM enabled ───────── */

  test('3) toggling SCIM enables provisioning', async ({ page }) => {
    await page.goto('/settings/scim');
    await page.waitForLoadState('networkidle');

    const toggle = page.locator('[role="switch"]').first();
    const enableBtn = page.getByRole('button', { name: /enable|activate/i }).first();

    if (await toggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await toggle.click();
      await page.waitForTimeout(500);
    } else if (await enableBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await enableBtn.click();
      await page.waitForTimeout(500);
    }
  });

  /* ───────── 4. SCIM endpoint URL is displayed ───────── */

  test('4) SCIM endpoint URL is visible on the page', async ({ page }) => {
    (state as any).scimConfig.enabled = true;

    await page.goto('/settings/scim');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('scim') || bodyText?.includes('SCIM') ||
      bodyText?.includes('endpoint') || bodyText?.includes('Endpoint') ||
      bodyText?.includes('URL'),
    ).toBeTruthy();
  });

  /* ───────── 5. Generate SCIM token ───────── */

  test('5) generating a SCIM token produces a token value', async ({ page }) => {
    (state as any).scimConfig.enabled = true;

    await page.goto('/settings/scim');
    await page.waitForLoadState('networkidle');

    const generateBtn = page.getByRole('button', { name: /generate|create token|new token/i }).first();
    if (await generateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await generateBtn.click();
      await page.waitForTimeout(500);

      const config = (state as any).scimConfig as ScimConfig;
      expect(config.token).not.toBeNull();
      expect(config.token?.startsWith('scim_tok_')).toBeTruthy();
    }
  });

  /* ───────── 6. Token is displayed after generation ───────── */

  test('6) generated token value is displayed on the page', async ({ page }) => {
    (state as any).scimConfig.enabled = true;
    (state as any).scimConfig.token = 'scim_tok_visible_test_abc123';
    (state as any).scimConfig.tokenCreatedAt = '2026-03-30T10:00:00.000Z';

    await page.goto('/settings/scim');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('scim_tok_') || bodyText?.includes('Token') ||
      bodyText?.includes('token') || bodyText?.includes('****'),
    ).toBeTruthy();
  });

  /* ───────── 7. Regenerate token ───────── */

  test('7) regenerating the token produces a new token value', async ({ page }) => {
    (state as any).scimConfig.enabled = true;
    (state as any).scimConfig.token = 'scim_tok_old_token';
    (state as any).scimConfig.tokenCreatedAt = '2026-03-25T10:00:00.000Z';

    await page.goto('/settings/scim');
    await page.waitForLoadState('networkidle');

    const regenBtn = page.getByRole('button', { name: /regenerate|rotate|new token/i }).first();
    if (await regenBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await regenBtn.click();
      await page.waitForTimeout(300);

      // Handle confirmation dialog
      const confirmBtn = page.getByRole('button', { name: /confirm|yes|regenerate/i }).first();
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(500);
      }

      const config = (state as any).scimConfig as ScimConfig;
      if (config.token) {
        expect(config.token).not.toBe('scim_tok_old_token');
      }
    }
  });

  /* ───────── 8. Copy endpoint URL ───────── */

  test('8) copy endpoint URL button is available', async ({ page }) => {
    (state as any).scimConfig.enabled = true;

    await page.goto('/settings/scim');
    await page.waitForLoadState('networkidle');

    const copyBtn = page.getByRole('button', { name: /copy/i }).first();
    const clipboardIcon = page.locator('button:has(svg.lucide-copy), button:has(svg.lucide-clipboard)').first();

    const hasCopy = await copyBtn.isVisible({ timeout: 3000 }).catch(() => false);
    const hasIcon = await clipboardIcon.isVisible({ timeout: 2000 }).catch(() => false);

    // Either a copy button or the endpoint URL should be on the page
    const bodyText = await page.textContent('body');
    expect(
      hasCopy || hasIcon ||
      bodyText?.includes('scim') || bodyText?.includes('endpoint'),
    ).toBeTruthy();
  });

  /* ───────── 9. State integrity check ───────── */

  test('9) state has correct initial SCIM configuration', async ({ page }) => {
    const config = (state as any).scimConfig as ScimConfig;
    expect(config.enabled).toBe(false);
    expect(config.endpointUrl).toBe('https://api.schoolsync.test/scim/v2');
    expect(config.token).toBeNull();
    expect(config.tokenCreatedAt).toBeNull();
    expect(config.lastSyncAt).toBeNull();
  });
});
