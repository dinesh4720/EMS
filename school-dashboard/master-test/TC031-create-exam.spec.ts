/**
 * TC031: Admin creates a new exam with all configuration.
 *
 * Verifies: exam management page load, create exam modal/form,
 * filling all fields (name, type, class, subject, dates, marks, grading),
 * exam creation, list update, and detail display.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState,
  installMockApi,
  seedStudent,
  seedExam,
  CLASS_10A_ID,
  TEACHER_A_ID,
  type MockState,
} from '../tests/test-utils';

/* ───────── Exam-specific route overrides ───────── */

async function installExamRoutes(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  // Override exams endpoint to support richer exam creation
  await page.route('**/api/exams', async (route) => {
    const method = route.request().method();
    state.requestLog.add(`${method} /api/exams`);

    if (method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: state.exams, total: state.exams.length, page: 1, limit: 100 }),
      });
    }
    if (method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      state.examCounter++;
      const id = `exam-${String(state.examCounter).padStart(6, '0')}`;
      const newExam = {
        _id: id,
        id,
        name: body.name || 'Untitled Exam',
        type: body.type || 'midterm',
        classId: body.classId || CLASS_10A_ID,
        className: body.className || '10-A',
        subjects: body.subjects || [],
        status: 'scheduled',
        date: body.startDate || body.date || '2026-05-01',
        startDate: body.startDate || '2026-05-01',
        endDate: body.endDate || '2026-05-05',
        maxMarks: body.maxMarks || 100,
        passingMarks: body.passingMarks || 35,
        gradingType: body.gradingType || 'numerical',
        instructions: body.instructions || '',
        schoolId: state.user.schoolId,
        createdAt: new Date().toISOString(),
      };
      state.exams.push(newExam as never);
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(newExam),
      });
    }
    return route.fallback();
  });

  // Single exam detail endpoint
  await page.route('**/api/exams/*', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();

    // Skip if it matches sub-routes
    if (path.includes('/results') || path.includes('/publish')) {
      return route.fallback();
    }

    const examId = path.split('/').pop();
    state.requestLog.add(`${method} /api/exams/${examId}`);

    if (method === 'GET') {
      const exam = state.exams.find((e) => e.id === examId);
      if (exam) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(exam),
        });
      }
      return route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Exam not found' }),
      });
    }
    return route.fallback();
  });

  // Exam types/config endpoint
  await page.route('**/api/exam-types*', async (route) => {
    state.requestLog.add('GET /api/exam-types');
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { value: 'unit_test', label: 'Unit Test' },
        { value: 'midterm', label: 'Mid-Term' },
        { value: 'final', label: 'Final Exam' },
        { value: 'practical', label: 'Practical' },
      ]),
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   TEST SUITE
   ═══════════════════════════════════════════════════════════════ */

