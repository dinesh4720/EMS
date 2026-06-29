/**
 * @vitest-environment jsdom
 *
 * Regression coverage for MEM-11: handleStartRecording must guard against a
 * double-trigger. Because setIsRecording(true) only runs after the async
 * getUserMedia await resolves, a state-only guard leaves a window in which a
 * rapid second trigger starts a second recorder and orphans the first one's
 * MediaStream / AudioContext / interval timers. A synchronous ref guard closes
 * that window. These tests exercise that guard end-to-end.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVoiceMessageHandler } from './useVoiceMessageHandler';

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_k, fallback) => fallback ?? _k }) }));
vi.mock('../../../utils/logger', () => ({
  default: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

// ---- Web Audio / MediaRecorder mocks --------------------------------------

let mediaRecorderInstances = [];

class MockAudioContext {
  constructor() {
    this.createAnalyser = vi.fn(() => ({
      fftSize: 0,
      smoothingTimeConstant: 0,
      frequencyBinCount: 1024,
      getByteTimeDomainData: vi.fn(),
    }));
    this.createMediaStreamSource = vi.fn(() => ({ connect: vi.fn() }));
    this.close = vi.fn();
  }
}

class MockMediaRecorder {
  constructor(stream) {
    this.stream = stream;
    this.state = 'inactive';
    this.ondataavailable = null;
    this.onstop = null;
    this.start = vi.fn(() => { this.state = 'recording'; });
    this.stop = vi.fn(() => { this.state = 'inactive'; });
    mediaRecorderInstances.push(this);
  }
}

function makeStream() {
  return { getTracks: () => [{ stop: vi.fn() }] };
}

// Promise we can resolve/reject from the test to control the getUserMedia gap.
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

// Minimal voiceRecordingState double — plain setters + ref objects.
function makeVoiceRecordingState(overrides = {}) {
  return {
    voicePreview: null,
    setVoicePreview: vi.fn(),
    setLiveWaveform: vi.fn(),
    setIsRecording: vi.fn(),
    setRecordingDuration: vi.fn(),
    mediaRecorder: null,
    setMediaRecorder: vi.fn(),
    setRecordedChunks: vi.fn(),
    recordingTimerRef: { current: null },
    mediaStreamRef: { current: null },
    analyserRef: { current: null },
    audioContextRef: { current: null },
    animationFrameRef: { current: null },
    recordingDurationRef: { current: 0 },
    ...overrides,
  };
}

function renderHandler(voiceRecordingState) {
  return renderHook(() =>
    useVoiceMessageHandler({
      user: { id: 'u1', name: 'Tester' },
      selectedConversation: null,
      voiceRecordingState,
      chatService: { uploadFile: vi.fn(), sendMessage: vi.fn() },
      socketService: { isConnected: () => false, sendMessage: vi.fn() },
      setMessages: vi.fn(),
      setSending: vi.fn(),
      setUploadingFile: vi.fn(),
      setUploadProgress: vi.fn(),
      scrollToBottom: vi.fn(),
      loadConversations: vi.fn(),
      pendingSocketMessagesRef: { current: new Set() },
    }),
  );
}

let getUserMedia;

beforeEach(() => {
  vi.useFakeTimers();
  mediaRecorderInstances = [];
  getUserMedia = vi.fn();

  Object.defineProperty(navigator, 'mediaDevices', {
    value: { getUserMedia },
    configurable: true,
    writable: true,
  });
  window.AudioContext = MockAudioContext;
  global.MediaRecorder = MockMediaRecorder;
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('useVoiceMessageHandler — handleStartRecording double-trigger guard (MEM-11)', () => {
  it('acquires only one media stream when triggered twice before the first resolves', async () => {
    const pending = deferred();
    getUserMedia.mockReturnValue(pending.promise);

    const state = makeVoiceRecordingState();
    const { result } = renderHandler(state);

    // Fire twice synchronously, while the first getUserMedia is still pending.
    await act(async () => {
      result.current.handleStartRecording();
      result.current.handleStartRecording();
    });

    // The synchronous ref guard rejects the second call before it can request
    // a second microphone stream.
    expect(getUserMedia).toHaveBeenCalledTimes(1);

    // Let the first call complete so it builds exactly one recorder.
    await act(async () => {
      pending.resolve(makeStream());
      await Promise.resolve();
    });
    expect(mediaRecorderInstances).toHaveLength(1);
  });

  it('releases the guard when the recording stops, allowing a new recording', async () => {
    getUserMedia.mockResolvedValue(makeStream());

    const state = makeVoiceRecordingState();
    const { result } = renderHandler(state);

    await act(async () => {
      await result.current.handleStartRecording();
    });
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(mediaRecorderInstances).toHaveLength(1);

    // Simulate the recorder stopping — onstop is what releases the guard.
    await act(async () => {
      await mediaRecorderInstances[0].onstop();
    });
    expect(state.setIsRecording).toHaveBeenCalledWith(false);

    // A fresh trigger is now allowed and acquires a new stream.
    await act(async () => {
      await result.current.handleStartRecording();
    });
    expect(getUserMedia).toHaveBeenCalledTimes(2);
    expect(mediaRecorderInstances).toHaveLength(2);
  });

  it('releases the guard when the start attempt fails, allowing a retry', async () => {
    getUserMedia.mockRejectedValueOnce(new Error('Permission denied'));

    const state = makeVoiceRecordingState();
    const { result } = renderHandler(state);

    await act(async () => {
      await result.current.handleStartRecording();
    });
    // Failed start created no recorder...
    expect(mediaRecorderInstances).toHaveLength(0);

    // ...and the guard is released, so a retry can acquire a stream.
    getUserMedia.mockResolvedValueOnce(makeStream());
    await act(async () => {
      await result.current.handleStartRecording();
    });
    expect(getUserMedia).toHaveBeenCalledTimes(2);
    expect(mediaRecorderInstances).toHaveLength(1);
  });
});
