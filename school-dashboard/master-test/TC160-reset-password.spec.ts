/**
 * TC160 — Reset Password Page
 *
 * Covers the public password-reset flow reached from email links.
 * Token is delivered in the URL hash fragment (#token=...) for security.
 *
 * Coverage:
 * - TC160.1: Happy path — valid token, strong password, success redirect
 * - TC160.2: Missing token — shows "Invalid reset link" error page
 * - TC160.3: Expired/used token (410) — shows "Token expired" error page
 * - TC160.4: Invalid token (401) — shows token expired error page
 * - TC160.5: Client validation — password too short
 * - TC160.6: Client validation — password missing uppercase/lowercase/number
 * - TC160.7: Client validation — passwords do not match
 * - TC160.8: Password visibility toggle works
 * - TC160.9: Password strength meter renders and updates
 * - TC160.10: Server error (500) during submit shows error message
 * - TC160.11: Network failure shows network error message
 * - TC160.12: Accessibility — aria-invalid, aria-describedby on errors
 * - TC160.13: Accessibility — aria-busy on submit button while loading
 * - TC160.14: Back-to-login link present and navigates correctly
 */
import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Helpers
 * ───────────────────────────────────────────────────────────────────── */

async function installResetPasswordRoutes(page: import('@playwright/test').Page) {
  // Mock /auth/reset-password — success for strong passwords with valid token
  await page.route('**/auth/reset-password', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.token === 'expired-token') {
      return route.fulfill({
        status: 410,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Reset token has expired or already been used.' }),
      });
    }
    if (body.token === 'invalid-token') {
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid reset token.' }),
      });
    }
    if (body.token === 'server-error-token') {
      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error. Please try again later.' }),
      });
    }
    if (body.token === 'network-error-token') {
      return route.abort('internetdisconnected');
    }
    // Valid token
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Password reset successful' }),
    });
  });
}

