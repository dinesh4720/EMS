import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * LoginPage object model for authentication
 */
export class LoginPage extends BasePage {
  // Login form locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;
  readonly rememberMeCheckbox: Locator;

  constructor(page: Page) {
    super(page);

    this.emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    this.passwordInput = page.locator('input[type="password"], input[name="password"], input[placeholder*="password" i]').first();
    this.loginButton = page.locator('button[type="submit"]').filter({ hasText: /login|sign in/i });
    this.errorMessage = page.locator('[class*="error"], [role="alert"]').filter({ hasText: /invalid|incorrect|failed/i });
    this.forgotPasswordLink = page.getByRole('link', { name: /forgot password/i });
    this.rememberMeCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /remember me/i });
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await this.page.goto('/login');
    await expect(this.emailInput).toBeVisible({ timeout: 10000 });
  }

  /**
   * Login with credentials
   */
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Login and wait for dashboard
   */
  async loginAndWaitForDashboard(email: string, password: string) {
    await this.login(email, password);
    // Should redirect to dashboard after successful login
    await this.page.waitForURL('**/dashboard', { timeout: 10000 });
    await this.waitForPageLoad();
  }

  /**
   * Verify login page elements
   */
  async verifyLoginPageElements() {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
    await expect(this.loginButton).toBeEnabled();
    await expect(this.forgotPasswordLink).toBeVisible();
    await expect(this.rememberMeCheckbox).toBeVisible();
  }

  /**
   * Verify error message for invalid credentials
   */
  async verifyErrorMessage(message: string) {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(message);
  }

  /**
   * Toggle remember me
   */
  async toggleRememberMe() {
    await this.rememberMeCheckbox.check();
  }

  /**
   * Verify user is logged in
   */
  async verifyLoggedIn() {
    await expect(this.page).not.toHaveURL(/login/);
    await expect(this.userMenu).toBeVisible({ timeout: 5000 });
  }
}
