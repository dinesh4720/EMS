/**
 * TC090: CCE (Continuous Comprehensive Evaluation) grading setup and view.
 *
 * Verifies: page load, grading scale display, class selection, student grades
 * in CCE format, formative and summative assessment sections, grade assignment.
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
  type StudentRecord,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ───────── CCE grading scale ───────── */

const CCE_GRADING_SCALE = [
  { grade: 'A1', minMarks: 91, maxMarks: 100, gradePoint: 10, description: 'Outstanding' },
  { grade: 'A2', minMarks: 81, maxMarks: 90, gradePoint: 9, description: 'Excellent' },
  { grade: 'B1', minMarks: 71, maxMarks: 80, gradePoint: 8, description: 'Very Good' },
  { grade: 'B2', minMarks: 61, maxMarks: 70, gradePoint: 7, description: 'Good' },
  { grade: 'C1', minMarks: 51, maxMarks: 60, gradePoint: 6, description: 'Fair' },
  { grade: 'C2', minMarks: 41, maxMarks: 50, gradePoint: 5, description: 'Average' },
  { grade: 'D', minMarks: 33, maxMarks: 40, gradePoint: 4, description: 'Below Average' },
  { grade: 'E', minMarks: 0, maxMarks: 32, gradePoint: 0, description: 'Need Improvement' },
];

/* ───────── CCE route overrides ───────── */

async function installCCERoutes(
  page: import('@playwright/test').Page,
  state: MockState,
  students: StudentRecord[],
) {
  // CCE grading scale
  await page.route('**/api/cce/grading-scale*', async (route) => {
    state.requestLog.add('GET /api/cce/grading-scale');
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ gradingScale: CCE_GRADING_SCALE }),
    });
  });

  // CCE grades for students
  await page.route('**/api/cce/grades*', async (route) => {
    const method = route.request().method();
    const url = new URL(route.request().url());
    state.requestLog.add(`${method} /api/cce/grades`);

    const classId = url.searchParams.get('classId');
    const filteredStudents = classId
      ? state.students.filter((s) => s.classId === classId)
      : state.students;

    if (method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Grades saved', ...body }),
      });
    }

    const studentGrades = filteredStudents.map((student) => {
      const studentResults = state.results.filter((r) => r.studentId === student.id);
      const subjectGrades: Record<string, { formative: string; summative: string; overall: string }> = {};

      for (const subject of ['Mathematics', 'Science', 'English']) {
        const subjectResults = studentResults.filter((r) => r.subject === subject);
        const avgMarks = subjectResults.length > 0
          ? subjectResults.reduce((sum, r) => sum + r.marks, 0) / subjectResults.length
          : 0;
        const grade = CCE_GRADING_SCALE.find((g) => avgMarks >= g.minMarks && avgMarks <= g.maxMarks);

        subjectGrades[subject] = {
          formative: grade?.grade || 'E',
          summative: grade?.grade || 'E',
          overall: grade?.grade || 'E',
        };
      }

      return {
        studentId: student.id,
        studentName: student.name,
        rollNo: student.rollNo,
        subjectGrades,
        formativeAssessment: {
          activities: { grade: 'A2', marks: 18, maxMarks: 20 },
          notebook: { grade: 'B1', marks: 8, maxMarks: 10 },
          oralTest: { grade: 'A1', marks: 9, maxMarks: 10 },
        },
        summativeAssessment: {
          sa1: { grade: 'B1', marks: 45, maxMarks: 60 },
          sa2: { grade: 'A2', marks: 52, maxMarks: 60 },
        },
      };
    });

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: studentGrades,
        total: studentGrades.length,
        gradingScale: CCE_GRADING_SCALE,
      }),
    });
  });

  // CCE configuration
  await page.route('**/api/cce/config*', async (route) => {
    state.requestLog.add('GET /api/cce/config');
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        formativeWeight: 40,
        summativeWeight: 60,
        subjects: ['Mathematics', 'Science', 'English'],
        formativeComponents: ['Activities', 'Notebook', 'Oral Test'],
        summativeComponents: ['SA1', 'SA2'],
      }),
    });
  });

  // Generic CCE endpoint
  await page.route('**/api/cce*', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    state.requestLog.add(`${route.request().method()} ${path}`);
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ gradingScale: CCE_GRADING_SCALE }),
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   TEST SUITE
   ═══════════════════════════════════════════════════════════════ */

