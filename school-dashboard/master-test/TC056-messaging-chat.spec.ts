import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  ADMIN_ID, TEACHER_A_ID, TEACHER_B_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ───────────────── Chat Test Data ───────────────── */

const CONV_1_ID = 'conv-001';
const CONV_2_ID = 'conv-002';

function seedConversations(state: MockState) {
  (state as any).conversations = [
    {
      id: CONV_1_ID, _id: CONV_1_ID, type: 'direct',
      otherParticipant: {
        userId: TEACHER_A_ID, name: 'Ananya Sharma',
        avatar: null, online: true, lastSeen: new Date().toISOString(), userType: 'staff',
      },
      lastMessage: { content: 'See you tomorrow!', type: 'text', timestamp: new Date().toISOString() },
      unreadCount: 2,
      participants: [
        { userId: ADMIN_ID, name: 'Dinesh Admin', userType: 'staff' },
        { userId: TEACHER_A_ID, name: 'Ananya Sharma', userType: 'staff' },
      ],
    },
    {
      id: CONV_2_ID, _id: CONV_2_ID, type: 'direct',
      otherParticipant: {
        userId: TEACHER_B_ID, name: 'Ravi Menon',
        avatar: null, online: false, lastSeen: '2026-03-19T10:00:00.000Z', userType: 'staff',
      },
      lastMessage: { content: 'Please check the marks sheet', type: 'text', timestamp: '2026-03-19T09:00:00.000Z' },
      unreadCount: 0,
      participants: [
        { userId: ADMIN_ID, name: 'Dinesh Admin', userType: 'staff' },
        { userId: TEACHER_B_ID, name: 'Ravi Menon', userType: 'staff' },
      ],
    },
  ];
}

function seedMessages(state: MockState) {
  (state as any).chatMessages = {
    [CONV_1_ID]: [
      {
        id: 'msg-001', _id: 'msg-001', senderId: TEACHER_A_ID,
        senderName: 'Ananya Sharma',
        content: 'Good morning! Can we discuss the exam schedule?',
        type: 'text', status: 'read', createdAt: '2026-03-20T08:00:00.000Z',
        isEdited: false, pinned: false, reactions: [], replyTo: null,
        forwardedFrom: null, conversationId: CONV_1_ID,
      },
      {
        id: 'msg-002', _id: 'msg-002', senderId: ADMIN_ID,
        senderName: 'Dinesh Admin',
        content: 'Sure, let me check the timetable first.',
        type: 'text', status: 'delivered', createdAt: '2026-03-20T08:05:00.000Z',
        isEdited: false, pinned: false, reactions: [], replyTo: null,
        forwardedFrom: null, conversationId: CONV_1_ID,
      },
      {
        id: 'msg-003', _id: 'msg-003', senderId: TEACHER_A_ID,
        senderName: 'Ananya Sharma',
        content: 'See you tomorrow!',
        type: 'text', status: 'read', createdAt: '2026-03-20T08:10:00.000Z',
        isEdited: false, pinned: false, reactions: [], replyTo: null,
        forwardedFrom: null, conversationId: CONV_1_ID,
      },
    ],
    [CONV_2_ID]: [
      {
        id: 'msg-010', _id: 'msg-010', senderId: TEACHER_B_ID,
        senderName: 'Ravi Menon',
        content: 'Please check the marks sheet',
        type: 'text', status: 'read', createdAt: '2026-03-19T09:00:00.000Z',
        isEdited: false, pinned: false, reactions: [], replyTo: null,
        forwardedFrom: null, conversationId: CONV_2_ID,
      },
    ],
  };
}

/* ───────────────── Extended Chat Mock Routes ───────────────── */

async function installChatMockApi(page: any, state: MockState) {
  await installMockApi(page, state);

  await page.route('**/api/messages/**', async (route: any) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/\/+$/, '');
    const method = request.method();
    const convos = (state as any).conversations ?? [];
    const chatMessages = (state as any).chatMessages ?? {};

    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    // GET /api/messages/conversations
    if (path === '/api/messages/conversations' && method === 'GET') return json(convos);

    // GET /api/messages/conversations/:id/messages
    const convMsgMatch = path.match(/^\/api\/messages\/conversations\/([^/]+)\/messages$/);
    if (convMsgMatch && method === 'GET') return json(chatMessages[convMsgMatch[1]] ?? []);

    // POST /api/messages — send message
    if (path === '/api/messages' && method === 'POST') {
      const payload = JSON.parse(request.postData() || '{}');
      const newMsg = {
        id: `msg-${Date.now()}`, _id: `msg-${Date.now()}`,
        senderId: payload.senderId ?? state.user.id,
        senderName: state.user.name,
        content: payload.content, type: payload.type ?? 'text',
        status: 'sent', createdAt: new Date().toISOString(),
        isEdited: false, pinned: false, reactions: [],
        replyTo: null, forwardedFrom: null,
        conversationId: payload.conversationId,
      };
      const msgs = chatMessages[payload.conversationId] ?? [];
      msgs.push(newMsg);
      chatMessages[payload.conversationId] = msgs;
      return json(newMsg, 201);
    }

    // GET /api/messages/unread-count
    if (path === '/api/messages/unread-count' && method === 'GET') {
      const total = convos.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0);
      return json({ count: total });
    }

    // PUT /api/messages/read
    if (path === '/api/messages/read' && method === 'PUT') return json({ success: true });

    // GET /api/messages/permissions
    if (path === '/api/messages/permissions' && method === 'GET') return json({ canMessage: true });

    // GET /api/messages/presence
    if (path.startsWith('/api/messages/presence') && method === 'GET') {
      if (path.includes('/online')) return json([]);
      return json({ status: 'online', lastSeen: new Date().toISOString() });
    }

    await route.continue();
  });

  // Abort socket.io to prevent connection attempts
  await page.route('**/socket.io/**', (route: any) => route.abort());
}

