// Enhanced Chat Service with REST API calls
import { getAuthHeaders } from '../utils/authSession';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ChatServiceEnhanced {
  getHeaders() {
    return getAuthHeaders({ 'Content-Type': 'application/json' });
  }

  async getPermissions() {
    try {
      const response = await fetch(`${API_URL}/messages/permissions`, {
        headers: this.getHeaders(),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to get permissions');
      return await response.json();
    } catch (error) {
      console.error('Error getting permissions:', error);
      throw error;
    }
  }

  async getConversations() {
    try {
      const response = await fetch(`${API_URL}/messages/conversations`, {
        headers: this.getHeaders(),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to get conversations');
      return await response.json();
    } catch (error) {
      console.error('Error getting conversations:', error?.message || error);
      return [];
    }
  }

  async createConversation(user2Id, user2Type) {
    try {
      const response = await fetch(`${API_URL}/messages/conversations`, {
        method: 'POST',
        headers: this.getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ user2Id, user2Type })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create conversation');
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  async getMessages(conversationId, limit = 50, before = null) {
    try {
      let url = `${API_URL}/messages/conversations/${conversationId}/messages?limit=${limit}`;
      if (before) url += `&before=${before}`;

      const response = await fetch(url, {
        headers: this.getHeaders(),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to get messages');
      return await response.json();
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  async sendMessage(data) {
    try {
      // Strip caller identity fields — backend derives from session
      const { senderId, senderModel, ...payload } = data;
      const response = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: this.getHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Failed to send message');
      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async markAsRead(conversationId) {
    try {
      const response = await fetch(`${API_URL}/messages/read`, {
        method: 'PUT',
        headers: this.getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ conversationId })
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return await response.json();
    } catch (error) {
      console.error('Error marking as read:', error);
      throw error;
    }
  }

  async deleteMessage(messageId) {
    try {
      const response = await fetch(`${API_URL}/messages/${messageId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete message');
      return await response.json();
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  async searchMessages(query, limit = 20) {
    try {
      const response = await fetch(`${API_URL}/messages/search?query=${encodeURIComponent(query)}&limit=${limit}`, {
        headers: this.getHeaders(),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to search messages');
      return await response.json();
    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  }

  async getUserPresence(userId) {
    try {
      const response = await fetch(`${API_URL}/messages/presence/${userId}`, {
        headers: this.getHeaders(),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to get presence');
      return await response.json();
    } catch (error) {
      console.error('Error getting presence:', error);
      return { status: 'offline', lastSeen: null };
    }
  }

  async getOnlineUsers() {
    try {
      const response = await fetch(`${API_URL}/messages/presence/online`, {
        headers: this.getHeaders(),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to get online users');
      return await response.json();
    } catch (error) {
      console.error('Error getting online users:', error);
      return [];
    }
  }

  async uploadFile(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload file');
      }
      return await response.json();
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
}

export default new ChatServiceEnhanced();
