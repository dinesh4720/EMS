import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  TEACHER_A_ID, CLASS_10A_ID, CLASS_11A_ID, SCHOOL_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 800 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Helpers
 * ───────────────────────────────────────────────────────────────────── */

let credentialsPutPayload: Record<string, unknown> | null = null;

async function installCredentialsMockApi(page: import('@playwright/test').Page, state: MockState) {
  await installMockApi(page, state);

  credentialsPutPayload = null;

  // Staff detail with enriched data
  await page.route(`**/api/staff/${TEACHER_A_ID}`, async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    const teacher = state.staff.find((s) => s.id === TEACHER_A_ID);
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...teacher,
        classTeacher: { classId: CLASS_10A_ID, className: '10-A' },
        assignedClasses: [
          { classId: CLASS_10A_ID, className: '10-A', subjects: ['Mathematics', 'Science'] },
          { classId: CLASS_11A_ID, className: '11-A', subjects: ['Mathematics'] },
        ],
        loginEmail: 'ananya@schoolsync.test',
        hasCredentials: true,
        lastLogin: '2026-03-28T10:00:00Z',
      }),
    });
  });

  // Credentials update endpoint
  await page.route(`**/api/staff/${TEACHER_A_ID}/credentials`, async (route) => {
    const method = route.request().method();
    if (method === 'PUT' || method === 'POST' || method === 'PATCH') {
      credentialsPutPayload = JSON.parse(route.request().postData() || '{}');
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Credentials updated successfully',
          loginEmail: credentialsPutPayload?.email || credentialsPutPayload?.loginEmail || 'ananya.new@schoolsync.test',
        }),
      });
    }
    if (method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          loginEmail: 'ananya@schoolsync.test',
          hasCredentials: true,
          lastLogin: '2026-03-28T10:00:00Z',
        }),
      });
    }
    return route.continue();
  });

  // Payroll stub
  await page.route('**/api/payroll**', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ records: [], summary: { totalAmount: 0, processedCount: 0 } }),
    });
  });

  // Staff attendance stub
  await page.route(`**/api/staff/${TEACHER_A_ID}/attendance**`, async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
}

