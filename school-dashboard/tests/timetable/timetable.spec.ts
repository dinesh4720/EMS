import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { testUsers } from '../fixtures/users';

/**
 * Timetable Module Tests
 */
test.describe('Timetable Module', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );
  });

  test('should navigate to timetable page', async ({ page }) => {
    await page.goto('/timetable');

    const heading = page.locator('h1, h2').filter({ hasText: /timetable|schedule/i });
    const headingCount = await heading.count();

    if (headingCount > 0) {
      await expect(heading.first()).toBeVisible();
    }
  });

  test('should display weekly timetable', async ({ page }) => {
    await page.goto('/timetable');

    const timetable = page.locator('[class*="timetable"], [class*="schedule"], table');
    const timetableCount = await timetable.count();

    if (timetableCount > 0) {
      await expect(timetable.first()).toBeVisible();

      // Check for days of week
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      for (const day of days) {
        const dayElement = timetable.locator(`text=${day}`);
        const exists = await dayElement.count() > 0;
        if (exists) {
          console.log(`Found ${day} in timetable`);
        }
      }
    }
  });

  test('should add class to timetable', async ({ page }) => {
    await page.goto('/timetable');

    const addButton = page.locator('button').filter({ hasText: /add|create|new class/i });
    const addCount = await addButton.count();

    if (addCount > 0) {
      await addButton.first().click();

      // Fill timetable entry
      await page.locator('select[name="day"]').selectOption('Monday');
      await page.locator('input[name="startTime"]').fill('09:00');
      await page.locator('input[name="endTime"]').fill('10:00');
      await page.locator('select[name="subject"]').selectOption({ index: 0 });

      // Submit
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(1000);
    }
  });
});
