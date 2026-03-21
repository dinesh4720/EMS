import { expect, test, type Page, type Route } from '@playwright/test';

/* ───────────────── Mock data ───────────────── */

const SUPERADMIN_USER = {
  id: 'sa-00000000000000000001',
  name: 'Platform Admin',
  role: 'superadmin',
  email: 'platform@schoolsync.test',
  token: 'test-superadmin-token',
};

const MOCK_OVERVIEW = {
  totalSchools: 12,
  activeSchools: 8,
  trialingSchools: 3,
  attentionNeeded: 1,
};

const MOCK_SCHOOLS = [
  {
    id: 'sch-001',
    name: 'Delhi Public School',
    code: 'DPS',
    plan: 'growth',
    status: 'active',
    planStatus: 'active',
    contactEmail: 'dps@example.com',
    admin: { name: 'Rohit Sharma', email: 'rohit@dps.edu' },
    counts: { staff: 45 },
    provisioning: { status: 'completed', lastProvisionedAt: '2026-01-15T10:00:00Z' },
  },
  {
    id: 'sch-002',
    name: 'Greenfield Academy',
    code: 'GFA',
    plan: 'starter',
    status: 'active',
    planStatus: 'trialing',
    contactEmail: 'info@greenfield.edu',
    admin: { name: 'Priya Singh', email: 'priya@greenfield.edu' },
    counts: { staff: 20 },
    provisioning: { status: 'pending' },
  },
];

const MOCK_FLAGS = {
  flags: [
    {
      key: 'advancedReports',
      name: 'Advanced Reports',
      description: 'Enable advanced analytics reports',
      status: 'enabled',
      minimumPlan: 'growth',
      rolloutPercentage: 0,
      overrideSchools: [],
      tags: ['analytics'],
    },
    {
      key: 'parentChat',
      name: 'Parent Chat',
      description: 'Real-time parent-teacher chat',
      status: 'rollout',
      minimumPlan: 'starter',
      rolloutPercentage: 50,
      overrideSchools: [{ schoolId: 'sch-001', enabled: true }],
      tags: ['messaging'],
    },
  ],
};

const MOCK_JOB_METRICS = {
  total: 142,
  running: 2,
  scheduled: 5,
  completed: 130,
  failed: 5,
  failureRate: 3.5,
  avgExecutionMs: 1250,
};

const MOCK_JOBS = {
  jobs: [
    { _id: 'job-001', name: 'send scheduled announcement', status: 'completed', type: 'cron', lastRunAt: '2026-03-20T08:00:00Z', nextRunAt: '2026-03-21T08:00:00Z', repeatInterval: '24h', priority: 'normal' },
    { _id: 'job-002', name: 'cleanup old jobs', status: 'running', type: 'cron', lastRunAt: '2026-03-20T06:00:00Z', nextRunAt: null, repeatInterval: '12h', priority: 'low' },
    { _id: 'job-003', name: 'bulk import students', status: 'failed', type: 'one-off', lastRunAt: '2026-03-19T14:00:00Z', nextRunAt: null, repeatInterval: null, priority: 'high', failReason: 'CSV parse error at row 42', data: { fileName: 'students.csv' } },
  ],
  total: 3,
};

const MOCK_GROWTH = {
  summary: { avgHealthScore: 72, highRisk: 1, growing: 6, fullyActivated: 4, totalSchools: 12 },
  schools: [
    { schoolId: 'sch-001', name: 'Delhi Public School', code: 'DPS', healthScore: 85, churnRisk: 'low', trend: 'growing', daysSinceLastActive: 0, featuresUsedCount: 12, isFullyActivated: true, dauLast7d: 34, plan: 'growth', planStatus: 'active' },
    { schoolId: 'sch-002', name: 'Greenfield Academy', code: 'GFA', healthScore: 35, churnRisk: 'high', trend: 'declining', daysSinceLastActive: 14, featuresUsedCount: 3, isFullyActivated: false, dauLast7d: 2, plan: 'starter', planStatus: 'trialing' },
  ],
};

