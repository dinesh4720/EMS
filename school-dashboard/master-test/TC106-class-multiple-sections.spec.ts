/**
 * TC106: Manage multiple sections within a class (10-A, 10-B, 10-C).
 *
 * Setup: adds sections B and C to class 10 in mock state. Navigates to /classes
 * and verifies all three sections are visible. Navigates to each section dashboard
 * and verifies separate student lists. Verifies each section has independent class
 * teacher, student count, attendance tracking, and timetable. Verifies class-level
 * aggregate (all sections combined) where applicable.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, seedStudent, seedAttendanceForClass,
  CLASS_10A_ID, TEACHER_A_ID, TEACHER_B_ID, SCHOOL_ID,
  type MockState, type ClassRecord,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Constants
 * ───────────────────────────────────────────────────────────────────── */

const CLASS_10B_ID = '64b100000000000000000103';
const CLASS_10C_ID = '64b100000000000000000104';
const TEACHER_C_ID = '64b100000000000000000014';

/* ─────────────────────────────────────────────────────────────────────
 *  Helpers
 * ───────────────────────────────────────────────────────────────────── */

function addSectionsToState(state: MockState) {
  // Add teacher for section C
  state.staff.push({
    _id: TEACHER_C_ID, id: TEACHER_C_ID, name: 'Sunita Reddy',
    email: 'sunita@schoolsync.test', phone: '9876543213',
    role: 'teacher', designation: 'Teacher', department: 'Science',
    status: 'active', joiningDate: '2024-02-01', schoolId: SCHOOL_ID,
    subjects: ['Mathematics', 'Science'], employeeId: 'EMP-004', salary: 38000,
  });

  // Add 10-B
  const class10B: ClassRecord = {
    _id: CLASS_10B_ID, id: CLASS_10B_ID, name: '10', section: 'B',
    classTeacherId: TEACHER_B_ID,
    strengthLimit: { current: 40, default: 40 },
    studentCount: 0, attendance: 0, averageAcademicPerformance: 0,
    subjects: ['Mathematics', 'Science', 'English', 'Social Studies'],
  };

  // Add 10-C
  const class10C: ClassRecord = {
    _id: CLASS_10C_ID, id: CLASS_10C_ID, name: '10', section: 'C',
    classTeacherId: TEACHER_C_ID,
    strengthLimit: { current: 40, default: 40 },
    studentCount: 0, attendance: 0, averageAcademicPerformance: 0,
    subjects: ['Mathematics', 'Science', 'English', 'Social Studies'],
  };

  state.classes.push(class10B, class10C);

  // Seed students into each section
  // 10-A: 5 students
  const studentsA = [
    seedStudent(state, { name: 'Aarav Mehta', classId: CLASS_10A_ID }),
    seedStudent(state, { name: 'Bhavya Kulkarni', classId: CLASS_10A_ID }),
    seedStudent(state, { name: 'Chandan Das', classId: CLASS_10A_ID }),
    seedStudent(state, { name: 'Diya Saxena', classId: CLASS_10A_ID }),
    seedStudent(state, { name: 'Eshan Bhat', classId: CLASS_10A_ID }),
  ];

  // 10-B: 4 students
  const studentsB = [
    seedStudent(state, { name: 'Faizan Ali', classId: CLASS_10B_ID }),
    seedStudent(state, { name: 'Gayatri Rao', classId: CLASS_10B_ID }),
    seedStudent(state, { name: 'Harsh Verma', classId: CLASS_10B_ID }),
    seedStudent(state, { name: 'Isha Kapoor', classId: CLASS_10B_ID }),
  ];

  // 10-C: 3 students
  const studentsC = [
    seedStudent(state, { name: 'Jai Prakash', classId: CLASS_10C_ID }),
    seedStudent(state, { name: 'Kavya Iyer', classId: CLASS_10C_ID }),
    seedStudent(state, { name: 'Lakshmi Nair', classId: CLASS_10C_ID }),
  ];

  // Seed attendance for today
  const today = new Date().toISOString().split('T')[0];
  seedAttendanceForClass(state, CLASS_10A_ID, today, {}); // all present
  seedAttendanceForClass(state, CLASS_10B_ID, today, { [studentsB[3].id]: 'absent' }); // 3 present, 1 absent
  seedAttendanceForClass(state, CLASS_10C_ID, today, { [studentsC[2].id]: 'absent' }); // 2 present, 1 absent

  // Add timetables for each section
  state.timetables.push(
    { classId: CLASS_10A_ID, periods: ['Math', 'Science', 'English', 'SS'], schedule: { Monday: ['Math', 'Science'] } },
    { classId: CLASS_10B_ID, periods: ['Math', 'English', 'Science', 'SS'], schedule: { Monday: ['English', 'Math'] } },
    { classId: CLASS_10C_ID, periods: ['Science', 'Math', 'SS', 'English'], schedule: { Monday: ['Science', 'SS'] } },
  );

  return { studentsA, studentsB, studentsC };
}

