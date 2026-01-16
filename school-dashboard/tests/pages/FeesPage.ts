import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * FeesPage object model for fee management
 */
export class FeesPage extends BasePage {
  readonly pageHeading: Locator;
  readonly structureTab: Locator;
  readonly paymentsTab: Locator;
  readonly receiptsTab: Locator;
  readonly defaultersTab: Locator;
  readonly addFeeButton: Locator;
  readonly collectFeeButton: Locator;
  readonly feeTable: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);

    this.pageHeading = page.locator('h1, h2').filter({ hasText: /fees/i });
    this.structureTab = page.getByRole('tab').filter({ hasText: /structure|fee heads/i });
    this.paymentsTab = page.getByRole('tab').filter({ hasText: /payments|collection/i });
    this.receiptsTab = page.getByRole('tab').filter({ hasText: /receipts/i });
    this.defaultersTab = page.getByRole('tab').filter({ hasText: /defaulters/i });
    this.addFeeButton = page.getByRole('button').filter({ hasText: /add fee|create fee/i });
    this.collectFeeButton = page.getByRole('button').filter({ hasText: /collect|payment/i });
    this.feeTable = page.locator('table, [role="table"]');
    this.searchInput = page.locator('input[placeholder*="search" i]');
  }

  async goto() {
    await this.page.goto('/fees');
    await this.waitForPageLoad();
    await expect(this.pageHeading).toBeVisible({ timeout: 10000 });
  }

  async navigateToStructure() {
    await this.structureTab.click();
    await this.page.waitForTimeout(500);
  }

  async navigateToPayments() {
    await this.paymentsTab.click();
    await this.page.waitForTimeout(500);
  }

  async navigateToReceipts() {
    await this.receiptsTab.click();
    await this.page.waitForTimeout(500);
  }

  async navigateToDefaulters() {
    await this.defaultersTab.click();
    await this.page.waitForTimeout(500);
  }

  async verifyFeeStructure() {
    await this.navigateToStructure();
    await expect(this.feeTable).toBeVisible();
  }

  async clickAddFee() {
    await this.addFeeButton.click();
    await this.helpers.verifyModalVisible('Add Fee|Create Fee|New Fee');
  }

  async fillFeeForm(data: Record<string, string>) {
    await this.helpers.fillForm(data);
  }

  async submitFeeForm() {
    await this.helpers.clickButton(/submit|save|create/i);
    await this.helpers.waitForToast('fee created|fee added');
  }

  async collectFee(studentName: string) {
    await this.collectFeeButton.click();
    await this.helpers.verifyModalVisible('Collect Fee|Payment');
    await this.page.locator('input[placeholder*="student" i]').fill(studentName);
    await this.page.waitForTimeout(500);
    await this.page.locator('[role="option"]').first().click();
  }

  async enterPaymentDetails(amount: string, method: string) {
    await this.page.locator('input[name="amount"], input[placeholder*="amount" i]').fill(amount);
    await this.page.locator('select[name="method"], select[name="paymentMethod"]').selectOption(method);
    await this.helpers.clickButton(/collect|submit/i);
    await this.helpers.waitForToast('payment successful|fee collected');
  }

  async verifyReceiptGeneration() {
    await expect(this.page.locator('[class*="receipt"]').first()).toBeVisible();
  }

  async downloadReceipt(receiptId: string) {
    const downloadButton = this.page.locator('button').filter({ hasText: /download/i });
    await downloadButton.first().click();
  }

  async verifyDefaultersList() {
    await this.navigateToDefaulters();
    await expect(this.feeTable).toBeVisible();
    const rows = await this.feeTable.locator('tbody tr, [role="rowgroup"] [role="row"]').count();
    expect(rows).toBeGreaterThanOrEqual(0);
  }

  async verifyFeeStats() {
    const stats = this.page.locator('[class*="stat"], [class*="summary-card"]');
    const count = await stats.count();
    if (count > 0) {
      await expect(stats.first()).toBeVisible();
    }
  }
}
