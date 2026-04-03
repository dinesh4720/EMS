import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/api.js';
import logger from '../utils/logger';

class SocketServiceEnhanced {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.authenticated = false;
    this.userId = null;
    this.userType = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(token) {
    // Only update _authToken if an explicit token was provided
    if (token) {
      this._authToken = token;
    }

    // If already connected and authenticated, reuse the connection
    if (this.socket?.connected && this.authenticated) {
      return Promise.resolve();
    }

    // If socket exists but not connected, don't create a new one - let it reconnect
    if (this.socket && !this.socket.connected) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Reconnection timeout'));
        }, 5000);

        this.socket.once('authenticated', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }

    return new Promise((resolve, reject) => {
      // [AUDIT-533] Guard: promise must settle only once
      let settled = false;
      const safeResolve = () => { if (!settled) { settled = true; resolve(); } };
      const safeReject = (err) => { if (!settled) { settled = true; reject(err); } };

      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        withCredentials: true, // Send httpOnly cookies with handshake
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 10000,
        auth: this._authToken ? { token: this._authToken } : undefined,
      });

      // Connection timeout
      const connectionTimeout = setTimeout(() => {
        if (!this.connected || !this.authenticated) {
          console.warn('⚠️ Socket connection/authentication timeout');
          console.warn('⚠️ Connection status:', { connected: this.connected, authenticated: this.authenticated });
          this.disconnect(); // Ensure we clean up if we timeout
          safeReject(new Error('Connection/Authentication timeout'));
        }
      }, 10000); // Increased to 10s to allow for slower connections

      this.socket.on('connect', () => {
        this.connected = true;
        this.reconnectAttempts = 0;

        // Register any pending listeners that were added before connection
        this.listeners.forEach((callbacks, event) => {
          if (!this.socket.listeners(event).length) {
            this.socket.on(event, (data) => {
              this.emit(event, data);
            });
          }
        });

        // Authenticate — use token if provided, otherwise fall back to httpOnly cookie
        this.socket.emit('authenticate', this._authToken
          ? { token: this._authToken }
          : { useCookie: true }
        );
      });

      this.socket.on('authenticated', (data) => {
        clearTimeout(connectionTimeout);
        this.authenticated = true;
        this.userId = data.userId;
        this.userType = data.userType;
        this.emit('authenticated', data);
        safeResolve();
      });

      this.socket.on('disconnect', (reason) => {
        this.connected = false;
        this.authenticated = false;
        this.emit('disconnected', { reason });
      });

      this.socket.on('error', (error) => {
        logger.error('❌ Socket error:', error);
        this.emit('error', error);
        safeReject(error);
      });

      this.socket.on('connect_error', (error) => {
        logger.error('❌ Connection error:', error);
        this.reconnectAttempts++;

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          logger.error('❌ Max reconnection attempts reached');
          safeReject(new Error('Failed to connect after multiple attempts'));
        }

        this.emit('connect_error', error);
      });

      // Chat events
      this.socket.on('new_message', (data) => {
        this.emit('new_message', data);
      });

      this.socket.on('message_notification', (data) => {
        this.emit('message_notification', data);
      });

      this.socket.on('user_typing', (data) => {
        this.emit('user_typing', data);
      });

      this.socket.on('message_read', (data) => {
        this.emit('message_read', data);
      });

      this.socket.on('messages_read', (data) => {
        this.emit('messages_read', data);
      });

      this.socket.on('user_status', (data) => {
        this.emit('user_status', data);
      });

      this.socket.on('joined_conversation', (data) => {
        this.emit('joined_conversation', data);
      });

      // Attendance events
      this.socket.on('attendance_updated', (data) => {
        this.emit('attendance_updated', data);
      });

      // Substitution alert events
      this.socket.on('substitution_alert', (data) => {
        this.emit('substitution_alert', data);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.authenticated = false;
      this.userId = null;
      this.userType = null;
      // [AUDIT-564] Do NOT clear application-level listeners here.
      // They need to survive temporary disconnects so reconnect re-registers them.
      // Only clear on explicit destroy/logout via destroyAll().
    }
  }

  // Full teardown: clears all listeners. Call on logout only.
  destroyAll() {
    this.disconnect();
    this.listeners.clear();
  }

  // Join a conversation room
  joinConversation(conversationId) {
    if (!this.socket?.connected) {
      logger.error('❌ Socket not connected');
      return;
    }

    this.socket.emit('join_conversation', { conversationId });
  }

  // Send a message
  sendMessage(data) {
    if (!this.socket?.connected) {
      logger.error('❌ Socket not connected');
      throw new Error('Socket not connected');
    }

    this.socket.emit('send_message', data);
  }

  // Send typing indicator
  sendTyping(conversationId, isTyping) {
    if (!this.socket?.connected) return;

    this.socket.emit('typing', { conversationId, isTyping });
  }

  // Mark message as read
  markAsRead(messageId, conversationId) {
    if (!this.socket?.connected) return;

    this.socket.emit('mark_read', { messageId, conversationId });
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);

      // Register with socket.io if this is the first listener for this event
      if (this.socket && this.socket.connected) {
        this.socket.on(event, (data) => {
          this.emit(event, data);
        });
      }
    }

    // Check if this exact callback already exists to prevent duplicates
    const callbacks = this.listeners.get(event);
    if (callbacks.includes(callback)) {
      return;
    }

    callbacks.push(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;

    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return;

    const callbacks = this.listeners.get(event);
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        logger.error(`Error in ${event} callback:`, error);
      }
    });
  }

  isConnected() {
    return this.connected && this.socket?.connected;
  }

  getConnectionStatus() {
    return {
      connected: this.connected,
      socketId: this.socket?.id,
      userId: this.userId,
      userType: this.userType,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Export singleton instance
const socketServiceEnhanced = new SocketServiceEnhanced();
export default socketServiceEnhanced;

/**
 * Returns the singleton socket service instance.
 * Use this in components that need lazy access to the socket
 * (e.g. inside useEffect where the socket may not be connected yet).
 */
export function getSocketService() {
  return socketServiceEnhanced;
}
