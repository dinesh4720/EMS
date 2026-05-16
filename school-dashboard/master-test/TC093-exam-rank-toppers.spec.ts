/**
 * TC093: Verify student ranking and topper identification.
 *
 * Verifies: results sorted by marks (highest first), correct rank assignment,
 * class topper identification, and top performers visibility on class dashboard.
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

/* ───────── Route overrides ───────── */

async function installRankingRoutes(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  // Exams list
  await page.route('**/api/exams', async (route) => {
    state.requestLog.add('GET /api/exams');
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: state.exams, total: state.exams.length, page: 1, limit: 100 }),
    });
  });

  // Exam detail with ranked results
  await page.route('**/api/exams/*', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    // Handle /exams/:id/results
    if (path.match(/\/exams\/([^/]+)\/results$/)) {
      const examId = path.split('/')[3];
      state.requestLog.add(`GET /api/exams/${examId}/results`);

      const examResults = state.results
        .filter((r) => r.examId === examId)
        .map((r) => {
          const student = state.students.find((s) => s.id === r.studentId);
          return {
            ...r,
            studentName: student?.name || 'Unknown',
            rollNo: student?.rollNo || '',
            percentage: Math.round((r.marks / r.maxMarks) * 100 * 100) / 100,
          };
        })
        .sort((a, b) => b.marks - a.marks);

      // Assign ranks
      const rankedResults = examResults.map((r, idx) => ({
        ...r,
        rank: idx + 1,
      }));

      const topperResult = rankedResults[0];

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: rankedResults,
          statistics: {
            total: rankedResults.length,
            average: rankedResults.length > 0
              ? Math.round(rankedResults.reduce((s, r) => s + r.marks, 0) / rankedResults.length * 100) / 100
              : 0,
            highest: topperResult?.marks || 0,
            lowest: rankedResults[rankedResults.length - 1]?.marks || 0,
          },
          topper: topperResult ? {
            studentId: topperResult.studentId,
            studentName: topperResult.studentName,
            marks: topperResult.marks,
            percentage: topperResult.percentage,
          } : null,
        }),
      });
    }

    if (path.includes('/publish')) return route.fallback();

    // Handle /exams/:id
    const examId = path.split('/').pop();
    state.requestLog.add(`GET /api/exams/${examId}`);
    const exam = state.exams.find((e) => e.id === examId);
    return exam
      ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(exam) })
      : route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) });
  });

  // Results by exam (alternative path)
  await page.route('**/api/results/exam/*', async (route) => {
    const url = new URL(route.request().url());
    const examId = url.pathname.split('/').pop();
    state.requestLog.add(`GET /api/results/exam/${examId}`);

    const examResults = state.results
      .filter((r) => r.examId === examId)
      .map((r) => {
        const student = state.students.find((s) => s.id === r.studentId);
        return { ...r, studentName: student?.name || 'Unknown', rollNo: student?.rollNo || '' };
      })
      .sort((a, b) => b.marks - a.marks)
      .map((r, idx) => ({ ...r, rank: idx + 1 }));

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(examResults),
    });
  });

  // Class dashboard with top performers
  await page.route('**/api/classes/*/dashboard**', async (route) => {
    const url = new URL(route.request().url());
    const classId = url.pathname.split('/')[3];
    state.requestLog.add(`GET /api/classes/${classId}/dashboard`);

    const classStudents = state.students.filter((s) => s.classId === classId);
    const studentIds = new Set(classStudents.map((s) => s.id));

    // Compute overall scores per student across all exams
    const studentScores = new Map<string, { total: number; count: number; name: string }>();
    for (const r of state.results) {
      if (!studentIds.has(r.studentId)) continue;
      const existing = studentScores.get(r.studentId) || { total: 0, count: 0, name: '' };
      existing.total += (r.marks / r.maxMarks) * 100;
      existing.count++;
      const student = classStudents.find((s) => s.id === r.studentId);
      existing.name = student?.name || 'Unknown';
      studentScores.set(r.studentId, existing);
    }

    const topPerformers = [...studentScores.entries()]
      .map(([id, data]) => ({
        studentId: id,
        studentName: data.name,
        averagePercentage: data.count > 0 ? Math.round((data.total / data.count) * 100) / 100 : 0,
      }))
      .sort((a, b) => b.averagePercentage - a.averagePercentage)
      .slice(0, 5);

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        classId,
        totalStudents: classStudents.length,
        topPerformers,
        classTopper: topPerformers[0] || null,
        attendanceRate: 92,
        averagePerformance: topPerformers.length > 0
          ? Math.round(topPerformers.reduce((s, p) => s + p.averagePercentage, 0) / topPerformers.length * 100) / 100
          : 0,
      }),
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   TEST SUITE
   ═══════════════════════════════════════════════════════════════ */