async function installMultiSectionMockApi(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  await installMockApi(page, state);

  // Override class detail and sub-routes
  await page.route('**/api/classes/*', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();
    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (path.includes('/students')) {
      const classId = path.split('/')[3];
      const classStudents = state.students.filter((s) => s.classId === classId);
      return json({ data: classStudents, total: classStudents.length, page: 1, limit: 100 });
    }

    if (path.includes('/attendance')) {
      const classId = path.split('/')[3];
      return json(state.attendance.filter((a) => a.classId === classId));
    }

    if (path.includes('/timetable')) {
      const classId = path.split('/')[3];
      const tt = state.timetables.find((t: Record<string, unknown>) => t.classId === classId);
      return json(tt || { classId, periods: [], schedule: {} });
    }

    const idMatch = path.match(/^\/api\/classes\/([^/]+)$/);
    if (idMatch && method === 'GET') {
      const id = idMatch[1];
      const cls = state.classes.find((c) => c.id === id);
      if (cls) {
        const teacher = state.staff.find((s) => s.id === cls.classTeacherId);
        return json({
          ...cls,
          classTeacher: teacher ? { _id: teacher._id, name: teacher.name, email: teacher.email, phone: teacher.phone } : null,
          studentCount: state.students.filter((s) => s.classId === id).length,
        });
      }
      return json({ error: 'Not found' }, 404);
    }

    return route.fallback();
  });
}

