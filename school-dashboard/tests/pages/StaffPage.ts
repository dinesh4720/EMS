import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * StaffPage object model for staff management
 */
export class StaffPage extends BasePage {
  readonly pageHeading: Locator;
  readonly addButton: Locator;
  readonly staffTable: Locator;
  readonly searchInput: Locator;
  readonly filterButton: Locator;
  readonly exportButton: Locator;
  readonly attendanceTab: Locator;
  readonly leaveTab: Locator;

  constructor(page: Page) {
    super(page);

    this.pageHeading = page.locator('h1, h2').filter({ hasText: /staff/i });
    this.addButton = page.getByRole('button').filter({ hasText: /add|create|new staff/i });
    this.staffTable = page.locator('table, [role="table"]');
    this.searchInput = page.locator('input[placeholder*="search" i]');
    this.filterButton = page.getByRole('button').filter({ hasText: /filter/i });
    this.exportButton = page.getByRole('button').filter({ hasText: /export/i });
    this.attendanceTab = page.getByRole('tab').filter({ hasText: /attendance/i });
    this.leaveTab = page.getByRole('tab').filter({ hasText: /leave/i });
  }

  async goto() {
    await this.page.goto('/staff');
    await this.waitForPageLoad();
    await expect(this.pageHeading).toBeVisible({ timeout: 10000 });
  }

  async verifyStaffListLoaded() {
    await expect(this.staffTable).toBeVisible({ timeout: 10000 });
    await this.helpers.verifyTableHasData();
  }

  async clickAddStaff() {
    await this.addButton.click();
    await this.helpers.verifyModalVisible('Add Staff|New Staff|Create Staff');
  }

  async fillStaffForm(data: Record<string, string>) {
    await this.helpers.fillForm(data);
  }

  async submitForm() {
    await this.helpers.clickButton(/submit|save|create/i);
    await this.page.waitForTimeout(1000);
  }

  async searchStaff(query: string) {
    await this.helpers.searchTable(query);
    await this.page.waitForTimeout(500);
  }

  async viewStaffDetails(staffName: string) {
    const row = this.staffTable.locator('tr, [role="row"]').filter({ hasText: staffName });
    await row.locator('button, a').filter({ hasText: /view|details/i }).click();
    await this.page.waitForURL('**/staff/**');
  }

  async editStaff(staffName: string) {
    const row = this.staffTable.locator('tr, [role="row"]').filter({ hasText: staffName });
    await row.locator('button').filter({ hasText: /edit|update/i }).click();
    await this.helpers.verifyModalVisible('Edit Staff|Update Staff');
  }

  async deleteStaff(staffName: string) {
    const row = this.staffTable.locator('tr, [role="row"]').filter({ hasText: staffName });
    await row.locator('button').filter({ hasText: /delete|remove/i }).click();
    // Confirm deletion
    await this.page.locator('button').filter({ hasText: /confirm|yes|delete/i }).click();
    await this.helpers.waitForToast('deleted|removed');
  }

  async navigateToAttendance() {
    await this.attendanceTab.click();
    await this.page.waitForTimeout(500);
  }

  async navigateToLeave() {
    await this.leaveTab.click();
    await this.page.waitForTimeout(500);
  }

  async verifyAttendanceView() {
    await expect(this.page.locator('[class*="attendance"], [class*="calendar"]').first()).toBeVisible();
  }
}
