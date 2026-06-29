/**
 * @vitest-environment jsdom
 *
 * Regression coverage for MEM-02: startCall/acceptCall must stop the acquired
 * media stream on their error paths so the camera/mic indicator turns off when
 * a call fails after getUserMedia.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// PeerJS is mocked so we can control peer.call() and avoid real network/peer setup.
const peerInstances = [];
vi.mock('peerjs', () => {
  return {
    default: class MockPeer {
      constructor(id) {
        this.id = id;
        this.destroyed = false;
        this.call = vi.fn(() => null); // default: pretend call creation fails
        this._handlers = {};
        peerInstances.push(this);
      }
      on() {}
      destroy() {
        this.destroyed = true;
      }
    },
  };
});

import VideoCallService from './videoCallService';

function createMockStream() {
  const tracks = [
    { kind: 'video', enabled: true, stop: vi.fn() },
    { kind: 'audio', enabled: true, stop: vi.fn() },
  ];
  return {
    tracks,
    getTracks: () => tracks,
    getAudioTracks: () => tracks.filter((t) => t.kind === 'audio'),
    getVideoTracks: () => tracks.filter((t) => t.kind === 'video'),
  };
}

describe('videoCallService MEM-02 — error paths stop the media stream', () => {
  let service;
  let getUserMedia;

  beforeEach(() => {
    peerInstances.length = 0;
    getUserMedia = vi.fn();
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia },
      writable: true,
      configurable: true,
    });

    service = new VideoCallService();
    // Stand in for an initialized peer; .call defaults to returning null (failure).
    service.peer = { id: 'me', call: vi.fn(() => null) };
  });

  it('startCall stops acquired tracks and clears localStream when call creation fails', async () => {
    const stream = createMockStream();
    getUserMedia.mockResolvedValue(stream);

    await expect(service.startCall('remote-1')).rejects.toThrow('Failed to create call');

    expect(getUserMedia).toHaveBeenCalledOnce();
    stream.tracks.forEach((track) => expect(track.stop).toHaveBeenCalledOnce());
    expect(service.localStream).toBeNull();
  });

  it('startCall does not throw on track cleanup when getUserMedia itself rejects', async () => {
    getUserMedia.mockRejectedValue(new Error('Permission denied'));

    await expect(service.startCall('remote-1')).rejects.toThrow('Permission denied');
    expect(service.localStream).toBeNull();
  });

  it('acceptCall stops acquired tracks and clears localStream when the call is missing', async () => {
    const stream = createMockStream();
    getUserMedia.mockResolvedValue(stream);

    await expect(service.acceptCall('does-not-exist')).rejects.toThrow('Call not found');

    expect(getUserMedia).toHaveBeenCalledOnce();
    stream.tracks.forEach((track) => expect(track.stop).toHaveBeenCalledOnce());
    expect(service.localStream).toBeNull();
  });

  it('acceptCall emits callError on the error path', async () => {
    const stream = createMockStream();
    getUserMedia.mockResolvedValue(stream);
    const onError = vi.fn();
    service.on('callError', onError);

    await expect(service.acceptCall('does-not-exist')).rejects.toThrow('Call not found');
    expect(onError).toHaveBeenCalledOnce();
  });
});
