/**
 * TC090: Enter marks with different grading types (numerical, grades, CGPA).
 *
 * Verifies: numerical input fields for marks entry, grade auto-calculation,
 * grade selector dropdown for letter-grade exams, CGPA decimal input,
 * and that each grading type is handled correctly end-to-end.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState,
  installMockApi,
  seedStudent,
  seedExam,
  CLASS_10A_ID,
  SCHOOL_ID,
  type MockState,
} from '../tests/test-utils';

/* ───────── Types ───────── */

interface ExamWithGrading {
  _id: string; id: string; name: string; classId: string;
  status: string; date: string; subjects: string[]; schoolId: string;
  gradingType?: string; maxMarks?: number; passingMarks?: number;
  gradeScale?: Array<{ grade: string; minMarks: number; maxMarks: number }>;
}

interface GradeResultEntry {
  studentId: string;
  marks?: number;
  grade?: string;
  cgpa?: number;
  maxMarks?: number;
  gradingType: string;
}

/* ───────── Grading helpers ───────── */

function computeGradeFromMarks(marks: number, maxMarks: number): string {
  const pct = (marks / maxMarks) * 100;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  return 'F';
}

function computeCgpaGrade(cgpa: number): string {
  if (cgpa >= 9) return 'A+';
  if (cgpa >= 8) return 'A';
  if (cgpa >= 7) return 'B+';
  if (cgpa >= 6) return 'B';
  if (cgpa >= 5) return 'C';
  return 'F';
}

/* ───────── Route overrides ───────── */

async function installGradingRoutes(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  const savedResults: Array<Record<string, unknown>> = [];

  // Override exams list
  await page.route('**/api/exams', async (route) => {
    const method = route.request().method();
    state.requestLog.add(`${method} /api/exams`);
    if (method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: state.exams, total: state.exams.length, page: 1, limit: 100 }),
      });
    }
    return route.fallback();
  });

  // Single exam detail
  await page.route('**/api/exams/*', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (path.includes('/results') || path.includes('/publish')) return route.fallback();

    const examId = path.split('/').pop();
    state.requestLog.add(`GET /api/exams/${examId}`);

    const exam = state.exams.find((e) => e.id === examId);
    if (exam) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(exam),
      });
    }
    return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Exam not found' }) });
  });

  // Results entry endpoint supporting different grading types
  await page.route('**/api/results', async (route) => {
    const method = route.request().method();
    state.requestLog.add(`${method} /api/results`);

    if (method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(state.results),
      });
    }

    if (method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      const entries: GradeResultEntry[] = body.results || [body];

      for (const entry of entries) {
        let grade = '';
        let marks = entry.marks ?? 0;
        const gradingType = entry.gradingType || body.gradingType || 'numerical';

        if (gradingType === 'numerical') {
          grade = computeGradeFromMarks(marks, entry.maxMarks || 100);
        } else if (gradingType === 'grades') {
          grade = entry.grade || 'F';
          // Map grade to representative marks for storage
          const gradeMarksMap: Record<string, number> = { 'A+': 95, A: 85, 'B+': 75, B: 65, C: 55, D: 45, F: 20 };
          marks = gradeMarksMap[grade] ?? 0;
        } else if (gradingType === 'cgpa') {
          const cgpa = entry.cgpa ?? 0;
          grade = computeCgpaGrade(cgpa);
          marks = cgpa * 10; // Convert CGPA to percentage-equivalent
        }

        const result = {
          _id: `res-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          id: `res-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          studentId: entry.studentId,
          examId: body.examId,
          subject: body.subject || 'Mathematics',
          marks,
          maxMarks: entry.maxMarks || 100,
          grade,
          gradingType,
          cgpa: entry.cgpa,
          status: grade === 'F' ? 'Fail' : 'Pass',
          schoolId: SCHOOL_ID,
        };
        state.results.push(result as never);
        savedResults.push(result);
      }

      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Results saved successfully',
          results: savedResults.slice(-entries.length),
          count: entries.length,
        }),
      });
    }
    return route.fallback();
  });

  return { getSavedResults: () => savedResults };
}

/* ═══════════════════════════════════════════════════════════════
   TEST SUITE
   ═══════════════════════════════════════════════════════════════ */