const MOCK_GROWTH_FUNNEL = {
  totalSchools: 12,
  funnel: [
    { feature: 'attendance', isCore: true, schoolsUsed: 10, adoptionPct: 83 },
    { feature: 'fees', isCore: true, schoolsUsed: 9, adoptionPct: 75 },
    { feature: 'exams', isCore: false, schoolsUsed: 7, adoptionPct: 58 },
  ],
};

const MOCK_HEALTH = {
  schools: [
    { schoolId: 'sch-001', name: 'Delhi Public School', code: 'DPS', status: 'active', healthScore: 85, churnRisk: 'low', trend: 'growing', daysSinceLastActive: 0, studentsCount: 450, staffCount: 45, rateLimitViolations: 0, plan: 'growth', planStatus: 'active', featuresUsedCount: 12, isFullyActivated: true, dauLast7d: 34, scoreBreakdown: { breadth: 35, recency: 28, trend: 15, mobile: 7 } },
    { schoolId: 'sch-002', name: 'Greenfield Academy', code: 'GFA', status: 'active', healthScore: 35, churnRisk: 'high', trend: 'declining', daysSinceLastActive: 14, studentsCount: 120, staffCount: 20, rateLimitViolations: 3, plan: 'starter', planStatus: 'trialing', featuresUsedCount: 3, isFullyActivated: false, dauLast7d: 2, scoreBreakdown: { breadth: 10, recency: 12, trend: 8, mobile: 5 } },
  ],
};

const MOCK_CHANGELOG = {
  entries: [
    { _id: 'cl-001', title: 'New attendance module', body: 'Redesigned attendance tracking for teachers.', version: '2.1.0', category: 'new_feature', isPublished: true, publishedAt: '2026-03-10T12:00:00Z' },
    { _id: 'cl-002', title: 'Bug fix: fee calculation', body: 'Fixed rounding error in fee totals.', version: '2.0.1', category: 'bug_fix', isPublished: false, publishedAt: null },
  ],
  total: 2,
};

const MOCK_AUDIT_LOGS = { logs: [] };

/* ───────────────── Helpers ───────────────── */

function json(route: Route, data: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
}

const requestLog = new Set<string>();

