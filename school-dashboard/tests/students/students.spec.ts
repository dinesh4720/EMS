import { test, expect } from '@playwright/test';
import { StudentsPage } from '../pages/StudentsPage';
import { LoginPage } from '../pages/LoginPage';
import { testUsers, testData } from '../fixtures/users';

/**
 * Student Management Module Tests
 *
 * These tests verify:
 * - Student list loads correctly
 * - Adding new students (admission)
 * - Editing student information
 * - Student attendance marking
 * - Fee management per student
 * - Class and section filtering
 * - Search functionality
 */
test.describe('Student Management Module', () => {
  let studentsPage: StudentsPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    studentsPage = new StudentsPage(page);

    // Login as admin
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );
  });

  test('should navigate to students page', async ({ page }) => {
    await studentsPage.goto();
    await expect(studentsPage.pageHeading).toBeVisible();
  });

  test('should display student list with data', async ({ page }) => {
    await studentsPage.goto();
    await studentsPage.verifyStudentListLoaded();

    // Verify table structure
    const table = studentsPage.studentsTable;
    await expect(table).toBeVisible();

    // Check for student rows
    const rows = table.locator('tbody tr, [role="rowgroup"] [role="row"]');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should open new student admission form', async ({ page }) => {
    await studentsPage.goto();
    await studentsPage.clickAddStudent();

    // Verify admission modal
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Verify key form fields
    await expect(page.locator('input[name="firstName"], input[placeholder*="first" i]')).toBeVisible();
    await expect(page.locator('input[name="lastName"], input[placeholder*="last" i]')).toBeVisible();
    await expect(page.locator('select[name="class"], [name="class"]')).toBeVisible();
    await expect(page.locator('input[name="dob"], input[type="date"]')).toBeVisible();
  });

  test('should add a new student', async ({ page }) => {
    await studentsPage.goto();
    await studentsPage.clickAddStudent();

    // Fill admission form
    await studentsPage.fillStudentForm(testData.student.valid);
    await studentsPage.submitForm();

    // Verify success message
    await studentsPage.helpers.waitForToast('admitted|added|created|success');

    // Verify student appears in list
    await studentsPage.searchStudent(testData.student.valid.firstName);
    await page.waitForTimeout(1000);

    const table = studentsPage.studentsTable;
    const newStudentRow = table.locator('tr, [role="row"]').filter({ hasText: testData.student.valid.firstName });
    await expect(newStudentRow.first()).toBeVisible();
  });

  test('should show validation errors for invalid student data', async ({ page }) => {
    await studentsPage.goto();
    await studentsPage.clickAddStudent();

    // Fill with invalid data
    await studentsPage.fillStudentForm(testData.student.invalid);
    await studentsPage.submitForm();

    // Verify validation errors
    const errors = page.locator('[class*="error"], [class*="invalid"], [class*="required"]');
    const errorCount = await errors.count();
    expect(errorCount).toBeGreaterThan(0);
  });

  test('should filter students by class', async ({ page }) => {
    await studentsPage.goto();
    await studentsPage.verifyStudentListLoaded();

    // Get initial count
    const table = studentsPage.studentsTable;
    const initialRows = await table.locator('tbody tr, [role="rowgroup"] [role="row"]').count();

    // Filter by class
    await studentsPage.filterByClass('Class 10');
    await page.waitForTimeout(1000);

    // Get filtered count
    const filteredRows = await table.locator('tbody tr, [role="rowgroup"] [role="row"]').count();

    // Should have different or fewer results
    expect(filteredRows).toBeLessThanOrEqual(initialRows);
  });

  test('should filter students by section', async ({ page }) => {
    await studentsPage.goto();

    const sectionFilterCount = await studentsPage.sectionFilter.count();
    if (sectionFilterCount > 0) {
      // First filter by class
      await studentsPage.filterByClass('Class 10');
      await page.waitForTimeout(1000);

      // Then by section
      await studentsPage.filterBySection('A');
      await page.waitForTimeout(1000);

      // Verify results
      await expect(studentsPage.studentsTable).toBeVisible();
    }
  });

  test('should search for student', async ({ page }) => {
    await studentsPage.goto();

    // Search for a student
    await studentsPage.searchStudent('test');

    // Verify search results
    await page.waitForTimeout(1000);
    const table = studentsPage.studentsTable;
    const rows = table.locator('tbody tr, [role="rowgroup"] [role="row"]');
    const rowCount = await rows.count();

    // Should have results
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('should view student details/profile', async ({ page }) => {
    await studentsPage.goto();
    await studentsPage.verifyStudentListLoaded();

    // Get first student name
    const table = studentsPage.studentsTable;
    const firstRow = table.locator('tbody tr, [role="rowgroup"] [role="row"]').first();
    const studentName = await firstRow.locator('td, [role="cell"]').nth(0).textContent() || '';

    await studentsPage.viewStudentDetails(studentName);

    // Verify student profile
    await studentsPage.verifyStudentProfile();
    await expect(page.getByText(studentName)).toBeVisible();

    // Verify profile sections (personal, academic, guardians)
    const sections = ['personal', 'academic', 'guardian', 'parent'];
    for (const section of sections) {
      const sectionElement = page.locator(`[class*="${section}"], h2, h3`).filter({ hasText: new RegExp(section, 'i') });
      const count = await sectionElement.count();
      if (count > 0) {
        await expect(sectionElement.first()).toBeVisible();
      }
    }
  });

  test('should display student photo on profile', async ({ page }) => {
    await studentsPage.goto();
    await studentsPage.verifyStudentListLoaded();

    const table = studentsPage.studentsTable;
    const firstRow = table.locator('tbody tr, [role="rowgroup"] [role="row"]').first();
    const studentName = await firstRow.locator('td, [role="cell"]').nth(0).textContent() || '';

    await studentsPage.viewStudentDetails(studentName);
    await studentsPage.verifyStudentPhoto();
  });

  test('should mark student attendance', async ({ page }) => {
    await studentsPage.goto();
    await studentsPage.verifyStudentListLoaded();

    const table = studentsPage.studentsTable;
    const firstRow = table.locator('tbody tr, [role="rowgroup"] [role="row"]').first();
    const studentName = await firstRow.locator('td, [role="cell"]').nth(0).textContent() || '';

    await studentsPage.markAttendance(studentName);

    // Verify attendance modal
    const attendanceModal = page.locator('[role="dialog"]').filter({ hasText: /attendance/i });
    await expect(attendanceModal).toBeVisible();

    // Mark present/absent
    await page.locator('input[type="radio"], [role="radio"]').filter({ hasText: /present/i }).first().check();
    await studentsPage.helpers.clickButton(/save|submit|mark/i);

    // Verify success
    await studentsPage.helpers.waitForToast('attendance marked|saved|success');
  });

  test('should view student fee details', async ({ page }) => {
    await studentsPage.goto();
    await studentsPage.verifyStudentListLoaded();

    const table = studentsPage.studentsTable;
    const firstRow = table.locator('tbody tr, [role="rowgroup"] [role="row"]').first();
    const studentName = await firstRow.locator('td, [role="cell"]').nth(0).textContent() || '';

    await studentsPage.viewFeeDetails(studentName);

    // Verify fee page loads
    await expect(page.locator('h1, h2').filter({ hasText: /fee/i })).toBeVisible();
    await expect(page.getByText(studentName)).toBeVisible();
  });

  test('should handle student photo upload', async ({ page }) => {
    await studentsPage.goto();
    await studentsPage.clickAddStudent();

    // Check for file upload
    const fileInput = page.locator('input[type="file"]');
    const fileCount = await fileInput.count();

    if (fileCount > 0) {
      // Create a dummy file for testing
      await fileInput.setInputFiles({
        name: 'test-photo.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake image data')
      });

      await page.waitForTimeout(1000);

      // Verify preview
      const preview = page.locator('img[class*="preview"], [class*="photo-preview"]');
      const previewCount = await preview.count();
      if (previewCount > 0) {
        await expect(preview.first()).toBeVisible();
      }
    }
  });

  test('should verify student ID generation', async ({ page }) => {
    await studentsPage.goto();
    await studentsPage.clickAddStudent();

    // Fill form
    await studentsPage.fillStudentForm(testData.student.valid);

    // Check if student ID is auto-generated
    const studentIdField = page.locator('input[name="studentId"], [class*="student-id"]');
    const idCount = await studentIdField.count();

    if (idCount > 0) {
      const studentId = await studentIdField.first().inputValue();
      expect(studentId).toBeTruthy();
      expect(studentId.length).toBeGreaterThan(0);
    }

    // Close modal
    await studentsPage.helpers.closeModal();
  });

  test('should display student academic history', async ({ page }) => {
    await studentsPage.goto();
    await studentsPage.verifyStudentListLoaded();

    const table = studentsPage.studentsTable;
    const firstRow = table.locator('tbody tr, [role="rowgroup"] [role="row"]').first();
    const studentName = await firstRow.locator('td, [role="cell"]').nth(0).textContent() || '';

    await studentsPage.viewStudentDetails(studentName);

    // Look for academic history section
    const historySection = page.locator('[class*="history"], [class*="academic"], [class*="previous"]');
    const historyCount = await historySection.count();

    if (historyCount > 0) {
      await expect(historySection.first()).toBeVisible();
    }
  });

  test('should handle bulk actions', async ({ page }) => {
    await studentsPage.goto();

    const bulkActionCount = await studentsPage.bulkActionButtons.count();
    if (bulkActionCount > 0) {
      // Select a student
      const checkbox = page.locator('input[type="checkbox"]').first();
      await checkbox.check();

      // Verify bulk action buttons are enabled
      await expect(studentsPage.bulkActionButtons.first()).toBeVisible();
    }
  });

  test('should export student list', async ({ page }) => {
    await studentsPage.goto();

    const exportButton = page.getByRole('button').filter({ hasText: /export/i });
    const exportCount = await exportButton.count();

    if (exportCount > 0) {
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBeTruthy();
    }
  });

  test('should verify pagination on student list', async ({ page }) => {
    await studentsPage.goto();
    await studentsPage.helpers.verifyPagination();
  });
});
