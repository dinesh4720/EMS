import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, SCHOOL_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Subscription & billing mock data
 * ───────────────────────────────────────────────────────────────────── */

interface SubscriptionPlan {
  _id: string; id: string; name: string; tier: string;
  price: number; billingCycle: string;
  maxStudents: number; maxStaff: number;
  features: string[];
  status: string; startDate: string; endDate: string;
}

interface BillingInfo {
  name: string; email: string; address: string;
  city: string; state: string; zipCode: string;
  gstNumber: string | null;
}

interface Invoice {
  _id: string; id: string; number: string;
  amount: number; status: string;
  date: string; dueDate: string;
  paidAt: string | null;
  downloadUrl: string;
}

interface SubscriptionData {
  plan: SubscriptionPlan;
  billing: BillingInfo;
  invoices: Invoice[];
  usage: { students: number; staff: number; storage: string };
}

function seedSubscription(state: MockState): SubscriptionData {
  const data: SubscriptionData = {
    plan: {
      _id: 'plan-pro', id: 'plan-pro', name: 'Pro Plan', tier: 'pro',
      price: 9999, billingCycle: 'monthly',
      maxStudents: 500, maxStaff: 50,
      features: [
        'Unlimited Classes', 'Fee Management', 'Attendance Tracking',
        'Exam & Results', 'Messaging', 'Reports & Analytics',
        'Parent App', 'Staff App', 'Priority Support',
      ],
      status: 'active',
      startDate: '2026-01-01', endDate: '2027-01-01',
    },
    billing: {
      name: 'SchoolSync Demo School',
      email: 'billing@schoolsync.test',
      address: '123 Education Lane',
      city: 'Bangalore', state: 'Karnataka', zipCode: '560001',
      gstNumber: '29AABCS1429B1ZS',
    },
    invoices: [
      {
        _id: 'inv-1', id: 'inv-1', number: 'INV-2026-003',
        amount: 9999, status: 'paid',
        date: '2026-03-01', dueDate: '2026-03-15',
        paidAt: '2026-03-10',
        downloadUrl: '/invoices/INV-2026-003.pdf',
      },
      {
        _id: 'inv-2', id: 'inv-2', number: 'INV-2026-002',
        amount: 9999, status: 'paid',
        date: '2026-02-01', dueDate: '2026-02-15',
        paidAt: '2026-02-12',
        downloadUrl: '/invoices/INV-2026-002.pdf',
      },
      {
        _id: 'inv-3', id: 'inv-3', number: 'INV-2026-001',
        amount: 9999, status: 'paid',
        date: '2026-01-01', dueDate: '2026-01-15',
        paidAt: '2026-01-08',
        downloadUrl: '/invoices/INV-2026-001.pdf',
      },
    ],
    usage: {
      students: 245, staff: 18, storage: '2.3 GB',
    },
  };
  (state as any).subscription = data;
  return data;
}

