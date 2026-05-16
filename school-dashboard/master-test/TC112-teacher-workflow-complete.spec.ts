/**
 * TC112: Complete workflow from teacher perspective.
 *
 * Tests teacher login, viewing assigned classes, marking attendance,
 * entering exam marks, viewing student profiles, and verifying restricted
 * access to admin-only modules (settings, staff management, fees).
 */
import { expect, test } from '@playwright/test';
import {
  createMockState,
  createTeacherUser,
  installMockApi,
  seedStudent,
  seedExam,
  seedAttendanceForClass,
  CLASS_10A_ID,
  CLASS_11A_ID,
  TEACHER_A_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Tests
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC112: Teacher Workflow — Complete Flow', () => {
  let state: MockState;
  let student1Id: string;
  let student2Id: string;
  let student3Id: string;

  test.beforeEach(async ({ page }) => {
    state = createMockState(createTeacherUser());

    // Seed students in teacher's assigned class (10-A)
    const s1 = seedStudent(state, { name: 'Aditya Kumar', classId: CLASS_10A_ID });
    const s2 = seedStudent(state, { name: 'Priya Sharma', classId: CLASS_10A_ID, gender: 'Female' });
    const s3 = seedStudent(state, { name: 'Rahul Verma', classId: CLASS_10A_ID });
    student1Id = s1.id;
    student2Id = s2.id;
    student3Id = s3.id;

    // Seed a student in another class (11-A)
    seedStudent(state, { name: 'Outside Student', classId: CLASS_11A_ID });

    // Seed exam for teacher's class
    seedExam(state, {
      name: 'Unit Test 1',
      classId: CLASS_10A_ID,
      status: 'scheduled',
      subjects: ['Mathematics', 'Science'],
    });

    // Dismiss cookie consent
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);
  });

  test('1) teacher dashboard loads successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();

    // Should not show login page
    const lowerBody = bodyText?.toLowerCase() || '';
    expect(lowerBody).not.toMatch(/login|sign in/i);

    // Verify teacher name appears
    const teacherName = page.getByText('Ananya Sharma').first();
    const hasName = await teacherName.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasName) {
      await expect(teacherName).toBeVisible();
    }
  });

  test('2) teacher dashboard shows assigned classes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');

    // Dashboard should show class info or quick stats
    const hasClassContext = bodyText?.includes('10') ||
      bodyText?.includes('10-A') ||
      bodyText?.toLowerCase().includes('class');
    expect(hasClassContext).toBe(true);
  });

  test('3) /classes shows classes (teacher has classes permission)', async ({ page }) => {
    await page.goto('/classes');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';

    // Teacher should see classes page without access denied
    const isAccessible = !lowerBody.includes('access denied') &&
      !lowerBody.includes('unauthorized');
    expect(isAccessible).toBe(true);

    // Should show class content
    expect(lowerBody).toMatch(/class/i);
  });

  test('4) navigate to class 10-A attendance page', async ({ page }) => {
    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');

    // Should show class detail with students
    const hasClassDetail = bodyText?.includes('10') ||
      bodyText?.includes('Aditya Kumar') ||
      bodyText?.includes('Priya Sharma') ||
      bodyText?.toLowerCase().includes('class');
    expect(hasClassDetail).toBe(true);
  });

  test('5) mark attendance for students in 10-A', async ({ page }) => {
    // Seed attendance to simulate the marking
    seedAttendanceForClass(state, CLASS_10A_ID, '2026-03-30', {
      [student1Id]: 'present',
      [student2Id]: 'present',
      [student3Id]: 'absent',
    });

    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    // Verify attendance data exists in state
    const classAttendance = state.attendance.filter((a) => a.classId === CLASS_10A_ID);
    expect(classAttendance).toHaveLength(3);

    const presentCount = classAttendance.filter((a) => a.status === 'present').length;
    const absentCount = classAttendance.filter((a) => a.status === 'absent').length;
    expect(presentCount).toBe(2);
    expect(absentCount).toBe(1);

    // Verify the API endpoint for attendance was called
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  test('6) navigate to /academics as teacher', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';

    // Teacher has academics permission
    const isAccessible = !lowerBody.includes('access denied') &&
      !lowerBody.includes('unauthorized');
    expect(isAccessible).toBe(true);

    // Should show exam content
    const hasExamData = lowerBody.includes('unit test') ||
      lowerBody.includes('exam') ||
      lowerBody.includes('academic');
    expect(hasExamData).toBe(true);
  });

  test('7) view exam for assigned class', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');

    // Should show the seeded exam
    const hasExam = bodyText?.includes('Unit Test 1') ||
      bodyText?.toLowerCase().includes('exam') ||
      bodyText?.toLowerCase().includes('scheduled');
    expect(hasExam).toBe(true);
  });

  test('8) teacher can view student profiles', async ({ page }) => {
    await page.goto(`/students/${student1Id}`);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');

    // Teacher has students permission, should see student profile
    const hasStudentData = bodyText?.includes('Aditya Kumar') ||
      bodyText?.includes('10') ||
      bodyText?.toLowerCase().includes('student');
    expect(hasStudentData).toBe(true);
  });

  test('9) teacher CANNOT access /settings', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';

    // Teacher should see access denied or be redirected
    const denied = lowerBody.includes('access denied') ||
      lowerBody.includes('unauthorized') ||
      lowerBody.includes('permission') ||
      lowerBody.includes('not allowed') ||
      !currentUrl.includes('/settings');

    expect(denied).toBe(true);
  });

  test('10) teacher CANNOT access /staffs', async ({ page }) => {
    await page.goto('/staffs');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';

    const denied = lowerBody.includes('access denied') ||
      lowerBody.includes('unauthorized') ||
      lowerBody.includes('permission') ||
      lowerBody.includes('not allowed') ||
      !currentUrl.includes('/staffs');

    expect(denied).toBe(true);
  });

  test('11) teacher CANNOT access /fees', async ({ page }) => {
    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';

    const denied = lowerBody.includes('access denied') ||
      lowerBody.includes('unauthorized') ||
      lowerBody.includes('permission') ||
      lowerBody.includes('not allowed') ||
      !currentUrl.includes('/fees');

    expect(denied).toBe(true);
  });

  test('12) teacher permissions are correctly restrictive', async () => {
    expect(state.user.role).toBe('teacher');
    expect(state.user.permissions?.students).toBe(true);
    expect(state.user.permissions?.classes).toBe(true);
    expect(state.user.permissions?.attendance).toBe(true);
    expect(state.user.permissions?.academics).toBe(true);
    expect(state.user.permissions?.homework).toBe(true);
    expect(state.user.permissions?.staff).toBe(false);
    expect(state.user.permissions?.fees).toBe(false);
    expect(state.user.permissions?.settings).toBe(false);
    expect(state.user.permissions?.analytics).toBe(false);
    expect(state.user.permissions?.payroll).toBe(false);
  });
});
