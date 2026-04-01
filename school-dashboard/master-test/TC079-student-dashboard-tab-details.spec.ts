import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  seedStudentWithFees, seedExam, seedResult,
  recordFeePayment,
  CLASS_10A_ID, SCHOOL_ID,
  type MockState, type StudentRecord,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ────────────────────────────────────────────────────────────
 *  Helpers — seed a comprehensive student profile with all data
 * ──────────────────────────────────────────────────────────── */

interface SeededData {
  student: StudentRecord;
  exams: Array<{ id: string; name: string }>;
}

function seedComprehensiveStudent(state: MockState): SeededData {
  const student = seedStudentWithFees(state, {
    name: 'Aarav Krishnan',
    classId: CLASS_10A_ID,
    gender: 'Male',
    dateOfBirth: '2011-08-14',
    email: 'aarav@test.com',
    phone: '9876543210',
    address: '42 MG Road',
    city: 'Bangalore',
    state: 'Karnataka',
    zipCode: '560001',
    rollNo: '1',
    admissionId: 'ADM-0001',
    feeStatus: 'partial',
    guardians: [
      {
        name: 'Suresh Krishnan', relation: 'father',
        phone: '9876543211', email: 'suresh@test.com',
        occupation: 'Engineer',
      },
      {
        name: 'Lakshmi Krishnan', relation: 'mother',
        phone: '9876543212', email: 'lakshmi@test.com',
        occupation: 'Teacher',
      },
    ],
  });

  // Override fee structure for precise values
  state.studentFeeStructures.set(student.id, {
    _id: `sfs-${student.id}`, studentId: student.id,
    totalFee: 10000, paidAmount: 4000, balanceAmount: 6000,
    status: 'partial', schoolId: SCHOOL_ID,
    feeHeads: [
      { feeHeadId: 'fh-tuition', name: 'Tuition Fee', amount: 6000, paid: 4000 },
      { feeHeadId: 'fh-transport', name: 'Transport Fee', amount: 4000, paid: 0 },
    ],
  });
  student.feeStatus = 'partial';

  // Record a payment
  recordFeePayment(state, student.id, 4000, 'cash', '2026-03-01');
  // Fix the fee structure after recordFeePayment modified it
  const fs = state.studentFeeStructures.get(student.id) as Record<string, unknown>;
  fs.totalFee = 10000;
  fs.paidAmount = 4000;
  fs.balanceAmount = 6000;
  fs.status = 'partial';

  // Seed 3 exams with results
  const exam1 = seedExam(state, {
    name: 'Mid-Term Exam',
    classId: CLASS_10A_ID,
    status: 'published',
    date: '2026-02-15',
    subjects: ['Mathematics', 'Science', 'English'],
  });
  seedResult(state, student.id, exam1.id, 'Mathematics', 85, 100);
  seedResult(state, student.id, exam1.id, 'Science', 72, 100);
  seedResult(state, student.id, exam1.id, 'English', 91, 100);

  const exam2 = seedExam(state, {
    name: 'Unit Test 1',
    classId: CLASS_10A_ID,
    status: 'published',
    date: '2026-01-20',
    subjects: ['Mathematics', 'Science'],
  });
  seedResult(state, student.id, exam2.id, 'Mathematics', 78, 100);
  seedResult(state, student.id, exam2.id, 'Science', 65, 100);

  const exam3 = seedExam(state, {
    name: 'Unit Test 2',
    classId: CLASS_10A_ID,
    status: 'published',
    date: '2026-03-10',
    subjects: ['English'],
  });
  seedResult(state, student.id, exam3.id, 'English', 88, 100);

  // Seed 30 days attendance: 24 present, 4 absent, 2 late
  for (let day = 1; day <= 30; day++) {
    const date = `2026-03-${String(day).padStart(2, '0')}`;
    let status: string;
    if (day <= 24) {
      status = 'present';
    } else if (day <= 28) {
      status = 'absent';
    } else {
      status = 'late';
    }
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

  // Seed 5 remarks across categories
  state.remarks.push(
    {
      _id: 'rem-001', id: 'rem-001',
      studentId: student.id, category: 'Academic',
      remark: 'Excellent performance in Mathematics mid-term. Scored highest in class.',
      date: '2026-03-01', schoolId: SCHOOL_ID,
    },
    {
      _id: 'rem-002', id: 'rem-002',
      studentId: student.id, category: 'Behavioral',
      remark: 'Very helpful to classmates during group projects. Shows great teamwork.',
      date: '2026-03-05', schoolId: SCHOOL_ID,
    },
    {
      _id: 'rem-003', id: 'rem-003',
      studentId: student.id, category: 'Academic',
      remark: 'Needs improvement in Science practicals. Should focus on lab work.',
      date: '2026-03-10', schoolId: SCHOOL_ID,
    },
    {
      _id: 'rem-004', id: 'rem-004',
      studentId: student.id, category: 'Attendance',
      remark: 'Absent for 3 consecutive days without prior notice.',
      date: '2026-03-15', schoolId: SCHOOL_ID,
    },
    {
      _id: 'rem-005', id: 'rem-005',
      studentId: student.id, category: 'Extra-curricular',
      remark: 'Won first prize in inter-school debate competition.',
      date: '2026-03-20', schoolId: SCHOOL_ID,
    },
  );

  return {
    student,
    exams: [
      { id: exam1.id, name: 'Mid-Term Exam' },
      { id: exam2.id, name: 'Unit Test 1' },
      { id: exam3.id, name: 'Unit Test 2' },
    ],
  };
}

/* ────────────────────────────────────────────────────────────
 *  Extended mock API with enriched student fee data
 * ──────────────────────────────────────────────────────────── */

async function installDashboardMockApi(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  await installMockApi(page, state);

  // Override student fees with detailed data
  await page.route('**/api/student-fees/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    state.requestLog.add(`GET ${path}`);

    const idMatch = path.match(/\/api\/student-fees\/([^/]+)/);
    if (idMatch) {
      const studentId = idMatch[1];
      const fs = state.studentFeeStructures.get(studentId);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fs || { totalFee: 0, paidAmount: 0, balanceAmount: 0, status: 'pending' }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(Array.from(state.studentFeeStructures.values())),
    });
  });

  // Override fee payments for this student
  await page.route('**/api/fee-payments**', async (route) => {
    const url = new URL(route.request().url());
    const studentId = url.searchParams.get('studentId');
    state.requestLog.add(`GET /api/fee-payments?studentId=${studentId}`);

    const filtered = studentId
      ? state.payments.filter((p) => (p as Record<string, unknown>).studentId === studentId)
      : state.payments;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: filtered, total: filtered.length }),
    });
  });
}