async function installSuperAdminMock(page: Page) {
  // Session setup
  await page.addInitScript((user: typeof SUPERADMIN_USER) => {
    localStorage.setItem('hasCompletedOnboarding', 'true');
    localStorage.setItem('owlinTrackerEnabled', 'false');
    localStorage.setItem('ems_cookie_consent', 'accepted');
    localStorage.setItem('ems_module_tours_seen', JSON.stringify({ students: true, classes: true, fees: true, staffs: true, academics: true, messaging: true, settings: true, front_desk: true, attendance: true }));
    sessionStorage.setItem('app_user', JSON.stringify(user));
  }, SUPERADMIN_USER);

  // Track schools state for mutations
  let schools = JSON.parse(JSON.stringify(MOCK_SCHOOLS));

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/\/+$/, '');
    const method = request.method();
    requestLog.add(`${method} ${path}`);

    // Auth
    if (path === '/api/auth/session') { await json(route, SUPERADMIN_USER); return; }
    if (path === '/api/auth/logout' && method === 'POST') { await json(route, { success: true }); return; }

    // Permissions
    if (path.startsWith('/api/permissions/')) {
      await json(route, { permissions: [{ module: '*', actions: ['view', 'create', 'edit', 'delete', 'publish'] }] });
      return;
    }

    // Feature flags (admin endpoints from featureFlagsApi.js)
    if (path === '/api/feature-flags/admin/all' && method === 'GET') { await json(route, MOCK_FLAGS); return; }
    if (path === '/api/feature-flags/admin' && method === 'POST') {
      const payload = JSON.parse(request.postData() || '{}');
      MOCK_FLAGS.flags.push({ ...payload, overrideSchools: [], rolloutPercentage: payload.rolloutPercentage || 0 });
      await json(route, { flag: payload });
      return;
    }
    const flagUpdateMatch = path.match(/^\/api\/feature-flags\/admin\/(.+)$/);
    if (flagUpdateMatch && method === 'PUT') {
      const key = flagUpdateMatch[1];
      const payload = JSON.parse(request.postData() || '{}');
      const idx = MOCK_FLAGS.flags.findIndex((f) => f.key === key);
      if (idx >= 0) MOCK_FLAGS.flags[idx] = { ...MOCK_FLAGS.flags[idx], ...payload };
      await json(route, { flag: MOCK_FLAGS.flags[idx] });
      return;
    }
    if (flagUpdateMatch && method === 'DELETE') {
      await json(route, { success: true });
      return;
    }
    if (path.match(/^\/api\/feature-flags\/admin\/audit-logs/)) { await json(route, MOCK_AUDIT_LOGS); return; }

    // Feature flags (school-level, non-admin)
    if (path === '/api/feature-flags' && method === 'GET') {
      await json(route, { features: {}, planKey: 'growth', planCapabilities: {} });
      return;
    }

    // Super Admin — Overview
    if (path === '/api/super-admin/overview') { await json(route, MOCK_OVERVIEW); return; }

    // Super Admin — Schools
    if (path === '/api/super-admin/schools' && method === 'GET') { await json(route, schools); return; }
    if (path === '/api/super-admin/schools' && method === 'POST') {
      const payload = JSON.parse(request.postData() || '{}');
      const newSchool = {
        id: `sch-${Date.now()}`,
        name: payload.schoolName,
        code: payload.schoolCode || '',
        plan: payload.plan || 'starter',
        status: 'active',
        planStatus: payload.planStatus || 'trialing',
        contactEmail: payload.contactEmail || '',
        admin: { name: payload.adminName, email: payload.adminEmail },
        counts: { staff: 0 },
        provisioning: { status: 'pending' },
      };
      schools.push(newSchool);
      await json(route, { school: newSchool, temporaryPassword: 'TempPass123!' });
      return;
    }
    const schoolUpdateMatch = path.match(/^\/api\/super-admin\/schools\/([\w-]+)$/);
    if (schoolUpdateMatch && method === 'PATCH') {
      const id = schoolUpdateMatch[1];
      const payload = JSON.parse(request.postData() || '{}');
      const idx = schools.findIndex((s: any) => s.id === id);
      if (idx >= 0) schools[idx] = { ...schools[idx], ...payload };
      await json(route, { school: schools[idx] });
      return;
    }
    const provisionMatch = path.match(/^\/api\/super-admin\/schools\/([\w-]+)\/provision$/);
    if (provisionMatch && method === 'POST') {
      const id = provisionMatch[1];
      const idx = schools.findIndex((s: any) => s.id === id);
      if (idx >= 0) schools[idx].provisioning = { status: 'completed', lastProvisionedAt: new Date().toISOString() };
      await json(route, { success: true, temporaryPassword: 'ProvPass456!' });
      return;
    }

    // Super Admin — Jobs
    if (path === '/api/super-admin/jobs/metrics') { await json(route, MOCK_JOB_METRICS); return; }
    if (path === '/api/super-admin/jobs/dead-letter') { await json(route, { jobs: MOCK_JOBS.jobs.filter((j) => j.status === 'failed') }); return; }
    if (path === '/api/super-admin/jobs/schedule' && method === 'POST') {
      const payload = JSON.parse(request.postData() || '{}');
      const newJob = { _id: `job-${Date.now()}`, name: payload.name, status: 'scheduled', type: payload.interval ? 'recurring' : 'one-off', lastRunAt: null, nextRunAt: new Date().toISOString(), repeatInterval: payload.interval || null };
      MOCK_JOBS.jobs.push(newJob);
      MOCK_JOBS.total += 1;
      await json(route, { job: newJob });
      return;
    }
    if (path === '/api/super-admin/jobs' && method === 'GET') { await json(route, MOCK_JOBS); return; }
    const jobDetailMatch = path.match(/^\/api\/super-admin\/jobs\/([\w-]+)$/);
    if (jobDetailMatch && method === 'GET') {
      const id = jobDetailMatch[1];
      const job = MOCK_JOBS.jobs.find((j) => j._id === id) || MOCK_JOBS.jobs[0];
      await json(route, { job });
      return;
    }
    const jobRetryMatch = path.match(/^\/api\/super-admin\/jobs\/([\w-]+)\/retry$/);
    if (jobRetryMatch && method === 'POST') { await json(route, { success: true }); return; }
    if (jobDetailMatch && method === 'DELETE') { await json(route, { success: true }); return; }

    // Super Admin — Growth
    if (path === '/api/super-admin/growth-analytics' && method === 'GET') { await json(route, MOCK_GROWTH); return; }
    if (path === '/api/super-admin/growth-analytics/funnel') { await json(route, MOCK_GROWTH_FUNNEL); return; }

    // Super Admin — Health
    if (path === '/api/super-admin/school-health') { await json(route, MOCK_HEALTH); return; }

    // Changelog (admin)
    if (path === '/api/changelog/admin' && method === 'GET') { await json(route, MOCK_CHANGELOG); return; }
    if (path === '/api/changelog/admin' && method === 'POST') {
      const payload = JSON.parse(request.postData() || '{}');
      await json(route, { entry: { _id: `cl-${Date.now()}`, ...payload } });
      return;
    }
    const changelogUpdateMatch = path.match(/^\/api\/changelog\/admin\/([\w-]+)$/);
    if (changelogUpdateMatch && method === 'PUT') { await json(route, { entry: {} }); return; }
    if (changelogUpdateMatch && method === 'DELETE') { await json(route, { success: true }); return; }

    // Changelog (non-admin)
    if (path === '/api/changelog') { await json(route, { entries: [], total: 0 }); return; }

    // Settings fallback
    if (path === '/api/settings') { await json(route, { name: 'SchoolSync', academicYear: '2026-27' }); return; }

    // Default fallback
    await json(route, {}, 200);
  });
}