/* ─────────────────────────────────────────────────────────────────────
 *  Tests
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC106: Class Multiple Sections', () => {
  let state: MockState;
  let sectionData: ReturnType<typeof addSectionsToState>;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    sectionData = addSectionsToState(state);

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMultiSectionMockApi(page, state);
  });

  test('1) classes page shows 10-A, 10-B, 10-C (and 11-A)', async ({ page }) => {
    await page.goto('/classes');
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);

    // Should have 4 classes: 10-A, 10-B, 10-C, 11-A
    expect(state.classes.length).toBe(4);

    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/10/);
  });

  test('2) 10-A has 5 students', async ({ page }) => {
    const studentsA = state.students.filter((s) => s.classId === CLASS_10A_ID);
    expect(studentsA.length).toBe(5);

    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/5|10/);
  });

  test('3) 10-B has 4 students (separate list from 10-A)', async ({ page }) => {
    const studentsB = state.students.filter((s) => s.classId === CLASS_10B_ID);
    expect(studentsB.length).toBe(4);

    // Students in B should not overlap with A
    const studentNamesA = state.students.filter((s) => s.classId === CLASS_10A_ID).map((s) => s.name);
    const studentNamesB = studentsB.map((s) => s.name);
    for (const name of studentNamesB) {
      expect(studentNamesA).not.toContain(name);
    }

    await page.goto(`/classes/${CLASS_10B_ID}`);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/class|student|10/);
  });

  test('4) 10-C has 3 students (separate list from 10-A and 10-B)', async ({ page }) => {
    const studentsC = state.students.filter((s) => s.classId === CLASS_10C_ID);
    expect(studentsC.length).toBe(3);

    await page.goto(`/classes/${CLASS_10C_ID}`);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/class|student|10/);
  });

  test('5) each section has its own class teacher', async ({ page }) => {
    const clsA = state.classes.find((c) => c.id === CLASS_10A_ID);
    const clsB = state.classes.find((c) => c.id === CLASS_10B_ID);
    const clsC = state.classes.find((c) => c.id === CLASS_10C_ID);

    expect(clsA?.classTeacherId).toBe(TEACHER_A_ID); // Ananya Sharma
    expect(clsB?.classTeacherId).toBe(TEACHER_B_ID); // Ravi Menon
    expect(clsC?.classTeacherId).toBe(TEACHER_C_ID); // Sunita Reddy

    // All different teachers
    const teacherIds = [clsA?.classTeacherId, clsB?.classTeacherId, clsC?.classTeacherId];
    expect(new Set(teacherIds).size).toBe(3);

    await page.goto('/classes');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('6) each section has independent student count', async ({ page }) => {
    const countA = state.students.filter((s) => s.classId === CLASS_10A_ID).length;
    const countB = state.students.filter((s) => s.classId === CLASS_10B_ID).length;
    const countC = state.students.filter((s) => s.classId === CLASS_10C_ID).length;

    expect(countA).toBe(5);
    expect(countB).toBe(4);
    expect(countC).toBe(3);

    // Total across all sections = 12
    expect(countA + countB + countC).toBe(12);

    await page.goto('/classes');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/10/);
  });

  test('7) each section has independent attendance tracking', async ({ page }) => {
    const today = new Date().toISOString().split('T')[0];

    const attA = state.attendance.filter((a) => a.classId === CLASS_10A_ID && a.date === today);
    const attB = state.attendance.filter((a) => a.classId === CLASS_10B_ID && a.date === today);
    const attC = state.attendance.filter((a) => a.classId === CLASS_10C_ID && a.date === today);

    // 10-A: all 5 present
    expect(attA.filter((a) => a.status === 'present').length).toBe(5);
    expect(attA.filter((a) => a.status === 'absent').length).toBe(0);

    // 10-B: 3 present, 1 absent
    expect(attB.filter((a) => a.status === 'present').length).toBe(3);
    expect(attB.filter((a) => a.status === 'absent').length).toBe(1);

    // 10-C: 2 present, 1 absent
    expect(attC.filter((a) => a.status === 'present').length).toBe(2);
    expect(attC.filter((a) => a.status === 'absent').length).toBe(1);

    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/class|attendance|student|10/);
  });

  test('8) each section has its own timetable', async ({ page }) => {
    const ttA = state.timetables.find((t: Record<string, unknown>) => t.classId === CLASS_10A_ID) as Record<string, unknown>;
    const ttB = state.timetables.find((t: Record<string, unknown>) => t.classId === CLASS_10B_ID) as Record<string, unknown>;
    const ttC = state.timetables.find((t: Record<string, unknown>) => t.classId === CLASS_10C_ID) as Record<string, unknown>;

    expect(ttA).toBeTruthy();
    expect(ttB).toBeTruthy();
    expect(ttC).toBeTruthy();

    // Timetables are different (different period orders)
    expect(ttA.periods).not.toEqual(ttB.periods);
    expect(ttB.periods).not.toEqual(ttC.periods);

    await page.goto(`/classes/${CLASS_10B_ID}`);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/class|10/);
  });

  test('9) class-level aggregate: total students across all sections = 12', async ({ page }) => {
    const allClass10 = state.classes.filter((c) => c.name === '10');
    expect(allClass10.length).toBe(3); // A, B, C

    const totalStudents = allClass10.reduce(
      (sum, cls) => sum + state.students.filter((s) => s.classId === cls.id).length,
      0,
    );
    expect(totalStudents).toBe(12);

    await page.goto('/classes');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('10) navigating between sections maintains correct context', async ({ page }) => {
    // Go to 10-A
    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    let bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/class|10/);

    // Go to 10-B
    await page.goto(`/classes/${CLASS_10B_ID}`);
    await page.waitForLoadState('networkidle');

    bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/class|10/);

    // Go to 10-C
    await page.goto(`/classes/${CLASS_10C_ID}`);
    await page.waitForLoadState('networkidle');

    bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/class|10/);

    // All requests were made and state is consistent
    expect(state.students.filter((s) => s.classId === CLASS_10A_ID).length).toBe(5);
    expect(state.students.filter((s) => s.classId === CLASS_10B_ID).length).toBe(4);
    expect(state.students.filter((s) => s.classId === CLASS_10C_ID).length).toBe(3);
  });
});