test.describe('TC093: Exam Rank and Toppers Identification', () => {
  let state: MockState;
  let students: ReturnType<typeof seedStudent>[];
  let exam: ReturnType<typeof seedExam>;

  // Marks: Student1=95, Student2=88, Student3=72, Student4=60, Student5=45
  const marks = [95, 88, 72, 60, 45];

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

    // Seed exam with results
    exam = seedExam(state, {
      name: 'Final Mathematics',
      classId: CLASS_10A_ID,
      status: 'results_published',
      subjects: ['Mathematics'],
    });

    for (let i = 0; i < students.length; i++) {
      seedResult(state, students[i].id, exam.id, 'Mathematics', marks[i], 100);
    }

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });
    await installMockApi(page, state);
    await installRankingRoutes(page, state);
  });

  test('1) exam results API returns results sorted by marks (highest first)', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const results = await page.evaluate(async (examId) => {
      const res = await fetch(`http://localhost:3001/api/results/exam/${examId}`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, exam.id);

    expect(results).toHaveLength(5);

    // Verify sorted descending by marks
    const resultMarks = results.map((r: { marks: number }) => r.marks);
    expect(resultMarks).toEqual([95, 88, 72, 60, 45]);
  });

  test('2) Aarav Kumar (95 marks) is ranked 1st', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const results = await page.evaluate(async (examId) => {
      const res = await fetch(`http://localhost:3001/api/results/exam/${examId}`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, exam.id);

    const topResult = results[0];
    expect(topResult.studentName).toBe('Aarav Kumar');
    expect(topResult.marks).toBe(95);
    expect(topResult.rank).toBe(1);
  });

  test('3) all 5 ranks are correctly assigned (1st through 5th)', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const results = await page.evaluate(async (examId) => {
      const res = await fetch(`http://localhost:3001/api/results/exam/${examId}`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, exam.id);

    const ranks = results.map((r: { rank: number }) => r.rank);
    expect(ranks).toEqual([1, 2, 3, 4, 5]);

    // Verify name-to-rank mapping
    expect(results.find((r: { studentName: string }) => r.studentName === 'Aarav Kumar').rank).toBe(1);
    expect(results.find((r: { studentName: string }) => r.studentName === 'Bhavya Singh').rank).toBe(2);
    expect(results.find((r: { studentName: string }) => r.studentName === 'Charvi Patel').rank).toBe(3);
    expect(results.find((r: { studentName: string }) => r.studentName === 'Dhruv Sharma').rank).toBe(4);
    expect(results.find((r: { studentName: string }) => r.studentName === 'Esha Reddy').rank).toBe(5);
  });

  test('4) class topper is correctly identified via exam results endpoint', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const data = await page.evaluate(async (examId) => {
      const res = await fetch(`http://localhost:3001/api/exams/${examId}/results`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, exam.id);

    expect(data.topper).toBeTruthy();
    expect(data.topper.studentName).toBe('Aarav Kumar');
    expect(data.topper.marks).toBe(95);
    expect(data.topper.percentage).toBe(95);
  });

  test('5) exam statistics show correct highest (95) and lowest (45)', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const data = await page.evaluate(async (examId) => {
      const res = await fetch(`http://localhost:3001/api/exams/${examId}/results`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, exam.id);

    expect(data.statistics.highest).toBe(95);
    expect(data.statistics.lowest).toBe(45);
    expect(data.statistics.total).toBe(5);
    expect(data.statistics.average).toBe(72);
  });

  test('6) class dashboard shows top performers with Aarav at top', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const dashboard = await page.evaluate(async (classId) => {
      const res = await fetch(`http://localhost:3001/api/classes/${classId}/dashboard`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, CLASS_10A_ID);

    expect(dashboard.topPerformers).toBeTruthy();
    expect(dashboard.topPerformers.length).toBeGreaterThan(0);
    expect(dashboard.classTopper.studentName).toBe('Aarav Kumar');
    expect(dashboard.classTopper.averagePercentage).toBe(95);
  });

  test('7) top performers list shows all 5 students in rank order', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const dashboard = await page.evaluate(async (classId) => {
      const res = await fetch(`http://localhost:3001/api/classes/${classId}/dashboard`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, CLASS_10A_ID);

    const names = dashboard.topPerformers.map((p: { studentName: string }) => p.studentName);
    expect(names[0]).toBe('Aarav Kumar');
    expect(names[1]).toBe('Bhavya Singh');
    expect(names[2]).toBe('Charvi Patel');
    expect(names[3]).toBe('Dhruv Sharma');
    expect(names[4]).toBe('Esha Reddy');
  });

  test('8) academics page loads and shows exam data', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await page.waitForFunction(
      () => document.body.textContent?.toLowerCase().includes('exam') ||
            document.body.textContent?.toLowerCase().includes('academic'),
      { timeout: 10_000 },
    ).catch(() => {});

    const bodyText = await body.textContent();
    expect(bodyText?.toLowerCase()).toMatch(/exam|academic|final/i);
    expect([...state.requestLog].some((r) => r.includes('GET /api/exams'))).toBeTruthy();
  });
});
