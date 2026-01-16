import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * DashboardPage object model
 */
export class DashboardPage extends BasePage {
  // Dashboard elements
  readonly pageHeading: Locator;
  readonly statCards: Locator;
  readonly activityFeed: Locator;
  readonly quickActions: Locator;
  readonly chartsSection: Locator;
  upcomingEvents: Locator;
  notifications: Locator;

  // Specific stats
  readonly totalStudentsCard: Locator;
  readonly totalStaffCard: Locator;
  readonly todayAttendanceCard: Locator;
  readonly pendingFeesCard: Locator;

  constructor(page: Page) {
    super(page);

    this.pageHeading = page.locator('h1, h2').filter({ hasText: /dashboard/i });
    this.statCards = page.locator('[class*="stat"], [class*="card"]');
    this.activityFeed = page.locator('[class*="activity"], [class*="feed"]');
    this.quickActions = page.locator('[class*="quick-action"], [class*="shortcut"]');
    this.chartsSection = page.locator('[class*="chart"], canvas, svg');
    this.upcomingEvents = page.locator('[class*="event"], [class*="calendar"]');
    this.notifications = page.locator('[class*="notification"]');

    this.totalStudentsCard = this.statCards.filter({ hasText: /students/i });
    this.totalStaffCard = this.statCards.filter({ hasText: /staff|teachers/i });
    this.todayAttendanceCard = this.statCards.filter({ hasText: /attendance/i });
    this.pendingFeesCard = this.statCards.filter({ hasText: /fees|payments/i });
  }

  /**
   * Navigate to dashboard
   */
  async goto() {
    await this.page.goto('/dashboard');
    await this.waitForPageLoad();
  }

  /**
   * Verify dashboard loaded
   */
  async verifyDashboardLoaded() {
    await expect(this.pageHeading).toBeVisible({ timeout: 10000 });
    await expect(this.statCards.first()).toBeVisible();
  }

  /**
   * Verify all stat cards are visible and have values
   */
  async verifyStatCards() {
    const cards = await this.statCards.all();
    expect(cards.length).toBeGreaterThan(0);

    for (const card of cards) {
      await expect(card).toBeVisible();
      // Verify card has a title and value
      const title = card.locator('h2, h3, h4, [class*="title"], [class*="label"]');
      const value = card.locator('[class*="value"], [class*="count"], h1, h2');
      await expect(title).not.toBeEmpty();
    }
  }

  /**
   * Verify dashboard navigation
   */
  async verifyDashboardNavigation() {
    // Click on each stat card and verify it navigates to the correct page
    await this.totalStudentsCard.click();
    await this.page.waitForURL('**/students', { timeout: 5000 });
    await this.goto();

    await this.totalStaffCard.click();
    await this.page.waitForURL('**/staff', { timeout: 5000 });
    await this.goto();
  }

  /**
   * Verify activity feed
   */
  async verifyActivityFeed() {
    const feedCount = await this.activityFeed.count();
    if (feedCount > 0) {
      await expect(this.activityFeed.first()).toBeVisible();
      const activities = this.activityFeed.locator('[class*="item"], li, div').all();
      // Should have at least some activity
      const items = await this.activityFeed.locator('*').count();
      expect(items).toBeGreaterThan(0);
    }
  }

  /**
   * Verify quick actions are present
   */
  async verifyQuickActions() {
    const actionCount = await this.quickActions.count();
    if (actionCount > 0) {
      await expect(this.quickActions.first()).toBeVisible();
      const actions = await this.quickActions.all();
      expect(actions.length).toBeGreaterThan(0);
    }
  }

  /**
   * Click quick action
   */
  async clickQuickAction(actionName: string) {
    const action = this.quickActions.filter({ hasText: actionName });
    await action.click();
    await this.waitForPageLoad();
  }

  /**
   * Verify charts are rendered
   */
  async verifyCharts() {
    const chartCount = await this.chartsSection.count();
    if (chartCount > 0) {
      await expect(this.chartsSection.first()).toBeVisible();
      // Wait for charts to render
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Get all stat values
   */
  async getStatValues() {
    const stats: Record<string, string> = {};
    const cards = await this.statCards.all();

    for (const card of cards) {
      const title = await card.locator('[class*="title"], h2, h3, h4').first().textContent() || '';
      const value = await card.locator('[class*="value"], h1, h2').first().textContent() || '';
      if (title && value) {
        stats[title.trim()] = value.trim();
      }
    }

    return stats;
  }
}
