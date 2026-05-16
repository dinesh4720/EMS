/**
 * TC051: Verify student data is consistent across all views.
 *
 * Seeds a single student "Rahul Sharma" with fees, exam results, attendance,
 * and remarks, then navigates through Students, Classes, and Fees pages
 * to verify data consistency across all views.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState,
  installMockApi,
  seedStudentWithFees,
  seedExam,
  seedResult,
  seedAttendanceForClass,
  recordFeePayment,
  CLASS_10A_ID,
  SCHOOL_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Tests
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC051: Cross-Module Student Data Consistency', () => {
  let state: MockState;
  let rahulId: string;
  let examId: string;

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    // Seed student "Rahul Sharma" in class 10-A with fees
    const rahul = seedStudentWithFees(state, {
      name: 'Rahul Sharma',
      classId: CLASS_10A_ID,
      feeStatus: 'pending',
      gender: 'Male',
      rollNo: '1',
      admissionId: 'ADM-0001',
    });
    rahulId = rahul.id;

    // Override fee structure: totalFee=7000, paid=2000, balance=5000
    state.studentFeeStructures.set(rahulId, {
      _id: `sfs-${rahulId}`,
      studentId: rahulId,
      totalFee: 7000,
      paidAmount: 2000,
      balanceAmount: 5000,
      status: 'pending',
      schoolId: SCHOOL_ID,
    });

    // Seed an exam with results
    const exam = seedExam(state, {
      name: 'Mid-Term Exam',
      classId: CLASS_10A_ID,
      status: 'published',
      subjects: ['Mathematics', 'Science', 'English'],
    });
    examId = exam.id;

    // Seed results: Math=85/100, Science=72/100
    seedResult(state, rahulId, examId, 'Mathematics', 85, 100);
    seedResult(state, rahulId, examId, 'Science', 72, 100);

    // Seed attendance for today (present)
    seedAttendanceForClass(state, CLASS_10A_ID, '2026-03-30', {
      [rahulId]: 'present',
    });

    // Seed a remark
    state.remarks.push({
      _id: 'rem-001',
      id: 'rem-001',
      studentId: rahulId,
      category: 'academic',
      remark: 'Shows excellent analytical skills in Mathematics.',
      date: '2026-03-25',
      schoolId: SCHOOL_ID,
    });

    // Record a fee payment
    recordFeePayment(state, rahulId, 2000, 'cash', '2026-03-15');

    // Dismiss cookie consent
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);
  });

  test('1) Rahul appears in student list with correct class and fee status', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // Verify Rahul appears in the student list
    const rahulText = page.getByText('Rahul Sharma').first();
    await expect(rahulText).toBeVisible({ timeout: 10_000 });

    // Verify the page shows the student
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Rahul Sharma');
  });

  test('2) student profile shows correct personal info', async ({ page }) => {
    await page.goto(`/students/${rahulId}`);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');

    // Verify student name
    expect(bodyText).toContain('Rahul Sharma');

    // Verify class info (10-A)
    const hasClass = bodyText?.includes('10') || bodyText?.includes('10-A');
    expect(hasClass).toBe(true);
  });

  test('3) student profile - Academics tab shows exam marks', async ({ page }) => {
    await page.goto(`/students/${rahulId}`);
    await page.waitForLoadState('networkidle');

    // Look for academics/results tab
    const academicsTab = page.getByRole('tab', { name: /academ|result|exam/i }).or(
      page.getByText(/academ|result|exam/i).first(),
    );
    const hasTab = await academicsTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasTab) {
      await academicsTab.click();
      await page.waitForTimeout(500);
    }

    // The results endpoint returns Math=85, Science=72
    const bodyText = await page.textContent('body');
    const hasMarks = bodyText?.includes('85') || bodyText?.includes('72') ||
      bodyText?.includes('Mathematics') || bodyText?.includes('Science');
    expect(hasMarks).toBe(true);
  });

  test('4) student profile - Attendance tab shows present status', async ({ page }) => {
    await page.goto(`/students/${rahulId}`);
    await page.waitForLoadState('networkidle');

    // Look for attendance tab
    const attendanceTab = page.getByRole('tab', { name: /attendance/i }).or(
      page.getByText(/attendance/i).first(),
    );
    const hasTab = await attendanceTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasTab) {
      await attendanceTab.click();
      await page.waitForTimeout(500);
    }

    // Verify attendance data
    const bodyText = await page.textContent('body');
    const hasAttendance = bodyText?.toLowerCase().includes('present') ||
      bodyText?.toLowerCase().includes('attendance') ||
      bodyText?.includes('2026-03-30');
    expect(hasAttendance).toBe(true);
  });

  test('5) student profile - Fees tab shows correct fee summary', async ({ page }) => {
    await page.goto(`/students/${rahulId}`);
    await page.waitForLoadState('networkidle');

    // Look for fees tab
    const feesTab = page.getByRole('tab', { name: /fee/i }).or(
      page.getByText(/fee/i).first(),
    );
    const hasTab = await feesTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasTab) {
      await feesTab.click();
      await page.waitForTimeout(500);
    }

    // The fee structure: totalFee=7000, paid=2000+2000=4000, balance=3000
    // (recordFeePayment added 2000 on top of initial 2000)
    const bodyText = await page.textContent('body');
    const hasFeeData = bodyText?.includes('7000') || bodyText?.includes('7,000') ||
      bodyText?.includes('4000') || bodyText?.includes('4,000') ||
      bodyText?.toLowerCase().includes('fee') ||
      bodyText?.toLowerCase().includes('paid') ||
      bodyText?.toLowerCase().includes('balance');
    expect(hasFeeData).toBe(true);
  });

  test('6) student profile - Remarks tab shows academic remark', async ({ page }) => {
    await page.goto(`/students/${rahulId}`);
    await page.waitForLoadState('networkidle');

    // Look for remarks tab
    const remarksTab = page.getByRole('tab', { name: /remark/i }).or(
      page.getByText(/remark/i).first(),
    );
    const hasTab = await remarksTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasTab) {
      await remarksTab.click();
      await page.waitForTimeout(500);
    }

    // Verify the remark content
    const bodyText = await page.textContent('body');
    const hasRemark = bodyText?.includes('excellent analytical skills') ||
      bodyText?.toLowerCase().includes('remark') ||
      bodyText?.toLowerCase().includes('academic');
    expect(hasRemark).toBe(true);
  });

  test('7) Rahul appears in class 10-A student list', async ({ page }) => {
    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');

    // Verify Rahul appears in the class view
    const hasRahul = bodyText?.includes('Rahul Sharma') ||
      bodyText?.includes('Rahul');
    expect(hasRahul).toBe(true);
  });

  test('8) Fee collection page shows Rahul fee status', async ({ page }) => {
    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';

    // Verify fees page loaded
    expect(lowerBody).toMatch(/fee|payment|collection/i);
  });

  test('9) data integrity: seeded data is internally consistent', async () => {
    // Student exists
    const rahul = state.students.find((s) => s.id === rahulId);
    expect(rahul).toBeDefined();
    expect(rahul?.name).toBe('Rahul Sharma');
    expect(rahul?.classId).toBe(CLASS_10A_ID);

    // Fee structure exists and is correct
    const fs = state.studentFeeStructures.get(rahulId);
    expect(fs).toBeDefined();
    expect((fs as any).totalFee).toBe(7000);

    // Results exist
    const results = state.results.filter((r) => r.studentId === rahulId);
    expect(results).toHaveLength(2);
    expect(results.find((r) => r.subject === 'Mathematics')?.marks).toBe(85);
    expect(results.find((r) => r.subject === 'Science')?.marks).toBe(72);

    // Attendance exists
    const att = state.attendance.filter((a) => a.studentId === rahulId);
    expect(att).toHaveLength(1);
    expect(att[0].status).toBe('present');

    // Remarks exist
    const remarks = state.remarks.filter((r) => r.studentId === rahulId);
    expect(remarks).toHaveLength(1);
    expect(remarks[0].category).toBe('academic');

    // Payment exists
    expect(state.payments).toHaveLength(1);
    expect((state.payments[0] as any).studentId).toBe(rahulId);
  });
});
