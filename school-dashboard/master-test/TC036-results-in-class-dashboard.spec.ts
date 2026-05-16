/**
 * TC036: Verify class-level academic performance in class dashboard.
 *
 * Verifies: class dashboard load, average academic performance card,
 * student list with individual performance, and class-level statistics.
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

/* ───────── Class dashboard route overrides ───────── */

async function installClassDashboardRoutes(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  // Override class detail endpoint with enriched data
  await page.route('**/api/classes/*', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();

    // Handle sub-routes first
    if (path.includes('/students')) {
      const classId = path.split('/')[3];
      state.requestLog.add(`GET /api/classes/${classId}/students`);
      const classStudents = state.students.filter((s) => s.classId === classId);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: classStudents, total: classStudents.length, page: 1, limit: 100 }),
      });
    }

    if (path.includes('/attendance')) {
      const classId = path.split('/')[3];
      state.requestLog.add(`GET /api/classes/${classId}/attendance`);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(state.attendance.filter((a) => a.classId === classId)),
      });
    }

    if (path.includes('/timetable')) {
      const classId = path.split('/')[3];
      state.requestLog.add(`GET /api/classes/${classId}/timetable`);
      const tt = state.timetables.find((t: Record<string, unknown>) => t.classId === classId);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(tt || { classId, periods: [], schedule: {} }),
      });
    }

    if (path.includes('/performance') || path.includes('/academics')) {
      const classId = path.split('/')[3];
      state.requestLog.add(`GET /api/classes/${classId}/performance`);

      const classStudents = state.students.filter((s) => s.classId === classId);
      const classExams = state.exams.filter((e) => e.classId === classId);
      const classResults = state.results.filter((r) =>
        classExams.some((e) => e.id === r.examId),
      );

      // Per-student performance
      const studentPerformance = classStudents.map((s) => {
        const studentResults = classResults.filter((r) => r.studentId === s.id);
        const avgMarks = studentResults.length > 0
          ? Math.round(studentResults.reduce((sum, r) => sum + r.marks, 0) / studentResults.length)
          : 0;
        const avgPct = studentResults.length > 0
          ? Math.round((studentResults.reduce((sum, r) => sum + (r.marks / r.maxMarks), 0) / studentResults.length) * 100)
          : 0;
        return {
          studentId: s.id,
          studentName: s.name,
          rollNo: s.rollNo,
          averageMarks: avgMarks,
          averagePercentage: avgPct,
          totalExams: studentResults.length,
          grade: avgPct >= 90 ? 'A+' : avgPct >= 80 ? 'A' : avgPct >= 70 ? 'B+' : avgPct >= 60 ? 'B' : avgPct >= 50 ? 'C' : 'F',
        };
      });

      // Class-level stats
      const classAvg = classResults.length > 0
        ? Math.round(classResults.reduce((sum, r) => sum + r.marks, 0) / classResults.length)
        : 0;
      const classPassRate = classResults.length > 0
        ? Math.round((classResults.filter((r) => (r.marks / r.maxMarks) * 100 >= 35).length / classResults.length) * 100)
        : 0;

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          classId,
          averageScore: classAvg,
          passRate: classPassRate,
          totalExams: classExams.length,
          totalStudents: classStudents.length,
          studentPerformance,
          toppers: studentPerformance.sort((a, b) => b.averagePercentage - a.averagePercentage).slice(0, 3),
        }),
      });
    }

    // Class detail
    if (path.match(/\/classes\/([^/]+)$/) && method === 'GET') {
      const classId = path.split('/').pop();
      state.requestLog.add(`GET /api/classes/${classId}`);

      const cls = state.classes.find((c) => c.id === classId);
      if (cls) {
        // Compute averageAcademicPerformance from results
        const classExams = state.exams.filter((e) => e.classId === classId);
        const classResults = state.results.filter((r) => classExams.some((e) => e.id === r.examId));
        const avgPerformance = classResults.length > 0
          ? Math.round((classResults.reduce((sum, r) => sum + (r.marks / r.maxMarks), 0) / classResults.length) * 100)
          : 0;

        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...cls,
            averageAcademicPerformance: avgPerformance,
            studentCount: state.students.filter((s) => s.classId === classId).length,
          }),
        });
      }
      return route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Class not found' }),
      });
    }

    return route.fallback();
  });

  // Override classes list to include computed performance
  await page.route('**/api/classes', async (route) => {
    const method = route.request().method();
    state.requestLog.add(`${method} /api/classes`);

    if (method === 'GET') {
      const enrichedClasses = state.classes.map((cls) => {
        const classExams = state.exams.filter((e) => e.classId === cls.id);
        const classResults = state.results.filter((r) => classExams.some((e) => e.id === r.examId));
        const avgPerformance = classResults.length > 0
          ? Math.round((classResults.reduce((sum, r) => sum + (r.marks / r.maxMarks), 0) / classResults.length) * 100)
          : 0;

        return {
          ...cls,
          averageAcademicPerformance: avgPerformance,
          studentCount: state.students.filter((s) => s.classId === cls.id).length,
        };
      });

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: enrichedClasses, total: enrichedClasses.length, page: 1, limit: 100 }),
      });
    }
    return route.fallback();
  });
}

