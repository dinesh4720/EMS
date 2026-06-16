/**
 * @vitest-environment jsdom
 *
 * Regression tests for the socket reconnect logic in useSocketListeners.
 *
 * PAG-33: chat keeps messages in bare useState and only patches them via
 * socket events, so any message that arrived while the socket was down is
 * never seen by the client. The fix refetches the open conversation's
 * history from the server as soon as the socket authenticates again after
 * a disconnect. These tests lock in that behavior.
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

import { useSocketListeners } from './useSocketListeners';

const buildSocketService = () => {
  const handlers = new Map();
  return {
    isConnected: vi.fn(() => true),
    on: vi.fn((event, handler) => handlers.set(event, handler)),
    off: vi.fn((event) => handlers.delete(event)),
    joinConversation: vi.fn(),
    markAsRead: vi.fn(),
    handlers,
  };
};

const buildChatService = (messages) => ({
  getMessages: vi.fn(async () => messages),
});

const buildProps = (overrides = {}) => {
  const selectedConversationRef = { current: { id: 'conv-1' } };
  const setMessages = vi.fn();
  const setConversations = vi.fn();
  const setPinnedMessages = vi.fn();
  const scrollToBottom = vi.fn();

  return {
    socketService: buildSocketService(),
    chatService: buildChatService([{ id: 'm-1', content: 'hi' }]),
    user: { id: 'user-1' },
    selectedConversationRef,
    setMessages,
    setConversations,
    setPinnedMessages,
    onNewMessageReceived: vi.fn(),
    scrollToBottom,
    pendingSocketMessagesRef: { current: new Set() },
    ...overrides,
  };
};

describe('useSocketListeners — PAG-33 reconnect back-fill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('refetches the open conversation when the socket re-authenticates after a disconnect', async () => {
    const props = buildProps();
    const { result } = renderHook(() => useSocketListeners(props));

    act(() => {
      result.current.setupSocketListeners();
    });

    // First, simulate the socket going down.
    act(() => {
      props.socketService.handlers.get('disconnected')();
    });

    // Then the server confirms the reconnect.
    act(() => {
      props.socketService.handlers.get('authenticated')();
    });

    await waitFor(() => {
      expect(props.chatService.getMessages).toHaveBeenCalledWith('conv-1');
    });
    expect(props.setMessages).toHaveBeenCalledWith([{ id: 'm-1', content: 'hi' }]);
    expect(props.socketService.joinConversation).toHaveBeenCalledWith('conv-1');
    expect(props.socketService.markAsRead).toHaveBeenCalledWith(null, 'conv-1');
    expect(props.scrollToBottom).toHaveBeenCalled();
  });

  it('does NOT refetch on the very first authenticated event (no prior disconnect)', () => {
    const props = buildProps();
    const { result } = renderHook(() => useSocketListeners(props));

    act(() => {
      result.current.setupSocketListeners();
    });

    act(() => {
      props.socketService.handlers.get('authenticated')();
    });

    expect(props.chatService.getMessages).not.toHaveBeenCalled();
    expect(props.setMessages).not.toHaveBeenCalled();
  });

  it('does nothing on reconnect when no conversation is open', () => {
    const props = buildProps({
      selectedConversationRef: { current: null },
    });
    const { result } = renderHook(() => useSocketListeners(props));

    act(() => {
      result.current.setupSocketListeners();
    });

    act(() => {
      props.socketService.handlers.get('disconnected')();
    });
    act(() => {
      props.socketService.handlers.get('authenticated')();
    });

    expect(props.chatService.getMessages).not.toHaveBeenCalled();
    expect(props.setMessages).not.toHaveBeenCalled();
  });

  it('does not throw if chatService is unavailable', () => {
    const props = buildProps({ chatService: undefined });
    const { result } = renderHook(() => useSocketListeners(props));

    act(() => {
      result.current.setupSocketListeners();
    });

    act(() => {
      props.socketService.handlers.get('disconnected')();
    });

    expect(() => {
      act(() => {
        props.socketService.handlers.get('authenticated')();
      });
    }).not.toThrow();

    expect(props.setMessages).not.toHaveBeenCalled();
  });

  it('tears down every listener it registered', () => {
    const props = buildProps();
    const { result } = renderHook(() => useSocketListeners(props));

    let cleanup;
    act(() => {
      cleanup = result.current.setupSocketListeners();
    });

    const eventCount = props.socketService.handlers.size;
    expect(eventCount).toBeGreaterThan(0);

    act(() => {
      cleanup();
    });

    expect(props.socketService.off).toHaveBeenCalledTimes(eventCount);
  });
});
