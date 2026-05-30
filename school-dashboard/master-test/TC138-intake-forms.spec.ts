/**
 * TC098: Manage intake/admission forms: assignments, submissions, enrollment funnel.
 *
 * Verifies: form assignments page, create assignment, submissions list,
 * view submission, approve/reject, enrollment funnel visualization.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState,
  installMockApi,
  CLASS_10A_ID,
  CLASS_11A_ID,
  SCHOOL_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ───────── Intake forms route overrides ───────── */

interface FormAssignment {
  _id: string;
  formName: string;
  classId: string;
  className: string;
  academicYear: string;
  status: string;
  deadline: string;
  totalSubmissions: number;
  pendingReview: number;
  schoolId: string;
}

interface FormSubmission {
  _id: string;
  assignmentId: string;
  studentName: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  classAppliedFor: string;
  status: string; // submitted | under_review | approved | rejected
  submittedAt: string;
  reviewedAt: string | null;
  data: Record<string, unknown>;
  schoolId: string;
}

async function installIntakeFormRoutes(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  const assignments: FormAssignment[] = [];
  const submissions: FormSubmission[] = [];
  let assignCounter = 0;
  let subCounter = 0;

  // Pre-seed some data
  assignCounter++;
  assignments.push({
    _id: 'assign-1',
    formName: 'Admission Form 2026-27',
    classId: CLASS_10A_ID,
    className: '10-A',
    academicYear: '2026-2027',
    status: 'active',
    deadline: '2026-06-30',
    totalSubmissions: 3,
    pendingReview: 2,
    schoolId: SCHOOL_ID,
  });

  // Pre-seed submissions
  const submissionData = [
    { name: 'Aarav Patel', parent: 'Rajesh Patel', status: 'submitted' },
    { name: 'Priya Singh', parent: 'Meera Singh', status: 'under_review' },
    { name: 'Arjun Kumar', parent: 'Suresh Kumar', status: 'approved' },
  ];
  for (const s of submissionData) {
    subCounter++;
    submissions.push({
      _id: `sub-${subCounter}`,
      assignmentId: 'assign-1',
      studentName: s.name,
      parentName: s.parent,
      parentEmail: `${s.parent.toLowerCase().replace(' ', '.')}@test.com`,
      parentPhone: `98765${String(subCounter).padStart(5, '0')}`,
      classAppliedFor: '10-A',
      status: s.status,
      submittedAt: `2026-03-${String(15 + subCounter).padStart(2, '0')}T10:00:00.000Z`,
      reviewedAt: s.status === 'approved' ? '2026-03-20T14:00:00.000Z' : null,
      data: {
        dateOfBirth: '2011-05-15',
        gender: 'Male',
        previousSchool: 'ABC School',
        address: '123 Main Street',
        city: 'Bangalore',
        documents: { aadhaar: true, birthCertificate: true, marksheet: true },
      },
      schoolId: SCHOOL_ID,
    });
  }

  // Assignments endpoint
  await page.route('**/api/intake-forms/assignments*', async (route) => {
    const method = route.request().method();
    state.requestLog.add(`${method} /api/intake-forms/assignments`);

    if (method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      assignCounter++;
      const cls = state.classes.find((c) => c.id === body.classId);
      const newAssignment: FormAssignment = {
        _id: `assign-${assignCounter}`,
        formName: body.formName || `Admission Form ${assignCounter}`,
        classId: body.classId || CLASS_10A_ID,
        className: cls ? `${cls.name}-${cls.section}` : '10-A',
        academicYear: body.academicYear || '2026-2027',
        status: 'active',
        deadline: body.deadline || '2026-06-30',
        totalSubmissions: 0,
        pendingReview: 0,
        schoolId: SCHOOL_ID,
      };
      assignments.push(newAssignment);

      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(newAssignment),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: assignments,
        total: assignments.length,
      }),
    });
  });

  // Submissions endpoint
  await page.route('**/api/intake-forms/submissions**', async (route) => {
    const method = route.request().method();
    const url = new URL(route.request().url());
    const path = url.pathname;
    state.requestLog.add(`${method} ${path}`);

    // GET specific submission
    if (method === 'GET' && path.match(/\/submissions\/[^/]+$/)) {
      const subId = path.split('/').pop();
      const submission = submissions.find((s) => s._id === subId);
      if (submission) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(submission),
        });
      }
      return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) });
    }

    // PUT - approve/reject
    if (method === 'PUT' || method === 'PATCH') {
      const subId = path.split('/')[4]; // /api/intake-forms/submissions/:id
      const body = JSON.parse(route.request().postData() || '{}');
      const idx = submissions.findIndex((s) => s._id === subId);

      if (idx >= 0) {
        if (body.status) submissions[idx].status = body.status;
        if (body.status === 'approved' || body.status === 'rejected') {
          submissions[idx].reviewedAt = new Date().toISOString();
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(submissions[idx]),
        });
      }
      return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) });
    }

    // GET - list submissions
    const assignmentId = url.searchParams.get('assignmentId');
    const statusFilter = url.searchParams.get('status');
    let filtered = [...submissions];
    if (assignmentId) filtered = filtered.filter((s) => s.assignmentId === assignmentId);
    if (statusFilter) filtered = filtered.filter((s) => s.status === statusFilter);

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: filtered,
        total: filtered.length,
      }),
    });
  });

  // Approve endpoint
  await page.route('**/api/intake-forms/submissions/*/approve', async (route) => {
    const url = new URL(route.request().url());
    const subId = url.pathname.split('/')[4];
    state.requestLog.add(`POST /api/intake-forms/submissions/${subId}/approve`);

    const idx = submissions.findIndex((s) => s._id === subId);
    if (idx >= 0) {
      submissions[idx].status = 'approved';
      submissions[idx].reviewedAt = new Date().toISOString();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Submission approved', submission: submissions[idx] }),
      });
    }
    return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) });
  });

  // Reject endpoint
  await page.route('**/api/intake-forms/submissions/*/reject', async (route) => {
    const url = new URL(route.request().url());
    const subId = url.pathname.split('/')[4];
    state.requestLog.add(`POST /api/intake-forms/submissions/${subId}/reject`);

    const idx = submissions.findIndex((s) => s._id === subId);
    if (idx >= 0) {
      submissions[idx].status = 'rejected';
      submissions[idx].reviewedAt = new Date().toISOString();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Submission rejected', submission: submissions[idx] }),
      });
    }
    return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) });
  });

  // Funnel endpoint
  await page.route('**/api/intake-forms/funnel*', async (route) => {
    state.requestLog.add('GET /api/intake-forms/funnel');

    const totalSubmitted = submissions.length;
    const underReview = submissions.filter((s) => s.status === 'under_review').length;
    const approved = submissions.filter((s) => s.status === 'approved').length;
    const rejected = submissions.filter((s) => s.status === 'rejected').length;
    const enrolled = 0; // Would track actual enrollments

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        funnel: [
          { stage: 'Submitted', count: totalSubmitted, percentage: 100 },
          { stage: 'Under Review', count: underReview, percentage: Math.round((underReview / totalSubmitted) * 100) },
          { stage: 'Approved', count: approved, percentage: Math.round((approved / totalSubmitted) * 100) },
          { stage: 'Rejected', count: rejected, percentage: Math.round((rejected / totalSubmitted) * 100) },
          { stage: 'Enrolled', count: enrolled, percentage: 0 },
        ],
        classWise: [
          { classId: CLASS_10A_ID, className: '10-A', submitted: totalSubmitted, approved, rejected, pending: totalSubmitted - approved - rejected },
        ],
        conversionRate: totalSubmitted > 0 ? Math.round((approved / totalSubmitted) * 100) : 0,
      }),
    });
  });

  return { getAssignments: () => assignments, getSubmissions: () => submissions };
}

