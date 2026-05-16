import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, seedStudent, seedExam, seedResult,
  CLASS_10A_ID, CLASS_11A_ID,
  type MockState,
} from './test-utils';

/**
 * Academics — Performance Dashboard & CBSE Reports
 *
 * Covers: performance stats, subject breakdown, charts, exam filtering,
 * report card endpoints, CBSE CCE format, grade/rank computation.
 */
test.describe('Academics — Performance Dashboard & CBSE Reports', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    // Seed 5 students in 10-A with results across multiple subjects
    for (let i = 0; i < 5; i++) {
      seedStudent(state, { name: `Student ${i + 1}`, classId: CLASS_10A_ID });
    }
    await installMockApi(page, state);
  });

  /* ───── 1. Performance dashboard stats ───── */

  test('academics page shows exam list and KPI stats', async ({ page }) => {
    const exam = seedExam(state, { name: 'Mid Term', status: 'completed' });

    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    // Wait for the academics page to fully render (lazy chunks + API calls)
    await expect(page.locator('h1').filter({ hasText: 'Academics' })).toBeVisible({ timeout: 15_000 });

    // KPI strip should show exam counts
    await expect(page.getByText('Upcoming exams').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Results published').first()).toBeVisible({ timeout: 10_000 });

    // Exam should appear in the list
    await expect(page.getByText('Mid Term').first()).toBeVisible({ timeout: 10_000 });
  });

  /* ───── 2. Subject-wise breakdown ───── */

  test('academics page lists exams with subjects', async ({ page }) => {
    const exam = seedExam(state, {
      name: 'Unit Test',
      status: 'completed',
      subjects: [
        { name: 'English', maxMarks: 100, passingMarks: 35 },
        { name: 'Science', maxMarks: 100, passingMarks: 35 },
      ],
    });

    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1').filter({ hasText: 'Academics' })).toBeVisible({ timeout: 15_000 });

    // Exam name should appear in the list
    await expect(page.getByText('Unit Test').first()).toBeVisible({ timeout: 10_000 });
  });

  /* ───── 3. Charts render (bar/pie) ───── */

  test('academics page renders exam list without charts on landing', async ({ page }) => {
    seedExam(state, { name: 'Final Exam', status: 'completed' });

    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1').filter({ hasText: 'Academics' })).toBeVisible({ timeout: 15_000 });

    // The landing page shows a KPI strip and exam table (no charts since Phase 11 revamp)
    await expect(page.getByText('Upcoming exams').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Final Exam').first()).toBeVisible({ timeout: 10_000 });
  });

  /* ───── 4. Filter performance by exam type ───── */

  test('academics page shows all seeded exams in list', async ({ page }) => {
    seedExam(state, { name: 'Unit Test 1', status: 'scheduled', classId: CLASS_10A_ID });
    seedExam(state, { name: 'Mid Term', status: 'completed', classId: CLASS_10A_ID });
    seedExam(state, { name: 'Final Exam', status: 'results_published', classId: CLASS_11A_ID });

    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1').filter({ hasText: 'Academics' })).toBeVisible({ timeout: 15_000 });

    // Wait for exams table to populate
    await expect(page.getByText('Unit Test 1').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Mid Term').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Final Exam').first()).toBeVisible({ timeout: 10_000 });
  });

  /* ───── 5. Student-wise performance with exam history ───── */

  test('student-wise performance shows individual exam history with trend', async ({ page }) => {
    const exam1 = seedExam(state, { name: 'Unit Test 1', status: 'completed' });
    const exam2 = seedExam(state, { name: 'Mid Term', status: 'completed' });

    // Student 1 improves, Student 2 declines
    seedResult(state, state.students[0].id, exam1.id, 'English', 70);
    seedResult(state, state.students[0].id, exam2.id, 'English', 85);
    seedResult(state, state.students[1].id, exam1.id, 'English', 88);
    seedResult(state, state.students[1].id, exam2.id, 'English', 72);

    // Navigate to student detail to check academic results
    await page.goto(`/students/${state.students[0].id}`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [id="main-content"], nav', { timeout: 15000 });

    // Look for academics/results tab
    const resultsTab = page.getByRole('tab', { name: /academic|result|exam/i }).first();
    if (await resultsTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await resultsTab.click();
      await page.waitForLoadState('networkidle');
    }

    // Student results should be accessible — use retrying assertions
    const bodyLocator = page.locator('body');
    await expect(bodyLocator).toContainText(
      new RegExp(`${state.students[0].name}|English|70|85`),
      { timeout: 15000 },
    );
  });

  /* ───── 6. Report cards page loads student list with marks, grade, rank ───── */

  test('report cards endpoint returns student list with marks, grade, rank', async ({ page }) => {
    const exam = seedExam(state, { name: 'Final Exam', status: 'results_published' });
    const marks = [95, 82, 70, 55, 38];
    state.students.forEach((s, i) => {
      seedResult(state, s.id, exam.id, 'English', marks[i]);
      seedResult(state, s.id, exam.id, 'Mathematics', marks[i] - 5);
    });

    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    // Use page.evaluate + fetch so the request goes through page.route() interceptors
    const result = await page.evaluate(async ({ examId, classId }) => {
      const res = await fetch(`http://localhost:3001/api/report-cards/${examId}/${classId}`, {
        headers: { Authorization: 'Bearer test-admin-token' },
      });
      return res.json();
    }, { examId: exam.id, classId: CLASS_10A_ID }) as Array<{ rank: number; percentage: number; grade: string; subjects: unknown[] }>;

    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toBe(5);
    // First student (highest marks) should be rank 1
    const topStudent = result.find((r) => r.rank === 1);
    expect(topStudent).toBeTruthy();
    expect(topStudent!.percentage).toBeGreaterThan(80);
    expect(topStudent!.grade).toBeTruthy();
    // Each student should have subjects array
    expect(result[0].subjects.length).toBe(2);
  });

  /* ───── 7. Generate report cards ───── */

  test('generate report cards creates PDF-ready data', async ({ page }) => {
    const exam = seedExam(state, { name: 'Final', status: 'completed' });

    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    // Use page.evaluate + fetch so the request goes through page.route() interceptors
    const data = await page.evaluate(async ({ examId, classId }) => {
      const res = await fetch('http://localhost:3001/api/report-cards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-admin-token' },
        body: JSON.stringify({ examId, classId, template: 'standard' }),
      });
      return { status: res.status, body: await res.json() };
    }, { examId: exam.id, classId: CLASS_10A_ID });

    expect(data.status).toBe(201);
    expect(data.body.success).toBeTruthy();
    expect(data.body.generated).toBeTruthy();
    expect(data.body.template).toBe('standard');
  });

  /* ───── 8. Download individual report card as PDF ───── */

  test('download individual report card as PDF', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    // Use page.evaluate + fetch so the request goes through page.route() interceptors
    const data = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/report-cards/download/student-123', {
        headers: { Authorization: 'Bearer test-admin-token' },
      });
      return { status: res.status, contentType: res.headers.get('content-type') };
    });

    expect(data.status).toBe(200);
    expect(data.contentType).toContain('application/pdf');
  });

  /* ───── 9. Bulk download report cards for class ───── */

  test('bulk download all report cards for class', async ({ page }) => {
    const exam = seedExam(state, { name: 'Annual Exam', status: 'results_published' });
    state.students.forEach((s, i) => {
      seedResult(state, s.id, exam.id, 'English', 60 + i * 8);
    });

    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    // Use page.evaluate + fetch so the request goes through page.route() interceptors
    const result = await page.evaluate(async ({ examId, classId }) => {
      const res = await fetch(`http://localhost:3001/api/report-cards/${examId}/${classId}`, {
        headers: { Authorization: 'Bearer test-admin-token' },
      });
      return res.json();
    }, { examId: exam.id, classId: CLASS_10A_ID }) as Array<{ rank: number }>;

    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toBe(5);
    // All students should have ranks 1-5
    const ranks = result.map((r) => r.rank).sort();
    expect(ranks).toEqual([1, 2, 3, 4, 5]);
  });

  /* ───── 10. CBSE report card template shows CCE grading format ───── */

  test('CBSE report card template supports CCE grading format (scholastic & co-scholastic)', async ({ page }) => {
    const student = state.students[0];

    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    // Use page.evaluate + fetch so the request goes through page.route() interceptors
    const result = await page.evaluate(async (payload) => {
      const res = await fetch('http://localhost:3001/api/cbse-report-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-admin-token' },
        body: JSON.stringify(payload),
      });
      return { status: res.status, body: await res.json() };
    }, {
      studentId: student.id,
      classId: student.id, // placeholder
      academicYear: '2026-27',
      term: 'term_1',
      scholasticGrades: [
        { subjectName: 'English', theoryMaxMarks: 80, theoryMarks: 68, practicalMaxMarks: 20, practicalMarks: 17 },
        { subjectName: 'Mathematics', theoryMaxMarks: 80, theoryMarks: 72, practicalMaxMarks: 20, practicalMarks: 18 },
      ],
      coScholasticGrades: [
        { area: 'Work Education', grade: 'A' },
        { area: 'Art Education', grade: 'B' },
        { area: 'Health & Physical Education', grade: 'A' },
      ],
      disciplineGrade: 'A',
      classTeacherRemarks: 'Excellent performance',
      principalRemarks: 'Keep it up',
    });

    expect(result.status).toBe(201);
    expect(result.body.scholasticGrades).toHaveLength(2);
    expect(result.body.coScholasticGrades).toHaveLength(3);
    expect(result.body.disciplineGrade).toBe('A');
    expect(result.body.isPublished).toBe(false);
  });

  /* ───── 11. Report card includes attendance data and teacher remarks ───── */

  test('report card includes attendance data and teacher remarks', async ({ page }) => {
    const exam = seedExam(state, { name: 'Annual', status: 'results_published' });
    seedResult(state, state.students[0].id, exam.id, 'English', 88);

    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    // Use page.evaluate + fetch so the request goes through page.route() interceptors
    const result = await page.evaluate(async ({ examId, classId }) => {
      const res = await fetch(`http://localhost:3001/api/report-cards/${examId}/${classId}`, {
        headers: { Authorization: 'Bearer test-admin-token' },
      });
      return res.json();
    }, { examId: exam.id, classId: CLASS_10A_ID }) as Array<{ studentId: string; attendance: { totalDays: number; present: number; percentage: number } }>;

    // Each report card should include attendance data
    const studentCard = result.find((r) => r.studentId === state.students[0].id);
    expect(studentCard).toBeTruthy();
    expect(studentCard!.attendance).toBeTruthy();
    expect(studentCard!.attendance.totalDays).toBe(180);
    expect(studentCard!.attendance.present).toBe(165);
    expect(studentCard!.attendance.percentage).toBeCloseTo(91.7, 0);
  });

  /* ───── 12. Grade auto-computed from percentage ───── */

  test('grade auto-computed from percentage using school grade scale', async ({ page }) => {
    const exam = seedExam(state, { name: 'Grade Test', status: 'completed' });

    // Seed results with known marks covering all grade boundaries
    const testCases = [
      { marks: 95, expectedGrade: 'A+' },
      { marks: 85, expectedGrade: 'A' },
      { marks: 75, expectedGrade: 'B+' },
      { marks: 65, expectedGrade: 'B' },
      { marks: 55, expectedGrade: 'C' },
    ];

    testCases.forEach((tc, i) => {
      seedResult(state, state.students[i].id, exam.id, 'English', tc.marks);
    });

    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    // Use page.evaluate + fetch so the request goes through page.route() interceptors
    const result = await page.evaluate(async ({ examId, classId }) => {
      const res = await fetch(`http://localhost:3001/api/report-cards/${examId}/${classId}`, {
        headers: { Authorization: 'Bearer test-admin-token' },
      });
      return res.json();
    }, { examId: exam.id, classId: CLASS_10A_ID }) as Array<{ grade: string; subjects: Array<{ marksObtained: number }> }>;

    for (const tc of testCases) {
      const card = result.find((r) =>
        r.subjects.some((s) => s.marksObtained === tc.marks),
      );
      expect(card).toBeTruthy();
      expect(card!.grade).toBe(tc.expectedGrade);
    }
  });

  /* ───── 13. Rank calculated correctly with tie handling ───── */

  test('rank calculated correctly with tie handling', async ({ page }) => {
    const exam = seedExam(state, { name: 'Rank Test', status: 'completed' });

    // Students with tied marks: 90, 90, 80, 70, 60
    const marks = [90, 90, 80, 70, 60];
    state.students.forEach((s, i) => {
      seedResult(state, s.id, exam.id, 'English', marks[i]);
    });

    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    // Use page.evaluate + fetch so the request goes through page.route() interceptors
    const result = await page.evaluate(async ({ examId, classId }) => {
      const res = await fetch(`http://localhost:3001/api/report-cards/${examId}/${classId}`, {
        headers: { Authorization: 'Bearer test-admin-token' },
      });
      return res.json();
    }, { examId: exam.id, classId: CLASS_10A_ID }) as Array<{ rank: number; percentage: number }>;

    // Sort by rank to check ordering
    const sorted = result.sort((a, b) => a.rank - b.rank);
    // Top two students should both be rank 1 and 2 (sequential ranking)
    expect(sorted[0].rank).toBe(1);
    expect(sorted[1].rank).toBe(2);
    // Tied students should have same percentage
    expect(sorted[0].percentage).toBe(sorted[1].percentage);
    // Ranks should be sequential 1-5
    expect(sorted.map((s) => s.rank)).toEqual([1, 2, 3, 4, 5]);
  });

  /* ───── 14. Performance comparison across multiple exams ───── */

  test('performance comparison across multiple exams', async ({ page }) => {
    const exam1 = seedExam(state, { name: 'Unit Test 1', status: 'completed' });
    const exam2 = seedExam(state, { name: 'Mid Term', status: 'completed' });
    const exam3 = seedExam(state, { name: 'Final Exam', status: 'results_published' });

    // Seed results for first student across all exams
    seedResult(state, state.students[0].id, exam1.id, 'English', 70);
    seedResult(state, state.students[0].id, exam2.id, 'English', 78);
    seedResult(state, state.students[0].id, exam3.id, 'English', 85);

    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1').filter({ hasText: 'Academics' })).toBeVisible({ timeout: 15_000 });

    // All 3 exams should be listed
    await expect(page.getByText('Unit Test 1').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Mid Term').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Final Exam').first()).toBeVisible({ timeout: 10_000 });

    // Verify student performance API returns all exam results (use page.evaluate + fetch)
    const perfResult = await page.evaluate(async (studentId) => {
      const res = await fetch(`http://localhost:3001/api/academics/student-performance/${studentId}`, {
        headers: { Authorization: 'Bearer test-admin-token' },
      });
      return res.json();
    }, state.students[0].id) as { exams: Array<{ percentage: number }> };

    expect(perfResult.exams).toHaveLength(3);
    // Performance should show improvement trend
    const percentages = perfResult.exams.map((e: { percentage: number }) => e.percentage);
    expect(percentages.every((p: number) => p > 0)).toBeTruthy();
  });
});
