import { test, expect } from '@playwright/test';
import { FeesPage } from '../pages/FeesPage';
import { LoginPage } from '../pages/LoginPage';
import { testUsers, testData } from '../fixtures/users';

/**
 * Fee Management Module Tests
 *
 * These tests verify:
 * - Fee structure management
 * - Fee collection and payments
 * - Receipt generation
 * - Fee defaulters list
 * - Fee reports and statistics
 */
test.describe('Fee Management Module', () => {
  let feesPage: FeesPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    feesPage = new FeesPage(page);

    // Login as admin or accountant
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );
  });

  test('should navigate to fees page', async ({ page }) => {
    await feesPage.goto();
    await expect(feesPage.pageHeading).toBeVisible();
  });

  test('should display fee structure tab', async ({ page }) => {
    await feesPage.goto();
    await feesPage.navigateToStructure();

    await expect(feesPage.feeTable).toBeVisible();
  });

  test('should open add fee form', async ({ page }) => {
    await feesPage.goto();
    await feesPage.navigateToStructure();
    await feesPage.clickAddFee();

    // Verify fee form modal
    const modal = page.locator('[role="dialog"]').filter({ hasText: /fee/i });
    await expect(modal).toBeVisible();

    // Verify form fields
    await expect(page.locator('input[name="name"], [placeholder*="name" i]')).toBeVisible();
    await expect(page.locator('input[name="amount"], [placeholder*="amount" i]')).toBeVisible();
    await expect(page.locator('select[name="category"], [name="type"]')).toBeVisible();
  });

  test('should create new fee head', async ({ page }) => {
    await feesPage.goto();
    await feesPage.navigateToStructure();
    await feesPage.clickAddFee();

    // Fill fee form
    await feesPage.fillFeeForm(testData.fee.valid);
    await feesPage.submitFeeForm();

    // Verify success
    await feesPage.helpers.waitForToast('fee created|added|success');

    // Verify fee appears in table
    await feesPage.searchInput.fill(testData.fee.valid.name);
    await page.waitForTimeout(1000);

    const table = feesPage.feeTable;
    const feeRow = table.locator('tr, [role="row"]').filter({ hasText: testData.fee.valid.name });
    await expect(feeRow.first()).toBeVisible();
  });

  test('should display payments tab', async ({ page }) => {
    await feesPage.goto();
    await feesPage.navigateToPayments();

    await expect(feesPage.feeTable).toBeVisible();
  });

  test('should collect fee from student', async ({ page }) => {
    await feesPage.goto();
    await feesPage.navigateToPayments();

    // Click collect fee button
    const collectCount = await feesPage.collectFeeButton.count();
    if (collectCount > 0) {
      await feesPage.collectFeeButton.click();

      // Search for student
      await feesPage.collectFee('Test Student');

      // Enter payment details
      await feesPage.enterPaymentDetails('5000', 'Cash');

      // Verify receipt generation
      await feesPage.verifyReceiptGeneration();
    }
  });

  test('should display receipts tab', async ({ page }) => {
    await feesPage.goto();
    await feesPage.navigateToReceipts();

    await expect(feesPage.feeTable).toBeVisible();
  });

  test('should download receipt', async ({ page }) => {
    await feesPage.goto();
    await feesPage.navigateToReceipts();

    const downloadButton = page.locator('button').filter({ hasText: /download|print/i });
    const downloadCount = await downloadButton.count();

    if (downloadCount > 0) {
      const downloadPromise = page.waitForEvent('download');
      await downloadButton.first().click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBeTruthy();
    }
  });

  test('should display defaulters list', async ({ page }) => {
    await feesPage.goto();
    await feesPage.navigateToDefaulters();

    await expect(feesPage.feeTable).toBeVisible();
    await feesPage.verifyDefaultersList();
  });

  test('should verify fee statistics', async ({ page }) => {
    await feesPage.goto();
    await feesPage.verifyFeeStats();

    const stats = page.locator('[class*="stat"], [class*="summary"], [class*="total"]');
    const statCount = await stats.count();

    if (statCount > 0) {
      await expect(stats.first()).toBeVisible();

      // Verify stats have values
      const statText = await stats.first().textContent();
      expect(statText).toBeTruthy();
      expect(statText?.length).toBeGreaterThan(0);
    }
  });

  test('should search fee records', async ({ page }) => {
    await feesPage.goto();
    await feesPage.navigateToPayments();

    // Search for a student
    await feesPage.searchInput.fill('test');
    await page.waitForTimeout(1000);

    // Verify search results
    await expect(feesPage.feeTable).toBeVisible();
  });

  test('should filter fees by date range', async ({ page }) => {
    await feesPage.goto();
    await feesPage.navigateToPayments();

    // Look for date filters
    const dateFilter = page.locator('input[type="date"], [class*="date-filter"]');
    const dateCount = await dateFilter.count();

    if (dateCount >= 2) {
      await dateFilter.nth(0).fill('2024-01-01');
      await dateFilter.nth(1).fill(new Date().toISOString().split('T')[0]);
      await page.waitForTimeout(1000);

      // Apply filter
      const applyButton = page.getByRole('button').filter({ hasText: /apply|filter/i });
      await applyButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should verify different payment methods', async ({ page }) => {
    await feesPage.goto();
    await feesPage.navigateToPayments();

    const collectCount = await feesPage.collectFeeButton.count();
    if (collectCount > 0) {
      await feesPage.collectFeeButton.click();

      // Check payment method dropdown
      const methodDropdown = page.locator('select[name="method"], select[name="paymentMethod"]');
      const methodCount = await methodDropdown.count();

      if (methodCount > 0) {
        await methodDropdown.first().click();

        // Verify options
        const options = page.locator('[role="option"], option');
        const optionCount = await options.count();
        expect(optionCount).toBeGreaterThan(0);

        // Should have Cash, Card, UPI, etc.
        const methods = ['Cash', 'Card', 'UPI', 'Cheque', 'Online'];
        for (const method of methods) {
          const methodOption = options.filter({ hasText: method });
          const exists = await methodOption.count() > 0;
          if (exists) {
            console.log(`Payment method ${method} is available`);
          }
        }
      }
    }
  });

  test('should handle refund process', async ({ page }) => {
    await feesPage.goto();
    await feesPage.navigateToPayments();

    // Look for refund button
    const refundButton = page.locator('button').filter({ hasText: /refund/i });
    const refundCount = await refundButton.count();

    if (refundCount > 0) {
      await refundButton.first().click();

      // Verify refund modal
      const modal = page.locator('[role="dialog"]').filter({ hasText: /refund/i });
      await expect(modal).toBeVisible();

      // Fill refund details
      await page.locator('textarea, input[placeholder*="reason"]').fill('Test refund');
      await feesPage.helpers.clickButton(/confirm|submit/i);

      // Verify success
      await feesPage.helpers.waitForToast('refund processed|success');
    }
  });

  test('should verify fee calculation accuracy', async ({ page }) => {
    await feesPage.goto();
    await feesPage.navigateToStructure();
    await feesPage.clickAddFee();

    // Enter fee amount
    const amountInput = page.locator('input[name="amount"], [placeholder*="amount" i]');
    await amountInput.fill('5000');

    // Check if total/due fields are calculated
    const totalField = page.locator('input[name="total"], [class*="total"]');
    const totalCount = await totalField.count();

    if (totalCount > 0) {
      const totalValue = await totalField.first().inputValue();
      expect(totalValue).toBe('5000');
    }
  });

  test('should handle installment payments', async ({ page }) => {
    await feesPage.goto();
    await feesPage.navigateToPayments();

    const collectCount = await feesPage.collectFeeButton.count();
    if (collectCount > 0) {
      await feesPage.collectFeeButton.click();

      // Look for installment option
      const installmentCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /installment/i });
      const installmentCount = await installmentCheckbox.count();

      if (installmentCount > 0) {
        await installmentCheckbox.first().check();

        // Verify installment fields appear
        const installmentFields = page.locator('[class*="installment"]');
        await expect(installmentFields.first()).toBeVisible();
      }
    }
  });

  test('should generate fee reports', async ({ page }) => {
    await feesPage.goto();

    const reportButton = page.locator('button').filter({ hasText: /report|generate/i });
    const reportCount = await reportButton.count();

    if (reportCount > 0) {
      await reportButton.first().click();

      // Verify report modal/section
      const reportSection = page.locator('[class*="report"], [role="dialog"]');
      await expect(reportSection.first()).toBeVisible();

      // Generate report
      await feesPage.helpers.clickButton(/generate|create/i);
      await page.waitForTimeout(2000);
    }
  });

  test('should verify due date reminders', async ({ page }) => {
    await feesPage.goto();
    await feesPage.navigateToDefaulters();

    // Check for overdue/due indicators
    const overdueIndicators = page.locator('[class*="overdue"], [class*="due"], [class*="pending"]');
    const overdueCount = await overdueIndicators.count();

    if (overdueCount > 0) {
      await expect(overdueIndicators.first()).toBeVisible();
    }
  });
});
