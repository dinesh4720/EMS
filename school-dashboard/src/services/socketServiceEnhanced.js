import { io } from 'socket.io-client';

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

  connect(userId, userType) {
    // If already connected and authenticated, reuse the connection
    if (this.socket?.connected && this.authenticated) {
      console.log('✅ Socket already connected and authenticated - reusing connection');
      return Promise.resolve();
    }

    // If socket exists but not connected, don't create a new one - let it reconnect
    if (this.socket && !this.socket.connected) {
      console.log('⏳ Socket exists but disconnected - waiting for reconnection...');
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
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const SOCKET_URL = API_URL.replace('/api', '');

      console.log('🔌 Creating new Socket.IO connection:', SOCKET_URL);

      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 10000
      });

      this.userId = userId;
      this.userType = userType;

      // Connection timeout
      const connectionTimeout = setTimeout(() => {
        if (!this.connected || !this.authenticated) {
          console.warn('⚠️ Socket connection/authentication timeout');
          this.disconnect(); // Ensure we clean up if we timeout
          reject(new Error('Connection/Authentication timeout'));
        }
      }, 5000); // Reduced to 5s for faster fallback

      this.socket.on('connect', () => {
        console.log('✅ Socket connected:', this.socket.id);
        this.connected = true;
        this.reconnectAttempts = 0;

        // Authenticate
        this.socket.emit('authenticate', { userId, userType });
      });

      this.socket.on('authenticated', (data) => {
        clearTimeout(connectionTimeout);
        console.log('✅ Socket authenticated:', data);
        this.authenticated = true;
        this.emit('authenticated', data);
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
        this.connected = false;
        this.authenticated = false;
        this.emit('disconnected', { reason });
      });

      this.socket.on('error', (error) => {
        console.error('❌ Socket error:', error);
        this.emit('error', error);
        reject(error);
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error);
        this.reconnectAttempts++;

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('❌ Max reconnection attempts reached');
          reject(new Error('Failed to connect after multiple attempts'));
        }

        this.emit('connect_error', error);
      });

      // Chat events
      this.socket.on('new_message', (data) => {
        console.log('📨 New message received:', data);
        this.emit('new_message', data);
      });

      this.socket.on('message_notification', (data) => {
        console.log('🔔 [SOCKET] message_notification event received from server:', data);
        console.log('🔔 [SOCKET] Emitting to custom listeners, count:', this.listeners.get('message_notification')?.length || 0);
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
        console.log('✅ Joined conversation:', data);
        this.emit('joined_conversation', data);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting socket...');
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
      console.error('❌ Socket not connected');
      return;
    }

    console.log('📥 Joining conversation:', conversationId);
    this.socket.emit('join_conversation', { conversationId });
  }

  // Send a message
  sendMessage(data) {
    if (!this.socket?.connected) {
      console.error('❌ Socket not connected');
      throw new Error('Socket not connected');
    }

    console.log('📤 Sending message:', data);
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
    
    // Check if this exact callback already exists to prevent duplicates
    const callbacks = this.listeners.get(event);
    if (callbacks.includes(callback)) {
      console.log(`⚠️ [LISTENERS] Callback for '${event}' already exists, skipping duplicate`);
      return;
    }
    
    callbacks.push(callback);
    console.log(`📝 [LISTENERS] Added listener for '${event}', total count: ${callbacks.length}`);
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

// Export singleton instance
const socketServiceEnhanced = new SocketServiceEnhanced();
export default socketServiceEnhanced;
