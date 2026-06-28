import Peer from 'peerjs';
import logger from '../utils/logger';

class VideoCallService {
  constructor() {
    this.peer = null;
    this.localStream = null;
    this.remoteStreams = new Map();
    this.calls = new Map();
    this.currentCallId = null;
    this.listeners = new Map();

    // Cleanup on browser navigation / tab close so the camera indicator turns off
    this._boundHandleUnload = () => this.destroy();
    window.addEventListener('beforeunload', this._boundHandleUnload);
    window.addEventListener('pagehide', this._boundHandleUnload);
  }

  /**
   * Initialize PeerJS with user ID
   */
  async initialize(userId) {
    try {
      // Destroy any existing peer before re-initializing to avoid orphaned connections
      if (this.peer && !this.peer.destroyed) {
        this.peer.destroy();
        this.peer = null;
      }

      // Create Peer instance
      this.peer = new Peer(userId.toString(), {
        debug: import.meta.env.DEV ? 2 : 0
      });

      return new Promise((resolve, reject) => {
        let settled = false;
        const timeoutId = setTimeout(() => {
          if (!settled) {
            settled = true;
            if (this.peer) {
              this.peer.destroy();
              this.peer = null;
            }
            reject(new Error('PeerJS initialization timeout'));
          }
        }, 10000);

        this.peer.on('open', (id) => {
          if (!settled) {
            settled = true;
            clearTimeout(timeoutId);
            this.emit('peerReady', id);
            resolve(id);
          }
        });

        this.peer.on('error', (error) => {
          logger.error('❌ PeerJS error:', error);
          this.emit('peerError', error);
          if (!settled) {
            settled = true;
            clearTimeout(timeoutId);
            if (this.peer) {
              this.peer.destroy();
              this.peer = null;
            }
            reject(error);
          }
        });

        // Handle incoming calls
        this.peer.on('call', (call) => {
          this.handleIncomingCall(call);
        });
      });
    } catch (error) {
      logger.error('❌ Failed to initialize PeerJS:', error);
      throw error;
    }
  }

  /**
   * Start a video/audio call
   */
  async startCall(remotePeerId, options = {}) {
    const {
      video = true,
      audio = true,
      callId = null,
      callerName = null
    } = options;

    try {
      // Get local media stream
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video,
        audio
      });

      // Create PeerJS call
      const call = this.peer.call(remotePeerId.toString(), this.localStream, {
        metadata: {
          callerId: this.peer.id,
          callerName,
          callType: video ? 'video' : 'audio',
          callId
        }
      });

      if (!call) {
        throw new Error('Failed to create call');
      }

      this.setupCallHandlers(call);

      // Store call
      this.currentCallId = callId || Date.now().toString();
      this.calls.set(this.currentCallId, call);

      this.emit('callInitiated', {
        callId: this.currentCallId,
        remotePeerId,
        callType: video ? 'video' : 'audio'
      });

      return call;
    } catch (error) {
      logger.error('❌ Failed to start call:', error);
      this.emit('callError', error);
      throw error;
    }
  }

  /**
   * Handle incoming call
   */
  handleIncomingCall(call) {
    this.setupCallHandlers(call);

    const callId = Date.now().toString();
    this.calls.set(callId, call);
    this.currentCallId = callId;

    this.emit('incomingCall', {
      callId,
      callerId: call.peer,
      metadata: call.metadata
    });
  }

  /**
   * Accept incoming call
   */
  async acceptCall(callId, options = {}) {
    const {
      video = true,
      audio = true
    } = options;

    try {
      // Get local media stream
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video,
        audio
      });

      const call = this.calls.get(callId);
      if (!call) {
        throw new Error('Call not found');
      }

      // Answer the call
      call.answer(this.localStream);

      this.emit('callAccepted', { callId });
    } catch (error) {
      logger.error('❌ Failed to accept call:', error);
      this.emit('callError', error);
      throw error;
    }
  }

  /**
   * Reject incoming call
   */
  rejectCall(callId) {
    const call = this.calls.get(callId);
    if (call) {
      call.close();
      this.calls.delete(callId);
      this.emit('callRejected', { callId });
    }
  }

  /**
   * End call
   */
  endCall(callId) {
    const call = this.calls.get(callId);
    if (call) {
      call.close();
      this.calls.delete(callId);
      this.emit('callEnded', { callId });
    }

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Clear remote streams
    this.remoteStreams.forEach((stream) => {
      stream.getTracks().forEach(track => track.stop());
    });
    this.remoteStreams.clear();

    this.currentCallId = null;
  }

  /**
   * Setup call event handlers
   */
  setupCallHandlers(call) {
    call.on('stream', (remoteStream) => {
      this.remoteStreams.set(call.peer, remoteStream);
      this.emit('remoteStream', {
        stream: remoteStream,
        peerId: call.peer
      });
    });

    call.on('close', () => {
      this.emit('callClosed', { peerId: call.peer });
    });

    call.on('error', (error) => {
      logger.error('❌ Call error:', error);
      this.emit('callError', error);
    });
  }

  /**
   * Toggle audio/video tracks
   */
  toggleAudio(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
      this.emit('audioToggled', { enabled });
    }
  }

  toggleVideo(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
      this.emit('videoToggled', { enabled });
    }
  }

  /**
   * Mute/unmute microphone
   */
  muteMic() {
    this.toggleAudio(false);
  }

  unmuteMic() {
    this.toggleAudio(true);
  }

  /**
   * Turn camera on/off
   */
  turnOffCamera() {
    this.toggleVideo(false);
  }

  turnOnCamera() {
    this.toggleVideo(true);
  }

  /**
   * Event listeners management
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event).filter(cb => cb !== callback);
      this.listeners.set(event, callbacks);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    // Close all calls (snapshot keys to avoid modifying Map while iterating)
    for (const [callId, call] of Array.from(this.calls)) {
      call.close();
    }
    this.calls.clear();

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Stop remote streams
    this.remoteStreams.forEach((stream) => {
      stream.getTracks().forEach(track => track.stop());
    });
    this.remoteStreams.clear();

    this.currentCallId = null;

    // Destroy peer
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    // Clear listeners
    this.listeners.clear();

    // Remove unload listeners so they don't fire after explicit destroy
    if (this._boundHandleUnload) {
      window.removeEventListener('beforeunload', this._boundHandleUnload);
      window.removeEventListener('pagehide', this._boundHandleUnload);
      this._boundHandleUnload = null;
    }
  }
}

// Export singleton instance
export const videoCallService = new VideoCallService();

export default VideoCallService;
