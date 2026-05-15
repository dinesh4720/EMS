import { request, requestUpload } from './api/core.js';
import logger from '../utils/logger';

class ChatService {
  async getPermissions() {
    try {
      return await request('/messages/permissions');
    } catch (error) {
      logger.error('Error getting permissions:', error);
      throw error;
    }
  }

  async getConversations() {
    try {
      return await request('/messages/conversations');
    } catch (error) {
      logger.error('Error getting conversations:', error?.message || error);
      return [];
    }
  }

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

  async getMessages(conversationId, limit = 50, before = null) {
    try {
      let endpoint = `/messages/conversations/${conversationId}/messages?limit=${limit}`;
      if (before) endpoint += `&before=${before}`;
      return await request(endpoint);
    } catch (error) {
      logger.error('Error getting messages:', error);
      return [];
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

  async markAsRead(conversationId) {
    try {
      return await request('/messages/read', {
        method: 'PUT',
        body: JSON.stringify({ conversationId })
      });
    } catch (error) {
      logger.error('Error marking as read:', error);
      throw error;
    }
  }

  async deleteMessage(messageId) {
    try {
      return await request(`/messages/${messageId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      logger.error('Error deleting message:', error);
      throw error;
    }
  }

  async searchMessages(query, limit = 20) {
    try {
      return await request(`/messages/search?query=${encodeURIComponent(query)}&limit=${limit}`);
    } catch (error) {
      logger.error('Error searching messages:', error);
      return [];
    }
  }

  async getUserPresence(userId) {
    try {
      return await request(`/messages/presence/${userId}`);
    } catch (error) {
      logger.error('Error getting presence:', error);
      return { status: 'offline', lastSeen: null };
    }
  }

  async getOnlineUsers() {
    try {
      return await request('/messages/presence/online');
    } catch (error) {
      logger.error('Error getting online users:', error);
      return [];
    }
  }

  async uploadFile(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      return await requestUpload('/upload', formData);
    } catch (error) {
      logger.error('Error uploading file:', error);
      throw error;
    }
  }
}

export default new ChatService();
