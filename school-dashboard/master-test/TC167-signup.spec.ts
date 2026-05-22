/**
 * TC167: Invite-based Signup — Comprehensive E2E Coverage
 *
 * Verifies the full invite-based signup flow: invite token validation,
 * form field validation, password strength meter, terms acceptance,
 * successful account creation, and error states.
 *
 * Context: Indian CBSE school — admin invites a new principal via email.
 */
import { expect, test } from '@playwright/test';

/* ─────────────────────────────────────────────────────────────────────
 *  Constants
 * ───────────────────────────────────────────────────────────────────── */

const VALID_INVITE_TOKEN = 'inv-001-valid-token-abc123';
const EXPIRED_INVITE_TOKEN = 'inv-002-expired-token-def456';
const MOCK_INVITE = {
  email: 'principal.v Sharma@davschool.test',
  schoolName: 'D.A.V. Public School, Bangalore',
  invitedBy: 'Dinesh Admin',
  role: 'principal',
};

const VALID_PASSWORD = 'SecurePass@2026';

/* ─────────────────────────────────────────────────────────────────────
 *  Helpers
 * ───────────────────────────────────────────────────────────────────── */

/**
 * Mocks the invite-details endpoint and the signup POST endpoint.
 */
async function mockSignupEndpoints(page: import('@playwright/test').Page) {
  // Catch-all for any other API calls during signup page load
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    if (/\.(js|ts|jsx|tsx|css|map|html|svg|png|jpg|woff2?)(\?|$)/i.test(url.pathname)) {
      return route.continue();
    }
    if (url.pathname.includes('/auth/signup')) {
      return route.fallback();
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
  });

  // Mock /auth/signup/invite-details
  await page.route('**/auth/signup/invite-details**', async (route) => {
    const url = new URL(route.request().url());
    const token = url.searchParams.get('token');

    if (token === VALID_INVITE_TOKEN) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ invite: MOCK_INVITE }),
      });
    } else if (token === EXPIRED_INVITE_TOKEN) {
      await route.fulfill({
        status: 410,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'This invite link has expired. Please ask your administrator to send a new invitation.' }),
      });
    } else {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid or expired invite token' }),
      });
    }
  });

  // Mock /auth/signup
  await page.route('**/auth/signup', async (route) => {
    const method = route.request().method();
    if (method !== 'POST') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    }

    const body = JSON.parse(route.request().postData() || '{}');

    // Simulate duplicate email error
    if (body.email === 'existing@davschool.test') {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'An account with this email already exists.' }),
      });
      return;
    }

    // Simulate generic server error
    if (body.email === 'error@davschool.test') {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error. Please try again later.' }),
      });
      return;
    }

    // Success
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'user-new-001',
        _id: 'user-new-001',
        name: body.name,
        email: body.email,
        role: 'principal',
        token: 'mock-jwt-principal-001',
        schoolId: 'school-dav-001',
      }),
    });
  });

  // Mock /auth/session — always unauthenticated for signup flows
  await page.route('**/auth/session', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Unauthorized' }),
    });
  });
}

/**
 * Clears all auth state so the signup page treats the browser as logged-out.
 */
async function clearAuthState(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    sessionStorage.clear();
    localStorage.removeItem('app_user');
    localStorage.setItem(
      'ems_cookie_consent',
      JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
    );
    localStorage.setItem('ems_coach_marks_v1', JSON.stringify({ shell: Date.now() }));
  });
}

/* ─────────────────────────────────────────────────────────────────────
 *  Tests
 * ───────────────────────────────────────────────────────────────────── */

test.use({ viewport: { width: 1280, height: 720 } });

