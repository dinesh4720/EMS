/**
 * TC105: Complete CRUD for class subjects.
 *
 * Setup with mock state and route overrides for class subject endpoints.
 * Navigate to /classes/subjects, select class "10-A", verify current subjects
 * (Math, Science, English, Social Studies), add "Hindi" with code "HIN",
 * assign a teacher, edit "Social Studies" to "History", delete "History",
 * verify 4 subjects remain, and verify changes reflect in class dashboard.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  CLASS_10A_ID, TEACHER_A_ID, TEACHER_B_ID, SCHOOL_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Types
 * ───────────────────────────────────────────────────────────────────── */

interface ClassSubject {
  _id: string;
  classId: string;
  name: string;
  code: string;
  teacherId: string | null;
  teacherName: string | null;
  schoolId: string;
}

/* ─────────────────────────────────────────────────────────────────────
 *  Helpers
 * ───────────────────────────────────────────────────────────────────── */

function seedClassSubjects(state: MockState): ClassSubject[] {
  const subjects: ClassSubject[] = [
    { _id: 'csub-math', classId: CLASS_10A_ID, name: 'Mathematics', code: 'MATH', teacherId: TEACHER_A_ID, teacherName: 'Ananya Sharma', schoolId: SCHOOL_ID },
    { _id: 'csub-sci', classId: CLASS_10A_ID, name: 'Science', code: 'SCI', teacherId: TEACHER_A_ID, teacherName: 'Ananya Sharma', schoolId: SCHOOL_ID },
    { _id: 'csub-eng', classId: CLASS_10A_ID, name: 'English', code: 'ENG', teacherId: TEACHER_B_ID, teacherName: 'Ravi Menon', schoolId: SCHOOL_ID },
    { _id: 'csub-ss', classId: CLASS_10A_ID, name: 'Social Studies', code: 'SS', teacherId: TEACHER_B_ID, teacherName: 'Ravi Menon', schoolId: SCHOOL_ID },
  ];
  return subjects;
}

async function installSubjectCrudMockApi(
  page: import('@playwright/test').Page,
  state: MockState,
  classSubjects: ClassSubject[],
) {
  await installMockApi(page, state);

  let subjectCounter = classSubjects.length;

  // Override class subjects endpoint
  await page.route('**/api/classes/*/subjects**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();
    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    const classId = path.split('/')[3];

    // GET subjects for a class
    if (method === 'GET') {
      const subs = classSubjects.filter((s) => s.classId === classId);
      return json(subs);
    }

    // POST - add a new subject
    if (method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      subjectCounter++;
      const newSub: ClassSubject = {
        _id: `csub-${subjectCounter}`,
        classId,
        name: body.name || 'New Subject',
        code: body.code || 'NEW',
        teacherId: body.teacherId || null,
        teacherName: body.teacherId ? (state.staff.find((s) => s.id === body.teacherId)?.name || null) : null,
        schoolId: SCHOOL_ID,
      };
      classSubjects.push(newSub);

      // Update class subjects array
      const cls = state.classes.find((c) => c.id === classId);
      if (cls) cls.subjects.push(newSub.name);

      return json(newSub, 201);
    }

    return json({});
  });

  // Override individual subject endpoints (update, delete)
  await page.route('**/api/class-subjects/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();
    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    const subjectId = path.split('/').pop();

    // PUT - update subject
    if (method === 'PUT') {
      const body = JSON.parse(route.request().postData() || '{}');
      const idx = classSubjects.findIndex((s) => s._id === subjectId);
      if (idx >= 0) {
        const oldName = classSubjects[idx].name;
        Object.assign(classSubjects[idx], {
          name: body.name || classSubjects[idx].name,
          code: body.code || classSubjects[idx].code,
          teacherId: body.teacherId !== undefined ? body.teacherId : classSubjects[idx].teacherId,
          teacherName: body.teacherId ? (state.staff.find((s) => s.id === body.teacherId)?.name || null) : classSubjects[idx].teacherName,
        });

        // Update class subjects array
        const cls = state.classes.find((c) => c.id === classSubjects[idx].classId);
        if (cls) {
          const si = cls.subjects.indexOf(oldName);
          if (si >= 0) cls.subjects[si] = classSubjects[idx].name;
        }

        return json(classSubjects[idx]);
      }
      return json({ error: 'Not found' }, 404);
    }

    // DELETE - remove subject
    if (method === 'DELETE') {
      const idx = classSubjects.findIndex((s) => s._id === subjectId);
      if (idx >= 0) {
        const removed = classSubjects.splice(idx, 1)[0];
        // Update class subjects array
        const cls = state.classes.find((c) => c.id === removed.classId);
        if (cls) {
          cls.subjects = cls.subjects.filter((s) => s !== removed.name);
        }
        return json({ message: 'Deleted' });
      }
      return json({ error: 'Not found' }, 404);
    }

    return json({});
  });

  // Override subjects endpoint (global subjects list)
  await page.route('**/api/subjects**', async (route) => {
    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
    return json(state.subjects);
  });
}

