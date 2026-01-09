import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.userId = null;
    this.userType = null;
    this.listeners = new Map();
  }

  connect(userId, userType) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    // Remove /api from the URL for Socket.IO connection
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const SOCKET_URL = API_URL.replace('/api', '');
    
    console.log('🔌 Connecting to Socket.IO:', SOCKET_URL);

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.userId = userId;
    this.userType = userType;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      this.connected = true;
      
      // Authenticate
      this.socket.emit('authenticate', { userId, userType });
    });

    this.socket.on('authenticated', (data) => {
      console.log('✅ Authenticated:', data);
      this.emit('authenticated', data);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      this.connected = false;
      this.emit('disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      this.emit('error', error);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
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
    }
  }

  // Join a conversation room
  joinConversation(conversationId) {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('join_conversation', { conversationId });
  }

  // Send a message
  sendMessage(data) {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
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
