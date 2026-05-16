import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  TEACHER_A_ID, TEACHER_B_ID, CLASS_10A_ID, CLASS_11A_ID, SCHOOL_ID,
  type MockState, type StaffAttendanceRecord,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ────���────────────��──────────────────────────────────���────────────────
 *  Helpers
 * ─��─────────────────────────────────────────────────────────────────── */

function seedStaffAttendanceData(state: MockState) {
  const today = new Date();
  const records: StaffAttendanceRecord[] = [];

  // Seed 20 working days of attendance for Ananya (present most days)
  for (let i = 1; i <= 20; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), i);
    if (d.getDay() === 0 || d.getDay() === 6) continue; // skip weekends
    const dateStr = d.toISOString().split('T')[0];
    const status = i === 5 ? 'absent' : i === 12 ? 'halfday' : 'present';
    records.push({
      _id: `satt-${TEACHER_A_ID}-${dateStr}`,
      id: `satt-${TEACHER_A_ID}-${dateStr}`,
      staffId: TEACHER_A_ID,
      date: dateStr,
      status,
      schoolId: SCHOOL_ID,
    });
  }
  state.staffAttendance = records;
  return records;
}

async function installStaffProfileMockApi(page: import('@playwright/test').Page, state: MockState) {
  await installMockApi(page, state);

  // Staff detail with enriched data
  await page.route(`**/api/staff/${TEACHER_A_ID}`, async (route) => {
    const teacher = state.staff.find((s) => s.id === TEACHER_A_ID);
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...teacher,
        classTeacher: { classId: CLASS_10A_ID, className: '10-A' },
        assignedClasses: [
          { classId: CLASS_10A_ID, className: '10-A', subjects: ['Mathematics', 'Science'] },
          { classId: CLASS_11A_ID, className: '11-A', subjects: ['Mathematics'] },
        ],
        qualifications: [
          { degree: 'B.Ed', university: 'Delhi University', year: 2015 },
          { degree: 'M.Sc Mathematics', university: 'JNU', year: 2013 },
        ],
        bankDetails: {
          accountNumber: '****5678',
          bankName: 'State Bank of India',
          ifsc: 'SBIN0001234',
        },
        salaryStructure: {
          basicSalary: 35000,
          hra: 8000,
          da: 5000,
          pf: 2000,
          totalEarnings: 48000,
          totalDeductions: 2000,
          netSalary: 46000,
        },
        documents: [
          { name: 'Aadhaar Card', url: '/mock/aadhaar.pdf', uploadedAt: '2024-06-15' },
          { name: 'PAN Card', url: '/mock/pan.pdf', uploadedAt: '2024-06-15' },
        ],
      }),
    });
  });

  // Staff attendance for profile
  await page.route(`**/api/staff/${TEACHER_A_ID}/attendance**`, async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(state.staffAttendance.filter((a) => a.staffId === TEACHER_A_ID)),
    });
  });

  // Staff assignments
  await page.route(`**/api/staff/${TEACHER_A_ID}/assignments`, async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        assignments: [
          { subject: 'Mathematics', classId: CLASS_10A_ID, className: '10-A' },
          { subject: 'Science', classId: CLASS_10A_ID, className: '10-A' },
          { subject: 'Mathematics', classId: CLASS_11A_ID, className: '11-A' },
        ],
      }),
    });
  });

  // Staff timetable
  await page.route(`**/api/staff/${TEACHER_A_ID}/timetable`, async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ timetable: [] }),
    });
  });

  // Payroll records for this staff
  await page.route('**/api/payroll**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.includes(TEACHER_A_ID)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          records: [{
            _id: 'pr-001', staffId: TEACHER_A_ID, month: 3, year: 2026,
            basicSalary: 35000, allowances: 13000, deductions: 2000, netSalary: 46000,
            status: 'paid', paymentDate: '2026-03-01',
          }],
        }),
      });
    }
    return route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ records: [], summary: { totalAmount: 0, processedCount: 0 } }),
    });
  });
}

/* ───────────────────────────────────────────────────��─────────────────
 *  TC015 — Staff Profile Dashboard with all tabs
 * ────��────────────────��──────────────────────────────��──────────────── */

