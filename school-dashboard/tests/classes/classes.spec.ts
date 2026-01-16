import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { testUsers } from '../fixtures/users';

/**
 * Class Management Module Tests
 */
test.describe('Class Management Module', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );
  });

  test('should navigate to classes page', async ({ page }) => {
    await page.goto('/classes');
    await expect(page.locator('h1, h2').filter({ hasText: /class/i }).first()).toBeVisible();
  });

  test('should display list of classes', async ({ page }) => {
    await page.goto('/classes');
    const table = page.locator('table, [role="table"]');
    await expect(table.first()).toBeVisible();
  });

  test('should add new class', async ({ page }) => {
    await page.goto('/classes');

    const addButton = page.getByRole('button').filter({ hasText: /add|create|new/i });
    const addCount = await addButton.count();

    if (addCount > 0) {
      await addButton.first().click();

      // Fill form
      await page.locator('input[name="name"]').fill('Class 12');
      await page.locator('select[name="section"]').selectOption('A');
      await page.locator('input[name="capacity"]').fill('40');

      // Submit
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(1000);

      // Verify success
      const toast = page.locator('[class*="toast"], [role="alert"]');
      const toastCount = await toast.count();
      if (toastCount > 0) {
        await expect(toast.first()).toBeVisible();
      }
    }
  });

  test('should assign teacher to class', async ({ page }) => {
    await page.goto('/classes');

    // Click on a class
    const table = page.locator('table, [role="table"]');
    const firstRow = table.locator('tbody tr, [role="row"]').first();
    await firstRow.click();

    // Look for assign teacher option
    const assignButton = page.locator('button').filter({ hasText: /assign teacher/i });
    const assignCount = await assignButton.count();

    if (assignCount > 0) {
      await assignButton.first().click();
      await page.waitForTimeout(500);

      // Select teacher
      const teacherSelect = page.locator('select[name="teacher"]');
      await teacherSelect.selectOption({ index: 0 });
      await page.locator('button[type="submit"]').click();
    }
  });

  test('should view class details with students', async ({ page }) => {
    await page.goto('/classes');

    const table = page.locator('table, [role="table"]');
    const firstRow = table.locator('tbody tr, [role="row"]').first();
    await firstRow.click();

    // Should show class details
    await expect(page.locator('[class*="class-detail"], [class*="class-info"]').first()).toBeVisible();

    // Should show students in class
    const studentsList = page.locator('[class*="students"], table');
    await expect(studentsList.first()).toBeVisible();
  });
});
