/**
 * Student-specific test utilities.
 *
 * Re-exports everything from the core test-utils so that student-focused
 * spec files can import from a single location.
 */
export {
  /* constants */
  ADMIN_ID, TEACHER_A_ID, TEACHER_B_ID, ACCOUNTANT_ID,
  CLASS_10A_ID, CLASS_11A_ID, SCHOOL_ID,
  /* types */
  type MockState,
  /* factories & helpers */
  createMockState, installMockApi, expectRequestLog,
  seedStudent, seedStudentWithFees, seedAttendanceForClass,
  seedExam, seedResult,
} from './test-utils';

import type { Page, Locator } from '@playwright/test';
import type { MockState, StudentRecord } from './test-utils';
import { seedStudent, installMockApi as _installMockApi, CLASS_10A_ID } from './test-utils';

/* ═══════════════════════════════════════════════════════════════════
 *  UI HELPERS
 * ═══════════════════════════════════════════════════════════════════ */

/** Open the "Add Student" drawer via manual registration. */
export async function openManualStudentRegistration(page: Page): Promise<Locator> {
  await page.goto('/students');
  await page.waitForLoadState('networkidle');

  // Click "Add Student" button
  const addBtn = page.getByRole('button', { name: /add student/i });
  await addBtn.click();

  // If a popover with "Manual Registration" appears, click it
  const manualBtn = page.getByRole('menuitem', { name: /manual registration/i })
    .or(page.getByText(/manual registration/i));
  if (await manualBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await manualBtn.click();
  }

  const drawer = page.locator('body [role="dialog"]').last();
  return drawer;
}

/** Pick an option from a select/dropdown inside a given container. */
export async function chooseOption(container: Locator, selectLabel: RegExp, optionText: string): Promise<void> {
  const trigger = container.getByRole('button', { name: selectLabel })
    .or(container.locator(`[aria-label]`).filter({ hasText: selectLabel }))
    .first();
  await trigger.click();

  const option = container.page().getByRole('option', { name: optionText })
    .or(container.page().getByRole('listbox').getByText(optionText, { exact: false }))
    .first();
  await option.click();
}

/** Click the Continue/Next button inside a form stepper. */
export async function clickContinue(container: Locator): Promise<void> {
  const btn = container.getByRole('button', { name: /continue|next/i }).first();
  await btn.click();
}

/**
 * Create a student through the full UI flow and return useful data.
 * Assumes `installMockApi` has already been called.
 */
export async function createStudentViaUi(
  page: Page,
  state: MockState,
): Promise<{ studentId: string }> {
  const drawer = await openManualStudentRegistration(page);

  // Step 1 — Personal Information
  await drawer.getByLabel('Full Name').fill('Aarav Krishnan');
  await chooseOption(drawer, /Select class/i, '10');
  await chooseOption(drawer, /Select section/i, 'A');
  await drawer.getByPlaceholder('DD/MM/YYYY').fill('14/08/2011');
  await clickContinue(drawer);

  // Step 2 — Parent Details
  await drawer.getByLabel('Full Name').first().fill('Suresh Krishnan');
  await drawer.getByLabel('Phone Number').first().fill('9876543210');
  await clickContinue(drawer);

  // Step 3 — Documents (skip, click submit)
  await drawer.getByRole('button', { name: /add student/i }).click();

  // Wait for the student to be added to mock state
  const student = state.students[state.students.length - 1];
  return { studentId: student?.id || '' };
}

/**
 * Install mock API, scoped to student-specific test patterns.
 * This is an alias for installMockApi from test-utils.
 */
export { _installMockApi as installStudentMockApi };

/**
 * Install unauthenticated (login page) API stubs.
 */
export async function installLoginPageApi(page: Page, state: MockState): Promise<void> {
  await _installMockApi(page, state);

  // Clear the authenticated session that installMockApi sets
  await page.addInitScript(() => {
    sessionStorage.removeItem('app_user');
  });

  // Override session endpoint to return 401 (LIFO ordering)
  await page.route('**/api/auth/session', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Not authenticated' }),
    });
  });
}

/**
 * After login succeeds, install an authenticated session mock.
 */
export async function switchToAuthenticatedApi(page: Page, state: MockState): Promise<void> {
  await page.route('**/api/auth/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(state.user),
    });
  });
}