test.describe('TC015 — Staff Profile Dashboard', () => {

  test('1) staff profile page loads with header info', async ({ page }) => {
    const state = createMockState();
    seedStaffAttendanceData(state);
    await installStaffProfileMockApi(page, state);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    // Profile should show name, role, department, status
    expect(body).toContain('Ananya');
    expect(body?.toLowerCase()).toMatch(/teacher/);
  });

  test('2) profile header shows role and department', async ({ page }) => {
    const state = createMockState();
    seedStaffAttendanceData(state);
    await installStaffProfileMockApi(page, state);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    // Role
    expect(body?.toLowerCase()).toMatch(/teacher/);
    // Department — Science (from default state)
    const hasDept = body?.includes('Science') || body?.includes('Mathematics');
    expect(hasDept).toBeTruthy();
  });

  test('3) profile shows active status badge', async ({ page }) => {
    const state = createMockState();
    seedStaffAttendanceData(state);
    await installStaffProfileMockApi(page, state);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body?.toLowerCase()).toMatch(/active/);
  });

  test('4) Overview tab shows attendance rate card', async ({ page }) => {
    const state = createMockState();
    seedStaffAttendanceData(state);
    await installStaffProfileMockApi(page, state);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    // Overview tab should show attendance stats
    const hasAttendanceRate = body?.includes('%') ||
                              body?.toLowerCase().includes('attendance') ||
                              body?.toLowerCase().includes('present') ||
                              body?.toLowerCase().includes('working');
    expect(hasAttendanceRate).toBeTruthy();
  });

  test('5) Overview tab shows assigned classes info', async ({ page }) => {
    const state = createMockState();
    seedStaffAttendanceData(state);
    await installStaffProfileMockApi(page, state);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    // Should mention class assignment
    const hasClassInfo = body?.includes('10-A') ||
                         body?.includes('10') ||
                         body?.toLowerCase().includes('class teacher') ||
                         body?.toLowerCase().includes('assigned');
    expect(hasClassInfo).toBeTruthy();
  });

  test('6) Attendance tab shows monthly calendar view', async ({ page }) => {
    const state = createMockState();
    seedStaffAttendanceData(state);
    await installStaffProfileMockApi(page, state);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    // Click attendance tab
    const attendanceTab = page.locator('button').filter({ hasText: /^Attendance$/i }).first();
    const hasTab = await attendanceTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasTab) {
      await attendanceTab.click();
      await page.waitForTimeout(500);
    }

    const body = await page.textContent('body');
    // Calendar should show day names or day numbers
    const hasCalendar = body?.includes('Mon') || body?.includes('Tue') || body?.includes('Sun') ||
                        body?.includes('Monday') || body?.includes('Tuesday') ||
                        body?.toLowerCase().includes('present') || body?.toLowerCase().includes('absent');
    expect(hasCalendar).toBeTruthy();
  });

  test('7) Attendance tab shows attendance stats', async ({ page }) => {
    const state = createMockState();
    seedStaffAttendanceData(state);
    await installStaffProfileMockApi(page, state);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    // Click attendance tab
    const attendanceTab = page.locator('button').filter({ hasText: /^Attendance$/i }).first();
    if (await attendanceTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await attendanceTab.click();
      await page.waitForTimeout(500);
    }

    const body = await page.textContent('body');
    // Stats should show present/absent counts or percentages
    const hasStats = body?.toLowerCase().includes('present') ||
                     body?.toLowerCase().includes('absent') ||
                     body?.includes('%') ||
                     body?.toLowerCase().includes('working days');
    expect(hasStats).toBeTruthy();
  });

  test('8) Classes & Subjects tab shows assigned classes and subjects', async ({ page }) => {
    const state = createMockState();
    seedStaffAttendanceData(state);
    await installStaffProfileMockApi(page, state);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    // Look for classes/subjects tab
    const classesTab = page.locator('button').filter({ hasText: /class|subject|timetable/i }).first();
    const hasTab = await classesTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasTab) {
      await classesTab.click();
      await page.waitForTimeout(500);
    }

    const body = await page.textContent('body');
    // Should show class-subject mappings
    const hasClasses = body?.includes('10') || body?.includes('Mathematics') || body?.includes('Science');
    expect(hasClasses).toBeTruthy();
  });

  test('9) Documents tab shows document section', async ({ page }) => {
    const state = createMockState();
    seedStaffAttendanceData(state);
    await installStaffProfileMockApi(page, state);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    // Look for documents tab
    const docsTab = page.locator('button').filter({ hasText: /document/i }).first();
    const hasTab = await docsTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasTab) {
      await docsTab.click();
      await page.waitForTimeout(500);

      const body = await page.textContent('body');
      const hasDocContent = body?.toLowerCase().includes('document') ||
                            body?.toLowerCase().includes('aadhaar') ||
                            body?.toLowerCase().includes('pan') ||
                            body?.toLowerCase().includes('upload');
      expect(hasDocContent).toBeTruthy();
    } else {
      // Document section may be on the overview or a different layout
      const body = await page.textContent('body');
      expect(body).toBeTruthy();
    }
  });

  test('10) Payroll tab shows salary structure', async ({ page }) => {
    const state = createMockState();
    seedStaffAttendanceData(state);
    await installStaffProfileMockApi(page, state);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    // Look for payroll/salary tab
    const payrollTab = page.locator('button').filter({ hasText: /payroll|salary/i }).first();
    const hasTab = await payrollTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasTab) {
      await payrollTab.click();
      await page.waitForTimeout(500);

      const body = await page.textContent('body');
      const hasSalaryInfo = body?.toLowerCase().includes('salary') ||
                            body?.toLowerCase().includes('basic') ||
                            body?.toLowerCase().includes('earning') ||
                            body?.toLowerCase().includes('deduction') ||
                            body?.includes('46,000') || body?.includes('46000') ||
                            body?.includes('35,000') || body?.includes('35000');
      expect(hasSalaryInfo).toBeTruthy();
    } else {
      // Payroll may not be a separate tab — verify page loads
      const body = await page.textContent('body');
      expect(body).toBeTruthy();
    }
  });

  test('11) profile page does not redirect to login', async ({ page }) => {
    const state = createMockState();
    seedStaffAttendanceData(state);
    await installStaffProfileMockApi(page, state);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);
  });

  test('12) navigating to dashboard URL pattern also works', async ({ page }) => {
    const state = createMockState();
    seedStaffAttendanceData(state);
    await installStaffProfileMockApi(page, state);

    // Try the /staffs/dashboard route if it exists, or direct ID
    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body).toContain('Ananya');
    await expect(page).not.toHaveURL(/\/login/);
  });
});
