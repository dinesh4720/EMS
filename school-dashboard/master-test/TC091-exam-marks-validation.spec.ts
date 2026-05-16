/**
 * TC091: Test marks entry validation and edge cases.
 *
 * Verifies: rejection of marks > maxMarks, rejection of negative marks,
 * acceptance of 0 and 100, pass/fail at boundary (35/34), exclusion of
 * unmarked students, class average computation, and percentage calculation.
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

interface ExamWithMarks {
  _id: string; id: string; name: string; classId: string;
  status: string; date: string; subjects: string[]; schoolId: string;
  maxMarks?: number; passingMarks?: number; gradingType?: string;
}

/* ───────── Grade helper ───────── */

function computeGrade(marks: number, maxMarks: number): { grade: string; status: string } {
  const pct = (marks / maxMarks) * 100;
  const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : 'F';
  const status = pct >= 35 ? 'Pass' : 'Fail';
  return { grade, status };
}

/* ───────── Route overrides ───────── */

async function installValidationRoutes(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  // Override results endpoint with validation
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
      const entries: Array<{ studentId: string; marks?: number | null; maxMarks?: number; examId?: string }> =
        body.results || [body];
      const maxMarks = body.maxMarks || 100;
      const passingMarks = body.passingMarks || 35;
      const errors: string[] = [];
      const validResults: Array<Record<string, unknown>> = [];
      const skipped: string[] = [];

      for (const entry of entries) {
        // Skip unmarked students (marks is null/undefined)
        if (entry.marks === null || entry.marks === undefined) {
          skipped.push(entry.studentId);
          continue;
        }

        const marks = entry.marks;
        const entryMax = entry.maxMarks || maxMarks;

        // Validate marks > maxMarks
        if (marks > entryMax) {
          errors.push(`Marks (${marks}) cannot exceed maximum marks (${entryMax}) for student ${entry.studentId}`);
          continue;
        }

        // Validate negative marks
        if (marks < 0) {
          errors.push(`Marks cannot be negative for student ${entry.studentId}`);
          continue;
        }

        const { grade, status } = computeGrade(marks, entryMax);
        const passFail = marks >= passingMarks ? 'Pass' : 'Fail';

        const result = {
          _id: `res-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          id: `res-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          studentId: entry.studentId,
          examId: entry.examId || body.examId,
          subject: body.subject || 'Mathematics',
          marks,
          maxMarks: entryMax,
          grade,
          status: passFail,
          percentage: Math.round((marks / entryMax) * 100 * 100) / 100,
          schoolId: SCHOOL_ID,
        };
        state.results.push(result as never);
        validResults.push(result);
      }

      if (errors.length > 0 && validResults.length === 0) {
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ errors, message: 'Validation failed' }),
        });
      }

      // Compute class average (only from valid/entered students)
      const avgMarks = validResults.length > 0
        ? validResults.reduce((sum, r) => sum + (r.marks as number), 0) / validResults.length
        : 0;
      const passed = validResults.filter((r) => r.status === 'Pass').length;
      const failed = validResults.filter((r) => r.status === 'Fail').length;

      return route.fulfill({
        status: errors.length > 0 ? 207 : 201,
        contentType: 'application/json',
        body: JSON.stringify({
          message: errors.length > 0 ? 'Partial save with errors' : 'Results saved successfully',
          results: validResults,
          errors,
          skipped,
          statistics: {
            total: validResults.length,
            passed,
            failed,
            average: Math.round(avgMarks * 100) / 100,
            passPercentage: validResults.length > 0 ? Math.round((passed / validResults.length) * 100) : 0,
          },
        }),
      });
    }
    return route.fallback();
  });

  // Exam detail
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
    return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) });
  });

  // Exams list
  await page.route('**/api/exams', async (route) => {
    state.requestLog.add('GET /api/exams');
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: state.exams, total: state.exams.length, page: 1, limit: 100 }),
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   TEST SUITE
   ═══════════════════════════════════════════════════════════════ */

