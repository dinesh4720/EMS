// Enhanced Chat Service with REST API calls
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ChatServiceEnhanced {
  // Get user's chat permissions
  async getPermissions(userId, userType) {
    try {
      const response = await fetch(`${API_URL}/messages/permissions?userId=${userId}&userType=${userType}`);
      if (!response.ok) throw new Error('Failed to get permissions');
      return await response.json();
    } catch (error) {
      console.error('Error getting permissions:', error);
      throw error;
    }
  }

  // Get all conversations for a user
  async getConversations(userId, userType) {
    try {
      const response = await fetch(`${API_URL}/messages/conversations?userId=${userId}&userType=${userType}`);
      if (!response.ok) throw new Error('Failed to get conversations');
      return await response.json();
    } catch (error) {
      console.error('Error getting conversations:', error);
      return [];
    }
  }

  // Create or get a conversation
  async createConversation(user1Id, user1Type, user2Id, user2Type) {
    try {
      const response = await fetch(`${API_URL}/messages/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user1Id, user1Type, user2Id, user2Type })
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

  // Get messages for a conversation
  async getMessages(conversationId, limit = 50, before = null) {
    try {
      let url = `${API_URL}/messages/conversations/${conversationId}/messages?limit=${limit}`;
      if (before) url += `&before=${before}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to get messages');
      return await response.json();
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  // Send a message (REST fallback)
  async sendMessage(data) {
    try {
      const response = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to send message');
      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Mark messages as read
  async markAsRead(conversationId, userId) {
    try {
      const response = await fetch(`${API_URL}/messages/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, userId })
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return await response.json();
    } catch (error) {
      console.error('Error marking as read:', error);
      throw error;
    }
  }

  // Delete a message
  async deleteMessage(messageId, userId) {
    try {
      const response = await fetch(`${API_URL}/messages/${messageId}?userId=${userId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete message');
      return await response.json();
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // Search messages
  async searchMessages(userId, query, limit = 20) {
    try {
      const response = await fetch(`${API_URL}/messages/search?userId=${userId}&query=${encodeURIComponent(query)}&limit=${limit}`);
      if (!response.ok) throw new Error('Failed to search messages');
      return await response.json();
    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  }

  // Get user presence
  async getUserPresence(userId) {
    try {
      const response = await fetch(`${API_URL}/messages/presence/${userId}`);
      if (!response.ok) throw new Error('Failed to get presence');
      return await response.json();
    } catch (error) {
      console.error('Error getting presence:', error);
      return { status: 'offline', lastSeen: null };
    }
  }

  // Get online users
  async getOnlineUsers() {
    try {
      const response = await fetch(`${API_URL}/messages/presence/online`);
      if (!response.ok) throw new Error('Failed to get online users');
      return await response.json();
    } catch (error) {
      console.error('Error getting online users:', error);
      return [];
    }
  }

  // Upload file for chat
  async uploadFile(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL.replace('/api', '')}/api/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to upload file');
      return await response.json();
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
}

export default new ChatServiceEnhanced();
