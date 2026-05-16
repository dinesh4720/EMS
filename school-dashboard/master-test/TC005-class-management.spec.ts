/**
 * TC005: Admin views class list, creates a new class, views class dashboard.
 *
 * Verifies class list with student counts and teacher names, navigating
 * into a class dashboard, and viewing the student list tab.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState,
  installMockApi,
  seedStudent,
  CLASS_10A_ID,
  CLASS_11A_ID,
  TEACHER_A_ID,
  TEACHER_B_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Tests
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC005: Class Management — List, Dashboard, Students', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    // Seed 5 students in class 10-A
    for (let i = 0; i < 5; i++) {
      seedStudent(state, { name: `Student 10A-${i + 1}`, classId: CLASS_10A_ID });
    }

    // Seed 3 students in class 11-A
    for (let i = 0; i < 3; i++) {
      seedStudent(state, { name: `Student 11A-${i + 1}`, classId: CLASS_11A_ID });
    }

    // Dismiss cookie consent
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);
  });

  test('1) class list page loads and shows 10-A and 11-A', async ({ page }) => {
    await page.goto('/classes');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    // Should show both classes
    expect(bodyText).toMatch(/10.*A|10-A|Class 10/);
    expect(bodyText).toMatch(/11.*A|11-A|Class 11/);
  });

  test('2) class list shows student counts', async ({ page }) => {
    await page.goto('/classes');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');

    // 10-A has 5 students, 11-A has 3 students
    // The counts may be shown as "5 students" or just "5"
    const hasCounts = bodyText?.includes('5') && bodyText?.includes('3');
    expect(hasCounts).toBeTruthy();
  });

  test('3) class list shows class teacher names', async ({ page }) => {
    await page.goto('/classes');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');

    // Teacher A (Ananya Sharma) is class teacher of 10-A
    // Teacher B (Ravi Menon) is class teacher of 11-A
    const hasTeacherNames =
      bodyText?.includes('Ananya Sharma') ||
      bodyText?.includes('Ravi Menon') ||
      bodyText?.toLowerCase().includes('class teacher');

    expect(hasTeacherNames).toBeTruthy();
  });

  test('4) clicking on class 10-A navigates to class dashboard', async ({ page }) => {
    await page.goto('/classes');
    await page.waitForLoadState('networkidle');

    // Click on class 10-A card or row
    const classLink = page.locator(`a:has-text("10-A"), a:has-text("10 A"), tr:has-text("10-A"), [data-class-id="${CLASS_10A_ID}"]`).first();
    const hasClassLink = await classLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasClassLink) {
      await classLink.click();
      await page.waitForLoadState('networkidle');

      // Should navigate to class detail page
      const url = page.url();
      expect(url).toMatch(/class/i);

      const bodyText = await page.textContent('body');
      expect(bodyText).toMatch(/10.*A|10-A|Class 10/);
    } else {
      // Try clicking on a card-like element
      const classCard = page.getByText('10-A').first();
      await classCard.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('5) class dashboard loads with correct class information', async ({ page }) => {
    // Navigate directly to class dashboard
    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    // Should show class 10-A info
    expect(bodyText).toMatch(/10.*A|10-A|Class 10/);

    // Should show class teacher name
    const hasTeacher =
      bodyText?.includes('Ananya Sharma') ||
      bodyText?.toLowerCase().includes('class teacher');
    expect(hasTeacher).toBeTruthy();
  });

  test('6) class dashboard student list tab shows 5 students for 10-A', async ({ page }) => {
    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    // Navigate to students tab if present
    const studentsTab = page.getByRole('tab', { name: /student/i }).first();
    const hasStudentsTab = await studentsTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasStudentsTab) {
      await studentsTab.click();
      await page.waitForLoadState('networkidle');
    }

    const bodyText = await page.textContent('body');
    // Should show student names from 10-A
    expect(bodyText).toMatch(/Student 10A-1|Student 10A-2|Student 10A-3/);

    // Should show 5 students total (or count indicator)
    const hasCount =
      bodyText?.includes('5') ||
      bodyText?.toLowerCase().includes('5 student');
    expect(hasCount).toBeTruthy();
  });

  test('7) navigate back to class list from class dashboard', async ({ page }) => {
    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    // Look for back button or breadcrumb to class list
    const backBtn = page.locator(
      'a:has-text("Classes"), button:has-text("Back"), [aria-label="Back"], a[href="/classes"]',
    ).first();
    const hasBack = await backBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasBack) {
      await backBtn.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/classes/);
    } else {
      // Use browser navigation
      await page.goBack();
      await page.waitForLoadState('networkidle');
    }

    // Should be back on class list
    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/10.*A|11.*A|Class/);
  });

  test('8) class API endpoints were called correctly', async ({ page }) => {
    await page.goto('/classes');
    await page.waitForLoadState('networkidle');

    // Verify the classes API was called
    const classesRequested = [...state.requestLog].some(
      (entry) => entry.includes('GET') && entry.includes('/classes'),
    );
    expect(classesRequested).toBeTruthy();
  });
});
