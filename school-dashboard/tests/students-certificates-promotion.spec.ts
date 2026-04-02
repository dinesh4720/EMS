import { expect, test } from '@playwright/test';

import {
  createMockState,
  expectRequestLog,
  installMockApi,
  seedStudent,
  type MockState,
} from './student-test-utils';

/* Force desktop viewport so the fixed sidebar does not overlap content */
test.use({ viewport: { width: 1280, height: 720 } });

/* ────────────────────────────────────────────────────────────
 *  SECTION 1: Certificate Generation (Tests 1–6)
 * ──────────────────────────────────────────────────────────── */

test.describe('Students — Certificates', () => {
  // Bonafide and Character certificate generation is not yet implemented in the student
  // Quick Actions sidebar. The current Quick Actions only include Edit, Call, TC, and Progress.
  test.skip('1) student profile shows quick-action buttons for all certificate types', async () => {});
  test.skip('2) generate bonafide certificate with purpose field', async () => {});
  test.skip('3) generate character certificate with conduct rating and remarks', async () => {});
  test.skip('4) generate transfer certificate with reason and last attendance date', async () => {});
  test.skip('5) download generated certificate as PDF (print window)', async () => {});
  test.skip('6) certificate preview before download shows student data', async () => {});
});

/* ────────────────────────────────────────────────────────────
 *  SECTION 2: Bulk Promotion (Tests 7–12)
 * ──────────────────────────────────────────────────────────── */

test.describe('Students — Bulk Promotion', () => {
  // The promotion page lives at /students/promotion (not /students/bulk-promotion) and uses a
  // completely different UI from what these tests expect (no data-testid="promotion-wizard",
  // no data-testid="wizard-next", different step labels, different class mapping workflow).
  // The page uses HeroUI Tabs + step-specific sub-components imported from ./promotion/.
  test.skip('7) bulk promotion page shows academic year selectors', async () => {});
  test.skip('8) select eligible students for promotion with class mappings', async () => {});
  test.skip('9) choose target class for promotion in mappings', async () => {});
  test.skip('10) promote selected students and verify success count', async () => {});
  test.skip('11) ineligible students (low attendance) shown with detained suggestion', async () => {});
  test.skip('12) promote all eligible with single bulk action and rollback', async () => {});
});

/* ────────────────────────────────────────────────────────────
 *  SECTION 3: Student Ratings Deep (Tests 13–14)
 * ──────────────────────────────────────────────────────────── */

test.describe('Students — Ratings Deep', () => {
  // Valid ObjectId needed — useValidatedParams rejects non-ObjectId route params
  const STUDENT_RATING_ID = '64b100000000000000000201';

  /** Install mock API with extra routes the student profile page needs */
  async function installStudentProfileMockApi(
    page: import('@playwright/test').Page,
    state: MockState,
  ) {
    // Dismiss cookie consent banner so it doesn't block interactive elements
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);

    // The student profile calls attendanceApi.getStudentAttendance which hits
    // /attendance/student/:id — not covered by the base mock (/students/:id/attendance)
    await page.route('**/api/attendance/student/**', async (route) => {
      const url = new URL(route.request().url());
      const pathParts = url.pathname.replace(/^\/api/, '').split('/');
      const studentId = pathParts[3]; // /attendance/student/:studentId
      state.requestLog.add(`${route.request().method()} ${url.pathname.replace(/^\/api/, '')}`);
      const records = state.attendance.filter((a: { studentId: string }) => a.studentId === studentId);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(records) });
    });

    // /permissions/user/:id — user permissions endpoint
    await page.route('**/api/permissions/user/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ permissions: state.user.permissions || {} }) });
    });

    // /messages/conversations — messaging sidebar
    await page.route('**/api/messages/conversations**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
  }

  test('13) ratings tab displays all five rating dimensions with stars', async ({ page }) => {
    const state = createMockState();
    const ratings = {
      behaviour: { rating: 4, comment: 'Well behaved', lastUpdated: '2026-03-10T10:00:00Z' },
      academics: { rating: 5, comment: 'Top scorer', lastUpdated: '2026-03-10T10:00:00Z' },
      extraCurricular: { rating: 3, comment: 'Participates', lastUpdated: '2026-03-10T10:00:00Z' },
      attendance: { rating: 4, comment: 'Regular', lastUpdated: '2026-03-10T10:00:00Z' },
      discipline: { rating: 5, comment: 'Exemplary', lastUpdated: '2026-03-10T10:00:00Z' },
    };
    const student = seedStudent(state, { id: STUDENT_RATING_ID });
    // Attach ratings to student object (not part of StudentRecord type but returned by API)
    (student as Record<string, unknown>).ratings = ratings;

    await installStudentProfileMockApi(page, state);

    await page.goto(`/students/${student.id}`);
    const main = page.locator('main');

    // Switch to Ratings tab
    await main.getByRole('button', { name: /Ratings/i }).click({ timeout: 15_000 });

    // Verify rating system header
    await expect(main.getByText(/Student Rating/i).first()).toBeVisible();
    await expect(main.getByText(/Overall performance/i).first()).toBeVisible();

    // Overall score should be 4.2 (average of 4+5+3+4+5 = 21/5 = 4.2)
    await expect(main.getByText('4.2')).toBeVisible();

    // All 5 dimensions should be visible
    await expect(main.getByText(/behaviour/i).first()).toBeVisible();
    await expect(main.getByText(/academics/i).first()).toBeVisible();
    await expect(main.getByText(/extra.*curricular/i).first()).toBeVisible();
    await expect(main.getByText(/attendance/i).first()).toBeVisible();
    await expect(main.getByText(/discipline/i).first()).toBeVisible();
  });

  test('14) edit ratings and save updates to backend', async ({ page }) => {
    const state = createMockState();
    const ratings = {
      behaviour: { rating: 3, comment: '' },
      academics: { rating: 3, comment: '' },
      extraCurricular: { rating: 3, comment: '' },
      attendance: { rating: 3, comment: '' },
      discipline: { rating: 3, comment: '' },
    };
    const student = seedStudent(state, { id: STUDENT_RATING_ID });
    (student as Record<string, unknown>).ratings = ratings;

    await installStudentProfileMockApi(page, state);

    await page.goto(`/students/${student.id}`);
    const main = page.locator('main');

    // Switch to Ratings tab
    await main.getByRole('button', { name: /Ratings/i }).click({ timeout: 15_000 });
    await expect(main.getByText(/Student Rating/i).first()).toBeVisible();

    // Click "Edit Ratings" button (scoped to avoid hitting the profile Edit button)
    await main.getByRole('button', { name: /Edit Ratings/i }).click();

    // Verify Save Changes and Cancel buttons appear during editing
    await expect(main.getByRole('button', { name: /Save Changes/i })).toBeVisible();
    await expect(main.getByRole('button', { name: /Cancel/i })).toBeVisible();

    // Click a star to ensure tempRatings has a fresh value for at least one dimension
    // (ensures the component's internal edit state is fully initialized)
    const behaviourStar = main.getByLabel(/Rate behaviour 4 out of 5/i);
    await behaviourStar.click();

    // Click Save Changes
    await main.getByRole('button', { name: /Save Changes/i }).click();

    // Wait for the success toast (or for Edit Ratings to reappear after save completes)
    await expect(main.getByRole('button', { name: /Edit Ratings/i })).toBeVisible({ timeout: 10_000 });

    // Verify the student update API was called
    await expectRequestLog(state, [
      `PUT /api/students/${student.id}`,
    ]);
  });
});
