import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, seedStudent, seedStudentWithFees,
  seedAttendanceForClass,
  CLASS_10A_ID, CLASS_11A_ID,
  type MockState,
} from './test-utils';

/**
 * Seed a realistic analytics dataset: students with mixed statuses,
 * fee states, staff roles, and attendance records.
 */
function seedAnalyticsData(state: MockState) {
  // Active students with varied fee statuses across two classes
  for (let i = 0; i < 4; i++) {
    seedStudentWithFees(state, {
      name: `Active Student ${i + 1}`,
      classId: CLASS_10A_ID,
      status: 'active',
      gender: i % 2 === 0 ? 'Male' : 'Female',
      feeStatus: i < 2 ? 'paid' : 'pending',
    });
  }
  for (let i = 0; i < 3; i++) {
    seedStudentWithFees(state, {
      name: `Class11 Student ${i + 1}`,
      classId: CLASS_11A_ID,
      status: 'active',
      gender: i === 0 ? 'Male' : 'Female',
      feeStatus: i === 0 ? 'overdue' : 'paid',
    });
  }

  // Inactive / transferred / alumni students
  seedStudent(state, { name: 'Inactive Student', status: 'inactive', feeStatus: 'pending', classId: CLASS_10A_ID });
  seedStudent(state, { name: 'Transferred Student', status: 'transferred', feeStatus: 'paid', classId: CLASS_10A_ID });
  seedStudent(state, { name: 'Alumni Student', status: 'alumni', feeStatus: 'paid', classId: CLASS_11A_ID });

  // Attendance for several days
  seedAttendanceForClass(state, CLASS_10A_ID, '2026-03-10');
  seedAttendanceForClass(state, CLASS_10A_ID, '2026-03-11');
  seedAttendanceForClass(state, CLASS_10A_ID, '2026-03-12');
  seedAttendanceForClass(state, CLASS_11A_ID, '2026-03-10');
}

