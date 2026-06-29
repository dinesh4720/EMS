/**
 * @vitest-environment jsdom
 *
 * Regression tests for VideoCallModal.
 *
 * MEM-01: the modal acquires a camera + mic stream on accept but previously
 * only stopped the tracks from the End button. Closing via Esc / backdrop (or
 * navigating away) just unmounts the modal, which left the MediaStream
 * recording with no UI left to stop it. These tests lock in the unmount
 * cleanup that stops every captured track.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

vi.mock('../../../utils/logger', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// Render HeroUI primitives as lightweight DOM so we can drive the modal in
// jsdom without portals; Modal honors isOpen, Button forwards onClick/aria.
vi.mock('@heroui/react', () => ({
  Modal: ({ isOpen, children }) => (isOpen ? <div data-testid="modal">{children}</div> : null),
  ModalContent: ({ children }) => <div>{children}</div>,
  ModalHeader: ({ children }) => <div>{children}</div>,
  ModalBody: ({ children }) => <div>{children}</div>,
  Button: ({ children, onClick, 'aria-label': ariaLabel }) => (
    <button type="button" aria-label={ariaLabel} onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock('lucide-react', () => ({
  Phone: () => null,
  PhoneOff: () => null,
  Mic: () => null,
  MicOff: () => null,
  Video: () => null,
  VideoOff: () => null,
  Monitor: () => null,
  Speaker: () => null,
}));

import VideoCallModal from './VideoCallModal';

function buildFakeStream() {
  const videoTrack = { kind: 'video', enabled: true, stop: vi.fn() };
  const audioTrack = { kind: 'audio', enabled: true, stop: vi.fn() };
  return {
    videoTrack,
    audioTrack,
    getTracks: () => [videoTrack, audioTrack],
    getAudioTracks: () => [audioTrack],
    getVideoTracks: () => [videoTrack],
  };
}

describe('VideoCallModal — MEM-01 media cleanup', () => {
  let fakeStream;

  beforeEach(() => {
    fakeStream = buildFakeStream();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue(fakeStream) },
    });
  });

  afterEach(() => {
    delete navigator.mediaDevices;
    vi.clearAllMocks();
  });

  it('stops every captured track when the modal unmounts (Esc/backdrop close)', async () => {
    const onAccept = vi.fn();
    const { unmount } = render(
      <VideoCallModal
        isOpen
        onClose={vi.fn()}
        call={{ callId: 'c1', callType: 'video', status: 'incoming', callerName: 'Bob' }}
        currentUser={{ id: 'u1' }}
        onAccept={onAccept}
        onReject={vi.fn()}
        onEnd={vi.fn()}
      />
    );

    // Accept the call → acquires the camera + mic stream.
    fireEvent.click(screen.getByLabelText('Accept call'));
    await waitFor(() => expect(onAccept).toHaveBeenCalledWith('c1'));
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();

    // Esc / backdrop close just unmounts the modal — no End button involved.
    unmount();

    expect(fakeStream.videoTrack.stop).toHaveBeenCalledTimes(1);
    expect(fakeStream.audioTrack.stop).toHaveBeenCalledTimes(1);
  });
});
