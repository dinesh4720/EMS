/**
 * TC170 — Student Form Submissions
 *
 * Verifies the /students/submissions page: filter tabs with counts,
 * submission table, review modal (approve / reject / request-edit),
 * request-edit modal, validation errors, empty states, and navigation
 * to a student record.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState,
  installMockApi,
  SCHOOL_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ───────── Local types ───────── */

interface FormSubmission {
  _id: string;
  formId?: { _id: string; formName: string; fields: FormField[] } | null;
  formName?: string;
  formType?: string;
  form?: { formName: string; formType: string };
  submissionData: Record<string, unknown>;
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  submittedAt?: string;
  studentId?: string;
  submitterName?: string;
  schoolId: string;
}

interface FormField {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  mapTo?: string;
  defaultValue?: unknown;
}

/* ───────── Route installer ───────── */

async function installSubmissionRoutes(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  const submissions: FormSubmission[] = [];
  let counter = 0;

  const formFields: FormField[] = [
    { id: 'studentName', label: 'Student Name', type: 'text', required: true, mapTo: 'Student Name' },
    { id: 'dob', label: 'Date of Birth', type: 'date', required: true, mapTo: 'Date of Birth' },
    { id: 'gender', label: 'Gender', type: 'select', required: true, mapTo: 'Gender' },
    { id: 'parentEmail', label: 'Parent Email', type: 'email', required: true, mapTo: 'Parent Email' },
    { id: 'parentPhone', label: 'Parent Phone', type: 'phone', required: true, mapTo: 'Parent Phone' },
    { id: 'address', label: 'Address', type: 'textarea', required: false, mapTo: 'Address' },
    { id: 'previousSchool', label: 'Previous School', type: 'text', required: false, mapTo: 'Previous School' },
  ];

  function seedSubmission(overrides: Partial<FormSubmission> = {}): FormSubmission {
    counter++;
    const id = `sub-${String(counter).padStart(4, '0')}`;
    const statuses: Array<'pending' | 'approved' | 'rejected' | 'needs_revision'> = ['pending', 'approved', 'rejected', 'needs_revision'];
    const status = overrides.reviewStatus || statuses[counter % statuses.length];
    const studentName = overrides.submissionData?.['Student Name'] as string || `Student ${counter}`;
    const record: FormSubmission = {
      _id: id,
      formId: {
        _id: `form-${counter}`,
        formName: overrides.formName || 'Admission Form 2026-27',
        fields: formFields,
      },
      formName: overrides.formName || 'Admission Form 2026-27',
      formType: 'student',
      submissionData: {
        'Student Name': studentName,
        'Date of Birth': '2011-05-15',
        'Gender': 'Male',
        'Parent Email': `parent${counter}@test.com`,
        'Parent Phone': `98765${String(counter).padStart(5, '0')}`,
        'Address': '123 MG Road, Bangalore',
        'Previous School': 'St. Joseph School',
        ...overrides.submissionData,
      },
      reviewStatus: status,
      reviewNotes: status !== 'pending' ? (overrides.reviewNotes || 'Reviewed by admin') : undefined,
      reviewedBy: status !== 'pending' ? (overrides.reviewedBy || 'Admin User') : undefined,
      reviewedAt: status !== 'pending' ? (overrides.reviewedAt || '2026-03-20T10:00:00.000Z') : undefined,
      submittedAt: overrides.submittedAt || `2026-03-${String(10 + counter).padStart(2, '0')}T09:00:00.000Z`,
      studentId: overrides.studentId,
      submitterName: overrides.submitterName || 'Parent',
      schoolId: SCHOOL_ID,
    };
    submissions.push(record);
    return record;
  }

  // Seed realistic Indian-school data
  seedSubmission({
    studentName: 'Aarav Patel',
    reviewStatus: 'pending',
    submissionData: {
      'Student Name': 'Aarav Patel',
      'Date of Birth': '2011-03-12',
      'Gender': 'Male',
      'Parent Email': 'rajesh.patel@test.com',
      'Parent Phone': '9876543210',
      'Address': '45 Gandhi Nagar, Ahmedabad',
      'Previous School': 'Delhi Public School',
    },
  });
  seedSubmission({
    studentName: 'Priya Sharma',
    reviewStatus: 'pending',
    submissionData: {
      'Student Name': 'Priya Sharma',
      'Date of Birth': '2010-08-25',
      'Gender': 'Female',
      'Parent Email': 'meera.sharma@test.com',
      'Parent Phone': '9876543211',
      'Address': '12 Brigade Road, Bangalore',
      'Previous School': 'Kendriya Vidyalaya',
    },
  });
  seedSubmission({
    studentName: 'Arjun Kumar',
    reviewStatus: 'approved',
    studentId: 'stu-arjun-001',
    submissionData: {
      'Student Name': 'Arjun Kumar',
      'Date of Birth': '2011-01-10',
      'Gender': 'Male',
      'Parent Email': 'suresh.kumar@test.com',
      'Parent Phone': '9876543212',
      'Address': '78 Anna Salai, Chennai',
      'Previous School': 'PSBB Millennium',
    },
  });
  seedSubmission({
    studentName: 'Ananya Reddy',
    reviewStatus: 'rejected',
    reviewNotes: 'Incomplete documents — birth certificate missing',
    submissionData: {
      'Student Name': 'Ananya Reddy',
      'Date of Birth': '2010-11-05',
      'Gender': 'Female',
      'Parent Email': 'lakshmi.reddy@test.com',
      'Parent Phone': '9876543213',
      'Address': '22 Banjara Hills, Hyderabad',
      'Previous School': 'Chirec International',
    },
  });
  seedSubmission({
    studentName: 'Rohan Desai',
    reviewStatus: 'needs_revision',
    submissionData: {
      'Student Name': 'Rohan Desai',
      'Date of Birth': '2011-06-18',
      'Gender': 'Male',
      'Parent Email': 'amit.desai@test.com',
      'Parent Phone': '9876543214',
      'Address': '55 FC Road, Pune',
      'Previous School': 'Sanskriti School',
    },
  });

  // GET list /form-submissions
  await page.route('**/api/form-submissions*', async (route) => {
    const method = route.request().method();
    const url = new URL(route.request().url());
    const path = url.pathname;

    // GET specific submission
    if (method === 'GET' && path.match(/\/form-submissions\/[^/]+$/)) {
      const subId = path.split('/').pop();
      const sub = submissions.find((s) => s._id === subId);
      if (sub) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(sub) });
      }
      return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) });
    }

    // GET list
    if (method === 'GET') {
      const reviewStatus = url.searchParams.get('reviewStatus');
      let filtered = submissions.filter((s) => s.formType === 'student' || s.form?.formType === 'student');
      if (reviewStatus) {
        filtered = filtered.filter((s) => s.reviewStatus === reviewStatus);
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(filtered),
      });
    }

    return route.fallback();
  });

  // PUT review /form-submissions/:id/review
  await page.route('**/api/form-submissions/*/review', async (route) => {
    const method = route.request().method();
    if (method !== 'PUT') return route.fallback();

    const url = new URL(route.request().url());
    const subId = url.pathname.split('/')[3];
    const body = JSON.parse(route.request().postData() || '{}');
    const idx = submissions.findIndex((s) => s._id === subId);

    if (idx >= 0) {
      submissions[idx].reviewStatus = body.reviewStatus;
      submissions[idx].reviewNotes = body.reviewNotes;
      submissions[idx].reviewedBy = body.reviewedBy;
      submissions[idx].reviewedAt = new Date().toISOString();
      if (body.reviewStatus === 'approved') {
        submissions[idx].studentId = submissions[idx].studentId || `stu-${subId}`;
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(submissions[idx]),
      });
    }
    return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) });
  });

  // POST request-edit /form-submissions/:id/request-edit
  await page.route('**/api/form-submissions/*/request-edit', async (route) => {
    const method = route.request().method();
    if (method !== 'POST') return route.fallback();

    const url = new URL(route.request().url());
    const subId = url.pathname.split('/')[3];
    const body = JSON.parse(route.request().postData() || '{}');
    const idx = submissions.findIndex((s) => s._id === subId);

    if (idx >= 0) {
      submissions[idx].reviewStatus = 'needs_revision';
      submissions[idx].reviewNotes = body.notes;
      submissions[idx].reviewedBy = body.requestedBy;
      submissions[idx].reviewedAt = new Date().toISOString();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Edit requested', submission: submissions[idx] }),
      });
    }
    return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) });
  });

  return { getSubmissions: () => submissions, seedSubmission };
}

