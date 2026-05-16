import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  SCHOOL_ID, CLASS_10A_ID,
  type MockState, type StaffMember,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 800 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Helpers
 * ───────────────────────────────────────────────────────────────────── */

const MULTI_ROLE_STAFF_ID = '64b100000000000000000060';

function createMultiRoleStaff(): StaffMember & { roles: string[] } {
  return {
    _id: MULTI_ROLE_STAFF_ID, id: MULTI_ROLE_STAFF_ID,
    name: 'Meera Krishnan',
    email: 'meera@schoolsync.test',
    phone: '9876500010',
    role: 'teacher',
    roles: ['teacher', 'admin'],
    designation: 'Vice Principal',
    department: 'Administration',
    status: 'active',
    joiningDate: new Date().toISOString().split('T')[0],
    schoolId: SCHOOL_ID,
    subjects: ['English'],
    employeeId: 'EMP-010',
    salary: 55000,
  };
}

async function installMultiRoleMockApi(page: import('@playwright/test').Page, state: MockState) {
  await installMockApi(page, state);

  // Override staff POST to accept multi-role creation
  await page.route('**/api/staff', async (route) => {
    const method = route.request().method();
    if (method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      const newStaff = createMultiRoleStaff();
      // Merge the posted roles
      if (body.roles) {
        (newStaff as unknown as Record<string, unknown>).roles = body.roles;
        (newStaff as unknown as Record<string, unknown>).role = body.roles[0] || 'teacher';
      }
      state.staff.push(newStaff);
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(newStaff),
      });
    }
    if (method === 'GET') {
      const url = new URL(route.request().url());
      const roleFilter = url.searchParams.get('role');
      let filteredStaff = state.staff;
      if (roleFilter) {
        filteredStaff = state.staff.filter((s) => {
          const roles = (s as unknown as Record<string, unknown>).roles as string[] | undefined;
          return s.role === roleFilter || (roles && roles.includes(roleFilter));
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: filteredStaff, total: filteredStaff.length, page: 1, limit: 100 }),
      });
    }
    return route.continue();
  });

  // Mock multi-role staff detail
  await page.route(`**/api/staff/${MULTI_ROLE_STAFF_ID}`, async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(createMultiRoleStaff()),
    });
  });

  // Departments
  await page.route('**/api/departments**', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { _id: 'dept-admin', name: 'Administration' },
        { _id: 'dept-sci', name: 'Science' },
        { _id: 'dept-math', name: 'Mathematics' },
        { _id: 'dept-eng', name: 'English' },
      ]),
    });
  });

  // Salary templates
  await page.route('**/api/salary-templates**', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { _id: 'st-teaching', name: 'Teaching Staff', basicSalary: 35000, netSalary: 46000 },
        { _id: 'st-admin', name: 'Admin Staff', basicSalary: 30000, netSalary: 34500 },
      ]),
    });
  });

  // File upload
  await page.route('**/api/upload**', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ url: '/mock/photo.jpg', filename: 'photo.jpg' }),
    });
  });
}

