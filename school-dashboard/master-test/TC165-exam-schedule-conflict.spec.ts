/**
 * TC165: Exam Schedule Conflict Detection & Management
 *
 * Verifies: schedule list load, empty state, conflict detection banner,
 * status workflow (draft → scheduled → sent), generate/confirm/send/delete
 * actions, and error handling.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState,
  installMockApi,
  CLASS_10A_ID,
  CLASS_11A_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  TYPES & HELPERS
 * ───────────────────────────────────────────────────────────────────── */

interface ExamSchedule {
  _id: string;
  name: string;
  classIds: Array<{ _id: string; name: string; section: string } | string>;
  startDate: string;
  endDate: string;
  status: 'draft' | 'scheduled' | 'sent';
  type?: string;
  entries?: unknown[];
}

function seedExamSchedule(
  overrides: Partial<ExamSchedule> = {},
): ExamSchedule {
  const id = `es-${Math.random().toString(36).slice(2, 10)}`;
  return {
    _id: id,
    name: overrides.name || 'Mid-Term Examination',
    classIds: overrides.classIds || [CLASS_10A_ID],
    startDate: overrides.startDate || '2026-03-01',
    endDate: overrides.endDate || '2026-03-10',
    status: overrides.status || 'draft',
    type: overrides.type || 'summative',
    entries: overrides.entries ?? [],
  };
}

/* ─────────────────────────────────────────────────────────────────────
 *  MOCK ROUTES
 * ───────────────────────────────────────────────────────────────────── */

async function installExamScheduleRoutes(
  page: import('@playwright/test').Page,
  state: MockState,
  schedules: ExamSchedule[],
) {
  // GET /api/exam-schedules?academicYear=...
  await page.route('**/api/exam-schedules*', async (route) => {
    const method = route.request().method();
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/\/+$/, '');

    if (method === 'GET' && path === '/api/exam-schedules') {
      state.requestLog.add('GET /api/exam-schedules');
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(schedules),
      });
    }

    // DELETE /api/exam-schedules/:id
    if (method === 'DELETE' && path.match(/^\/api\/exam-schedules\/[^/]+$/)) {
      const id = path.split('/')[3];
      state.requestLog.add(`DELETE /api/exam-schedules/${id}`);
      const idx = schedules.findIndex((s) => s._id === id);
      if (idx >= 0) schedules.splice(idx, 1);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Deleted' }),
      });
    }

    // POST /api/exam-schedules/:id/generate
    if (method === 'POST' && path.match(/^\/api\/exam-schedules\/[^/]+\/generate$/)) {
      const id = path.split('/')[3];
      state.requestLog.add(`POST /api/exam-schedules/${id}/generate`);
      const s = schedules.find((sch) => sch._id === id);
      if (s) s.entries = [{ subject: 'Mathematics', date: '2026-03-02' }];
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    }

    // POST /api/exam-schedules/:id/confirm
    if (method === 'POST' && path.match(/^\/api\/exam-schedules\/[^/]+\/confirm$/)) {
      const id = path.split('/')[3];
      state.requestLog.add(`POST /api/exam-schedules/${id}/confirm`);
      const s = schedules.find((sch) => sch._id === id);
      if (s) s.status = 'scheduled';
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    }

    // POST /api/exam-schedules/:id/send
    if (method === 'POST' && path.match(/^\/api\/exam-schedules\/[^/]+\/send$/)) {
      const id = path.split('/')[3];
      state.requestLog.add(`POST /api/exam-schedules/${id}/send`);
      const s = schedules.find((sch) => sch._id === id);
      if (s) s.status = 'sent';
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    }

    return route.continue();
  });
}

/* ═════════════════════════════════════════════════════════════════════
   TEST SUITE
   ═════════════════════════════════════════════════════════════════════ */