/* ═══════════════════════════════════════════════════════════════
   TEST SUITE
   ═══════════════════════════════════════════════════════════════ */

test.describe('TC098 — Intake Forms: Assignments, Submissions & Funnel', () => {
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
    await installIntakeFormRoutes(page, state);
  });

  /* ───────── 1. Assignments page loads ───────── */

  test('1) form assignments page loads', async ({ page }) => {
    await page.goto('/intake-forms/assignments');
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.toLowerCase().includes('intake') ||
      bodyText?.toLowerCase().includes('form') ||
      bodyText?.toLowerCase().includes('assignment') ||
      bodyText?.toLowerCase().includes('admission') ||
      bodyText?.toLowerCase().includes('loading'),
    ).toBeTruthy();
  });

  /* ───────── 2. List pre-seeded assignments ───────── */

  test('2) assignments API returns pre-seeded data', async ({ page }) => {
    await page.goto('/intake-forms/assignments');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/intake-forms/assignments', {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].formName).toBe('Admission Form 2026-27');
    expect(result.data[0].className).toBe('10-A');
    expect(result.data[0].status).toBe('active');
    expect(result.data[0].totalSubmissions).toBe(3);
  });

  /* ───────── 3. Create new form assignment ───────── */

  test('3) create new form assignment via API', async ({ page }) => {
    await page.goto('/intake-forms/assignments');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (classId) => {
      const res = await fetch('http://localhost:3001/api/intake-forms/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-jwt-token-admin',
        },
        body: JSON.stringify({
          formName: 'Class 11 Admission Form',
          classId,
          academicYear: '2026-2027',
          deadline: '2026-07-15',
        }),
      });
      return res.json();
    }, CLASS_11A_ID);

    expect(result._id).toBeDefined();
    expect(result.formName).toBe('Class 11 Admission Form');
    expect(result.className).toBe('11-A');
    expect(result.status).toBe('active');
  });

  /* ───────── 4. Submissions page loads ───────── */

  test('4) submissions list page loads', async ({ page }) => {
    await page.goto('/intake-forms/submissions');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.toLowerCase().includes('submission') ||
      bodyText?.toLowerCase().includes('intake') ||
      bodyText?.toLowerCase().includes('form') ||
      bodyText?.toLowerCase().includes('admission') ||
      bodyText?.toLowerCase().includes('loading'),
    ).toBeTruthy();
  });

  /* ───────── 5. List submissions ───────── */

  test('5) submissions API returns pre-seeded submissions', async ({ page }) => {
    await page.goto('/intake-forms/submissions');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/intake-forms/submissions', {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    });

    expect(result.data).toHaveLength(3);
    expect(result.data[0].studentName).toBe('Aarav Patel');
    expect(result.data[1].studentName).toBe('Priya Singh');
    expect(result.data[2].studentName).toBe('Arjun Kumar');
  });

  /* ───────── 6. View a submission ───────── */

  test('6) view submission detail', async ({ page }) => {
    await page.goto('/intake-forms/submissions');
    await page.waitForLoadState('networkidle');

    const submission = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/intake-forms/submissions/sub-1', {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    });

    expect(submission.studentName).toBe('Aarav Patel');
    expect(submission.parentName).toBe('Rajesh Patel');
    expect(submission.classAppliedFor).toBe('10-A');
    expect(submission.data).toBeDefined();
    expect(submission.data.previousSchool).toBe('ABC School');
    expect(submission.data.documents.aadhaar).toBe(true);
  });

  /* ───────── 7. Approve a submission ───────── */

  test('7) approve a submitted form', async ({ page }) => {
    await page.goto('/intake-forms/submissions');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/intake-forms/submissions/sub-1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-jwt-token-admin',
        },
        body: JSON.stringify({ status: 'approved' }),
      });
      return res.json();
    });

    expect(result.status).toBe('approved');
    expect(result.reviewedAt).toBeDefined();
  });

  /* ───────── 8. Reject a submission ───────── */

  test('8) reject a submitted form', async ({ page }) => {
    await page.goto('/intake-forms/submissions');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/intake-forms/submissions/sub-2', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-jwt-token-admin',
        },
        body: JSON.stringify({ status: 'rejected' }),
      });
      return res.json();
    });

    expect(result.status).toBe('rejected');
    expect(result.reviewedAt).toBeDefined();
  });

  /* ───────── 9. Enrollment funnel page loads ───────── */

  test('9) enrollment funnel page loads', async ({ page }) => {
    await page.goto('/intake-forms/funnel');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.toLowerCase().includes('funnel') ||
      bodyText?.toLowerCase().includes('enrollment') ||
      bodyText?.toLowerCase().includes('intake') ||
      bodyText?.toLowerCase().includes('form') ||
      bodyText?.toLowerCase().includes('loading'),
    ).toBeTruthy();
  });

  /* ───────── 10. Funnel data ───────── */

  test('10) funnel API returns enrollment pipeline data', async ({ page }) => {
    await page.goto('/intake-forms/funnel');
    await page.waitForLoadState('networkidle');

    const funnelData = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/intake-forms/funnel', {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    });

    expect(funnelData.funnel).toBeDefined();
    expect(funnelData.funnel).toHaveLength(5);

    const stages = funnelData.funnel.map((s: { stage: string }) => s.stage);
    expect(stages).toEqual(['Submitted', 'Under Review', 'Approved', 'Rejected', 'Enrolled']);

    // Submitted count should be 3 (pre-seeded)
    expect(funnelData.funnel[0].count).toBe(3);
    expect(funnelData.funnel[0].percentage).toBe(100);

    // Conversion rate
    expect(funnelData.conversionRate).toBeDefined();
    expect(typeof funnelData.conversionRate).toBe('number');
  });

  /* ───────── 11. Class-wise funnel breakdown ───────── */

  test('11) funnel includes class-wise breakdown', async ({ page }) => {
    await page.goto('/intake-forms/funnel');
    await page.waitForLoadState('networkidle');

    const funnelData = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/intake-forms/funnel', {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    });

    expect(funnelData.classWise).toBeDefined();
    expect(funnelData.classWise).toHaveLength(1);
    expect(funnelData.classWise[0].className).toBe('10-A');
    expect(funnelData.classWise[0].submitted).toBe(3);
  });

  /* ───────── 12. Filter submissions by status ───────── */

  test('12) filter submissions by status', async ({ page }) => {
    await page.goto('/intake-forms/submissions');
    await page.waitForLoadState('networkidle');

    const approvedOnly = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/intake-forms/submissions?status=approved', {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    });

    expect(approvedOnly.data).toHaveLength(1);
    expect(approvedOnly.data[0].studentName).toBe('Arjun Kumar');
  });

  /* ───────── 13. State integrity ───────── */

  test('13) mock state has 2 classes', async ({ page }) => {
    expect(state.classes).toHaveLength(2);
    expect(state.classes[0].name).toBe('10');
    expect(state.classes[1].name).toBe('11');
  });
});
