/**
 * TC092: Analyze exam performance by subject.
 *
 * Verifies: subject-wise breakdown, highest/lowest average identification,
 * subject comparison data, and individual student multi-subject results.
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

function computeSubjectStats(results: Array<{ marks: number; maxMarks: number }>) {
  if (results.length === 0) return { average: 0, highest: 0, lowest: 0, passRate: 0 };
  const marks = results.map((r) => r.marks);
  const avg = marks.reduce((s, m) => s + m, 0) / marks.length;
  const passed = results.filter((r) => (r.marks / r.maxMarks) * 100 >= 35).length;
  return {
    average: Math.round(avg * 100) / 100,
    highest: Math.max(...marks),
    lowest: Math.min(...marks),
    passRate: Math.round((passed / results.length) * 100),
  };
}

/* ───────── Route overrides ───────── */

async function installSubjectAnalysisRoutes(
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

  // Results by exam
  await page.route('**/api/results/exam/*', async (route) => {
    const url = new URL(route.request().url());
    const examId = url.pathname.split('/').pop();
    state.requestLog.add(`GET /api/results/exam/${examId}`);

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(state.results.filter((r) => r.examId === examId)),
    });
  });

  // Performance dashboard / subject-wise analysis endpoint
  await page.route('**/api/analytics/performance**', async (route) => {
    state.requestLog.add('GET /api/analytics/performance');

    // Compute subject-wise stats from all results
    const subjectMap = new Map<string, Array<{ marks: number; maxMarks: number }>>();
    for (const r of state.results) {
      const list = subjectMap.get(r.subject) || [];
      list.push({ marks: r.marks, maxMarks: r.maxMarks });
      subjectMap.set(r.subject, list);
    }

    const subjectAnalysis = [];
    for (const [subject, results] of subjectMap.entries()) {
      subjectAnalysis.push({
        subject,
        ...computeSubjectStats(results),
        totalStudents: results.length,
      });
    }

    // Sort by average (highest first)
    subjectAnalysis.sort((a, b) => b.average - a.average);

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        subjectAnalysis,
        classAverage: subjectAnalysis.length > 0
          ? Math.round(subjectAnalysis.reduce((s, sa) => s + sa.average, 0) / subjectAnalysis.length * 100) / 100
          : 0,
        topSubject: subjectAnalysis[0]?.subject || null,
        weakestSubject: subjectAnalysis[subjectAnalysis.length - 1]?.subject || null,
      }),
    });
  });

  // Class performance endpoint (alternative path)
  await page.route('**/api/classes/*/performance**', async (route) => {
    const url = new URL(route.request().url());
    const classId = url.pathname.split('/')[3];
    state.requestLog.add(`GET /api/classes/${classId}/performance`);

    const classStudents = state.students.filter((s) => s.classId === classId);
    const studentIds = new Set(classStudents.map((s) => s.id));
    const classResults = state.results.filter((r) => studentIds.has(r.studentId));

    const subjectMap = new Map<string, Array<{ marks: number; maxMarks: number }>>();
    for (const r of classResults) {
      const list = subjectMap.get(r.subject) || [];
      list.push({ marks: r.marks, maxMarks: r.maxMarks });
      subjectMap.set(r.subject, list);
    }

    const subjects = [];
    for (const [subject, results] of subjectMap.entries()) {
      subjects.push({ subject, ...computeSubjectStats(results) });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ classId, subjects, totalStudents: classStudents.length }),
    });
  });

  // Exam detail
  await page.route('**/api/exams/*', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (path.includes('/results') || path.includes('/publish')) return route.fallback();

    const examId = path.split('/').pop();
    state.requestLog.add(`GET /api/exams/${examId}`);
    const exam = state.exams.find((e) => e.id === examId);
    return exam
      ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(exam) })
      : route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) });
  });
}

/* ══════��════════════════════════════════���═══════════════════════
   TEST SUITE
   ════════════════════════════���══════════════════════════════════ */

