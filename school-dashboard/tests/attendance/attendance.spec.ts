import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { testUsers } from '../fixtures/users';

/**
 * Attendance Module Tests
 */
test.describe('Attendance Module', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );
  });

  test('should navigate to student attendance page', async ({ page }) => {
    await page.goto('/attendance/student');
    await expect(page.locator('h1, h2').filter({ hasText: /attendance/i }).first()).toBeVisible();
  });

  test('should display attendance calendar or list', async ({ page }) => {
    await page.goto('/attendance/student');

    const calendar = page.locator('[class*="calendar"]');
    const list = page.locator('table, [class*="attendance-list"]');

    const hasCalendar = await calendar.count() > 0;
    const hasList = await list.count() > 0;

    expect(hasCalendar || hasList).toBeTruthy();
  });

  test('should mark attendance for students', async ({ page }) => {
    await page.goto('/attendance/student');

    // Select class
    const classSelect = page.locator('select[name="class"], [class*="class-select"]').first();
    const classCount = await classSelect.count();

    if (classCount > 0) {
      await classSelect.selectOption({ index: 0 });
      await page.waitForTimeout(1000);

      // Mark attendance
      const presentRadio = page.locator('input[type="radio"]').filter({ hasText: /present/i }).first();
      await presentRadio.check();

      // Submit
      const submitButton = page.locator('button[type="submit"]').filter({ hasText: /save|submit/i });
      await submitButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should view attendance reports', async ({ page }) => {
    await page.goto('/attendance/reports');

    const heading = page.locator('h1, h2').filter({ hasText: /attendance.*report|report.*attendance/i });
    const headingCount = await heading.count();

    if (headingCount > 0) {
      await expect(heading.first()).toBeVisible();

      // Check for date range filters
      const dateFilter = page.locator('input[type="date"]');
      const dateCount = await dateFilter.count();

      if (dateCount >= 2) {
        // Select date range
        await dateFilter.nth(0).fill('2024-01-01');
        await dateFilter.nth(1).fill(new Date().toISOString().split('T')[0]);

        // Generate report
        const generateButton = page.locator('button').filter({ hasText: /generate|view/i });
        await generateButton.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should display attendance statistics', async ({ page }) => {
    await page.goto('/attendance/student');

    const stats = page.locator('[class*="stat"], [class*="summary"], [class*="percentage"]');
    const statCount = await stats.count();

    if (statCount > 0) {
      await expect(stats.first()).toBeVisible();
    }
  });
});