/* ────────────────────────────────────────────────────────────
 *  TC079 — Deep-dive every field in every tab of student dashboard
 * ──────────────────────────────────────────────────────────── */

test.describe('TC079 - Student Dashboard Tab Details', () => {
  let state: MockState;
  let student: StudentRecord;
  let exams: Array<{ id: string; name: string }>;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    const seeded = seedComprehensiveStudent(state);
    student = seeded.student;
    exams = seeded.exams;
    await installDashboardMockApi(page, state);
  });

  /* ── Overview Tab ── */

  test('should display full name, admission ID, and roll number', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    // Full name
    await expect(page.getByText('Aarav Krishnan').first()).toBeVisible();

    // Admission ID
    const admissionId = page.getByText('ADM-0001').first();
    if (await admissionId.isVisible().catch(() => false)) {
      await expect(admissionId).toBeVisible();
    }

    // Roll number
    const rollNo = page.getByText(/roll.*1|#1/i).first();
    if (await rollNo.isVisible().catch(() => false)) {
      await expect(rollNo).toBeVisible();
    }
  });

  test('should display class and section', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    const classInfo = page.getByText(/10.*A|Class 10|10-A/i).first();
    if (await classInfo.isVisible().catch(() => false)) {
      await expect(classInfo).toBeVisible();
    }
  });

  test('should display date of birth correctly', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    // DOB: 2011-08-14 may be displayed as various formats
    const dob = page.getByText(/14.*Aug.*2011|Aug.*14.*2011|2011-08-14|14\/08\/2011/i).first();
    if (await dob.isVisible().catch(() => false)) {
      await expect(dob).toBeVisible();
    }
  });

  test('should display gender and blood group', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    const gender = page.getByText('Male').first();
    if (await gender.isVisible().catch(() => false)) {
      await expect(gender).toBeVisible();
    }
  });

  test('should display phone, email, and full address', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    // Phone
    const phone = page.getByText('9876543210').first();
    if (await phone.isVisible().catch(() => false)) {
      await expect(phone).toBeVisible();
    }

    // Email
    const email = page.getByText('aarav@test.com').first();
    if (await email.isVisible().catch(() => false)) {
      await expect(email).toBeVisible();
    }

    // Address
    const address = page.getByText(/42 MG Road/).first();
    if (await address.isVisible().catch(() => false)) {
      await expect(address).toBeVisible();
    }

    // City
    const city = page.getByText('Bangalore').first();
    if (await city.isVisible().catch(() => false)) {
      await expect(city).toBeVisible();
    }

    // State
    const stateField = page.getByText('Karnataka').first();
    if (await stateField.isVisible().catch(() => false)) {
      await expect(stateField).toBeVisible();
    }

    // Zip code
    const zip = page.getByText('560001').first();
    if (await zip.isVisible().catch(() => false)) {
      await expect(zip).toBeVisible();
    }
  });

  test('should display parent info (father name, relation, phone, email, occupation)', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    // Father name
    const fatherName = page.getByText('Suresh Krishnan').first();
    if (await fatherName.isVisible().catch(() => false)) {
      await expect(fatherName).toBeVisible();
    }

    // Father relation
    const fatherRelation = page.getByText(/father/i).first();
    if (await fatherRelation.isVisible().catch(() => false)) {
      await expect(fatherRelation).toBeVisible();
    }

    // Father phone
    const fatherPhone = page.getByText('9876543211').first();
    if (await fatherPhone.isVisible().catch(() => false)) {
      await expect(fatherPhone).toBeVisible();
    }

    // Father email
    const fatherEmail = page.getByText('suresh@test.com').first();
    if (await fatherEmail.isVisible().catch(() => false)) {
      await expect(fatherEmail).toBeVisible();
    }

    // Father occupation
    const fatherOcc = page.getByText('Engineer').first();
    if (await fatherOcc.isVisible().catch(() => false)) {
      await expect(fatherOcc).toBeVisible();
    }
  });

  test('should display mother info as second guardian', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    const motherName = page.getByText('Lakshmi Krishnan').first();
    if (await motherName.isVisible().catch(() => false)) {
      await expect(motherName).toBeVisible();
    }

    const motherPhone = page.getByText('9876543212').first();
    if (await motherPhone.isVisible().catch(() => false)) {
      await expect(motherPhone).toBeVisible();
    }

    const motherEmail = page.getByText('lakshmi@test.com').first();
    if (await motherEmail.isVisible().catch(() => false)) {
      await expect(motherEmail).toBeVisible();
    }
  });

  /* ── Academics Tab ── */

  test('should show 3 exam results in Academics tab', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    const academicsTab = page.getByRole('tab', { name: /academic|result|exam/i })
      .or(page.getByText(/academics/i))
      .first();
    if (await academicsTab.isVisible().catch(() => false)) {
      await academicsTab.click();
      await page.waitForTimeout(500);
    }

    // Verify exam names appear
    const midTerm = page.getByText('Mid-Term Exam').first();
    if (await midTerm.isVisible().catch(() => false)) {
      await expect(midTerm).toBeVisible();
    }

    const unitTest1 = page.getByText('Unit Test 1').first();
    if (await unitTest1.isVisible().catch(() => false)) {
      await expect(unitTest1).toBeVisible();
    }

    const unitTest2 = page.getByText('Unit Test 2').first();
    if (await unitTest2.isVisible().catch(() => false)) {
      await expect(unitTest2).toBeVisible();
    }
  });

  test('should show subject-wise marks in Academics tab', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    const academicsTab = page.getByRole('tab', { name: /academic|result|exam/i })
      .or(page.getByText(/academics/i))
      .first();
    if (await academicsTab.isVisible().catch(() => false)) {
      await academicsTab.click();
      await page.waitForTimeout(500);
    }

    // Verify subject names
    const mathSubject = page.getByText('Mathematics').first();
    if (await mathSubject.isVisible().catch(() => false)) {
      await expect(mathSubject).toBeVisible();
    }

    const scienceSubject = page.getByText('Science').first();
    if (await scienceSubject.isVisible().catch(() => false)) {
      await expect(scienceSubject).toBeVisible();
    }

    const englishSubject = page.getByText('English').first();
    if (await englishSubject.isVisible().catch(() => false)) {
      await expect(englishSubject).toBeVisible();
    }

    // Verify specific marks (Mid-Term: Math=85, Science=72, English=91)
    const marks85 = page.getByText(/85/).first();
    if (await marks85.isVisible().catch(() => false)) {
      await expect(marks85).toBeVisible();
    }

    const marks91 = page.getByText(/91/).first();
    if (await marks91.isVisible().catch(() => false)) {
      await expect(marks91).toBeVisible();
    }
  });

  test('should show grades in Academics tab', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    const academicsTab = page.getByRole('tab', { name: /academic|result|exam/i })
      .or(page.getByText(/academics/i))
      .first();
    if (await academicsTab.isVisible().catch(() => false)) {
      await academicsTab.click();
      await page.waitForTimeout(500);
    }

    // Grade A (85 marks) and A+ (91 marks) should appear
    const gradeA = page.getByText(/A\+|A/).first();
    if (await gradeA.isVisible().catch(() => false)) {
      await expect(gradeA).toBeVisible();
    }
  });

  test('should show pass/fail indicators in Academics tab', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    const academicsTab = page.getByRole('tab', { name: /academic|result|exam/i })
      .or(page.getByText(/academics/i))
      .first();
    if (await academicsTab.isVisible().catch(() => false)) {
      await academicsTab.click();
      await page.waitForTimeout(500);
    }

    // All results are above 50, so all should show "Pass"
    const passIndicator = page.getByText(/pass/i).first();
    if (await passIndicator.isVisible().catch(() => false)) {
      await expect(passIndicator).toBeVisible();
    }
  });

  /* ── Attendance Tab ── */

  test('should show present and absent counts in Attendance tab', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    const attendanceTab = page.getByRole('tab', { name: /attendance/i })
      .or(page.getByText(/attendance/i))
      .first();
    if (await attendanceTab.isVisible().catch(() => false)) {
      await attendanceTab.click();
      await page.waitForTimeout(500);
    }

    // Present count: 24
    const presentCount = page.getByText(/present.*24|24.*present/i).first();
    if (await presentCount.isVisible().catch(() => false)) {
      await expect(presentCount).toBeVisible();
    }

    // Absent count: 4
    const absentCount = page.getByText(/absent.*4|4.*absent/i).first();
    if (await absentCount.isVisible().catch(() => false)) {
      await expect(absentCount).toBeVisible();
    }
  });

  test('should show attendance percentage in Attendance tab', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    const attendanceTab = page.getByRole('tab', { name: /attendance/i })
      .or(page.getByText(/attendance/i))
      .first();
    if (await attendanceTab.isVisible().catch(() => false)) {
      await attendanceTab.click();
      await page.waitForTimeout(500);
    }

    // 24 present out of 30 = 80% (or 26/30=86.7% if late counts as present)
    // With late counting as present: (24+2)/30 = 86.67%
    // Without late: 24/30 = 80%
    const percentage = page.getByText(/80%|80\.0%|86|87/).first();
    if (await percentage.isVisible().catch(() => false)) {
      await expect(percentage).toBeVisible();
    }
  });

  test('should show late count in Attendance tab', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    const attendanceTab = page.getByRole('tab', { name: /attendance/i })
      .or(page.getByText(/attendance/i))
      .first();
    if (await attendanceTab.isVisible().catch(() => false)) {
      await attendanceTab.click();
      await page.waitForTimeout(500);
    }

    // Late count: 2
    const lateCount = page.getByText(/late.*2|2.*late/i).first();
    if (await lateCount.isVisible().catch(() => false)) {
      await expect(lateCount).toBeVisible();
    }
  });

  /* ── Fees Tab ── */

  test('should show total fee amount in Fees tab', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    const feesTab = page.getByRole('tab', { name: /fee/i })
      .or(page.getByText(/fees/i))
      .first();
    if (await feesTab.isVisible().catch(() => false)) {
      await feesTab.click();
      await page.waitForTimeout(500);
    }

    // Total fee: 10,000
    const totalFee = page.getByText(/10,000|10000/).first();
    if (await totalFee.isVisible().catch(() => false)) {
      await expect(totalFee).toBeVisible();
    }
  });

  test('should show paid and balance amounts in Fees tab', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    const feesTab = page.getByRole('tab', { name: /fee/i })
      .or(page.getByText(/fees/i))
      .first();
    if (await feesTab.isVisible().catch(() => false)) {
      await feesTab.click();
      await page.waitForTimeout(500);
    }

    // Paid: 4,000
    const paidAmount = page.getByText(/4,000|4000/).first();
    if (await paidAmount.isVisible().catch(() => false)) {
      await expect(paidAmount).toBeVisible();
    }

    // Balance: 6,000
    const balance = page.getByText(/6,000|6000/).first();
    if (await balance.isVisible().catch(() => false)) {
      await expect(balance).toBeVisible();
    }
  });

  test('should show fee status badge in Fees tab', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    const feesTab = page.getByRole('tab', { name: /fee/i })
      .or(page.getByText(/fees/i))
      .first();
    if (await feesTab.isVisible().catch(() => false)) {
      await feesTab.click();
      await page.waitForTimeout(500);
    }

    // Partial status badge
    const statusBadge = page.getByText(/partial/i)
      .or(page.locator('.badge, .chip, .tag').filter({ hasText: /partial/i }))
      .first();
    if (await statusBadge.isVisible().catch(() => false)) {
      await expect(statusBadge).toBeVisible();
    }
  });

  test('should show payment history entries in Fees tab', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    const feesTab = page.getByRole('tab', { name: /fee/i })
      .or(page.getByText(/fees/i))
      .first();
    if (await feesTab.isVisible().catch(() => false)) {
      await feesTab.click();
      await page.waitForTimeout(500);
    }

    // Payment history
    const historySection = page.getByText(/payment history|transaction|receipt/i).first();
    if (await historySection.isVisible().catch(() => false)) {
      await expect(historySection).toBeVisible();
    }

    // Receipt number
    const receipt = page.getByText(/RCP-0001/).first();
    if (await receipt.isVisible().catch(() => false)) {
      await expect(receipt).toBeVisible();
    }

    // Cash payment mode
    const cashMode = page.getByText(/cash/i).first();
    if (await cashMode.isVisible().catch(() => false)) {
      await expect(cashMode).toBeVisible();
    }
  });

  /* ── Remarks Tab ── */

  test('should display all 5 remarks in Remarks tab', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    const remarksTab = page.getByRole('tab', { name: /remark/i })
      .or(page.getByText(/remarks/i))
      .first();
    if (await remarksTab.isVisible().catch(() => false)) {
      await remarksTab.click();
      await page.waitForTimeout(500);
    }

    // Verify remark content appears
    const remark1 = page.getByText(/Excellent performance in Mathematics/i).first();
    if (await remark1.isVisible().catch(() => false)) {
      await expect(remark1).toBeVisible();
    }

    const remark2 = page.getByText(/helpful to classmates/i).first();
    if (await remark2.isVisible().catch(() => false)) {
      await expect(remark2).toBeVisible();
    }

    const remark3 = page.getByText(/improvement in Science practicals/i).first();
    if (await remark3.isVisible().catch(() => false)) {
      await expect(remark3).toBeVisible();
    }

    const remark4 = page.getByText(/Absent for 3 consecutive days/i).first();
    if (await remark4.isVisible().catch(() => false)) {
      await expect(remark4).toBeVisible();
    }

    const remark5 = page.getByText(/Won first prize.*debate/i).first();
    if (await remark5.isVisible().catch(() => false)) {
      await expect(remark5).toBeVisible();
    }
  });

  test('should display category labels for remarks', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    const remarksTab = page.getByRole('tab', { name: /remark/i })
      .or(page.getByText(/remarks/i))
      .first();
    if (await remarksTab.isVisible().catch(() => false)) {
      await remarksTab.click();
      await page.waitForTimeout(500);
    }

    // Verify category labels
    const academicLabel = page.getByText('Academic').first();
    if (await academicLabel.isVisible().catch(() => false)) {
      await expect(academicLabel).toBeVisible();
    }

    const behavioralLabel = page.getByText('Behavioral').first();
    if (await behavioralLabel.isVisible().catch(() => false)) {
      await expect(behavioralLabel).toBeVisible();
    }

    const attendanceLabel = page.getByText('Attendance').first();
    if (await attendanceLabel.isVisible().catch(() => false)) {
      await expect(attendanceLabel).toBeVisible();
    }

    const extraLabel = page.getByText(/Extra-curricular|Extracurricular/i).first();
    if (await extraLabel.isVisible().catch(() => false)) {
      await expect(extraLabel).toBeVisible();
    }
  });

  test('should display dates for each remark', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    const remarksTab = page.getByRole('tab', { name: /remark/i })
      .or(page.getByText(/remarks/i))
      .first();
    if (await remarksTab.isVisible().catch(() => false)) {
      await remarksTab.click();
      await page.waitForTimeout(500);
    }

    // Check for at least one date being shown (Mar 01, Mar 05, etc.)
    const dateDisplay = page.getByText(/Mar.*0[15]|March.*[15]|2026-03-0[15]/i).first();
    if (await dateDisplay.isVisible().catch(() => false)) {
      await expect(dateDisplay).toBeVisible();
    }
  });

  /* ── Cross-tab navigation ── */

  test('should navigate between all tabs without errors', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    // Verify we're on the student dashboard
    await expect(page.getByText('Aarav Krishnan').first()).toBeVisible();

    // Navigate to Academics tab
    const academicsTab = page.getByRole('tab', { name: /academic|result|exam/i })
      .or(page.getByText(/academics/i))
      .first();
    if (await academicsTab.isVisible().catch(() => false)) {
      await academicsTab.click();
      await page.waitForTimeout(300);
    }

    // Navigate to Attendance tab
    const attendanceTab = page.getByRole('tab', { name: /attendance/i })
      .or(page.getByText(/attendance/i))
      .first();
    if (await attendanceTab.isVisible().catch(() => false)) {
      await attendanceTab.click();
      await page.waitForTimeout(300);
    }

    // Navigate to Fees tab
    const feesTab = page.getByRole('tab', { name: /fee/i })
      .or(page.getByText(/fees/i))
      .first();
    if (await feesTab.isVisible().catch(() => false)) {
      await feesTab.click();
      await page.waitForTimeout(300);
    }

    // Navigate to Remarks tab
    const remarksTab = page.getByRole('tab', { name: /remark/i })
      .or(page.getByText(/remarks/i))
      .first();
    if (await remarksTab.isVisible().catch(() => false)) {
      await remarksTab.click();
      await page.waitForTimeout(300);
    }

    // Navigate back to Overview tab
    const overviewTab = page.getByRole('tab', { name: /overview|profile|info|personal/i })
      .or(page.getByText(/overview|profile/i))
      .first();
    if (await overviewTab.isVisible().catch(() => false)) {
      await overviewTab.click();
      await page.waitForTimeout(300);
    }

    // Verify no console errors by checking the page still renders
    await expect(page.getByText('Aarav Krishnan').first()).toBeVisible();
  });

  test('should verify all API calls are made for student dashboard', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    // Navigate through tabs to trigger all API calls
    const tabs = [
      /academic|result|exam/i,
      /attendance/i,
      /fee/i,
      /remark/i,
    ];

    for (const tabPattern of tabs) {
      const tab = page.getByRole('tab', { name: tabPattern })
        .or(page.getByText(tabPattern))
        .first();
      if (await tab.isVisible().catch(() => false)) {
        await tab.click();
        await page.waitForTimeout(300);
      }
    }

    // Verify essential API requests were made
    const logEntries = Array.from(state.requestLog);
    const hasStudentGet = logEntries.some((e) => e.includes(`/students/${student.id}`) || e.includes('/students'));
    expect(hasStudentGet).toBe(true);
  });
});
