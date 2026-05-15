import { test, expect, Page } from "@playwright/test";

/**
 * Phase-0..11 visual regression baseline.
 *
 * Captures the revamped surfaces at 3 breakpoints (desktop, tablet, mobile)
 * so future style changes are caught in CI. Uses Playwright's
 * toHaveScreenshot — first run records the baseline; subsequent runs
 * diff against it.
 *
 * Update baseline:    npx playwright test tests/visual --update-snapshots
 * Run regression:     npx playwright test tests/visual
 *
 * The dev server must be running (`npm run dev`) and a test admin account
 * must exist. The default credentials below match the seeded phase4test
 * user; override via TEST_USER / TEST_PASS env vars.
 */

const TEST_USER = process.env.TEST_USER || "phase4test@school.com";
const TEST_PASS = process.env.TEST_PASS || "phase4test";

const BREAKPOINTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 1024, height: 768 },
  mobile: { width: 390, height: 844 },
} as const;

// Pages to snapshot. Each entry → a screenshot per breakpoint.
// Path is the URL after baseURL. label is the snapshot file stem.
const PAGES: Array<{ label: string; path: string; waitFor?: string }> = [
  { label: "dashboard", path: "/", waitFor: "h1" },
  { label: "students-list", path: "/students" },
  { label: "classes-today", path: "/classes" },
  { label: "classes-by-class", path: "/classes?view=class" },
  { label: "calendar", path: "/calendar" },
  { label: "messaging", path: "/messaging" },
  { label: "fees", path: "/fees" },
  { label: "front-desk", path: "/front-desk" },
  { label: "academics", path: "/academics" },
  { label: "settings", path: "/settings" },
  { label: "staff-list", path: "/staffs" },
];

async function login(page: Page) {
  await page.goto("/login");
  await page.locator("#login-email").fill(TEST_USER);
  await page.locator("#login-password").fill(TEST_PASS);
  await page.locator("form").evaluate((f: HTMLFormElement) => f.requestSubmit());
  // Wait for either the dashboard or the setup wizard. If wizard appears, skip it.
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
  const skip = page.getByRole("button", { name: /^Skip Setup$/i });
  if (await skip.isVisible({ timeout: 1500 }).catch(() => false)) {
    await skip.click();
  }
}

async function dismissCookieBanner(page: Page) {
  const got = page.getByRole("button", { name: /^Got it$/ });
  if (await got.isVisible({ timeout: 800 }).catch(() => false)) {
    await got.click();
  }
}

test.describe("Revamp visual regression — desktop", () => {
  test.use({ viewport: BREAKPOINTS.desktop, colorScheme: "light" });

  test.beforeEach(async ({ page }) => {
    await login(page);
    await dismissCookieBanner(page);
  });

  for (const { label, path } of PAGES) {
    test(label, async ({ page }) => {
      await page.goto(path);
      // Give the page a beat to settle (data fetches, animations).
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(800);
      await expect(page).toHaveScreenshot(`${label}-desktop.png`, {
        fullPage: false,
        animations: "disabled",
        maxDiffPixelRatio: 0.02,
      });
    });
  }
});

test.describe("Revamp visual regression — tablet", () => {
  test.use({ viewport: BREAKPOINTS.tablet, colorScheme: "light" });

  test.beforeEach(async ({ page }) => {
    await login(page);
    await dismissCookieBanner(page);
  });

  for (const { label, path } of PAGES) {
    test(label, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(800);
      await expect(page).toHaveScreenshot(`${label}-tablet.png`, {
        fullPage: false,
        animations: "disabled",
        maxDiffPixelRatio: 0.02,
      });
    });
  }
});

test.describe("Revamp visual regression — mobile", () => {
  test.use({ viewport: BREAKPOINTS.mobile, colorScheme: "light" });

  test.beforeEach(async ({ page }) => {
    await login(page);
    await dismissCookieBanner(page);
  });

  for (const { label, path } of PAGES) {
    test(label, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(800);
      await expect(page).toHaveScreenshot(`${label}-mobile.png`, {
        fullPage: false,
        animations: "disabled",
        maxDiffPixelRatio: 0.02,
      });
    });
  }
});

// Frosted overlays — capture each opened overlay so future regressions to
// the shared `.frosted-overlay` base are caught.
test.describe("Frosted overlays — desktop", () => {
  test.use({ viewport: BREAKPOINTS.desktop, colorScheme: "light" });

  test.beforeEach(async ({ page }) => {
    await login(page);
    await dismissCookieBanner(page);
  });

  test("student overlay (deep link)", async ({ page }) => {
    // Navigate to /students, click the first row to open the overlay.
    await page.goto("/students");
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    const firstRow = page.locator("tbody tr.group").first();
    if (await firstRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstRow.click();
      await page.locator(".frosted-overlay").waitFor({ timeout: 5000 });
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot("overlay-student.png", {
        animations: "disabled",
        maxDiffPixelRatio: 0.02,
      });
    } else {
      test.skip(true, "No students in fixture data; cannot open overlay.");
    }
  });

  test("payment sheet (collect)", async ({ page }) => {
    await page.goto("/fees");
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    await page.getByRole("button", { name: /Collect payment/i }).click();
    await page.locator(".frosted-overlay").waitFor({ timeout: 5000 });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("overlay-payment.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.02,
    });
  });

  test("visitor check-in sheet", async ({ page }) => {
    await page.goto("/front-desk");
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    await page.getByRole("button", { name: /Check in visitor/i }).click();
    await page.locator(".frosted-overlay").waitFor({ timeout: 5000 });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("overlay-visitor.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.02,
    });
  });

  test("calendar add-event drawer", async ({ page }) => {
    await page.goto("/calendar");
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    await page.getByRole("button", { name: /Add Event|New Event/i }).click();
    await page
      .locator(".frosted-overlay--side, .frosted-overlay")
      .first()
      .waitFor({ timeout: 5000 });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("overlay-calendar-drawer.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.02,
    });
  });
});
