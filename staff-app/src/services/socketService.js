// Socket Service for Staff App
// Handles real-time WebSocket communication for chat

import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config';

const BASE_URL = config.SOCKET_URL;

class SocketService {
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
    // If already connected and authenticated, reuse the connection
    if (this.socket?.connected && this.authenticated) {
      return Promise.resolve();
    }

    if (!token) {
      return Promise.reject(new Error('Auth token required'));
    }

    this._token = token;

    // If socket exists but not connected, wait for reconnection
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

      this.socket = io(BASE_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 10000
      });

      // Connection timeout
      const connectionTimeout = setTimeout(() => {
        if (!this.connected || !this.authenticated) {
          console.warn('Socket connection/authentication timeout');
          this.disconnect();
          reject(new Error('Connection/Authentication timeout'));
        }
      }, 5000);

      this.socket.on('connect', () => {
        this.connected = true;
        this.reconnectAttempts = 0;

        // Register any pending listeners
        this.listeners.forEach((callbacks, event) => {
          if (!this.socket.listeners(event).length) {
            this.socket.on(event, (data) => {
              this.emit(event, data);
            });
          }
        });

        // Authenticate with JWT token
        this.socket.emit('authenticate', { token: this._token });
      });

      this.socket.on('authenticated', (data) => {
        clearTimeout(connectionTimeout);
        this.authenticated = true;
        this.userId = data.userId;
        this.userType = data.userType;
        this.emit('authenticated', data);
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        this.connected = false;
        this.authenticated = false;
        this.emit('disconnected', { reason });
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
        this.emit('error', error);
        reject(error);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        this.reconnectAttempts++;

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('Max reconnection attempts reached');
          reject(new Error('Failed to connect after multiple attempts'));
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

  // Leave a conversation room
  leaveConversation(conversationId) {
    if (!this.socket?.connected) return;

    this.socket.emit('leave_conversation', { conversationId });
  }

  // Send a message
  sendMessage(data) {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      throw new Error('Socket not connected');
    }

    this.socket.emit('send_message', data);
  }

  // Send typing indicator
  sendTyping(conversationId, isTyping) {
    if (!this.socket?.connected) return;

    this.socket.emit('typing', { conversationId, isTyping, userId: this.userId });
  }

  // Mark message as read
  markAsRead(messageId, conversationId) {
    if (!this.socket?.connected) return;

    this.socket.emit('mark_read', { messageId, conversationId, userId: this.userId });
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);

      // Register with socket.io if connected
      if (this.socket && this.socket.connected) {
        this.socket.on(event, (data) => {
          this.emit(event, data);
        });
      }
    }

    // Prevent duplicate callbacks
    const callbacks = this.listeners.get(event);
    if (!callbacks.includes(callback)) {
      callbacks.push(callback);
    }
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
        console.error(`Error in ${event} callback:`, error);
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

export default new SocketService();
