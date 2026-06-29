/**
 * @vitest-environment jsdom
 *
 * Regression tests for useChatVideoCall.
 *
 * MEM-01: closing the video-call modal via Esc / backdrop is wired to
 * closeVideoCall (not the End button), which previously only flipped state and
 * left the videoCallService media stream + peer connection live. These tests
 * lock in that closeVideoCall now tears the active call down in the service.
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

vi.mock('../../../services/videoCallService', () => ({
  default: {
    initialize: vi.fn(async () => 'peer-1'),
    startCall: vi.fn(async () => ({})),
    acceptCall: vi.fn(async () => ({})),
    rejectCall: vi.fn(),
    endCall: vi.fn(),
    // The hook subscribes to service events in a useEffect on mount; without
    // these the mounted hook throws "default.on is not a function".
    on: vi.fn(),
    off: vi.fn(),
  },
}));

import { useChatVideoCall } from './useChatVideoCall';
import videoCallService from '../../../services/videoCallService';

const buildProps = () => ({
  user: { id: 'user-1', name: 'Alice' },
  selectedConversation: {
    otherParticipant: { userId: 'user-2', userType: 'staff', name: 'Bob' },
  },
});

describe('useChatVideoCall — MEM-01 close releases media', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ends the active call in the service when closed via Esc/backdrop', async () => {
    const { result } = renderHook(() => useChatVideoCall(buildProps()));

    await act(async () => {
      await result.current.handleVideoCall('video');
    });
    expect(result.current.showVideoCall).toBe(true);
    expect(result.current.activeCall?.callId).toBe('call-123');

    act(() => {
      result.current.closeVideoCall();
    });

    // The media stream + peer connection are released, not just hidden.
    expect(videoCallService.endCall).toHaveBeenCalledWith('call-123');
    expect(result.current.showVideoCall).toBe(false);
    expect(result.current.activeCall).toBeNull();
  });

  it('does not call endCall when there is no active call', () => {
    const { result } = renderHook(() => useChatVideoCall(buildProps()));

    act(() => {
      result.current.closeVideoCall();
    });

    expect(videoCallService.endCall).not.toHaveBeenCalled();
    expect(result.current.showVideoCall).toBe(false);
    expect(result.current.activeCall).toBeNull();
  });
});