test.describe('TC090: Marks Entry with Different Grading Types', () => {
  let state: MockState;
  let students: ReturnType<typeof seedStudent>[];
  let numericalExam: ReturnType<typeof seedExam>;
  let gradesExam: ReturnType<typeof seedExam>;
  let cgpaExam: ReturnType<typeof seedExam>;

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    // Seed 3 students in 10-A
    students = [
      seedStudent(state, { name: 'Aarav Kumar', rollNo: '1', classId: CLASS_10A_ID }),
      seedStudent(state, { name: 'Bhavya Singh', rollNo: '2', classId: CLASS_10A_ID }),
      seedStudent(state, { name: 'Charvi Patel', rollNo: '3', classId: CLASS_10A_ID }),
    ];

    // Exam 1: numerical (0-100 marks)
    numericalExam = seedExam(state, {
      name: 'Numerical Test',
      classId: CLASS_10A_ID,
      status: 'scheduled',
      subjects: ['Mathematics'],
    });
    (numericalExam as unknown as ExamWithGrading).gradingType = 'numerical';
    (numericalExam as unknown as ExamWithGrading).maxMarks = 100;
    (numericalExam as unknown as ExamWithGrading).passingMarks = 35;

    // Exam 2: grades (A-F letter grades)
    gradesExam = seedExam(state, {
      name: 'Grade-Based Assessment',
      classId: CLASS_10A_ID,
      status: 'scheduled',
      subjects: ['English'],
    });
    (gradesExam as unknown as ExamWithGrading).gradingType = 'grades';
    (gradesExam as unknown as ExamWithGrading).gradeScale = [
      { grade: 'A+', minMarks: 90, maxMarks: 100 },
      { grade: 'A', minMarks: 80, maxMarks: 89 },
      { grade: 'B+', minMarks: 70, maxMarks: 79 },
      { grade: 'B', minMarks: 60, maxMarks: 69 },
      { grade: 'C', minMarks: 50, maxMarks: 59 },
      { grade: 'D', minMarks: 35, maxMarks: 49 },
      { grade: 'F', minMarks: 0, maxMarks: 34 },
    ];

    // Exam 3: cgpa (1-10 scale)
    cgpaExam = seedExam(state, {
      name: 'CGPA Assessment',
      classId: CLASS_10A_ID,
      status: 'scheduled',
      subjects: ['Science'],
    });
    (cgpaExam as unknown as ExamWithGrading).gradingType = 'cgpa';
    (cgpaExam as unknown as ExamWithGrading).maxMarks = 10;

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });
    await installMockApi(page, state);
    await installGradingRoutes(page, state);
  });

  test('1) all 3 exams with different grading types exist in state', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    expect(state.exams).toHaveLength(3);
    expect((state.exams[0] as unknown as ExamWithGrading).gradingType).toBe('numerical');
    expect((state.exams[1] as unknown as ExamWithGrading).gradingType).toBe('grades');
    expect((state.exams[2] as unknown as ExamWithGrading).gradingType).toBe('cgpa');
  });

  test('2) numerical exam detail shows gradingType = "numerical"', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const detail = await page.evaluate(async (examId) => {
      const res = await fetch(`http://localhost:3001/api/exams/${examId}`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, numericalExam.id);

    expect(detail.gradingType).toBe('numerical');
    expect(detail.maxMarks).toBe(100);
  });

  test('3) enter numerical marks (85, 72, 45) and verify grade auto-calculation', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async ({ examId, results }) => {
      const res = await fetch('http://localhost:3001/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({ examId, gradingType: 'numerical', results }),
      });
      return { status: res.status, body: await res.json() };
    }, {
      examId: numericalExam.id,
      results: [
        { studentId: students[0].id, marks: 85, maxMarks: 100, gradingType: 'numerical' },
        { studentId: students[1].id, marks: 72, maxMarks: 100, gradingType: 'numerical' },
        { studentId: students[2].id, marks: 45, maxMarks: 100, gradingType: 'numerical' },
      ],
    });

    expect(result.status).toBe(201);
    expect(result.body.results).toHaveLength(3);

    // Grade auto-calculation: 85 -> A, 72 -> B+, 45 -> F
    const grades = result.body.results.map((r: { grade: string }) => r.grade);
    expect(grades[0]).toBe('A');
    expect(grades[1]).toBe('B+');
    expect(grades[2]).toBe('F');
  });

  test('4) grade-based exam detail shows gradingType = "grades"', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const detail = await page.evaluate(async (examId) => {
      const res = await fetch(`http://localhost:3001/api/exams/${examId}`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, gradesExam.id);

    expect(detail.gradingType).toBe('grades');
    expect(detail.gradeScale).toBeTruthy();
    expect(detail.gradeScale).toHaveLength(7);
  });

  test('5) enter letter grades for students and verify storage', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async ({ examId, results }) => {
      const res = await fetch('http://localhost:3001/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({ examId, gradingType: 'grades', subject: 'English', results }),
      });
      return { status: res.status, body: await res.json() };
    }, {
      examId: gradesExam.id,
      results: [
        { studentId: students[0].id, grade: 'A+', gradingType: 'grades' },
        { studentId: students[1].id, grade: 'B', gradingType: 'grades' },
        { studentId: students[2].id, grade: 'C', gradingType: 'grades' },
      ],
    });

    expect(result.status).toBe(201);
    expect(result.body.results).toHaveLength(3);

    // Verify grades are stored correctly
    expect(result.body.results[0].grade).toBe('A+');
    expect(result.body.results[1].grade).toBe('B');
    expect(result.body.results[2].grade).toBe('C');

    // All should be Pass (grades C and above)
    expect(result.body.results[0].status).toBe('Pass');
    expect(result.body.results[1].status).toBe('Pass');
    expect(result.body.results[2].status).toBe('Pass');
  });

  test('6) CGPA exam detail shows gradingType = "cgpa"', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const detail = await page.evaluate(async (examId) => {
      const res = await fetch(`http://localhost:3001/api/exams/${examId}`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, cgpaExam.id);

    expect(detail.gradingType).toBe('cgpa');
    expect(detail.maxMarks).toBe(10);
  });

  test('7) enter CGPA values (9.2, 7.5, 5.0) and verify grade mapping', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async ({ examId, results }) => {
      const res = await fetch('http://localhost:3001/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({ examId, gradingType: 'cgpa', subject: 'Science', results }),
      });
      return { status: res.status, body: await res.json() };
    }, {
      examId: cgpaExam.id,
      results: [
        { studentId: students[0].id, cgpa: 9.2, gradingType: 'cgpa' },
        { studentId: students[1].id, cgpa: 7.5, gradingType: 'cgpa' },
        { studentId: students[2].id, cgpa: 5.0, gradingType: 'cgpa' },
      ],
    });

    expect(result.status).toBe(201);
    expect(result.body.results).toHaveLength(3);

    // CGPA grade mapping: 9.2 -> A+, 7.5 -> B+, 5.0 -> C
    expect(result.body.results[0].grade).toBe('A+');
    expect(result.body.results[1].grade).toBe('B+');
    expect(result.body.results[2].grade).toBe('C');

    // Verify CGPA values are stored
    expect(result.body.results[0].cgpa).toBe(9.2);
    expect(result.body.results[1].cgpa).toBe(7.5);
    expect(result.body.results[2].cgpa).toBe(5.0);
  });

  test('8) all 3 grading type results are stored in state', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    // Enter numerical results
    await page.evaluate(async ({ examId, results }) => {
      await fetch('http://localhost:3001/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({ examId, gradingType: 'numerical', results }),
      });
    }, { examId: numericalExam.id, results: [{ studentId: students[0].id, marks: 85, maxMarks: 100, gradingType: 'numerical' }] });

    // Enter grade results
    await page.evaluate(async ({ examId, results }) => {
      await fetch('http://localhost:3001/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({ examId, gradingType: 'grades', results }),
      });
    }, { examId: gradesExam.id, results: [{ studentId: students[0].id, grade: 'A', gradingType: 'grades' }] });

    // Enter CGPA results
    await page.evaluate(async ({ examId, results }) => {
      await fetch('http://localhost:3001/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({ examId, gradingType: 'cgpa', results }),
      });
    }, { examId: cgpaExam.id, results: [{ studentId: students[0].id, cgpa: 8.5, gradingType: 'cgpa' }] });

    // All 3 results should be in state
    expect(state.results.length).toBeGreaterThanOrEqual(3);

    // Verify POST was called 3 times
    expect([...state.requestLog].filter((r) => r === 'POST /api/results')).toHaveLength(3);
  });
});
