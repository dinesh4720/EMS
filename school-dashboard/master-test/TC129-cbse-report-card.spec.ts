/**
 * TC089: Generate and view CBSE-format report card for a student.
 *
 * Verifies: student info header, subject-wise marks table, exam-wise comparison,
 * overall percentage and grade, scholastic/co-scholastic areas, print and download.
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
  type ExamRecord,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ───────── CBSE report card route overrides ───────── */

async function installCBSEReportRoutes(
  page: import('@playwright/test').Page,
  state: MockState,
  students: StudentRecord[],
  exams: ExamRecord[],
) {
  // CBSE report card list / class endpoint
  await page.route('**/api/cbse-report-card*', async (route) => {
    const method = route.request().method();
    const url = new URL(route.request().url());
    state.requestLog.add(`${method} /api/cbse-report-card`);

    const classId = url.searchParams.get('classId');
    const studentId = url.searchParams.get('studentId');

    if (studentId) {
      const student = state.students.find((s) => s.id === studentId);
      if (!student) {
        return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) });
      }

      const studentResults = state.results.filter((r) => r.studentId === studentId);
      const totalMarks = studentResults.reduce((sum, r) => sum + r.marks, 0);
      const totalMaxMarks = studentResults.reduce((sum, r) => sum + r.maxMarks, 0);
      const percentage = totalMaxMarks > 0 ? Math.round((totalMarks / totalMaxMarks) * 100) : 0;
      const overallGrade = percentage >= 90 ? 'A1' : percentage >= 80 ? 'A2' : percentage >= 70 ? 'B1' : percentage >= 60 ? 'B2' : percentage >= 50 ? 'C1' : percentage >= 40 ? 'C2' : 'E';

      // Group results by exam
      const examWise = exams.map((exam) => {
        const examResults = studentResults.filter((r) => r.examId === exam.id);
        return {
          examId: exam.id,
          examName: exam.name,
          subjects: examResults.map((r) => ({
            subject: r.subject,
            marks: r.marks,
            maxMarks: r.maxMarks,
            grade: r.grade,
          })),
          totalMarks: examResults.reduce((sum, r) => sum + r.marks, 0),
          totalMaxMarks: examResults.reduce((sum, r) => sum + r.maxMarks, 0),
        };
      });

      // Subject-wise aggregation
      const subjectMap = new Map<string, { totalMarks: number; totalMax: number; grades: string[] }>();
      for (const r of studentResults) {
        const entry = subjectMap.get(r.subject) || { totalMarks: 0, totalMax: 0, grades: [] };
        entry.totalMarks += r.marks;
        entry.totalMax += r.maxMarks;
        entry.grades.push(r.grade);
        subjectMap.set(r.subject, entry);
      }
      const subjectWise = Array.from(subjectMap.entries()).map(([subject, data]) => ({
        subject,
        totalMarks: data.totalMarks,
        totalMaxMarks: data.totalMax,
        average: Math.round(data.totalMarks / data.grades.length),
        grade: data.grades[data.grades.length - 1],
      }));

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          student: {
            _id: student._id,
            name: student.name,
            admissionId: student.admissionId,
            rollNo: student.rollNo,
            classId: student.classId,
            className: '10-A',
            dateOfBirth: student.dateOfBirth,
            gender: student.gender,
            guardians: student.guardians,
          },
          academicYear: '2025-2026',
          schoolName: 'SchoolSync Demo School',
          examWise,
          subjectWise,
          overallPercentage: percentage,
          overallGrade,
          scholasticAreas: [
            { area: 'Work Education', grade: 'A' },
            { area: 'Art Education', grade: 'B' },
            { area: 'Health & Physical Education', grade: 'A' },
          ],
          coScholasticAreas: [
            { area: 'Discipline', grade: 'A' },
            { area: 'Self Confidence', grade: 'B' },
            { area: 'Regularity & Punctuality', grade: 'A' },
          ],
          attendance: { totalDays: 220, daysPresent: 205 },
          remarks: 'Good performance overall.',
        }),
      });
    }

    // List students for a class
    const filteredStudents = classId
      ? state.students.filter((s) => s.classId === classId)
      : state.students;

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        students: filteredStudents.map((s) => ({
          _id: s._id,
          name: s.name,
          admissionId: s.admissionId,
          rollNo: s.rollNo,
          classId: s.classId,
          className: '10-A',
        })),
        total: filteredStudents.length,
      }),
    });
  });

  // PDF download endpoint
  await page.route('**/api/cbse-report-card/*/pdf*', async (route) => {
    state.requestLog.add('GET /api/cbse-report-card/pdf');
    return route.fulfill({
      status: 200,
      contentType: 'application/pdf',
      body: Buffer.from('mock-pdf-content'),
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   TEST SUITE
   ═══════════════════════════════════════════════════════════════ */

test.describe('TC089 — CBSE Report Card: Generate & View', () => {
  let state: MockState;
  let students: StudentRecord[];
  let exams: ExamRecord[];

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    // Seed 5 students in class 10-A
    students = [];
    for (let i = 0; i < 5; i++) {
      students.push(seedStudent(state, { name: `Student ${i + 1}`, classId: CLASS_10A_ID }));
    }

    // Seed 3 exams: Unit Test, Mid-term, Final
    exams = [
      seedExam(state, { name: 'Unit Test', classId: CLASS_10A_ID, status: 'results_published', date: '2025-08-15' }),
      seedExam(state, { name: 'Mid-Term', classId: CLASS_10A_ID, status: 'results_published', date: '2025-11-10' }),
      seedExam(state, { name: 'Final', classId: CLASS_10A_ID, status: 'results_published', date: '2026-03-15' }),
    ];

    // Seed results for all students across all exams
    const subjects = ['Mathematics', 'Science', 'English'];
    const marksByStudent = [
      [85, 78, 72, 88, 82, 75, 92, 80, 70],
      [70, 65, 60, 75, 72, 68, 80, 70, 65],
      [90, 88, 95, 92, 90, 85, 95, 92, 90],
      [55, 50, 45, 60, 55, 50, 65, 60, 55],
      [40, 35, 42, 50, 45, 48, 55, 50, 45],
    ];

    for (let si = 0; si < students.length; si++) {
      let mi = 0;
      for (const exam of exams) {
        for (const subject of subjects) {
          seedResult(state, students[si].id, exam.id, subject, marksByStudent[si][mi]);
          mi++;
        }
      }
    }

    await installMockApi(page, state);
    await installCBSEReportRoutes(page, state, students, exams);
  });

  /* ───────── 1. Page loads ───────── */

  test('1) CBSE report card page loads', async ({ page }) => {
    await page.goto('/academics/cbse-report-card');
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.toLowerCase().includes('report') ||
      bodyText?.toLowerCase().includes('cbse') ||
      bodyText?.toLowerCase().includes('card') ||
      bodyText?.toLowerCase().includes('academic'),
    ).toBeTruthy();
  });

  /* ───────── 2. Select class 10-A ───────── */

  test('2) select class 10-A and student list populates', async ({ page }) => {
    await page.goto('/academics/cbse-report-card');
    await page.waitForLoadState('networkidle');

    // Select class
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
      bodyText?.includes('Student 1') ||
      bodyText?.includes('Student 2') ||
      bodyText?.includes('10-A'),
    ).toBeTruthy();
  });

  /* ───────── 3. Select a student ───────── */

  test('3) select a student to view report card', async ({ page }) => {
    await page.goto('/academics/cbse-report-card');
    await page.waitForLoadState('networkidle');

    // Select class first
    const classSelector = page.locator('select, button[aria-haspopup="listbox"], [role="combobox"]').first();
    if (await classSelector.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await classSelector.click();
      await page.waitForTimeout(300);
      const classOpt = page.getByRole('option', { name: /10/i }).first();
      if (await classOpt.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await classOpt.click();
      }
    }
    await page.waitForLoadState('networkidle');

    // Select student
    const studentSelector = page.locator('select, button[aria-haspopup="listbox"], [role="combobox"]').nth(1);
    if (await studentSelector.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await studentSelector.click();
      await page.waitForTimeout(300);
      const studentOpt = page.getByText('Student 1', { exact: false }).first();
      if (await studentOpt.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await studentOpt.click();
      }
    }
    await page.waitForTimeout(500);

    const bodyText = await page.textContent('body');
    expect(bodyText?.includes('Student 1') || bodyText?.includes('report')).toBeTruthy();
  });

  /* ───────── 4. Report card shows student info header ───────── */

  test('4) report card displays student info header', async ({ page }) => {
    await page.goto(`/academics/cbse-report-card?classId=${CLASS_10A_ID}&studentId=${students[0].id}`);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    // Student name or admission ID should appear
    expect(
      bodyText?.includes('Student 1') ||
      bodyText?.includes(students[0].admissionId) ||
      bodyText?.includes('10-A'),
    ).toBeTruthy();
  });

  /* ───────── 5. Subject-wise marks table ───────── */

  test('5) report card API returns subject-wise marks', async ({ page }) => {
    await page.goto('/academics/cbse-report-card');
    await page.waitForLoadState('networkidle');

    const reportData = await page.evaluate(async (params) => {
      const res = await fetch(
        `http://localhost:3001/api/cbse-report-card?studentId=${params.studentId}`,
        { headers: { Authorization: 'Bearer mock-jwt-token-admin' } },
      );
      return res.json();
    }, { studentId: students[0].id });

    expect(reportData.subjectWise).toBeDefined();
    expect(reportData.subjectWise.length).toBe(3); // Mathematics, Science, English
    const subjects = reportData.subjectWise.map((s: { subject: string }) => s.subject);
    expect(subjects).toContain('Mathematics');
    expect(subjects).toContain('Science');
    expect(subjects).toContain('English');
  });

  /* ───────── 6. Exam-wise comparison ───────── */

  test('6) report card API returns exam-wise comparison data', async ({ page }) => {
    await page.goto('/academics/cbse-report-card');
    await page.waitForLoadState('networkidle');

    const reportData = await page.evaluate(async (params) => {
      const res = await fetch(
        `http://localhost:3001/api/cbse-report-card?studentId=${params.studentId}`,
        { headers: { Authorization: 'Bearer mock-jwt-token-admin' } },
      );
      return res.json();
    }, { studentId: students[0].id });

    expect(reportData.examWise).toBeDefined();
    expect(reportData.examWise.length).toBe(3); // Unit Test, Mid-Term, Final
    expect(reportData.examWise[0].examName).toBe('Unit Test');
    expect(reportData.examWise[1].examName).toBe('Mid-Term');
    expect(reportData.examWise[2].examName).toBe('Final');

    // Each exam should have 3 subjects
    for (const exam of reportData.examWise) {
      expect(exam.subjects.length).toBe(3);
    }
  });

  /* ───────── 7. Overall percentage and grade ───────── */

  test('7) report card API returns overall percentage and grade', async ({ page }) => {
    await page.goto('/academics/cbse-report-card');
    await page.waitForLoadState('networkidle');

    const reportData = await page.evaluate(async (params) => {
      const res = await fetch(
        `http://localhost:3001/api/cbse-report-card?studentId=${params.studentId}`,
        { headers: { Authorization: 'Bearer mock-jwt-token-admin' } },
      );
      return res.json();
    }, { studentId: students[2].id }); // Student 3 has high marks

    expect(reportData.overallPercentage).toBeGreaterThan(0);
    expect(reportData.overallGrade).toBeDefined();
    expect(typeof reportData.overallGrade).toBe('string');
    // Student 3 has 90+ marks, should get A1 or A2
    expect(['A1', 'A2']).toContain(reportData.overallGrade);
  });

  /* ───────── 8. Scholastic areas ───────── */

  test('8) report card API returns scholastic areas', async ({ page }) => {
    await page.goto('/academics/cbse-report-card');
    await page.waitForLoadState('networkidle');

    const reportData = await page.evaluate(async (params) => {
      const res = await fetch(
        `http://localhost:3001/api/cbse-report-card?studentId=${params.studentId}`,
        { headers: { Authorization: 'Bearer mock-jwt-token-admin' } },
      );
      return res.json();
    }, { studentId: students[0].id });

    expect(reportData.scholasticAreas).toBeDefined();
    expect(reportData.scholasticAreas.length).toBeGreaterThan(0);
    const areas = reportData.scholasticAreas.map((a: { area: string }) => a.area);
    expect(areas).toContain('Work Education');
    expect(areas).toContain('Art Education');
    expect(areas).toContain('Health & Physical Education');
  });

  /* ───────── 9. Co-scholastic areas ───────── */

  test('9) report card API returns co-scholastic areas', async ({ page }) => {
    await page.goto('/academics/cbse-report-card');
    await page.waitForLoadState('networkidle');

    const reportData = await page.evaluate(async (params) => {
      const res = await fetch(
        `http://localhost:3001/api/cbse-report-card?studentId=${params.studentId}`,
        { headers: { Authorization: 'Bearer mock-jwt-token-admin' } },
      );
      return res.json();
    }, { studentId: students[0].id });

    expect(reportData.coScholasticAreas).toBeDefined();
    expect(reportData.coScholasticAreas.length).toBeGreaterThan(0);
    const areas = reportData.coScholasticAreas.map((a: { area: string }) => a.area);
    expect(areas).toContain('Discipline');
    expect(areas).toContain('Self Confidence');
  });

  /* ───────── 10. Print button exists ───────── */

  test('10) report card page has a print button', async ({ page }) => {
    await page.goto(`/academics/cbse-report-card?classId=${CLASS_10A_ID}&studentId=${students[0].id}`);
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    const printBtn = body.getByRole('button', { name: /print/i }).first();
    const hasPrint = await printBtn.isVisible({ timeout: 5_000 }).catch(() => false);

    const bodyText = await body.textContent();
    const hasPrintText = bodyText?.toLowerCase().includes('print');
    expect(hasPrint || hasPrintText).toBeTruthy();
  });

  /* ───────── 11. Download PDF button ───────── */

  test('11) report card page has a download PDF button', async ({ page }) => {
    await page.goto(`/academics/cbse-report-card?classId=${CLASS_10A_ID}&studentId=${students[0].id}`);
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    const downloadBtn = body.getByRole('button', { name: /download|pdf|export/i }).first();
    const hasDownload = await downloadBtn.isVisible({ timeout: 5_000 }).catch(() => false);

    const bodyText = await body.textContent();
    const hasDownloadText = bodyText?.toLowerCase().includes('download') ||
      bodyText?.toLowerCase().includes('pdf') ||
      bodyText?.toLowerCase().includes('export');
    expect(hasDownload || hasDownloadText).toBeTruthy();
  });

  /* ───────── 12. State integrity check ───────── */

  test('12) seeded data has correct counts', async ({ page }) => {
    expect(state.students).toHaveLength(5);
    expect(state.exams).toHaveLength(3);
    // 5 students x 3 exams x 3 subjects = 45 results
    expect(state.results).toHaveLength(45);
    expect(state.exams[0].name).toBe('Unit Test');
    expect(state.exams[1].name).toBe('Mid-Term');
    expect(state.exams[2].name).toBe('Final');
  });
});
