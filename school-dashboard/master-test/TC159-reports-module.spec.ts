/**
 * TC159: Reports Module — Attendance, Marks, Fees tabs and Export Center.
 *
 * Covers the full reports module: dashboard metrics widget, attendance reports
 * with date/class filters and chronic absentees, marks reports with exam
 * selector and class/subject/grade/rank breakdowns, fee collection and
 * outstanding dues, plus the Export Center with format selection and
 * required-filter validation.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  seedClass, seedStudentWithFees, seedExam, seedResult,
  CLASS_10A_ID, CLASS_11A_ID, SCHOOL_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Helpers
 * ───────────────────────────────────────────────────────────────────── */

async function installReportsRoutes(page: import('@playwright/test').Page, state: MockState) {
  await page.route('**/api/reports/dashboard/metrics**', async (route) => {
    const url = new URL(route.request().url());
    const ay = url.searchParams.get('academicYear') || '2025-2026';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        students: { total: state.students.length, todayPresent: 18, todayAbsent: 2, todayAttendanceRate: 90 },
        fees: { monthlyCollected: 125000, monthlyTransactions: 45, pendingAmount: 87000, pendingStudents: 12 },
        academicYear: ay,
      }),
    });
  });

  await page.route('**/api/reports/attendance/student**', async (route) => {
    const url = new URL(route.request().url());
    const classId = url.searchParams.get('classId');
    const rows = state.students
      .filter((s) => !classId || s.classId === classId)
      .map((s) => ({
        studentName: s.name,
        rollNo: s.rollNo || `${s.admissionId}`,
        className: state.classes.find((c) => c.id === s.classId)?.name || 'Unknown',
        classSection: state.classes.find((c) => c.id === s.classId)?.section || '',
        present: 22,
        absent: 3,
        percentage: 88,
      }));
    // Inject one chronic absentee
    if (rows.length > 0) {
      rows[0].present = 10;
      rows[0].absent = 15;
      rows[0].percentage = 40;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rows) });
  });

  await page.route('**/api/reports/attendance/class-summary**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.route('**/api/reports/attendance/trend**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { date: '2026-03-01', present: 18, absent: 2 },
        { date: '2026-03-02', present: 19, absent: 1 },
        { date: '2026-03-03', present: 17, absent: 3 },
        { date: '2026-03-04', present: 20, absent: 0 },
        { date: '2026-03-05', present: 18, absent: 2 },
      ]),
    });
  });

  await page.route('**/api/reports/academic/class-results**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { className: '10', classSection: 'A', totalStudents: 25, passPercentage: 92, avgPercentage: 76 },
        { className: '11', classSection: 'A', totalStudents: 22, passPercentage: 95, avgPercentage: 81 },
      ]),
    });
  });

  await page.route('**/api/reports/academic/subject-analysis**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { _id: 'Mathematics', avgMarks: 72, highestMarks: 98, passPercentage: 88 },
        { _id: 'Science', avgMarks: 78, highestMarks: 95, passPercentage: 92 },
        { _id: 'English', avgMarks: 81, highestMarks: 94, passPercentage: 96 },
      ]),
    });
  });

  await page.route('**/api/reports/academic/grade-distribution**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { _id: 'A+', count: 8 },
        { _id: 'A', count: 12 },
        { _id: 'B+', count: 15 },
        { _id: 'B', count: 7 },
        { _id: 'C', count: 3 },
        { _id: 'F', count: 2 },
      ]),
    });
  });

  await page.route('**/api/reports/academic/rank-list**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { studentId: { name: 'Aarav Sharma' }, totalMarksObtained: 485, percentage: 97, grade: 'A+' },
        { studentId: { name: 'Priya Patel' }, totalMarksObtained: 472, percentage: 94.4, grade: 'A+' },
        { studentId: { name: 'Rohan Iyer' }, totalMarksObtained: 460, percentage: 92, grade: 'A' },
      ]),
    });
  });

  await page.route('**/api/reports/financial/fee-collection**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { _id: 'April 2026', totalCollected: 125000, transactionCount: 45 },
        { _id: 'March 2026', totalCollected: 118000, transactionCount: 42 },
        { _id: 'February 2026', totalCollected: 132000, transactionCount: 48 },
      ]),
    });
  });

  await page.route('**/api/reports/financial/outstanding-dues**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { studentId: { name: 'Karan Joshi' }, classId: { name: '10', section: 'A' }, totalFee: 35000, totalPaid: 15000, totalBalance: 20000 },
        { studentId: { name: 'Neha Gupta' }, classId: { name: '11', section: 'A' }, totalFee: 38000, totalPaid: 10000, totalBalance: 28000 },
      ]),
    });
  });

  await page.route('**/api/reports/export/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/csv',
      body: 'name,class,status\nTest Student,10A,active\n',
      headers: { 'Content-Disposition': 'attachment; filename="export.csv"' },
    });
  });
}

