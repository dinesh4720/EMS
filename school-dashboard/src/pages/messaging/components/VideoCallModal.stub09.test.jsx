/**
 * @vitest-environment jsdom
 *
 * Regression tests for STUB-09: VideoCallModal now renders the caller's
 * "initiated" state (which was previously a blank modal because the modal
 * only handled 'incoming' and 'connected') and accepts the remote/local
 * streams as props sourced from the PeerJS service.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

vi.mock('../../../utils/logger', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

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

describe('VideoCallModal — STUB-09 initiated state and stream props', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a "Calling..." screen for the initiated status instead of a blank modal', () => {
    render(
      <VideoCallModal
        isOpen
        onClose={vi.fn()}
        call={{
          callId: 'c1',
          callType: 'video',
          status: 'initiated',
          remoteUserName: 'Bob',
        }}
        currentUser={{ id: 'u1' }}
        onAccept={vi.fn()}
        onReject={vi.fn()}
        onEnd={vi.fn()}
      />
    );

    // Header shows "Calling..." (previously rendered just "Call" with a blank body).
    expect(screen.getByText('Calling...')).toBeInTheDocument();
    // Callee name is shown so the caller knows who is being called.
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText(/Video call.*Ringing/)).toBeInTheDocument();
    // Cancel button ends the call.
    expect(screen.getByLabelText('Cancel call')).toBeInTheDocument();
  });

  it('shows the connected header for the connected status', () => {
    render(
      <VideoCallModal
        isOpen
        onClose={vi.fn()}
        call={{ callId: 'c1', callType: 'video', status: 'connected', remoteUserName: 'Bob' }}
        currentUser={{ id: 'u1' }}
        onAccept={vi.fn()}
        onReject={vi.fn()}
        onEnd={vi.fn()}
      />
    );

    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('renders the incoming-call accept/reject controls for the incoming status', () => {
    render(
      <VideoCallModal
        isOpen
        onClose={vi.fn()}
        call={{ callId: 'c1', callType: 'video', status: 'incoming', callerName: 'Bob' }}
        currentUser={{ id: 'u1' }}
        onAccept={vi.fn()}
        onReject={vi.fn()}
        onEnd={vi.fn()}
      />
    );

    expect(screen.getByText('Incoming Call')).toBeInTheDocument();
    expect(screen.getByLabelText('Accept call')).toBeInTheDocument();
    expect(screen.getByLabelText('Reject call')).toBeInTheDocument();
  });

  it('accepts a localStream prop for the caller preview (sources from the service)', () => {
    const localStream = { id: 'local', getTracks: () => [] };

    const { container } = render(
      <VideoCallModal
        isOpen
        onClose={vi.fn()}
        call={{ callId: 'c1', callType: 'video', status: 'initiated', remoteUserName: 'Bob' }}
        currentUser={{ id: 'u1' }}
        onAccept={vi.fn()}
        onReject={vi.fn()}
        onEnd={vi.fn()}
        localStream={localStream}
      />
    );

    // The initiated branch renders a local preview <video> element when a stream is available.
    const videos = container.querySelectorAll('video');
    expect(videos.length).toBe(1);
  });
});
