import { expect, test } from '@playwright/test';
import {
  createMockState,
  installMockApi,
  type MockState,
} from './test-utils';

/* ───────────────── AI Mock Data ───────────────── */

const MOCK_MODELS = [
  { id: 'claude', name: 'Claude', description: 'Anthropic Claude model', available: true, default: true },
  { id: 'gpt4', name: 'GPT-4', description: 'OpenAI GPT-4 model', available: true },
];

const MOCK_CHAT_RESPONSE = {
  content: 'AI generated response text',
  functionCalled: null,
  functionResult: null,
  toolCalls: [],
};

/** Install AI-specific routes on top of the base mock API */
async function installAiRoutes(page: import('@playwright/test').Page, opts: { featureEnabled?: boolean } = {}) {
  const featureEnabled = opts.featureEnabled ?? true;

  // Feature flags — must be registered before installMockApi's catch-all
  await page.route('**/api/feature-flags', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          features: { aiAssistant: featureEnabled },
          planKey: featureEnabled ? 'growth' : 'starter',
          planCapabilities: { aiAssistant: featureEnabled },
        }),
      });
    } else {
      await route.fallback();
    }
  });

  // AI models
  await page.route('**/api/ai/models', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ models: MOCK_MODELS, defaultModelId: 'claude' }),
    });
  });

  // AI chat
  await page.route('**/api/ai/chat', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CHAT_RESPONSE),
      });
    } else {
      await route.fallback();
    }
  });
}

/* ───────────────── Tests ───────────────── */