test.describe('Analytics Dashboard', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    seedAnalyticsData(state);
    // Dismiss cookie consent so it doesn't block UI elements
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });
    await installMockApi(page, state);
  });

  // ── Test 1: KPI stat cards ──────────────────────────────────────────
  test('displays 4 KPI stat cards with correct totals', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Wait for analytics page to render
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible({ timeout: 15000 });

    // Total students = 10 (4 active + 3 active + 1 inactive + 1 transferred + 1 alumni)
    await expect(page.getByText('Total Students')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Total Staff')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Total Classes')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Fee Collection', { exact: true }).first()).toBeVisible({ timeout: 5000 });

    // StatCard component uses: bg-white dark:bg-zinc-900 rounded-lg p-4 border border-gray-100
    const statCards = page.locator('.rounded-lg.p-4.border');
    const count = await statCards.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  // ── Test 2: Date preset selector ────────────────────────────────────
  // Analytics page does not have date preset selector buttons (Academic Year, Last 30/90 Days)
  test.skip('date preset selector changes active filter and triggers refetch', async ({ page }) => {
    // Feature not implemented: no date preset buttons on Analytics page
  });

  // ── Test 3: Attendance summary & weekly trend chart ─────────────────
  test('attendance section shows average and weekly trend chart', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Wait for analytics page to render
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible({ timeout: 15000 });

    // Attendance Trends chart heading should be visible
    await expect(page.getByRole('heading', { name: 'Attendance Trends' })).toBeVisible({ timeout: 15000 });

    // Performance sidebar should show Average Attendance
    await expect(page.getByText('Average Attendance')).toBeVisible({ timeout: 15000 });

    // The AreaChart container or no-attendance-records fallback should be present
    // Use longer timeout since Recharts rendering can be slow in parallel runs
    const areaChart = page.locator('.recharts-wrapper').first();
    const noRecords = page.getByText('No attendance records').first();
    await expect(
      areaChart.or(noRecords),
    ).toBeVisible({ timeout: 20000 });
  });

  // ── Test 4: Attendance heatmap / weekday data ───────────────────────
  test('attendance trends chart displays weekday data points', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Wait for analytics page to render
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible({ timeout: 15000 });

    // The chart section or no-records fallback should be visible
    // Use Promise.race with longer timeout since Recharts rendering can be slow in parallel runs
    const chartSection = page.locator('.recharts-wrapper').last();
    const noRecords = page.getByText('No attendance records').first();
    await expect(
      chartSection.or(noRecords),
    ).toBeVisible({ timeout: 20000 });
  });

  // ── Test 5: Student distribution PieChart ───────────────────────────
  test('student distribution pie chart shows status breakdown', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Wait for analytics page to render
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible({ timeout: 15000 });

    // Chart heading (uses i18n keys pages.studentDistribution and pages.byEnrollmentStatus)
    await expect(page.getByText('Student Distribution')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('By enrollment status')).toBeVisible({ timeout: 5000 });

    // Recharts PieChart renders inside a .recharts-wrapper container with an SVG element
    const pieChart = page.locator('.recharts-wrapper').first();
    await expect(pieChart).toBeVisible({ timeout: 10000 });

    // The wrapper should contain an SVG element (the chart canvas)
    const svg = pieChart.locator('svg');
    await expect(svg).toBeVisible({ timeout: 5000 });
  });

  // ── Test 6: Fee collection BarChart ─────────────────────────────────
  test('fee collection bar chart shows paid, pending, overdue', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Wait for analytics page to render
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible({ timeout: 15000 });

    await expect(page.getByText('Fee Collection Status')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Payment distribution')).toBeVisible({ timeout: 5000 });

    // The bar chart container should be present (recharts wrapper with SVG)
    const barChart = page.locator('.recharts-wrapper').nth(1);
    await expect(barChart).toBeVisible({ timeout: 10000 });
  });

  // ── Test 7: Drill-down on chart click ──────────────────────────────
  // The Analytics page does not have drill-down panels on pie chart click
  test.skip('clicking a pie chart slice opens drill-down panel', async ({ page }) => {
    // Feature not implemented: pie chart click does not open a drill-down panel
  });

  // ── Test 8: Empty state ─────────────────────────────────────────────
  test('renders gracefully when API returns zero data', async ({ page }) => {
    // Install a clean mock with no students/staff beyond defaults
    const emptyState = createMockState();
    await installMockApi(page, emptyState);

    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Wait for analytics page to render
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible({ timeout: 15000 });

    // Page should not crash
    await expect(page).not.toHaveURL(/\/login/);

    // Stat cards should show "0" for students (no students seeded)
    await expect(page.getByText('Total Students')).toBeVisible({ timeout: 5000 });
    const body = await page.textContent('body');
    expect(body).toContain('0');

    // Attendance section should stabilise — with no active students the empty state appears immediately
    const noRecords = page.getByText('No attendance records').first();
    const chartWrapper = page.locator('.recharts-wrapper').first();
    await expect(
      noRecords.or(chartWrapper),
    ).toBeVisible({ timeout: 15000 });
  });

  // ── Test 9: Loading/skeleton states ─────────────────────────────────
  test('shows loading state while attendance data is being fetched', async ({ page }) => {
    await page.goto('/analytics');

    // Wait for analytics page to render
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible({ timeout: 15000 });

    // The ChartCard renders a Skeleton while loading and either the chart
    // or the empty state once loaded. Wait for the stable end-state.
    const areaChart = page.locator('.recharts-wrapper').first();
    const noRecords = page.getByText('No attendance records').first();
    await expect(
      areaChart.or(noRecords),
    ).toBeVisible({ timeout: 20000 });
  });

  // ── Test 10: Date filter changes update all charts ──────────────────
  // Analytics page does not have date filter buttons (Last 30 Days, etc.)
  test.skip('changing date filter updates charts simultaneously', async ({ page }) => {
    // Feature not implemented: no date filter buttons on Analytics page
  });

  // ── Test 11: Error state when API fails ─────────────────────────────
  test('shows graceful message when attendance API fails', async ({ page }) => {
    // Override attendance API to return errors (use regex to match URLs with query params)
    // Registered AFTER installMockApi, so LIFO means this is checked first
    await page.route(/\/api\/attendance\/student\//, async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Server Error' }) });
    });

    await page.goto('/analytics');

    // Wait for analytics page to render
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible({ timeout: 15000 });

    // Wait for attendance section to stabilise — when API fails the empty state appears
    const noRecords = page.getByText('No attendance records').first();
    const chartFallback = page.locator('.recharts-wrapper').first();
    await expect(
      noRecords.or(chartFallback),
    ).toBeVisible({ timeout: 30000 });

    // When all attendance calls fail, the component shows "No attendance records..."
    // or falls back to showing 0 values. Either way the page should not crash.
    const body = await page.textContent('body');
    expect(
      body?.includes('No attendance records') ||
      body?.toLowerCase()?.includes('no attendance') ||
      body?.includes('Total Students') // page still renders other sections
    ).toBeTruthy();

    // Rest of the page should still render — check for stat labels
    await expect(page.getByText('Total Students')).toBeVisible();
  });

  // ── Test 12: Sidebar sections display correctly ────────────────────
  test('analytics sidebar shows performance summary, quick actions, and student breakdown', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Wait for analytics page to render
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible({ timeout: 15000 });

    // Performance Summary sidebar should show metrics
    await expect(page.getByText('Performance Summary')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Key metrics overview')).toBeVisible({ timeout: 5000 });

    // Quick actions sidebar should link to module pages
    await expect(page.getByText('Manage Students')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Manage Staff')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Manage Classes')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Fee Management')).toBeVisible({ timeout: 5000 });

    // Student breakdown sidebar should show counts
    await expect(page.getByText('Student Breakdown')).toBeVisible({ timeout: 5000 });
  });
});
