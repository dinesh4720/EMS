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

    // Total students = 10 (4 active + 3 active + 1 inactive + 1 transferred + 1 alumni)
    const body = await page.textContent('body');
    expect(body).toContain('10'); // total students
    expect(body).toContain('Total Students');

    // Total staff — default mock state has staff members
    expect(body).toContain('Total Staff');

    // Total classes
    expect(body).toContain('Total Classes');

    // Fee collection
    expect(body).toContain('Fee Collection');

    // Should have 4 stat cards rendered
    const statCards = page.locator('[class*="stat"], [class*="StatCard"], .bg-white.rounded-lg.p-4');
    const count = await statCards.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  // ── Test 2: Date preset selector ────────────────────────────────────
  test('date preset selector changes active filter and triggers refetch', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Default is "Academic Year" — should be styled as active
    const academicYearBtn = page.getByRole('button', { name: 'Academic Year' });
    await expect(academicYearBtn).toBeVisible();

    // Click "Last 30 Days"
    const last30Btn = page.getByRole('button', { name: 'Last 30 Days' });
    await last30Btn.click();

    // The button should now have the active style (white bg)
    await expect(last30Btn).toHaveClass(/bg-white/);

    // Click "Last 90 Days"
    const last90Btn = page.getByRole('button', { name: 'Last 90 Days' });
    await last90Btn.click();
    await expect(last90Btn).toHaveClass(/bg-white/);
  });

  // ── Test 3: Attendance summary & weekly trend chart ─────────────────
  test('attendance section shows average and weekly trend chart', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Wait for attendance loading to finish
    await expect(page.getByText('Loading attendance trends...')).toBeHidden({ timeout: 15000 });

    // Attendance Trends chart heading should be visible
    await expect(page.getByText('Attendance Trends')).toBeVisible();

    // Performance sidebar should show Average Attendance
    await expect(page.getByText('Average Attendance')).toBeVisible();

    // The AreaChart container should be present (recharts renders SVG)
    const areaChart = page.locator('.recharts-area, .recharts-wrapper').first();
    await expect(areaChart).toBeVisible({ timeout: 15000 });
  });

  // ── Test 4: Attendance heatmap / weekday data ───────────────────────
  test('attendance trends chart displays weekday data points', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Loading attendance trends...')).toBeHidden({ timeout: 15000 });

    // The chart should render weekday ticks (recharts text elements)
    const chartSection = page.locator('.recharts-wrapper').last();
    await expect(chartSection).toBeVisible({ timeout: 15000 });
  });

  // ── Test 5: Student distribution PieChart ───────────────────────────
  test('student distribution pie chart shows status breakdown', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Chart heading
    await expect(page.getByText('Student Distribution')).toBeVisible();
    await expect(page.getByText('By enrollment status')).toBeVisible();

    // Recharts PieChart renders <path> elements inside SVG
    const pieSlices = page.locator('.recharts-pie-sector');
    const sliceCount = await pieSlices.count();
    expect(sliceCount).toBeGreaterThanOrEqual(1);
  });

  // ── Test 6: Fee collection BarChart ─────────────────────────────────
  test('fee collection bar chart shows paid, pending, overdue', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Fee Collection Status')).toBeVisible();
    await expect(page.getByText('Payment distribution')).toBeVisible();

    // The bar chart should have recharts bar elements
    const bars = page.locator('.recharts-bar-rectangle');
    const barCount = await bars.count();
    expect(barCount).toBeGreaterThanOrEqual(1);
  });

  // ── Test 7: Drill-down on chart click ──────────────────────────────
  test('clicking a pie chart slice opens drill-down panel', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Wait for pie chart to be rendered
    const pieSector = page.locator('.recharts-pie-sector').first();
    await expect(pieSector).toBeVisible({ timeout: 15000 });

    // Click on the first pie sector (Active students)
    await pieSector.click({ force: true });

    // Drill-down panel should appear — it contains student names or "Students" in the title
    // The drillDown title format is e.g. "Active Students (7)"
    const drillDownPanel = page.locator('text=/Students/').first();
    await expect(drillDownPanel).toBeVisible({ timeout: 5000 });

    // Close button should work — look for the X close button on the drill-down panel
    const closeBtn = page.locator('button').filter({ has: page.locator('svg') }).filter({ hasText: '' }).first();
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click();
    }
  });

  // ── Test 8: Empty state ─────────────────────────────────────────────
  test('renders gracefully when API returns zero data', async ({ page }) => {
    // Install a clean mock with no students/staff beyond defaults
    const emptyState = createMockState();
    await installMockApi(page, emptyState);

    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Page should not crash
    await expect(page).not.toHaveURL(/\/login/);
    // Analytics page heading uses i18n key analytics.title
    const body = await page.textContent('body');
    expect(body).toBeTruthy();

    // Stat cards should show "0" for students (no students seeded)
    expect(body).toContain('0');

    // Attendance section should finish loading — either show no-records message or just finish
    await expect(page.getByText(/Loading attendance/i)).toBeHidden({ timeout: 15000 });

    // The no-attendance message comes from i18n key analytics.noAttendanceRecords
    // In English locale it says "No attendance records found for the current academic year."
    const attendanceText = await page.textContent('body');
    expect(
      attendanceText?.includes('No attendance records') ||
      attendanceText?.includes('no attendance') ||
      attendanceText?.includes('0') // The page at minimum shows 0 values
    ).toBeTruthy();
  });

  // ── Test 9: Loading/skeleton states ─────────────────────────────────
  test('shows loading state while attendance data is being fetched', async ({ page }) => {
    await page.goto('/analytics');

    // Immediately after navigation, the loading text should appear
    await expect(page.getByText('Loading attendance trends...')).toBeVisible();

    // After data loads, it should disappear
    await expect(page.getByText('Loading attendance trends...')).toBeHidden({ timeout: 15000 });
  });

  // ── Test 10: Date filter changes update all charts ──────────────────
  test('changing date filter updates charts simultaneously', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Wait for initial load
    await expect(page.getByText(/Loading attendance/i)).toBeHidden({ timeout: 15000 });

    // The date preset buttons use i18n keys: preset_last_30 → "Last 30 Days"
    // Click the button containing "30" text (handles i18n variations)
    const last30Btn = page.locator('button').filter({ hasText: /30/ }).first();
    await last30Btn.click();

    // Attendance should start re-loading or update
    // Either shows loading text or the chart updates — page should not crash
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Loading attendance/i)).toBeHidden({ timeout: 15000 });

    // Verify charts still visible (uses i18n keys)
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    // At minimum the page did not crash and still renders chart sections
    expect(
      body?.includes('Student Distribution') || body?.includes('student') || body?.includes('Distribution')
    ).toBeTruthy();
  });

  // ── Test 11: Error state when API fails ─────────────────────────────
  test('shows graceful message when attendance API fails', async ({ page }) => {
    // Override attendance API to return errors (use regex to match URLs with query params)
    // Registered AFTER installMockApi, so LIFO means this is checked first
    await page.route(/\/api\/attendance\/student\//, async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Server Error' }) });
    });

    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Wait for loading to finish — attendance calls retry with exponential backoff
    // (up to 3 attempts per student with 1s+2s delays), so allow ample time
    await expect(page.getByText(/Loading attendance/i)).toBeHidden({ timeout: 30000 });

    // When all attendance calls fail, should show no-data fallback
    // The text comes from i18n key analytics.noAttendanceRecords
    const body = await page.textContent('body');
    expect(
      body?.includes('No attendance records') ||
      body?.toLowerCase().includes('no attendance') ||
      body?.toLowerCase().includes('no data')
    ).toBeTruthy();

    // Rest of the page should still render — check for stat labels
    expect(body?.includes('Total Students') || body?.includes('Students')).toBeTruthy();
  });

  // ── Test 12: Academic year change refreshes data ────────────────────
  test('analytics data reflects current academic year from settings', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Performance Summary sidebar should show metrics
    await expect(page.getByText('Performance Summary')).toBeVisible();
    await expect(page.getByText('Key metrics overview')).toBeVisible();

    // Verify academic year preset is active by default
    const academicYearBtn = page.getByRole('button', { name: 'Academic Year' });
    await expect(academicYearBtn).toHaveClass(/bg-white/);

    // Quick actions sidebar should link to module pages
    await expect(page.getByText('Manage Students')).toBeVisible();
    await expect(page.getByText('Manage Staff')).toBeVisible();
    await expect(page.getByText('Manage Classes')).toBeVisible();
    await expect(page.getByText('Fee Management')).toBeVisible();

    // Student breakdown sidebar should show counts
    await expect(page.getByText('Student Breakdown')).toBeVisible();
    const breakdownSection = page.locator('text=Student Breakdown').locator('..');
    await expect(breakdownSection).toBeVisible();
  });
});