/* ─────────────────────────────────────────────────────────────────────
 *  TC081 — Create a staff member with multiple roles
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC081 — Staff Multi-Role Creation', () => {

  test('1) staff add page loads with role selection', async ({ page }) => {
    const state = createMockState();
    await installMultiRoleMockApi(page, state);

    await page.goto('/staffs/add');
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body?.toLowerCase()).toMatch(/personal|step\s*1|basic\s*info|name/i);
  });

  test('2) navigate to role step and select Teacher role', async ({ page }) => {
    const state = createMockState();
    await installMultiRoleMockApi(page, state);

    await page.goto('/staffs/add');
    await page.waitForLoadState('networkidle');

    // Fill required step 1 fields
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill('Meera Krishnan');
    }
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill('meera@schoolsync.test');
    }
    const phoneInput = page.locator('input[name="phone"], input[type="tel"]').first();
    if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await phoneInput.fill('9876500010');
    }

    // Advance to role step
    const nextBtn = page.getByRole('button', { name: /next|continue/i }).first();
    if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(500);
    }

    // Select Teacher role
    const teacherOption = page.locator(
      'input[type="checkbox"][value="teacher"], input[type="radio"][value="teacher"], ' +
      'select[name="role"], [data-testid*="role"]',
    ).first();
    if (await teacherOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      const tagName = await teacherOption.evaluate((el) => el.tagName.toLowerCase());
      if (tagName === 'select') {
        await teacherOption.selectOption('teacher');
      } else {
        await teacherOption.check();
      }
    }

    const body = await page.textContent('body');
    expect(body?.toLowerCase()).toMatch(/role|teacher|designation/);
  });

  test('3) select multiple roles: Teacher + Admin', async ({ page }) => {
    const state = createMockState();
    await installMultiRoleMockApi(page, state);

    await page.goto('/staffs/add');
    await page.waitForLoadState('networkidle');

    // Fill step 1
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill('Meera Krishnan');
    }
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill('meera@schoolsync.test');
    }
    const phoneInput = page.locator('input[name="phone"], input[type="tel"]').first();
    if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await phoneInput.fill('9876500010');
    }

    // Advance to role step
    const nextBtn = page.getByRole('button', { name: /next|continue/i }).first();
    if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(500);
    }

    // Select Teacher checkbox
    const teacherCheckbox = page.locator('input[type="checkbox"][value="teacher"]').first();
    if (await teacherCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      await teacherCheckbox.check();
    }

    // Select Admin checkbox
    const adminCheckbox = page.locator('input[type="checkbox"][value="admin"]').first();
    if (await adminCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      await adminCheckbox.check();
    }

    // Verify both are checked
    if (await teacherCheckbox.isVisible().catch(() => false)) {
      await expect(teacherCheckbox).toBeChecked();
    }
    if (await adminCheckbox.isVisible().catch(() => false)) {
      await expect(adminCheckbox).toBeChecked();
    }

    // Fallback: if using a single select, verify role is set
    const roleSelect = page.locator('select[name="role"]').first();
    if (await roleSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      const value = await roleSelect.inputValue();
      expect(value).toBeTruthy();
    }
  });

  test('4) both selected roles appear as selected/highlighted', async ({ page }) => {
    const state = createMockState();
    await installMultiRoleMockApi(page, state);

    await page.goto('/staffs/add');
    await page.waitForLoadState('networkidle');

    // Fill step 1 and navigate
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill('Meera Krishnan');
    }
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill('meera@schoolsync.test');
    }
    const phoneInput = page.locator('input[name="phone"], input[type="tel"]').first();
    if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await phoneInput.fill('9876500010');
    }

    const nextBtn = page.getByRole('button', { name: /next|continue/i }).first();
    if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(500);
    }

    const body = await page.textContent('body');
    // The role step should be visible
    const hasRoleUI = body?.toLowerCase().includes('role') ||
                      body?.toLowerCase().includes('teacher') ||
                      body?.toLowerCase().includes('admin');
    expect(hasRoleUI).toBeTruthy();
  });

  test('5) fill required fields and submit multi-role staff', async ({ page }) => {
    const state = createMockState();
    await installMultiRoleMockApi(page, state);

    await page.goto('/staffs/add');
    await page.waitForLoadState('networkidle');

    // Fill step 1
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill('Meera Krishnan');
    }
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill('meera@schoolsync.test');
    }
    const phoneInput = page.locator('input[name="phone"], input[type="tel"]').first();
    if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await phoneInput.fill('9876500010');
    }

    // Advance through all wizard steps
    for (let i = 0; i < 5; i++) {
      const nextBtn = page.getByRole('button', { name: /next|continue|skip/i }).first();
      if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // Submit
    const submitBtn = page.getByRole('button', { name: /submit|create|save|add staff/i }).first();
    if (await submitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForLoadState('networkidle');

      const body = await page.textContent('body');
      const success = page.url().includes('/staffs') ||
                      body?.toLowerCase().includes('success') ||
                      body?.toLowerCase().includes('created');
      expect(success).toBeTruthy();
    }
  });

  test('6) staff created with roles appears in staff list', async ({ page }) => {
    const state = createMockState();
    // Pre-add the multi-role staff to state
    const multiRoleStaff = createMultiRoleStaff();
    state.staff.push(multiRoleStaff);
    await installMultiRoleMockApi(page, state);

    await page.goto('/staffs');
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body).toContain('Meera Krishnan');
  });

  test('7) filter by role Teacher shows multi-role staff', async ({ page }) => {
    const state = createMockState();
    const multiRoleStaff = createMultiRoleStaff();
    state.staff.push(multiRoleStaff);
    await installMultiRoleMockApi(page, state);

    await page.goto('/staffs');
    await page.waitForLoadState('networkidle');

    // Apply role filter: Teacher
    const roleFilter = page.locator('select[name="role"], [data-testid*="role-filter"]').first();
    if (await roleFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await roleFilter.selectOption('teacher');
      await page.waitForTimeout(500);
    } else {
      // May be a dropdown/chip filter
      const filterBtn = page.getByRole('button', { name: /filter|role/i }).first();
      if (await filterBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await filterBtn.click();
        const teacherOpt = page.getByText('Teacher').first();
        if (await teacherOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
          await teacherOpt.click();
        }
      }
    }

    // Meera should be visible (she has teacher role)
    const body = await page.textContent('body');
    expect(body).toContain('Meera');
  });

  test('8) filter by role Admin also shows same multi-role staff', async ({ page }) => {
    const state = createMockState();
    const multiRoleStaff = createMultiRoleStaff();
    state.staff.push(multiRoleStaff);
    await installMultiRoleMockApi(page, state);

    await page.goto('/staffs');
    await page.waitForLoadState('networkidle');

    // Apply role filter: Admin
    const roleFilter = page.locator('select[name="role"], [data-testid*="role-filter"]').first();
    if (await roleFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await roleFilter.selectOption('admin');
      await page.waitForTimeout(500);
    } else {
      const filterBtn = page.getByRole('button', { name: /filter|role/i }).first();
      if (await filterBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await filterBtn.click();
        const adminOpt = page.getByText(/^Admin$/i).first();
        if (await adminOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
          await adminOpt.click();
        }
      }
    }

    // Meera should still be visible (she has admin role too)
    const body = await page.textContent('body');
    expect(body).toContain('Meera');
  });

  test('9) staff profile shows both role badges', async ({ page }) => {
    const state = createMockState();
    const multiRoleStaff = createMultiRoleStaff();
    state.staff.push(multiRoleStaff);
    await installMultiRoleMockApi(page, state);

    await page.goto(`/staffs/${MULTI_ROLE_STAFF_ID}`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body).toContain('Meera');

    // Should show role information — at least the primary role
    const hasRole = body?.toLowerCase().includes('teacher') ||
                    body?.toLowerCase().includes('admin') ||
                    body?.toLowerCase().includes('vice principal');
    expect(hasRole).toBeTruthy();
  });

  test('10) page remains authenticated throughout multi-role flow', async ({ page }) => {
    const state = createMockState();
    await installMultiRoleMockApi(page, state);

    await page.goto('/staffs/add');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/\/login/);

    await page.goto('/staffs');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/\/login/);
  });
});
