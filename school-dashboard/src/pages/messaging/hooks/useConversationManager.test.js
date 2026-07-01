/**
 * @vitest-environment jsdom
 *
 * Regression tests for the chat history pagination in useConversationManager.
 *
 * PAG-06: the backend implements a `before` cursor but the hook used to call
 * getMessages with no cursor and had no way to load older pages. These tests
 * lock in that selecting a conversation seeds the cursor and that
 * loadOlderMessages prepends the older page, stops at the start of the
 * conversation, and never double-fetches.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../../utils/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { useConversationManager } from './useConversationManager';

const buildChatService = (pages) => {
  let callIndex = 0;
  return {
    getMessages: vi.fn(async (_conversationId, _limit, before) => {
      const page = pages[Math.min(callIndex, pages.length - 1)];
      callIndex += 1;
      if (before == null) return page.initial;
      if (page.olderByBefore[before]) return page.olderByBefore[before];
      return [];
    }),
    getConversations: vi.fn(async () => []),
    createConversation: vi.fn(),
    markAsRead: vi.fn(),
  };
};

const buildProps = ({ pages = [], user = { id: 'user-1' }, staff = [], students = [] } = {}) => {
  const chatService = buildChatService(pages);
  const socketService = {
    isConnected: () => false,
    joinConversation: vi.fn(),
    markAsRead: vi.fn(),
  };
  const setMessages = vi.fn();
  const setOnlineUsers = vi.fn();
  const scrollToBottom = vi.fn();
  const setShowMessageSearch = vi.fn();
  return {
    props: {
      chatService,
      socketService,
      user,
      staff,
      students,
      setMessages,
      setOnlineUsers,
      scrollToBottom,
      setShowMessageSearch,
    },
    chatService,
  };
};

describe('useConversationManager — PAG-06 infinite scroll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('seeds the oldest cursor and reports hasMoreOlder=true when the first page is full', async () => {
    const initial = Array.from({ length: 50 }, (_, i) => ({
      _id: `m-${i}`,
      createdAt: new Date(2026, 0, 1, 0, i).toISOString(),
      content: `msg-${i}`,
    }));
    const { props, chatService } = buildProps({
      pages: [{ initial, olderByBefore: {} }],
    });

    const { result } = renderHook(() => useConversationManager(props));

    await act(async () => {
      await result.current.handleSelectConversation({ id: 'conv-1' });
    });

    await waitFor(() => expect(chatService.getMessages).toHaveBeenCalledTimes(1));
    expect(chatService.getMessages).toHaveBeenLastCalledWith('conv-1', 50, null);
    expect(result.current.hasMoreOlder).toBe(true);
    expect(result.current.loadingOlder).toBe(false);
  });

  it('reports hasMoreOlder=false when the first page is short', async () => {
    const initial = [{ _id: 'm-1', createdAt: new Date('2026-01-01T00:00:00Z').toISOString(), content: 'only' }];
    const { props } = buildProps({ pages: [{ initial, olderByBefore: {} }] });

    const { result } = renderHook(() => useConversationManager(props));

    await act(async () => {
      await result.current.handleSelectConversation({ id: 'conv-1' });
    });

    expect(result.current.hasMoreOlder).toBe(false);
  });

  it('loadOlderMessages fetches the next page using the oldest cursor', async () => {
    const initial = Array.from({ length: 50 }, (_, i) => ({
      _id: `m-${i}`,
      createdAt: new Date(2026, 0, 1, 0, i).toISOString(),
      content: `msg-${i}`,
    }));
    const olderPage = Array.from({ length: 50 }, (_, i) => ({
      _id: `older-${i}`,
      createdAt: new Date(2025, 11, 31, 23, 59 - i).toISOString(),
      content: `old-${i}`,
    }));
    const olderByBefore = {
      [initial[0].createdAt]: olderPage,
    };
    const { props, chatService } = buildProps({
      pages: [{ initial, olderByBefore }],
    });

    const { result } = renderHook(() => useConversationManager(props));

    await act(async () => {
      await result.current.handleSelectConversation({ id: 'conv-1' });
    });
    expect(result.current.hasMoreOlder).toBe(true);

    await act(async () => {
      await result.current.loadOlderMessages();
    });

    // First call: initial page (no cursor). Second call: older page with cursor.
    expect(chatService.getMessages).toHaveBeenCalledTimes(2);
    expect(chatService.getMessages.mock.calls[1]).toEqual([
      'conv-1',
      50,
      initial[0].createdAt,
    ]);
    // hasMoreOlder stays true when the older page was also a full page
    expect(result.current.hasMoreOlder).toBe(true);
    expect(result.current.loadingOlder).toBe(false);
  });

  it('flips hasMoreOlder to false when the older page returns fewer than the page size', async () => {
    const initial = Array.from({ length: 50 }, (_, i) => ({
      _id: `m-${i}`,
      createdAt: new Date(2026, 0, 1, 0, i).toISOString(),
      content: `msg-${i}`,
    }));
    const olderPage = [
      { _id: 'tail-1', createdAt: new Date('2025-12-31T23:59:00Z').toISOString(), content: 'tail-1' },
    ];
    const { props, chatService } = buildProps({
      pages: [{ initial, olderByBefore: { [initial[0].createdAt]: olderPage } }],
    });

    const { result } = renderHook(() => useConversationManager(props));

    await act(async () => {
      await result.current.handleSelectConversation({ id: 'conv-1' });
    });

    await act(async () => {
      await result.current.loadOlderMessages();
    });

    expect(chatService.getMessages).toHaveBeenCalledTimes(2);
    expect(result.current.hasMoreOlder).toBe(false);
  });

  it('does not double-fetch when loadOlderMessages is fired while one is already in flight', async () => {
    const initial = Array.from({ length: 50 }, (_, i) => ({
      _id: `m-${i}`,
      createdAt: new Date(2026, 0, 1, 0, i).toISOString(),
      content: `msg-${i}`,
    }));
    let resolveFetch;
    const inflight = new Promise((resolve) => { resolveFetch = resolve; });
    const chatService = {
      getMessages: vi.fn().mockImplementationOnce(async () => initial).mockImplementationOnce(() => inflight),
      getConversations: vi.fn(async () => []),
      createConversation: vi.fn(),
      markAsRead: vi.fn(),
    };
    const props = {
      chatService,
      socketService: { isConnected: () => false, joinConversation: vi.fn(), markAsRead: vi.fn() },
      user: { id: 'user-1' },
      staff: [],
      students: [],
      setMessages: vi.fn(),
      setOnlineUsers: vi.fn(),
      scrollToBottom: vi.fn(),
      setShowMessageSearch: vi.fn(),
    };

    const { result } = renderHook(() => useConversationManager(props));

    await act(async () => {
      await result.current.handleSelectConversation({ id: 'conv-1' });
    });

    // Fire two loads back-to-back without awaiting the first
    let first;
    let second;
    act(() => { first = result.current.loadOlderMessages(); });
    act(() => { second = result.current.loadOlderMessages(); });

    await act(async () => {
      resolveFetch([]);
      await Promise.all([first, second]);
    });

    expect(chatService.getMessages).toHaveBeenCalledTimes(2); // initial + one older fetch
  });

  it('loadOlderMessages is a no-op when no conversation is selected', async () => {
    const { props, chatService } = buildProps({ pages: [{ initial: [], olderByBefore: {} }] });
    const { result } = renderHook(() => useConversationManager(props));

    await act(async () => {
      await result.current.loadOlderMessages();
    });

    expect(chatService.getMessages).not.toHaveBeenCalled();
  });
});
