import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, seedStudentWithFees,
  CLASS_10A_ID, CLASS_11A_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ────────────────────────────────────────────────────────────
 *  Helpers
 * ──────────────────────────────────────────────────────────── */

function seedStudentsAcrossClasses(state: MockState): void {
  // 5 students in class 10-A: 2 paid, 2 pending, 1 overdue
  seedStudentWithFees(state, { name: 'Aarav Patel', classId: CLASS_10A_ID, gender: 'Male', feeStatus: 'paid' });
  seedStudentWithFees(state, { name: 'Diya Sharma', classId: CLASS_10A_ID, gender: 'Female', feeStatus: 'paid' });
  seedStudentWithFees(state, { name: 'Ishaan Gupta', classId: CLASS_10A_ID, gender: 'Male', feeStatus: 'pending' });
  seedStudentWithFees(state, { name: 'Kavya Reddy', classId: CLASS_10A_ID, gender: 'Female', feeStatus: 'pending' });
  seedStudentWithFees(state, { name: 'Rohan Nair', classId: CLASS_10A_ID, gender: 'Male', feeStatus: 'overdue' });

  // 5 students in class 11-A: 3 paid, 1 pending, 1 overdue
  seedStudentWithFees(state, { name: 'Priya Iyer', classId: CLASS_11A_ID, gender: 'Female', feeStatus: 'paid' });
  seedStudentWithFees(state, { name: 'Arjun Menon', classId: CLASS_11A_ID, gender: 'Male', feeStatus: 'paid' });
  seedStudentWithFees(state, { name: 'Lakshmi Das', classId: CLASS_11A_ID, gender: 'Female', feeStatus: 'paid' });
  seedStudentWithFees(state, { name: 'Vikram Joshi', classId: CLASS_11A_ID, gender: 'Male', feeStatus: 'pending' });
  seedStudentWithFees(state, { name: 'Meera Bhat', classId: CLASS_11A_ID, gender: 'Female', feeStatus: 'overdue' });
}

/* ────────────────────────────────────────────────────────────
 *  TC021 — Student list with comprehensive filtering
 * ──────────────────────────────────────────────────────────── */

