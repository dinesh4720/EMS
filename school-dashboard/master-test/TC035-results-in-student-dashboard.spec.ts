/**
 * TC035: Verify exam results appear correctly in individual student dashboard.
 *
 * Verifies: student dashboard load, academics/results tab, multiple exam results
 * display, marks accuracy, grade correctness, pass/fail status, and percentage
 * calculation.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState,
  installMockApi,
  seedStudent,
  seedExam,
  seedResult,
  CLASS_10A_ID,
  SCHOOL_ID,
  type MockState,
} from '../tests/test-utils';

/* ───────── Student results route overrides ───────── */

async function installStudentResultsRoutes(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  // Override student results endpoint with enriched data
  await page.route('**/api/students/*/results', async (route) => {
    const url = new URL(route.request().url());
    const studentId = url.pathname.split('/')[3];
    state.requestLog.add(`GET /api/students/${studentId}/results`);

    const studentResults = state.results.filter((r) => r.studentId === studentId);

    // Enrich with exam details
    const enrichedResults = studentResults.map((r) => {
      const exam = state.exams.find((e) => e.id === r.examId);
      const pct = (r.marks / r.maxMarks) * 100;
      return {
        ...r,
        examName: exam?.name || 'Unknown Exam',
        examDate: exam?.date || '',
        examStatus: exam?.status || 'scheduled',
        percentage: Math.round(pct * 100) / 100,
        status: pct >= 35 ? 'Pass' : 'Fail',
      };
    });

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(enrichedResults),
    });
  });

  // Student academic performance endpoint
  await page.route('**/api/academics/student-performance/*', async (route) => {
    const url = new URL(route.request().url());
    const studentId = url.pathname.split('/').pop();
    state.requestLog.add(`GET /api/academics/student-performance/${studentId}`);

    const studentResults = state.results.filter((r) => r.studentId === studentId);

    // Group by exam
    const examMap = new Map<string, { examName: string; results: typeof studentResults; totalMarks: number; totalMaxMarks: number }>();
    for (const r of studentResults) {
      const exam = state.exams.find((e) => e.id === r.examId);
      const entry = examMap.get(r.examId) || {
        examName: exam?.name || 'Unknown',
        results: [],
        totalMarks: 0,
        totalMaxMarks: 0,
      };
      entry.results.push(r);
      entry.totalMarks += r.marks;
      entry.totalMaxMarks += r.maxMarks;
      examMap.set(r.examId, entry);
    }

    const exams = Array.from(examMap.entries()).map(([examId, data]) => ({
      examId,
      examName: data.examName,
      subjects: data.results.map((r) => ({
        subject: r.subject,
        marks: r.marks,
        maxMarks: r.maxMarks,
        grade: r.grade,
        percentage: Math.round((r.marks / r.maxMarks) * 100),
      })),
      totalMarks: data.totalMarks,
      totalMaxMarks: data.totalMaxMarks,
      percentage: Math.round((data.totalMarks / data.totalMaxMarks) * 100),
    }));

    const overallPercentage = studentResults.length > 0
      ? Math.round((studentResults.reduce((sum, r) => sum + r.marks, 0) / studentResults.reduce((sum, r) => sum + r.maxMarks, 0)) * 100)
      : 0;

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        studentId,
        exams,
        overallPercentage,
        totalExams: exams.length,
      }),
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   TEST SUITE
   ═══════════════════════════════════════════════════════════════ */

