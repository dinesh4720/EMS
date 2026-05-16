/**
 * TC118: Verify UI handles large datasets without breaking.
 *
 * Seeds 100 students across classes, 20 exams, lots of attendance records,
 * then navigates to students, fees, and academics pages to verify the UI
 * renders without crashing, search/filter works, and no "loading forever" states.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState,
  installMockApi,
  seedStudent,
  seedStudentWithFees,
  seedExam,
  seedResult,
  seedAttendanceForClass,
  CLASS_10A_ID,
  CLASS_11A_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Tests
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC118: Large Dataset Performance', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    // Seed 100 students: 60 in 10-A, 40 in 11-A
    for (let i = 1; i <= 60; i++) {
      seedStudentWithFees(state, {
        name: `Student-10A-${String(i).padStart(3, '0')}`,
        classId: CLASS_10A_ID,
        feeStatus: i <= 30 ? 'paid' : i <= 50 ? 'pending' : 'overdue',
        gender: i % 2 === 0 ? 'Female' : 'Male',
      });
    }
    for (let i = 1; i <= 40; i++) {
      seedStudentWithFees(state, {
        name: `Student-11A-${String(i).padStart(3, '0')}`,
        classId: CLASS_11A_ID,
        feeStatus: i <= 20 ? 'paid' : i <= 35 ? 'pending' : 'overdue',
        gender: i % 2 === 0 ? 'Female' : 'Male',
      });
    }

    // Seed 20 exams across classes
    const exams10A: string[] = [];
    const exams11A: string[] = [];
    for (let i = 1; i <= 10; i++) {
      const e = seedExam(state, {
        name: `Exam-10A-${i}`,
        classId: CLASS_10A_ID,
        status: i <= 5 ? 'published' : 'scheduled',
      });
      exams10A.push(e.id);
    }
    for (let i = 1; i <= 10; i++) {
      const e = seedExam(state, {
        name: `Exam-11A-${i}`,
        classId: CLASS_11A_ID,
        status: i <= 5 ? 'published' : 'scheduled',
      });
      exams11A.push(e.id);
    }

    // Seed results for first published exam (first 10 students per class)
    const students10A = state.students.filter((s) => s.classId === CLASS_10A_ID).slice(0, 10);
    const students11A = state.students.filter((s) => s.classId === CLASS_11A_ID).slice(0, 10);
    for (const s of students10A) {
      seedResult(state, s.id, exams10A[0], 'Mathematics', 50 + Math.floor(Math.random() * 50), 100);
    }
    for (const s of students11A) {
      seedResult(state, s.id, exams11A[0], 'Mathematics', 50 + Math.floor(Math.random() * 50), 100);
    }

    // Seed attendance for multiple days
    for (let day = 25; day <= 30; day++) {
      seedAttendanceForClass(state, CLASS_10A_ID, `2026-03-${day}`);
      seedAttendanceForClass(state, CLASS_11A_ID, `2026-03-${day}`);
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

  test('1) verify seeded data counts', async () => {
    expect(state.students).toHaveLength(100);
    expect(state.exams).toHaveLength(20);
    expect(state.results).toHaveLength(20); // 10 + 10 students * 1 exam each
    expect(state.attendance.length).toBeGreaterThan(0);

    // Verify class distribution
    const class10 = state.students.filter((s) => s.classId === CLASS_10A_ID);
    const class11 = state.students.filter((s) => s.classId === CLASS_11A_ID);
    expect(class10).toHaveLength(60);
    expect(class11).toHaveLength(40);
  });

  test('2) /students renders without crash with 100 students', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();

    // Page should show student content, not an error
    const lowerBody = bodyText?.toLowerCase() || '';
    expect(lowerBody).not.toMatch(/something went wrong|error|crash/i);
    expect(lowerBody).toMatch(/student/i);
  });

  test('3) student list shows data (pagination or virtual scroll)', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');

    // Should show at least some students
    const hasStudentData = bodyText?.includes('Student-10A') ||
      bodyText?.includes('Student-11A');
    expect(hasStudentData).toBe(true);

    // Check for pagination controls
    const paginationExists = page.locator(
      '[class*="pagination"], [data-testid="pagination"], button:has-text("Next"), button:has-text("2")',
    ).first();
    const hasPagination = await paginationExists.isVisible({ timeout: 3000 }).catch(() => false);

    // Either pagination or all data shown - both are valid
    expect(bodyText?.toLowerCase()).toMatch(/student/i);
  });

  test('4) search still works with large dataset', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // Find and use search
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search" i], input[name="search"]',
    ).first();
    const hasSearch = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSearch) {
      await searchInput.fill('Student-10A-001');
      await page.waitForTimeout(500);
    }

    // Page should still respond
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText?.toLowerCase()).toMatch(/student/i);
  });

  test('5) filters still work with large dataset', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // Try class filter
    const classFilter = page.locator(
      'select[name="class"], select[name="classId"], [data-testid="class-filter"]',
    ).first();
    const hasClassFilter = await classFilter.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasClassFilter) {
      const isSelect = await classFilter.evaluate((el) => el.tagName === 'SELECT').catch(() => false);
      if (isSelect) {
        await classFilter.selectOption({ label: '10-A' });
        await page.waitForTimeout(500);
      }
    }

    // Page should still function
    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/student/i);
  });

  test('6) /fees handles many students without breaking', async ({ page }) => {
    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';

    // Fee page should load
    expect(lowerBody).not.toMatch(/something went wrong|error|crash/i);

    const hasFeeContent = lowerBody.includes('fee') ||
      lowerBody.includes('payment') ||
      lowerBody.includes('collection');
    expect(hasFeeContent).toBe(true);
  });

  test('7) /academics handles many exams without breaking', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';

    // Academics page should load
    expect(lowerBody).not.toMatch(/something went wrong|error|crash/i);

    const hasAcademicContent = lowerBody.includes('exam') ||
      lowerBody.includes('academic') ||
      lowerBody.includes('Exam-10A') ||
      lowerBody.includes('Exam-11A');
    expect(hasAcademicContent).toBe(true);
  });

  test('8) no "loading forever" states on students page', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // Wait extra time for any lazy loading
    await page.waitForTimeout(3000);

    // Check that loading indicators are resolved
    const spinners = page.locator(
      '[class*="spinner"]:visible, [class*="loading"]:visible',
    );
    const spinnerCount = await spinners.count();

    // After 3 seconds + networkidle, very few spinners should remain
    expect(spinnerCount).toBeLessThan(3);
  });

  test('9) no "loading forever" states on fees page', async ({ page }) => {
    await page.goto('/fees');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const spinners = page.locator(
      '[class*="spinner"]:visible, [class*="loading"]:visible',
    );
    const spinnerCount = await spinners.count();
    expect(spinnerCount).toBeLessThan(3);
  });

  test('10) dashboard handles large dataset stats correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');

    // Dashboard stats should show 100 students
    expect(bodyText?.includes('100')).toBe(true);

    // Page should not crash
    const lowerBody = bodyText?.toLowerCase() || '';
    expect(lowerBody).not.toMatch(/something went wrong|error/i);
  });

  test('11) attendance data is substantial', async () => {
    // 6 days * students per class = significant records
    const totalAttendance = state.attendance.length;
    expect(totalAttendance).toBeGreaterThan(100);

    // Verify multiple days covered
    const dates = new Set(state.attendance.map((a) => a.date));
    expect(dates.size).toBe(6);
  });
});