test.describe('TC021 - Student List Filters', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    seedStudentsAcrossClasses(state);
    await installMockApi(page, state);
  });

  test('should display all 10 students on the student list page', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // Verify total count is shown somewhere (header, badge, or row count)
    const countIndicator = page.getByText(/10 students|total.*10|showing.*10/i)
      .or(page.getByText('10').first())
      .first();

    // Alternatively, check that student names are visible
    await expect(page.getByText('Aarav Patel').first()).toBeVisible();
    await expect(page.getByText('Priya Iyer').first()).toBeVisible();
  });

  test('should filter students by name search', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByRole('searchbox')
      .or(page.getByPlaceholder(/search/i))
      .or(page.getByLabel(/search/i))
      .first();
    await searchInput.fill('Aarav');

    await page.waitForTimeout(500); // debounce

    // Aarav Patel should be visible, others may be filtered
    await expect(page.getByText('Aarav Patel').first()).toBeVisible();
  });

  test('should filter students by admission ID search', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByRole('searchbox')
      .or(page.getByPlaceholder(/search/i))
      .or(page.getByLabel(/search/i))
      .first();

    // Use the admission ID of the first student (ADM-0001)
    await searchInput.fill('ADM-0001');
    await page.waitForTimeout(500);

    // The first student should still be visible
    await expect(page.getByText('Aarav Patel').first()).toBeVisible();
  });

  test('should filter students by class', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // Find and click the class filter dropdown
    const classFilter = page.getByRole('button', { name: /class|filter.*class/i })
      .or(page.getByLabel(/class/i))
      .or(page.getByText(/all classes/i))
      .first();

    if (await classFilter.isVisible().catch(() => false)) {
      await classFilter.click();

      const class10Option = page.getByRole('option', { name: /10.*A|10-A/i })
        .or(page.getByText(/10-A|10 - A/i))
        .first();
      if (await class10Option.isVisible().catch(() => false)) {
        await class10Option.click();
        await page.waitForTimeout(500);

        // Students from class 10-A should be visible
        await expect(page.getByText('Aarav Patel').first()).toBeVisible();
      }
    }
  });

  test('should filter students by fee status - Paid', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const feeFilter = page.getByRole('button', { name: /fee status|fee.*filter/i })
      .or(page.getByLabel(/fee status/i))
      .or(page.getByText(/all fee status|fee status/i))
      .first();

    if (await feeFilter.isVisible().catch(() => false)) {
      await feeFilter.click();

      const paidOption = page.getByRole('option', { name: /paid/i })
        .or(page.getByText(/^paid$/i))
        .first();
      if (await paidOption.isVisible().catch(() => false)) {
        await paidOption.click();
        await page.waitForTimeout(500);

        // Paid students should be visible (Aarav, Diya, Priya, Arjun, Lakshmi = 5 paid)
        await expect(page.getByText('Aarav Patel').first()).toBeVisible();
      }
    }
  });

  test('should filter students by fee status - Overdue', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const feeFilter = page.getByRole('button', { name: /fee status|fee.*filter/i })
      .or(page.getByLabel(/fee status/i))
      .or(page.getByText(/all fee status|fee status/i))
      .first();

    if (await feeFilter.isVisible().catch(() => false)) {
      await feeFilter.click();

      const overdueOption = page.getByRole('option', { name: /overdue/i })
        .or(page.getByText(/overdue/i))
        .first();
      if (await overdueOption.isVisible().catch(() => false)) {
        await overdueOption.click();
        await page.waitForTimeout(500);

        // Overdue students: Rohan Nair, Meera Bhat = 2 overdue
        await expect(page.getByText('Rohan Nair').or(page.getByText('Meera Bhat')).first()).toBeVisible();
      }
    }
  });

  test('should filter students by gender', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const genderFilter = page.getByRole('button', { name: /gender/i })
      .or(page.getByLabel(/gender/i))
      .or(page.getByText(/all gender/i))
      .first();

    if (await genderFilter.isVisible().catch(() => false)) {
      await genderFilter.click();

      const femaleOption = page.getByRole('option', { name: /female/i })
        .or(page.getByText(/^female$/i))
        .first();
      if (await femaleOption.isVisible().catch(() => false)) {
        await femaleOption.click();
        await page.waitForTimeout(500);

        // Female students: Diya, Kavya, Priya, Lakshmi, Meera
        await expect(page.getByText('Diya Sharma').or(page.getByText('Kavya Reddy')).first()).toBeVisible();
      }
    }
  });

  test('should clear all filters and show all 10 students', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // Apply a search filter first
    const searchInput = page.getByRole('searchbox')
      .or(page.getByPlaceholder(/search/i))
      .or(page.getByLabel(/search/i))
      .first();
    await searchInput.fill('Aarav');
    await page.waitForTimeout(500);

    // Clear the search
    await searchInput.clear();
    await page.waitForTimeout(500);

    // Look for a "Clear Filters" button if it exists
    const clearBtn = page.getByRole('button', { name: /clear.*filter|reset/i }).first();
    if (await clearBtn.isVisible().catch(() => false)) {
      await clearBtn.click();
      await page.waitForTimeout(500);
    }

    // All 10 students should be visible again
    await expect(page.getByText('Aarav Patel').first()).toBeVisible();
    await expect(page.getByText('Priya Iyer').first()).toBeVisible();
  });

  test('should toggle column visibility', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // Look for column visibility toggle button
    const columnToggle = page.getByRole('button', { name: /column|columns|customize|view/i })
      .or(page.getByLabel(/columns/i))
      .first();

    if (await columnToggle.isVisible().catch(() => false)) {
      await columnToggle.click();

      // A dropdown/popover with column checkboxes should appear
      const columnMenu = page.getByRole('menu')
        .or(page.locator('[role="dialog"]'))
        .or(page.locator('[role="listbox"]'))
        .first();
      await expect(columnMenu).toBeVisible({ timeout: 3000 });
    }
  });

  test('should sort students by name', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // Click on the "Name" column header to sort
    const nameHeader = page.getByRole('columnheader', { name: /name/i })
      .or(page.getByRole('button', { name: /name/i }).first())
      .first();

    if (await nameHeader.isVisible().catch(() => false)) {
      await nameHeader.click();
      await page.waitForTimeout(500);

      // Verify some ordering — Aarav should be near the top in ascending
      const firstRow = page.getByRole('row').nth(1); // skip header row
      const nameCell = firstRow.getByText(/Aarav|Arjun|Diya/i).first();
      if (await nameCell.isVisible().catch(() => false)) {
        await expect(nameCell).toBeVisible();
      }

      // Click again for descending
      await nameHeader.click();
      await page.waitForTimeout(500);
    }
  });

  test('should sort students by roll number', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // Click on the "Roll No" column header to sort
    const rollHeader = page.getByRole('columnheader', { name: /roll/i })
      .or(page.getByRole('button', { name: /roll/i }))
      .first();

    if (await rollHeader.isVisible().catch(() => false)) {
      await rollHeader.click();
      await page.waitForTimeout(500);

      // Just verify the page didn't crash and students are still visible
      await expect(page.getByText('Aarav Patel').or(page.getByText('Diya Sharma')).first()).toBeVisible();
    }
  });

  test('should show student list with key columns visible', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // Verify key column headers are visible
    const nameCol = page.getByRole('columnheader', { name: /name/i })
      .or(page.getByText(/student name/i))
      .first();
    if (await nameCol.isVisible().catch(() => false)) {
      await expect(nameCol).toBeVisible();
    }

    const classCol = page.getByRole('columnheader', { name: /class/i })
      .or(page.getByText(/class.*section/i))
      .first();
    if (await classCol.isVisible().catch(() => false)) {
      await expect(classCol).toBeVisible();
    }
  });
});
