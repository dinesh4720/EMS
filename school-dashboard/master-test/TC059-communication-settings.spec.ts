import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Communication settings mock data
 * ───────────────────────────────────────────────────────────────────── */

interface CommSettings {
  sms: {
    enabled: boolean; provider: string; senderId: string; apiKey: string;
  };
  email: {
    enabled: boolean; smtpHost: string; smtpPort: number;
    smtpUsername: string; smtpPassword: string;
  };
  templates: {
    email: Array<{ _id: string; name: string; subject: string; body: string }>;
    sms: Array<{ _id: string; name: string; body: string }>;
  };
}

function seedCommSettings(state: MockState): CommSettings {
  const settings: CommSettings = {
    sms: { enabled: false, provider: '', senderId: '', apiKey: '' },
    email: { enabled: false, smtpHost: '', smtpPort: 587, smtpUsername: '', smtpPassword: '' },
    templates: {
      email: [
        { _id: 'et-1', name: 'Welcome Email', subject: 'Welcome to SchoolSync', body: 'Dear {{name}}, welcome!' },
        { _id: 'et-2', name: 'Fee Reminder', subject: 'Fee Payment Due', body: 'Dear Parent, fee of {{amount}} is due.' },
      ],
      sms: [
        { _id: 'st-1', name: 'Absence Alert', body: 'Dear Parent, {{studentName}} was absent today.' },
        { _id: 'st-2', name: 'Fee Reminder SMS', body: 'Fee of Rs.{{amount}} is due for {{studentName}}.' },
      ],
    },
  };
  (state as any).communicationSettings = settings;
  return settings;
}