test.describe('TC165 — Exam Schedule Conflict Detection & Management', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);
  });

  /* ───────── 1. Empty state ───────── */

  test('1) empty state shows when no exam schedules exist', async ({ page }) => {
    const schedules: ExamSchedule[] = [];
    await installExamScheduleRoutes(page, state, schedules);

    await page.goto('/academics/schedules');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toContainText('No exam schedules yet', { timeout: 15000 });
    await expect(page.locator('body')).toContainText('Create First Schedule');
  });

  /* ───────── 2. Schedule list loads ───────── */

  test('2) schedule list displays names, dates, and class info', async ({ page }) => {
    const schedules: ExamSchedule[] = [
      seedExamSchedule({ name: 'Mid-Term 2026', status: 'draft', startDate: '2026-03-01', endDate: '2026-03-10' }),
      seedExamSchedule({ name: 'Final Exam 2026', status: 'scheduled', startDate: '2026-04-01', endDate: '2026-04-15' }),
    ];
    await installExamScheduleRoutes(page, state, schedules);

    await page.goto('/academics/schedules');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toContainText('Mid-Term 2026', { timeout: 15000 });
    await expect(page.locator('body')).toContainText('Final Exam 2026');
    await expect(page.locator('body')).toContainText('1 Mar');
    await expect(page.locator('body')).toContainText('10 Mar');
  });

  /* ───────── 3. Status badges ───────── */

  test('3) status badges render correctly for each schedule', async ({ page }) => {
    const schedules: ExamSchedule[] = [
      seedExamSchedule({ name: 'Draft Exam', status: 'draft' }),
      seedExamSchedule({ name: 'Confirmed Exam', status: 'scheduled' }),
      seedExamSchedule({ name: 'Sent Exam', status: 'sent' }),
    ];
    await installExamScheduleRoutes(page, state, schedules);

    await page.goto('/academics/schedules');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toContainText('Draft', { timeout: 15000 });
    await expect(page.locator('body')).toContainText('Confirmed');
    await expect(page.locator('body')).toContainText('Sent to Parents');
  });

  /* ───────── 4. No conflicts ───────── */

  test('4) non-overlapping schedules do not show conflict banner', async ({ page }) => {
    const schedules: ExamSchedule[] = [
      seedExamSchedule({ name: 'Term 1', startDate: '2026-03-01', endDate: '2026-03-05', classIds: [CLASS_10A_ID] }),
      seedExamSchedule({ name: 'Term 2', startDate: '2026-04-01', endDate: '2026-04-05', classIds: [CLASS_10A_ID] }),
    ];
    await installExamScheduleRoutes(page, state, schedules);

    await page.goto('/academics/schedules');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toContainText('Term 1', { timeout: 15000 });
    await expect(page.locator('body')).not.toContainText('schedule conflict');
    await expect(page.locator('body')).not.toContainText('Conflict');
  });

  /* ───────── 5. Conflict detection ───────── */

  test('5) overlapping schedules for same class show conflict banner and chips', async ({ page }) => {
    const schedules: ExamSchedule[] = [
      seedExamSchedule({
        name: 'Math Exam',
        startDate: '2026-03-01',
        endDate: '2026-03-10',
        classIds: [CLASS_10A_ID],
        status: 'draft',
      }),
      seedExamSchedule({
        name: 'Science Exam',
        startDate: '2026-03-05',
        endDate: '2026-03-15',
        classIds: [CLASS_10A_ID],
        status: 'draft',
      }),
    ];
    await installExamScheduleRoutes(page, state, schedules);

    await page.goto('/academics/schedules');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toContainText('1 schedule conflict detected', { timeout: 15000 });
    await expect(page.locator('body')).toContainText('The highlighted schedules share overlapping date ranges for the same class.');

    // Both cards should have Conflict chip
    const conflictChips = page.locator('text=Conflict');
    await expect(conflictChips).toHaveCount(2);
  });

  /* ───────── 6. Multiple conflicts ───────── */

  test('6) multiple overlapping schedules show plural conflict banner', async ({ page }) => {
    const schedules: ExamSchedule[] = [
      seedExamSchedule({ name: 'Exam A', startDate: '2026-03-01', endDate: '2026-03-10', classIds: [CLASS_10A_ID] }),
      seedExamSchedule({ name: 'Exam B', startDate: '2026-03-05', endDate: '2026-03-15', classIds: [CLASS_10A_ID] }),
      seedExamSchedule({ name: 'Exam C', startDate: '2026-03-08', endDate: '2026-03-20', classIds: [CLASS_10A_ID] }),
    ];
    await installExamScheduleRoutes(page, state, schedules);

    await page.goto('/academics/schedules');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toContainText('3 schedule conflicts detected', { timeout: 15000 });
  });

  /* ───────── 7. Different classes do not conflict ───────── */

  test('7) overlapping dates for different classes do not conflict', async ({ page }) => {
    const schedules: ExamSchedule[] = [
      seedExamSchedule({ name: '10A Exam', startDate: '2026-03-01', endDate: '2026-03-10', classIds: [CLASS_10A_ID] }),
      seedExamSchedule({ name: '11A Exam', startDate: '2026-03-05', endDate: '2026-03-15', classIds: [CLASS_11A_ID] }),
    ];
    await installExamScheduleRoutes(page, state, schedules);

    await page.goto('/academics/schedules');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toContainText('10A Exam', { timeout: 15000 });
    await expect(page.locator('body')).toContainText('11A Exam');
    await expect(page.locator('body')).not.toContainText('schedule conflict');
  });

  /* ───────── 8. Generate timetable action ───────── */

  test('8) draft schedule without entries can generate timetable', async ({ page }) => {
    const schedules: ExamSchedule[] = [
      seedExamSchedule({ name: 'Generate Test', status: 'draft', entries: [] }),
    ];
    await installExamScheduleRoutes(page, state, schedules);

    await page.goto('/academics/schedules');
    await page.waitForLoadState('networkidle');

    const generateBtn = page.locator('button[title="Generate timetable"]');
    await expect(generateBtn).toBeVisible({ timeout: 10000 });
    await generateBtn.click();

    // Wait for API call and re-fetch
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toContainText('Timetable generated successfully', { timeout: 10000 });
    expect(state.requestLog.has(`POST /api/exam-schedules/${schedules[0]._id}/generate`)).toBe(true);
  });

  /* ───────── 9. Confirm schedule action ───────── */

  test('9) draft schedule with entries can be confirmed', async ({ page }) => {
    const schedules: ExamSchedule[] = [
      seedExamSchedule({ name: 'Confirm Test', status: 'draft', entries: [{ subject: 'Math' }] }),
    ];
    await installExamScheduleRoutes(page, state, schedules);

    await page.goto('/academics/schedules');
    await page.waitForLoadState('networkidle');

    const confirmBtn = page.locator('button[title="Confirm schedule"]');
    await expect(confirmBtn).toBeVisible({ timeout: 10000 });
    await confirmBtn.click();

    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toContainText('Schedule confirmed', { timeout: 10000 });
    expect(state.requestLog.has(`POST /api/exam-schedules/${schedules[0]._id}/confirm`)).toBe(true);
  });

  /* ───────── 10. Send to parents action ───────── */

  test('10) scheduled schedule can be sent to parents', async ({ page }) => {
    const schedules: ExamSchedule[] = [
      seedExamSchedule({ name: 'Send Test', status: 'scheduled' }),
    ];
    await installExamScheduleRoutes(page, state, schedules);

    await page.goto('/academics/schedules');
    await page.waitForLoadState('networkidle');

    const sendBtn = page.locator('button[title="Send to parents"]');
    await expect(sendBtn).toBeVisible({ timeout: 10000 });
    await sendBtn.click();

    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toContainText('Timetable sent to parents', { timeout: 10000 });
    expect(state.requestLog.has(`POST /api/exam-schedules/${schedules[0]._id}/send`)).toBe(true);
  });

  /* ───────── 11. Delete schedule with confirmation ───────── */

  test('11) delete schedule opens modal and removes item on confirm', async ({ page }) => {
    const schedules: ExamSchedule[] = [
      seedExamSchedule({ name: 'Delete Me', status: 'draft' }),
    ];
    await installExamScheduleRoutes(page, state, schedules);

    await page.goto('/academics/schedules');
    await page.waitForLoadState('networkidle');

    const deleteBtn = page.locator('button[title="Delete schedule"]');
    await expect(deleteBtn).toBeVisible({ timeout: 10000 });
    await deleteBtn.click();

    // Modal appears
    await expect(page.locator('body')).toContainText('Delete Schedule', { timeout: 5000 });
    await expect(page.locator('body')).toContainText('This will also delete all generated exams and results.');
    await expect(page.locator('body')).toContainText('Delete Me');

    // Click Delete in modal
    await page.getByRole('button', { name: 'Delete' }).click();

    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toContainText('Exam schedule deleted', { timeout: 10000 });
    await expect(page.locator('body')).not.toContainText('Delete Me');
    expect(state.requestLog.has(`DELETE /api/exam-schedules/${schedules[0]._id}`)).toBe(true);
  });

  /* ───────── 12. Delete cancellation ───────── */

  test('12) cancel delete modal keeps schedule in list', async ({ page }) => {
    const schedules: ExamSchedule[] = [
      seedExamSchedule({ name: 'Keep Me', status: 'draft' }),
    ];
    await installExamScheduleRoutes(page, state, schedules);

    await page.goto('/academics/schedules');
    await page.waitForLoadState('networkidle');

    await page.locator('button[title="Delete schedule"]').click();
    await expect(page.locator('body')).toContainText('Delete Schedule', { timeout: 5000 });

    // Click Cancel
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Modal closes, schedule still visible
    await expect(page.locator('body')).toContainText('Keep Me', { timeout: 10000 });
    expect(state.requestLog.has(`DELETE /api/exam-schedules/${schedules[0]._id}`)).toBe(false);
  });

  /* ───────── 13. API error on load ───────── */

  test('13) API failure shows error toast and empty fallback', async ({ page }) => {
    await page.route('**/api/exam-schedules*', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Server error' }) });
      }
      return route.continue();
    });

    await page.goto('/academics/schedules');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toContainText('Failed to load exam schedules', { timeout: 15000 });
  });

  /* ───────── 14. Schedule type label ───────── */

  test('14) schedule type is displayed in readable format', async ({ page }) => {
    const schedules: ExamSchedule[] = [
      seedExamSchedule({ name: 'Type Test', type: 'formative_assessment' }),
    ];
    await installExamScheduleRoutes(page, state, schedules);

    await page.goto('/academics/schedules');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toContainText('formative assessment', { timeout: 15000 });
  });
});