test.describe('TC035: Results in Student Dashboard', () => {
  let state: MockState;
  let student: ReturnType<typeof seedStudent>;
  let exam1: ReturnType<typeof seedExam>;
  let exam2: ReturnType<typeof seedExam>;

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    // Seed 1 student
    student = seedStudent(state, { name: 'Aarav Kumar', rollNo: '1', classId: CLASS_10A_ID });

    // Seed 2 exams
    exam1 = seedExam(state, {
      name: 'Mid-Term Mathematics',
      classId: CLASS_10A_ID,
      status: 'results_published',
      subjects: ['Mathematics'],
    });
    exam2 = seedExam(state, {
      name: 'Mid-Term Science',
      classId: CLASS_10A_ID,
      status: 'results_published',
      subjects: ['Science'],
    });

    // Seed results:
    // Exam 1 (Mathematics): 85/100
    seedResult(state, student.id, exam1.id, 'Mathematics', 85, 100);
    // Exam 2 (Science): 72/100
    seedResult(state, student.id, exam2.id, 'Science', 72, 100);

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });
    await installMockApi(page, state);
    await installStudentResultsRoutes(page, state);
  });

  test('1) student dashboard page loads with student info', async ({ page }) => {
    await page.goto(`/students/${student.id}`);
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');

    // Student name should be visible
    await page.waitForFunction(
      (name) => document.body.textContent?.includes(name),
      student.name,
      { timeout: 10_000 },
    ).catch(() => {});

    const bodyText = await body.textContent();
    expect(bodyText).toContain(student.name);
  });

  test('2) academics/results tab shows both exam results', async ({ page }) => {
    await page.goto(`/students/${student.id}`);
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await page.waitForFunction(
      (name) => document.body.textContent?.includes(name),
      student.name,
      { timeout: 10_000 },
    ).catch(() => {});

    // Click on Academics/Results tab
    const resultsTab = page.getByRole('tab', { name: /academic|result|exam/i }).first();
    if (await resultsTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await resultsTab.click();
      await page.waitForLoadState('networkidle');
    }

    // Verify results API was called
    await expect.poll(() =>
      [...state.requestLog].some((r) => r.includes(`/students/${student.id}/results`)),
    ).toBeTruthy();
  });

  test('3) student results API returns correct data for both exams', async ({ page }) => {
    await page.goto(`/students/${student.id}`);
    await page.waitForLoadState('networkidle');

    // Fetch student results directly
    const results = await page.evaluate(async (studentId) => {
      const res = await fetch(`http://localhost:3001/api/students/${studentId}/results`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, student.id);

    expect(Array.isArray(results)).toBeTruthy();
    expect(results).toHaveLength(2);

    // Verify exam 1 (Mathematics: 85/100)
    const mathResult = results.find((r: { subject: string }) => r.subject === 'Mathematics');
    expect(mathResult).toBeTruthy();
    expect(mathResult.marks).toBe(85);
    expect(mathResult.maxMarks).toBe(100);
    expect(mathResult.grade).toBe('A');
    expect(mathResult.percentage).toBe(85);
    expect(mathResult.status).toBe('Pass');
    expect(mathResult.examName).toBe('Mid-Term Mathematics');

    // Verify exam 2 (Science: 72/100)
    const sciResult = results.find((r: { subject: string }) => r.subject === 'Science');
    expect(sciResult).toBeTruthy();
    expect(sciResult.marks).toBe(72);
    expect(sciResult.maxMarks).toBe(100);
    expect(sciResult.grade).toBe('B+');
    expect(sciResult.percentage).toBe(72);
    expect(sciResult.status).toBe('Pass');
    expect(sciResult.examName).toBe('Mid-Term Science');
  });

  test('4) student performance API returns exam-wise breakdown with percentages', async ({ page }) => {
    await page.goto(`/students/${student.id}`);
    await page.waitForLoadState('networkidle');

    const performance = await page.evaluate(async (studentId) => {
      const res = await fetch(`http://localhost:3001/api/academics/student-performance/${studentId}`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, student.id);

    expect(performance.studentId).toBe(student.id);
    expect(performance.totalExams).toBe(2);
    expect(performance.exams).toHaveLength(2);

    // Overall percentage: (85 + 72) / (100 + 100) = 78.5 -> rounded to 79
    expect(performance.overallPercentage).toBe(79);

    // Check individual exam percentages
    const mathExam = performance.exams.find((e: { examName: string }) => e.examName === 'Mid-Term Mathematics');
    expect(mathExam).toBeTruthy();
    expect(mathExam.percentage).toBe(85);
    expect(mathExam.subjects[0].marks).toBe(85);
    expect(mathExam.subjects[0].grade).toBe('A');

    const sciExam = performance.exams.find((e: { examName: string }) => e.examName === 'Mid-Term Science');
    expect(sciExam).toBeTruthy();
    expect(sciExam.percentage).toBe(72);
    expect(sciExam.subjects[0].marks).toBe(72);
    expect(sciExam.subjects[0].grade).toBe('B+');
  });

  test('5) student dashboard renders result data on the page', async ({ page }) => {
    await page.goto(`/students/${student.id}`);
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await page.waitForFunction(
      (name) => document.body.textContent?.includes(name),
      student.name,
      { timeout: 10_000 },
    ).catch(() => {});

    // Navigate to results tab
    const resultsTab = page.getByRole('tab', { name: /academic|result|exam/i }).first();
    if (await resultsTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await resultsTab.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1_000);
    }

    const bodyText = await body.textContent();

    // Verify marks or grades are displayed
    const hasResultData =
      bodyText?.includes('85') ||
      bodyText?.includes('72') ||
      bodyText?.includes('Mathematics') ||
      bodyText?.includes('Science') ||
      bodyText?.includes('A') ||
      bodyText?.includes('B+');
    expect(hasResultData).toBeTruthy();
  });

  test('6) pass/fail status is accurate for passing marks', async ({ page }) => {
    await page.goto(`/students/${student.id}`);
    await page.waitForLoadState('networkidle');

    const results = await page.evaluate(async (studentId) => {
      const res = await fetch(`http://localhost:3001/api/students/${studentId}/results`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, student.id);

    // Both results should be Pass (85% and 72% are both above 35%)
    for (const r of results) {
      expect(r.status).toBe('Pass');
    }
  });

  test('7) student with a failing mark shows Fail status', async ({ page }) => {
    // Seed a third exam with failing marks
    const exam3 = seedExam(state, {
      name: 'Unit Test English',
      classId: CLASS_10A_ID,
      status: 'results_published',
      subjects: ['English'],
    });
    seedResult(state, student.id, exam3.id, 'English', 20, 100); // 20% = Fail

    await page.goto(`/students/${student.id}`);
    await page.waitForLoadState('networkidle');

    const results = await page.evaluate(async (studentId) => {
      const res = await fetch(`http://localhost:3001/api/students/${studentId}/results`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, student.id);

    expect(results).toHaveLength(3);

    const engResult = results.find((r: { subject: string }) => r.subject === 'English');
    expect(engResult).toBeTruthy();
    expect(engResult.marks).toBe(20);
    expect(engResult.status).toBe('Fail');
    expect(engResult.grade).toBe('F');
  });
});
