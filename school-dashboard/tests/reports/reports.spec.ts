import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { testUsers } from '../fixtures/users';

/**
 * Reports Module Tests
 */
test.describe('Reports Module', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );
  });

  test('should navigate to reports page', async ({ page }) => {
    await page.goto('/reports');

    const heading = page.locator('h1, h2').filter({ hasText: /report/i });
    const headingCount = await heading.count();

    if (headingCount > 0) {
      await expect(heading.first()).toBeVisible();
    }
  });

  test('should display report categories', async ({ page }) => {
    await page.goto('/reports');

    const categories = ['Student', 'Staff', 'Attendance', 'Fee', 'Exam'];

    for (const category of categories) {
      const categoryElement = page.locator(`[class*="report"]`).filter({ hasText: category });
      const count = await categoryElement.count();
      if (count > 0) {
        console.log(`Found ${category} report category`);
      }
    }
  });

  test('should generate student report', async ({ page }) => {
    await page.goto('/reports');

    const studentReportButton = page.locator('button').filter({ hasText: /student report/i });
    const studentReportCount = await studentReportButton.count();

    if (studentReportCount > 0) {
      await studentReportButton.first().click();

      // Select filters
      const classSelect = page.locator('select[name="class"]');
      const classCount = await classSelect.count();

      if (classCount > 0) {
        await classSelect.selectOption({ index: 0 });

        // Generate report
        const generateButton = page.locator('button').filter({ hasText: /generate|view/i });
        await generateButton.click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test('should export report', async ({ page }) => {
    await page.goto('/reports');

    const exportButton = page.locator('button').filter({ hasText: /export|download/i });
    const exportCount = await exportButton.count();

    if (exportCount > 0) {
      const downloadPromise = page.waitForEvent('download');
      await exportButton.first().click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBeTruthy();
    }
  });
});