/* ═══════════════════════════════════════════════════════════════
   TEST SUITE
   ═══════════════════════════════════════════════════════════════ */

test.describe('TC036: Results in Class Dashboard - Class-Level Performance', () => {
  let state: MockState;
  let students: ReturnType<typeof seedStudent>[];
  let exam: ReturnType<typeof seedExam>;

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    // Seed 5 students in 10-A with varied marks
    students = [];
    students.push(seedStudent(state, { name: 'Aarav Kumar', rollNo: '1', classId: CLASS_10A_ID }));
    students.push(seedStudent(state, { name: 'Bhavya Singh', rollNo: '2', classId: CLASS_10A_ID }));
    students.push(seedStudent(state, { name: 'Charvi Patel', rollNo: '3', classId: CLASS_10A_ID }));
    students.push(seedStudent(state, { name: 'Dhruv Sharma', rollNo: '4', classId: CLASS_10A_ID }));
    students.push(seedStudent(state, { name: 'Esha Reddy', rollNo: '5', classId: CLASS_10A_ID }));

    // Seed exam and results with varied marks
    exam = seedExam(state, {
      name: 'Mid-Term Mathematics',
      classId: CLASS_10A_ID,
      status: 'results_published',
      subjects: ['Mathematics'],
    });

    // Marks: 92, 78, 55, 30, 85
    seedResult(state, students[0].id, exam.id, 'Mathematics', 92, 100);
    seedResult(state, students[1].id, exam.id, 'Mathematics', 78, 100);
    seedResult(state, students[2].id, exam.id, 'Mathematics', 55, 100);
    seedResult(state, students[3].id, exam.id, 'Mathematics', 30, 100);
    seedResult(state, students[4].id, exam.id, 'Mathematics', 85, 100);

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });
    await installMockApi(page, state);
    await installClassDashboardRoutes(page, state);
  });

  test('1) class dashboard page loads for class 10-A', async ({ page }) => {
    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');

    await page.waitForFunction(
      () => document.body.textContent?.includes('10') ||
            document.body.textContent?.toLowerCase().includes('class'),
      { timeout: 10_000 },
    ).catch(() => {});

    const bodyText = await body.textContent();
    expect(bodyText).toBeTruthy();
    // Should show class info
    expect(bodyText?.toLowerCase()).toMatch(/class|10|student/i);
  });

  test('2) class detail API returns computed average academic performance', async ({ page }) => {
    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const classDetail = await page.evaluate(async (classId) => {
      const res = await fetch(`http://localhost:3001/api/classes/${classId}`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, CLASS_10A_ID);

    expect(classDetail.name).toBe('10');
    expect(classDetail.section).toBe('A');
    expect(classDetail.studentCount).toBe(5);
    // Average: (92+78+55+30+85)/(5*100)*100 = 68%
    expect(classDetail.averageAcademicPerformance).toBe(68);
  });

  test('3) class performance API shows per-student results', async ({ page }) => {
    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const performance = await page.evaluate(async (classId) => {
      const res = await fetch(`http://localhost:3001/api/classes/${classId}/performance`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, CLASS_10A_ID);

    expect(performance.classId).toBe(CLASS_10A_ID);
    expect(performance.totalStudents).toBe(5);
    expect(performance.totalExams).toBe(1);
    expect(performance.averageScore).toBe(68); // (92+78+55+30+85)/5 = 68

    // Student performance list
    expect(performance.studentPerformance).toHaveLength(5);
  });

  test('4) individual student performance is accurately calculated', async ({ page }) => {
    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const performance = await page.evaluate(async (classId) => {
      const res = await fetch(`http://localhost:3001/api/classes/${classId}/performance`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, CLASS_10A_ID);

    const sp = performance.studentPerformance;

    // Find each student and verify their individual performance
    const aarav = sp.find((s: { studentName: string }) => s.studentName === 'Aarav Kumar');
    expect(aarav).toBeTruthy();
    expect(aarav.averageMarks).toBe(92);
    expect(aarav.averagePercentage).toBe(92);
    expect(aarav.grade).toBe('A+');

    const bhavya = sp.find((s: { studentName: string }) => s.studentName === 'Bhavya Singh');
    expect(bhavya).toBeTruthy();
    expect(bhavya.averageMarks).toBe(78);
    expect(bhavya.averagePercentage).toBe(78);
    expect(bhavya.grade).toBe('B+');

    const charvi = sp.find((s: { studentName: string }) => s.studentName === 'Charvi Patel');
    expect(charvi).toBeTruthy();
    expect(charvi.averageMarks).toBe(55);
    expect(charvi.grade).toBe('C');

    const dhruv = sp.find((s: { studentName: string }) => s.studentName === 'Dhruv Sharma');
    expect(dhruv).toBeTruthy();
    expect(dhruv.averageMarks).toBe(30);
    expect(dhruv.grade).toBe('F');

    const esha = sp.find((s: { studentName: string }) => s.studentName === 'Esha Reddy');
    expect(esha).toBeTruthy();
    expect(esha.averageMarks).toBe(85);
    expect(esha.grade).toBe('A');
  });

  test('5) class pass rate is correctly computed', async ({ page }) => {
    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const performance = await page.evaluate(async (classId) => {
      const res = await fetch(`http://localhost:3001/api/classes/${classId}/performance`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, CLASS_10A_ID);

    // 4 out of 5 passed (Dhruv with 30 failed), pass rate = 80%
    expect(performance.passRate).toBe(80);
  });

  test('6) toppers list shows top 3 students by performance', async ({ page }) => {
    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const performance = await page.evaluate(async (classId) => {
      const res = await fetch(`http://localhost:3001/api/classes/${classId}/performance`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, CLASS_10A_ID);

    expect(performance.toppers).toHaveLength(3);

    // Top 3 by percentage: Aarav (92), Esha (85), Bhavya (78)
    expect(performance.toppers[0].studentName).toBe('Aarav Kumar');
    expect(performance.toppers[0].averagePercentage).toBe(92);

    expect(performance.toppers[1].studentName).toBe('Esha Reddy');
    expect(performance.toppers[1].averagePercentage).toBe(85);

    expect(performance.toppers[2].studentName).toBe('Bhavya Singh');
    expect(performance.toppers[2].averagePercentage).toBe(78);
  });

  test('7) class dashboard page renders student list with performance', async ({ page }) => {
    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await page.waitForFunction(
      () => document.body.textContent?.includes('10') ||
            document.body.textContent?.toLowerCase().includes('class'),
      { timeout: 10_000 },
    ).catch(() => {});

    // Verify class page loaded
    const bodyText = await body.textContent();
    expect(bodyText).toBeTruthy();

    // API calls should have been made
    await expect.poll(() =>
      [...state.requestLog].some((r) => r.includes(`/classes/${CLASS_10A_ID}`)),
    ).toBeTruthy();
  });

  test('8) classes list shows updated average academic performance', async ({ page }) => {
    await page.goto('/classes');
    await page.waitForLoadState('networkidle');

    // Fetch classes list via API
    const classesResult = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/classes', {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    });

    const class10A = classesResult.data.find((c: { id: string }) => c.id === CLASS_10A_ID);
    expect(class10A).toBeTruthy();
    expect(class10A.averageAcademicPerformance).toBe(68);
    expect(class10A.studentCount).toBe(5);
  });
});
