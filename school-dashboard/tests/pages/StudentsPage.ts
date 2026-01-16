import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * StudentsPage object model for student management
 */
export class StudentsPage extends BasePage {
  readonly pageHeading: Locator;
  readonly addButton: Locator;
  readonly studentsTable: Locator;
  readonly searchInput: Locator;
  readonly classFilter: Locator;
  readonly sectionFilter: Locator;
  readonly attendanceButton: Locator;
  readonly feeButton: Locator;
  readonly bulkActionButtons: Locator;

  constructor(page: Page) {
    super(page);

    this.pageHeading = page.locator('h1, h2').filter({ hasText: /students/i });
    this.addButton = page.getByRole('button').filter({ hasText: /add student|new admission|admit/i });
    this.studentsTable = page.locator('table, [role="table"]');
    this.searchInput = page.locator('input[placeholder*="search" i]');
    this.classFilter = page.locator('select[name="class"], [class*="class-filter"]').first();
    this.sectionFilter = page.locator('select[name="section"], [class*="section-filter"]').first();
    this.attendanceButton = page.getByRole('button').filter({ hasText: /attendance/i });
    this.feeButton = page.getByRole('button').filter({ hasText: /fee/i });
    this.bulkActionButtons = page.locator('[class*="bulk-action"], [class*="batch-action"]');
  }

  async goto() {
    await this.page.goto('/students');
    await this.waitForPageLoad();
    await expect(this.pageHeading).toBeVisible({ timeout: 10000 });
  }

  async verifyStudentListLoaded() {
    await expect(this.studentsTable).toBeVisible({ timeout: 10000 });
    await this.helpers.verifyTableHasData();
  }

  async clickAddStudent() {
    await this.addButton.click();
    await this.helpers.verifyModalVisible('Add Student|New Admission|Admit Student');
  }

  async fillStudentForm(data: Record<string, string>) {
    await this.helpers.fillForm(data);
  }

  async submitForm() {
    await this.helpers.clickButton(/submit|save|admit/i);
    await this.page.waitForTimeout(1000);
  }

  async filterByClass(className: string) {
    await this.classFilter.selectOption(className);
    await this.page.waitForTimeout(500);
  }

  async filterBySection(section: string) {
    await this.sectionFilter.selectOption(section);
    await this.page.waitForTimeout(500);
  }

  async searchStudent(query: string) {
    await this.helpers.searchTable(query);
    await this.page.waitForTimeout(500);
  }

  async viewStudentDetails(studentName: string) {
    const row = this.studentsTable.locator('tr, [role="row"]').filter({ hasText: studentName });
    await row.locator('button, a').filter({ hasText: /view|profile/i }).click();
    await this.page.waitForURL('**/students/**');
  }

  async markAttendance(studentName: string) {
    const row = this.studentsTable.locator('tr, [role="row"]').filter({ hasText: studentName });
    await row.locator('[class*="attendance"]').first().click();
    await this.helpers.verifyModalVisible('Attendance');
  }

  async viewFeeDetails(studentName: string) {
    const row = this.studentsTable.locator('tr, [role="row"]').filter({ hasText: studentName });
    await row.locator('button').filter({ hasText: /fee|payment/i }).click();
    await this.page.waitForURL('**/fees/**');
  }

  async verifyStudentProfile() {
    await expect(this.page.locator('[class*="profile"], [class*="student-detail"]').first()).toBeVisible();
  }

  async verifyStudentPhoto() {
    const photo = this.page.locator('img[class*="avatar"], img[class*="photo"], img[class*="profile"]').first();
    const count = await photo.count();
    if (count > 0) {
      await expect(photo).toBeVisible();
    }
  }
}