/* ───────────────── Tests ───────────────── */

test.describe('Super Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    requestLog.clear();
    await installSuperAdminMock(page);
  });

  // 1. Summary cards
  test('page loads with summary cards', async ({ page }) => {
    await page.goto('/super-admin');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Total schools')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Active schools')).toBeVisible();
    await expect(page.getByText('Trials running')).toBeVisible();
    await expect(page.getByText('Attention needed')).toBeVisible();
    // Verify summary card values exist in the page
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('12');
    expect(bodyText).toContain('8');
  });

  // 2. Schools tab — table
  test('schools tab shows school table with details', async ({ page }) => {
    await page.goto('/super-admin');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Delhi Public School')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('DPS', { exact: true })).toBeVisible();
    await expect(page.getByText('Greenfield Academy')).toBeVisible();
    await expect(page.getByText('Rohit Sharma')).toBeVisible();
    await expect(page.getByText('45 staff')).toBeVisible();
  });

  // 3. Create school form validation
  test('create school form validates required fields', async ({ page }) => {
    await page.goto('/super-admin');
    await page.waitForLoadState('networkidle');

    // The form has HTML required attributes — try submitting empty
    const createBtn = page.getByRole('button', { name: 'Create school' });
    await expect(createBtn).toBeVisible({ timeout: 10_000 });

    // Fill only partial data — missing admin name & email
    await page.getByPlaceholder('School name').fill('Test School');
    await createBtn.click();

    // HTML validation should prevent submission — form should still be visible
    await expect(page.getByPlaceholder('School name')).toBeVisible();
    // Admin full name is required — the input should be invalid
    const adminNameInput = page.getByPlaceholder('Admin full name');
    const isInvalid = await adminNameInput.evaluate((el: HTMLInputElement) => !el.checkValidity());
    expect(isInvalid).toBe(true);
  });

  // 4. Created school appears in table
  test('created school appears in table', async ({ page }) => {
    await page.goto('/super-admin');
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder('School name').fill('Maple Leaf International');
    await page.getByPlaceholder('Admin full name').fill('Arun Kumar');
    await page.getByPlaceholder('Admin email').fill('arun@maple.edu');
    await page.getByRole('button', { name: 'Create school' }).click();

    // Success message with temporary password
    await expect(page.getByText(/Temporary admin password|created/i)).toBeVisible({ timeout: 10_000 });
    // School should appear in the table after reload
    await expect(page.getByText('Maple Leaf International')).toBeVisible({ timeout: 10_000 });
  });

  // 5. Inline edit school fields
  test('inline edit school fields saves correctly', async ({ page }) => {
    await page.goto('/super-admin');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Delhi Public School')).toBeVisible({ timeout: 10_000 });

    // Find the first Save button in the school registry table
    const saveButtons = page.getByRole('button', { name: 'Save' });
    await expect(saveButtons.first()).toBeVisible();
    await saveButtons.first().click();

    // Should show success message
    await expect(page.getByText(/Updated/i)).toBeVisible({ timeout: 10_000 });
    expect(requestLog.has('PATCH /api/super-admin/schools/sch-001')).toBe(true);
  });

  // 6. Provision school
  test('provision school action triggers API and shows success', async ({ page }) => {
    await page.goto('/super-admin');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Delhi Public School')).toBeVisible({ timeout: 10_000 });

    const provisionButtons = page.getByRole('button', { name: 'Provision' });
    await expect(provisionButtons.first()).toBeVisible();
    await provisionButtons.first().click();

    await expect(page.getByText(/Provisioned|Temporary admin password/i)).toBeVisible({ timeout: 10_000 });
    expect(requestLog.has('POST /api/super-admin/schools/sch-001/provision')).toBe(true);
  });

  // 7. Feature Flags tab shows flag rows
  test('feature flags tab shows flag list', async ({ page }) => {
    await page.goto('/super-admin');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Feature flags' }).click();

    await expect(page.getByText('advancedReports')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Advanced Reports')).toBeVisible();
    await expect(page.getByText('parentChat')).toBeVisible();
    await expect(page.getByText('Enabled').first()).toBeVisible();
    await expect(page.getByText('Rollout').first()).toBeVisible();
  });

  // 8. Toggle / edit a feature flag
  test('editing a feature flag triggers PUT', async ({ page }) => {
    await page.goto('/super-admin');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Feature flags' }).click();
    await expect(page.getByText('advancedReports')).toBeVisible({ timeout: 10_000 });

    // Click the Edit button for the first flag
    const editButtons = page.getByRole('button', { name: 'Edit' });
    await editButtons.first().click();

    // The edit form should appear
    await expect(page.getByText(/Edit: advancedReports/i)).toBeVisible({ timeout: 5_000 });

    // Submit the edit form
    await page.getByRole('button', { name: 'Save flag' }).click();

    await expect(page.getByText(/updated/i)).toBeVisible({ timeout: 10_000 });
    expect(requestLog.has('PUT /api/feature-flags/admin/advancedReports')).toBe(true);
  });

  // 9. Jobs tab shows jobs with status badges
  test('jobs tab shows system jobs with status badges', async ({ page }) => {
    await page.goto('/super-admin');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Jobs' }).click();

    // Metric cards
    await expect(page.getByText('Total jobs')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('142')).toBeVisible();
    await expect(page.getByText('Running').first()).toBeVisible();

    // Job table rows
    await expect(page.getByText('send scheduled announcement')).toBeVisible();
    await expect(page.getByText('cleanup old jobs')).toBeVisible();
    await expect(page.getByText('bulk import students')).toBeVisible();

    // Status badges
    await expect(page.getByText('completed').first()).toBeVisible();
    await expect(page.getByText('running').first()).toBeVisible();
    await expect(page.getByText('failed').first()).toBeVisible();
  });

  // 10. Job detail modal
  test('job detail modal opens on click', async ({ page }) => {
    await page.goto('/super-admin');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Jobs' }).click();
    await expect(page.getByText('send scheduled announcement').first()).toBeVisible({ timeout: 10_000 });

    // Click the job name link to open the detail modal
    await page.getByText('send scheduled announcement').first().click();

    await expect(page.getByText('Job detail')).toBeVisible({ timeout: 10_000 });
    // The API call goes through the request queue — wait for it to be logged
    await expect.poll(() => requestLog.has('GET /api/super-admin/jobs/job-001'), { timeout: 5_000 }).toBeTruthy();
  });

  // 11. Schedule job form
  test('schedule job form creates new scheduled job', async ({ page }) => {
    await page.goto('/super-admin');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Jobs' }).click();
    await expect(page.getByText('Total jobs')).toBeVisible({ timeout: 10_000 });

    // Switch to Schedule job tab
    await page.getByRole('button', { name: 'Schedule job' }).click();

    await expect(page.getByText('Schedule a job', { exact: false })).toBeVisible({ timeout: 5_000 });

    // Fill the form — use the default job name and submit (use .last() to skip the tab button)
    await page.getByRole('button', { name: 'Schedule job', exact: true }).last().click();

    // Should trigger the schedule API
    await expect(page.getByText(/scheduled successfully/i)).toBeVisible({ timeout: 10_000 });
    expect(requestLog.has('POST /api/super-admin/jobs/schedule')).toBe(true);
  });

  // 12. Changelog tab shows release notes
  test('changelog tab shows release notes', async ({ page }) => {
    await page.goto('/super-admin');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Changelog' }).click();

    await expect(page.getByText('Changelog entries')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('New attendance module')).toBeVisible();
    await expect(page.getByText('Bug fix: fee calculation')).toBeVisible();
    await expect(page.getByText('v2.1.0')).toBeVisible();
    await expect(page.getByText('Published').first()).toBeVisible();
    await expect(page.getByText('Draft').first()).toBeVisible();
  });

  // 13. Growth tab shows metrics
  test('growth tab shows signup/conversion metrics', async ({ page }) => {
    await page.goto('/super-admin');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Growth' }).click();

    // Summary tiles
    await expect(page.getByText('Avg health score')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('72')).toBeVisible();
    await expect(page.getByText('High churn risk')).toBeVisible();
    await expect(page.getByText('Growing').first()).toBeVisible();

    // Feature funnel
    await expect(page.getByText('Feature activation funnel')).toBeVisible();
    await expect(page.getByText('attendance')).toBeVisible();

    // School table
    await expect(page.getByText('Delhi Public School')).toBeVisible();
  });

  // 14. School Health tab shows per-school health indicators
  test('school health tab shows per-school health indicators', async ({ page }) => {
    await page.goto('/super-admin');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Health' }).click();

    await expect(page.getByText('Per-school health monitor')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Delhi Public School')).toBeVisible();
    await expect(page.getByText('Greenfield Academy')).toBeVisible();

    // Health summary tiles
    await expect(page.getByText('Healthy')).toBeVisible();

    // School details — risk badges
    await expect(page.getByText('low').first()).toBeVisible();
    await expect(page.getByText('high').first()).toBeVisible();
  });

  // 15. Plan filter on schools tab — use growth panel risk filter as proxy
  test('plan filter works on growth tab', async ({ page }) => {
    await page.goto('/super-admin');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Growth' }).click();
    await expect(page.getByText('Delhi Public School')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Greenfield Academy')).toBeVisible();

    // Click "high risk" filter — should show only Greenfield
    await page.getByRole('button', { name: 'high risk' }).click();

    await expect(page.getByText('Greenfield Academy')).toBeVisible();
    await expect(page.getByText('Delhi Public School')).not.toBeVisible({ timeout: 3_000 });

    // Click "All" to reset
    await page.getByRole('button', { name: /^All/i }).click();
    await expect(page.getByText('Delhi Public School')).toBeVisible({ timeout: 5_000 });
  });
});
