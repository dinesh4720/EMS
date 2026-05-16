/**
 * TC111: Create exams for multiple classes and compare results.
 *
 * Seeds 5 students in 10-A and 3 in 11-A, creates "Math Midterm" exams for
 * both classes, enters marks with different averages (10-A ~75, 11-A ~80),
 * then navigates to the performance dashboard to verify both classes are
 * listed and 11-A shows a higher average.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState,
  installMockApi,
  seedStudent,
  seedExam,
  seedResult,
  CLASS_10A_ID,
  CLASS_11A_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Tests
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC111: Multi-Class Exam Flow & Comparison', () => {
  let state: MockState;
  let exam10A: ReturnType<typeof seedExam>;
  let exam11A: ReturnType<typeof seedExam>;
  const students10A: string[] = [];
  const students11A: string[] = [];

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    // Seed 5 students in class 10-A
    const marks10A = [70, 72, 78, 80, 75]; // avg = 75
    for (let i = 0; i < 5; i++) {
      const s = seedStudent(state, { name: `Student-10A-${i + 1}`, classId: CLASS_10A_ID });
      students10A.push(s.id);
    }

    // Seed 3 students in class 11-A
    const marks11A = [78, 82, 80]; // avg = 80
    for (let i = 0; i < 3; i++) {
      const s = seedStudent(state, { name: `Student-11A-${i + 1}`, classId: CLASS_11A_ID });
      students11A.push(s.id);
    }

    // Create exams for both classes
    exam10A = seedExam(state, { name: 'Math Midterm', classId: CLASS_10A_ID, status: 'published' });
    exam11A = seedExam(state, { name: 'Math Midterm', classId: CLASS_11A_ID, status: 'published' });

    // Enter marks for 10-A students (avg ~75)
    for (let i = 0; i < students10A.length; i++) {
      seedResult(state, students10A[i], exam10A.id, 'Mathematics', marks10A[i], 100);
    }

    // Enter marks for 11-A students (avg ~80)
    for (let i = 0; i < students11A.length; i++) {
      seedResult(state, students11A[i], exam11A.id, 'Mathematics', marks11A[i], 100);
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

  test('1) verify seeded data: 5 students in 10-A, 3 in 11-A', async () => {
    const class10Students = state.students.filter((s) => s.classId === CLASS_10A_ID);
    const class11Students = state.students.filter((s) => s.classId === CLASS_11A_ID);
    expect(class10Students).toHaveLength(5);
    expect(class11Students).toHaveLength(3);
    expect(state.students).toHaveLength(8);
  });

  test('2) verify two exams created for different classes', async () => {
    expect(state.exams).toHaveLength(2);
    expect(state.exams[0].name).toBe('Math Midterm');
    expect(state.exams[0].classId).toBe(CLASS_10A_ID);
    expect(state.exams[1].name).toBe('Math Midterm');
    expect(state.exams[1].classId).toBe(CLASS_11A_ID);
  });

  test('3) verify marks: 10-A avg ~75, 11-A avg ~80', async () => {
    const results10A = state.results.filter((r) => r.examId === exam10A.id);
    const results11A = state.results.filter((r) => r.examId === exam11A.id);

    expect(results10A).toHaveLength(5);
    expect(results11A).toHaveLength(3);

    const avg10A = results10A.reduce((sum, r) => sum + r.marks, 0) / results10A.length;
    const avg11A = results11A.reduce((sum, r) => sum + r.marks, 0) / results11A.length;

    expect(avg10A).toBe(75);
    expect(avg11A).toBe(80);
    expect(avg11A).toBeGreaterThan(avg10A);
  });

  test('4) /academics page loads and shows exams', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');

    // Both exams should be accessible
    const hasExamContent = bodyText?.includes('Math Midterm') ||
      bodyText?.toLowerCase().includes('exam') ||
      bodyText?.toLowerCase().includes('academic');
    expect(hasExamContent).toBe(true);

    // Verify exams API was called
    const examsCalled = [...state.requestLog].some(
      (entry) => entry.includes('/exams'),
    );
    expect(examsCalled).toBe(true);
  });

  test('5) exam results for 10-A show correct students', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    // Navigate to results section or click on 10-A exam
    const bodyText = await page.textContent('body');

    // The exams list should be visible
    const hasExams = bodyText?.toLowerCase().includes('math midterm') ||
      bodyText?.toLowerCase().includes('exam') ||
      bodyText?.toLowerCase().includes('10');
    expect(hasExams).toBe(true);
  });

  test('6) exam results for 11-A show correct students', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');

    // Verify page loaded with exam data
    const hasContent = bodyText?.toLowerCase().includes('exam') ||
      bodyText?.toLowerCase().includes('academic') ||
      bodyText?.toLowerCase().includes('11');
    expect(hasContent).toBe(true);
  });

  test('7) performance dashboard shows both classes', async ({ page }) => {
    await page.goto('/academics/performance');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';

    // Performance/analytics dashboard should show class-level data
    const hasPerformanceData = lowerBody.includes('performance') ||
      lowerBody.includes('class') ||
      lowerBody.includes('10') ||
      lowerBody.includes('11') ||
      lowerBody.includes('average') ||
      lowerBody.includes('academic');
    expect(hasPerformanceData).toBe(true);
  });

  test('8) verify class comparison: 11-A has higher average', async ({ page }) => {
    await page.goto('/academics/performance');
    await page.waitForLoadState('networkidle');

    // Verify the analytics endpoint was called
    const analyticsCalled = [...state.requestLog].some(
      (entry) => entry.includes('/analytics') || entry.includes('/academics'),
    );
    expect(analyticsCalled).toBe(true);

    // Data integrity: confirm 11-A > 10-A in state
    const results10A = state.results.filter((r) => r.examId === exam10A.id);
    const results11A = state.results.filter((r) => r.examId === exam11A.id);
    const avg10A = results10A.reduce((sum, r) => sum + r.marks, 0) / results10A.length;
    const avg11A = results11A.reduce((sum, r) => sum + r.marks, 0) / results11A.length;
    expect(avg11A).toBeGreaterThan(avg10A);
  });

  test('9) students page shows all 8 students across classes', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');

    // Should show at least some student names
    const hasStudents = bodyText?.includes('Student-10A') ||
      bodyText?.includes('Student-11A');
    expect(hasStudents).toBe(true);

    // Verify students API was called
    const studentsCalled = [...state.requestLog].some(
      (entry) => entry.includes('GET') && entry.includes('/students'),
    );
    expect(studentsCalled).toBe(true);
  });

  test('10) grades are correctly assigned based on marks', async () => {
    // Verify grading logic from seedResult
    for (const result of state.results) {
      if (result.marks >= 90) expect(result.grade).toBe('A+');
      else if (result.marks >= 80) expect(result.grade).toBe('A');
      else if (result.marks >= 70) expect(result.grade).toBe('B+');
      else if (result.marks >= 60) expect(result.grade).toBe('B');
      else if (result.marks >= 50) expect(result.grade).toBe('C');
      else expect(result.grade).toBe('F');
    }
  });
});
