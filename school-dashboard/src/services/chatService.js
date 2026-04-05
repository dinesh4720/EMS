import { request } from './api';
import logger from '../utils/logger';

class ChatService {
  // Get all conversations for a user (identity derived from session)
  async getConversations() {
    try {
      return await request('/messages/conversations');
    } catch (error) {
      logger.error('Error fetching conversations:', error);
      throw error;
    }
  }

  // Get messages for a conversation
  async getMessages(conversationId, limit = 50, before = null) {
    try {
      const params = new URLSearchParams({ limit });
      if (before) params.set('before', before);
      return await request(`/messages/conversations/${conversationId}/messages?${params}`);
    } catch (error) {
      logger.error('Error fetching messages:', error);
      throw error;
    }
  }

  // Create or get conversation (caller identity derived from session)
  async createConversation(user2Id, user2Type) {
    try {
      return await request('/messages/conversations', {
        method: 'POST',
        body: JSON.stringify({ user2Id, user2Type })
      });
    } catch (error) {
      logger.error('Error creating conversation:', error);
      throw error;
    }
  }

  // Send message (REST fallback) — caller identity derived from session
  async sendMessage(data) {
    try {
      // Strip caller identity fields — backend derives from session
      const { senderId, senderModel, ...payload } = data;
      return await request('/messages', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  }

  // Mark messages as read (identity derived from session)
  async markAsRead(conversationId) {
    try {
      return await request('/messages/read', {
        method: 'PUT',
        body: JSON.stringify({ conversationId })
      });
    } catch (error) {
      logger.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Delete message (identity derived from session)
  async deleteMessage(messageId) {
    try {
      return await request(`/messages/${messageId}`, { method: 'DELETE' });
    } catch (error) {
      logger.error('Error deleting message:', error);
      throw error;
    }
  }

  // Search messages (identity derived from session)
  async searchMessages(query, limit = 20) {
    try {
      const params = new URLSearchParams({ query, limit });
      return await request(`/messages/search?${params}`);
    } catch (error) {
      logger.error('Error searching messages:', error);
      throw error;
    }
  }

  // Get user presence
  async getUserPresence(userId) {
    try {
      return await request(`/messages/presence/${userId}`);
    } catch (error) {
      logger.error('Error fetching user presence:', error);
      throw error;
    }
  }

  // Get online users
  async getOnlineUsers() {
    try {
      return await request('/messages/presence/online');
    } catch (error) {
      logger.error('Error fetching online users:', error);
      throw error;
    }
  }

  // Upload file for chat
  async uploadFile(file) {
    try {
      const { uploadApi } = await import('./api');
      return await uploadApi.uploadFile(file);
    } catch (error) {
      logger.error('Error uploading file:', error);
      throw error;
    }
  }
}

const chatService = new ChatService();
export default chatService;