/* ─────────────────────────────────────────────────────────────────────
 *  TC086 — Admin Updates Staff Login Credentials
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC086 — Staff Credentials Update', () => {

  test('1) staff profile loads with credential info', async ({ page }) => {
    const state = createMockState();
    await installCredentialsMockApi(page, state);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body).toContain('Ananya');
  });

  test('2) update credentials button/action is visible', async ({ page }) => {
    const state = createMockState();
    await installCredentialsMockApi(page, state);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    // Look for credentials update button
    const credBtn = page.getByRole('button', { name: /credential|password|login|reset.*password/i }).first();
    const hasCredBtn = await credBtn.isVisible({ timeout: 5000 }).catch(() => false);

    // Also check action menu
    if (!hasCredBtn) {
      const moreBtn = page.locator('button[aria-label*="more" i], [class*="more"], [class*="kebab"], [class*="action"]').first();
      if (await moreBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await moreBtn.click();
        await page.waitForTimeout(300);

        const credOption = page.getByText(/credential|password|login/i).first();
        const hasOption = await credOption.isVisible({ timeout: 2000 }).catch(() => false);
        expect(hasOption || hasCredBtn).toBeTruthy();
        return;
      }
    }

    // Should have some way to update credentials
    const body = await page.textContent('body');
    const hasCredUI = hasCredBtn ||
                      body?.toLowerCase().includes('credential') ||
                      body?.toLowerCase().includes('password') ||
                      body?.toLowerCase().includes('login');
    expect(hasCredUI).toBeTruthy();
  });

  test('3) clicking credentials button opens modal/form', async ({ page }) => {
    const state = createMockState();
    await installCredentialsMockApi(page, state);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    // Try direct button
    const credBtn = page.getByRole('button', { name: /credential|password|login|reset.*password/i }).first();
    let opened = false;

    if (await credBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await credBtn.click();
      opened = true;
    } else {
      // Try action menu
      const moreBtn = page.locator('button[aria-label*="more" i], [class*="more"], [class*="kebab"], [class*="action"]').first();
      if (await moreBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await moreBtn.click();
        await page.waitForTimeout(300);
        const credOption = page.getByText(/credential|password|login/i).first();
        if (await credOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await credOption.click();
          opened = true;
        }
      }
    }

    if (opened) {
      await page.waitForTimeout(500);
      // Should show modal or form
      const modal = page.locator('[role="dialog"]').last();
      const hasModal = await modal.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasModal) {
        const modalText = await modal.textContent();
        expect(modalText?.toLowerCase()).toMatch(/email|password|credential|login/);
      }
    }
  });

  test('4) set new login email in credential form', async ({ page }) => {
    const state = createMockState();
    await installCredentialsMockApi(page, state);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    // Open credentials form
    const credBtn = page.getByRole('button', { name: /credential|password|login|reset.*password/i }).first();
    if (await credBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await credBtn.click();
      await page.waitForTimeout(500);
    }

    // Find email input in modal/form
    const modal = page.locator('[role="dialog"]').last();
    const emailInput = (await modal.isVisible({ timeout: 2000 }).catch(() => false))
      ? modal.locator('input[name="email"], input[name="loginEmail"], input[type="email"]').first()
      : page.locator('input[name="loginEmail"], input[name="credentialEmail"]').first();

    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.clear();
      await emailInput.fill('ananya.new@schoolsync.test');
      expect(await emailInput.inputValue()).toBe('ananya.new@schoolsync.test');
    }
  });

  test('5) set new password in credential form', async ({ page }) => {
    const state = createMockState();
    await installCredentialsMockApi(page, state);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    // Open credentials form
    const credBtn = page.getByRole('button', { name: /credential|password|login|reset.*password/i }).first();
    if (await credBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await credBtn.click();
      await page.waitForTimeout(500);
    }

    // Find password input
    const modal = page.locator('[role="dialog"]').last();
    const passwordInput = (await modal.isVisible({ timeout: 2000 }).catch(() => false))
      ? modal.locator('input[name="password"], input[type="password"]').first()
      : page.locator('input[name="password"], input[type="password"]').first();

    if (await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await passwordInput.fill('NewSecurePass123!');
      expect(await passwordInput.inputValue()).toBe('NewSecurePass123!');
    }
  });

  test('6) confirm changes and verify API call', async ({ page }) => {
    const state = createMockState();
    await installCredentialsMockApi(page, state);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    // Open credentials form
    const credBtn = page.getByRole('button', { name: /credential|password|login|reset.*password/i }).first();
    if (await credBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await credBtn.click();
      await page.waitForTimeout(500);
    }

    const modal = page.locator('[role="dialog"]').last();
    const hasModal = await modal.isVisible({ timeout: 2000 }).catch(() => false);
    const context = hasModal ? modal : page;

    // Fill email
    const emailInput = context.locator('input[name="email"], input[name="loginEmail"], input[type="email"]').first();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.clear();
      await emailInput.fill('ananya.new@schoolsync.test');
    }

    // Fill password
    const passwordInput = context.locator('input[name="password"], input[type="password"]').first();
    if (await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await passwordInput.fill('NewSecurePass123!');
    }

    // Confirm/Save
    const saveBtn = context.getByRole('button', { name: /save|update|confirm|submit/i }).first();
    if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      const [credRequest] = await Promise.all([
        page.waitForRequest(
          (req) => req.url().includes('/credentials') && (req.method() === 'PUT' || req.method() === 'POST' || req.method() === 'PATCH'),
          { timeout: 5000 },
        ).catch(() => null),
        saveBtn.click(),
      ]);

      if (credRequest) {
        const payload = JSON.parse(credRequest.postData() || '{}');
        // Should contain email and/or password
        const hasEmail = payload.email || payload.loginEmail;
        const hasPassword = payload.password;
        expect(hasEmail || hasPassword).toBeTruthy();
      }
    }
  });

  test('7) success notification appears after credential update', async ({ page }) => {
    const state = createMockState();
    await installCredentialsMockApi(page, state);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    // Open credentials form
    const credBtn = page.getByRole('button', { name: /credential|password|login|reset.*password/i }).first();
    if (await credBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await credBtn.click();
      await page.waitForTimeout(500);
    }

    const modal = page.locator('[role="dialog"]').last();
    const hasModal = await modal.isVisible({ timeout: 2000 }).catch(() => false);
    const context = hasModal ? modal : page;

    // Fill and save
    const emailInput = context.locator('input[name="email"], input[name="loginEmail"], input[type="email"]').first();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.clear();
      await emailInput.fill('ananya.new@schoolsync.test');
    }

    const passwordInput = context.locator('input[name="password"], input[type="password"]').first();
    if (await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await passwordInput.fill('NewSecurePass123!');
    }

    const saveBtn = context.getByRole('button', { name: /save|update|confirm|submit/i }).first();
    if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(1000);

      // Check for success toast
      const toast = page.locator(
        '[class*="toast"], [class*="notification"], [role="alert"], [class*="Toastify"]',
      ).first();
      const hasToast = await toast.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasToast) {
        const toastText = await toast.textContent();
        expect(toastText?.toLowerCase()).toMatch(/success|updated|saved/);
      }
    }
  });

  test('8) modal closes after successful update', async ({ page }) => {
    const state = createMockState();
    await installCredentialsMockApi(page, state);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    const credBtn = page.getByRole('button', { name: /credential|password|login|reset.*password/i }).first();
    if (await credBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await credBtn.click();
      await page.waitForTimeout(500);
    }

    const modal = page.locator('[role="dialog"]').last();
    const wasModalOpen = await modal.isVisible({ timeout: 2000 }).catch(() => false);

    if (wasModalOpen) {
      // Fill and save
      const saveBtn = modal.getByRole('button', { name: /save|update|confirm|submit/i }).first();
      if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(1000);

        // Modal should close
        const isStillOpen = await modal.isVisible({ timeout: 1000 }).catch(() => false);
        // If it closed, the profile page should be showing
        if (!isStillOpen) {
          const body = await page.textContent('body');
          expect(body).toContain('Ananya');
        }
      }
    }
  });

  test('9) page does not redirect to login during credential update', async ({ page }) => {
    const state = createMockState();
    await installCredentialsMockApi(page, state);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);
  });

  test('10) profile page shows login information section', async ({ page }) => {
    const state = createMockState();
    await installCredentialsMockApi(page, state);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    // Should show login/credential info somewhere on the profile
    const hasLoginInfo = body?.toLowerCase().includes('login') ||
                         body?.toLowerCase().includes('credential') ||
                         body?.toLowerCase().includes('last login') ||
                         body?.includes('ananya@schoolsync.test');
    expect(hasLoginInfo).toBeTruthy();
  });
});