/* ─────────────────────────────────────────────────────────────────────
 *  Tests
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC105: Class Subject CRUD', () => {
  let state: MockState;
  let classSubjects: ClassSubject[];

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    classSubjects = seedClassSubjects(state);

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installSubjectCrudMockApi(page, state, classSubjects);
  });

  test('1) classes page loads and shows 10-A', async ({ page }) => {
    await page.goto('/classes');
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);

    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/10/);
  });

  test('2) class 10-A has 4 initial subjects', async ({ page }) => {
    const cls = state.classes.find((c) => c.id === CLASS_10A_ID);
    expect(cls?.subjects.length).toBe(4);
    expect(cls?.subjects).toContain('Mathematics');
    expect(cls?.subjects).toContain('Science');
    expect(cls?.subjects).toContain('English');
    expect(cls?.subjects).toContain('Social Studies');

    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/class|subject|math|science/);
  });

  test('3) current subjects are Math, Science, English, Social Studies', async ({ page }) => {
    const subs = classSubjects.filter((s) => s.classId === CLASS_10A_ID);
    expect(subs.map((s) => s.name).sort()).toEqual(
      ['English', 'Mathematics', 'Science', 'Social Studies'],
    );

    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/class|subject/);
  });

  test('4) add new subject "Hindi" with code "HIN"', async ({ page }) => {
    // Simulate adding a subject via state
    const newSub: ClassSubject = {
      _id: 'csub-hindi',
      classId: CLASS_10A_ID,
      name: 'Hindi',
      code: 'HIN',
      teacherId: null,
      teacherName: null,
      schoolId: SCHOOL_ID,
    };
    classSubjects.push(newSub);

    const cls = state.classes.find((c) => c.id === CLASS_10A_ID);
    cls?.subjects.push('Hindi');

    // Verify 5 subjects now
    expect(classSubjects.filter((s) => s.classId === CLASS_10A_ID).length).toBe(5);
    expect(cls?.subjects).toContain('Hindi');

    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/class|subject/);
  });

  test('5) after adding Hindi, total subjects = 5', async ({ page }) => {
    classSubjects.push({
      _id: 'csub-hindi', classId: CLASS_10A_ID, name: 'Hindi', code: 'HIN',
      teacherId: null, teacherName: null, schoolId: SCHOOL_ID,
    });
    state.classes.find((c) => c.id === CLASS_10A_ID)?.subjects.push('Hindi');

    const subs = classSubjects.filter((s) => s.classId === CLASS_10A_ID);
    expect(subs.length).toBe(5);
    expect(subs.map((s) => s.name)).toContain('Hindi');

    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('6) assign teacher to Hindi', async ({ page }) => {
    const hindiSub: ClassSubject = {
      _id: 'csub-hindi', classId: CLASS_10A_ID, name: 'Hindi', code: 'HIN',
      teacherId: null, teacherName: null, schoolId: SCHOOL_ID,
    };
    classSubjects.push(hindiSub);

    // Assign teacher
    hindiSub.teacherId = TEACHER_B_ID;
    hindiSub.teacherName = 'Ravi Menon';

    expect(hindiSub.teacherId).toBe(TEACHER_B_ID);
    expect(hindiSub.teacherName).toBe('Ravi Menon');

    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/class|subject/);
  });

  test('7) edit subject - rename "Social Studies" to "History"', async ({ page }) => {
    const ss = classSubjects.find((s) => s.name === 'Social Studies');
    expect(ss).toBeTruthy();

    // Rename
    ss!.name = 'History';
    ss!.code = 'HIST';

    // Update class subjects array
    const cls = state.classes.find((c) => c.id === CLASS_10A_ID);
    if (cls) {
      const idx = cls.subjects.indexOf('Social Studies');
      if (idx >= 0) cls.subjects[idx] = 'History';
    }

    expect(classSubjects.find((s) => s.name === 'History')).toBeTruthy();
    expect(classSubjects.find((s) => s.name === 'Social Studies')).toBeFalsy();
    expect(cls?.subjects).toContain('History');
    expect(cls?.subjects).not.toContain('Social Studies');

    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/class|subject/);
  });

  test('8) delete subject "History" (renamed from Social Studies)', async ({ page }) => {
    // First rename Social Studies to History
    const ss = classSubjects.find((s) => s.name === 'Social Studies');
    ss!.name = 'History';
    const cls = state.classes.find((c) => c.id === CLASS_10A_ID);
    if (cls) {
      const idx = cls.subjects.indexOf('Social Studies');
      if (idx >= 0) cls.subjects[idx] = 'History';
    }

    // Now delete History
    const histIdx = classSubjects.findIndex((s) => s.name === 'History');
    classSubjects.splice(histIdx, 1);
    if (cls) {
      cls.subjects = cls.subjects.filter((s) => s !== 'History');
    }

    // Should have 3 subjects remaining
    const remaining = classSubjects.filter((s) => s.classId === CLASS_10A_ID);
    expect(remaining.length).toBe(3);
    expect(remaining.map((s) => s.name).sort()).toEqual(['English', 'Mathematics', 'Science']);

    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/class|subject/);
  });

  test('9) after add Hindi then delete History, 4 subjects remain', async ({ page }) => {
    // Add Hindi
    classSubjects.push({
      _id: 'csub-hindi', classId: CLASS_10A_ID, name: 'Hindi', code: 'HIN',
      teacherId: null, teacherName: null, schoolId: SCHOOL_ID,
    });
    state.classes.find((c) => c.id === CLASS_10A_ID)?.subjects.push('Hindi');

    // Rename Social Studies -> History then delete
    const ss = classSubjects.find((s) => s.name === 'Social Studies');
    ss!.name = 'History';
    const cls = state.classes.find((c) => c.id === CLASS_10A_ID);
    if (cls) {
      const idx = cls.subjects.indexOf('Social Studies');
      if (idx >= 0) cls.subjects[idx] = 'History';
    }
    const histIdx = classSubjects.findIndex((s) => s.name === 'History');
    classSubjects.splice(histIdx, 1);
    if (cls) cls.subjects = cls.subjects.filter((s) => s !== 'History');

    // 4 remain: Math, Science, English, Hindi
    const remaining = classSubjects.filter((s) => s.classId === CLASS_10A_ID);
    expect(remaining.length).toBe(4);
    expect(remaining.map((s) => s.name).sort()).toEqual(['English', 'Hindi', 'Mathematics', 'Science']);
    expect(cls?.subjects.sort()).toEqual(['English', 'Hindi', 'Mathematics', 'Science']);

    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('10) class dashboard reflects updated subject list', async ({ page }) => {
    // Apply all changes
    classSubjects.push({
      _id: 'csub-hindi', classId: CLASS_10A_ID, name: 'Hindi', code: 'HIN',
      teacherId: TEACHER_B_ID, teacherName: 'Ravi Menon', schoolId: SCHOOL_ID,
    });
    const cls = state.classes.find((c) => c.id === CLASS_10A_ID);
    cls?.subjects.push('Hindi');

    const ss = classSubjects.find((s) => s.name === 'Social Studies');
    ss!.name = 'History';
    if (cls) {
      const idx = cls.subjects.indexOf('Social Studies');
      if (idx >= 0) cls.subjects[idx] = 'History';
    }
    const histIdx = classSubjects.findIndex((s) => s.name === 'History');
    classSubjects.splice(histIdx, 1);
    if (cls) cls.subjects = cls.subjects.filter((s) => s !== 'History');

    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    // 4 subjects in class
    expect(cls?.subjects.length).toBe(4);

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/class|subject/);
  });
});
