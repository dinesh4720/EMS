import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  SSO config mock data
 * ───────────────────────────────────────────────────────────────────── */

interface SsoProviderConfig {
  enabled: boolean;
  clientId?: string;
  clientSecret?: string;
  tenantId?: string;
  entryPoint?: string;
  issuer?: string;
  cert?: string;
  emailAttribute?: string;
  nameAttribute?: string;
  groupAttribute?: string;
  hasClientSecret?: boolean;
  hasCert?: boolean;
}

interface SsoConfig {
  google: SsoProviderConfig;
  microsoft: SsoProviderConfig;
  saml: SsoProviderConfig;
  allowedDomains: string[];
  autoProvision: boolean;
  defaultRole: string;
  ssoOnly: boolean;
}

function seedSsoConfig(state: MockState): SsoConfig {
  const config: SsoConfig = {
    google: { enabled: false, clientId: '', clientSecret: '', hasClientSecret: false },
    microsoft: { enabled: false, clientId: '', clientSecret: '', tenantId: '', hasClientSecret: false },
    saml: {
      enabled: false, entryPoint: '', issuer: '', cert: '',
      emailAttribute: 'email', nameAttribute: 'displayName', groupAttribute: '',
      hasCert: false,
    },
    allowedDomains: [],
    autoProvision: false,
    defaultRole: 'Teacher',
    ssoOnly: false,
  };
  (state as any).ssoConfig = config;
  return config;
}

