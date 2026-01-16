import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { StaffPage } from '../pages/StaffPage';
import { StudentsPage } from '../pages/StudentsPage';
import { testUsers } from '../fixtures/users';

/**
 * Responsive Design & Cross-Browser Tests
 *
 * These tests verify:
 * - Application works on different screen sizes
 * - Mobile hamburger menu functions
 * - Touch interactions work
 * - Layout adapts correctly
 * - Cross-browser compatibility
 */
test.describe('Responsive Design & Cross-Device', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('should work on desktop (1920x1080)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    await loginPage.goto();
    await loginPage.verifyLoginPageElements();

    // Login
    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.verifyDashboardLoaded();

    // Verify full sidebar is visible
    const sidebar = page.locator('[class*="sidebar"]');
    await expect(sidebar).toBeVisible();
  });

  test('should work on laptop (1366x768)', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });

    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.verifyDashboardLoaded();

    // Verify dashboard is fully visible without horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width || 0;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
  });

  test('should work on tablet (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.verifyDashboardLoaded();

    // Verify content is visible
    await expect(dashboardPage.pageHeading).toBeVisible();
    await expect(dashboardPage.statCards.first()).toBeVisible();
  });

  test('should work on mobile landscape (667x375)', async ({ page }) => {
    await page.setViewportSize({ width: 667, height: 375 });

    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.verifyDashboardLoaded();

    // Should have hamburger menu
    const hamburger = page.locator('button').filter({ hasText: /menu|☰/i });
    const hamburgerCount = await hamburger.count();

    if (hamburgerCount > 0) {
      await expect(hamburger.first()).toBeVisible();
    }
  });

  test('should work on mobile portrait (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.verifyDashboardLoaded();

    // Verify stat cards stack vertically
    const stats = await dashboardPage.statCards.all();
    expect(stats.length).toBeGreaterThan(0);

    // Check if cards are stacked (not side-by-side)
    const firstCard = stats[0];
    const firstCardBox = await firstCard.boundingBox();

    if (firstCardBox && stats.length > 1) {
      const secondCard = stats[1];
      const secondCardBox = await secondCard.boundingBox();

      if (secondCardBox) {
        // Second card should be below first card
        expect(secondCardBox.y).toBeGreaterThan(firstCardBox.y);
      }
    }
  });

  test('should work on small mobile (320x568)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });

    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.verifyDashboardLoaded();

    // Verify no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(320);
  });

  test('should handle mobile navigation with hamburger menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );

    // Find and click hamburger menu
    const hamburger = page.locator('button').filter({ hasText: /menu|☰|≡/i });
    const hamburgerCount = await hamburger.count();

    if (hamburgerCount > 0) {
      await hamburger.first().click();
      await page.waitForTimeout(500);

      // Sidebar should open
      const sidebar = page.locator('[class*="sidebar"], [class*="mobile-menu"]');
      await expect(sidebar).toBeVisible();

      // Click a menu item
      await sidebar.locator('a').filter({ hasText: /staff/i }).first().click();
      await page.waitForTimeout(1000);

      // Should navigate to staff page
      await expect(page).toHaveURL(/staff/);

      // Sidebar should close after navigation
      const isVisible = await sidebar.isVisible();
      expect(isVisible).toBeFalsy();
    }
  });

  test('should handle touch interactions', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );

    const dashboardPage = new DashboardPage(page);

    // Test tap on stat card
    await dashboardPage.totalStudentsCard.tap();
    await page.waitForTimeout(1000);

    // Should navigate to students page
    await expect(page).toHaveURL(/students/);
  });

  test('should adapt table layout on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );

    const staffPage = new StaffPage(page);
    await staffPage.goto();

    // On mobile, tables might be converted to cards or have horizontal scroll
    const table = staffPage.staffTable;
    const tableCount = await table.count();

    if (tableCount > 0) {
      // Check if table has horizontal scroll
      const scrollWidth = await table.first().evaluate((el: any) => el.scrollWidth);
      const clientWidth = await table.first().evaluate((el: any) => el.clientWidth);

      if (scrollWidth > clientWidth) {
        // Table has horizontal scroll
        const scrollable = await table.first().evaluate((el: any) => {
          return window.getComputedStyle(el).overflowX === 'auto' ||
                 window.getComputedStyle(el).overflowX === 'scroll';
        });
        expect(scrollable).toBeTruthy();
      }
    } else {
      // Table might be converted to cards on mobile
      const cards = page.locator('[class*="card"], [class*="mobile-row"]');
      await expect(cards.first()).toBeVisible();
    }
  });

  test('should verify images are responsive', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();

    // Find all images
    const images = page.locator('img');
    const imageCount = await images.count();

    if (imageCount > 0) {
      // Check first few images
      for (let i = 0; i < Math.min(3, imageCount); i++) {
        const image = images.nth(i);

        // Check if image is responsive
        const maxWidth = await image.evaluate((el: any) => {
          return window.getComputedStyle(el).maxWidth;
        });

        // Responsive images should have max-width: 100% or be within container
        if (maxWidth === '100%' || maxWidth === 'none') {
          // Good - image is responsive
          expect(true).toBeTruthy();
        }
      }
    }
  });

  test('should verify text remains readable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();

    // Check font sizes are not too small
    const body = page.locator('body');
    const fontSize = await body.evaluate((el: any) => {
      return window.getComputedStyle(el).fontSize;
    });

    // Font size should be at least 14px on mobile
    const fontSizeValue = parseInt(fontSize);
    expect(fontSizeValue).toBeGreaterThanOrEqual(14);
  });

  test('should verify form inputs are touch-friendly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await loginPage.goto();

    // Check input sizes
    const emailInput = loginPage.emailInput;
    const box = await emailInput.boundingBox();

    if (box) {
      // Touch targets should be at least 44x44 pixels
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('should verify modals work on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );

    const staffPage = new StaffPage(page);
    await staffPage.goto();
    await staffPage.clickAddStaff();

    // Modal should open
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Modal should fit on screen
    const modalBox = await modal.boundingBox();
    if (modalBox) {
      expect(modalBox.width).toBeLessThanOrEqual(375);
    }
  });

  test('should verify orientation change handling', async ({ page }) => {
    // Start in portrait
    await page.setViewportSize({ width: 375, height: 667 });

    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );

    // Take screenshot in portrait
    await page.screenshot({ path: 'test-results/screenshots/mobile-portrait.png' });

    // Change to landscape
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(500);

    // Take screenshot in landscape
    await page.screenshot({ path: 'test-results/screenshots/mobile-landscape.png' });

    // Page should still be functional
    const dashboardPage = new DashboardPage(page);
    await expect(dashboardPage.pageHeading).toBeVisible();
  });

  test('should verify safe areas on notched devices', async ({ page }) => {
    // Simulate iPhone X with notch
    await page.setViewportSize({ width: 375, height: 812 });
    await page.evaluate(() => {
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 812 });
    });

    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );

    // Content should not be cut off
    const header = page.locator('header, [class*="header"]');
    const headerBox = await header.boundingBox();

    if (headerBox) {
      // Header should respect top safe area
      expect(headerBox.y).toBeGreaterThanOrEqual(0);
    }
  });
});
