import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/api.js';
import logger from '../utils/logger';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.userId = null;
    this.userType = null;
    this.listeners = new Map();
    this.conversationRooms = new Set();
  }

  connect(token) {
    if (this.socket?.connected) {
      return;
    }

    if (!token) {
      logger.error('❌ Socket connect called without auth token');
      return;
    }

    this._token = token;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true, // ENHANCED
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10, // Increased from 5
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      this.connected = true;

      // Authenticate with JWT token
      this.socket.emit('authenticate', { token: this._token });
    });

    this.socket.on('authenticated', (data) => {
      this.userId = data.userId;
      this.userType = data.userType;
      this.emit('authenticated', data);

      // Rejoin all conversation rooms after reconnection - NEW
      if (this.conversationRooms.size > 0) {
        this.conversationRooms.forEach(conversationId => {
          this.socket.emit('join_conversation', { conversationId });
        });
      }
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      this.emit('disconnected');

      // Auto-reconnect if server disconnected - NEW
      if (reason === 'io server disconnect') {
        this.socket.connect();
      }
    });

    // NEW: Reconnection event handlers
    this.socket.on('reconnect', (attemptNumber) => {
      this.connected = true;
      this.emit('reconnected', { attemptNumber });
    });

    this.socket.on('reconnect_attempt', (_attemptNumber) => {
    });
    
    this.socket.on('reconnect_error', (error) => {
      logger.error('❌ Reconnection error:', error);
    });
    
    this.socket.on('reconnect_failed', () => {
      logger.error('❌ All reconnection attempts failed');
      this.emit('reconnect_failed');
    });

    this.socket.on('error', (error) => {
      logger.error('❌ Socket error:', error);
      this.emit('error', error);
    });

    this.socket.on('connect_error', (error) => {
      logger.error('❌ Connection error:', error);
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

    // Staff update events
    this.socket.on('staff_updated', (data) => {
      this.emit('staff_updated', data);
    });

    // Student update events
    this.socket.on('student_updated', (data) => {
      this.emit('student_updated', data);
    });

    // Class update events
    this.socket.on('class_updated', (data) => {
      this.emit('class_updated', data);
    });

    // Attendance events
    this.socket.on('attendance_updated', (data) => {
      this.emit('attendance_updated', data);
    });

    this.socket.on('attendance_bulk_updated', (data) => {
      this.emit('attendance_bulk_updated', data);
    });

    // Fee payment events
    this.socket.on('fee_payment_created', (data) => {
      this.emit('fee_payment_created', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.userId = null;
      this.userType = null;
      this.listeners.clear();
      this.conversationRooms.clear(); // Clear tracked rooms
    }
  }

  // Join a conversation room
  joinConversation(conversationId) {
    if (!this.socket?.connected) {
      logger.error('Socket not connected');
      return;
    }

    this.socket.emit('join_conversation', { conversationId });
    this.conversationRooms.add(conversationId); // Track joined rooms
  }

  // Send a message
  sendMessage(data) {
    if (!this.socket?.connected) {
      logger.error('Socket not connected');
      return;
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
    }
    this.listeners.get(event).push(callback);
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
    callbacks.forEach(callback => callback(data));
  }

  isConnected() {
    return this.connected && this.socket?.connected;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
