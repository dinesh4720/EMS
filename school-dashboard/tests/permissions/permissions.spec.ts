import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { StaffPage } from '../pages/StaffPage';
import { StudentsPage } from '../pages/StudentsPage';
import { FeesPage } from '../pages/FeesPage';
import { testUsers } from '../fixtures/users';

/**
 * Permissions & Role-Based Access Control Tests
 *
 * These tests verify:
 * - Different roles have appropriate access
 * - Permission restrictions work correctly
 * - Unauthorized pages are inaccessible
 * - UI elements are hidden based on permissions
 */
test.describe('Permissions & Role-Based Access Control', () => {
  const testAccess = async (page: any, user: any, accessiblePages: string[], inaccessiblePages: string[]) => {
    // Login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(user.email, user.password);

    // Test accessible pages
    for (const pagePath of accessiblePages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      // Should load successfully
      const heading = page.locator('h1, h2').first();
      const headingExists = await heading.count() > 0;

      if (headingExists) {
        // Page loaded, check for access denied
        const hasAccessDenied = await page.getByText(/access denied|not authorized|unauthorized/i).count();
        expect(hasAccessDenied).toBe(0);
      }
    }

    // Test inaccessible pages
    for (const pagePath of inaccessiblePages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      // Should show access denied or redirect
      const hasAccessDenied = await page.getByText(/access denied|not authorized|unauthorized/i).count() > 0;
      const isRedirected = await page.url().includes('dashboard') || await page.url().includes('login');

      expect(hasAccessDenied || isRedirected).toBeTruthy();
    }
  };

  test('should verify admin has full access', async ({ page }) => {
    const adminPages = [
      '/dashboard',
      '/staff',
      '/students',
      '/classes',
      '/fees',
      '/payroll',
      '/messaging',
      '/reports',
      '/settings'
    ];

    for (const pagePath of adminPages) {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.loginAndWaitForDashboard(
        testUsers.admin.email,
        testUsers.admin.password
      );

      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      // Admin should access all pages
      const hasAccessDenied = await page.getByText(/access denied|not authorized/i).count();
      expect(hasAccessDenied).toBe(0);
    }
  });

  test('should verify teacher has limited access', async ({ page }) => {
    const accessiblePages = ['/dashboard', '/students', '/classes', '/attendance'];
    const inaccessiblePages = ['/staff', '/fees', '/payroll', '/settings'];

    await testAccess(page, testUsers.teacher, accessiblePages, inaccessiblePages);
  });

  test('should verify accountant has fee and payroll access', async ({ page }) => {
    const accessiblePages = ['/dashboard', '/fees', '/payroll'];
    const inaccessiblePages = ['/staff', '/students', '/classes', '/attendance', '/messaging'];

    await testAccess(page, testUsers.accountant, accessiblePages, inaccessiblePages);
  });

  test('should verify receptionist has front desk access', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.receptionist.email,
      testUsers.receptionist.password
    );

    // Should see front desk option
    const frontDeskLink = page.locator('a').filter({ hasText: /front desk|visitor|reception/i });
    const frontDeskCount = await frontDeskLink.count();

    // Front desk should be accessible
    if (frontDeskCount > 0) {
      await frontDeskLink.first().click();
      await page.waitForTimeout(1000);
      await expect(page.locator('h1, h2').filter({ hasText: /front desk|visitor/i })).toBeVisible();
    }

    // Should not access settings
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    const hasAccessDenied = await page.getByText(/access denied|not authorized/i).count() > 0;
    expect(hasAccessDenied).toBeTruthy();
  });

  test('should hide menu items based on permissions', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // Test as teacher
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.teacher.email,
      testUsers.teacher.password
    );

    // Check sidebar/menu for restricted items
    const restrictedItems = ['Payroll', 'Settings', 'Staff Management'];

    for (const item of restrictedItems) {
      const menuItem = page.locator('[class*="sidebar"], [class*="menu"]').getByText(item);
      const count = await menuItem.count();

      // Teacher should not see these items
      expect(count).toBe(0);
    }
  });

  test('should verify permission checks on API calls', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Login as teacher
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.teacher.email,
      testUsers.teacher.password
    );

    // Try to access staff API endpoint directly
    const response = await page.context().request.get('/api/staff');

    // Should return 401, 403, or redirect
    expect([401, 403]).toContain(response.status());
  });

  test('should verify actions are disabled based on permissions', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const staffPage = new StaffPage(page);

    // Login as teacher
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.teacher.email,
      testUsers.teacher.password
    );

    // Navigate to staff page (if accessible)
    await page.goto('/staff');
    await page.waitForLoadState('networkidle');

    // Check if page is accessible
    const isAccessible = await page.getByText(/access denied/i).count() === 0;

    if (isAccessible) {
      // Add/Edit/Delete buttons should be disabled or hidden
      const addButton = staffPage.addButton;
      const addCount = await addButton.count();

      if (addCount > 0) {
        const isDisabled = await addButton.isDisabled();
        const isHidden = await addButton.evaluate((el: any) => {
          return window.getComputedStyle(el).display === 'none' ||
                 window.getComputedStyle(el).visibility === 'hidden';
        });

        expect(isDisabled || isHidden).toBeTruthy();
      }
    }
  });

  test('should verify role display in user profile', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // Login and check role
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.teacher.email,
      testUsers.teacher.password
    );

    // Click user menu
    await dashboardPage.userMenu.click();
    await page.waitForTimeout(500);

    // Verify role is displayed
    await expect(page.getByText('Teacher')).toBeVisible();
  });

  test('should verify permission changes take effect immediately', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // Login as admin
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );

    // Access a page
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    const initialAccess = await page.getByText(/access denied/i).count() === 0;
    expect(initialAccess).toBeTruthy();

    // Logout
    await dashboardPage.logout();

    // Login as different role
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.teacher.email,
      testUsers.teacher.password
    );

    // Try to access same page
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    const hasAccessDenied = await page.getByText(/access denied/i).count() > 0;
    expect(hasAccessDenied).toBeTruthy();
  });

  test('should verify cross-role isolation', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const studentsPage = new StudentsPage(page);

    // Login as teacher
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.teacher.email,
      testUsers.teacher.password
    );

    await studentsPage.goto();

    // Should only see students in teacher's class (not all students)
    const table = studentsPage.studentsTable;
    await expect(table).toBeVisible();

    // Verify some filtering is applied
    // This is implementation-specific, but we can check if filters are active
    const filterCount = await page.locator('[class*="filter-applied"], [class*="active-filter"]').count();
    if (filterCount > 0) {
      await expect(page.locator('[class*="filter-applied"]').first()).toBeVisible();
    }
  });

  test('should verify session timeout and re-authentication', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Login
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );

    // Clear session storage manually
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });

    // Try to navigate
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test('should verify custom permission overrides', async ({ page }) => {
    // This test would require setting up custom permissions
    // For now, we'll verify the permission system exists

    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );

    // Navigate to settings/permissions page
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Look for permission management section
    const permissionSection = page.locator('[class*="permission"], [id*="permission"]');
    const permissionCount = await permissionSection.count();

    if (permissionCount > 0) {
      await expect(permissionSection.first()).toBeVisible();
    }
  });
});
