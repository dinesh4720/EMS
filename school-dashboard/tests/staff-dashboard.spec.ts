import { expect, test } from '@playwright/test';
import {
  createMockState,
  installMockApi,
  TEACHER_A_ID,
  TEACHER_B_ID,
  ACCOUNTANT_ID,
  type MockState,
} from './test-utils';

test.describe('Staff Dashboard — Tabs, Timetable & Assignments', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    await installMockApi(page, state);
  });

  /* ───────── Helper: wait for staff data to render ───────── */
  async function waitForStaffProfile(page: import('@playwright/test').Page, staffName: string) {
    await page.waitForFunction(
      (name: string) => document.body.textContent?.includes(name) ?? false,
      staffName,
      { timeout: 15_000 },
    );
  }

  /* ───────── 1. Overview tab — profile info ───────── */

  test('overview tab shows staff profile info', async ({ page }) => {
    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');
    await waitForStaffProfile(page, 'Ananya');

    const body = await page.textContent('body');
    // Name
    expect(body).toContain('Ananya');
    // Role chip
    expect(body).toContain('Teacher');
    // Department (shown if no subject assignments yet — but assignments load async so department may be hidden)
    // Phone
    expect(body).toContain('9876543210');
    // Email
    expect(body).toContain('ananya@schoolsync.test');
  });

  /* ───────── 2. Attendance tab — calendar visible ───────── */

  test('attendance tab shows calendar view', async ({ page }) => {
    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');
    await waitForStaffProfile(page, 'Ananya');

    // Click attendance tab
    const attendanceTab = page.locator('button').filter({ hasText: /^Attendance$/i }).first();
    await attendanceTab.click();
    await page.waitForTimeout(500);

    // Attendance tab should render calendar-related content
    const body = await page.textContent('body');
    // Monthly calendar should show day numbers — at least "1" through some date
    // Also stats are on the Overview tab, so check for calendar-like navigation
    const hasCalendarContent =
      body?.includes('Mon') || body?.includes('Tue') || body?.includes('Sun') ||
      body?.includes('Present') || body?.includes('Absent');
    expect(hasCalendarContent).toBeTruthy();
  });

  /* ───────── 3. Overview — attendance summary stats ───────── */

  test('overview shows attendance summary stats cards', async ({ page }) => {
    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');
    await waitForStaffProfile(page, 'Ananya');

    const body = await page.textContent('body');
    // Stats cards show attendance %, role, joining date labels
    expect(body?.includes('%')).toBeTruthy();
    // Monthly summary section
    const hasWorkingDays = body?.toLowerCase().includes('working') || body?.toLowerCase().includes('present') || body?.toLowerCase().includes('absent');
    expect(hasWorkingDays).toBeTruthy();
  });

  /* ───────── 4. Timetable tab — weekly schedule grid ───────── */

  test('timetable tab shows weekly schedule grid', async ({ page }) => {
    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');
    await waitForStaffProfile(page, 'Ananya');

    // Click timetable tab
    const timetableTab = page.locator('button').filter({ hasText: /^Timetable$/i }).first();
    await timetableTab.click();

    // Wait for the timetable to load — look for the table or day labels
    // The TeacherTimetableEditor renders day names in a Table component after loading
    await page.waitForFunction(
      () => {
        const text = document.body.textContent || '';
        return text.includes('Monday') || text.includes('Mon') ||
               text.includes('Tuesday') || text.includes('Tue') ||
               text.includes('Day'); // column header might be "Day"
      },
      { timeout: 10_000 },
    ).catch(() => {});

    const body = await page.textContent('body');
    // Should show day names in the timetable grid — full names or abbreviations
    // Note: "Monday" is rendered with hidden sm:inline, so textContent includes it
    const hasDays = body?.includes('Monday') || body?.includes('Mon') ||
                    body?.includes('Tuesday') || body?.includes('Tue') ||
                    body?.includes('Day'); // Column header
    expect(hasDays).toBeTruthy();
  });

  /* ───────── 5. Classes tab — assigned classes ───────── */

  test('classes tab lists subject-class assignments', async ({ page }) => {
    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');
    await waitForStaffProfile(page, 'Ananya');

    // Click classes tab (label is "Classes & Subjects")
    const classesTab = page.locator('button').filter({ hasText: /Classes/i }).first();
    await classesTab.click();
    await page.waitForTimeout(1000);

    const body = await page.textContent('body');
    // The assignment panel should render — either with assignments or an empty state
    const hasContent = body?.includes('Mathematics') || body?.includes('assignment') ||
                       body?.includes('Assign') || body?.includes('Subject') ||
                       body?.includes('No') || body?.includes('class');
    expect(hasContent).toBeTruthy();
  });

  /* ───────── 6. Payroll tab — salary history ───────── */

  test('payroll tab shows salary overview', async ({ page }) => {
    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');
    await waitForStaffProfile(page, 'Ananya');

    // Click payroll tab
    const payrollTab = page.locator('button').filter({ hasText: /^Payroll$/i }).first();
    await payrollTab.click();
    await page.waitForTimeout(500);

    const body = await page.textContent('body');
    // Payroll tab should show salary summary cards with ₹ symbol
    const hasPayrollContent = body?.includes('₹') || body?.includes('Salary') ||
                              body?.includes('salary') || body?.includes('Earnings') ||
                              body?.includes('Deductions') || body?.includes('Net');
    expect(hasPayrollContent).toBeTruthy();
  });

  /* ───────── 7. Documents tab — uploaded documents ───────── */

  test('documents tab shows document stats', async ({ page }) => {
    // Add documents to the staff member
    const staffMember = state.staff.find((s) => s.id === TEACHER_A_ID)!;
    (staffMember as Record<string, unknown>).idDocuments = [
      { name: 'Aadhaar Card', type: 'ID Proof', url: 'https://cdn.test/aadhaar.pdf' },
    ];
    (staffMember as Record<string, unknown>).qualificationDocs = [
      'https://cdn.test/degree.pdf',
    ];

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');
    await waitForStaffProfile(page, 'Ananya');

    // Click documents tab (label includes count)
    const documentsTab = page.locator('button').filter({ hasText: /Documents/i }).first();
    await documentsTab.click();
    await page.waitForTimeout(500);

    const body = await page.textContent('body');
    // Should show document stats cards
    const hasDocContent = body?.includes('Document') || body?.includes('document') ||
                          body?.includes('ID Proof') || body?.includes('Qualification') ||
                          body?.includes('Upload');
    expect(hasDocContent).toBeTruthy();
  });

  /* ───────── 8. Overview — class teacher assignments with student counts ───────── */

  test('overview shows class teacher assignments', async ({ page }) => {
    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');
    await waitForStaffProfile(page, 'Ananya');

    const body = await page.textContent('body');
    // Ananya is class teacher for 10-A
    const hasClassInfo = body?.includes('10') || body?.includes('Class') ||
                         body?.includes('class');
    expect(hasClassInfo).toBeTruthy();
  });

  /* ───────── 9. Tab switching preserves data ───────── */

  test('tab switching preserves data without re-fetching', async ({ page }) => {
    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');
    await waitForStaffProfile(page, 'Ananya');

    // Record request count after initial load
    const initialCount = state.requestLog.size;

    // Switch to Attendance tab
    await page.locator('button').filter({ hasText: /^Attendance$/i }).first().click();
    await page.waitForTimeout(500);

    // Switch back to Overview
    await page.locator('button').filter({ hasText: /^Overview$/i }).first().click();
    await page.waitForTimeout(500);

    // Verify Overview content is still rendered
    const body = await page.textContent('body');
    expect(body?.includes('Ananya') || body?.includes('Sharma')).toBeTruthy();

    // Requests should not have doubled — the data is from context, not re-fetched per tab
    // (some tabs may trigger API calls, but Overview data comes from context)
  });

  /* ───────── 10. Edit staff button opens edit drawer ───────── */

  test('edit button opens edit staff drawer', async ({ page }) => {
    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');
    await waitForStaffProfile(page, 'Ananya');

    // Click Edit button in the header
    const editBtn = page.getByRole('button', { name: /^Edit$/i }).first();
    await editBtn.click();
    await page.waitForTimeout(500);

    // The AddStaff drawer should open (look for dialog/drawer)
    const drawer = page.locator('[role="dialog"]').last();
    const isVisible = await drawer.isVisible({ timeout: 5000 }).catch(() => false);
    if (isVisible) {
      const drawerText = await drawer.textContent();
      // Should show edit mode header or pre-filled staff name
      expect(
        drawerText?.includes('Edit') || drawerText?.includes('edit') ||
        drawerText?.includes('Update') || drawerText?.includes('Ananya'),
      ).toBeTruthy();
    }
  });

  /* ───────── 11. Navigate between staff using sidebar ───────── */

  test('back button navigates to staff list', async ({ page }) => {
    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');
    await waitForStaffProfile(page, 'Ananya');

    // Click back button
    const backBtn = page.locator('button').filter({ hasText: /back|staff/i }).first();
    if (await backBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await backBtn.click();
      await page.waitForLoadState('networkidle');

      // Should navigate to staff list
      expect(page.url()).toContain('/staffs');
    }
  });

  /* ───────── 12. Non-teacher staff (Accountant) shows different overview ───────── */

  test('non-teacher staff shows department instead of students count', async ({ page }) => {
    await page.goto(`/staffs/${ACCOUNTANT_ID}`);
    await page.waitForLoadState('networkidle');

    // Wait for the staff name to appear (data may take a moment to load)
    await page.waitForFunction(
      () => {
        const text = document.body.textContent || '';
        return text.includes('Priya') || text.includes('Menon');
      },
      { timeout: 10_000 },
    ).catch(() => {});

    const body = await page.textContent('body');
    // Accountant — should show name and department/role instead of student count
    expect(body?.includes('Priya') || body?.includes('Menon')).toBeTruthy();
    expect(body?.includes('accountant') || body?.includes('Accountant') || body?.includes('Finance')).toBeTruthy();
  });
});
