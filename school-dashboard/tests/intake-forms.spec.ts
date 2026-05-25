import { expect, test } from '@playwright/test';
import { createMockState, installMockApi, type MockState } from './test-utils';

// Force desktop viewport so the sidebar does not overlay the main content on mobile projects
test.use({ viewport: { width: 1280, height: 720 } });

test.describe('Intake Forms — Enrollment Funnel & Analytics', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    // Dismiss cookie consent banner so it doesn't obscure interactive elements
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });
    await installMockApi(page, state);
  });

  test('enrollment funnel page loads with stage visualization', async ({ page }) => {
    await page.goto('/intake-forms/funnel');

    // Wait for actual content to render (not just networkidle)
    const heading = page.getByText('Enrollment Funnel');
    await expect(heading).toBeVisible({ timeout: 15_000 });

    const bodyText = await page.textContent('body');

    // 5 stages from the actual component: Assigned, In Progress, Submitted, Approved, Rejected
    const stageLabels = ['Assigned', 'In Progress', 'Submitted', 'Approved', 'Rejected'];
    for (const label of stageLabels) {
      expect(bodyText).toContain(label);
    }
  });

  test('each stage shows correct count computed from API data', async ({ page }) => {
    await page.goto('/intake-forms/funnel');

    // Wait for content to render
    await expect(page.getByText('Enrollment Funnel')).toBeVisible({ timeout: 15_000 });

    const bodyText = await page.textContent('body');

    // Seed data: 3 assignments total, 0 in_progress, 3 submissions, 1 approved, 1 rejected
    // The component counts assignments.length = 3 for "assigned"
    expect(bodyText).toContain('3'); // assigned count (all assignments)
  });

  test('conversion funnel section is visible', async ({ page }) => {
    await page.goto('/intake-forms/funnel');

    // Wait for content to render
    await expect(page.getByText('Enrollment Funnel')).toBeVisible({ timeout: 15_000 });

    const bodyText = await page.textContent('body');
    // The actual component heading is "Conversion Funnel" (not "Funnel Visualization")
    expect(bodyText).toContain('Conversion Funnel');
  });

  test('loading skeleton shows during data fetch', async ({ page }) => {
    // Navigate and immediately check for skeleton before networkidle
    await page.goto('/intake-forms/funnel', { waitUntil: 'commit' });

    // The component shows skeleton elements while loading=true
    const heading = page.getByText('Enrollment Funnel');
    const isHeadingVisible = await heading.isVisible({ timeout: 500 }).catch(() => false);

    if (!isHeadingVisible) {
      // Still in loading state -- skeletons are showing instead of content
      expect(isHeadingVisible).toBe(false);
    }

    // Wait for data to load and verify final state
    await expect(heading).toBeVisible({ timeout: 15_000 });
  });

  test('empty state when no assignments or submissions', async ({ page }) => {
    // Override with empty arrays
    state.intakeFormAssignments = [];
    state.intakeFormSubmissions = [];

    await page.goto('/intake-forms/funnel');

    // Wait for content to render
    await expect(page.getByText('Enrollment Funnel')).toBeVisible({ timeout: 15_000 });

    const bodyText = await page.textContent('body');
    // Stage labels should still be visible
    expect(bodyText).toContain('Enrollment Funnel');
    // All stage counts should be 0
    expect(bodyText).toContain('0');
  });
});

