import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  CLASS_10A_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ────────────────────────────────────────────────────────────
 *  TC019 — Admin creates a new student via composer overlay
 * ──────────────────────────────────────────────────────────── */

test.describe('TC019 - Create Student', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    await installMockApi(page, state);
  });

  async function openAddStudentComposer(page: import('@playwright/test').Page) {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // Wait for the students list to finish loading (React Query fetch)
    const listCount = page.getByText(/of/i).first();
    await expect(listCount).toBeVisible({ timeout: 10000 });

    // Click "New Student" button (header action; .first() because the empty-state
    // placeholder also renders an identically labelled button when the list is empty)
    const newStudentBtn = page.getByRole('button', { name: /new student/i }).first();
    await expect(newStudentBtn).toBeVisible();
    await newStudentBtn.click();

    // Method selection modal — choose "Manual Registration"
    const manualBtn = page.getByRole('button', { name: /manual registration/i });
    await expect(manualBtn).toBeVisible({ timeout: 5000 });
    await manualBtn.click();

    // Wait for composer to render (lazy loaded, may take a moment)
    await page.waitForTimeout(800);
    const composer = page.locator('[aria-label="Add a student"]').or(page.getByText(/identity/i)).or(page.getByRole('heading', { name: /add a student/i })).first();
    await expect(composer).toBeVisible({ timeout: 10000 });
  }

  test('should open the student registration composer', async ({ page }) => {
    await openAddStudentComposer(page);

    // Verify the composer heading/section nav is visible
    const heading = page.getByRole('heading', { name: /add a student|new student/i })
      .or(page.getByText(/identity/i))
      .or(page.getByLabel(/sections/i));
    await expect(heading.first()).toBeVisible();
  });

  test('should fill identity and contact sections', async ({ page }) => {
    await openAddStudentComposer(page);

    // Fill full name via placeholder
    const nameField = page.getByPlaceholder(/as on records/i);
    await expect(nameField).toBeVisible();
    await nameField.fill('Arjun Kumar');
    await expect(nameField).toHaveValue('Arjun Kumar');

    // Fill date of birth (type="date" input)
    const dobField = page.locator('.composer input[type="date"]').first();
    await dobField.fill('2011-08-14');

    // Select gender — click the gender field to open options
    const genderField = page.locator('.composer').getByText(/gender/i).first();
    if (await genderField.isVisible().catch(() => false)) {
      await genderField.click();
      const maleOption = page.getByRole('option', { name: /male/i }).first();
      if (await maleOption.isVisible().catch(() => false)) {
        await maleOption.click();
      }
    }

    // Fill Aadhaar if visible
    const aadhaarField = page.locator('.composer input[placeholder*="0000"]').first();
    if (await aadhaarField.isVisible().catch(() => false)) {
      await aadhaarField.fill('123456789012');
    }

    // Navigate to Class section and select class
    const classNav = page.locator('.composer nav button').filter({ hasText: /class/i }).first();
    if (await classNav.isVisible().catch(() => false)) {
      await classNav.click();
    }

    // Select class if dropdown/combobox exists
    const classSelect = page.locator('.composer select, .composer [role="combobox"]').filter({ hasText: /class/i }).first();
    if (await classSelect.isVisible().catch(() => false)) {
      await classSelect.click();
      const class10Option = page.getByRole('option', { name: /10/i }).first();
      if (await class10Option.isVisible().catch(() => false)) {
        await class10Option.click();
      }
    }

    // Fill mobile in Contact section
    const contactNav = page.locator('.composer nav button').filter({ hasText: /contact/i }).first();
    if (await contactNav.isVisible().catch(() => false)) {
      await contactNav.click();
    }

    const mobileField = page.locator('.composer input[placeholder*="10-digit"]').first();
    if (await mobileField.isVisible().catch(() => false)) {
      await mobileField.fill('9876543210');
    }

    // Verify the save button is present
    const submitBtn = page.getByRole('button', { name: /save|add student|submit/i }).first();
    await expect(submitBtn).toBeVisible();
  });

  test('should fill personal info with key fields', async ({ page }) => {
    await openAddStudentComposer(page);

    // Fill the full name
    const nameField = page.getByPlaceholder(/as on records/i);
    await expect(nameField).toBeVisible();
    await nameField.fill('Arjun Kumar');
    await expect(nameField).toHaveValue('Arjun Kumar');

    // Fill date of birth
    const dobField = page.locator('.composer input[type="date"]').first();
    await dobField.fill('2011-08-14');
  });

  test('should show validation errors for missing required fields', async ({ page }) => {
    await openAddStudentComposer(page);

    // Try to submit without filling required fields
    const submitBtn = page.getByRole('button', { name: /save|add student|submit/i }).first();
    await submitBtn.click();

    // Expect validation messages to appear
    const errorMsg = page.getByText(/required|cannot be empty|please fill|please enter/i).first();
    await expect(errorMsg).toBeVisible({ timeout: 3000 });
  });
});