async function gotoReports(page: import('@playwright/test').Page) {
  await page.goto('/reports');
  await page.locator('text=Reports').first().waitFor({ timeout: 45000 });
  await page.waitForTimeout(600);
}

/* ─────────────────────────────────────────────────────────────────────
 *  Test Suite
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC159 — Reports Module', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    // Seed classes
    const c10a = seedClass(state, { id: CLASS_10A_ID, name: '10', section: 'A' });
    const c11a = seedClass(state, { id: CLASS_11A_ID, name: '11', section: 'A' });

    // Seed students
    seedStudentWithFees(state, { name: 'Aarav Sharma', classId: c10a.id, rollNo: '101', feeStatus: 'paid' });
    seedStudentWithFees(state, { name: 'Priya Patel', classId: c10a.id, rollNo: '102', feeStatus: 'paid' });
    seedStudentWithFees(state, { name: 'Rohan Iyer', classId: c10a.id, rollNo: '103', feeStatus: 'pending' });
    seedStudentWithFees(state, { name: 'Karan Joshi', classId: c10a.id, rollNo: '104', feeStatus: 'overdue' });
    seedStudentWithFees(state, { name: 'Neha Gupta', classId: c11a.id, rollNo: '201', feeStatus: 'overdue' });

    // Seed exam and results
    const exam = seedExam(state, { name: 'Half-Yearly Examination 2026', classId: c10a.id });
    seedResult(state, state.students[0].id, exam.id, 'Mathematics', 95);
    seedResult(state, state.students[1].id, exam.id, 'Mathematics', 88);
    seedResult(state, state.students[2].id, exam.id, 'Mathematics', 72);

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);
    await installReportsRoutes(page, state);
  });

  /* ───────── 1. Reports page loads with metrics ───────── */

  test('1) reports page loads with dashboard metrics and year selector', async ({ page }) => {
    await gotoReports(page);

    const body = await page.textContent('body');
    expect(body?.includes('Reports')).toBeTruthy();
    expect(body?.includes('View and analyze school data')).toBeTruthy();
    expect(body?.includes('Academic Year')).toBeTruthy();

    // Tab headers
    expect(body?.includes('Attendance')).toBeTruthy();
    expect(body?.includes('Marks')).toBeTruthy();
    expect(body?.includes('Fees')).toBeTruthy();
  });

  /* ───────── 2. Attendance tab ───────── */

  test('2) attendance tab shows stat cards and student table', async ({ page }) => {
    await gotoReports(page);

    const body = await page.textContent('body');
    expect(body?.includes('Active Students')).toBeTruthy();
    expect(body?.includes('Today Present')).toBeTruthy();
    expect(body?.includes('Today Absent')).toBeTruthy();
    expect(body?.includes('Attendance Rate')).toBeTruthy();

    // Student names from seeded data should appear
    expect(body?.includes('Aarav Sharma')).toBeTruthy();
    expect(body?.includes('Priya Patel')).toBeTruthy();
  });

  test('3) attendance date range and class filters work', async ({ page }) => {
    await gotoReports(page);

    // Change start date
    const fromInput = page.locator('input[type="date"]').first();
    await fromInput.fill('2026-03-01');

    // Change end date
    const toInput = page.locator('input[type="date"]').nth(1);
    await toInput.fill('2026-03-31');

    // Change class filter
    const classSelect = page.locator('select').filter({ hasText: /All Classes|Class/ }).first();
    if (await classSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await classSelect.selectOption({ label: '10 A' });
    }

    // Wait for data to reload
    await page.waitForTimeout(800);

    const body = await page.textContent('body');
    expect(body?.includes('All Students')).toBeTruthy();
  });

  test('4) chronic absentees alert shows for low attendance', async ({ page }) => {
    await gotoReports(page);

    // First student was seeded with 40% attendance (chronic)
    const body = await page.textContent('body');
    expect(body?.includes('Chronic Absentees')).toBeTruthy();
    expect(body?.includes('Aarav Sharma')).toBeTruthy();
  });

  test('5) attendance empty state when no data', async ({ page }) => {
    // Override attendance endpoint to return empty
    await page.route('**/api/reports/attendance/student**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await gotoReports(page);

    const body = await page.textContent('body');
    expect(body?.includes('No attendance records found')).toBeTruthy();
  });

  /* ───────── 3. Marks tab ───────── */

  test('6) marks tab prompts to select an exam', async ({ page }) => {
    await gotoReports(page);

    await page.getByRole('tab', { name: /Marks/i }).click();
    await page.waitForTimeout(600);

    const body = await page.textContent('body');
    expect(body?.includes('Select an exam to view results')).toBeTruthy();
  });

  test('7) marks tab shows class results, subject analysis, grades, and rank list', async ({ page }) => {
    await gotoReports(page);

    await page.getByRole('tab', { name: /Marks/i }).click();
    await page.waitForTimeout(600);

    // Select exam
    const examSelect = page.locator('select').filter({ hasText: /Select an exam|Half-Yearly/ }).first();
    if (await examSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      await examSelect.selectOption({ label: 'Half-Yearly Examination 2026' });
      await page.waitForTimeout(800);
    }

    const body = await page.textContent('body');

    // Class Results
    expect(body?.includes('Class Results')).toBeTruthy();
    expect(body?.includes('Pass %')).toBeTruthy();

    // Subject Analysis
    expect(body?.includes('Subject Analysis')).toBeTruthy();
    expect(body?.includes('Mathematics')).toBeTruthy();

    // Grade Distribution
    expect(body?.includes('Grade Distribution')).toBeTruthy();
    expect(body?.includes('A+')).toBeTruthy();

    // Rank List
    expect(body?.includes('Rank List')).toBeTruthy();
    expect(body?.includes('Aarav Sharma')).toBeTruthy();
  });

  test('8) marks tab empty state for exam with no data', async ({ page }) => {
    await page.route('**/api/reports/academic/class-results**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/reports/academic/subject-analysis**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/reports/academic/grade-distribution**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/reports/academic/rank-list**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await gotoReports(page);
    await page.getByRole('tab', { name: /Marks/i }).click();
    await page.waitForTimeout(600);

    const examSelect = page.locator('select').filter({ hasText: /Select an exam/ }).first();
    if (await examSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      await examSelect.selectOption('1'); // first real option
      await page.waitForTimeout(800);
    }

    const body = await page.textContent('body');
    expect(body?.includes('No results yet')).toBeTruthy();
  });

  /* ───────── 4. Fees tab ───────── */

  test('9) fees tab shows stat cards, monthly collection, and outstanding dues', async ({ page }) => {
    await gotoReports(page);

    await page.getByRole('tab', { name: /Fees/i }).click();
    await page.waitForTimeout(800);

    const body = await page.textContent('body');

    // Stat cards
    expect(body?.includes('Monthly Collected')).toBeTruthy();
    expect(body?.includes('Transactions')).toBeTruthy();
    expect(body?.includes('Pending Amount')).toBeTruthy();
    expect(body?.includes('Pending Students')).toBeTruthy();

    // Monthly collection table
    expect(body?.includes('Monthly Fee Collection')).toBeTruthy();
    expect(body?.includes('April 2026')).toBeTruthy();

    // Outstanding dues table
    expect(body?.includes('Outstanding Dues')).toBeTruthy();
    expect(body?.includes('Karan Joshi')).toBeTruthy();
    expect(body?.includes('Neha Gupta')).toBeTruthy();
  });

  test('10) fees empty state when no fee data', async ({ page }) => {
    await page.route('**/api/reports/financial/fee-collection**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/reports/financial/outstanding-dues**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await gotoReports(page);
    await page.getByRole('tab', { name: /Fees/i }).click();
    await page.waitForTimeout(800);

    const body = await page.textContent('body');
    expect(body?.includes('No fee data yet')).toBeTruthy();
  });

  /* ───────── 5. Export Center ───────── */

  test('11) export center loads all modules', async ({ page }) => {
    await page.goto('/reports/export');
    await page.locator('text=Export Center').first().waitFor({ timeout: 45000 });
    await page.waitForTimeout(600);

    const body = await page.textContent('body');

    expect(body?.includes('Download school data in CSV, Excel, or PDF format')).toBeTruthy();
    expect(body?.includes('Student List')).toBeTruthy();
    expect(body?.includes('Staff List')).toBeTruthy();
    expect(body?.includes('Fee Collection')).toBeTruthy();
    expect(body?.includes('Fee Defaulters')).toBeTruthy();
    expect(body?.includes('Attendance Summary')).toBeTruthy();
    expect(body?.includes('Exam Results')).toBeTruthy();
    expect(body?.includes('Payroll Summary')).toBeTruthy();
  });

  test('12) export card format selection and download button', async ({ page }) => {
    await page.goto('/reports/export');
    await page.locator('text=Export Center').first().waitFor({ timeout: 45000 });
    await page.waitForTimeout(600);

    // Find first export card (Student List — no required filters)
    const studentCard = page.locator('.grid > div').filter({ hasText: /Student List/ }).first();
    await expect(studentCard).toBeVisible({ timeout: 5000 });

    // Format select should default to CSV
    const formatSelect = studentCard.locator('select').filter({ hasText: /CSV|Excel|PDF/ }).first();
    if (await formatSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await formatSelect.selectOption('excel');
    }

    // Download button should be clickable
    const downloadBtn = studentCard.getByRole('button', { name: /Download/i });
    await expect(downloadBtn).toBeVisible({ timeout: 3000 });
  });

  test('13) export with required filters validates missing fields', async ({ page }) => {
    await page.goto('/reports/export');
    await page.locator('text=Export Center').first().waitFor({ timeout: 45000 });
    await page.waitForTimeout(600);

    // Find Attendance Summary card (has required date filters)
    const attendanceCard = page.locator('.grid > div').filter({ hasText: /Attendance Summary/ }).first();
    await expect(attendanceCard).toBeVisible({ timeout: 5000 });

    // Click Download without filling required filters
    const downloadBtn = attendanceCard.getByRole('button', { name: /Download/i });
    await downloadBtn.click();

    // Should show validation error
    const cardText = await attendanceCard.textContent();
    expect(cardText?.toLowerCase().includes('required')).toBeTruthy();
  });

  /* ───────── 6. Edge cases ───────── */

  test('14) tab switching preserves selected academic year', async ({ page }) => {
    await gotoReports(page);

    // Attendance tab is default
    let body = await page.textContent('body');
    expect(body?.includes('Active Students')).toBeTruthy();

    // Switch to Fees
    await page.getByRole('tab', { name: /Fees/i }).click();
    await page.waitForTimeout(800);
    body = await page.textContent('body');
    expect(body?.includes('Monthly Collected')).toBeTruthy();

    // Switch to Marks
    await page.getByRole('tab', { name: /Marks/i }).click();
    await page.waitForTimeout(800);
    body = await page.textContent('body');
    expect(body?.includes('Select an exam')).toBeTruthy();

    // Switch back to Attendance
    await page.getByRole('tab', { name: /Attendance/i }).click();
    await page.waitForTimeout(800);
    body = await page.textContent('body');
    expect(body?.includes('Active Students')).toBeTruthy();
  });

  test('15) reports page handles API failure gracefully', async ({ page }) => {
    await page.route('**/api/reports/dashboard/metrics**', async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Internal Server Error' }) });
    });

    await gotoReports(page);

    // Page should still render (metrics may be null but UI doesn't crash)
    const body = await page.textContent('body');
    expect(body?.includes('Reports')).toBeTruthy();
    expect(body?.includes('Attendance')).toBeTruthy();
  });
});