test.describe('TC167: Invite-based Signup — Comprehensive E2E', () => {
  /* ───────── 1. No invite token ───────── */
  test('1) signup without invite token shows invite-required error', async ({ page }) => {
    await clearAuthState(page);
    await mockSignupEndpoints(page);

    await page.goto('/signup');
    await page.locator('.auth-form__inner').waitFor({ state: 'visible', timeout: 10_000 });

    // Should show the invite-required alert
    const alert = page.locator('[role="alert"]').first();
    await expect(alert).toBeVisible({ timeout: 5_000 });

    const alertText = await alert.textContent();
    expect(alertText?.toLowerCase()).toMatch(/invite|required|token|link/i);

    // Back-to-login button should be visible
    const backBtn = page.getByRole('button', { name: /back to login|sign in|log in/i }).first();
    await expect(backBtn).toBeVisible();
  });

  /* ───────── 2. Valid invite token loads form with pre-filled data ───────── */
  test('2) valid invite token pre-fills email and school name', async ({ page }) => {
    await clearAuthState(page);
    await mockSignupEndpoints(page);

    await page.goto(`/signup?inviteToken=${VALID_INVITE_TOKEN}`);
    await page.locator('.auth-form__inner').waitFor({ state: 'visible', timeout: 10_000 });

    // Wait for invite validation to complete
    await page.waitForTimeout(600);

    // Email field should be pre-filled and disabled
    const emailInput = page.locator('#signup-email');
    await expect(emailInput).toBeVisible({ timeout: 5_000 });
    await expect(emailInput).toHaveValue(MOCK_INVITE.email);
    await expect(emailInput).toBeDisabled();

    // School name field should be pre-filled and disabled
    const schoolInput = page.locator('#signup-school');
    await expect(schoolInput).toBeVisible();
    await expect(schoolInput).toHaveValue(MOCK_INVITE.schoolName);
    await expect(schoolInput).toBeDisabled();

    // Invite verified banner should be visible
    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/invite verified|verified|welcome/i);
  });

  /* ───────── 3. Invalid invite token shows error ───────── */
  test('3) invalid invite token shows error message', async ({ page }) => {
    await clearAuthState(page);
    await mockSignupEndpoints(page);

    await page.goto('/signup?inviteToken=totally-invalid-token');
    await page.locator('.auth-form__inner').waitFor({ state: 'visible', timeout: 10_000 });

    // Wait for validation to finish
    await page.waitForTimeout(600);

    const alert = page.locator('[role="alert"]').first();
    await expect(alert).toBeVisible({ timeout: 5_000 });

    const alertText = await alert.textContent();
    expect(alertText?.toLowerCase()).toMatch(/invalid|expired|error/i);
  });

  /* ───────── 4. Expired invite token shows specific error ───────── */
  test('4) expired invite token shows expired message', async ({ page }) => {
    await clearAuthState(page);
    await mockSignupEndpoints(page);

    await page.goto(`/signup?inviteToken=${EXPIRED_INVITE_TOKEN}`);
    await page.locator('.auth-form__inner').waitFor({ state: 'visible', timeout: 10_000 });

    await page.waitForTimeout(600);

    const alert = page.locator('[role="alert"]').first();
    await expect(alert).toBeVisible({ timeout: 5_000 });

    const alertText = await alert.textContent();
    expect(alertText?.toLowerCase()).toMatch(/expired|ask.*administrator|new invitation/i);
  });

  /* ───────── 5. Full name validation ───────── */
  test('5) full name is required and must be at least 2 characters', async ({ page }) => {
    await clearAuthState(page);
    await mockSignupEndpoints(page);

    await page.goto(`/signup?inviteToken=${VALID_INVITE_TOKEN}`);
    await page.locator('.auth-form__inner').waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(600);

    const fullNameInput = page.locator('#signup-fullname');
    await expect(fullNameInput).toBeVisible();

    // Try submitting with empty name
    await fullNameInput.fill('');
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    const errorText = await page.locator('#signup-fullname-err').textContent();
    expect(errorText?.toLowerCase()).toMatch(/name.*required|name.*2 characters|invalid/i);

    // Try single character
    await fullNameInput.fill('A');
    await submitBtn.click();

    const errorText2 = await page.locator('#signup-fullname-err').textContent();
    expect(errorText2?.toLowerCase()).toMatch(/name.*2 characters|too short/i);
  });

  /* ───────── 6. Password validation rules ───────── */
  test('6) password must meet complexity requirements', async ({ page }) => {
    await clearAuthState(page);
    await mockSignupEndpoints(page);

    await page.goto(`/signup?inviteToken=${VALID_INVITE_TOKEN}`);
    await page.locator('.auth-form__inner').waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(600);

    const passwordInput = page.locator('#signup-password');
    const submitBtn = page.locator('button[type="submit"]');
    await expect(passwordInput).toBeVisible();

    // Too short
    await passwordInput.fill('short');
    await submitBtn.click();
    let errorText = await page.locator('#signup-password-err').textContent();
    expect(errorText?.toLowerCase()).toMatch(/8 characters|at least 8/i);

    // Missing uppercase
    await passwordInput.fill('lowercase1');
    await submitBtn.click();
    errorText = await page.locator('#signup-password-err').textContent();
    expect(errorText?.toLowerCase()).toMatch(/uppercase/i);

    // Missing lowercase
    await passwordInput.fill('UPPERCASE1');
    await submitBtn.click();
    errorText = await page.locator('#signup-password-err').textContent();
    expect(errorText?.toLowerCase()).toMatch(/lowercase/i);

    // Missing number
    await passwordInput.fill('NoNumberHere');
    await submitBtn.click();
    errorText = await page.locator('#signup-password-err').textContent();
    expect(errorText?.toLowerCase()).toMatch(/number|digit/i);
  });

  /* ───────── 7. Password strength meter updates ───────── */
  test('7) password strength meter reflects password quality', async ({ page }) => {
    await clearAuthState(page);
    await mockSignupEndpoints(page);

    await page.goto(`/signup?inviteToken=${VALID_INVITE_TOKEN}`);
    await page.locator('.auth-form__inner').waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(600);

    const passwordInput = page.locator('#signup-password');
    await expect(passwordInput).toBeVisible();

    // Empty password — meter should not be visible
    let meterVisible = await page.locator('[aria-live="polite"]').first().isVisible({ timeout: 2_000 }).catch(() => false);
    expect(meterVisible).toBeFalsy();

    // Weak password (only lowercase)
    await passwordInput.fill('weak');
    await page.waitForTimeout(300);
    const bodyText1 = await page.textContent('body');
    expect(bodyText1?.toLowerCase()).toMatch(/weak|fair|good|strong/);

    // Strong password
    await passwordInput.fill(VALID_PASSWORD);
    await page.waitForTimeout(300);
    const bodyText2 = await page.textContent('body');
    expect(bodyText2?.toLowerCase()).toMatch(/strong|very strong/);
  });

  /* ───────── 8. Password visibility toggle ───────── */
  test('8) password and confirm password visibility toggles work', async ({ page }) => {
    await clearAuthState(page);
    await mockSignupEndpoints(page);

    await page.goto(`/signup?inviteToken=${VALID_INVITE_TOKEN}`);
    await page.locator('.auth-form__inner').waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(600);

    const passwordInput = page.locator('#signup-password');
    const confirmInput = page.locator('#signup-confirm');

    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(confirmInput).toHaveAttribute('type', 'password');

    // Toggle password visibility
    const pwToggle = passwordInput.locator('..').locator('button[aria-label*="password" i], button[aria-label*="show" i], button[aria-label*="hide" i], button.field__action').first();
    await pwToggle.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Toggle confirm password visibility
    const confirmToggle = confirmInput.locator('..').locator('button[aria-label*="password" i], button[aria-label*="show" i], button[aria-label*="hide" i], button.field__action').first();
    await confirmToggle.click();
    await expect(confirmInput).toHaveAttribute('type', 'text');
  });

  /* ───────── 9. Confirm password must match ───────── */
  test('9) confirm password must match password', async ({ page }) => {
    await clearAuthState(page);
    await mockSignupEndpoints(page);

    await page.goto(`/signup?inviteToken=${VALID_INVITE_TOKEN}`);
    await page.locator('.auth-form__inner').waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(600);

    await page.locator('#signup-password').fill(VALID_PASSWORD);
    await page.locator('#signup-confirm').fill('DifferentPass@1');

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    const errorText = await page.locator('#signup-confirm-err').textContent();
    expect(errorText?.toLowerCase()).toMatch(/passwords do not match|do not match|mismatch/i);
  });

  /* ───────── 10. Terms checkbox is required ───────── */
  test('10) terms checkbox must be checked before signup', async ({ page }) => {
    await clearAuthState(page);
    await mockSignupEndpoints(page);

    await page.goto(`/signup?inviteToken=${VALID_INVITE_TOKEN}`);
    await page.locator('.auth-form__inner').waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(600);

    // Fill valid data but leave terms unchecked
    await page.locator('#signup-fullname').fill('Vikram Sharma');
    await page.locator('#signup-password').fill(VALID_PASSWORD);
    await page.locator('#signup-confirm').fill(VALID_PASSWORD);

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    const errorText = await page.locator('#signup-terms-err').textContent();
    expect(errorText?.toLowerCase()).toMatch(/agree|privacy policy|terms|required/i);
  });

  /* ───────── 11. Successful signup redirects to login ───────── */
  test('11) successful signup redirects to login with success message', async ({ page }) => {
    await clearAuthState(page);
    await mockSignupEndpoints(page);

    await page.goto(`/signup?inviteToken=${VALID_INVITE_TOKEN}`);
    await page.locator('.auth-form__inner').waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(600);

    await page.locator('#signup-fullname').fill('Vikram Sharma');
    await page.locator('#signup-password').fill(VALID_PASSWORD);
    await page.locator('#signup-confirm').fill(VALID_PASSWORD);
    await page.locator('#signup-terms').check();

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // Should redirect to /login
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);

    // Success message should be present
    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/password updated|sign in|success|account created/i);
  });

  /* ───────── 12. Signup API error handling ───────── */
  test('12) signup API error shows user-friendly message', async ({ page }) => {
    await clearAuthState(page);
    await mockSignupEndpoints(page);

    await page.goto(`/signup?inviteToken=${VALID_INVITE_TOKEN}`);
    await page.locator('.auth-form__inner').waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(600);

    // Use the email that triggers a 500 error
    await page.locator('#signup-fullname').fill('Error User');
    await page.locator('#signup-password').fill(VALID_PASSWORD);
    await page.locator('#signup-confirm').fill(VALID_PASSWORD);
    await page.locator('#signup-terms').check();

    // We need to change the email because the mock uses email to decide response.
    // But email is disabled in the form. The mock uses the invite email.
    // Let's trigger a network error by aborting the route temporarily.
    await page.route('**/auth/signup', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Something went wrong on our end. Please try again.' }),
      });
    });

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    await page.waitForTimeout(600);

    const alert = page.locator('[role="alert"]').filter({ hasText: /something went wrong|try again|failed/i }).first();
    await expect(alert).toBeVisible({ timeout: 5_000 });
  });

  /* ───────── 13. Loading state during submission ───────── */
  test('13) submit button shows loading state during signup', async ({ page }) => {
    await clearAuthState(page);
    await mockSignupEndpoints(page);

    // Slow down the signup response so we can observe the loading state
    await page.route('**/auth/signup', async (route) => {
      await new Promise((r) => setTimeout(r, 1_500));
      const body = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'user-new-001',
          name: body.name,
          email: body.email,
          role: 'principal',
          token: 'mock-jwt-principal-001',
          schoolId: 'school-dav-001',
        }),
      });
    });

    await page.goto(`/signup?inviteToken=${VALID_INVITE_TOKEN}`);
    await page.locator('.auth-form__inner').waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(600);

    await page.locator('#signup-fullname').fill('Vikram Sharma');
    await page.locator('#signup-password').fill(VALID_PASSWORD);
    await page.locator('#signup-confirm').fill(VALID_PASSWORD);
    await page.locator('#signup-terms').check();

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // Button should show loading state immediately
    await expect(submitBtn).toHaveAttribute('aria-busy', 'true', { timeout: 2_000 });
    await expect(submitBtn).toBeDisabled();
  });

  /* ───────── 14. Privacy policy link navigates to /privacy ───────── */
  test('14) privacy policy link is present and navigates correctly', async ({ page }) => {
    await clearAuthState(page);
    await mockSignupEndpoints(page);

    await page.goto(`/signup?inviteToken=${VALID_INVITE_TOKEN}`);
    await page.locator('.auth-form__inner').waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(600);

    const privacyLink = page.locator('a[href="/privacy"]').first();
    await expect(privacyLink).toBeVisible();

    await privacyLink.click();
    await page.waitForURL(/\/privacy/, { timeout: 5_000 });
    await expect(page).toHaveURL(/\/privacy/);
  });

  /* ───────── 15. Keyboard navigation ───────── */
  test('15) signup form is reachable via keyboard tab navigation', async ({ page }) => {
    await clearAuthState(page);
    await mockSignupEndpoints(page);

    await page.goto(`/signup?inviteToken=${VALID_INVITE_TOKEN}`);
    await page.locator('.auth-form__inner').waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(600);

    // Tab to full name field
    await page.keyboard.press('Tab');
    let active = page.locator(':focus');
    await expect(active).toBeVisible();

    // Type full name
    await page.keyboard.type('Vikram Sharma');

    // Tab through password and confirm
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.type(VALID_PASSWORD);

    await page.keyboard.press('Tab');
    await page.keyboard.type(VALID_PASSWORD);

    // Tab to terms checkbox and check with Space
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');

    const termsCheckbox = page.locator('#signup-terms');
    await expect(termsCheckbox).toBeChecked();
  });
});
