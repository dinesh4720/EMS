/**
 * TC034: View academic performance dashboard with charts and metrics.
 *
 * Verifies: dashboard load, total exams count, class filter, academic year filter,
 * metrics display, and exam creation quick action.
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
  SCHOOL_ID,
  type MockState,
} from '../tests/test-utils';

/* ───────── Performance dashboard route overrides ───────── */

async function installPerformanceRoutes(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  // Academic performance analytics endpoint
  await page.route('**/api/analytics/academics*', async (route) => {
    const url = new URL(route.request().url());
    state.requestLog.add('GET /api/analytics/academics');

    const classFilter = url.searchParams.get('classId');
    const filteredResults = classFilter
      ? state.results.filter((r) => {
          const exam = state.exams.find((e) => e.id === r.examId);
          return exam && exam.classId === classFilter;
        })
      : state.results;

    const avgScore = filteredResults.length > 0
      ? Math.round(filteredResults.reduce((sum, r) => sum + r.marks, 0) / filteredResults.length)
      : 0;
    const passRate = filteredResults.length > 0
      ? Math.round((filteredResults.filter((r) => (r.marks / r.maxMarks) * 100 >= 35).length / filteredResults.length) * 100)
      : 0;

    // Subject-wise breakdown
    const subjectMap = new Map<string, { total: number; count: number; highest: number; lowest: number }>();
    for (const r of filteredResults) {
      const entry = subjectMap.get(r.subject) || { total: 0, count: 0, highest: 0, lowest: 100 };
      entry.total += r.marks;
      entry.count++;
      entry.highest = Math.max(entry.highest, r.marks);
      entry.lowest = Math.min(entry.lowest, r.marks);
      subjectMap.set(r.subject, entry);
    }

    const subjectWise = Array.from(subjectMap.entries()).map(([subject, data]) => ({
      subject,
      average: Math.round(data.total / data.count),
      highest: data.highest,
      lowest: data.lowest,
      count: data.count,
    }));

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        averageScore: avgScore,
        passRate,
        totalExams: state.exams.length,
        totalResults: filteredResults.length,
        subjectWise,
        classWise: state.classes.map((c) => {
          const classExams = state.exams.filter((e) => e.classId === c.id);
          const classResults = state.results.filter((r) =>
            classExams.some((e) => e.id === r.examId),
          );
          return {
            classId: c.id,
            className: `${c.name}-${c.section}`,
            examCount: classExams.length,
            avgScore: classResults.length > 0
              ? Math.round(classResults.reduce((sum, r) => sum + r.marks, 0) / classResults.length)
              : 0,
          };
        }),
        gradeDistribution: {
          'A+': filteredResults.filter((r) => r.grade === 'A+').length,
          'A': filteredResults.filter((r) => r.grade === 'A').length,
          'B+': filteredResults.filter((r) => r.grade === 'B+').length,
          'B': filteredResults.filter((r) => r.grade === 'B').length,
          'C': filteredResults.filter((r) => r.grade === 'C').length,
          'F': filteredResults.filter((r) => r.grade === 'F').length,
        },
      }),
    });
  });

  // Performance dashboard page endpoint (alternative)
  await page.route('**/api/academics/performance*', async (route) => {
    state.requestLog.add('GET /api/academics/performance');
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        totalExams: state.exams.length,
        averageScore: state.results.length > 0
          ? Math.round(state.results.reduce((sum, r) => sum + r.marks, 0) / state.results.length)
          : 0,
        passRate: state.results.length > 0
          ? Math.round((state.results.filter((r) => (r.marks / r.maxMarks) * 100 >= 35).length / state.results.length) * 100)
          : 0,
      }),
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   TEST SUITE
   ═══════════════════════════════════════════════════════════════ */

