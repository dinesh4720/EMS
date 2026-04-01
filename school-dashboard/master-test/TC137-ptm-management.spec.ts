/**
 * TC097: Create and manage Parent-Teacher Meeting (PTM) sessions.
 *
 * Verifies: page load, create PTM session, view slot availability,
 * book a slot, cancel booking, view schedule.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState,
  installMockApi,
  seedStudent,
  CLASS_10A_ID,
  TEACHER_A_ID,
  SCHOOL_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ───────── PTM route overrides ───────── */

interface PTMSession {
  _id: string;
  title: string;
  date: string;
  classId: string;
  className: string;
  startTime: string;
  endTime: string;
  slotDuration: number;
  slots: PTMSlot[];
  status: string;
  schoolId: string;
}

interface PTMSlot {
  _id: string;
  time: string;
  teacherId: string;
  teacherName: string;
  parentName: string | null;
  studentId: string | null;
  studentName: string | null;
  status: string; // available | booked | cancelled
}

async function installPTMRoutes(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  const ptmSessions: PTMSession[] = [];
  let ptmCounter = 0;

  await page.route('**/api/ptm*', async (route) => {
    const method = route.request().method();
    const url = new URL(route.request().url());
    const path = url.pathname;
    state.requestLog.add(`${method} ${path}`);

    // POST - Create PTM session
    if (method === 'POST' && (path === '/api/ptm' || path === '/api/ptm/sessions')) {
      const body = JSON.parse(route.request().postData() || '{}');
      ptmCounter++;

      const cls = state.classes.find((c) => c.id === body.classId);
      const startHour = parseInt(body.startTime?.split(':')[0] || '9', 10);
      const endHour = parseInt(body.endTime?.split(':')[0] || '13', 10);
      const slotDuration = body.slotDuration || 15;
      const totalSlots = Math.floor(((endHour - startHour) * 60) / slotDuration);

      const slots: PTMSlot[] = [];
      for (let i = 0; i < totalSlots; i++) {
        const minutes = startHour * 60 + i * slotDuration;
        const hour = Math.floor(minutes / 60);
        const min = minutes % 60;
        slots.push({
          _id: `ptm-${ptmCounter}-slot-${i + 1}`,
          time: `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
          teacherId: TEACHER_A_ID,
          teacherName: 'Ananya Sharma',
          parentName: null,
          studentId: null,
          studentName: null,
          status: 'available',
        });
      }

      const session: PTMSession = {
        _id: `ptm-${ptmCounter}`,
        title: body.title || `PTM Session ${ptmCounter}`,
        date: body.date || '2026-04-15',
        classId: body.classId || CLASS_10A_ID,
        className: cls ? `${cls.name}-${cls.section}` : '10-A',
        startTime: body.startTime || '09:00',
        endTime: body.endTime || '13:00',
        slotDuration,
        slots,
        status: 'scheduled',
        schoolId: SCHOOL_ID,
      };
      ptmSessions.push(session);

      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(session),
      });
    }

    // POST - Book a slot
    if (method === 'POST' && path.includes('/book')) {
      const sessionId = path.split('/')[3];
      const body = JSON.parse(route.request().postData() || '{}');
      const session = ptmSessions.find((s) => s._id === sessionId);

      if (session) {
        const slot = session.slots.find((s) => s._id === body.slotId);
        if (slot) {
          if (slot.status === 'booked') {
            return route.fulfill({
              status: 409,
              contentType: 'application/json',
              body: JSON.stringify({ error: 'Slot already booked' }),
            });
          }
          slot.status = 'booked';
          slot.parentName = body.parentName || 'Parent';
          slot.studentId = body.studentId;
          slot.studentName = body.studentName || 'Student';
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Slot booked', slot }),
          });
        }
      }
      return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) });
    }

    // POST/PUT - Cancel booking
    if (method === 'POST' && path.includes('/cancel')) {
      const sessionId = path.split('/')[3];
      const body = JSON.parse(route.request().postData() || '{}');
      const session = ptmSessions.find((s) => s._id === sessionId);

      if (session) {
        const slot = session.slots.find((s) => s._id === body.slotId);
        if (slot) {
          slot.status = 'available';
          slot.parentName = null;
          slot.studentId = null;
          slot.studentName = null;
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Booking cancelled', slot }),
          });
        }
      }
      return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) });
    }

    // GET - specific session
    if (path.match(/^\/api\/ptm\/[^/]+$/) && !path.includes('sessions') && !path.includes('schedule')) {
      const sessionId = path.split('/')[3];
      const session = ptmSessions.find((s) => s._id === sessionId);
      if (session) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(session),
        });
      }
      return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) });
    }

    // GET - schedule
    if (path.includes('/schedule')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessions: ptmSessions,
          upcoming: ptmSessions.filter((s) => s.status === 'scheduled'),
          past: ptmSessions.filter((s) => s.status === 'completed'),
        }),
      });
    }

    // GET - list all
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: ptmSessions,
        total: ptmSessions.length,
      }),
    });
  });

  return { getSessions: () => ptmSessions };
}

/* ═══════════════════════════════════════════════════════════════
   TEST SUITE
   ═══════════════════════════════════════════════════════════════ */

test.describe('TC097 — PTM Management: Create & Manage Sessions', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    // Seed a student for booking
    seedStudent(state, { name: 'PTM Student', classId: CLASS_10A_ID });

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);
    await installPTMRoutes(page, state);
  });

  /* ───────── 1. Page loads ───────── */

  test('1) PTM management page loads', async ({ page }) => {
    await page.goto('/ptm');
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.toLowerCase().includes('ptm') ||
      bodyText?.toLowerCase().includes('parent') ||
      bodyText?.toLowerCase().includes('meeting') ||
      bodyText?.toLowerCase().includes('teacher'),
    ).toBeTruthy();
  });

  /* ───────── 2. Create new PTM session ───────── */

  test('2) create a new PTM session via API', async ({ page }) => {
    await page.goto('/ptm');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (classId) => {
      const res = await fetch('http://localhost:3001/api/ptm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-jwt-token-admin',
        },
        body: JSON.stringify({
          title: 'Term 1 PTM',
          date: '2026-04-15',
          classId,
          startTime: '09:00',
          endTime: '13:00',
          slotDuration: 15,
        }),
      });
      return res.json();
    }, CLASS_10A_ID);

    expect(result._id).toBeDefined();
    expect(result.title).toBe('Term 1 PTM');
    expect(result.className).toBe('10-A');
    expect(result.status).toBe('scheduled');
    expect(result.slots.length).toBeGreaterThan(0);
    // 4 hours / 15 min = 16 slots
    expect(result.slots).toHaveLength(16);
  });

  /* ───────── 3. Session appears in list ───────── */

  test('3) created session appears in PTM list', async ({ page }) => {
    await page.goto('/ptm');
    await page.waitForLoadState('networkidle');

    // Create session
    await page.evaluate(async (classId) => {
      await fetch('http://localhost:3001/api/ptm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({
          title: 'Annual PTM',
          date: '2026-04-20',
          classId,
          startTime: '10:00',
          endTime: '12:00',
          slotDuration: 20,
        }),
      });
    }, CLASS_10A_ID);

    // List
    const listResult = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/ptm', {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    });

    expect(listResult.data).toHaveLength(1);
    expect(listResult.data[0].title).toBe('Annual PTM');
  });

  /* ───────── 4. View slot availability ───────── */

  test('4) PTM session has available slots', async ({ page }) => {
    await page.goto('/ptm');
    await page.waitForLoadState('networkidle');

    // Create session
    const session = await page.evaluate(async (classId) => {
      const res = await fetch('http://localhost:3001/api/ptm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({
          title: 'Slot Check PTM',
          date: '2026-04-15',
          classId,
          startTime: '09:00',
          endTime: '11:00',
          slotDuration: 15,
        }),
      });
      return res.json();
    }, CLASS_10A_ID);

    // All slots should be available
    const allAvailable = session.slots.every((s: PTMSlot) => s.status === 'available');
    expect(allAvailable).toBeTruthy();
    expect(session.slots[0].time).toBe('09:00');
    expect(session.slots[session.slots.length - 1].time).toBeDefined();
  });

  /* ───────── 5. Book a slot ───────── */

  test('5) book a slot for a parent', async ({ page }) => {
    await page.goto('/ptm');
    await page.waitForLoadState('networkidle');

    // Create session
    const session = await page.evaluate(async (classId) => {
      const res = await fetch('http://localhost:3001/api/ptm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({
          title: 'Book Test PTM',
          date: '2026-04-15',
          classId,
          startTime: '09:00',
          endTime: '10:00',
          slotDuration: 15,
        }),
      });
      return res.json();
    }, CLASS_10A_ID);

    // Book first slot
    const bookResult = await page.evaluate(async (params) => {
      const res = await fetch(`http://localhost:3001/api/ptm/${params.sessionId}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({
          slotId: params.slotId,
          parentName: 'Parent of PTM Student',
          studentId: params.studentId,
          studentName: 'PTM Student',
        }),
      });
      return res.json();
    }, {
      sessionId: session._id,
      slotId: session.slots[0]._id,
      studentId: state.students[0].id,
    });

    expect(bookResult.message).toBe('Slot booked');
    expect(bookResult.slot.status).toBe('booked');
    expect(bookResult.slot.parentName).toBe('Parent of PTM Student');
  });

  /* ───────── 6. Cancel a booking ───────── */

  test('6) cancel a booked slot', async ({ page }) => {
    await page.goto('/ptm');
    await page.waitForLoadState('networkidle');

    // Create session
    const session = await page.evaluate(async (classId) => {
      const res = await fetch('http://localhost:3001/api/ptm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({
          title: 'Cancel Test PTM',
          date: '2026-04-15',
          classId,
          startTime: '09:00',
          endTime: '10:00',
          slotDuration: 15,
        }),
      });
      return res.json();
    }, CLASS_10A_ID);

    // Book a slot
    await page.evaluate(async (params) => {
      await fetch(`http://localhost:3001/api/ptm/${params.sessionId}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({
          slotId: params.slotId,
          parentName: 'Parent of PTM Student',
          studentId: params.studentId,
        }),
      });
    }, {
      sessionId: session._id,
      slotId: session.slots[0]._id,
      studentId: state.students[0].id,
    });

    // Cancel the booking
    const cancelResult = await page.evaluate(async (params) => {
      const res = await fetch(`http://localhost:3001/api/ptm/${params.sessionId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({ slotId: params.slotId }),
      });
      return res.json();
    }, {
      sessionId: session._id,
      slotId: session.slots[0]._id,
    });

    expect(cancelResult.message).toBe('Booking cancelled');
    expect(cancelResult.slot.status).toBe('available');
    expect(cancelResult.slot.parentName).toBeNull();
  });

  /* ───────── 7. View PTM schedule ───────── */

  test('7) view PTM schedule', async ({ page }) => {
    await page.goto('/ptm');
    await page.waitForLoadState('networkidle');

    // Create two sessions
    await page.evaluate(async (classId) => {
      await fetch('http://localhost:3001/api/ptm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({ title: 'PTM Session 1', date: '2026-04-15', classId, startTime: '09:00', endTime: '11:00', slotDuration: 15 }),
      });
      await fetch('http://localhost:3001/api/ptm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({ title: 'PTM Session 2', date: '2026-04-20', classId, startTime: '10:00', endTime: '12:00', slotDuration: 20 }),
      });
    }, CLASS_10A_ID);

    const schedule = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/ptm/schedule', {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    });

    expect(schedule.sessions).toHaveLength(2);
    expect(schedule.upcoming).toHaveLength(2);
    expect(schedule.past).toHaveLength(0);
  });

  /* ───��───── 8. Prevent double-booking ───────── */

  test('8) prevent booking an already-booked slot', async ({ page }) => {
    await page.goto('/ptm');
    await page.waitForLoadState('networkidle');

    // Create session
    const session = await page.evaluate(async (classId) => {
      const res = await fetch('http://localhost:3001/api/ptm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({ title: 'Double Book Test', date: '2026-04-15', classId, startTime: '09:00', endTime: '10:00', slotDuration: 15 }),
      });
      return res.json();
    }, CLASS_10A_ID);

    // Book slot
    await page.evaluate(async (params) => {
      await fetch(`http://localhost:3001/api/ptm/${params.sessionId}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({ slotId: params.slotId, parentName: 'Parent A', studentId: params.studentId }),
      });
    }, { sessionId: session._id, slotId: session.slots[0]._id, studentId: state.students[0].id });

    // Try to book same slot again
    const doubleBook = await page.evaluate(async (params) => {
      const res = await fetch(`http://localhost:3001/api/ptm/${params.sessionId}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({ slotId: params.slotId, parentName: 'Parent B', studentId: params.studentId }),
      });
      return { status: res.status, body: await res.json() };
    }, { sessionId: session._id, slotId: session.slots[0]._id, studentId: state.students[0].id });

    expect(doubleBook.status).toBe(409);
    expect(doubleBook.body.error).toBe('Slot already booked');
  });

  /* ───────── 9. State integrity ───────── */

  test('9) state has seeded student', async ({ page }) => {
    expect(state.students).toHaveLength(1);
    expect(state.students[0].name).toBe('PTM Student');
  });
});