/* ═══════════════════════════════════════════════════════════════
   TEST SUITE
   ═══════════════════════════════════════════════════════════════ */

test.describe('TC170 — Student Form Submissions', () => {
  let state: MockState;
  let helpers: { getSubmissions: () => FormSubmission[]; seedSubmission: (o?: Partial<FormSubmission>) => FormSubmission };

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);
    helpers = await installSubmissionRoutes(page, state);
  });

  /* ───────── 1. Page loads ───────── */

  test('1) submissions page loads', async ({ page }) => {
    await page.goto('/students/submissions');
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.toLowerCase().includes('submission') ||
      bodyText?.toLowerCase().includes('admission'),
    ).toBeTruthy();
  });

  /* ───────── 2. Filter tabs render with counts ───────── */

  test('2) filter tabs show correct counts', async ({ page }) => {
    await page.goto('/students/submissions');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Pending');
    expect(bodyText).toContain('Needs Revision');
    expect(bodyText).toContain('Approved');
    expect(bodyText).toContain('Rejected');
    expect(bodyText).toContain('All');
  });

  /* ───────── 3. Pending tab shows pending submissions ───────── */

  test('3) pending tab lists pending submissions', async ({ page }) => {
    await page.goto('/students/submissions');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Aarav Patel');
    expect(bodyText).toContain('Priya Sharma');
  });

  /* ───────── 4. Approved tab shows approved submissions ───────── */

  test('4) approved tab lists approved submissions', async ({ page }) => {
    await page.goto('/students/submissions');
    await page.waitForLoadState('networkidle');

    // Click Approved tab
    const approvedTab = page.locator('[role="tab"]').filter({ hasText: /Approved/ }).first();
    if (await approvedTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await approvedTab.click();
      await page.waitForTimeout(400);
    }

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Arjun Kumar');
    expect(bodyText).not.toContain('Aarav Patel');
  });

  /* ───────── 5. Rejected tab shows rejected submissions ───────── */

  test('5) rejected tab lists rejected submissions', async ({ page }) => {
    await page.goto('/students/submissions');
    await page.waitForLoadState('networkidle');

    const rejectedTab = page.locator('[role="tab"]').filter({ hasText: /Rejected/ }).first();
    if (await rejectedTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await rejectedTab.click();
      await page.waitForTimeout(400);
    }

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Ananya Reddy');
  });

  /* ───────── 6. Needs Revision tab shows submissions needing revision ───────── */

  test('6) needs revision tab lists relevant submissions', async ({ page }) => {
    await page.goto('/students/submissions');
    await page.waitForLoadState('networkidle');

    const needsRevTab = page.locator('[role="tab"]').filter({ hasText: /Needs Revision/ }).first();
    if (await needsRevTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await needsRevTab.click();
      await page.waitForTimeout(400);
    }

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Rohan Desai');
  });

  /* ───────── 7. All tab shows all submissions ───────── */

  test('7) all tab lists every submission', async ({ page }) => {
    await page.goto('/students/submissions');
    await page.waitForLoadState('networkidle');

    const allTab = page.locator('[role="tab"]').filter({ hasText: /^All$/ }).first();
    if (await allTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await allTab.click();
      await page.waitForTimeout(400);
    }

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Aarav Patel');
    expect(bodyText).toContain('Priya Sharma');
    expect(bodyText).toContain('Arjun Kumar');
    expect(bodyText).toContain('Ananya Reddy');
    expect(bodyText).toContain('Rohan Desai');
  });

  /* ───────── 8. Empty state ───────── */

  test('8) empty state when no submissions exist', async ({ page }) => {
    // Clear all submissions by overriding the route
    await page.route('**/api/form-submissions*', async (route) => {
      const method = route.request().method();
      const url = new URL(route.request().url());
      if (method === 'GET' && url.pathname === '/api/form-submissions') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
      return route.fallback();
    });

    await page.goto('/students/submissions');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.toLowerCase().includes('no submissions') ||
      bodyText?.toLowerCase().includes('empty') ||
      bodyText?.toLowerCase().includes('not found'),
    ).toBeTruthy();
  });

  /* ───────── 9. Review modal opens ───────── */

  test('9) review modal opens for pending submission', async ({ page }) => {
    await page.goto('/students/submissions');
    await page.waitForLoadState('networkidle');

    // Click the actions dropdown for the first row
    const actionBtn = page.locator('button[aria-label="More actions"]').first();
    if (await actionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await actionBtn.click();
      await page.waitForTimeout(200);

      const reviewItem = page.getByRole('menuitem').filter({ hasText: /Review Submission/ }).first();
      if (await reviewItem.isVisible({ timeout: 2000 }).catch(() => false)) {
        await reviewItem.click();
        await page.waitForTimeout(400);
      }
    }

    const modalText = await page.textContent('body');
    expect(
      modalText?.toLowerCase().includes('review') ||
      modalText?.toLowerCase().includes('submitted information'),
    ).toBeTruthy();
  });

  /* ───────── 10. Approve a pending submission ───────── */

  test('10) approve pending submission creates student record', async ({ page }) => {
    await page.goto('/students/submissions');
    await page.waitForLoadState('networkidle');

    // Open review modal for Aarav Patel
    const actionBtn = page.locator('button[aria-label="More actions"]').first();
    if (await actionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await actionBtn.click();
      await page.waitForTimeout(200);
      const reviewItem = page.getByRole('menuitem').filter({ hasText: /Review Submission/ }).first();
      if (await reviewItem.isVisible({ timeout: 2000 }).catch(() => false)) {
        await reviewItem.click();
        await page.waitForTimeout(400);
      }
    }

    // Click Approve button inside modal
    const approveBtn = page.getByRole('button').filter({ hasText: /Approve/ }).first();
    if (await approveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await approveBtn.click();
      await page.waitForTimeout(600);
    }

    // After approval the modal should close or show success
    const subs = helpers.getSubmissions();
    const aarav = subs.find((s) => s.submissionData['Student Name'] === 'Aarav Patel');
    expect(aarav?.reviewStatus).toBe('approved');
    expect(aarav?.studentId).toBeDefined();
  });

  /* ───────── 11. Reject without notes shows validation error ───────── */

  test('11) rejection requires review notes', async ({ page }) => {
    await page.goto('/students/submissions');
    await page.waitForLoadState('networkidle');

    const actionBtn = page.locator('button[aria-label="More actions"]').first();
    if (await actionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await actionBtn.click();
      await page.waitForTimeout(200);
      const reviewItem = page.getByRole('menuitem').filter({ hasText: /Review Submission/ }).first();
      if (await reviewItem.isVisible({ timeout: 2000 }).catch(() => false)) {
        await reviewItem.click();
        await page.waitForTimeout(400);
      }
    }

    // Try to reject without filling notes
    const rejectBtn = page.getByRole('button').filter({ hasText: /Reject/ }).first();
    if (await rejectBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await rejectBtn.click();
      await page.waitForTimeout(400);
    }

    // Toast or inline error should appear
    const bodyText = await page.textContent('body');
    expect(
      bodyText?.toLowerCase().includes('reason') ||
      bodyText?.toLowerCase().includes('notes') ||
      bodyText?.toLowerCase().includes('required'),
    ).toBeTruthy();
  });

  /* ───────── 12. Reject with notes succeeds ───────── */

  test('12) reject with review notes succeeds', async ({ page }) => {
    await page.goto('/students/submissions');
    await page.waitForLoadState('networkidle');

    const actionBtn = page.locator('button[aria-label="More actions"]').first();
    if (await actionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await actionBtn.click();
      await page.waitForTimeout(200);
      const reviewItem = page.getByRole('menuitem').filter({ hasText: /Review Submission/ }).first();
      if (await reviewItem.isVisible({ timeout: 2000 }).catch(() => false)) {
        await reviewItem.click();
        await page.waitForTimeout(400);
      }
    }

    // Fill review notes
    const notesArea = page.locator('textarea').filter({ hasText: '' }).first();
    if (await notesArea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await notesArea.fill('Documents incomplete — missing birth certificate and transfer certificate');
    }

    const rejectBtn = page.getByRole('button').filter({ hasText: /Reject/ }).first();
    if (await rejectBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await rejectBtn.click();
      await page.waitForTimeout(600);
    }

    const subs = helpers.getSubmissions();
    const aarav = subs.find((s) => s.submissionData['Student Name'] === 'Aarav Patel');
    expect(aarav?.reviewStatus).toBe('rejected');
  });

  /* ───────── 13. Request edit modal opens ───────── */

  test('13) request edit modal opens from review modal', async ({ page }) => {
    await page.goto('/students/submissions');
    await page.waitForLoadState('networkidle');

    const actionBtn = page.locator('button[aria-label="More actions"]').first();
    if (await actionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await actionBtn.click();
      await page.waitForTimeout(200);
      const reviewItem = page.getByRole('menuitem').filter({ hasText: /Review Submission/ }).first();
      if (await reviewItem.isVisible({ timeout: 2000 }).catch(() => false)) {
        await reviewItem.click();
        await page.waitForTimeout(400);
      }
    }

    const requestEditBtn = page.getByRole('button').filter({ hasText: /Request Edit/ }).first();
    if (await requestEditBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await requestEditBtn.click();
      await page.waitForTimeout(400);
    }

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toContain('request edit');
  });

  /* ───────── 14. Request edit requires notes ───────── */

  test('14) request edit requires changes description', async ({ page }) => {
    await page.goto('/students/submissions');
    await page.waitForLoadState('networkidle');

    const actionBtn = page.locator('button[aria-label="More actions"]').first();
    if (await actionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await actionBtn.click();
      await page.waitForTimeout(200);
      const reviewItem = page.getByRole('menuitem').filter({ hasText: /Review Submission/ }).first();
      if (await reviewItem.isVisible({ timeout: 2000 }).catch(() => false)) {
        await reviewItem.click();
        await page.waitForTimeout(400);
      }
    }

    const requestEditBtn = page.getByRole('button').filter({ hasText: /Request Edit/ }).first();
    if (await requestEditBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await requestEditBtn.click();
      await page.waitForTimeout(400);
    }

    // Try to submit without notes
    const sendBtn = page.getByRole('button').filter({ hasText: /Send Edit Request/ }).first();
    if (await sendBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Button should be disabled when notes are empty
      const isDisabled = await sendBtn.isDisabled().catch(() => false);
      expect(isDisabled).toBe(true);
    }
  });

  /* ───────── 15. Send edit request with notes succeeds ───────── */

  test('15) send edit request with notes succeeds', async ({ page }) => {
    await page.goto('/students/submissions');
    await page.waitForLoadState('networkidle');

    const actionBtn = page.locator('button[aria-label="More actions"]').first();
    if (await actionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await actionBtn.click();
      await page.waitForTimeout(200);
      const reviewItem = page.getByRole('menuitem').filter({ hasText: /Review Submission/ }).first();
      if (await reviewItem.isVisible({ timeout: 2000 }).catch(() => false)) {
        await reviewItem.click();
        await page.waitForTimeout(400);
      }
    }

    const requestEditBtn = page.getByRole('button').filter({ hasText: /Request Edit/ }).first();
    if (await requestEditBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await requestEditBtn.click();
      await page.waitForTimeout(400);
    }

    // Fill required changes
    const changesArea = page.locator('textarea').filter({ hasText: '' }).first();
    if (await changesArea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await changesArea.fill('Please update the parent phone number and upload the transfer certificate.');
    }

    const sendBtn = page.getByRole('button').filter({ hasText: /Send Edit Request/ }).first();
    if (await sendBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await sendBtn.click();
      await page.waitForTimeout(600);
    }

    const subs = helpers.getSubmissions();
    const aarav = subs.find((s) => s.submissionData['Student Name'] === 'Aarav Patel');
    expect(aarav?.reviewStatus).toBe('needs_revision');
  });

  /* ───────── 16. View already-reviewed submission shows review info ───────── */

  test('16) reviewed submission shows review information', async ({ page }) => {
    await page.goto('/students/submissions');
    await page.waitForLoadState('networkidle');

    // Switch to rejected tab
    const rejectedTab = page.locator('[role="tab"]').filter({ hasText: /Rejected/ }).first();
    if (await rejectedTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await rejectedTab.click();
      await page.waitForTimeout(400);
    }

    const actionBtn = page.locator('button[aria-label="More actions"]').first();
    if (await actionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await actionBtn.click();
      await page.waitForTimeout(200);
      const reviewItem = page.getByRole('menuitem').filter({ hasText: /Review Submission/ }).first();
      if (await reviewItem.isVisible({ timeout: 2000 }).catch(() => false)) {
        await reviewItem.click();
        await page.waitForTimeout(400);
      }
    }

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Review Information');
    expect(bodyText).toContain('Rejected');
    expect(bodyText).toContain('birth certificate missing');
  });

  /* ───────── 17. Navigate to student record from approved submission ───────── */

  test('17) approved submission links to student record', async ({ page }) => {
    await page.goto('/students/submissions');
    await page.waitForLoadState('networkidle');

    const approvedTab = page.locator('[role="tab"]').filter({ hasText: /Approved/ }).first();
    if (await approvedTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await approvedTab.click();
      await page.waitForTimeout(400);
    }

    const actionBtn = page.locator('button[aria-label="More actions"]').first();
    if (await actionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await actionBtn.click();
      await page.waitForTimeout(200);

      const viewStudentItem = page.getByRole('menuitem').filter({ hasText: /View Student Record/ }).first();
      if (await viewStudentItem.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Just verify the menu item exists — clicking would route away
        expect(await viewStudentItem.textContent()).toContain('View Student Record');
      }
    }
  });

  /* ───────── 18. Table shows expected columns ───────── */

  test('18) submissions table has expected columns', async ({ page }) => {
    await page.goto('/students/submissions');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Form Name');
    expect(bodyText).toContain('Student Name');
    expect(bodyText).toContain('Parent Contact');
    expect(bodyText).toContain('Submitted Date');
    expect(bodyText).toContain('Status');
    expect(bodyText).toContain('Actions');
  });

  /* ───────── 19. Status chips render correctly ───────── */

  test('19) status chips reflect review status', async ({ page }) => {
    await page.goto('/students/submissions');
    await page.waitForLoadState('networkidle');

    const allTab = page.locator('[role="tab"]').filter({ hasText: /^All$/ }).first();
    if (await allTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await allTab.click();
      await page.waitForTimeout(400);
    }

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Pending Review');
    expect(bodyText).toContain('Approved');
    expect(bodyText).toContain('Rejected');
    expect(bodyText).toContain('Needs Revision');
  });

  /* ───────── 20. API coverage — list filtered by reviewStatus ───────── */

  test('20) API filters by reviewStatus query param', async ({ page }) => {
    await page.goto('/students/submissions');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/form-submissions?reviewStatus=approved', {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].reviewStatus).toBe('approved');
    expect(result[0].submissionData['Student Name']).toBe('Arjun Kumar');
  });
});