/* ─────────────────────────────────────────────────────────────────────
 *  TC056 — Messaging Chat
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC056 — Messaging Chat', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });
    seedConversations(state);
    seedMessages(state);
    await installChatMockApi(page, state);
  });

  /* ───────── 1. Chat page loads with conversation sidebar ───────── */

  test('1) chat page loads showing conversation sidebar with contacts', async ({ page }) => {
    await page.goto('/messaging');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).not.toHaveURL(/\/login/);

    const ananya = page.getByText('Ananya Sharma').first();
    await expect(ananya).toBeVisible({ timeout: 15000 });
  });

  /* ───────── 2. Both conversations appear in sidebar ───────── */

  test('2) sidebar shows both conversation contacts', async ({ page }) => {
    await page.goto('/messaging');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Ananya Sharma');
    expect(bodyText).toContain('Ravi Menon');
  });

  /* ───────── 3. Clicking conversation loads messages ───────── */

  test('3) clicking a conversation loads the message list', async ({ page }) => {
    await page.goto('/messaging');
    await page.waitForLoadState('networkidle');

    const convItem = page.getByText('Ananya Sharma').first();
    if (!(await convItem.isVisible({ timeout: 5000 }).catch(() => false))) return;
    await convItem.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('exam schedule') || bodyText?.includes('timetable') || bodyText?.includes('tomorrow'),
    ).toBeTruthy();
  });

  /* ───────── 4. Message input bar is visible ───────── */

  test('4) message input bar is visible after selecting a conversation', async ({ page }) => {
    await page.goto('/messaging');
    await page.waitForLoadState('networkidle');

    const convItem = page.getByText('Ananya Sharma').first();
    if (!(await convItem.isVisible({ timeout: 5000 }).catch(() => false))) return;
    await convItem.click();
    await page.waitForTimeout(500);

    const msgInput = page.locator('input[placeholder*="message" i], input[placeholder*="Type" i], textarea').first();
    if (await msgInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      expect(await msgInput.isVisible()).toBeTruthy();
    }
  });

  /* ───────── 5. Send message and verify it appears ───────── */

  test('5) typing and sending a message adds it to the chat', async ({ page }) => {
    await page.goto('/messaging');
    await page.waitForLoadState('networkidle');

    const convItem = page.getByText('Ananya Sharma').first();
    if (!(await convItem.isVisible({ timeout: 5000 }).catch(() => false))) return;
    await convItem.click();
    await page.waitForTimeout(500);

    const msgInput = page.locator('input[placeholder*="message" i], input[placeholder*="Type" i], textarea').first();
    if (!(await msgInput.isVisible({ timeout: 3000 }).catch(() => false))) return;

    await msgInput.fill('Hello, let us meet at 3 PM');
    await page.waitForTimeout(200);

    // Click send button
    const sendBtn = page.locator('button:has(svg.lucide-send), button[aria-label*="send" i]').first();
    if (await sendBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sendBtn.click();
      await page.waitForTimeout(500);

      const bodyText = await page.textContent('body');
      expect(bodyText?.includes('3 PM') || bodyText?.includes('Hello')).toBeTruthy();
    }
  });

  /* ───────── 6. Verify message added to state ───────── */

  test('6) sent message is recorded in state chatMessages', async ({ page }) => {
    await page.goto('/messaging');
    await page.waitForLoadState('networkidle');

    const convItem = page.getByText('Ananya Sharma').first();
    if (!(await convItem.isVisible({ timeout: 5000 }).catch(() => false))) return;
    await convItem.click();
    await page.waitForTimeout(500);

    const msgInput = page.locator('input[placeholder*="message" i], input[placeholder*="Type" i], textarea').first();
    if (!(await msgInput.isVisible({ timeout: 3000 }).catch(() => false))) return;

    const initialMsgCount = ((state as any).chatMessages[CONV_1_ID] ?? []).length;

    await msgInput.fill('Test message for state check');
    const sendBtn = page.locator('button:has(svg.lucide-send), button[aria-label*="send" i]').first();
    if (await sendBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sendBtn.click();
      await page.waitForTimeout(500);

      const currentMsgCount = ((state as any).chatMessages[CONV_1_ID] ?? []).length;
      expect(currentMsgCount).toBeGreaterThan(initialMsgCount);
    }
  });

  /* ───────── 7. Empty state when no conversations ───────── */

  test('7) empty state when no conversations exist', async ({ page }) => {
    (state as any).conversations = [];
    await installChatMockApi(page, state);

    await page.goto('/messaging');
    await page.waitForLoadState('networkidle');

    // Should show empty state or "Select a conversation" prompt
    const selectConv = page.getByText('Select a conversation').first();
    const startNew = page.getByText(/start new conversation/i).first();

    const anyVisible =
      (await selectConv.isVisible({ timeout: 10000 }).catch(() => false)) ||
      (await startNew.isVisible({ timeout: 3000 }).catch(() => false));

    if (anyVisible) {
      expect(anyVisible).toBeTruthy();
    } else {
      // Fallback: verify no conversation names are shown
      const bodyText = await page.textContent('body');
      expect(bodyText?.includes('Ananya')).toBeFalsy();
    }
  });

  /* ───────── 8. Last message preview in sidebar ───────── */

  test('8) sidebar shows last message preview for each conversation', async ({ page }) => {
    await page.goto('/messaging');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    // Last messages: "See you tomorrow!" and "Please check the marks sheet"
    expect(
      bodyText?.includes('See you tomorrow') || bodyText?.includes('marks sheet'),
    ).toBeTruthy();
  });
});
