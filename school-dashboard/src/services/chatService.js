import api from './api';

class ChatService {
  // Get all conversations for a user
  async getConversations(userId, userType) {
    try {
      const response = await api.get('/messages/conversations', {
        params: { userId, userType }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  // Get messages for a conversation
  async getMessages(conversationId, limit = 50, before = null) {
    try {
      const params = { limit };
      if (before) params.before = before;

      const response = await api.get(`/messages/conversations/${conversationId}/messages`, {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  // Create or get conversation
  async createConversation(user1Id, user1Type, user2Id, user2Type) {
    try {
      const response = await api.post('/messages/conversations', {
        user1Id,
        user1Type,
        user2Id,
        user2Type
      });
      return response.data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  // Send message (REST fallback)
  async sendMessage(data) {
    try {
      const response = await api.post('/messages/messages', data);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Mark messages as read
  async markAsRead(conversationId, userId) {
    try {
      const response = await api.put('/messages/messages/read', {
        conversationId,
        userId
      });
      return response.data;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Delete message
  async deleteMessage(messageId, userId) {
    try {
      const response = await api.delete(`/messages/messages/${messageId}`, {
        params: { userId }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // Search messages
  async searchMessages(userId, query, limit = 20) {
    try {
      const response = await api.get('/messages/messages/search', {
        params: { userId, query, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  }

  // Get user presence
  async getUserPresence(userId) {
    try {
      const response = await api.get(`/messages/presence/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user presence:', error);
      throw error;
    }
  }

  // Get online users
  async getOnlineUsers() {
    try {
      const response = await api.get('/messages/presence/online');
      return response.data;
    } catch (error) {
      console.error('Error fetching online users:', error);
      throw error;
    }
  }

  // Upload file for chat
  async uploadFile(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
}

const chatService = new ChatService();
export default chatService;
