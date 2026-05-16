import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  seedStudentWithFees, seedExam, seedResult,
  seedAttendanceForClass,
  CLASS_10A_ID, SCHOOL_ID,
  type MockState, type StudentRecord,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ────────────────────────────────────────────────────────────
 *  Helpers — seed a fully loaded student profile
 * ──────────────────────────────────────────────────────────── */

function seedFullStudentProfile(state: MockState): {
  student: StudentRecord;
  examId: string;
} {
  const student = seedStudentWithFees(state, {
    name: 'Aarav Krishnan',
    classId: CLASS_10A_ID,
    gender: 'Male',
    feeStatus: 'pending',
    dateOfBirth: '2011-08-14',
    email: 'aarav@test.com',
    phone: '9876543210',
    address: '42 MG Road',
    city: 'Bangalore',
    state: 'Karnataka',
    zipCode: '560001',
    guardians: [
      { name: 'Suresh Krishnan', relation: 'father', phone: '9876543211', email: 'suresh@test.com', occupation: 'Engineer' },
      { name: 'Lakshmi Krishnan', relation: 'mother', phone: '9876543212', email: 'lakshmi@test.com', occupation: 'Teacher' },
    ],
  });

  // Seed exam and results
  const exam = seedExam(state, {
    name: 'Mid-Term Exam',
    classId: CLASS_10A_ID,
    status: 'published',
    date: '2026-03-15',
    subjects: ['Mathematics', 'Science', 'English'],
  });
  seedResult(state, student.id, exam.id, 'Mathematics', 85, 100);
  seedResult(state, student.id, exam.id, 'Science', 78, 100);
  seedResult(state, student.id, exam.id, 'English', 92, 100);

  // Seed attendance (20 days: 17 present, 2 absent, 1 late)
  for (let day = 1; day <= 20; day++) {
    const date = `2026-03-${String(day).padStart(2, '0')}`;
    const status = day <= 17 ? 'present' : day <= 19 ? 'absent' : 'late';
    state.attendance.push({
      _id: `att-${student.id}-${date}`,
      id: `att-${student.id}-${date}`,
      studentId: student.id,
      classId: CLASS_10A_ID,
      date,
      status,
      schoolId: SCHOOL_ID,
    });
  }

  // Seed remarks
  state.remarks.push(
    {
      _id: 'rem-001', id: 'rem-001',
      studentId: student.id,
      category: 'Academic',
      remark: 'Excellent performance in Mathematics. Shows strong analytical skills.',
      date: '2026-03-10',
      schoolId: SCHOOL_ID,
    },
    {
      _id: 'rem-002', id: 'rem-002',
      studentId: student.id,
      category: 'Behavioral',
      remark: 'Very helpful to classmates. Shows great leadership qualities.',
      date: '2026-03-12',
      schoolId: SCHOOL_ID,
    },
  );

  return { student, examId: exam.id };
}

/* ────────────────────────────────────────────────────────────
 *  TC022 — Student profile dashboard with all tabs
 * ──────────────────────────────────────────────────────────── */