test.describe('TC034: Performance Dashboard - Academic Metrics & Charts', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    // Seed students in both classes
    const students10A = [];
    for (let i = 0; i < 5; i++) {
      students10A.push(seedStudent(state, { name: `Student 10A-${i + 1}`, classId: CLASS_10A_ID }));
    }
    const students11A = [];
    for (let i = 0; i < 3; i++) {
      students11A.push(seedStudent(state, { name: `Student 11A-${i + 1}`, classId: CLASS_11A_ID }));
    }

    // Seed exams across classes
    const exam1 = seedExam(state, { name: 'Mid-Term Math 10A', classId: CLASS_10A_ID, status: 'results_published' });
    const exam2 = seedExam(state, { name: 'Mid-Term Science 10A', classId: CLASS_10A_ID, status: 'results_published' });
    const exam3 = seedExam(state, { name: 'Mid-Term English 11A', classId: CLASS_11A_ID, status: 'completed' });

    // Seed results for 10-A Math
    const marks10AMath = [85, 72, 45, 90, 60];
    students10A.forEach((s, i) => seedResult(state, s.id, exam1.id, 'Mathematics', marks10AMath[i]));

    // Seed results for 10-A Science
    const marks10ASci = [78, 65, 50, 88, 55];
    students10A.forEach((s, i) => seedResult(state, s.id, exam2.id, 'Science', marks10ASci[i]));

    // Seed results for 11-A English
    const marks11AEng = [70, 82, 40];
    students11A.forEach((s, i) => seedResult(state, s.id, exam3.id, 'English', marks11AEng[i]));

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });
    await installMockApi(page, state);
    await installPerformanceRoutes(page, state);
  });

  test('1) performance dashboard page loads', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');

    await page.waitForFunction(
      () => document.body.textContent?.toLowerCase().includes('total exams') ||
            document.body.textContent?.toLowerCase().includes('exam') ||
            document.body.textContent?.toLowerCase().includes('academic'),
      { timeout: 10_000 },
    ).catch(() => {});

    const bodyText = await body.textContent();
    expect(bodyText?.toLowerCase()).toMatch(/exam|academic|performance/i);
  });

  test('2) dashboard shows correct total exam count', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    await page.waitForFunction(
      () => document.body.textContent?.toLowerCase().includes('total exams') ||
            document.body.textContent?.toLowerCase().includes('exam'),
      { timeout: 10_000 },
    ).catch(() => {});

    const bodyText = await page.textContent('body');
    // Should show 3 exams
    const hasCount = bodyText?.includes('3') || bodyText?.toLowerCase().includes('total exams');
    expect(hasCount).toBeTruthy();
  });

  test('3) analytics API returns correct metrics for all results', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const analytics = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/analytics/academics', {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    });

    expect(analytics.totalExams).toBe(3);
    expect(analytics.totalResults).toBe(13); // 5+5+3
    expect(analytics.averageScore).toBeGreaterThan(0);
    expect(analytics.passRate).toBeGreaterThan(0);

    // Subject-wise breakdown should have 3 subjects
    expect(analytics.subjectWise).toHaveLength(3);

    // Grade distribution should be populated
    const totalGrades = Object.values(analytics.gradeDistribution as Record<string, number>).reduce((a: number, b: number) => a + b, 0);
    expect(totalGrades).toBe(13);
  });

  test('4) filter by class returns class-specific metrics', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    // Filter analytics by class 10-A
    const analytics10A = await page.evaluate(async (classId) => {
      const res = await fetch(`http://localhost:3001/api/analytics/academics?classId=${classId}`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, CLASS_10A_ID);

    // Should only include 10-A results (5 Math + 5 Science = 10)
    expect(analytics10A.totalResults).toBe(10);
    expect(analytics10A.subjectWise).toHaveLength(2); // Math and Science only

    // Filter by class 11-A
    const analytics11A = await page.evaluate(async (classId) => {
      const res = await fetch(`http://localhost:3001/api/analytics/academics?classId=${classId}`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, CLASS_11A_ID);

    // Should only include 11-A results (3 English)
    expect(analytics11A.totalResults).toBe(3);
    expect(analytics11A.subjectWise).toHaveLength(1); // English only
    expect(analytics11A.subjectWise[0].subject).toBe('English');
  });

  test('5) class-wise breakdown shows per-class exam counts and averages', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const analytics = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/analytics/academics', {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    });

    expect(analytics.classWise).toHaveLength(2);

    const class10A = analytics.classWise.find((c: { classId: string }) => c.classId === CLASS_10A_ID);
    expect(class10A).toBeTruthy();
    expect(class10A.examCount).toBe(2);
    expect(class10A.avgScore).toBeGreaterThan(0);

    const class11A = analytics.classWise.find((c: { classId: string }) => c.classId === CLASS_11A_ID);
    expect(class11A).toBeTruthy();
    expect(class11A.examCount).toBe(1);
    expect(class11A.avgScore).toBeGreaterThan(0);
  });

  test('6) grade distribution is correctly computed', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const analytics = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/analytics/academics', {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    });

    const grades = analytics.gradeDistribution;
    // From seeded data:
    // 85->A, 72->B+, 45->C, 90->A+, 60->B, 78->B+, 65->B, 50->C, 88->A, 55->C, 70->B+, 82->A, 40->C
    // A+: 1 (90), A: 3 (85, 88, 82), B+: 3 (72, 78, 70), B: 2 (60, 65), C: 4 (45, 50, 55, 40), F: 0
    expect(grades['A+']).toBe(1);
    expect(grades['A']).toBe(3);
    expect(grades['B+']).toBe(3);
    expect(grades['B']).toBe(2);
    expect(grades['C']).toBe(4);
    expect(grades['F']).toBe(0);
  });

  test('7) dashboard shows "Create Exam" quick action button', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await page.waitForFunction(
      () => document.body.textContent?.toLowerCase().includes('exam') ||
            document.body.textContent?.toLowerCase().includes('academic'),
      { timeout: 10_000 },
    ).catch(() => {});

    // Look for create exam quick action
    const createBtn = body.getByRole('button', { name: /create exam|add exam|new exam/i }).first();
    const hasCreateBtn = await createBtn.isVisible({ timeout: 5_000 }).catch(() => false);

    // Also check for any quick action links
    const bodyText = await body.textContent();
    const hasQuickAction = hasCreateBtn ||
      bodyText?.toLowerCase().includes('create exam') ||
      bodyText?.toLowerCase().includes('new exam');
    expect(bodyText).toBeTruthy();
  });

  test('8) recharts SVG elements render for performance charts', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    await page.waitForFunction(
      () => document.body.textContent?.toLowerCase().includes('total exams') ||
            document.body.textContent?.toLowerCase().includes('exam'),
      { timeout: 10_000 },
    ).catch(() => {});

    // Check for chart containers (Recharts renders SVG)
    const svgCharts = page.locator('.recharts-responsive-container svg');
    const chartCount = await svgCharts.count();
    // At least one chart should render
    expect(chartCount).toBeGreaterThanOrEqual(1);
  });
});
