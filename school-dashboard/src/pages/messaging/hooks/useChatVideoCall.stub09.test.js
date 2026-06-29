// @vitest-environment jsdom
/**
 * Regression tests for STUB-09: the video-call service emits
 * remoteStream / incomingCall / callAccepted events, but nothing
 * subscribed — so remote video stayed black, the caller's status never
 * advanced past 'initiated', and incoming calls never opened the modal.
 *
 * These tests lock in that the hook now subscribes to those events and
 * drives the modal state machine accordingly.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

vi.mock('../../../utils/logger', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../../services/api', () => ({
  callsApi: {
    initiate: vi.fn(async () => ({ _id: 'call-123' })),
    accept: vi.fn(async () => ({})),
    reject: vi.fn(async () => ({})),
    end: vi.fn(async () => ({})),
  },
}));

// vi.hoisted runs before vi.mock's factory invocation, so the mock singleton
// is initialized by the time the factory runs. The returned object is also
// reachable from the test body for emitting events and asserting on calls.
const { mockService, listeners } = vi.hoisted(() => {
  const listeners = new Map();
  const mockService = {
    initialize: vi.fn(async () => 'peer-1'),
    startCall: vi.fn(async () => ({})),
    acceptCall: vi.fn(async () => ({})),
    rejectCall: vi.fn(),
    endCall: vi.fn(),
    localStream: null,
    on: vi.fn((event, cb) => {
      if (!listeners.has(event)) listeners.set(event, []);
      listeners.get(event).push(cb);
    }),
    off: vi.fn((event, cb) => {
      if (!listeners.has(event)) return;
      listeners.set(event, listeners.get(event).filter(fn => fn !== cb));
    }),
    emit: (event, payload) => {
      (listeners.get(event) || []).forEach(cb => cb(payload));
    },
  };
  return { mockService, listeners };
});

vi.mock('../../../services/videoCallService', () => ({
  default: mockService,
}));

import { useChatVideoCall } from './useChatVideoCall';

const buildProps = (overrides = {}) => ({
  user: { id: 'user-1', name: 'Alice' },
  selectedConversation: {
    otherParticipant: { userId: 'user-2', userType: 'staff', name: 'Bob' },
  },
  ...overrides,
});

describe('useChatVideoCall — STUB-09 event subscription', () => {
  beforeEach(() => {
    listeners.clear();
    mockService.on.mockClear();
    mockService.off.mockClear();
    mockService.endCall.mockClear();
    mockService.localStream = null;
  });

  it('subscribes to incomingCall/remoteStream/callAccepted/callEnded/callClosed/callError on mount', () => {
    renderHook(() => useChatVideoCall(buildProps()));

    const subscribed = mockService.on.mock.calls.map(c => c[0]);
    expect(subscribed).toEqual(expect.arrayContaining([
      'incomingCall',
      'remoteStream',
      'callAccepted',
      'callEnded',
      'callClosed',
      'callError',
    ]));
  });

  it('unsubscribes on unmount so listeners do not leak', () => {
    const { unmount } = renderHook(() => useChatVideoCall(buildProps()));
    const subscribedCount = mockService.on.mock.calls.length;

    unmount();

    expect(mockService.off.mock.calls.length).toBe(subscribedCount);
    mockService.off.mock.calls.forEach(([event, cb], i) => {
      expect(mockService.on.mock.calls[i][0]).toBe(event);
      expect(mockService.on.mock.calls[i][1]).toBe(cb);
    });
  });

  it('opens the modal with status "incoming" when an incomingCall event fires', () => {
    const { result } = renderHook(() => useChatVideoCall(buildProps()));

    act(() => {
      mockService.emit('incomingCall', {
        callId: 'call-xyz',
        callerId: 'user-2',
        metadata: { callerName: 'Bob', callType: 'video' },
      });
    });

    expect(result.current.showVideoCall).toBe(true);
    expect(result.current.activeCall).toMatchObject({
      callId: 'call-xyz',
      callerId: 'user-2',
      callerName: 'Bob',
      callType: 'video',
      status: 'incoming',
    });
  });

  it('flips status to "connected" and stores the remote stream when remoteStream fires', async () => {
    const { result } = renderHook(() => useChatVideoCall(buildProps()));

    await act(async () => {
      await result.current.handleVideoCall('video');
    });
    expect(result.current.activeCall.status).toBe('initiated');

    const fakeStream = { id: 'remote' };
    act(() => {
      mockService.emit('remoteStream', { stream: fakeStream, peerId: 'user-2' });
    });

    expect(result.current.remoteStream).toBe(fakeStream);
    expect(result.current.activeCall.status).toBe('connected');
  });

  it('flips status to "connected" when a callAccepted event fires for the active call', async () => {
    const { result } = renderHook(() => useChatVideoCall(buildProps()));

    await act(async () => {
      await result.current.handleVideoCall('video');
    });

    act(() => {
      mockService.emit('callAccepted', { callId: 'call-123' });
    });

    expect(result.current.activeCall.status).toBe('connected');
  });

  it('ignores callAccepted for a different callId', async () => {
    const { result } = renderHook(() => useChatVideoCall(buildProps()));

    await act(async () => {
      await result.current.handleVideoCall('video');
    });

    act(() => {
      mockService.emit('callAccepted', { callId: 'someone-else' });
    });

    expect(result.current.activeCall.status).toBe('initiated');
  });

  it('closes the modal and clears streams when the remote side closes the call', async () => {
    const { result } = renderHook(() => useChatVideoCall(buildProps()));

    await act(async () => {
      await result.current.handleVideoCall('video');
    });
    act(() => {
      mockService.emit('remoteStream', { stream: { id: 'remote' }, peerId: 'user-2' });
    });
    expect(result.current.showVideoCall).toBe(true);

    act(() => {
      mockService.emit('callClosed', { peerId: 'user-2' });
    });

    expect(result.current.showVideoCall).toBe(false);
    expect(result.current.activeCall).toBeNull();
    expect(result.current.remoteStream).toBeNull();
    expect(mockService.endCall).toHaveBeenCalledWith('call-123');
  });

  it('tears down on callError', async () => {
    const { result } = renderHook(() => useChatVideoCall(buildProps()));

    await act(async () => {
      await result.current.handleVideoCall('video');
    });

    act(() => {
      mockService.emit('callError', new Error('peer disconnected'));
    });

    expect(result.current.showVideoCall).toBe(false);
    expect(result.current.activeCall).toBeNull();
    expect(mockService.endCall).toHaveBeenCalledWith('call-123');
  });

  it("surfaces the caller's acquired localStream so the modal can show a preview", async () => {
    const fakeLocal = { id: 'local' };
    mockService.localStream = fakeLocal;

    const { result } = renderHook(() => useChatVideoCall(buildProps()));

    await act(async () => {
      await result.current.handleVideoCall('video');
    });

    expect(result.current.localStream).toBe(fakeLocal);
    // The caller name is forwarded so the callee can render it later.
    expect(mockService.startCall).toHaveBeenCalledWith(
      'user-2',
      expect.objectContaining({ callerName: 'Alice' })
    );
  });
});