test.describe('TC092: Exam Subject-Wise Analysis', () => {
  let state: MockState;
  let students: ReturnType<typeof seedStudent>[];
  let mathExam: ReturnType<typeof seedExam>;
  let scienceExam: ReturnType<typeof seedExam>;
  let englishExam: ReturnType<typeof seedExam>;

  // Marks designed so: Math avg=80, Science avg=65, English avg=72
  const mathMarks    = [90, 85, 78, 72, 75]; // avg = 80
  const scienceMarks = [70, 68, 62, 58, 67]; // avg = 65
  const englishMarks = [80, 75, 70, 65, 70]; // avg = 72

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

    // Seed 3 exams for different subjects
    mathExam = seedExam(state, {
      name: 'Mathematics Mid-Term',
      classId: CLASS_10A_ID,
      status: 'results_published',
      subjects: ['Mathematics'],
    });

    scienceExam = seedExam(state, {
      name: 'Science Mid-Term',
      classId: CLASS_10A_ID,
      status: 'results_published',
      subjects: ['Science'],
    });

    englishExam = seedExam(state, {
      name: 'English Mid-Term',
      classId: CLASS_10A_ID,
      status: 'results_published',
      subjects: ['English'],
    });

    // Seed results with designed averages
    for (let i = 0; i < students.length; i++) {
      seedResult(state, students[i].id, mathExam.id, 'Mathematics', mathMarks[i], 100);
      seedResult(state, students[i].id, scienceExam.id, 'Science', scienceMarks[i], 100);
      seedResult(state, students[i].id, englishExam.id, 'English', englishMarks[i], 100);
    }

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });
    await installMockApi(page, state);
    await installSubjectAnalysisRoutes(page, state);
  });

  test('1) all 15 results (5 students x 3 subjects) are seeded correctly', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    expect(state.results).toHaveLength(15);
    expect(state.exams).toHaveLength(3);
    expect(state.students).toHaveLength(5);
  });

  test('2) subject-wise performance API returns breakdown for all 3 subjects', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const performance = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/analytics/performance', {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    });

    expect(performance.subjectAnalysis).toHaveLength(3);
    const subjects = performance.subjectAnalysis.map((s: { subject: string }) => s.subject);
    expect(subjects).toContain('Mathematics');
    expect(subjects).toContain('Science');
    expect(subjects).toContain('English');
  });

  test('3) Mathematics shows highest average (80)', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const performance = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/analytics/performance', {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    });

    expect(performance.topSubject).toBe('Mathematics');
    const mathStats = performance.subjectAnalysis.find((s: { subject: string }) => s.subject === 'Mathematics');
    expect(mathStats.average).toBe(80);
    expect(mathStats.highest).toBe(90);
    expect(mathStats.lowest).toBe(72);
    expect(mathStats.passRate).toBe(100);
  });

  test('4) Science shows lowest average (65)', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const performance = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/analytics/performance', {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    });

    expect(performance.weakestSubject).toBe('Science');
    const scienceStats = performance.subjectAnalysis.find((s: { subject: string }) => s.subject === 'Science');
    expect(scienceStats.average).toBe(65);
    expect(scienceStats.highest).toBe(70);
    expect(scienceStats.lowest).toBe(58);
  });

  test('5) English average is 72 (middle subject)', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const performance = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/analytics/performance', {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    });

    const engStats = performance.subjectAnalysis.find((s: { subject: string }) => s.subject === 'English');
    expect(engStats.average).toBe(72);
    expect(engStats.highest).toBe(80);
    expect(engStats.lowest).toBe(65);
  });

  test('6) subject comparison is sorted by average (highest first)', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const performance = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/analytics/performance', {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    });

    const averages = performance.subjectAnalysis.map((s: { average: number }) => s.average);
    // Should be sorted descending: Math(80) > English(72) > Science(65)
    expect(averages[0]).toBe(80);
    expect(averages[1]).toBe(72);
    expect(averages[2]).toBe(65);
  });

  test('7) class performance endpoint returns subject-wise data for class 10-A', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const classPerf = await page.evaluate(async (classId) => {
      const res = await fetch(`http://localhost:3001/api/classes/${classId}/performance`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, CLASS_10A_ID);

    expect(classPerf.classId).toBe(CLASS_10A_ID);
    expect(classPerf.totalStudents).toBe(5);
    expect(classPerf.subjects).toHaveLength(3);
  });

  test('8) individual student shows all 3 subjects in results', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    // Fetch results for student 1 (Aarav Kumar)
    const studentResults = await page.evaluate(async (studentId) => {
      const res = await fetch(`http://localhost:3001/api/students/${studentId}/results`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, students[0].id);

    expect(Array.isArray(studentResults)).toBeTruthy();
    expect(studentResults).toHaveLength(3);

    const subjects = studentResults.map((r: { subject: string }) => r.subject);
    expect(subjects).toContain('Mathematics');
    expect(subjects).toContain('Science');
    expect(subjects).toContain('English');

    // Verify Aarav's marks: Math=90, Science=70, English=80
    const mathResult = studentResults.find((r: { subject: string }) => r.subject === 'Mathematics');
    expect(mathResult.marks).toBe(90);

    const sciResult = studentResults.find((r: { subject: string }) => r.subject === 'Science');
    expect(sciResult.marks).toBe(70);

    const engResult = studentResults.find((r: { subject: string }) => r.subject === 'English');
    expect(engResult.marks).toBe(80);
  });
});
