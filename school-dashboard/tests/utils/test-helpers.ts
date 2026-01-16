import { Page, Locator, expect } from '@playwright/test';

/**
 * Test helper utilities for common operations
 */
export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for and verify toast notification
   */
  async waitForToast(message: string, type: 'success' | 'error' = 'success') {
    const toast = this.page.getByRole('alert').filter({ hasText: message });
    await expect(toast).toBeVisible({ timeout: 5000 });
    return toast;
  }

  /**
   * Wait for loading state to complete
   */
  async waitForLoading() {
    await this.page.waitForLoadState('networkidle');
    // Wait for any spinners to disappear
    const spinners = this.page.locator('[role="status"], .spinner, .loading');
    const count = await spinners.count();
    if (count > 0) {
      await spinners.first().waitFor({ state: 'hidden', timeout: 10000 });
    }
  }

  /**
   * Fill form with data
   */
  async fillForm(formData: Record<string, string>) {
    for (const [field, value] of Object.entries(formData)) {
      const input = this.page.getByLabel(field).or(
        this.page.getByPlaceholder(field)
      ).or(
        this.page.locator(`[name="${field}"]`)
      );
      await input.fill(value);
    }
  }

  /**
   * Verify modal is visible
   */
  async verifyModalVisible(title: string) {
    const modal = this.page.locator('[role="dialog"]').filter({ hasText: title });
    await expect(modal).toBeVisible();
    return modal;
  }

  /**
   * Close modal
   */
  async closeModal() {
    const closeButton = this.page.locator('[role="dialog"] button[aria-label="close"], [role="dialog"] .close, [role="dialog"] button').filter({ hasText: /close|×|cancel/i }).first();
    await closeButton.click();
  }

  /**
   * Verify navigation to page
   */
  async verifyPage(path: string) {
    await expect(this.page).toHaveURL(new RegExp(path));
  }

  /**
   * Take screenshot with description
   */
  async screenshot(description: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${description.replace(/\s+/g, '-')}.png`,
      fullPage: true
    });
  }

  /**
   * Verify table has data
   */
  async verifyTableHasData(minRows = 1) {
    const table = this.page.locator('table, [role="table"]');
    await expect(table).toBeVisible();

    const rows = table.locator('tbody tr, [role="rowgroup"] [role="row"]');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(minRows);
  }

  /**
   * Search in table/search input
   */
  async searchTable(query: string) {
    const searchInput = this.page.getByPlaceholder(/search/i).or(
      this.page.locator('input[type="search"]')
    ).first();
    await searchInput.fill(query);
    await searchInput.press('Enter');
    await this.page.waitForTimeout(500); // Wait for debounce
  }

  /**
   * Verify element is visible and enabled
   */
  async verifyVisibleAndEnabled(locator: Locator) {
    await expect(locator).toBeVisible();
    await expect(locator).toBeEnabled();
  }

  /**
   * Verify permission denied/access denied
   */
  async verifyAccessDenied() {
    await expect(this.page.getByText(/access denied|not authorized|unauthorized/i)).toBeVisible({ timeout: 5000 });
  }

  /**
   * Click button with text
   */
  async clickButton(text: string | RegExp) {
    const button = this.page.getByRole('button', { name: text });
    await button.click();
  }

  /**
   * Select option from dropdown
   */
  async selectDropdown(label: string, option: string) {
    const dropdown = this.page.getByLabel(label).or(
      this.page.locator(`[name="${label}"]`)
    );
    await dropdown.click();
    await this.page.getByRole('option', { name: option }).click();
  }

  /**
   * Verify card/statistics on dashboard
   */
  async verifyStatCard(label: string, hasValue: boolean = true) {
    const card = this.page.locator('[class*="card"]').filter({ hasText: label });
    await expect(card).toBeVisible();
    if (hasValue) {
      const value = card.locator('[class*="value"], [class*="count"], h2, h3').first();
      await expect(value).not.toBeEmpty();
    }
  }

  /**
   * Verify page title
   */
  async verifyPageTitle(title: string) {
    await expect(this.page).toHaveTitle(new RegExp(title, 'i'));
  }

  /**
   * Navigate through sidebar menu
   */
  async navigateToMenu(menuItem: string) {
    const menu = this.page.getByRole('link', { name: menuItem }).or(
      this.page.locator('[class*="sidebar"], [class*="menu"]').getByText(menuItem)
    );

    // Handle collapsed sidebar
    const sidebar = this.page.locator('[class*="sidebar"]');
    const isCollapsed = await sidebar.locator('[class*="collapsed"]').count() > 0;

    if (isCollapsed) {
      const toggle = this.page.locator('[class*="toggle"], button').filter({ hasText: /menu|toggle/i }).first();
      await toggle.click();
      await this.page.waitForTimeout(300);
    }

    await menu.click();
    await this.waitForLoading();
  }

  /**
   * Verify pagination controls
   */
  async verifyPagination() {
    const pagination = this.page.locator('[class*="pagination"], nav[aria-label="pagination"]');
    const count = await pagination.count();

    if (count > 0) {
      await expect(pagination.first()).toBeVisible();
      const nextButton = pagination.locator('button').filter({ hasText: /next|›/i });
      const prevButton = pagination.locator('button').filter({ hasText: /prev|‹|previous/i });

      // Verify buttons exist (may be disabled)
      await expect(nextButton).toHaveCount(1);
      await expect(prevButton).toHaveCount(1);
    }
  }
}
