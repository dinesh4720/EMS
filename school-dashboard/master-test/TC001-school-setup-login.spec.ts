/**
 * TC001: Admin logs in and sees the dashboard with correct school info.
 *
 * Verifies the full login flow: filling credentials, submitting,
 * landing on the dashboard with school name, sidebar nav, and stat cards.
 */
import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Helpers
 * ───────────────────────────────────────────────────────────────────── */

async function mockAuthEndpoints(page: import('@playwright/test').Page) {
  const adminUser = {
    id: 'user-001', _id: 'user-001',
    name: 'Dinesh Admin',
    email: 'admin@schoolsync.test',
    role: 'admin',
    token: 'mock-jwt-token-admin',
    schoolId: 'school-001',
    permissions: {
      students: true, classes: true, staff: true, attendance: true,
      academics: true, fees: true, messaging: true, frontDesk: true,
      library: true, settings: true, analytics: true, reports: true,
      timetable: true, hostel: true, transport: true, inventory: true,
      homework: true, calendar: true, payroll: true, aiAssistant: true,
      superAdmin: false, intakeForms: true, dataTools: true,
    },
  };

  // Register catch-all FIRST so specific routes (registered after) take priority
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    // Skip Vite source files (paths like /src/services/api/*.js)
    if (url.pathname.startsWith('/src/')) {
      return route.fallback();
    }
    // Let auth routes be handled by their specific handlers
    if (url.pathname.includes('/auth/')) {
      return route.fallback();
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });

  // Mock NPS
  await page.route('**/api/nps/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith('/src/')) return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ shouldShow: false }),
    });
  });

  // Mock settings
  await page.route('**/api/settings**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith('/src/')) return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        schoolName: 'SchoolSync Demo School',
        academicYear: '2025-2026',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
      }),
    });
  });

  // Mock dashboard stats
  await page.route('**/api/dashboard/stats', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith('/src/')) return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        totalStudents: 245,
        activeStudents: 240,
        totalStaff: 32,
        totalClasses: 12,
        attendanceRate: 92,
        feeCollectionRate: 78,
        genderDistribution: { Male: 130, Female: 110 },
        classWiseStrength: [],
        feeStatusBreakdown: { paid: 180, pending: 45, overdue: 15 },
        recentAnnouncements: [],
        upcomingEvents: [],
      }),
    });
  });

  // Mock /auth/session — initially unauthenticated, then authenticated after login
  let loggedIn = false;
  await page.route('**/auth/session', async (route) => {
    if (loggedIn) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(adminUser),
      });
    } else {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
    }
  });

  // Mock /auth/login
  await page.route('**/auth/login', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.email === 'admin@schoolsync.test' && body.password === 'Admin@123') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(adminUser),
      });
    } else {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid email or password' }),
      });
    }
  });

  return { markLoggedIn: () => { loggedIn = true; } };
}

/* ─────────────────────────────────────────────────────────────────────
 *  Tests
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC001: School Setup — Admin Login & Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure clean slate — no session
    await page.addInitScript(() => {
      sessionStorage.clear();
      localStorage.removeItem('app_user');
    });
  });

  test('1) login page shows email and password fields', async ({ page }) => {
    await mockAuthEndpoints(page);
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('#login-email, input[type="email"], input[name="email"], input[inputmode="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10_000 });

    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    await expect(passwordInput).toBeVisible();

    const signInBtn = page.getByRole('button', { name: /sign in|login|log in/i }).first();
    await expect(signInBtn).toBeVisible();
  });

  test('2) admin fills login form and lands on dashboard with school name', async ({ page }) => {
    const { markLoggedIn } = await mockAuthEndpoints(page);

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Fill credentials
    await page.locator('#login-email, input[type="email"], input[name="email"], input[inputmode="email"]').first().fill('admin@schoolsync.test');
    await page.locator('input[type="password"], input[name="password"]').first().fill('Admin@123');

    // Submit
    markLoggedIn();
    await page.getByRole('button', { name: /sign in|login|log in/i }).first().click();

    // Should navigate away from /login
    await page.waitForURL(/^(?!.*\/login).*/, { timeout: 10_000 }).catch(() => {});
    await expect(page).not.toHaveURL(/\/login$/);

    // Dashboard should show school name
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('SchoolSync Demo School');
  });

  test('3) sidebar navigation items are visible after login', async ({ page }) => {
    const { markLoggedIn } = await mockAuthEndpoints(page);

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.locator('#login-email, input[type="email"], input[name="email"], input[inputmode="email"]').first().fill('admin@schoolsync.test');
    await page.locator('input[type="password"], input[name="password"]').first().fill('Admin@123');

    markLoggedIn();
    await page.getByRole('button', { name: /sign in|login|log in/i }).first().click();
    await page.waitForURL(/^(?!.*\/login).*/, { timeout: 10_000 }).catch(() => {});

    // Verify key sidebar navigation items
    const sidebar = page.locator('nav, [class*="sidebar"], aside').first();
    await expect(sidebar).toBeVisible({ timeout: 10_000 });

    const sidebarText = await sidebar.textContent();
    expect(sidebarText?.toLowerCase()).toMatch(/dashboard|student|class|staff|fee|setting/i);
  });

  test('4) quick stats cards are present on the dashboard', async ({ page }) => {
    const { markLoggedIn } = await mockAuthEndpoints(page);

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.locator('#login-email, input[type="email"], input[name="email"], input[inputmode="email"]').first().fill('admin@schoolsync.test');
    await page.locator('input[type="password"], input[name="password"]').first().fill('Admin@123');

    markLoggedIn();
    await page.getByRole('button', { name: /sign in|login|log in/i }).first().click();
    await page.waitForURL(/^(?!.*\/login).*/, { timeout: 10_000 }).catch(() => {});

    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');

    // Should contain stat-related text (Total Students, Total Staff, etc.)
    const hasStudentStat = bodyText?.toLowerCase().includes('student');
    const hasStaffStat = bodyText?.toLowerCase().includes('staff');
    expect(hasStudentStat || hasStaffStat).toBeTruthy();

    // Verify numeric values are rendered (e.g., 245 students, 32 staff)
    expect(bodyText).toMatch(/245|32|12|92/);
  });

  test('5) invalid credentials show error on login page', async ({ page }) => {
    await mockAuthEndpoints(page);
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.locator('#login-email, input[type="email"], input[name="email"], input[inputmode="email"]').first().fill('wrong@test.com');
    await page.locator('input[type="password"], input[name="password"]').first().fill('WrongPass@1');
    await page.getByRole('button', { name: /sign in|login|log in/i }).first().click();

    // Wait for error
    await page.waitForTimeout(500);
    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/invalid|incorrect|wrong|error|failed/i);
  });
});
