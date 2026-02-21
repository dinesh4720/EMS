import { io } from 'socket.io-client';
import CONFIG from '../config';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.connected = false;
    this.authenticated = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(userId, userType = 'parent') {
    if (this.socket?.connected) {
      // Already connected, just re-authenticate if needed
      if (!this.authenticated) {
        this.socket.emit('authenticate', { userId, userType });
      }
      return;
    }

    try {
      this.socket = io(CONFIG.SOCKET_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.setupEventHandlers(userId, userType);
    } catch (error) {
      console.error('Error connecting to socket:', error);
    }
  }

  setupEventHandlers(userId, userType) {
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.connected = true;
      this.reconnectAttempts = 0;
      // Authenticate with backend (joins user room + student rooms for parents)
      this.socket.emit('authenticate', { userId, userType });
      this.emitLocal('connection_status', { connected: true });
    });

    this.socket.on('authenticated', (data) => {
      console.log('Socket authenticated');
      this.authenticated = true;
      this.emitLocal('authenticated', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.connected = false;
      this.authenticated = false;
      this.emitLocal('connection_status', { connected: false, reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      this.emitLocal('connection_error', { error: error.message });
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      this.connected = true;
      this.reconnectAttempts = 0;
      this.emitLocal('reconnected', { attemptNumber });
    });

    this.socket.on('reconnect_failed', () => {
      console.log('Socket reconnection failed');
      this.emitLocal('reconnect_failed');
    });
  }

  // Local event emitter (for app-level listeners)
  emitLocal(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => callback(data));
    }
  }

  // Register listener for socket events from server
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Also add socket listener for server-pushed events
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Send events to server
  send(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot send event:', event);
    }
  }

  // Join a room
  joinRoom(roomId) {
    this.send('join_room', { roomId });
  }

  // Leave a room
  leaveRoom(roomId) {
    this.send('leave_room', { roomId });
  }

  // Chat specific methods
  sendMessage(message) {
    this.send('send_message', message);
  }

  // Typing indicators
  sendTyping(conversationId, isTyping) {
    this.send('typing', { conversationId, isTyping });
  }

  // Read receipts
  markAsRead(conversationId, messageId) {
    this.send('mark_read', { conversationId, messageId });
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.authenticated = false;
    }
  }

  // Check connection status
  isConnected() {
    return this.connected;
  }
}

const socketService = new SocketService();
export default socketService;