/* ─────────────────────────────────────────────────────────────────────
 *  TC166 — SSO Settings
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC166 — SSO Settings', () => {
  let state: MockState;
  let ssoConfig: SsoConfig;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    ssoConfig = seedSsoConfig(state);

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);

    // Override SSO config routes
    await page.route('**/api/auth/sso/config**', async (route) => {
      const method = route.request().method();

      const json = (data: unknown, status = 200) =>
        route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

      if (method === 'GET') {
        return json({ ssoConfig });
      }

      if (method === 'PUT' || method === 'POST' || method === 'PATCH') {
        const body = JSON.parse(route.request().postData() || '{}');

        if (body.google) {
          ssoConfig.google.enabled = body.google.enabled ?? ssoConfig.google.enabled;
          ssoConfig.google.clientId = body.google.clientId ?? ssoConfig.google.clientId;
          if (body.google.clientSecret) {
            ssoConfig.google.hasClientSecret = true;
          }
        }
        if (body.microsoft) {
          ssoConfig.microsoft.enabled = body.microsoft.enabled ?? ssoConfig.microsoft.enabled;
          ssoConfig.microsoft.clientId = body.microsoft.clientId ?? ssoConfig.microsoft.clientId;
          ssoConfig.microsoft.tenantId = body.microsoft.tenantId ?? ssoConfig.microsoft.tenantId;
          if (body.microsoft.clientSecret) {
            ssoConfig.microsoft.hasClientSecret = true;
          }
        }
        if (body.saml) {
          ssoConfig.saml.enabled = body.saml.enabled ?? ssoConfig.saml.enabled;
          ssoConfig.saml.entryPoint = body.saml.entryPoint ?? ssoConfig.saml.entryPoint;
          ssoConfig.saml.issuer = body.saml.issuer ?? ssoConfig.saml.issuer;
          ssoConfig.saml.emailAttribute = body.saml.emailAttribute ?? ssoConfig.saml.emailAttribute;
          ssoConfig.saml.nameAttribute = body.saml.nameAttribute ?? ssoConfig.saml.nameAttribute;
          ssoConfig.saml.groupAttribute = body.saml.groupAttribute ?? ssoConfig.saml.groupAttribute;
          if (body.saml.cert) {
            ssoConfig.saml.hasCert = true;
          }
        }
        if (body.allowedDomains) ssoConfig.allowedDomains = body.allowedDomains;
        if (body.autoProvision !== undefined) ssoConfig.autoProvision = body.autoProvision;
        if (body.defaultRole) ssoConfig.defaultRole = body.defaultRole;
        if (body.ssoOnly !== undefined) ssoConfig.ssoOnly = body.ssoOnly;

        return json({ success: true, ssoConfig });
      }

      await route.continue();
    });
  });

  /* ───────── 1. SSO settings page loads ───────── */

  test('1) SSO settings page loads with header and provider sections', async ({ page }) => {
    await page.goto('/settings/sso');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await expect(page).not.toHaveURL(/\/login/);

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('SSO Configuration');
    expect(bodyText).toContain('Google Workspace');
    expect(bodyText).toContain('Microsoft 365');
    expect(bodyText).toContain('SAML 2.0');
    expect(bodyText).toContain('General Settings');
  });

  /* ───────── 2. Loading state shows shimmer skeletons ───────── */

  test('2) loading state renders shimmer skeletons before data arrives', async ({ page }) => {
    // Delay the SSO config response so the loading state is visible
    await page.route('**/api/auth/sso/config**', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await new Promise((r) => setTimeout(r, 800));
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ssoConfig }),
        });
      }
      await route.continue();
    });

    await page.goto('/settings/sso');
    await page.waitForTimeout(300);

    // Shimmer skeletons should be present during loading
    const shimmer = page.locator('.animate-shimmer').first();
    await expect(shimmer).toBeVisible({ timeout: 3000 });

    // Wait for content to load
    await page.waitForTimeout(1200);
    await expect(page.getByText('SSO Configuration')).toBeVisible();
  });

  /* ───────── 3. Enable and configure Google Workspace SSO ───────── */

  test('3) enable Google Workspace SSO, fill credentials and save', async ({ page }) => {
    await page.goto('/settings/sso');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Toggle Google Workspace on
    const googleSection = page.locator('div').filter({ hasText: /^Google Workspace$/ }).first();
    const googleSwitch = googleSection.locator('button[role="switch"]').first();
    await expect(googleSwitch).toBeVisible();
    await googleSwitch.click();
    await page.waitForTimeout(300);

    // Fill Client ID
    const clientIdInput = googleSection.locator('input[type="text"]').first();
    await expect(clientIdInput).toBeVisible();
    await clientIdInput.fill('123456789-abc.apps.googleusercontent.com');

    // Fill Client Secret
    const secretInput = googleSection.locator('input[type="password"]').first();
    await expect(secretInput).toBeVisible();
    await secretInput.fill('g-secret-12345');

    // Save
    const saveBtn = page.getByRole('button', { name: /Save SSO Config/i });
    await saveBtn.click();
    await page.waitForTimeout(800);

    // Success chip should appear
    await expect(page.getByText('Google', { exact: false })).toBeVisible();
    await expect(page.getByText('enabled')).toBeVisible();
  });

  /* ───────── 4. Enable and configure Microsoft 365 SSO ───────── */

  test('4) enable Microsoft 365 SSO, fill credentials and save', async ({ page }) => {
    await page.goto('/settings/sso');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const msSection = page.locator('div').filter({ hasText: /^Microsoft 365 \/ Azure AD$/ }).first();
    const msSwitch = msSection.locator('button[role="switch"]').first();
    await msSwitch.click();
    await page.waitForTimeout(300);

    const inputs = msSection.locator('input[type="text"], input[type="password"]');
    await inputs.nth(0).fill('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
    await inputs.nth(1).fill('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
    await inputs.nth(2).fill('ms-secret-67890');

    await page.getByRole('button', { name: /Save SSO Config/i }).click();
    await page.waitForTimeout(800);

    await expect(page.getByText('Microsoft', { exact: false })).toBeVisible();
  });

  /* ───────── 5. Enable and configure SAML 2.0 SSO ───────── */

  test('5) enable SAML 2.0 SSO, fill IdP details and save', async ({ page }) => {
    await page.goto('/settings/sso');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const samlSection = page.locator('div').filter({ hasText: /^SAML 2\.0$/ }).first();
    const samlSwitch = samlSection.locator('button[role="switch"]').first();
    await samlSwitch.click();
    await page.waitForTimeout(300);

    const textInputs = samlSection.locator('input[type="text"]');
    await textInputs.nth(0).fill('https://idp.school.edu/sso/saml');
    await textInputs.nth(1).fill('https://idp.school.edu/entity');

    const certTextarea = samlSection.locator('textarea').first();
    await certTextarea.fill('-----BEGIN CERTIFICATE-----\nMIIDXTCCAkWgAwIBAgIJAKoK/heBjcOu\n-----END CERTIFICATE-----');

    const attrInputs = samlSection.locator('input[type="text"]');
    // Email attribute
    await attrInputs.nth(2).fill('email');
    // Name attribute
    await attrInputs.nth(3).fill('displayName');
    // Group attribute
    await attrInputs.nth(4).fill('groups');

    await page.getByRole('button', { name: /Save SSO Config/i }).click();
    await page.waitForTimeout(800);

    await expect(page.getByText('SAML', { exact: false })).toBeVisible();
  });

  /* ───────── 6. Allowed domains and auto-provision settings ───────── */

  test('6) configure allowed domains, auto-provision and default role', async ({ page }) => {
    await page.goto('/settings/sso');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Fill allowed domains
    const domainsTextarea = page.locator('textarea').filter({ hasText: '' }).first();
    await domainsTextarea.fill('school.edu\ndistrict.org');

    // Toggle auto-provision
    const autoProvisionSwitch = page.locator('div').filter({ hasText: /Auto-provision new staff/i }).locator('button[role="switch"]').first();
    await autoProvisionSwitch.click();
    await page.waitForTimeout(300);

    // Default role select should be enabled
    const roleSelect = page.locator('label').filter({ hasText: /Default Role for Auto-Provisioned Staff/i }).locator('..').locator('button, [role="combobox"]').first();
    await expect(roleSelect).toBeEnabled();

    // Select Principal as default role
    await roleSelect.click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: /Principal/i }).first().click();

    await page.getByRole('button', { name: /Save SSO Config/i }).click();
    await page.waitForTimeout(800);
  });

  /* ───────── 7. Default role select is disabled when auto-provision is off ───────── */

  test('7) default role dropdown is disabled when auto-provision is off', async ({ page }) => {
    await page.goto('/settings/sso');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Ensure auto-provision is off in the initial mock state
    const roleSelect = page.locator('label').filter({ hasText: /Default Role for Auto-Provisioned Staff/i }).locator('..').locator('button, [role="combobox"]').first();
    await expect(roleSelect).toBeDisabled();
  });

  /* ───────── 8. SSO-Only mode shows confirmation dialog ───────── */

  test('8) enabling SSO-Only mode triggers confirmation dialog', async ({ page }) => {
    // Seed with at least one provider enabled
    ssoConfig.google.enabled = true;
    ssoConfig.google.clientId = 'test-client-id';
    ssoConfig.google.hasClientSecret = true;

    await page.goto('/settings/sso');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const ssoOnlySwitch = page.locator('div').filter({ hasText: /SSO-Only Mode/i }).locator('button[role="switch"]').first();
    await ssoOnlySwitch.click();
    await page.waitForTimeout(300);

    // Warning text should appear
    await expect(page.getByText(/High risk/i)).toBeVisible();
    await expect(page.getByText(/You will be asked to confirm before saving/i)).toBeVisible();

    // Click save — should trigger confirmation dialog
    await page.getByRole('button', { name: /Save SSO Config/i }).click();
    await page.waitForTimeout(500);

    // Confirm dialog should appear
    await expect(page.getByRole('dialog').filter({ hasText: /Enable SSO-Only Mode/i })).toBeVisible();
    await expect(page.getByText(/permanently locked out/i)).toBeVisible();

    // Confirm
    const confirmBtn = page.getByRole('button', { name: /Enable SSO-Only/i });
    await confirmBtn.click();
    await page.waitForTimeout(800);

    // Danger chip should appear
    await expect(page.getByText('SSO-Only active')).toBeVisible();
  });

  /* ───────── 9. Secret persistence — blank input keeps existing secret ───────── */

  test('9) leaving secret blank preserves existing saved secret', async ({ page }) => {
    ssoConfig.google.enabled = true;
    ssoConfig.google.clientId = 'existing-client-id';
    ssoConfig.google.hasClientSecret = true;

    await page.goto('/settings/sso');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const googleSection = page.locator('div').filter({ hasText: /^Google Workspace$/ }).first();

    // Secret input should show placeholder indicating a secret exists
    const secretInput = googleSection.locator('input[type="password"]').first();
    const placeholder = await secretInput.getAttribute('placeholder');
    expect(placeholder?.toLowerCase()).toContain('saved');

    // Do NOT fill secret — leave blank
    // Change client ID slightly
    const clientIdInput = googleSection.locator('input[type="text"]').first();
    await clientIdInput.fill('updated-client-id');

    await page.getByRole('button', { name: /Save SSO Config/i }).click();
    await page.waitForTimeout(800);

    // The mock should have preserved hasClientSecret since no new secret was sent
    expect(ssoConfig.google.hasClientSecret).toBe(true);
  });

  /* ───────── 10. Error state when API fails on load ───────── */

  test('10) shows error toast when SSO config fails to load', async ({ page }) => {
    await page.route('**/api/auth/sso/config**', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Internal Server Error' }) });
      }
      await route.continue();
    });

    await page.goto('/settings/sso');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Toast error should appear
    await expect(page.getByText(/Failed to load SSO configuration/i)).toBeVisible();
  });

  /* ───────── 11. Error state when API fails on save ───────── */

  test('11) shows error toast when SSO config save fails', async ({ page }) => {
    await page.route('**/api/auth/sso/config**', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ssoConfig }) });
      }
      if (method === 'PUT' || method === 'POST' || method === 'PATCH') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Save failed', message: 'Database connection error' }) });
      }
      await route.continue();
    });

    await page.goto('/settings/sso');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Toggle Google on and save
    const googleSwitch = page.locator('div').filter({ hasText: /^Google Workspace$/ }).first().locator('button[role="switch"]').first();
    await googleSwitch.click();
    await page.waitForTimeout(300);

    await page.getByRole('button', { name: /Save SSO Config/i }).click();
    await page.waitForTimeout(800);

    await expect(page.getByText(/Failed to save SSO configuration/i)).toBeVisible();
  });

  /* ───────── 12. All three providers enabled chips show correctly ───────── */

  test('12) enabling all three providers shows combined enabled chip', async ({ page }) => {
    ssoConfig.google.enabled = true;
    ssoConfig.google.clientId = 'g-id';
    ssoConfig.google.hasClientSecret = true;
    ssoConfig.microsoft.enabled = true;
    ssoConfig.microsoft.clientId = 'ms-id';
    ssoConfig.microsoft.tenantId = 'ms-tenant';
    ssoConfig.microsoft.hasClientSecret = true;
    ssoConfig.saml.enabled = true;
    ssoConfig.saml.entryPoint = 'https://idp.example.com';
    ssoConfig.saml.issuer = 'example-issuer';
    ssoConfig.saml.hasCert = true;

    await page.goto('/settings/sso');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await expect(page.getByText(/Google, Microsoft, SAML enabled/)).toBeVisible();
  });
});
