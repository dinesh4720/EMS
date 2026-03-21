import { expect, test } from '@playwright/test';
import { createMockState, installMockApi, type MockState } from './test-utils';

test('debug login page', async ({ page }) => {
  const errors: string[] = [];
  const logs: string[] = [];
  
  page.on('pageerror', (err) => {
    errors.push(`PAGE ERROR: ${err.message}`);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warn') {
      logs.push(`CONSOLE ${msg.type().toUpperCase()}: ${msg.text()}`);
    }
  });

  const state = createMockState();
  await installMockApi(page, state);

  // Clear session to simulate unauthenticated state
  await page.addInitScript(() => {
    sessionStorage.removeItem('app_user');
  });

  // Override session to return 401
  await page.route('**/api/auth/session', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Not authenticated' }),
    });
  });

  await page.goto('/login');
  await page.waitForTimeout(5000);

  // Print all captured errors and warnings
  console.log('=== PAGE ERRORS ===');
  for (const e of errors) console.log(e);
  console.log('=== CONSOLE ERRORS/WARNINGS ===');
  for (const l of logs) console.log(l);
  
  // Check what's on the page
  const html = await page.content();
  const bodyText = await page.locator('body').innerText().catch(() => '<empty>');
  console.log('=== BODY TEXT ===');
  console.log(bodyText.substring(0, 500));
  console.log('=== ROOT DIV INNER HTML ===');
  const rootHtml = await page.locator('#root').innerHTML().catch(() => '<not found>');
  console.log(rootHtml.substring(0, 1000));
});
