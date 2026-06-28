/**
 * @vitest-environment jsdom
 *
 * Regression test for MEM-05: the AI assistant microphone stays on if the user
 * navigates away while recording.
 *
 * Previously the MediaRecorder and the underlying getUserMedia tracks were only
 * stopped inside `mediaRecorder.onstop`, which fires solely from the Stop button.
 * If the component unmounted mid-recording (the user navigated away), nothing
 * called stop(), so the recorder and the mic tracks survived unmount — a hot-mic
 * leak. The fix adds an unmount cleanup effect that stops the recorder and
 * releases the media stream tracks.
 *
 * This test drives the mic toggle to start a recording, then unmounts the page
 * and asserts the recorder is stopped, the stream tracks are released, and no
 * transcription request is fired for the abandoned recording.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';

// i18n — identity translator so labels are predictable.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

// Toasts are fire-and-forget side effects; stub them out.
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

// Logger is a thin console wrapper.
vi.mock('../utils/logger', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// Heavy/canvas children are irrelevant to the mic lifecycle.
vi.mock('../components/Antigravity', () => ({ default: () => null }));
vi.mock('../components/AiAssistant/ModelSelector', () => ({ default: () => null }));

// AiAssistant panel context — no surrounding panel in this test.
vi.mock('../components/AiAssistant/AiAssistantPanel', () => ({
  useAiAssistant: () => ({ closePanel: undefined }),
}));

// Minimal ChatComposer that exposes the record toggle so we can start a recording.
vi.mock('../components/AiAssistant/ChatComposer', () => ({
  default: React.forwardRef(function MockChatComposer({ onToggleRecording, isRecording }, _ref) {
    return (
      <button type="button" aria-label="mic" onClick={onToggleRecording}>
        {isRecording ? 'stop' : 'record'}
      </button>
    );
  }),
}));

vi.mock('../services/aiService', () => ({
  aiService: {
    getPrebuiltPrompts: () => [],
    getAvailableModels: vi.fn().mockResolvedValue([]),
    getDefaultModelId: () => '',
    transcribeAudio: vi.fn(),
    sendMessage: vi.fn(),
  },
}));

import { aiService } from '../services/aiService';
import AiAssistantPage from './AiAssistantPage';

// Fake MediaRecorder capturing instances and lifecycle.
class FakeMediaRecorder {
  constructor(stream) {
    this.stream = stream;
    this.state = 'inactive';
    this.ondataavailable = null;
    this.onstop = null;
    FakeMediaRecorder.instances.push(this);
  }
  start() {
    this.state = 'recording';
  }
  stop() {
    this.state = 'inactive';
    if (this.onstop) this.onstop();
  }
}
FakeMediaRecorder.instances = [];

let tracks;

beforeEach(() => {
  FakeMediaRecorder.instances = [];
  aiService.transcribeAudio.mockReset();

  tracks = [{ stop: vi.fn() }];
  const stream = { getTracks: () => tracks };

  Object.defineProperty(globalThis.navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: vi.fn().mockResolvedValue(stream) },
  });
  globalThis.MediaRecorder = FakeMediaRecorder;
});

afterEach(() => {
  cleanup();
  delete globalThis.MediaRecorder;
});

describe('AiAssistantPage microphone lifecycle (MEM-05)', () => {
  it('releases the microphone and stops the recorder when unmounted mid-recording', async () => {
    const { unmount } = render(<AiAssistantPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'mic' }));

    // Wait until recording has actually started.
    await waitFor(() => {
      expect(FakeMediaRecorder.instances).toHaveLength(1);
      expect(FakeMediaRecorder.instances[0].state).toBe('recording');
    });

    const recorder = FakeMediaRecorder.instances[0];
    // Mic is hot — tracks not yet released while recording.
    expect(tracks[0].stop).not.toHaveBeenCalled();

    // User navigates away.
    unmount();

    expect(recorder.state).toBe('inactive');
    expect(tracks[0].stop).toHaveBeenCalledTimes(1);
    // No transcription should be triggered for a recording abandoned by navigating away.
    expect(aiService.transcribeAudio).not.toHaveBeenCalled();
  });
});