/* ─────────────────────────────────────────────────────────────────────
 *  Tests
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC160 — Reset Password', () => {
  test.beforeEach(async ({ page }) => {
    await installResetPasswordRoutes(page);
  });

  /* ── TC160.1: Happy path ── */
  test('happy path — valid token, strong password, success redirect to login', async ({ page }) => {
    await page.goto('/reset-password#token=valid-reset-token-123');
    await page.waitForLoadState('networkidle');

    // Page should show the reset form (not error state)
    const heading = page.getByRole('heading', { name: /set a new password/i });
    await expect(heading).toBeVisible();

    // Fill new password
    const newPwdInput = page.locator('#reset-new');
    await newPwdInput.fill('StrongPass123');

    // Fill confirm password
    const confirmPwdInput = page.locator('#reset-confirm');
    await confirmPwdInput.fill('StrongPass123');

    // Submit
    const submitBtn = page.getByRole('button', { name: /reset password/i });
    await submitBtn.click();

    // Wait for success toast or navigation
    await page.waitForURL('/login', { timeout: 8000 });
    expect(page.url()).toContain('/login');
  });

  /* ── TC160.2: Missing token ── */
  test('missing token — shows invalid reset link error page', async ({ page }) => {
    await page.goto('/reset-password');
    await page.waitForLoadState('networkidle');

    const heading = page.getByRole('heading', { name: /reset link unavailable/i });
    await expect(heading).toBeVisible();

    await expect(page.getByText(/missing or invalid/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /back to login/i })).toBeVisible();
  });

  /* ── TC160.3: Expired token (410) ── */
  test('expired token — shows token expired error page', async ({ page }) => {
    await page.goto('/reset-password#token=expired-token');
    await page.waitForLoadState('networkidle');

    // Fill form first so the component attempts the API call
    const newPwdInput = page.locator('#reset-new');
    await newPwdInput.fill('StrongPass123');
    const confirmPwdInput = page.locator('#reset-confirm');
    await confirmPwdInput.fill('StrongPass123');

    const submitBtn = page.getByRole('button', { name: /reset password/i });
    await submitBtn.click();

    // After 410, the page should switch to the expired state
    const heading = page.getByRole('heading', { name: /reset link unavailable/i });
    await expect(heading).toBeVisible({ timeout: 5000 });

    await expect(page.getByText(/expired or has already been used/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /back to login/i })).toBeVisible();
  });

  /* ── TC160.4: Invalid token (401) ── */
  test('invalid token — shows token expired error page on 401', async ({ page }) => {
    await page.goto('/reset-password#token=invalid-token');
    await page.waitForLoadState('networkidle');

    const newPwdInput = page.locator('#reset-new');
    await newPwdInput.fill('StrongPass123');
    const confirmPwdInput = page.locator('#reset-confirm');
    await confirmPwdInput.fill('StrongPass123');

    const submitBtn = page.getByRole('button', { name: /reset password/i });
    await submitBtn.click();

    const heading = page.getByRole('heading', { name: /reset link unavailable/i });
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  /* ── TC160.5: Client validation — password too short ── */
  test('client validation — rejects password shorter than 8 characters', async ({ page }) => {
    await page.goto('/reset-password#token=valid-token');
    await page.waitForLoadState('networkidle');

    const newPwdInput = page.locator('#reset-new');
    await newPwdInput.fill('Short1');

    const confirmPwdInput = page.locator('#reset-confirm');
    await confirmPwdInput.fill('Short1');

    const submitBtn = page.getByRole('button', { name: /reset password/i });
    await submitBtn.click();

    // Should show validation error and NOT call the API
    const errorMsg = page.locator('#reset-new-err');
    await expect(errorMsg).toBeVisible();
    const errorText = await errorMsg.textContent();
    expect(errorText?.toLowerCase()).toContain('at least 8');
  });

  /* ── TC160.6: Client validation — password missing required character types ── */
  test('client validation — rejects weak password patterns', async ({ page }) => {
    await page.goto('/reset-password#token=valid-token');
    await page.waitForLoadState('networkidle');

    const newPwdInput = page.locator('#reset-new');
    const confirmPwdInput = page.locator('#reset-confirm');
    const submitBtn = page.getByRole('button', { name: /reset password/i });

    // Missing uppercase
    await newPwdInput.fill('lowercase123');
    await confirmPwdInput.fill('lowercase123');
    await submitBtn.click();
    await expect(page.locator('#reset-new-err')).toContainText(/uppercase/i);

    // Missing lowercase
    await newPwdInput.fill('UPPERCASE123');
    await confirmPwdInput.fill('UPPERCASE123');
    await submitBtn.click();
    await expect(page.locator('#reset-new-err')).toContainText(/lowercase/i);

    // Missing number
    await newPwdInput.fill('NoNumbersHere');
    await confirmPwdInput.fill('NoNumbersHere');
    await submitBtn.click();
    await expect(page.locator('#reset-new-err')).toContainText(/number/i);
  });

  /* ── TC160.7: Client validation — passwords do not match ── */
  test('client validation — rejects mismatched confirm password', async ({ page }) => {
    await page.goto('/reset-password#token=valid-token');
    await page.waitForLoadState('networkidle');

    await page.locator('#reset-new').fill('StrongPass123');
    await page.locator('#reset-confirm').fill('DifferentPass456');

    const submitBtn = page.getByRole('button', { name: /reset password/i });
    await submitBtn.click();

    const errorMsg = page.locator('#reset-confirm-err');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText(/do not match/i);
  });

  /* ── TC160.8: Password visibility toggle ── */
  test('password visibility toggle shows and hides password text', async ({ page }) => {
    await page.goto('/reset-password#token=valid-token');
    await page.waitForLoadState('networkidle');

    const newPwdInput = page.locator('#reset-new');
    const toggleBtn = page.locator('button[aria-label*="password" i], button[aria-label*="show" i], button[aria-label*="hide" i]').first();

    await newPwdInput.fill('Secret123');
    await expect(newPwdInput).toHaveAttribute('type', 'password');

    // Click toggle to show
    await toggleBtn.click();
    await expect(newPwdInput).toHaveAttribute('type', 'text');

    // Click toggle to hide
    await toggleBtn.click();
    await expect(newPwdInput).toHaveAttribute('type', 'password');
  });

  /* ── TC160.9: Password strength meter ── */
  test('password strength meter updates as user types', async ({ page }) => {
    await page.goto('/reset-password#token=valid-token');
    await page.waitForLoadState('networkidle');

    const newPwdInput = page.locator('#reset-new');
    const meter = page.locator('[aria-live="polite"]').first();

    // Empty — meter should not be visible
    await expect(meter).not.toBeVisible();

    // Weak (1 criterion)
    await newPwdInput.fill('short');
    await expect(meter).toBeVisible();
    const weakLabel = meter.locator('p');
    await expect(weakLabel).toContainText(/weak|fair/i);

    // Strong (all 5 criteria)
    await newPwdInput.fill('StrongPass123!');
    const strongLabel = meter.locator('p');
    await expect(strongLabel).toContainText(/strong|very strong/i);
  });

  /* ── TC160.10: Server error (500) ── */
  test('server error 500 shows error alert without redirect', async ({ page }) => {
    await page.goto('/reset-password#token=server-error-token');
    await page.waitForLoadState('networkidle');

    await page.locator('#reset-new').fill('StrongPass123');
    await page.locator('#reset-confirm').fill('StrongPass123');

    const submitBtn = page.getByRole('button', { name: /reset password/i });
    await submitBtn.click();

    const alert = page.locator('[role="alert"]').filter({ hasText: /internal server error|please try again later/i });
    await expect(alert).toBeVisible({ timeout: 5000 });

    // Should remain on the reset page
    expect(page.url()).toContain('/reset-password');
  });

  /* ── TC160.11: Network failure ── */
  test('network failure shows network error message', async ({ page }) => {
    await page.goto('/reset-password#token=network-error-token');
    await page.waitForLoadState('networkidle');

    await page.locator('#reset-new').fill('StrongPass123');
    await page.locator('#reset-confirm').fill('StrongPass123');

    const submitBtn = page.getByRole('button', { name: /reset password/i });
    await submitBtn.click();

    const alert = page.locator('[role="alert"]').filter({ hasText: /network error|check your connection/i });
    await expect(alert).toBeVisible({ timeout: 5000 });
  });

  /* ── TC160.12: Accessibility — aria-invalid and aria-describedby ── */
  test('accessibility — error messages linked to inputs via aria-describedby', async ({ page }) => {
    await page.goto('/reset-password#token=valid-token');
    await page.waitForLoadState('networkidle');

    const newPwdInput = page.locator('#reset-new');
    const confirmPwdInput = page.locator('#reset-confirm');

    // Submit empty form to trigger errors
    await page.getByRole('button', { name: /reset password/i }).click();

    // New password should have aria-invalid and aria-describedby
    await expect(newPwdInput).toHaveAttribute('aria-invalid', 'true');
    const describedBy = await newPwdInput.getAttribute('aria-describedby');
    expect(describedBy).toBe('reset-new-err');
    await expect(page.locator('#reset-new-err')).toBeVisible();

    // Confirm password should also have aria-invalid
    await expect(confirmPwdInput).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#reset-confirm-err')).toBeVisible();
  });

  /* ── TC160.13: Accessibility — aria-busy on submit button ── */
  test('accessibility — submit button has aria-busy while loading', async ({ page }) => {
    await page.goto('/reset-password#token=valid-token');
    await page.waitForLoadState('networkidle');

    await page.locator('#reset-new').fill('StrongPass123');
    await page.locator('#reset-confirm').fill('StrongPass123');

    const submitBtn = page.getByRole('button', { name: /reset password/i });

    // Intercept the API call and delay it so we can inspect the loading state
    await page.route('**/auth/reset-password', async (route) => {
      await new Promise((r) => setTimeout(r, 500));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Password reset successful' }),
      });
    });

    await submitBtn.click();

    // Button should show loading state with aria-busy
    await expect(submitBtn).toHaveAttribute('aria-busy', 'true');
    await expect(submitBtn).toBeDisabled();
  });

  /* ── TC160.14: Back-to-login link ── */
  test('back-to-login link navigates to login page', async ({ page }) => {
    await page.goto('/reset-password#token=valid-token');
    await page.waitForLoadState('networkidle');

    const backLink = page.getByRole('link', { name: /back to login/i });
    await expect(backLink).toBeVisible();
    await backLink.click();

    await page.waitForURL('/login', { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });

  /* ── TC160.15: Empty confirm password shows required error ── */
  test('client validation — empty confirm password shows required error', async ({ page }) => {
    await page.goto('/reset-password#token=valid-token');
    await page.waitForLoadState('networkidle');

    await page.locator('#reset-new').fill('StrongPass123');
    // Leave confirm empty

    const submitBtn = page.getByRole('button', { name: /reset password/i });
    await submitBtn.click();

    const errorMsg = page.locator('#reset-confirm-err');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText(/confirm|required/i);
  });
});