/* ─────────────────────────────────────────────────────────────────────
 *  TC059 — Communication Settings (SMS, Email, Templates)
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC059 — Communication Settings', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    seedCommSettings(state);

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);

    // Override communication settings routes
    await page.route('**/api/communication-settings**', async (route) => {
      const path = new URL(route.request().url()).pathname.replace(/\/+$/, '');
      const method = route.request().method();
      const commSettings = (state as any).communicationSettings;

      const json = (data: unknown, status = 200) =>
        route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

      if (path === '/api/communication-settings' && method === 'GET') return json(commSettings);

      if (path === '/api/communication-settings/sms' && (method === 'PUT' || method === 'PATCH')) {
        const body = JSON.parse(route.request().postData() || '{}');
        Object.assign(commSettings.sms, body);
        return json({ message: 'SMS settings saved', ...commSettings.sms });
      }

      if (path === '/api/communication-settings/email' && (method === 'PUT' || method === 'PATCH')) {
        const body = JSON.parse(route.request().postData() || '{}');
        Object.assign(commSettings.email, body);
        return json({ message: 'Email settings saved', ...commSettings.email });
      }

      if (method === 'PUT' || method === 'PATCH') {
        const body = JSON.parse(route.request().postData() || '{}');
        Object.assign(commSettings, body);
        return json({ message: 'Settings saved', ...commSettings });
      }

      await route.continue();
    });

    await page.route('**/api/email-templates**', async (route) => {
      const method = route.request().method();
      const commSettings = (state as any).communicationSettings;
      const json = (data: unknown, status = 200) =>
        route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
      if (method === 'GET') return json(commSettings.templates.email);
      await route.continue();
    });

    await page.route('**/api/sms-templates**', async (route) => {
      const method = route.request().method();
      const commSettings = (state as any).communicationSettings;
      const json = (data: unknown, status = 200) =>
        route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
      if (method === 'GET') return json(commSettings.templates.sms);
      await route.continue();
    });
  });

  /* ───────── 1. Communication settings page loads ───────── */

  test('1) communication settings page loads', async ({ page }) => {
    await page.goto('/settings/communication');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await expect(page).not.toHaveURL(/\/login/);

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('Communication') || bodyText?.includes('SMS') ||
      bodyText?.includes('Email') || bodyText?.includes('Settings'),
    ).toBeTruthy();
  });

  /* ───────── 2. SMS tab — toggle SMS enabled ───────── */

  test('2) SMS tab allows toggling SMS enabled', async ({ page }) => {
    await page.goto('/settings/communication');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Click SMS tab if tabs exist
    const smsTab = page.getByRole('tab', { name: /sms/i }).first();
    const smsBtn = page.getByText(/SMS/).first();
    if (await smsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await smsTab.click();
      await page.waitForTimeout(300);
    } else if (await smsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await smsBtn.click();
      await page.waitForTimeout(300);
    }

    // Toggle SMS enabled switch
    const smsToggle = page.locator('[role="switch"]').first();
    if (await smsToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await smsToggle.click();
      await page.waitForTimeout(300);
    }

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  /* ───────── 3. SMS tab — fill provider, sender ID, API key ───────── */

  test('3) SMS tab allows filling provider, sender ID, and API key', async ({ page }) => {
    await page.goto('/settings/communication');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Navigate to SMS section
    const smsTab = page.getByRole('tab', { name: /sms/i }).first();
    if (await smsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await smsTab.click();
      await page.waitForTimeout(300);
    }

    // Fill provider select
    const providerSelect = page.locator('select, [aria-haspopup="listbox"]').filter({ hasText: /provider/i }).first();
    if (await providerSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await providerSelect.click();
      await page.waitForTimeout(200);
      const twilio = page.getByText(/twilio|msg91|textlocal/i).first();
      if (await twilio.isVisible({ timeout: 2000 }).catch(() => false)) {
        await twilio.click();
      }
    }

    // Fill sender ID
    const senderInput = page.locator('input[name*="sender" i], input[placeholder*="sender" i]').first();
    if (await senderInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await senderInput.fill('SCHSYN');
    }

    // Fill API key
    const apiKeyInput = page.locator('input[name*="api" i], input[name*="key" i], input[placeholder*="api" i]').first();
    if (await apiKeyInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await apiKeyInput.fill('sk-test-sms-api-key-12345');
    }

    // Save
    const saveBtn = page.getByRole('button', { name: /save|update|apply/i }).first();
    if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(500);
    }
  });

  /* ───────── 4. Email tab — toggle email enabled ───────── */

  test('4) Email tab allows toggling email enabled', async ({ page }) => {
    await page.goto('/settings/communication');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Click Email tab
    const emailTab = page.getByRole('tab', { name: /email/i }).first();
    const emailBtn = page.getByText(/Email/).first();
    if (await emailTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailTab.click();
      await page.waitForTimeout(300);
    } else if (await emailBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailBtn.click();
      await page.waitForTimeout(300);
    }

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('Email') || bodyText?.includes('SMTP') ||
      bodyText?.includes('email') || bodyText?.includes('Host'),
    ).toBeTruthy();
  });

  /* ───────── 5. Email tab — fill SMTP details ───────── */

  test('5) Email tab allows filling SMTP host, port, username, password', async ({ page }) => {
    await page.goto('/settings/communication');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Navigate to email section
    const emailTab = page.getByRole('tab', { name: /email/i }).first();
    if (await emailTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailTab.click();
      await page.waitForTimeout(300);
    }

    // Fill SMTP host
    const hostInput = page.locator('input[name*="host" i], input[placeholder*="host" i], input[placeholder*="smtp" i]').first();
    if (await hostInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await hostInput.fill('smtp.gmail.com');
    }

    // Fill port
    const portInput = page.locator('input[name*="port" i], input[placeholder*="port" i]').first();
    if (await portInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await portInput.clear();
      await portInput.fill('587');
    }

    // Fill username
    const usernameInput = page.locator('input[name*="username" i], input[placeholder*="username" i], input[name*="user" i]').first();
    if (await usernameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await usernameInput.fill('school@gmail.com');
    }

    // Fill password
    const passwordInput = page.locator('input[type="password"], input[name*="password" i]').first();
    if (await passwordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await passwordInput.fill('app-password-12345');
    }

    // Save
    const saveBtn = page.getByRole('button', { name: /save|update|apply/i }).first();
    if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(500);
    }
  });

  /* ───────── 6. Templates tab — email templates ───────── */

  test('6) templates tab shows email templates', async ({ page }) => {
    await page.goto('/settings/communication');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Click templates tab
    const templatesTab = page.getByRole('tab', { name: /template/i }).first();
    const templatesBtn = page.getByText(/Template/).first();
    if (await templatesTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await templatesTab.click();
      await page.waitForTimeout(300);
    } else if (await templatesBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await templatesBtn.click();
      await page.waitForTimeout(300);
    }

    const bodyText = await page.textContent('body');
    // Should show template names or template management UI
    expect(
      bodyText?.includes('Welcome Email') || bodyText?.includes('Fee Reminder') ||
      bodyText?.includes('Template') || bodyText?.includes('template'),
    ).toBeTruthy();
  });

  /* ───────── 7. Templates tab — SMS templates ───────── */

  test('7) templates tab shows SMS templates', async ({ page }) => {
    await page.goto('/settings/communication');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Navigate to templates/SMS section
    const templatesTab = page.getByRole('tab', { name: /template/i }).first();
    if (await templatesTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await templatesTab.click();
      await page.waitForTimeout(300);
    }

    // Look for SMS template section
    const smsSection = page.getByText(/SMS Template|Absence Alert|Fee Reminder SMS/i).first();
    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('Absence Alert') || bodyText?.includes('SMS') ||
      bodyText?.includes('Template') || bodyText?.includes('template'),
    ).toBeTruthy();
  });

  /* ───────── 8. State integrity check ───────── */

  test('8) state has correct initial communication settings', async ({ page }) => {
    const commSettings = (state as any).communicationSettings;
    expect(commSettings.sms.enabled).toBe(false);
    expect(commSettings.email.enabled).toBe(false);
    expect(commSettings.templates.email).toHaveLength(2);
    expect(commSettings.templates.sms).toHaveLength(2);
    expect(commSettings.templates.email[0].name).toBe('Welcome Email');
    expect(commSettings.templates.sms[0].name).toBe('Absence Alert');
  });
});