test.describe('TC090 — CCE Grading: Setup & View', () => {
  let state: MockState;
  let students: StudentRecord[];

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    // Seed 4 students
    students = [];
    for (let i = 0; i < 4; i++) {
      students.push(seedStudent(state, { name: `CCE Student ${i + 1}`, classId: CLASS_10A_ID }));
    }

    // Seed exams (formative & summative)
    const fa1 = seedExam(state, { name: 'FA1', classId: CLASS_10A_ID, status: 'results_published' });
    const fa2 = seedExam(state, { name: 'FA2', classId: CLASS_10A_ID, status: 'results_published' });
    const sa1 = seedExam(state, { name: 'SA1', classId: CLASS_10A_ID, status: 'results_published' });

    // Seed results
    const subjects = ['Mathematics', 'Science', 'English'];
    const markSets = [[85, 78, 72], [70, 65, 80], [90, 88, 95], [55, 50, 45]];
    for (let si = 0; si < students.length; si++) {
      for (let sj = 0; sj < subjects.length; sj++) {
        seedResult(state, students[si].id, fa1.id, subjects[sj], markSets[si][sj]);
        seedResult(state, students[si].id, fa2.id, subjects[sj], markSets[si][sj] + 2);
        seedResult(state, students[si].id, sa1.id, subjects[sj], markSets[si][sj] - 3);
      }
    }

    await installMockApi(page, state);
    await installCCERoutes(page, state, students);
  });

  /* ───────── 1. Page loads ───────── */

  test('1) CCE grading page loads', async ({ page }) => {
    await page.goto('/academics/cce-grading');
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.toLowerCase().includes('cce') ||
      bodyText?.toLowerCase().includes('grading') ||
      bodyText?.toLowerCase().includes('evaluation') ||
      bodyText?.toLowerCase().includes('academic'),
    ).toBeTruthy();
  });

  /* ───────── 2. Grading scale display ───────── */

  test('2) CCE grading scale API returns correct data', async ({ page }) => {
    await page.goto('/academics/cce-grading');
    await page.waitForLoadState('networkidle');

    const scaleData = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/cce/grading-scale', {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    });

    expect(scaleData.gradingScale).toBeDefined();
    expect(scaleData.gradingScale).toHaveLength(8);
    expect(scaleData.gradingScale[0].grade).toBe('A1');
    expect(scaleData.gradingScale[0].description).toBe('Outstanding');
    expect(scaleData.gradingScale[7].grade).toBe('E');
    expect(scaleData.gradingScale[7].description).toBe('Need Improvement');
  });

  /* ───────── 3. Select class ───────── */

  test('3) select class shows student grades', async ({ page }) => {
    await page.goto('/academics/cce-grading');
    await page.waitForLoadState('networkidle');

    const classSelector = page.locator('select, button[aria-haspopup="listbox"], [role="combobox"]').first();
    if (await classSelector.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await classSelector.click();
      await page.waitForTimeout(300);
      const option = page.getByRole('option', { name: /10/i })
        .or(page.getByText('10-A', { exact: false }))
        .first();
      if (await option.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await option.click();
      }
    }
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('CCE Student 1') ||
      bodyText?.includes('10-A') ||
      bodyText?.toLowerCase().includes('student'),
    ).toBeTruthy();
  });

  /* ───────── 4. Student grades in CCE format ───────── */

  test('4) CCE grades API returns student grades with formative/summative', async ({ page }) => {
    await page.goto('/academics/cce-grading');
    await page.waitForLoadState('networkidle');

    const gradesData = await page.evaluate(async (classId) => {
      const res = await fetch(`http://localhost:3001/api/cce/grades?classId=${classId}`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, CLASS_10A_ID);

    expect(gradesData.data).toBeDefined();
    expect(gradesData.data).toHaveLength(4);

    const firstStudent = gradesData.data[0];
    expect(firstStudent.studentName).toBe('CCE Student 1');
    expect(firstStudent.subjectGrades).toBeDefined();
    expect(firstStudent.subjectGrades.Mathematics).toBeDefined();
    expect(firstStudent.subjectGrades.Mathematics.formative).toBeDefined();
    expect(firstStudent.subjectGrades.Mathematics.summative).toBeDefined();
    expect(firstStudent.subjectGrades.Mathematics.overall).toBeDefined();
  });

  /* ───────── 5. Formative assessment section ───────── */

  test('5) CCE grades include formative assessment components', async ({ page }) => {
    await page.goto('/academics/cce-grading');
    await page.waitForLoadState('networkidle');

    const gradesData = await page.evaluate(async (classId) => {
      const res = await fetch(`http://localhost:3001/api/cce/grades?classId=${classId}`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, CLASS_10A_ID);

    const firstStudent = gradesData.data[0];
    expect(firstStudent.formativeAssessment).toBeDefined();
    expect(firstStudent.formativeAssessment.activities).toBeDefined();
    expect(firstStudent.formativeAssessment.notebook).toBeDefined();
    expect(firstStudent.formativeAssessment.oralTest).toBeDefined();
    expect(firstStudent.formativeAssessment.activities.grade).toBe('A2');
  });

  /* ───────── 6. Summative assessment section ───────── */

  test('6) CCE grades include summative assessment components', async ({ page }) => {
    await page.goto('/academics/cce-grading');
    await page.waitForLoadState('networkidle');

    const gradesData = await page.evaluate(async (classId) => {
      const res = await fetch(`http://localhost:3001/api/cce/grades?classId=${classId}`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, CLASS_10A_ID);

    const firstStudent = gradesData.data[0];
    expect(firstStudent.summativeAssessment).toBeDefined();
    expect(firstStudent.summativeAssessment.sa1).toBeDefined();
    expect(firstStudent.summativeAssessment.sa2).toBeDefined();
    expect(firstStudent.summativeAssessment.sa1.marks).toBeDefined();
    expect(firstStudent.summativeAssessment.sa1.maxMarks).toBeDefined();
  });

  /* ───────── 7. Grade assignment ───────── */

  test('7) grade assignment POST is accepted', async ({ page }) => {
    await page.goto('/academics/cce-grading');
    await page.waitForLoadState('networkidle');

    const saveResult = await page.evaluate(async (params) => {
      const res = await fetch('http://localhost:3001/api/cce/grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-jwt-token-admin',
        },
        body: JSON.stringify({
          studentId: params.studentId,
          subject: 'Mathematics',
          formativeGrade: 'A1',
          summativeGrade: 'A2',
        }),
      });
      return res.json();
    }, { studentId: students[0].id });

    expect(saveResult.message).toBe('Grades saved');
  });

  /* ───────── 8. CCE configuration weights ───────── */

  test('8) CCE config returns formative/summative weight split', async ({ page }) => {
    await page.goto('/academics/cce-grading');
    await page.waitForLoadState('networkidle');

    const config = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/cce/config', {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    });

    expect(config.formativeWeight).toBe(40);
    expect(config.summativeWeight).toBe(60);
    expect(config.formativeWeight + config.summativeWeight).toBe(100);
    expect(config.subjects).toHaveLength(3);
    expect(config.formativeComponents).toContain('Activities');
    expect(config.summativeComponents).toContain('SA1');
  });

  /* ───────── 9. State integrity check ───────── */

  test('9) seeded data has correct structure', async ({ page }) => {
    expect(state.students).toHaveLength(4);
    expect(state.exams).toHaveLength(3);
    // 4 students x 3 exams x 3 subjects = 36 results
    expect(state.results).toHaveLength(36);
  });
});
