/**
 * @vitest-environment jsdom
 *
 * Regression tests for the unmount cleanup in useVoiceRecording.
 *
 * MEM-04: starting a recording opens a mic stream, an AudioContext, a 1s
 * duration interval and a 100ms RMS sampling interval (parked on the
 * MediaRecorder). Before the fix, navigating away mid-recording left the mic
 * hot and both intervals ticking forever, and AudioContexts accumulated until
 * the browser hit its ~6-context cap. The hook now tears all of that down on
 * unmount. These tests lock that behavior in.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useVoiceRecording } from './useVoiceRecording';

/** Populate the hook's refs to look like an in-progress recording. */
function primeRecordingState(refs) {
  const trackStop = vi.fn();
  const recorderStop = vi.fn();
  const contextClose = vi.fn(() => Promise.resolve());

  const recorder = {
    state: 'recording',
    sampleInterval: setInterval(() => {}, 100),
    stop: recorderStop,
    onstop: vi.fn(),
  };

  refs.recordingTimerRef.current = setInterval(() => {}, 1000);
  refs.animationFrameRef.current = 123;
  refs.mediaStreamRef.current = { getTracks: () => [{ stop: trackStop }] };
  refs.analyserRef.current = { frequencyBinCount: 1024 };
  refs.audioContextRef.current = { state: 'running', close: contextClose };
  refs.mediaRecorderRef.current = recorder;

  return { trackStop, recorderStop, contextClose, recorder };
}

describe('useVoiceRecording unmount cleanup (MEM-04)', () => {
  let clearIntervalSpy;
  let cancelAnimationFrameSpy;

  beforeEach(() => {
    clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    cancelAnimationFrameSpy = vi.spyOn(globalThis, 'cancelAnimationFrame');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stops the mic, clears both intervals, cancels rAF and closes the context on unmount', () => {
    const { result, unmount } = renderHook(() => useVoiceRecording());
    const { trackStop, recorderStop, contextClose, recorder } =
      primeRecordingState(result.current);
    const sampleIntervalId = recorder.sampleInterval;
    const durationIntervalId = result.current.recordingTimerRef.current;

    unmount();

    // Mic released
    expect(trackStop).toHaveBeenCalledTimes(1);
    expect(result.current.mediaStreamRef.current).toBeNull();

    // Both intervals cleared (1s duration + 100ms sampler parked on the recorder)
    expect(clearIntervalSpy).toHaveBeenCalledWith(durationIntervalId);
    expect(clearIntervalSpy).toHaveBeenCalledWith(sampleIntervalId);
    expect(result.current.recordingTimerRef.current).toBeNull();

    // Animation frame cancelled
    expect(cancelAnimationFrameSpy).toHaveBeenCalledWith(123);
    expect(result.current.animationFrameRef.current).toBeNull();

    // Recorder stopped, its onstop detached so it can't setState post-unmount
    expect(recorderStop).toHaveBeenCalledTimes(1);
    expect(recorder.onstop).toBeNull();
    expect(result.current.mediaRecorderRef.current).toBeNull();

    // AudioContext closed exactly once and the ref released
    expect(contextClose).toHaveBeenCalledTimes(1);
    expect(result.current.audioContextRef.current).toBeNull();
  });

  it('does not re-close an already-closed AudioContext', () => {
    const { result, unmount } = renderHook(() => useVoiceRecording());
    const { contextClose } = primeRecordingState(result.current);
    result.current.audioContextRef.current = { state: 'closed', close: contextClose };

    unmount();

    expect(contextClose).not.toHaveBeenCalled();
  });

  it('is a harmless no-op when no recording is in progress', () => {
    const { unmount } = renderHook(() => useVoiceRecording());
    expect(() => unmount()).not.toThrow();
  });
});
