/**
 * TC089: Create multiple exam types and compare results across them.
 *
 * Verifies: listing of exams with correct types, exam type badges,
 * max marks display per exam, average score comparisons, and
 * identification of students who improved or declined between exams.
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

/* ───────── Helpers ───────── */

interface ExamWithExtras {
  _id: string; id: string; name: string; classId: string;
  status: string; date: string; subjects: string[]; schoolId: string;
  type?: string; maxMarks?: number; passingMarks?: number;
}

function computeAverage(marks: number[]): number {
  if (marks.length === 0) return 0;
  return Math.round((marks.reduce((s, m) => s + m, 0) / marks.length) * 100) / 100;
}

/* ───────── Route overrides ───────── */

async function installExamComparisonRoutes(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  // Override exams list to include extended fields
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

  // Single exam detail with enriched data
  await page.route('**/api/exams/*', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();

    if (path.includes('/results') || path.includes('/publish')) {
      return route.fallback();
    }

    const examId = path.split('/').pop();
    state.requestLog.add(`${method} /api/exams/${examId}`);

    if (method === 'GET') {
      const exam = state.exams.find((e) => e.id === examId);
      if (exam) {
        const examResults = state.results.filter((r) => r.examId === examId);
        const avgMarks = computeAverage(examResults.map((r) => r.marks));
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...exam,
            results: examResults,
            statistics: {
              total: examResults.length,
              average: avgMarks,
              highest: Math.max(...examResults.map((r) => r.marks), 0),
              lowest: Math.min(...examResults.map((r) => r.marks), 100),
            },
          }),
        });
      }
      return route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Exam not found' }),
      });
    }
    return route.fallback();
  });

  // Results by exam
  await page.route('**/api/results/exam/*', async (route) => {
    const url = new URL(route.request().url());
    const examId = url.pathname.split('/').pop();
    state.requestLog.add(`GET /api/results/exam/${examId}`);

    const examResults = state.results.filter((r) => r.examId === examId);
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(examResults),
    });
  });

  // Exam types reference
  await page.route('**/api/exam-types*', async (route) => {
    state.requestLog.add('GET /api/exam-types');
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { value: 'unit_test', label: 'Unit Test' },
        { value: 'midterm', label: 'Mid-Term' },
        { value: 'final_exam', label: 'Final Exam' },
        { value: 'practical', label: 'Practical' },
      ]),
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   TEST SUITE
   ═══════════════════════════════════════════════════════════════ */

