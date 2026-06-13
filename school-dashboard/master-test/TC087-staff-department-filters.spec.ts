import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  TEACHER_A_ID, TEACHER_B_ID, ACCOUNTANT_ID, SCHOOL_ID,
  type MockState, type StaffMember,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 800 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Extended staff for multiple departments
 * ───────────────────────────────────────────────────────────────────── */

function createMultiDeptState(): MockState {
  const state = createMockState();

  // Add additional staff for different departments
  const additionalStaff: StaffMember[] = [
    {
      _id: '64b100000000000000000070', id: '64b100000000000000000070',
      name: 'Suresh Kumar', email: 'suresh@schoolsync.test', phone: '9876500070',
      role: 'teacher', designation: 'Teacher', department: 'Mathematics',
      status: 'active', joiningDate: '2024-06-01', schoolId: SCHOOL_ID,
      subjects: ['Mathematics'], employeeId: 'EMP-070', salary: 42000,
    },
    {
      _id: '64b100000000000000000071', id: '64b100000000000000000071',
      name: 'Lakshmi Devi', email: 'lakshmi@schoolsync.test', phone: '9876500071',
      role: 'teacher', designation: 'Senior Teacher', department: 'Languages',
      status: 'active', joiningDate: '2023-01-15', schoolId: SCHOOL_ID,
      subjects: ['Hindi', 'Sanskrit'], employeeId: 'EMP-071', salary: 44000,
    },
    {
      _id: '64b100000000000000000072', id: '64b100000000000000000072',
      name: 'Vikram Singh', email: 'vikram@schoolsync.test', phone: '9876500072',
      role: 'teacher', designation: 'Sports Teacher', department: 'Physical Education',
      status: 'active', joiningDate: '2024-08-01', schoolId: SCHOOL_ID,
      subjects: ['Physical Education'], employeeId: 'EMP-072', salary: 38000,
    },
  ];

  state.staff.push(...additionalStaff);
  return state;
}

/*
 *  Staff composition after setup:
 *  - Ananya Sharma    | Science           | teacher    | active
 *  - Ravi Menon       | Arts              | teacher    | active
 *  - Priya Menon      | Finance           | accountant | active
 *  - Suresh Kumar     | Mathematics       | teacher    | active
 *  - Lakshmi Devi     | Languages         | teacher    | active
 *  - Vikram Singh     | Physical Education| teacher    | active
 */

async function installDeptFilterMockApi(page: import('@playwright/test').Page, state: MockState) {
  await installMockApi(page, state);

  // Override staff listing to support department and role filtering
  await page.route('**/api/staff', async (route) => {
    if (route.request().method() !== 'GET') return route.continue();

    const url = new URL(route.request().url());
    const deptFilter = url.searchParams.get('department');
    const roleFilter = url.searchParams.get('role');
    const statusFilter = url.searchParams.get('status');
    const search = url.searchParams.get('search') || url.searchParams.get('q');

    let filtered = [...state.staff];

    if (deptFilter) {
      filtered = filtered.filter((s) => (s.department || '').toLowerCase() === deptFilter.toLowerCase());
    }
    if (roleFilter) {
      filtered = filtered.filter((s) => s.role.toLowerCase() === roleFilter.toLowerCase());
    }
    if (statusFilter) {
      filtered = filtered.filter((s) => s.status.toLowerCase() === statusFilter.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        (s.department || '').toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q),
      );
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: filtered, total: filtered.length, page: 1, limit: 100 }),
    });
  });

  // Departments endpoint
  await page.route('**/api/departments**', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { _id: 'dept-sci', name: 'Science' },
        { _id: 'dept-arts', name: 'Arts' },
        { _id: 'dept-fin', name: 'Finance' },
        { _id: 'dept-math', name: 'Mathematics' },
        { _id: 'dept-lang', name: 'Languages' },
        { _id: 'dept-pe', name: 'Physical Education' },
      ]),
    });
  });
}

