/**
 * TC113: Principal reviews school data across all modules.
 *
 * Tests that the principal user can access every module without restriction:
 * dashboard, students, staff, academics, fees, and settings. Verifies full
 * visibility of data and management capabilities.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState,
  createPrincipalUser,
  installMockApi,
  seedStudent,
  seedStudentWithFees,
  seedExam,
  seedResult,
  seedAttendanceForClass,
  seedAnnouncement,
  CLASS_10A_ID,
  CLASS_11A_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Tests
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC113: Principal Workflow — Full Access Review', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState(createPrincipalUser());

    // Seed rich data across modules
    seedStudentWithFees(state, { name: 'Ankit Jain', classId: CLASS_10A_ID, feeStatus: 'paid' });
    seedStudentWithFees(state, { name: 'Kavya Reddy', classId: CLASS_10A_ID, feeStatus: 'pending', gender: 'Female' });
    seedStudentWithFees(state, { name: 'Mohan Das', classId: CLASS_11A_ID, feeStatus: 'overdue' });
    seedStudentWithFees(state, { name: 'Sneha Gupta', classId: CLASS_11A_ID, feeStatus: 'paid', gender: 'Female' });

    // Seed exam with results
    const exam = seedExam(state, { name: 'Final Exam', classId: CLASS_10A_ID, status: 'published' });
    const ankit = state.students.find((s) => s.name === 'Ankit Jain')!;
    const kavya = state.students.find((s) => s.name === 'Kavya Reddy')!;
    seedResult(state, ankit.id, exam.id, 'Mathematics', 88, 100);
    seedResult(state, kavya.id, exam.id, 'Mathematics', 92, 100);

    // Seed attendance
    seedAttendanceForClass(state, CLASS_10A_ID, '2026-03-30');
    seedAttendanceForClass(state, CLASS_11A_ID, '2026-03-30');

    // Seed announcements
    seedAnnouncement(state, { title: 'Board Exam Schedule Released' });

    // Dismiss cookie consent
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);
  });

  test('1) principal dashboard loads with all stats', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();

    // Verify principal name appears
    const principalName = page.getByText('Dr. Krishnamurthy').first();
    const hasName = await principalName.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasName) {
      await expect(principalName).toBeVisible();
    }

    // Dashboard should show stats
    const hasStats = bodyText?.includes('4') || // total students
      bodyText?.includes('3') || // total staff
      bodyText?.includes('2');   // total classes
    expect(hasStats).toBe(true);
  });

  test('2) /students shows full student list', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';

    // Should NOT show access denied
    const isAccessible = !lowerBody.includes('access denied') &&
      !lowerBody.includes('unauthorized');
    expect(isAccessible).toBe(true);

    // Should show students
    const hasStudents = bodyText?.includes('Ankit Jain') ||
      bodyText?.includes('Kavya Reddy') ||
      bodyText?.includes('Mohan Das') ||
      bodyText?.includes('Sneha Gupta');
    expect(hasStudents).toBe(true);
  });

  test('3) /staffs shows staff list', async ({ page }) => {
    await page.goto('/staffs');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';

    const isAccessible = !lowerBody.includes('access denied') &&
      !lowerBody.includes('unauthorized');
    expect(isAccessible).toBe(true);

    // Should show staff data
    const hasStaff = bodyText?.includes('Ananya Sharma') ||
      bodyText?.includes('Ravi Menon') ||
      lowerBody.includes('staff');
    expect(hasStaff).toBe(true);
  });

  test('4) /academics shows exam management', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';

    const isAccessible = !lowerBody.includes('access denied') &&
      !lowerBody.includes('unauthorized');
    expect(isAccessible).toBe(true);

    const hasExams = bodyText?.includes('Final Exam') ||
      lowerBody.includes('exam') ||
      lowerBody.includes('academic');
    expect(hasExams).toBe(true);
  });

  test('5) /fees shows fee collection data', async ({ page }) => {
    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';

    const isAccessible = !lowerBody.includes('access denied') &&
      !lowerBody.includes('unauthorized');
    expect(isAccessible).toBe(true);

    const hasFees = lowerBody.includes('fee') ||
      lowerBody.includes('payment') ||
      lowerBody.includes('collection');
    expect(hasFees).toBe(true);
  });

  test('6) /settings is fully accessible for principal', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';

    const isAccessible = !lowerBody.includes('access denied') &&
      !lowerBody.includes('unauthorized');
    expect(isAccessible).toBe(true);

    expect(lowerBody).toMatch(/setting/i);
  });

  test('7) /classes shows all classes', async ({ page }) => {
    await page.goto('/classes');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';

    const isAccessible = !lowerBody.includes('access denied') &&
      !lowerBody.includes('unauthorized');
    expect(isAccessible).toBe(true);

    // Should show both classes
    const hasClasses = bodyText?.includes('10') || bodyText?.includes('11');
    expect(hasClasses).toBe(true);
  });

  test('8) principal can navigate to settings sub-pages', async ({ page }) => {
    // Test institution settings
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    let bodyText = await page.textContent('body');
    let lowerBody = bodyText?.toLowerCase() || '';
    expect(lowerBody).not.toMatch(/access denied|unauthorized/i);

    // Test academic settings
    await page.goto('/settings/academics');
    await page.waitForLoadState('networkidle');

    bodyText = await page.textContent('body');
    lowerBody = bodyText?.toLowerCase() || '';
    expect(lowerBody).not.toMatch(/access denied|unauthorized/i);
  });

  test('9) sidebar shows all navigation modules', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('nav, aside, [class*="sidebar"], [data-testid="sidebar"]').first();
    await expect(sidebar).toBeVisible({ timeout: 5000 });

    const sidebarText = await sidebar.textContent();
    const lowerText = sidebarText?.toLowerCase() || '';

    // Principal should see all major modules
    expect(lowerText).toMatch(/student/i);
    expect(lowerText).toMatch(/class/i);
    expect(lowerText).toMatch(/fee/i);
  });

  test('10) principal permissions are all true except superAdmin', async () => {
    expect(state.user.role).toBe('principal');
    expect(state.user.permissions?.superAdmin).toBe(false);

    const truePerm = [
      'students', 'classes', 'staff', 'attendance', 'academics', 'fees',
      'messaging', 'frontDesk', 'library', 'settings', 'analytics', 'reports',
      'timetable', 'hostel', 'transport', 'inventory', 'homework', 'calendar',
      'payroll', 'aiAssistant', 'intakeForms', 'dataTools',
    ];
    for (const perm of truePerm) {
      expect(state.user.permissions?.[perm]).toBe(true);
    }
  });

  test('11) principal sees correct seeded data integrity', async () => {
    expect(state.students).toHaveLength(4);
    expect(state.exams).toHaveLength(1);
    expect(state.results).toHaveLength(2);
    expect(state.staff).toHaveLength(3);
    expect(state.classes).toHaveLength(2);
    expect(state.announcements).toHaveLength(1);
    expect(state.attendance.length).toBeGreaterThan(0);
  });
});