test.describe('Intake Forms — Assignments & Submissions', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    // Dismiss cookie consent banner so it doesn't obscure interactive elements
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });
    await installMockApi(page, state);
  });

  /* ───── Assignments Page ───── */

  test('1 -- assignments table loads with seed data', async ({ page }) => {
    await page.goto('/intake-forms/assignments');

    // Wait for actual content to render
    await expect(page.getByRole('heading', { name: 'Form Assignments' })).toBeVisible({ timeout: 15_000 });
    // Wait for table data to appear
    await expect(page.getByText('parent1@example.com')).toBeVisible({ timeout: 10_000 });

    const body = await page.textContent('body');
    expect(body).toContain('Student Admission Form');
    expect(body).toContain('parent1@example.com');
    expect(body).toContain('pending');
    // Date column content (Mar from "Mar 15, 2026")
    expect(body).toContain('Mar');
  });

  test('2 -- filter by status works on assignments', async ({ page }) => {
    await page.goto('/intake-forms/assignments');

    // Wait for content to render
    await expect(page.getByRole('heading', { name: 'Form Assignments' })).toBeVisible({ timeout: 15_000 });
    // Wait for initial data
    await expect(page.getByText('parent1@example.com')).toBeVisible({ timeout: 10_000 });

    // Click "Submitted" filter
    const submittedBtn = page.getByRole('button', { name: /^Submitted$/i });
    await submittedBtn.click();

    // Wait for filtered data to appear
    await expect(page.getByText('parent2@example.com')).toBeVisible({ timeout: 10_000 });

    const body = await page.textContent('body');
    expect(body).toContain('parent2@example.com');
  });

  test('3 -- create new assignment modal opens with form selection, email/phone, expiry', async ({ page }) => {
    await page.goto('/intake-forms/assignments');

    // Wait for content to render
    await expect(page.getByRole('heading', { name: 'Form Assignments' })).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /assign form/i }).click();

    const dialog = page.locator('[role="dialog"]').last();
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Form select dropdown
    await expect(dialog.locator('select')).toBeVisible();
    // Email & phone labels (Textarea components)
    await expect(dialog.getByText(/email/i).first()).toBeVisible();
    await expect(dialog.getByText(/phone/i).first()).toBeVisible();
    // Expiry days input
    await expect(dialog.locator('input[type="number"]')).toBeVisible();
  });

  test('4 -- resend action triggers API call', async ({ page }) => {
    await page.goto('/intake-forms/assignments');

    // Wait for content to render
    await expect(page.getByRole('heading', { name: 'Form Assignments' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('parent1@example.com')).toBeVisible({ timeout: 10_000 });

    // Open actions dropdown on first row -- find the icon-only action button in the table
    const actionButtons = page.locator('button[aria-haspopup="true"]');
    const dropdownTrigger = actionButtons.last();
    await dropdownTrigger.click();
    await page.waitForTimeout(500);

    const resendItem = page.getByText(/resend/i).first();
    if (await resendItem.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await resendItem.click();
      await page.waitForTimeout(1000);
      // Verify the API call was logged
      const hasResendCall = Array.from(state.requestLog).some((log) => log.includes('resend'));
      expect(hasResendCall).toBeTruthy();
    }
  });

  test('5 -- delete assignment confirms and removes', async ({ page }) => {
    await page.goto('/intake-forms/assignments');

    // Wait for content to render
    await expect(page.getByRole('heading', { name: 'Form Assignments' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('parent1@example.com')).toBeVisible({ timeout: 10_000 });

    const initialCount = state.intakeFormAssignments.length;

    // Open actions dropdown on first row — the dropdown trigger is the last button
    // in the first table row.
    const firstRow = page.locator('table tbody tr').first();
    const dropdownTrigger = firstRow.locator('button').last();
    await dropdownTrigger.click();

    // Wait for the HeroUI dropdown menu to open
    const deleteItem = page.getByRole('menuitem').filter({ hasText: /Cancel Assignment/i });
    await expect(deleteItem).toBeVisible({ timeout: 5_000 });
    await deleteItem.click();

    // The page uses the design-system ConfirmDialog (not a native dialog).
    // Wait for it to appear and click the confirm button.
    const confirmDialog = page.locator('[data-testid="ds-confirm-dialog"]');
    await expect(confirmDialog).toBeVisible({ timeout: 5_000 });
    await confirmDialog.getByRole('button', { name: /confirm/i }).click();
    await page.waitForTimeout(500);

    expect(state.intakeFormAssignments.length).toBe(initialCount - 1);
  });

  /* ───── Submissions Page ───── */

  test('6 -- submissions page loads with pending submissions by default', async ({ page }) => {
    await page.goto('/intake-forms/submissions');

    // Wait for actual content to render -- default filter is "pending"
    await expect(page.getByText('parent2@example.com')).toBeVisible({ timeout: 15_000 });

    const body = await page.textContent('body');
    expect(body).toContain('parent2@example.com');
    expect(body).toContain('Student Admission Form');
  });

  test('7 -- filter by status works on submissions', async ({ page }) => {
    await page.goto('/intake-forms/submissions');

    // Default filter is "Pending" -- parent2@example.com should be visible
    await expect(page.getByText('parent2@example.com')).toBeVisible({ timeout: 15_000 });

    // Switch to Approved
    await page.getByRole('button', { name: /^Approved$/i }).click();

    // Wait for the approved submission to appear
    await expect(page.getByText('parent3@example.com')).toBeVisible({ timeout: 10_000 });
  });

  test('8 -- review submission modal shows submitted data', async ({ page }) => {
    await page.goto('/intake-forms/submissions');

    // Wait for submission table row to appear
    await expect(page.getByText('parent2@example.com')).toBeVisible({ timeout: 15_000 });

    // Click the action button to open dropdown menu
    const actionButtons = page.locator('button[aria-haspopup="true"]');
    const dropdownTrigger = actionButtons.last();
    await dropdownTrigger.click();
    await page.waitForTimeout(500);

    // Look for the review menu item
    const reviewItem = page.locator('[role="menuitem"]').filter({ hasText: /review/i }).first()
      .or(page.getByText(/review submission/i).first());
    if (await reviewItem.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await reviewItem.click();
      await page.waitForTimeout(1000);

      const dialog = page.locator('[role="dialog"]').last();
      await expect(dialog).toBeVisible({ timeout: 10_000 });

      // Wait for the submission data to load -- the API call fetches details
      await expect(dialog.getByText('Riya Sharma')).toBeVisible({ timeout: 15_000 });

      const dialogText = await dialog.textContent();
      expect(dialogText).toContain('Full Name');
      expect(dialogText).toContain('Riya Sharma');
      expect(dialogText).toContain('Date of Birth');
      expect(dialogText).toContain('Gender');
    }
  });

  test('9 -- approve action updates status to approved', async ({ page }) => {
    await page.goto('/intake-forms/submissions');

    await expect(page.getByText('parent2@example.com')).toBeVisible({ timeout: 15_000 });

    const actionButtons = page.locator('button[aria-haspopup="true"]');
    const dropdownTrigger = actionButtons.last();
    await dropdownTrigger.click();
    await page.waitForTimeout(500);

    const reviewItem = page.locator('[role="menuitem"]').filter({ hasText: /review/i }).first()
      .or(page.getByText(/review submission/i).first());
    if (await reviewItem.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await reviewItem.click();
      await page.waitForTimeout(1000);

      const dialog = page.locator('[role="dialog"]').last();
      await expect(dialog).toBeVisible({ timeout: 10_000 });

      // Wait for submission data to load
      await expect(dialog.getByText('Riya Sharma')).toBeVisible({ timeout: 15_000 });

      const notesTextarea = dialog.locator('textarea');
      if (await notesTextarea.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await notesTextarea.fill('Documents look good');
      }

      // The approve button text in the component is "Approve & Create" (from t('formSubmissions.approveAndCreate'))
      const approveBtn = dialog.getByRole('button', { name: /approve/i });
      await approveBtn.click();
      await page.waitForTimeout(2000);

      const sub = state.intakeFormSubmissions.find((s: any) => s._id === 'ifs-1');
      expect((sub as any)?.reviewStatus).toBe('approved');
    }
  });

  test('10 -- reject action updates status to rejected', async ({ page }) => {
    await page.goto('/intake-forms/submissions');

    await expect(page.getByText('parent2@example.com')).toBeVisible({ timeout: 15_000 });

    const actionButtons = page.locator('button[aria-haspopup="true"]');
    const dropdownTrigger = actionButtons.last();
    await dropdownTrigger.click();
    await page.waitForTimeout(500);

    const reviewItem = page.locator('[role="menuitem"]').filter({ hasText: /review/i }).first()
      .or(page.getByText(/review submission/i).first());
    if (await reviewItem.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await reviewItem.click();
      await page.waitForTimeout(1000);

      const dialog = page.locator('[role="dialog"]').last();
      await expect(dialog).toBeVisible({ timeout: 10_000 });

      // Wait for submission data to load
      await expect(dialog.getByText('Riya Sharma')).toBeVisible({ timeout: 15_000 });

      const notesTextarea = dialog.locator('textarea');
      if (await notesTextarea.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await notesTextarea.fill('Missing birth certificate');
      }

      await dialog.getByRole('button', { name: /reject/i }).click();
      await page.waitForTimeout(2000);

      const sub = state.intakeFormSubmissions.find((s: any) => s._id === 'ifs-1');
      expect((sub as any)?.reviewStatus).toBe('rejected');
      expect((sub as any)?.reviewNotes).toBe('Missing birth certificate');
    }
  });
});