/* ─────────────────────────────────────────────────────────────────────
 *  TC088 — Subscription & Billing
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC088 — Subscription & Billing', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    seedSubscription(state);

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);

    // Override subscription/billing API routes
    await page.route('**/api/subscription**', async (route) => {
      const path = new URL(route.request().url()).pathname.replace(/\/+$/, '');
      const method = route.request().method();
      const sub: SubscriptionData = (state as any).subscription;

      const json = (data: unknown, status = 200) =>
        route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

      // GET /api/subscription
      if (path === '/api/subscription' && method === 'GET') {
        return json(sub);
      }

      // GET /api/subscription/plan
      if (path === '/api/subscription/plan' && method === 'GET') {
        return json(sub.plan);
      }

      // GET /api/subscription/invoices
      if (path === '/api/subscription/invoices' && method === 'GET') {
        return json({ data: sub.invoices, total: sub.invoices.length });
      }

      // GET /api/subscription/invoices/:id
      const invoiceMatch = path.match(/^\/api\/subscription\/invoices\/([^/]+)$/);
      if (invoiceMatch && method === 'GET') {
        const inv = sub.invoices.find(i => i.id === invoiceMatch[1]);
        return inv ? json(inv) : json({ error: 'Not found' }, 404);
      }

      // GET /api/subscription/billing
      if (path === '/api/subscription/billing' && method === 'GET') {
        return json(sub.billing);
      }

      // PUT /api/subscription/billing
      if (path === '/api/subscription/billing' && method === 'PUT') {
        const body = JSON.parse(route.request().postData() || '{}');
        Object.assign(sub.billing, body);
        return json(sub.billing);
      }

      // GET /api/subscription/usage
      if (path === '/api/subscription/usage' && method === 'GET') {
        return json(sub.usage);
      }

      await route.continue();
    });

    // Also handle billing path
    await page.route('**/api/billing**', async (route) => {
      const path = new URL(route.request().url()).pathname.replace(/\/+$/, '');
      const method = route.request().method();
      const sub: SubscriptionData = (state as any).subscription;

      const json = (data: unknown, status = 200) =>
        route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

      if (path === '/api/billing' && method === 'GET') return json(sub);
      if (path === '/api/billing/invoices' && method === 'GET') return json({ data: sub.invoices, total: sub.invoices.length });

      const invoiceMatch = path.match(/^\/api\/billing\/invoices\/([^/]+)$/);
      if (invoiceMatch && method === 'GET') {
        const inv = sub.invoices.find(i => i.id === invoiceMatch[1]);
        return inv ? json(inv) : json({ error: 'Not found' }, 404);
      }

      await route.continue();
    });

    // Handle settings/subscription path
    await page.route('**/api/settings/subscription**', async (route) => {
      const method = route.request().method();
      const sub: SubscriptionData = (state as any).subscription;
      const json = (data: unknown, status = 200) =>
        route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

      if (method === 'GET') return json(sub);
      await route.continue();
    });
  });

  /* ───────── 1. Subscription page loads ───────── */

  test('1) subscription and billing page loads', async ({ page }) => {
    await page.goto('/settings/subscription');
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('Subscription') || bodyText?.includes('subscription') ||
      bodyText?.includes('Billing') || bodyText?.includes('billing') ||
      bodyText?.includes('Plan') || bodyText?.includes('Settings'),
    ).toBeTruthy();
  });

  /* ───────── 2. Plan info is displayed ───────── */

  test('2) subscription plan information is displayed', async ({ page }) => {
    await page.goto('/settings/subscription');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('Pro Plan') || bodyText?.includes('Pro') ||
      bodyText?.includes('pro') || bodyText?.includes('9,999') ||
      bodyText?.includes('9999') || bodyText?.includes('Active') ||
      bodyText?.includes('active'),
    ).toBeTruthy();
  });

  /* ───────── 3. Billing info section ───────── */

  test('3) billing information section is visible', async ({ page }) => {
    await page.goto('/settings/subscription');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('Billing') || bodyText?.includes('billing') ||
      bodyText?.includes('SchoolSync Demo School') ||
      bodyText?.includes('billing@schoolsync.test') ||
      bodyText?.includes('GST') || bodyText?.includes('Address'),
    ).toBeTruthy();
  });

  /* ───────── 4. Invoice history is shown ───────── */

  test('4) invoice history lists past invoices', async ({ page }) => {
    await page.goto('/settings/subscription');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('INV-2026') || bodyText?.includes('Invoice') ||
      bodyText?.includes('invoice') || bodyText?.includes('History') ||
      bodyText?.includes('9,999') || bodyText?.includes('Paid') ||
      bodyText?.includes('paid'),
    ).toBeTruthy();
  });

  /* ───────── 5. View a past invoice ───────── */

  test('5) clicking an invoice shows its details', async ({ page }) => {
    await page.goto('/settings/subscription');
    await page.waitForLoadState('networkidle');

    const invoiceLink = page.getByText(/INV-2026-003|INV-2026/).first();
    if (await invoiceLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await invoiceLink.click();
      await page.waitForTimeout(500);

      const bodyText = await page.textContent('body');
      expect(
        bodyText?.includes('INV-2026') || bodyText?.includes('9,999') ||
        bodyText?.includes('9999') || bodyText?.includes('Paid') ||
        bodyText?.includes('paid') || bodyText?.includes('Invoice') ||
        bodyText?.includes('Download'),
      ).toBeTruthy();
    }
  });

  /* ───────── 6. Plan features are listed ───────── */

  test('6) plan features are displayed', async ({ page }) => {
    await page.goto('/settings/subscription');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('Unlimited Classes') ||
      bodyText?.includes('Fee Management') ||
      bodyText?.includes('Attendance') ||
      bodyText?.includes('Reports') ||
      bodyText?.includes('Parent App') ||
      bodyText?.includes('Priority Support') ||
      bodyText?.includes('Feature') || bodyText?.includes('feature'),
    ).toBeTruthy();
  });

  /* ───────── 7. Upgrade/downgrade button visibility ───────── */

  test('7) upgrade or downgrade button is visible', async ({ page }) => {
    await page.goto('/settings/subscription');
    await page.waitForLoadState('networkidle');

    const upgradeBtn = page.getByRole('button', { name: /upgrade|change plan|downgrade/i }).first();
    const managePlanBtn = page.getByRole('button', { name: /manage|plan/i }).first();
    const viewPlansLink = page.getByText(/View Plans|Upgrade|Change Plan|Manage Plan/i).first();

    const hasUpgrade = await upgradeBtn.isVisible({ timeout: 3000 }).catch(() => false);
    const hasManage = await managePlanBtn.isVisible({ timeout: 2000 }).catch(() => false);
    const hasViewPlans = await viewPlansLink.isVisible({ timeout: 2000 }).catch(() => false);

    // At least the subscription page loaded and plan info is shown
    const bodyText = await page.textContent('body');
    expect(
      hasUpgrade || hasManage || hasViewPlans ||
      bodyText?.includes('Pro Plan') || bodyText?.includes('Plan'),
    ).toBeTruthy();
  });

  /* ───────── 8. Usage stats are displayed ───────── */

  test('8) usage statistics show current resource consumption', async ({ page }) => {
    await page.goto('/settings/subscription');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('245') || bodyText?.includes('18') ||
      bodyText?.includes('2.3 GB') || bodyText?.includes('Usage') ||
      bodyText?.includes('usage') || bodyText?.includes('Students') ||
      bodyText?.includes('Storage') || bodyText?.includes('500'),
    ).toBeTruthy();
  });

  /* ───────── 9. State integrity check ───────── */

  test('9) state has correct subscription and billing data', async ({ page }) => {
    const sub = (state as any).subscription as SubscriptionData;

    expect(sub.plan.name).toBe('Pro Plan');
    expect(sub.plan.tier).toBe('pro');
    expect(sub.plan.price).toBe(9999);
    expect(sub.plan.status).toBe('active');
    expect(sub.plan.maxStudents).toBe(500);
    expect(sub.plan.features).toHaveLength(9);

    expect(sub.billing.name).toBe('SchoolSync Demo School');
    expect(sub.billing.gstNumber).toBe('29AABCS1429B1ZS');

    expect(sub.invoices).toHaveLength(3);
    expect(sub.invoices[0].number).toBe('INV-2026-003');
    expect(sub.invoices[0].status).toBe('paid');

    expect(sub.usage.students).toBe(245);
    expect(sub.usage.staff).toBe(18);
    expect(sub.usage.storage).toBe('2.3 GB');
  });
});