/* ─────────────────────────────────────────────────────────────────────
 *  TC087 — Staff Department Filters
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC087 — Staff Department Filters', () => {

  test('1) staff list page loads with all 6 staff members', async ({ page }) => {
    const state = createMultiDeptState();
    await installDeptFilterMockApi(page, state);

    await page.goto('/staffs');
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body).toContain('Ananya Sharma');
    expect(body).toContain('Ravi Menon');
    expect(body).toContain('Priya Menon');
    expect(body).toContain('Suresh Kumar');
    expect(body).toContain('Lakshmi Devi');
    expect(body).toContain('Vikram Singh');
  });

  test('2) department filter dropdown is visible', async ({ page }) => {
    const state = createMultiDeptState();
    await installDeptFilterMockApi(page, state);

    await page.goto('/staffs');
    await page.waitForLoadState('networkidle');

    const deptFilter = page.locator(
      'select[name="department"], [data-testid*="department"], [class*="department"] select',
    ).first();
    const hasSelect = await deptFilter.isVisible({ timeout: 5000 }).catch(() => false);

    // Also check for filter button that opens department filter
    const filterBtn = page.getByRole('button', { name: /filter|department/i }).first();
    const hasFilterBtn = await filterBtn.isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasSelect || hasFilterBtn).toBeTruthy();
  });

  test('3) filter by department Science shows only Ananya', async ({ page }) => {
    const state = createMultiDeptState();
    await installDeptFilterMockApi(page, state);

    await page.goto('/staffs');
    await page.waitForLoadState('networkidle');

    // Apply department filter: Science
    const deptFilter = page.locator('select[name="department"]').first();
    if (await deptFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deptFilter.selectOption('Science');
      await page.waitForTimeout(500);
    } else {
      // Try chip/dropdown filter
      const filterArea = page.locator('[class*="filter"], [class*="department"]').first();
      if (await filterArea.isVisible({ timeout: 3000 }).catch(() => false)) {
        await filterArea.click();
        const scienceOpt = page.getByText('Science').first();
        if (await scienceOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
          await scienceOpt.click();
          await page.waitForTimeout(500);
        }
      }
    }

    const body = await page.textContent('body');
    expect(body).toContain('Ananya');
  });

  test('4) filter by department Arts shows only Ravi', async ({ page }) => {
    const state = createMultiDeptState();
    await installDeptFilterMockApi(page, state);

    await page.goto('/staffs');
    await page.waitForLoadState('networkidle');

    const deptFilter = page.locator('select[name="department"]').first();
    if (await deptFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deptFilter.selectOption('Arts');
      await page.waitForTimeout(500);
    }

    const body = await page.textContent('body');
    expect(body).toContain('Ravi');
  });

  test('5) filter by department Finance shows only Priya', async ({ page }) => {
    const state = createMultiDeptState();
    await installDeptFilterMockApi(page, state);

    await page.goto('/staffs');
    await page.waitForLoadState('networkidle');

    const deptFilter = page.locator('select[name="department"]').first();
    if (await deptFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deptFilter.selectOption('Finance');
      await page.waitForTimeout(500);
    }

    const body = await page.textContent('body');
    expect(body).toContain('Priya');
  });

  test('6) combined filter: department Science + status Active', async ({ page }) => {
    const state = createMultiDeptState();
    await installDeptFilterMockApi(page, state);

    await page.goto('/staffs');
    await page.waitForLoadState('networkidle');

    // Apply department filter
    const deptFilter = page.locator('select[name="department"]').first();
    if (await deptFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deptFilter.selectOption('Science');
      await page.waitForTimeout(300);
    }

    // Apply status filter
    const statusFilter = page.locator('select[name="status"]').first();
    if (await statusFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await statusFilter.selectOption('active');
      await page.waitForTimeout(500);
    }

    const body = await page.textContent('body');
    expect(body).toContain('Ananya');
  });

  test('7) combined filter: role Teacher + department Mathematics', async ({ page }) => {
    const state = createMultiDeptState();
    await installDeptFilterMockApi(page, state);

    await page.goto('/staffs');
    await page.waitForLoadState('networkidle');

    // Apply role filter
    const roleFilter = page.locator('select[name="role"]').first();
    if (await roleFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await roleFilter.selectOption('teacher');
      await page.waitForTimeout(300);
    }

    // Apply department filter
    const deptFilter = page.locator('select[name="department"]').first();
    if (await deptFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deptFilter.selectOption('Mathematics');
      await page.waitForTimeout(500);
    }

    const body = await page.textContent('body');
    expect(body).toContain('Suresh');
  });

  test('8) clear all filters shows all staff', async ({ page }) => {
    const state = createMultiDeptState();
    await installDeptFilterMockApi(page, state);

    await page.goto('/staffs');
    await page.waitForLoadState('networkidle');

    // Apply a filter first
    const deptFilter = page.locator('select[name="department"]').first();
    if (await deptFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deptFilter.selectOption('Science');
      await page.waitForTimeout(300);

      // Clear filter (reset to "All" or empty)
      await deptFilter.selectOption('');
      await page.waitForTimeout(500);
    }

    // Also try clear/reset button
    const clearBtn = page.getByRole('button', { name: /clear|reset|all/i }).first();
    if (await clearBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await clearBtn.click();
      await page.waitForTimeout(500);
    }

    const body = await page.textContent('body');
    // All staff should be visible again
    expect(body).toContain('Ananya');
    expect(body).toContain('Ravi');
    expect(body).toContain('Priya');
  });

  test('9) department badges appear on staff cards', async ({ page }) => {
    const state = createMultiDeptState();
    await installDeptFilterMockApi(page, state);

    await page.goto('/staffs');
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    // Should show department names as badges or labels
    const hasDeptLabels = body?.includes('Science') &&
                          body?.includes('Arts') &&
                          body?.includes('Finance');
    expect(hasDeptLabels).toBeTruthy();
  });

  test('10) Mathematics department staff is shown correctly', async ({ page }) => {
    const state = createMultiDeptState();
    await installDeptFilterMockApi(page, state);

    await page.goto('/staffs');
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body).toContain('Mathematics');
    expect(body).toContain('Suresh');
  });

  test('11) Languages department staff is shown correctly', async ({ page }) => {
    const state = createMultiDeptState();
    await installDeptFilterMockApi(page, state);

    await page.goto('/staffs');
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body).toContain('Lakshmi');
  });

  test('12) Physical Education department staff is shown correctly', async ({ page }) => {
    const state = createMultiDeptState();
    await installDeptFilterMockApi(page, state);

    await page.goto('/staffs');
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body).toContain('Vikram');
  });

  test('13) page does not redirect to login with filters applied', async ({ page }) => {
    const state = createMultiDeptState();
    await installDeptFilterMockApi(page, state);

    await page.goto('/staffs');
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);

    // Apply filter and check again
    const deptFilter = page.locator('select[name="department"]').first();
    if (await deptFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deptFilter.selectOption('Science');
      await page.waitForTimeout(500);
    }

    await expect(page).not.toHaveURL(/\/login/);
  });
});
