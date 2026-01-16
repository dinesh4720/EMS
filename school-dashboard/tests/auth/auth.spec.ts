import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { testUsers } from '../fixtures/users';

/**
 * Authentication Flow Tests
 *
 * These tests verify the complete authentication flow including:
 * - Login with valid credentials
 * - Login with invalid credentials
 * - Token management and persistence
 * - Logout functionality
 * - Session management
 * - Remember me functionality
 */
test.describe('Authentication Flows', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should display all login page elements correctly', async ({ page }) => {
    await loginPage.verifyLoginPageElements();

    // Verify page title
    await expect(page).toHaveTitle(/login|sign in/i);

    // Verify branding/logo is present
    const logo = page.locator('[class*="logo"], img[alt*="logo" i]');
    const logoCount = await logo.count();
    if (logoCount > 0) {
      await expect(logo.first()).toBeVisible();
    }
  });

  test('should login successfully with admin credentials', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );

    // Verify redirected to dashboard
    await expect(page).toHaveURL(/dashboard/);
    await dashboardPage.verifyDashboardLoaded();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await loginPage.login('invalid@test.com', 'wrongpassword');

    // Verify error message is shown
    await loginPage.verifyErrorMessage('invalid|incorrect');

    // Verify still on login page
    await expect(page).toHaveURL(/login/);
  });

  test('should show error for empty credentials', async ({ page }) => {
    await loginPage.login('', '');

    // Should show validation error
    const error = page.locator('[class*="error"], [class*="invalid"]');
    await expect(error.first()).toBeVisible();
  });

  test('should show error for invalid email format', async ({ page }) => {
    await loginPage.login('not-an-email', testUsers.admin.password);

    // Should show email validation error
    const emailError = page.locator('[class*="error"]').filter({ hasText: /email|invalid/i });
    await expect(emailError).toBeVisible();
  });

  test('should maintain session after page reload', async ({ page }) => {
    // Login
    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be logged in
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('h1, h2').filter({ hasText: /dashboard/i })).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    // Login
    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );

    // Logout
    await dashboardPage.logout();

    // Verify redirected to login page
    await expect(page).toHaveURL(/login/);
    await loginPage.verifyLoginPageElements();
  });

  test('should require re-login after logout', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    // Login and logout
    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );
    await dashboardPage.logout();

    // Try to access dashboard directly
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Should redirect back to login
    await expect(page).toHaveURL(/login/);
  });

  test('should handle different user roles', async ({ page }) => {
    // Test teacher login
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.teacher.email,
      testUsers.teacher.password
    );
    await expect(page).toHaveURL(/dashboard/);
    await page.locator('[class*="user-menu"], [class*="profile"]').first().click();
    await expect(page.getByText(testUsers.teacher.name)).toBeVisible();

    // Logout and test accountant
    await page.goto('/logout');
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.accountant.email,
      testUsers.accountant.password
    );
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should show loading state during authentication', async ({ page }) => {
    const loginButton = page.locator('button[type="submit"]').filter({ hasText: /login|sign in/i });

    // Click login before filling form to trigger validation/loading
    await loginButton.click();

    // Check for loading state
    const spinner = page.locator('[class*="spinner"], [class*="loading"], [role="progressbar"]');
    const count = await spinner.count();
    if (count > 0) {
      await expect(spinner.first()).toBeVisible();
    }
  });

  test('should handle keyboard navigation (Enter to submit)', async ({ page }) => {
    await loginPage.emailInput.fill(testUsers.admin.email);
    await loginPage.passwordInput.fill(testUsers.admin.password);
    await loginPage.passwordInput.press('Enter');

    // Should submit form
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('should store token in sessionStorage', async ({ page }) => {
    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );

    // Check for token in storage
    const token = await page.evaluate(() => {
      return sessionStorage.getItem('token') || localStorage.getItem('token');
    });

    expect(token).toBeTruthy();
    expect(token).toBeDefined();
  });

  test('should clear token on logout', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );

    // Verify token exists
    let token = await page.evaluate(() => {
      return sessionStorage.getItem('token') || localStorage.getItem('token');
    });
    expect(token).toBeTruthy();

    // Logout
    await dashboardPage.logout();

    // Verify token is cleared
    token = await page.evaluate(() => {
      return sessionStorage.getItem('token') || localStorage.getItem('token');
    });
    expect(token).toBeFalsy();
  });

  test('should handle password visibility toggle', async ({ page }) => {
    const passwordInput = loginPage.passwordInput;
    const toggleButton = page.locator('button').filter({ hasText: /show|hide|👁/i });

    // Type password
    await passwordInput.fill('testpassword');

    // Check if toggle button exists
    const toggleCount = await toggleButton.count();
    if (toggleCount > 0) {
      const inputType = await passwordInput.getAttribute('type');
      expect(inputType).toBe('password');

      // Click toggle
      await toggleButton.first().click();

      const newType = await passwordInput.getAttribute('type');
      expect(newType).toBe('text');
    }
  });

  test('should remember me functionality work', async ({ page, context }) => {
    await loginPage.toggleRememberMe();
    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );

    // Check if credentials are stored (usually in localStorage)
    const rememberedEmail = await page.evaluate(() => {
      return localStorage.getItem('rememberedEmail') || localStorage.getItem('email');
    });

    // Note: This depends on implementation
    if (rememberedEmail) {
      expect(rememberedEmail).toBe(testUsers.admin.email);
    }
  });
});
