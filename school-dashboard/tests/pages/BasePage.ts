import { Page, Locator } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

/**
 * Base page class with common functionality
 */
export class BasePage {
  readonly page: Page;
  readonly helpers: TestHelpers;

  // Common locators
  readonly sidebar: Locator;
  readonly header: Locator;
  readonly logoutButton: Locator;
  readonly userMenu: Locator;
  readonly searchInput: Locator;
  readonly notificationBell: Locator;

  constructor(page: Page) {
    this.page = page;
    this.helpers = new TestHelpers(page);

    this.sidebar = page.locator('[class*="sidebar"], nav[class*="side"], aside');
    this.header = page.locator('header, [class*="header"], [class*="navbar"]');
    this.logoutButton = page.locator('button').filter({ hasText: /logout|sign out/i });
    this.userMenu = page.locator('[class*="user-menu"], [class*="profile-menu"]');
    this.searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
    this.notificationBell = page.locator('[class*="notification"], [class*="bell"]').first();
  }

  /**
   * Navigate to base URL
   */
  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Logout from the application
   */
  async logout() {
    await this.userMenu.click();
    await this.logoutButton.click();
    await this.page.waitForURL('**/login');
  }

  /**
   * Wait for page to load completely
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.helpers.waitForLoading();
  }

  /**
   * Verify page is responsive at different viewports
   */
  async verifyResponsive() {
    // Desktop
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    await this.page.waitForTimeout(500);
    await this.page.screenshot({ path: 'test-results/screenshots/responsive-desktop.png' });

    // Tablet
    await this.page.setViewportSize({ width: 768, height: 1024 });
    await this.page.waitForTimeout(500);
    await this.page.screenshot({ path: 'test-results/screenshots/responsive-tablet.png' });

    // Mobile
    await this.page.setViewportSize({ width: 375, height: 667 });
    await this.page.waitForTimeout(500);
    await this.page.screenshot({ path: 'test-results/screenshots/responsive-mobile.png' });

    // Reset to desktop
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }

  /**
   * Verify accessibility basics
   */
  async verifyAccessibility() {
    // Check for alt text on images
    const images = this.page.locator('img:not([alt])');
    const imageCount = await images.count();
    if (imageCount > 0) {
      console.warn(`Found ${imageCount} images without alt text`);
    }

    // Check for proper heading hierarchy
    const headings = await this.page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    console.log(`Found ${headings.length} headings on page`);
  }
}
