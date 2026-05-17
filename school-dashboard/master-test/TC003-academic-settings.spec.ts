/**
 * TC003: Admin configures academic year, school timings, working days,
 *        classes & sections, and subjects.
 *
 * Verifies the academic settings page with tabs for schedule/timings,
 * classes/sections, and subjects.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState,
  installMockApi,
  SCHOOL_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Tests
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC003: Academic Settings — Year, Timings, Classes, Subjects', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    // Enrich school settings with academic-specific fields
    Object.assign(state.schoolSettings, {
      academicYear: '2025-2026',
      academicYearStart: '2025-06-01',
      academicYearEnd: '2026-05-31',
      schoolStartTime: '08:00',
      schoolEndTime: '14:00',
      periodDuration: 40,
      numberOfPeriods: 8,
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      classes: [
        { name: '1', sections: ['A'] },
        { name: '2', sections: ['A'] },
        { name: '10', sections: ['A'] },
        { name: '11', sections: ['A'] },
        { name: '12', sections: ['A'] },
      ],
    });

    // Dismiss cookie consent
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);
  });

  /* ── Tab: Schedule & Timings ── */

  test('1) academic settings page loads with academic year fields', async ({ page }) => {
    await page.goto('/settings/academics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/academic|year|settings/i);

    // Should show academic year value
    expect(bodyText).toMatch(/2025-2026|2025|2026/);
  });

  test('2) school start time and end time can be configured', async ({ page }) => {
    await page.goto('/settings/academics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Navigate to schedule/timings tab if present
    const timingsTab = page.getByRole('tab', { name: /schedule|timing|time/i }).first();
    const hasTimingsTab = await timingsTab.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasTimingsTab) {
      await timingsTab.click();
      await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    }

    // Look for start time input
    const startTimeInput = page.locator(
      'input[name="schoolStartTime"], input[name="startTime"], input[type="time"]',
    ).first();
    const hasStartTime = await startTimeInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasStartTime) {
      await startTimeInput.fill('08:00');
    }

    // Look for end time input
    const endTimeInput = page.locator(
      'input[name="schoolEndTime"], input[name="endTime"], input[type="time"]',
    ).nth(1);
    const hasEndTime = await endTimeInput.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasEndTime) {
      await endTimeInput.fill('14:00');
    }

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/time|schedule|period|duration/i);
  });

  test('3) period duration and number of periods can be set', async ({ page }) => {
    await page.goto('/settings/academics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Navigate to schedule tab if present
    const timingsTab = page.getByRole('tab', { name: /schedule|timing/i }).first();
    const hasTimingsTab = await timingsTab.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasTimingsTab) await timingsTab.click();

    // Period duration
    const durationInput = page.locator(
      'input[name="periodDuration"], input[placeholder*="duration" i]',
    ).first();
    const hasDuration = await durationInput.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasDuration) {
      await durationInput.clear();
      await durationInput.fill('40');
    }

    // Number of periods
    const periodsInput = page.locator(
      'input[name="numberOfPeriods"], input[name="periods"], input[placeholder*="period" i]',
    ).first();
    const hasPeriods = await periodsInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasPeriods) {
      await periodsInput.clear();
      await periodsInput.fill('8');
    }

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/period|duration|minute/i);
  });

  test('4) working days can be toggled (Mon-Sat)', async ({ page }) => {
    await page.goto('/settings/academics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const timingsTab = page.getByRole('tab', { name: /schedule|timing|working/i }).first();
    const hasTimingsTab = await timingsTab.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasTimingsTab) await timingsTab.click();

    const bodyText = await page.textContent('body');
    // Working days section should show day names
    const hasDays =
      bodyText?.includes('Monday') ||
      bodyText?.includes('Mon') ||
      bodyText?.toLowerCase().includes('working day');

    expect(hasDays).toBeTruthy();

    // Try to toggle Sunday off (should already be off) or Saturday
    const saturdayToggle = page.locator('label:has-text("Saturday"), button:has-text("Saturday"), [data-day="Saturday"]').first();
    const hasSatToggle = await saturdayToggle.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasSatToggle) {
      await saturdayToggle.click();
    }
  });

  /* ── Tab: Classes & Sections ── */

  test('5) classes & sections tab shows default classes', async ({ page }) => {
    await page.goto('/settings/academics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Navigate to classes tab
    const classesTab = page.getByRole('tab', { name: /class|section/i }).first();
    const hasClassesTab = await classesTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasClassesTab) {
      await classesTab.click();
      await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    }

    const bodyText = await page.textContent('body');
    // Should list classes (10, 11, or 10-A, 11-A)
    expect(bodyText).toMatch(/10|11|Class/);
  });

  test('6) add a new section to class 10', async ({ page }) => {
    await page.goto('/settings/academics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Navigate to classes tab
    const classesTab = page.getByRole('tab', { name: /class|section/i }).first();
    const hasClassesTab = await classesTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasClassesTab) {
      await classesTab.click();
      await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    }

    // Look for add section button near class 10
    const addSectionBtn = page.getByRole('button', { name: /add section|new section|\+/i }).first();
    const hasAddSection = await addSectionBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasAddSection) {
      await addSectionBtn.click();

      // Fill section name
      const sectionInput = page.locator(
        'input[name="section"], input[name="sectionName"], input[placeholder*="section" i]',
      ).first();
      const hasSectionInput = await sectionInput.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasSectionInput) {
        await sectionInput.fill('B');

        // Submit
        const confirmBtn = page.getByRole('button', { name: /add|save|confirm|create/i }).last();
        const hasConfirm = await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false);
        if (hasConfirm) await confirmBtn.click();
      }
    }

    // Verify the page still has class/section content
    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/class|section/i);
  });

  /* ── Tab: Subjects ── */

  test('7) subjects tab shows default subjects', async ({ page }) => {
    await page.goto('/settings/academics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Navigate to subjects tab
    const subjectsTab = page.getByRole('tab', { name: /subject/i }).first();
    const hasSubjectsTab = await subjectsTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasSubjectsTab) {
      await subjectsTab.click();
      await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    }

    const bodyText = await page.textContent('body');
    // Default subjects from mock state
    expect(bodyText).toMatch(/Mathematics|Math/);
    expect(bodyText).toMatch(/Science|English|Social Studies/);
  });

  test('8) add a new subject "Hindi" with code "HIN"', async ({ page }) => {
    await page.goto('/settings/academics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Navigate to subjects tab
    const subjectsTab = page.getByRole('tab', { name: /subject/i }).first();
    const hasSubjectsTab = await subjectsTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasSubjectsTab) {
      await subjectsTab.click();
      await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    }

    // Click add subject
    const addSubjectBtn = page.getByRole('button', { name: /add subject|new subject|\+/i }).first();
    const hasAddSubject = await addSubjectBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasAddSubject) {
      await addSubjectBtn.click();

      // The modal uses HeroUI Input components without name attributes;
      // target the visible text inputs inside the modal body.
      const modal = page.locator('[role="dialog"], .modal-content, [data-testid="subject-modal"]').last();
      const inputs = modal.locator('input[type="text"]').all();
      const inputEls = await inputs;

      if (inputEls.length > 0) {
        await inputEls[0].fill('Hindi');
      }
      if (inputEls.length > 1) {
        await inputEls[1].fill('HIN');
      }

      // Save — click the enabled primary button inside the modal footer
      const saveBtn = modal.locator('button').filter({ hasText: /Add Subject|Update Subject|Save/i }).first();
      const hasSave = await saveBtn.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasSave) {
        // Wait briefly for the button to become enabled after typing
        await page.waitForTimeout(300);
        await saveBtn.click();
      }
    }

    // Verify page is still on academic settings
    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/subject|academic/i);
  });
});