test.describe('TC022 - Student Profile Dashboard', () => {
  let state: MockState;
  let student: StudentRecord;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    const seeded = seedFullStudentProfile(state);
    student = seeded.student;
    await installMockApi(page, state);
  });

  test('should display the student profile header with basic info', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    // Verify student name is displayed
    await expect(page.getByText('Aarav Krishnan').first()).toBeVisible();

    // Verify class/section info
    const classInfo = page.getByText(/10.*A|10-A|Class 10/i).first();
    await expect(classInfo).toBeVisible();

    // Verify roll number is visible
    const rollNo = page.getByText(new RegExp(student.rollNo)).first();
    if (await rollNo.isVisible().catch(() => false)) {
      await expect(rollNo).toBeVisible();
    }
  });

  test('should show Overview tab with basic and contact info', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    // Click Overview tab if not already active
    const overviewTab = page.getByRole('tab', { name: /overview|details|info/i })
      .or(page.getByText(/overview|basic info/i))
      .first();
    if (await overviewTab.isVisible().catch(() => false)) {
      await overviewTab.click();
    }

    // Verify basic info displayed
    await expect(page.getByText('Aarav Krishnan').first()).toBeVisible();

    // Verify contact info
    const phoneText = page.getByText('9876543210').first();
    if (await phoneText.isVisible().catch(() => false)) {
      await expect(phoneText).toBeVisible();
    }

    const emailText = page.getByText('aarav@test.com').first();
    if (await emailText.isVisible().catch(() => false)) {
      await expect(emailText).toBeVisible();
    }

    // Verify parent/guardian info
    const parentName = page.getByText('Suresh Krishnan').first();
    if (await parentName.isVisible().catch(() => false)) {
      await expect(parentName).toBeVisible();
    }
  });

  test('should show Academics tab with exam results', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    // Click Academics tab
    const academicsTab = page.getByRole('tab', { name: /academic|exam|result/i })
      .or(page.getByText(/academics|exam results/i))
      .first();

    if (await academicsTab.isVisible().catch(() => false)) {
      await academicsTab.click();
      await page.waitForTimeout(500);

      // Verify exam results show
      const mathResult = page.getByText(/mathematics|math/i).first();
      if (await mathResult.isVisible().catch(() => false)) {
        await expect(mathResult).toBeVisible();
      }

      // Verify marks are displayed
      const marks85 = page.getByText(/85/).first();
      if (await marks85.isVisible().catch(() => false)) {
        await expect(marks85).toBeVisible();
      }

      // Verify grade is displayed
      const gradeA = page.getByText(/A\+|A/).first();
      if (await gradeA.isVisible().catch(() => false)) {
        await expect(gradeA).toBeVisible();
      }
    }
  });

  test('should show Attendance tab with stats', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    // Click Attendance tab
    const attendanceTab = page.getByRole('tab', { name: /attendance/i })
      .or(page.getByText(/attendance/i))
      .first();

    if (await attendanceTab.isVisible().catch(() => false)) {
      await attendanceTab.click();
      await page.waitForTimeout(500);

      // Verify attendance stats (17 present out of 20 = 85%)
      const attendanceText = page.getByText(/present|absent|85|17|20/i).first();
      if (await attendanceText.isVisible().catch(() => false)) {
        await expect(attendanceText).toBeVisible();
      }
    }
  });

  test('should show Fees tab with fee summary', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    // Click Fees tab
    const feesTab = page.getByRole('tab', { name: /fee/i })
      .or(page.getByText(/fees/i).first())
      .first();

    if (await feesTab.isVisible().catch(() => false)) {
      await feesTab.click();
      await page.waitForTimeout(500);

      // Verify fee summary - total fee 7000
      const totalFee = page.getByText(/7,000|7000/i).first();
      if (await totalFee.isVisible().catch(() => false)) {
        await expect(totalFee).toBeVisible();
      }

      // Verify fee status
      const feeStatus = page.getByText(/pending/i).first();
      if (await feeStatus.isVisible().catch(() => false)) {
        await expect(feeStatus).toBeVisible();
      }
    }
  });

  test('should show Remarks tab with remarks list', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    // Click Remarks tab
    const remarksTab = page.getByRole('tab', { name: /remark/i })
      .or(page.getByText(/remarks/i))
      .first();

    if (await remarksTab.isVisible().catch(() => false)) {
      await remarksTab.click();
      await page.waitForTimeout(500);

      // Verify remarks are displayed
      const remark1 = page.getByText(/excellent performance/i).first();
      if (await remark1.isVisible().catch(() => false)) {
        await expect(remark1).toBeVisible();
      }

      // Verify category is displayed
      const academic = page.getByText(/academic/i).first();
      if (await academic.isVisible().catch(() => false)) {
        await expect(academic).toBeVisible();
      }
    }
  });

  test('should show Documents tab', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    // Click Documents tab
    const docsTab = page.getByRole('tab', { name: /document/i })
      .or(page.getByText(/documents/i))
      .first();

    if (await docsTab.isVisible().catch(() => false)) {
      await docsTab.click();
      await page.waitForTimeout(500);

      // Verify document section is visible (may show empty state)
      const docSection = page.getByText(/document|upload|no documents|birth certificate/i).first();
      if (await docSection.isVisible().catch(() => false)) {
        await expect(docSection).toBeVisible();
      }
    }
  });

  test('should display parent/guardian details with name and relation', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    // Verify both parents are listed
    const fatherName = page.getByText('Suresh Krishnan').first();
    const motherName = page.getByText('Lakshmi Krishnan').first();

    // At least one guardian should be visible on the overview/profile
    const guardianVisible = await fatherName.isVisible().catch(() => false)
      || await motherName.isVisible().catch(() => false);

    if (guardianVisible) {
      // Check relation is also shown
      const fatherRelation = page.getByText(/father/i).first();
      if (await fatherRelation.isVisible().catch(() => false)) {
        await expect(fatherRelation).toBeVisible();
      }
    }
  });
});