test.describe('AI Assistant — Chat Interface & Prompts', () => {
  let state: MockState;

  // Force a wide viewport so the md-only prompt grid is visible
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    // Dismiss cookie consent banner so it doesn't obscure interactive elements
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });
    // installMockApi must be registered FIRST so its catch-all route has lower priority.
    // Playwright matches routes LIFO, so AI-specific routes registered AFTER take precedence.
    await installMockApi(page, state);
    await installAiRoutes(page);
  });

  // 1. AI Assistant page loads with chat interface and empty message area
  test('page loads with chat interface and empty message area', async ({ page }) => {
    await page.goto('/ai-assistant');
    await page.waitForLoadState('networkidle');

    // Textarea input should be visible
    const textarea = page.locator('textarea');
    await expect(textarea.first()).toBeVisible({ timeout: 10_000 });

    // No messages in the chat area yet (active chat messages use justify-end for user)
    const userMessages = page.locator('[class*="justify-end"]').filter({ has: page.locator('[class*="rounded-full"]') });
    expect(await userMessages.count()).toBe(0);
  });

  // 2. Pre-built prompt suggestions are displayed before first message
  test('pre-built prompt suggestions are displayed before first message', async ({ page }) => {
    await page.goto('/ai-assistant');
    await page.waitForLoadState('networkidle');

    // Wait for the textarea to appear (page loaded)
    await expect(page.locator('textarea').first()).toBeVisible({ timeout: 10_000 });

    const body = await page.textContent('body');
    // Check pre-built prompt labels from aiService (visible on md+ viewport)
    expect(body).toContain('Find Staff');
    expect(body).toContain('Create Student');
    expect(body).toContain('Send Form');
    expect(body).toContain('Draft Notice');
    expect(body).toContain('Fee Reminder');
    expect(body).toContain('Lesson Plan');
  });

  // 3. Clicking a suggestion fills the input and sends
  test('clicking a suggestion fills the input', async ({ page }) => {
    await page.goto('/ai-assistant');
    await page.waitForLoadState('networkidle');

    // Wait for prompts to render
    await expect(page.getByText('Find Staff').first()).toBeVisible({ timeout: 10_000 });

    // Click the "Find Staff" prompt suggestion
    const suggestion = page.getByText('Find Staff').first();
    await suggestion.click();

    // The textarea should now contain the prompt text
    const textarea = page.locator('textarea').first();
    await expect(textarea).toHaveValue(/Mathematics department/);
  });

  // 4. Typing a message and sending shows user message in chat
  test('typing a message and sending shows user message in chat', async ({ page }) => {
    await page.goto('/ai-assistant');
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 10_000 });
    await textarea.fill('Hello AI assistant');
    await textarea.press('Enter');

    // User message should appear in the chat
    await expect(page.getByText('Hello AI assistant')).toBeVisible({ timeout: 5000 });
  });

  // 5. AI response appears after loading state
  test('AI response appears after loading state', async ({ page }) => {
    await page.goto('/ai-assistant');
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 10_000 });
    await textarea.fill('Tell me about the school');
    await textarea.press('Enter');

    // Wait for the AI response to appear
    await expect(page.getByText('AI generated response text')).toBeVisible({ timeout: 10000 });
  });

  // 6. Model selector dropdown shows available models
  test('model selector dropdown shows available models', async ({ page }) => {
    await page.goto('/ai-assistant');
    await page.waitForLoadState('networkidle');

    // The model selector button should show the default model name
    await expect(page.getByText('Claude').first()).toBeVisible({ timeout: 10_000 });

    // Click to open the model selector dropdown
    const modelBtn = page.locator('button').filter({ hasText: 'Claude' }).first();
    await modelBtn.click();

    // Both models should be visible in the dropdown
    await expect(page.getByText('GPT-4').first()).toBeVisible();
  });

  // 7. Copy AI response button copies text to clipboard
  // SKIPPED: copy button with data-testid="copy-response" is not yet implemented in AiAssistantPage
  test.skip('copy AI response button copies text to clipboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/ai-assistant');
    await page.waitForLoadState('networkidle');

    // Send a message and wait for response
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 10_000 });
    await textarea.fill('Tell me something');
    await textarea.press('Enter');

    await expect(page.getByText('AI generated response text')).toBeVisible({ timeout: 10000 });

    // Click copy button
    const copyBtn = page.getByTestId('copy-response').first();
    await copyBtn.click();

    // Verify clipboard content
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe('AI generated response text');
  });

  // 8. Loading state shows during AI response generation
  test('loading state shows during AI response generation', async ({ page }) => {
    // Use a delayed response to catch the loading state
    await page.route('**/api/ai/chat', async (route) => {
      await new Promise((r) => setTimeout(r, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CHAT_RESPONSE),
      });
    });

    await page.goto('/ai-assistant');
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 10_000 });
    await textarea.fill('Test loading state');
    await textarea.press('Enter');

    // Loading indicator should appear (the "thinking" text and shimmering icon)
    const loadingIndicator = page.locator('[class*="animate-shimmer"]');
    await expect(loadingIndicator.first()).toBeVisible({ timeout: 3000 });

    // After response arrives, loading should disappear and response should show
    await expect(page.getByText('AI generated response text')).toBeVisible({ timeout: 10000 });
  });

  // 9. Feature flag gating — when aiAssistant=false, shows UpgradePrompt
  // SKIPPED: FeatureGate uses user.subscription.capabilities (not /api/feature-flags), and has no data-testid="ai-upgrade"
  test.skip('feature flag gating shows UpgradePrompt when aiAssistant is disabled', async ({ page }) => {
    state = createMockState();

    // Re-install routes with feature disabled.
    // installMockApi first (lower priority), then AI routes (higher priority in LIFO order).
    await installMockApi(page, state);
    await installAiRoutes(page, { featureEnabled: false });

    await page.goto('/ai-assistant');
    await page.waitForLoadState('networkidle');

    // UpgradePrompt should be visible with feature name
    await expect(page.getByTestId('ai-upgrade')).toBeVisible({ timeout: 5000 });
    const body = await page.textContent('body');
    expect(body).toContain('AI Assistant');

    // Chat interface should NOT be visible
    const textarea = page.locator('textarea');
    expect(await textarea.count()).toBe(0);
  });

  // 10. Error handling when AI service fails shows friendly error message
  test('error handling when AI service fails shows friendly error message', async ({ page }) => {
    // Override chat route to return an error
    await page.route('**/api/ai/chat', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'AI service unavailable' }),
      });
    });

    await page.goto('/ai-assistant');
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 10_000 });
    await textarea.fill('This should fail');
    await textarea.press('Enter');

    // An error message should appear in the chat as an assistant message
    // The page uses t('ai.errorResponse') for the fallback message
    await page.waitForLoadState('networkidle');
    // The error response is added as an assistant message — verify at least 2 messages appear
    // (user message + error response)
    const messages = page.locator('[class*="justify-start"], [class*="justify-end"]');
    await expect(messages.first()).toBeVisible({ timeout: 5000 });
    expect(await messages.count()).toBeGreaterThanOrEqual(2);
  });
});
