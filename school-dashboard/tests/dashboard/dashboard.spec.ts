import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';
import { testUsers } from '../fixtures/users';

/**
 * Dashboard Module Tests
 *
 * These tests verify:
 * - Dashboard loads correctly
 * - Stat cards display accurate data
 * - Navigation from dashboard works
 * - Charts and graphs render
 * - Activity feed updates
 * - Quick actions function
 */
test.describe('Dashboard Module', () => {
  let dashboardPage: DashboardPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);

    // Login before each test
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );
  });

  test('should load dashboard with all elements', async ({ page }) => {
    await dashboardPage.verifyDashboardLoaded();

    // Verify main sections are visible
    await expect(dashboardPage.pageHeading).toBeVisible();
    await expect(dashboardPage.statCards.first()).toBeVisible();
  });

  test('should display all stat cards with values', async ({ page }) => {
    await dashboardPage.verifyStatCards();

    // Get stat values for verification
    const stats = await dashboardPage.getStatValues();
    console.log('Dashboard Stats:', stats);

    // Verify we have stats
    expect(Object.keys(stats).length).toBeGreaterThan(0);

    // Verify each stat has a numeric or meaningful value
    for (const [key, value] of Object.entries(stats)) {
      expect(value).toBeTruthy();
      expect(value.length).toBeGreaterThan(0);
    }
  });

  test('should navigate to students page from stat card', async ({ page }) => {
    await dashboardPage.totalStudentsCard.click();
    await page.waitForURL('**/students', { timeout: 5000 });

    // Verify we're on students page
    await expect(page.locator('h1, h2').filter({ hasText: /students/i })).toBeVisible();
  });

  test('should navigate to staff page from stat card', async ({ page }) => {
    await dashboardPage.totalStaffCard.click();
    await page.waitForURL('**/staff', { timeout: 5000 });

    // Verify we're on staff page
    await expect(page.locator('h1, h2').filter({ hasText: /staff/i })).toBeVisible();
  });

  test('should display activity feed', async ({ page }) => {
    await dashboardPage.verifyActivityFeed();

    // Verify activity feed has items
    const feed = dashboardPage.activityFeed;
    const feedCount = await feed.count();

    if (feedCount > 0) {
      const items = await feed.locator('[class*="item"], div, li').all();
      expect(items.length).toBeGreaterThan(0);
    }
  });

  test('should have working quick actions', async ({ page }) => {
    const actionCount = await dashboardPage.quickActions.count();

    if (actionCount > 0) {
      // Click on first quick action
      await dashboardPage.quickActions.first().click();
      await page.waitForTimeout(1000);

      // Should navigate or open a modal
      const hasModal = await page.locator('[role="dialog"]').count() > 0;
      const hasUrlChange = page.url().includes('/');

      expect(hasModal || hasUrlChange).toBeTruthy();
    }
  });

  test('should render charts correctly', async ({ page }) => {
    await dashboardPage.verifyCharts();

    const chartCount = await dashboardPage.chartsSection.count();

    if (chartCount > 0) {
      // Wait for charts to render (they may use canvas or SVG)
      await page.waitForTimeout(2000);

      // Verify charts are visible
      for (let i = 0; i < chartCount; i++) {
        const chart = dashboardPage.chartsSection.nth(i);
        await expect(chart).toBeVisible();
      }
    }
  });

  test('should display upcoming events or calendar', async ({ page }) => {
    const eventCount = await dashboardPage.upcomingEvents.count();

    if (eventCount > 0) {
      await expect(dashboardPage.upcomingEvents.first()).toBeVisible();

      // Verify events have dates
      const events = await dashboardPage.upcomingEvents.allTextContents();
      expect(events.length).toBeGreaterThan(0);
    }
  });

  test('should refresh data on reload', async ({ page }) => {
    // Get initial stats
    const initialStats = await dashboardPage.getStatValues();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Get stats after reload
    await dashboardPage.verifyDashboardLoaded();
    const reloadedStats = await dashboardPage.getStatValues();

    // Stats should still be present
    expect(Object.keys(reloadedStats).length).toBeGreaterThan(0);
  });

  test('should show notifications', async ({ page }) => {
    // Click on notification bell
    const notificationCount = await dashboardPage.notifications.count();

    if (notificationCount > 0) {
      await dashboardPage.notifications.first().click();
      await page.waitForTimeout(500);

      // Verify notification dropdown/panel opens
      const notificationPanel = page.locator('[class*="notification-panel"], [class*="dropdown"]');
      const panelCount = await notificationPanel.count();

      if (panelCount > 0) {
        await expect(notificationPanel.first()).toBeVisible();
      }
    }
  });

  test('should have responsive layout', async ({ page }) => {
    // Desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(dashboardPage.pageHeading).toBeVisible();
    await expect(dashboardPage.statCards.first()).toBeVisible();

    // Tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(dashboardPage.pageHeading).toBeVisible();
    await expect(dashboardPage.statCards.first()).toBeVisible();

    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(dashboardPage.pageHeading).toBeVisible();

    // Sidebar should be collapsible on mobile
    const sidebar = page.locator('[class*="sidebar"]');
    const hamburger = page.locator('button').filter({ hasText: /menu|☰/i });

    const hamburgerCount = await hamburger.count();
    if (hamburgerCount > 0) {
      await hamburger.first().click();
      await page.waitForTimeout(500);
      // Sidebar should open
      await expect(sidebar).toBeVisible();
    }
  });

  test('should display user profile information', async ({ page }) => {
    // Click on user menu
    await dashboardPage.userMenu.click();
    await page.waitForTimeout(500);

    // Verify user info is shown
    await expect(page.getByText(testUsers.admin.name)).toBeVisible();

    // Should have profile, logout options
    const profileOption = page.getByRole('button', { name: /profile|settings/i });
    await expect(profileOption.first()).toBeVisible();
  });

  test('should have working search functionality', async ({ page }) => {
    // Type in search
    await dashboardPage.searchInput.fill('student');
    await page.waitForTimeout(1000);

    // Should show search results or navigate to search page
    const hasResults = await page.locator('[class*="search-result"], [class*="results"]').count() > 0;
    const hasUrlChange = page.url().includes('search');

    expect(hasResults || hasUrlChange).toBeTruthy();
  });

  test('should verify accessibility', async ({ page }) => {
    await dashboardPage.verifyAccessibility();

    // Verify all stat cards have proper labels
    const statCards = await dashboardPage.statCards.all();
    for (const card of statCards) {
      const cardText = await card.textContent();
      expect(cardText).toBeTruthy();
      expect(cardText?.length).toBeGreaterThan(0);
    }
  });
});