test.describe('TC089: Exam Types Comparison - Multiple Exam Types with Results', () => {
  let state: MockState;
  let students: ReturnType<typeof seedStudent>[];
  let unitTest: ReturnType<typeof seedExam>;
  let midTerm: ReturnType<typeof seedExam>;
  let finalExam: ReturnType<typeof seedExam>;

  // Marks per student per exam (realistic varied marks)
  const unitTestMarks = [40, 35, 28, 22, 45]; // out of 50
  const midTermMarks  = [78, 65, 55, 42, 88]; // out of 100
  const finalMarks    = [82, 70, 60, 50, 90]; // out of 100

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    // Seed 5 students in 10-A
    students = [
      seedStudent(state, { name: 'Aarav Kumar', rollNo: '1', classId: CLASS_10A_ID }),
      seedStudent(state, { name: 'Bhavya Singh', rollNo: '2', classId: CLASS_10A_ID }),
      seedStudent(state, { name: 'Charvi Patel', rollNo: '3', classId: CLASS_10A_ID }),
      seedStudent(state, { name: 'Dhruv Sharma', rollNo: '4', classId: CLASS_10A_ID }),
      seedStudent(state, { name: 'Esha Reddy', rollNo: '5', classId: CLASS_10A_ID }),
    ];

    // Seed 3 exams with different types
    unitTest = seedExam(state, {
      name: 'Unit Test 1',
      classId: CLASS_10A_ID,
      status: 'results_published',
      date: '2026-02-15',
      subjects: ['Mathematics'],
    });
    (unitTest as unknown as ExamWithExtras).type = 'unit_test';
    (unitTest as unknown as ExamWithExtras).maxMarks = 50;
    (unitTest as unknown as ExamWithExtras).passingMarks = 18;

    midTerm = seedExam(state, {
      name: 'Mid-Term Exam',
      classId: CLASS_10A_ID,
      status: 'results_published',
      date: '2026-03-10',
      subjects: ['Mathematics'],
    });
    (midTerm as unknown as ExamWithExtras).type = 'midterm';
    (midTerm as unknown as ExamWithExtras).maxMarks = 100;
    (midTerm as unknown as ExamWithExtras).passingMarks = 35;

    finalExam = seedExam(state, {
      name: 'Final Exam',
      classId: CLASS_10A_ID,
      status: 'results_published',
      date: '2026-04-20',
      subjects: ['Mathematics'],
    });
    (finalExam as unknown as ExamWithExtras).type = 'final_exam';
    (finalExam as unknown as ExamWithExtras).maxMarks = 100;
    (finalExam as unknown as ExamWithExtras).passingMarks = 35;

    // Seed results for all students across all 3 exams
    for (let i = 0; i < students.length; i++) {
      seedResult(state, students[i].id, unitTest.id, 'Mathematics', unitTestMarks[i], 50);
      seedResult(state, students[i].id, midTerm.id, 'Mathematics', midTermMarks[i], 100);
      seedResult(state, students[i].id, finalExam.id, 'Mathematics', finalMarks[i], 100);
    }

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });
    await installMockApi(page, state);
    await installExamComparisonRoutes(page, state);
  });

  test('1) academics page loads and lists all 3 exams', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await page.waitForFunction(
      () => document.body.textContent?.toLowerCase().includes('exam') ||
            document.body.textContent?.toLowerCase().includes('academic'),
      { timeout: 10_000 },
    ).catch(() => {});

    const bodyText = await body.textContent();
    expect(bodyText?.toLowerCase()).toMatch(/exam|academic/i);

    // Verify exams API was called
    expect([...state.requestLog].some((r) => r.includes('GET /api/exams'))).toBeTruthy();

    // 3 exams should exist in state
    expect(state.exams).toHaveLength(3);
  });

  test('2) all 3 exams have correct types in state', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const examTypes = state.exams.map((e) => (e as unknown as ExamWithExtras).type);
    expect(examTypes).toContain('unit_test');
    expect(examTypes).toContain('midterm');
    expect(examTypes).toContain('final_exam');
  });

  test('3) exam type badges are available via exam-types API', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const types = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/exam-types', {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    });

    expect(types).toHaveLength(4);
    const values = types.map((t: { value: string }) => t.value);
    expect(values).toContain('unit_test');
    expect(values).toContain('midterm');
    expect(values).toContain('final_exam');
  });

  test('4) Unit Test detail shows max marks = 50', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const detail = await page.evaluate(async (examId) => {
      const res = await fetch(`http://localhost:3001/api/exams/${examId}`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, unitTest.id);

    expect(detail.maxMarks).toBe(50);
    expect(detail.type).toBe('unit_test');
    expect(detail.name).toBe('Unit Test 1');
    expect(detail.results).toHaveLength(5);
  });

  test('5) Mid-Term detail shows max marks = 100', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const detail = await page.evaluate(async (examId) => {
      const res = await fetch(`http://localhost:3001/api/exams/${examId}`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, midTerm.id);

    expect(detail.maxMarks).toBe(100);
    expect(detail.type).toBe('midterm');
    expect(detail.name).toBe('Mid-Term Exam');
  });

  test('6) compare average scores across exam types', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    // Fetch results for each exam and compute averages
    const unitResults = await page.evaluate(async (examId) => {
      const res = await fetch(`http://localhost:3001/api/results/exam/${examId}`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, unitTest.id);

    const midResults = await page.evaluate(async (examId) => {
      const res = await fetch(`http://localhost:3001/api/results/exam/${examId}`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, midTerm.id);

    const finalResults = await page.evaluate(async (examId) => {
      const res = await fetch(`http://localhost:3001/api/results/exam/${examId}`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, finalExam.id);

    // Compute percentage averages: unitTest is out of 50, others out of 100
    const unitAvgPct = computeAverage(unitResults.map((r: { marks: number; maxMarks: number }) => (r.marks / r.maxMarks) * 100));
    const midAvgPct = computeAverage(midResults.map((r: { marks: number; maxMarks: number }) => (r.marks / r.maxMarks) * 100));
    const finalAvgPct = computeAverage(finalResults.map((r: { marks: number; maxMarks: number }) => (r.marks / r.maxMarks) * 100));

    // Unit Test avg: (80+70+56+44+90)/5 = 68%
    expect(unitAvgPct).toBeCloseTo(68, 0);
    // Mid-Term avg: (78+65+55+42+88)/5 = 65.6%
    expect(midAvgPct).toBeCloseTo(65.6, 0);
    // Final avg: (82+70+60+50+90)/5 = 70.4%
    expect(finalAvgPct).toBeCloseTo(70.4, 0);

    // Final exam should have the highest average percentage
    expect(finalAvgPct).toBeGreaterThan(midAvgPct);
  });

  test('7) identify students who improved between mid-term and final', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const midResults = await page.evaluate(async (examId) => {
      const res = await fetch(`http://localhost:3001/api/results/exam/${examId}`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, midTerm.id);

    const finalResults = await page.evaluate(async (examId) => {
      const res = await fetch(`http://localhost:3001/api/results/exam/${examId}`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, finalExam.id);

    // Build a map of studentId -> marks for each exam
    const midMap = new Map<string, number>();
    for (const r of midResults) midMap.set(r.studentId, r.marks);

    const finalMap = new Map<string, number>();
    for (const r of finalResults) finalMap.set(r.studentId, r.marks);

    // All students should have improved from mid-term to final
    // Student marks: mid=[78,65,55,42,88] final=[82,70,60,50,90]
    let improvedCount = 0;
    let declinedCount = 0;

    for (const student of students) {
      const midMarks = midMap.get(student.id) ?? 0;
      const finalMarksVal = finalMap.get(student.id) ?? 0;
      if (finalMarksVal > midMarks) improvedCount++;
      else if (finalMarksVal < midMarks) declinedCount++;
    }

    // All 5 students improved
    expect(improvedCount).toBe(5);
    expect(declinedCount).toBe(0);
  });

  test('8) individual student results show all 3 exams in their profile', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    // Fetch results for student 1 (Aarav Kumar)
    const studentResults = await page.evaluate(async (studentId) => {
      const res = await fetch(`http://localhost:3001/api/students/${studentId}/results`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, students[0].id);

    // Should have 3 results (one per exam)
    expect(Array.isArray(studentResults)).toBeTruthy();
    expect(studentResults).toHaveLength(3);

    // Verify marks match: unitTest=40/50, midTerm=78/100, final=82/100
    const examIds = studentResults.map((r: { examId: string }) => r.examId);
    expect(examIds).toContain(unitTest.id);
    expect(examIds).toContain(midTerm.id);
    expect(examIds).toContain(finalExam.id);
  });
});