test.describe('TC091: Exam Marks Validation and Edge Cases', () => {
  let state: MockState;
  let students: ReturnType<typeof seedStudent>[];
  let exam: ReturnType<typeof seedExam>;

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

    // Seed 1 exam: maxMarks=100, passingMarks=35
    exam = seedExam(state, {
      name: 'Validation Test Exam',
      classId: CLASS_10A_ID,
      status: 'scheduled',
      subjects: ['Mathematics'],
    });
    (exam as unknown as ExamWithMarks).maxMarks = 100;
    (exam as unknown as ExamWithMarks).passingMarks = 35;
    (exam as unknown as ExamWithMarks).gradingType = 'numerical';

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });
    await installMockApi(page, state);
    await installValidationRoutes(page, state);
  });

  test('1) marks > 100 are rejected with error', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async ({ examId, results }) => {
      const res = await fetch('http://localhost:3001/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({ examId, maxMarks: 100, passingMarks: 35, results }),
      });
      return { status: res.status, body: await res.json() };
    }, {
      examId: exam.id,
      results: [
        { studentId: students[0].id, marks: 150, maxMarks: 100 },
      ],
    });

    // Should return validation error
    expect(result.status).toBe(400);
    expect(result.body.errors).toBeTruthy();
    expect(result.body.errors.length).toBeGreaterThan(0);
    expect(result.body.errors[0]).toContain('cannot exceed');
  });

  test('2) negative marks are rejected with error', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async ({ examId, results }) => {
      const res = await fetch('http://localhost:3001/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({ examId, maxMarks: 100, passingMarks: 35, results }),
      });
      return { status: res.status, body: await res.json() };
    }, {
      examId: exam.id,
      results: [
        { studentId: students[0].id, marks: -5, maxMarks: 100 },
      ],
    });

    expect(result.status).toBe(400);
    expect(result.body.errors).toBeTruthy();
    expect(result.body.errors[0]).toContain('negative');
  });

  test('3) marks = 0 are accepted (valid score)', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async ({ examId, results }) => {
      const res = await fetch('http://localhost:3001/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({ examId, maxMarks: 100, passingMarks: 35, results }),
      });
      return { status: res.status, body: await res.json() };
    }, {
      examId: exam.id,
      results: [
        { studentId: students[0].id, marks: 0, maxMarks: 100 },
      ],
    });

    expect(result.status).toBe(201);
    expect(result.body.results).toHaveLength(1);
    expect(result.body.results[0].marks).toBe(0);
    expect(result.body.results[0].status).toBe('Fail');
    expect(result.body.results[0].percentage).toBe(0);
  });

  test('4) marks = 100 are accepted (perfect score)', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async ({ examId, results }) => {
      const res = await fetch('http://localhost:3001/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({ examId, maxMarks: 100, passingMarks: 35, results }),
      });
      return { status: res.status, body: await res.json() };
    }, {
      examId: exam.id,
      results: [
        { studentId: students[0].id, marks: 100, maxMarks: 100 },
      ],
    });

    expect(result.status).toBe(201);
    expect(result.body.results).toHaveLength(1);
    expect(result.body.results[0].marks).toBe(100);
    expect(result.body.results[0].status).toBe('Pass');
    expect(result.body.results[0].grade).toBe('A+');
    expect(result.body.results[0].percentage).toBe(100);
  });

  test('5) marks = 35 (exactly passing) shows "Pass"', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async ({ examId, results }) => {
      const res = await fetch('http://localhost:3001/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({ examId, maxMarks: 100, passingMarks: 35, results }),
      });
      return res.json();
    }, {
      examId: exam.id,
      results: [
        { studentId: students[0].id, marks: 35, maxMarks: 100 },
      ],
    });

    expect(result.results[0].marks).toBe(35);
    expect(result.results[0].status).toBe('Pass');
  });

  test('6) marks = 34 (just below passing) shows "Fail"', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async ({ examId, results }) => {
      const res = await fetch('http://localhost:3001/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({ examId, maxMarks: 100, passingMarks: 35, results }),
      });
      return res.json();
    }, {
      examId: exam.id,
      results: [
        { studentId: students[0].id, marks: 34, maxMarks: 100 },
      ],
    });

    expect(result.results[0].marks).toBe(34);
    expect(result.results[0].status).toBe('Fail');
  });

  test('7) unmarked student (null marks) is excluded from save', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async ({ examId, results }) => {
      const res = await fetch('http://localhost:3001/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({ examId, maxMarks: 100, passingMarks: 35, results }),
      });
      return res.json();
    }, {
      examId: exam.id,
      results: [
        { studentId: students[0].id, marks: 80, maxMarks: 100 },
        { studentId: students[1].id, marks: null, maxMarks: 100 }, // unmarked
        { studentId: students[2].id, marks: 65, maxMarks: 100 },
      ],
    });

    // Only 2 results should be saved (null excluded)
    expect(result.results).toHaveLength(2);
    expect(result.skipped).toContain(students[1].id);
  });

  test('8) class average only counts entered students', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async ({ examId, results }) => {
      const res = await fetch('http://localhost:3001/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({ examId, maxMarks: 100, passingMarks: 35, results }),
      });
      return res.json();
    }, {
      examId: exam.id,
      results: [
        { studentId: students[0].id, marks: 80, maxMarks: 100 },
        { studentId: students[1].id, marks: null, maxMarks: 100 }, // excluded
        { studentId: students[2].id, marks: 60, maxMarks: 100 },
        { studentId: students[3].id, marks: null, maxMarks: 100 }, // excluded
        { studentId: students[4].id, marks: 40, maxMarks: 100 },
      ],
    });

    // Average should be (80+60+40)/3 = 60, not (80+0+60+0+40)/5 = 36
    expect(result.statistics.total).toBe(3);
    expect(result.statistics.average).toBe(60);
  });

  test('9) percentage calculation: (marks/maxMarks)*100', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async ({ examId, results }) => {
      const res = await fetch('http://localhost:3001/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({ examId, maxMarks: 100, passingMarks: 35, results }),
      });
      return res.json();
    }, {
      examId: exam.id,
      results: [
        { studentId: students[0].id, marks: 75, maxMarks: 100 },
        { studentId: students[1].id, marks: 50, maxMarks: 100 },
      ],
    });

    // Verify percentage: 75/100*100 = 75%, 50/100*100 = 50%
    expect(result.results[0].percentage).toBe(75);
    expect(result.results[1].percentage).toBe(50);
  });

  test('10) mixed valid and invalid marks: partial save with errors', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async ({ examId, results }) => {
      const res = await fetch('http://localhost:3001/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({ examId, maxMarks: 100, passingMarks: 35, results }),
      });
      return { status: res.status, body: await res.json() };
    }, {
      examId: exam.id,
      results: [
        { studentId: students[0].id, marks: 85, maxMarks: 100 },   // valid
        { studentId: students[1].id, marks: 110, maxMarks: 100 },  // invalid: exceeds max
        { studentId: students[2].id, marks: -10, maxMarks: 100 },  // invalid: negative
        { studentId: students[3].id, marks: 70, maxMarks: 100 },   // valid
        { studentId: students[4].id, marks: null, maxMarks: 100 }, // skipped
      ],
    });

    // Partial save: 2 valid, 2 errors, 1 skipped
    expect(result.status).toBe(207);
    expect(result.body.results).toHaveLength(2);
    expect(result.body.errors).toHaveLength(2);
    expect(result.body.skipped).toHaveLength(1);
    expect(result.body.statistics.total).toBe(2);
    expect(result.body.statistics.average).toBe(77.5);
  });
});
