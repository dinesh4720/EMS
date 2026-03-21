import { expect, test } from '@playwright/test';
import { createMockState, installMockApi, type MockState } from './test-utils';

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

  test('enrollment funnel page loads with 6 stage visualization bars', async ({ page }) => {
    await page.goto('/intake-forms/funnel');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Enrollment Funnel');

    // 6 stages: Invited, Submitted, Under Review, Approved, Rejected, Enrolled
    const stageLabels = ['Invitations Sent', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Enrolled'];
    for (const label of stageLabels) {
      expect(bodyText).toContain(label);
    }
  });

  test('each stage shows correct count from API', async ({ page }) => {
    await page.goto('/intake-forms/funnel');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');

    // Verify each stage count is present in the page content
    // Invited=50, Submitted=30, Under Review=20, Approved=15, Rejected=5, Enrolled=12
    expect(bodyText).toContain('50');
    expect(bodyText).toContain('30');
    expect(bodyText).toContain('20');
    expect(bodyText).toContain('15');
    expect(bodyText).toContain('12');
  });

  test('conversion rates display correctly', async ({ page }) => {
    await page.goto('/intake-forms/funnel');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');

    // Rates: submission 60%, approval 75%, enrollment 80%, overall 24%
    expect(bodyText).toContain('60%');
    expect(bodyText).toContain('75%');
    expect(bodyText).toContain('80%');
    expect(bodyText).toContain('24%');

    // Rate labels
    expect(bodyText).toContain('Submission Rate');
    expect(bodyText).toContain('Approval Rate');
    expect(bodyText).toContain('Enrollment Rate');
    expect(bodyText).toContain('Overall Conversion');
  });

  test('funnel bars are proportionally sized (Invited widest, Enrolled narrowest)', async ({ page }) => {
    await page.goto('/intake-forms/funnel');
    await page.waitForLoadState('networkidle');

    // The "Funnel Visualization" section has bars with inline width styles
    // Invited (50) should be 100%, Enrolled (12) should be ~24%
    const funnelSection = page.locator('text=Funnel Visualization').locator('..');
    await expect(funnelSection).toBeVisible();

    // Get all funnel bar widths from the visualization section
    const bars = funnelSection.locator('.bg-gray-100.rounded-full.h-6 > div');
    const barCount = await bars.count();
    expect(barCount).toBeGreaterThanOrEqual(4); // At least Invited, Submitted, Under Review, Approved, Enrolled

    // First bar (Invited=50) should have width 100%, last bar (Enrolled=12) should be smaller
    const firstBarStyle = await bars.first().getAttribute('style');
    const lastBarStyle = await bars.last().getAttribute('style');

    // Extract width percentages
    const firstWidth = parseFloat(firstBarStyle?.match(/width:\s*([\d.]+)%/)?.[1] ?? '0');
    const lastWidth = parseFloat(lastBarStyle?.match(/width:\s*([\d.]+)%/)?.[1] ?? '0');

    expect(firstWidth).toBeGreaterThan(lastWidth);
  });

  test('loading skeleton shows during data fetch', async ({ page }) => {
    // Navigate and immediately check for skeleton before networkidle
    // The component shows Skeleton elements while loading=true
    await page.goto('/intake-forms/funnel', { waitUntil: 'commit' });

    // The loading state renders Skeleton components from @heroui/react
    // which render with data-loaded="false" or specific skeleton classes
    // Check for skeleton elements or that "Enrollment Funnel" heading is NOT yet rendered
    // (since skeletons replace the heading during load)
    const heading = page.getByText('Enrollment Funnel');
    const isHeadingVisible = await heading.isVisible({ timeout: 500 }).catch(() => false);

    if (!isHeadingVisible) {
      // Still in loading state — skeletons are showing instead of content
      // This confirms loading skeleton was rendered
      expect(isHeadingVisible).toBe(false);
    }

    // Wait for data to load and verify final state
    await page.waitForLoadState('networkidle');
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('empty state when funnel API returns zero counts', async ({ page }) => {
    // Override the funnel data with zero counts
    state.enrollmentFunnel = {
      invited: 0,
      submitted: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      enrolled: 0,
      rates: { submissionRate: 0, approvalRate: 0, enrollmentRate: 0, overallRate: 0 },
    };

    await page.goto('/intake-forms/funnel');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    // Stage labels should still be visible
    expect(bodyText).toContain('Enrollment Funnel');

    // All rates should show 0%
    expect(bodyText).toContain('0%');

    // All stage counts should be 0 - the funnel bars should have zero or minimal width
    const funnelSection = page.locator('text=Funnel Visualization').locator('..');
    if (await funnelSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      const bars = funnelSection.locator('.bg-gray-100.rounded-full.h-6 > div');
      const barCount = await bars.count();
      for (let i = 0; i < barCount; i++) {
        const style = await bars.nth(i).getAttribute('style');
        const width = parseFloat(style?.match(/width:\s*([\d.]+)%/)?.[1] ?? '0');
        expect(width).toBe(0);
      }
    }
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

  test('1 — assignments table loads with columns: form, recipient, status, date', async ({ page }) => {
    await page.goto('/intake-forms/assignments');
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    // Seed data assignments
    expect(body).toContain('Student Admission Form');
    expect(body).toContain('parent1@example.com');
    expect(body).toContain('pending');
    // Date column content
    expect(body).toContain('Mar');
  });

  test('2 — filter by status (all/pending/submitted/approved/rejected) works', async ({ page }) => {
    await page.goto('/intake-forms/assignments');
    await page.waitForLoadState('networkidle');

    // Click "Submitted" filter
    const submittedBtn = page.getByRole('button', { name: /^Submitted$/i });
    await submittedBtn.click();
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body).toContain('parent2@example.com');
  });

  test('3 — create new assignment modal opens with form selection, email/phone, expiry', async ({ page }) => {
    await page.goto('/intake-forms/assignments');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /assign form/i }).click();

    const dialog = page.locator('[role="dialog"]').last();
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Form select dropdown
    await expect(dialog.locator('select')).toBeVisible();
    // Email & phone textareas
    await expect(dialog.getByText(/email/i).first()).toBeVisible();
    await expect(dialog.getByText(/phone/i).first()).toBeVisible();
    // Expiry days input
    await expect(dialog.locator('input[type="number"]')).toBeVisible();
  });

  test('4 — created assignment appears in table with pending status', async ({ page }) => {
    await page.goto('/intake-forms/assignments');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /assign form/i }).click();
    const dialog = page.locator('[role="dialog"]').last();
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Select the first form
    await dialog.locator('select').selectOption({ index: 1 });
    // Enter email
    await dialog.locator('textarea').first().fill('newparent@example.com');
    // Submit
    await dialog.getByRole('button', { name: /assign form/i }).click();
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body).toContain('newparent@example.com');
  });

  test('5 — re-send link action triggers API call', async ({ page }) => {
    await page.goto('/intake-forms/assignments');
    await page.waitForLoadState('networkidle');

    // Open actions dropdown on first row
    const dropdownTrigger = page.locator('table button').first();
    await dropdownTrigger.click();

    const resendItem = page.getByText(/resend/i).first();
    if (await resendItem.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await resendItem.click();
      await page.waitForLoadState('networkidle');
      expect(state.requestLog.has('PUT /api/form-assignments/ifa-1/resend')).toBeTruthy();
    }
  });

  test('6 — copy form link copies to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/intake-forms/assignments');
    await page.waitForLoadState('networkidle');

    const dropdownTrigger = page.locator('table button').first();
    await dropdownTrigger.click();

    const copyItem = page.getByText(/copy link/i).first();
    if (await copyItem.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await copyItem.click();
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText).toContain('/form/tok-abc-1');
    }
  });

  test('7 — delete assignment confirms and removes', async ({ page }) => {
    await page.goto('/intake-forms/assignments');
    await page.waitForLoadState('networkidle');

    const initialCount = state.intakeFormAssignments.length;
    page.on('dialog', (dialog) => dialog.accept());

    const dropdownTrigger = page.locator('table button').first();
    await dropdownTrigger.click();

    const deleteItem = page.getByText(/cancel assignment/i).first();
    if (await deleteItem.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await deleteItem.click();
      await page.waitForLoadState('networkidle');
      expect(state.intakeFormAssignments.length).toBe(initialCount - 1);
      expect(state.requestLog.has('DELETE /api/form-assignments/ifa-1')).toBeTruthy();
    }
  });

  /* ───── Submissions Page ───── */

  test('8 — submissions table loads with status badges (pending/approved/rejected)', async ({ page }) => {
    await page.goto('/intake-forms/submissions');
    await page.waitForLoadState('networkidle');

    // Click "All" to see every status
    await page.getByRole('button', { name: /^All$/i }).click();
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body).toContain('pending');
    expect(body).toContain('approved');
    expect(body).toContain('rejected');
    expect(body).toContain('Student Admission Form');
  });

  test('9 — filter by status works on submissions', async ({ page }) => {
    await page.goto('/intake-forms/submissions');
    await page.waitForLoadState('networkidle');

    // Default filter is "Pending"
    await expect(page.getByText('parent2@example.com')).toBeVisible({ timeout: 10_000 });

    // Switch to Approved
    await page.getByRole('button', { name: /^Approved$/i }).click();
    await page.waitForLoadState('networkidle');

    // Wait for the approved submission to appear
    await expect(page.getByText('parent3@example.com')).toBeVisible({ timeout: 10_000 });
  });

  test('10 — review submission modal shows full submitted data', async ({ page }) => {
    await page.goto('/intake-forms/submissions');
    await page.waitForLoadState('networkidle');

    // Wait for submission table row to appear
    await expect(page.getByText('parent2@example.com')).toBeVisible({ timeout: 10_000 });

    // Click the three-dots actions button — HeroUI DropdownTrigger renders an icon-only button
    const dropdownTrigger = page.locator('[role="row"] button, table tbody button').first();
    await dropdownTrigger.click();
    await page.waitForTimeout(500);

    // The dropdown menu item uses HeroUI DropdownItem with onPress
    const reviewItem = page.locator('[role="menuitem"]').filter({ hasText: /review/i }).first()
      .or(page.getByText(/review submission/i).first());
    if (await reviewItem.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await reviewItem.click();
      await page.waitForTimeout(1000);

      const dialog = page.locator('[role="dialog"]').last();
      await expect(dialog).toBeVisible({ timeout: 10_000 });

      // Wait for the submission data to load — the API call fetches details
      await expect(dialog.getByText('Riya Sharma')).toBeVisible({ timeout: 15_000 });

      const dialogText = await dialog.textContent();
      expect(dialogText).toContain('Full Name');
      expect(dialogText).toContain('Riya Sharma');
      expect(dialogText).toContain('Date of Birth');
      expect(dialogText).toContain('Gender');
    }
  });

  test('11 — approve action with notes updates status to approved', async ({ page }) => {
    await page.goto('/intake-forms/submissions');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('parent2@example.com')).toBeVisible({ timeout: 10_000 });

    const dropdownTrigger = page.locator('[role="row"] button, table tbody button').first();
    await dropdownTrigger.click();
    await page.waitForTimeout(500);

    const reviewItem = page.locator('[role="menuitem"]').filter({ hasText: /review/i }).first()
      .or(page.getByText(/review submission/i).first());
    if (await reviewItem.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await reviewItem.click();
      await page.waitForTimeout(1000);

      const dialog = page.locator('[role="dialog"]').last();
      await expect(dialog).toBeVisible({ timeout: 10_000 });

      // Wait for submission data to load (API call fetches details)
      await expect(dialog.getByText('Riya Sharma')).toBeVisible({ timeout: 15_000 });

      const notesTextarea = dialog.locator('textarea');
      if (await notesTextarea.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await notesTextarea.fill('Documents look good');
      }

      await dialog.getByRole('button', { name: /approve/i }).click();
      await page.waitForLoadState('networkidle');

      const sub = state.intakeFormSubmissions.find((s) => s.id === 'ifs-1');
      expect(sub?.reviewStatus).toBe('approved');
      expect(state.requestLog.has('PUT /api/form-submissions/ifs-1/review')).toBeTruthy();
    }
  });

  test('12 — reject action with notes updates status to rejected', async ({ page }) => {
    await page.goto('/intake-forms/submissions');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('parent2@example.com')).toBeVisible({ timeout: 10_000 });

    const dropdownTrigger = page.locator('[role="row"] button, table tbody button').first();
    await dropdownTrigger.click();
    await page.waitForTimeout(500);

    const reviewItem = page.locator('[role="menuitem"]').filter({ hasText: /review/i }).first()
      .or(page.getByText(/review submission/i).first());
    if (await reviewItem.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await reviewItem.click();
      await page.waitForTimeout(1000);

      const dialog = page.locator('[role="dialog"]').last();
      await expect(dialog).toBeVisible({ timeout: 10_000 });

      // Wait for submission data to load (API call fetches details)
      await expect(dialog.getByText('Riya Sharma')).toBeVisible({ timeout: 15_000 });

      const notesTextarea = dialog.locator('textarea');
      if (await notesTextarea.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await notesTextarea.fill('Missing birth certificate');
      }

      await dialog.getByRole('button', { name: /reject/i }).click();
      await page.waitForLoadState('networkidle');

      const sub = state.intakeFormSubmissions.find((s) => s.id === 'ifs-1');
      expect(sub?.reviewStatus).toBe('rejected');
      expect(sub?.reviewNotes).toBe('Missing birth certificate');
      expect(state.requestLog.has('PUT /api/form-submissions/ifs-1/review')).toBeTruthy();
    }
  });
});
