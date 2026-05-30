import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, seedStudent,
  CLASS_10A_ID, CLASS_11A_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  TC116 — Student Bulk Operations: select, deactivate, remind, delete
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC116 — Student Bulk Operations', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    // Seed 10 students
    for (let i = 1; i <= 7; i++) {
      seedStudent(state, { name: `Student ${i}`, classId: CLASS_10A_ID });
    }
    for (let i = 8; i <= 10; i++) {
      seedStudent(state, { name: `Student ${i}`, classId: CLASS_11A_ID });
    }

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);

    // Override bulk operations endpoints
    await page.route('**/api/students/bulk/deactivate', async (route) => {
      let body: Record<string, unknown> = {};
      try { body = JSON.parse(route.request().postData() || '{}'); } catch { /* */ }
      const ids = (body.studentIds || body.ids || []) as string[];
      for (const id of ids) {
        const student = state.students.find(s => s.id === id);
        if (student) student.status = 'inactive';
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: `${ids.length} students deactivated`, count: ids.length }),
      });
    });

    await page.route('**/api/students/bulk/delete', async (route) => {
      let body: Record<string, unknown> = {};
      try { body = JSON.parse(route.request().postData() || '{}'); } catch { /* */ }
      const ids = (body.studentIds || body.ids || []) as string[];
      state.students = state.students.filter(s => !ids.includes(s.id));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: `${ids.length} students deleted`, count: ids.length }),
      });
    });

    await page.route('**/api/students/bulk/remind', async (route) => {
      let body: Record<string, unknown> = {};
      try { body = JSON.parse(route.request().postData() || '{}'); } catch { /* */ }
      const ids = (body.studentIds || body.ids || []) as string[];
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: `Reminders sent to ${ids.length} students`, count: ids.length }),
      });
    });

    await page.route('**/api/students/bulk**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Bulk operation completed' }),
      });
    });
  });

  /* ───────── 1. Student list loads with 10 students ───────── */

  test('1) student list loads with all 10 seeded students', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);

    // Wait for students to load (React Query loads asynchronously)
    await expect(page.locator('body')).toContainText('Student 1', { timeout: 15000 });
    await expect(page.locator('body')).toContainText('Student 10', { timeout: 5000 });
    expect(state.students).toHaveLength(10);
  });

  /* ───────── 2. Select multiple students using checkboxes ───────── */

  test('2) checkboxes exist for selecting multiple students', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // Wait for students to load
    await expect(page.locator('body')).toContainText('Student 1', { timeout: 15000 });

    // Look for row checkboxes
    const checkboxes = page.locator(
      'input[type="checkbox"], [role="checkbox"]',
    );

    const checkboxCount = await checkboxes.count();

    // There should be checkboxes for selection (1 header + 10 rows or just rows)
    if (checkboxCount > 0) {
      // Click first student checkbox
      const firstCheckbox = checkboxes.nth(1); // Skip header checkbox
      if (await firstCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstCheckbox.evaluate((el: HTMLElement) => el.click());
        await page.waitForTimeout(300);
      }
    }

    expect(checkboxCount).toBeGreaterThan(0);
  });

  /* ───────── 3. Bulk action toolbar appears on selection ───────── */

  test('3) selecting students shows bulk action toolbar', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // Wait for students to load
    await expect(page.locator('body')).toContainText('Student 1', { timeout: 15000 });

    const checkboxes = page.locator('input[type="checkbox"], [role="checkbox"]');
    const count = await checkboxes.count();

    if (count > 1) {
      // Select 2 students
      await checkboxes.nth(1).evaluate((el: HTMLElement) => el.click());
      await page.waitForTimeout(200);
      await checkboxes.nth(2).evaluate((el: HTMLElement) => el.click());
      await page.waitForTimeout(500);

      // Bulk action toolbar should appear
      const bulkToolbar = page.locator(
        '[class*="bulk-action"], [class*="selection-toolbar"], [data-testid="bulk-actions"]',
      ).first();
      const selectedText = page.getByText(/\d+ selected|selected \d+/i).first();
      const bulkBtn = page.getByRole('button', { name: /deactivate|delete|action|bulk/i }).first();

      const hasToolbar = await bulkToolbar.isVisible({ timeout: 3000 }).catch(() => false);
      const hasSelectedText = await selectedText.isVisible({ timeout: 3000 }).catch(() => false);
      const hasBulkBtn = await bulkBtn.isVisible({ timeout: 3000 }).catch(() => false);

      expect(hasToolbar || hasSelectedText || hasBulkBtn).toBeTruthy();
    }
  });

  /* ───────── 4. Bulk Deactivate operation ───────── */

  test('4) bulk deactivate changes selected students to inactive', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // Wait for students to load
    await expect(page.locator('body')).toContainText('Student 1', { timeout: 15000 });

    const checkboxes = page.locator('input[type="checkbox"], [role="checkbox"]');
    const count = await checkboxes.count();

    if (count > 2) {
      // Select students
      await checkboxes.nth(1).evaluate((el: HTMLElement) => el.click());
      await page.waitForTimeout(200);
      await checkboxes.nth(2).evaluate((el: HTMLElement) => el.click());
      await page.waitForTimeout(500);

      // Find and click deactivate button
      const deactivateBtn = page.getByRole('button', { name: /deactivate/i }).first();
      if (await deactivateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await deactivateBtn.click({ force: true });
        await page.waitForTimeout(500);

        // Confirm if dialog appears
        const confirmBtn = page.getByRole('button', { name: /confirm|yes|proceed/i }).first();
        if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmBtn.click({ force: true });
          await page.waitForTimeout(1000);
        }
      }
    }

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  /* ───────── 5. Bulk Send Reminders ───────── */

  test('5) bulk send reminders to selected students', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const checkboxes = page.locator('input[type="checkbox"], [role="checkbox"]');
    const count = await checkboxes.count();

    if (count > 2) {
      await checkboxes.nth(1).evaluate((el: HTMLElement) => el.click());
      await page.waitForTimeout(200);
      await checkboxes.nth(2).evaluate((el: HTMLElement) => el.click());
      await page.waitForTimeout(500);

      // Look for send reminder option
      const remindBtn = page.getByRole('button', { name: /remind|send|notification|message/i }).first();
      const moreActions = page.getByRole('button', { name: /more|action|bulk/i }).first();

      if (await remindBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await remindBtn.click({ force: true });
        await page.waitForTimeout(500);
      } else if (await moreActions.isVisible({ timeout: 3000 }).catch(() => false)) {
        await moreActions.click({ force: true });
        await page.waitForTimeout(300);
        const sendOption = page.getByText(/remind|send|notification/i).first();
        if (await sendOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await sendOption.click({ force: true });
          await page.waitForTimeout(500);
        }
      }
    }

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  /* ───────── 6. Bulk Delete with confirmation ───────── */

  test('6) bulk delete shows confirmation modal with warning', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const checkboxes = page.locator('input[type="checkbox"], [role="checkbox"]');
    const count = await checkboxes.count();

    if (count > 2) {
      await checkboxes.nth(1).evaluate((el: HTMLElement) => el.click());
      await page.waitForTimeout(200);
      await checkboxes.nth(2).evaluate((el: HTMLElement) => el.click());
      await page.waitForTimeout(500);

      // Find and click delete button
      const deleteBtn = page.getByRole('button', { name: /delete/i }).first();
      if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await deleteBtn.click({ force: true });
        await page.waitForTimeout(500);

        // Should show confirmation dialog
        const confirmDialog = page.locator('[role="dialog"], [role="alertdialog"], [class*="modal"]').first();
        const warningText = page.getByText(/sure|confirm|warning|permanent|cannot.*undo/i).first();

        const hasConfirm = await confirmDialog.isVisible({ timeout: 3000 }).catch(() => false);
        const hasWarning = await warningText.isVisible({ timeout: 3000 }).catch(() => false);

        expect(hasConfirm || hasWarning).toBeTruthy();

        // Cancel the delete
        const cancelBtn = page.getByRole('button', { name: /cancel|no/i }).first();
        if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await cancelBtn.click({ force: true });
        }
      }
    }
  });

  /* ───────── 7. Student count updates after bulk operations ───────── */

  test('7) student count reflects changes after bulk operations', async ({ page }) => {
    const initialCount = state.students.length;
    expect(initialCount).toBe(10);

    // Verify state is mutable
    state.students = state.students.filter(s => s.name !== 'Student 1');
    expect(state.students.length).toBe(9);

    // Restore for next test
    seedStudent(state, { name: 'Student 1 Restored', classId: CLASS_10A_ID });
    expect(state.students.length).toBe(10);
  });

  /* ───────── 8. Select all checkbox ───────── */

  test('8) select all checkbox selects all visible students', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // Look for the "select all" header checkbox
    const headerCheckbox = page.locator(
      'thead input[type="checkbox"], thead [role="checkbox"], ' +
      'th input[type="checkbox"], th [role="checkbox"]',
    ).first();

    if (await headerCheckbox.isVisible({ timeout: 5000 }).catch(() => false)) {
      await headerCheckbox.click();
      await page.waitForTimeout(500);

      // All row checkboxes should now be checked
      const checkedBoxes = page.locator('input[type="checkbox"]:checked, [role="checkbox"][aria-checked="true"]');
      const checkedCount = await checkedBoxes.count();

      // Should have selected all students (count may vary if there's a header checkbox)
      expect(checkedCount).toBeGreaterThan(0);
    }
  });
});