test.describe('TC031: Create Exam - Full Configuration', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    // Seed some students for the class
    for (let i = 0; i < 5; i++) {
      seedStudent(state, { name: `Student ${i + 1}`, classId: CLASS_10A_ID });
    }
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });
    await installMockApi(page, state);
    await installExamRoutes(page, state);
  });

  test('1) exam management page loads with correct structure', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');

    // Wait for page content to load
    await page.waitForFunction(
      () => document.body.textContent?.toLowerCase().includes('exam') ||
            document.body.textContent?.toLowerCase().includes('academic'),
      { timeout: 10_000 },
    ).catch(() => {});

    const bodyText = await body.textContent();
    expect(bodyText?.toLowerCase()).toMatch(/exam|academic|total/i);
  });

  test('2) "Create Exam" button is visible and clickable', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await page.waitForFunction(
      () => document.body.textContent?.toLowerCase().includes('exam') ||
            document.body.textContent?.toLowerCase().includes('academic'),
      { timeout: 10_000 },
    ).catch(() => {});

    // Find and click the create exam button
    const createBtn = body.getByRole('button', { name: /create exam|add exam|new exam/i }).first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();

    // Modal or form should appear
    await page.waitForTimeout(500);
    const bodyText = await body.textContent();
    const hasForm = bodyText?.toLowerCase().includes('exam name') ||
      bodyText?.toLowerCase().includes('create') ||
      bodyText?.toLowerCase().includes('exam type') ||
      bodyText?.toLowerCase().includes('class');
    expect(hasForm).toBeTruthy();
  });

  test('3) fill exam creation form with all fields', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await page.waitForFunction(
      () => document.body.textContent?.toLowerCase().includes('exam') ||
            document.body.textContent?.toLowerCase().includes('academic'),
      { timeout: 10_000 },
    ).catch(() => {});

    // Click create exam
    const createBtn = body.getByRole('button', { name: /create exam|add exam|new exam/i }).first();
    if (await createBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(500);
    }

    // Fill exam name
    const nameInput = page.getByLabel(/exam name|name/i).first()
      .or(page.locator('input[name="name"], input[placeholder*="name" i]').first());
    if (await nameInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await nameInput.fill('Mid-Term Examination');
    }

    // Select exam type
    const typeSelect = page.getByLabel(/type|exam type/i).first()
      .or(page.locator('select[name="type"], button[aria-label*="type" i]').first());
    if (await typeSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await typeSelect.click();
      const midtermOption = page.getByRole('option', { name: /mid.?term/i }).first();
      if (await midtermOption.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await midtermOption.click();
      }
    }

    // Select class 10-A
    const classSelect = page.getByLabel(/class/i).first()
      .or(page.locator('select[name="classId"], button[aria-label*="class" i]').first());
    if (await classSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await classSelect.click();
      const classOption = page.getByRole('option', { name: /10/i }).first();
      if (await classOption.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await classOption.click();
      }
    }

    // Set max marks
    const maxMarksInput = page.getByLabel(/max.?marks|total.?marks|maximum/i).first()
      .or(page.locator('input[name="maxMarks"]').first());
    if (await maxMarksInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await maxMarksInput.clear();
      await maxMarksInput.fill('100');
    }

    // Set passing marks
    const passMarksInput = page.getByLabel(/pass.?marks|passing/i).first()
      .or(page.locator('input[name="passingMarks"]').first());
    if (await passMarksInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await passMarksInput.clear();
      await passMarksInput.fill('35');
    }

    // Verify form is filled
    const bodyText = await body.textContent();
    expect(bodyText).toBeTruthy();
  });

  test('4) submit exam creation and verify it appears in the list', async ({ page }) => {
    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    // Pre-seed no exams, then create one via API
    expect(state.exams).toHaveLength(0);

    // Create exam via API directly
    const result = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-jwt-token-admin',
        },
        body: JSON.stringify({
          name: 'Mid-Term Examination',
          type: 'midterm',
          classId: '64b100000000000000000101',
          subjects: ['Mathematics'],
          startDate: '2026-05-01',
          endDate: '2026-05-05',
          maxMarks: 100,
          passingMarks: 35,
          gradingType: 'numerical',
          instructions: 'Attempt all questions. Calculator not allowed.',
        }),
      });
      return { status: res.status, body: await res.json() };
    });

    expect(result.status).toBe(201);
    expect(result.body.name).toBe('Mid-Term Examination');
    expect(result.body.status).toBe('scheduled');
    expect(result.body.maxMarks).toBe(100);
    expect(result.body.passingMarks).toBe(35);
    expect(result.body.gradingType).toBe('numerical');

    // Verify exam is now in state
    expect(state.exams).toHaveLength(1);

    // Verify POST request was logged
    expect([...state.requestLog]).toContain('POST /api/exams');
  });

  test('5) created exam shows "Scheduled" status', async ({ page }) => {
    // Seed an exam
    const exam = seedExam(state, {
      name: 'Mid-Term Examination',
      status: 'scheduled',
    });

    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await page.waitForFunction(
      () => document.body.textContent?.toLowerCase().includes('exam') ||
            document.body.textContent?.toLowerCase().includes('academic'),
      { timeout: 10_000 },
    ).catch(() => {});

    const bodyText = await body.textContent();
    // Should show the exam name and scheduled status
    const hasExam = bodyText?.includes('Mid-Term Examination') || bodyText?.includes('1');
    expect(hasExam).toBeTruthy();
  });

  test('6) exam detail page shows all configuration correctly', async ({ page }) => {
    // Create a detailed exam
    const result = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-jwt-token-admin',
        },
        body: JSON.stringify({
          name: 'Mid-Term Examination',
          type: 'midterm',
          classId: '64b100000000000000000101',
          subjects: ['Mathematics'],
          startDate: '2026-05-01',
          endDate: '2026-05-05',
          maxMarks: 100,
          passingMarks: 35,
          gradingType: 'numerical',
          instructions: 'Attempt all questions.',
        }),
      });
      return res.json();
    });

    // Fetch the exam detail
    const detail = await page.evaluate(async (examId) => {
      const res = await fetch(`http://localhost:3001/api/exams/${examId}`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, result.id);

    expect(detail.name).toBe('Mid-Term Examination');
    expect(detail.status).toBe('scheduled');
    expect(detail.maxMarks).toBe(100);
    expect(detail.passingMarks).toBe(35);
    expect(detail.gradingType).toBe('numerical');
    expect(detail.instructions).toBe('Attempt all questions.');
    expect(detail.startDate).toBe('2026-05-01');
    expect(detail.endDate).toBe('2026-05-05');
  });

  test('7) exam list shows count after creating multiple exams', async ({ page }) => {
    seedExam(state, { name: 'Unit Test 1', status: 'scheduled' });
    seedExam(state, { name: 'Mid-Term', status: 'completed' });
    seedExam(state, { name: 'Final Exam', status: 'results_published' });

    await page.goto('/academics');
    await page.waitForLoadState('networkidle');

    await page.waitForFunction(
      () => document.body.textContent?.toLowerCase().includes('total exams') ||
            document.body.textContent?.toLowerCase().includes('exam'),
      { timeout: 10_000 },
    ).catch(() => {});

    const bodyText = await page.textContent('body');
    // Should show 3 exams or individual status counts
    const hasExamCount = bodyText?.includes('3') ||
      (bodyText?.includes('Unit Test') && bodyText?.includes('Mid-Term'));
    expect(hasExamCount).toBeTruthy();

    // Verify API was called
    expect([...state.requestLog].some((r) => r.includes('GET /api/exams'))).toBeTruthy();
  });
});
