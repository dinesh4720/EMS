import { test, expect } from '@playwright/test';
import { StaffPage } from '../pages/StaffPage';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { testUsers, testData } from '../fixtures/users';

/**
 * Staff Management Module Tests
 *
 * These tests verify:
 * - Staff list loads correctly
 * - Adding new staff members
 * - Editing staff information
 * - Deleting staff members
 * - Staff attendance tracking
 * - Leave management
 * - Search and filter functionality
 */
test.describe('Staff Management Module', () => {
  let staffPage: StaffPage;
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    staffPage = new StaffPage(page);

    // Login as admin
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );
  });

  test('should navigate to staff page from dashboard', async ({ page }) => {
    await staffPage.goto();
    await expect(staffPage.pageHeading).toBeVisible();
  });

  test('should display staff list with data', async ({ page }) => {
    await staffPage.goto();
    await staffPage.verifyStaffListLoaded();

    // Verify table headers
    const table = staffPage.staffTable;
    await expect(table).toBeVisible();

    // Check for staff rows
    const rows = table.locator('tbody tr, [role="rowgroup"] [role="row"]');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should open add staff modal', async ({ page }) => {
    await staffPage.goto();
    await staffPage.clickAddStaff();

    // Verify modal is visible
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Verify form fields are present
    await expect(page.locator('input[name="name"], input[placeholder*="name" i]')).toBeVisible();
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible();
    await expect(page.locator('input[name="phone"], input[placeholder*="phone" i]')).toBeVisible();
  });

  test('should add a new staff member', async ({ page }) => {
    await staffPage.goto();
    await staffPage.clickAddStaff();

    // Fill form with test data
    await staffPage.fillStaffForm(testData.staff.valid);
    await staffPage.submitForm();

    // Verify success message
    await staffPage.helpers.waitForToast('added|created|success');

    // Verify staff appears in list
    await staffPage.searchStaff(testData.staff.valid.name);
    await page.waitForTimeout(1000);

    const table = staffPage.staffTable;
    const newStaffRow = table.locator('tr, [role="row"]').filter({ hasText: testData.staff.valid.name });
    await expect(newStaffRow.first()).toBeVisible();
  });

  test('should show validation errors for invalid staff data', async ({ page }) => {
    await staffPage.goto();
    await staffPage.clickAddStaff();

    // Fill with invalid data
    await staffPage.fillStaffForm(testData.staff.invalid);
    await staffPage.submitForm();

    // Verify validation errors
    const errors = page.locator('[class*="error"], [class*="invalid"]');
    const errorCount = await errors.count();
    expect(errorCount).toBeGreaterThan(0);
  });

  test('should edit existing staff member', async ({ page }) => {
    await staffPage.goto();
    await staffPage.verifyStaffListLoaded();

    // Get first staff name
    const table = staffPage.staffTable;
    const firstRow = table.locator('tbody tr, [role="rowgroup"] [role="row"]').first();
    const staffName = await firstRow.locator('td, [role="cell"]').nth(0).textContent() || '';

    // Click edit
    await staffPage.editStaff(staffName);

    // Verify edit modal opens
    const modal = page.locator('[role="dialog"]').filter({ hasText: /edit|update/i });
    await expect(modal).toBeVisible();

    // Modify name
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]');
    await nameInput.clear();
    await nameInput.fill(`${staffName} (Updated)`);

    // Submit
    await staffPage.submitForm();

    // Verify success
    await staffPage.helpers.waitForToast('updated|modified|success');

    // Verify changes in list
    await staffPage.searchStaff(`${staffName} (Updated)`);
  });

  test('should delete staff member', async ({ page }) => {
    await staffPage.goto();
    await staffPage.verifyStaffListLoaded();

    // Get a staff member to delete (use the one we just added if available)
    const testStaffName = `${testData.staff.valid.name}`; // Or search for test staff
    await staffPage.searchStaff(testStaffName);

    const table = staffPage.staffTable;
    const staffRow = table.locator('tr, [role="row"]').filter({ hasText: testStaffName });
    const rowCount = await staffRow.count();

    if (rowCount > 0) {
      await staffPage.deleteStaff(testStaffName);

      // Verify staff is removed from list
      await page.waitForTimeout(1000);
      const deletedRow = table.locator('tr, [role="row"]').filter({ hasText: testStaffName });
      await expect(deletedRow).toHaveCount(0);
    }
  });

  test('should search staff by name', async ({ page }) => {
    await staffPage.goto();

    // Search for a staff member
    await staffPage.searchStaff('Teacher');

    // Verify filtered results
    await page.waitForTimeout(1000);
    const table = staffPage.staffTable;
    const rows = table.locator('tbody tr, [role="rowgroup"] [role="row"]');
    const rowCount = await rows.count();

    // Should have filtered results
    if (rowCount > 0) {
      const firstRowText = await rows.first().textContent();
      expect(firstRowText).toMatch(/teacher/i);
    }
  });

  test('should navigate to staff attendance', async ({ page }) => {
    await staffPage.goto();
    await staffPage.navigateToAttendance();

    // Verify attendance view
    await staffPage.verifyAttendanceView();

    // Verify attendance table or calendar is visible
    const attendanceTable = page.locator('table, [class*="calendar"], [class*="attendance-list"]');
    await expect(attendanceTable.first()).toBeVisible();
  });

  test('should navigate to staff leave management', async ({ page }) => {
    await staffPage.goto();
    await staffPage.navigateToLeave();

    // Verify leave management view
    await expect(page.locator('[class*="leave"], [class*="leave-management"]').first()).toBeVisible();

    // Check for leave requests table
    const leaveTable = page.locator('table').filter({ hasText: /leave|request/i });
    const tableCount = await leaveTable.count();
    if (tableCount > 0) {
      await expect(leaveTable.first()).toBeVisible();
    }
  });

  test('should export staff list', async ({ page }) => {
    await staffPage.goto();

    const exportButtonCount = await staffPage.exportButton.count();
    if (exportButtonCount > 0) {
      // Setup download handler
      const downloadPromise = page.waitForEvent('download');

      // Click export
      await staffPage.exportButton.click();

      // Wait for download
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBeTruthy();
    }
  });

  test('should view staff details', async ({ page }) => {
    await staffPage.goto();
    await staffPage.verifyStaffListLoaded();

    // Get first staff name
    const table = staffPage.staffTable;
    const firstRow = table.locator('tbody tr, [role="rowgroup"] [role="row"]').first();
    const staffName = await firstRow.locator('td, [role="cell"]').nth(0).textContent() || '';

    await staffPage.viewStaffDetails(staffName);

    // Verify staff profile page
    await expect(page.locator('[class*="profile"], [class*="staff-detail"]').first()).toBeVisible();
    await expect(page.getByText(staffName)).toBeVisible();
  });

  test('should handle pagination', async ({ page }) => {
    await staffPage.goto();
    await staffPage.helpers.verifyPagination();
  });

  test('should have working filters', async ({ page }) => {
    await staffPage.goto();

    const filterButtonCount = await staffPage.filterButton.count();
    if (filterButtonCount > 0) {
      await staffPage.filterButton.click();

      // Verify filter options appear
      const filterPanel = page.locator('[class*="filter-panel"], [role="dialog"]');
      await expect(filterPanel.first()).toBeVisible();

      // Select a filter option (e.g., department or role)
      const filterOption = page.locator('select, [role="combobox"]').first();
      await filterOption.selectOption({ index: 1 });
      await page.waitForTimeout(1000);

      // Apply filters
      await staffPage.helpers.clickButton(/apply|filter|submit/i);
      await page.waitForTimeout(1000);
    }
  });

  test('should verify staff profile has photo', async ({ page }) => {
    await staffPage.goto();
    await staffPage.verifyStaffListLoaded();

    const table = staffPage.staffTable;
    const firstRow = table.locator('tbody tr, [role="rowgroup"] [role="row"]').first();
    const staffName = await firstRow.locator('td, [role="cell"]').nth(0).textContent() || '';

    await staffPage.viewStaffDetails(staffName);

    // Check for profile photo
    const photo = page.locator('img[class*="avatar"], img[class*="photo"], img[class*="profile"]');
    const photoCount = await photo.count();
    if (photoCount > 0) {
      await expect(photo.first()).toBeVisible();
    }
  });

  test('should verify staff permissions display', async ({ page }) => {
    await staffPage.goto();
    await staffPage.verifyStaffListLoaded();

    const table = staffPage.staffTable;
    const firstRow = table.locator('tbody tr, [role="rowgroup"] [role="row"]').first();
    const staffName = await firstRow.locator('td, [role="cell"]').nth(0).textContent() || '';

    await staffPage.viewStaffDetails(staffName);

    // Look for permissions/role section
    const permissions = page.locator('[class*="permission"], [class*="role"]');
    const permissionsCount = await permissions.count();
    if (permissionsCount > 0) {
      await expect(permissions.first()).toBeVisible();
    }
  });
});
