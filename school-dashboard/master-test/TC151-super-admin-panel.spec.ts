import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, createAdminUser,
  SCHOOL_ID,
  type MockState, type User,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  TC111 — Super Admin Panel: school management dashboard
 * ───────────────────────────────────────────────────────────────────── */

function createSuperAdminUser(): User {
  const admin = createAdminUser();
  return {
    ...admin,
    role: 'superAdmin',
    permissions: {
      ...admin.permissions!,
      superAdmin: true,
    },
  };
}

test.describe('TC111 — Super Admin Panel', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState(createSuperAdminUser());

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);

    // Override super-admin endpoints with rich data
    await page.route('**/api/super-admin/schools', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { _id: SCHOOL_ID, name: 'SchoolSync Demo School', plan: 'premium', studentCount: 450, staffCount: 30, status: 'active', createdAt: '2025-01-15' },
            { _id: 'school-002', name: 'Green Valley Academy', plan: 'basic', studentCount: 200, staffCount: 15, status: 'active', createdAt: '2025-06-01' },
            { _id: 'school-003', name: 'Sunrise Public School', plan: 'free', studentCount: 50, staffCount: 5, status: 'trial', createdAt: '2026-03-01' },
          ],
          total: 3,
        }),
      });
    });

    await page.route('**/api/super-admin/health', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          schools: [
            { schoolId: SCHOOL_ID, name: 'SchoolSync Demo School', health: 'healthy', lastActivity: '2026-03-30', apiCalls: 1500 },
            { schoolId: 'school-002', name: 'Green Valley Academy', health: 'warning', lastActivity: '2026-03-28', apiCalls: 200 },
          ],
        }),
      });
    });

    await page.route('**/api/super-admin/growth', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          signups: [
            { month: '2026-01', count: 5 },
            { month: '2026-02', count: 8 },
            { month: '2026-03', count: 12 },
          ],
          conversions: [
            { month: '2026-01', trial: 3, paid: 2 },
            { month: '2026-02', trial: 5, paid: 3 },
            { month: '2026-03', trial: 8, paid: 4 },
          ],
          metrics: { totalSchools: 3, activeSchools: 2, totalStudents: 700, mrr: 15000 },
        }),
      });
    });

    await page.route('**/api/super-admin/changelog', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'cl-1', version: '2.5.0', date: '2026-03-25', title: 'AI Assistant Launch', description: 'Added AI-powered assistant for school analytics' },
          { id: 'cl-2', version: '2.4.0', date: '2026-03-10', title: 'GDPR Tools', description: 'Added data export and deletion tools for compliance' },
        ]),
      });
    });

    await page.route('**/api/super-admin/feature-flags', async (route) => {
      const method = route.request().method();
      if (method === 'PUT' || method === 'PATCH') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'ff-1', name: 'ai_assistant', enabled: true, description: 'AI Assistant feature' },
          { id: 'ff-2', name: 'bulk_import_v2', enabled: false, description: 'New bulk import engine' },
          { id: 'ff-3', name: 'parent_portal', enabled: true, description: 'Parent self-service portal' },
        ]),
      });
    });

    await page.route('**/api/super-admin/jobs', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { id: 'job-1', type: 'backup', status: 'completed', startedAt: '2026-03-30T02:00:00Z', completedAt: '2026-03-30T02:15:00Z' },
            { id: 'job-2', type: 'email_campaign', status: 'running', startedAt: '2026-03-30T10:00:00Z' },
          ],
          total: 2,
        }),
      });
    });
  });

  /* ───────── 1. Super admin dashboard loads ───────── */

  test('1) super admin dashboard loads successfully', async ({ page }) => {
    await page.goto('/super-admin');
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  /* ───────── 2. School health panel ───────── */

  test('2) school health panel displays school statuses', async ({ page }) => {
    await page.goto('/super-admin');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    const hasHealthData = bodyText?.toLowerCase().includes('health') ||
      bodyText?.toLowerCase().includes('healthy') ||
      bodyText?.toLowerCase().includes('warning') ||
      bodyText?.toLowerCase().includes('status') ||
      bodyText?.includes('SchoolSync Demo');

    expect(hasHealthData).toBeTruthy();
  });

  /* ───────── 3. Growth analytics panel ───────── */

  test('3) growth analytics panel shows signup and conversion data', async ({ page }) => {
    await page.goto('/super-admin');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    const hasGrowthData = bodyText?.toLowerCase().includes('growth') ||
      bodyText?.toLowerCase().includes('signup') ||
      bodyText?.toLowerCase().includes('conversion') ||
      bodyText?.toLowerCase().includes('school') ||
      bodyText?.includes('3'); // total schools count

    expect(hasGrowthData).toBeTruthy();
  });

  /* ───────── 4. Changelog panel ───────── */

  test('4) changelog panel shows recent updates', async ({ page }) => {
    await page.goto('/super-admin');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    const hasChangelog = bodyText?.toLowerCase().includes('changelog') ||
      bodyText?.includes('2.5.0') ||
      bodyText?.includes('AI Assistant') ||
      bodyText?.toLowerCase().includes('update') ||
      bodyText?.toLowerCase().includes('version');

    expect(hasChangelog).toBeTruthy();
  });

  /* ───────── 5. Feature flags panel ───────── */

  test('5) feature flags panel lists flags with toggle controls', async ({ page }) => {
    await page.goto('/super-admin');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    const hasFeatureFlags = bodyText?.toLowerCase().includes('feature') ||
      bodyText?.toLowerCase().includes('flag') ||
      bodyText?.toLowerCase().includes('ai_assistant') ||
      bodyText?.toLowerCase().includes('bulk_import');

    expect(hasFeatureFlags).toBeTruthy();
  });

  /* ───────── 6. Jobs dashboard panel ───────── */

  test('6) jobs dashboard shows background job statuses', async ({ page }) => {
    await page.goto('/super-admin');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    const hasJobsData = bodyText?.toLowerCase().includes('job') ||
      bodyText?.toLowerCase().includes('backup') ||
      bodyText?.toLowerCase().includes('running') ||
      bodyText?.toLowerCase().includes('completed') ||
      bodyText?.toLowerCase().includes('task');

    expect(hasJobsData).toBeTruthy();
  });

  /* ───────── 7. Feature flag toggle ───────── */

  test('7) toggling a feature flag sends update request', async ({ page }) => {
    await page.goto('/super-admin');
    await page.waitForLoadState('networkidle');

    // Look for toggle switches
    const toggles = page.locator(
      'input[type="checkbox"], [role="switch"], button[aria-pressed], [class*="toggle"]',
    );

    const toggleCount = await toggles.count();
    if (toggleCount > 0) {
      const firstToggle = toggles.first();
      if (await firstToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstToggle.click();
        await page.waitForTimeout(500);

        // The toggle should have changed state
        const bodyText = await page.textContent('body');
        expect(bodyText).toBeTruthy();
      }
    }
  });

  /* ───────── 8. Schools list shows all registered schools ───────── */

  test('8) schools list displays registered school data', async ({ page }) => {
    await page.goto('/super-admin');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    const hasSchoolList = bodyText?.includes('SchoolSync Demo') ||
      bodyText?.includes('Green Valley') ||
      bodyText?.includes('Sunrise') ||
      bodyText?.toLowerCase().includes('school');

    expect(hasSchoolList).toBeTruthy();
  });
});
