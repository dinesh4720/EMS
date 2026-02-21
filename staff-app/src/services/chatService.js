// Chat Service for Staff App
// Handles all REST API calls for messaging
// Supports: text, images, voice messages, reactions

import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config';

const API_URL = config.API_URL;

class ChatService {
  // Helper to get auth headers
  async getAuthHeaders() {
    const token = await AsyncStorage.getItem('@staff_app_token');
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // Get user's chat permissions
  async getPermissions(userId, userType) {
    try {
      const response = await fetch(
        `${API_URL}/messages/permissions?userId=${userId}&userType=${userType}`,
        { headers: await this.getAuthHeaders() }
      );
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
      const response = await fetch(
        `${API_URL}/messages/conversations?userId=${userId}&userType=${userType}`,
        { headers: await this.getAuthHeaders() }
      );
      
      if (!response.ok) {
        let errorMessage = `Failed to get conversations (Status: ${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage += ` - ${errorData.error || errorData.message || 'Unknown error'}`;
        } catch (e) {
          errorMessage += ` - ${response.statusText || 'Unknown error'}`;
        }
        console.error('❌', errorMessage);
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      // Normalize IDs
      return (data || []).map(conv => ({
        ...conv,
        id: conv.id || conv._id
      }));
    } catch (error) {
      console.error('❌ Error getting conversations:', error.message);
      // Check if it's a network error
      if (error.message.includes('Network request failed')) {
        console.error('❌ Network error: Cannot connect to server at', API_URL);
        console.error('❌ Please check:');
        console.error('   1. Backend server is running');
        console.error('   2. Correct IP address in src/config/index.js');
        console.error('   3. Device is on same network as server');
      }
      return [];
    }
  }

  // Create or get a conversation
  async createConversation(user1Id, user1Type, user2Id, user2Type) {
    try {
      const response = await fetch(`${API_URL}/messages/conversations`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({ user1Id, user1Type, user2Id, user2Type })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create conversation');
      }
      const data = await response.json();
      return {
        ...data,
        id: data.id || data._id
      };
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

      const response = await fetch(url, {
        headers: await this.getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to get messages');
      const data = await response.json();
      // Normalize IDs and handle populated fields
      return (data || []).map(msg => ({
        ...msg,
        id: msg.id || msg._id,
        senderId: msg.senderId?._id || msg.senderId,
        reactions: msg.reactions || []
      }));
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
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to send message');
      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Upload a file (image, voice, document)
  async uploadFile(fileUri, type = 'image') {
    try {
      const formData = new FormData();
      const filename = fileUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1].toLowerCase() : type === 'image' ? 'jpg' : 'm4a';

      // Determine MIME type based on file extension and type
      let mimeType = 'image/jpeg'; // default
      if (type === 'voice' || type === 'audio') {
        mimeType = 'audio/m4a';
      } else if (type === 'file') {
        mimeType = 'application/octet-stream';
      } else if (type === 'image') {
        // Check for specific image formats
        switch (ext) {
          case 'png':
            mimeType = 'image/png';
            break;
          case 'gif':
            mimeType = 'image/gif';
            break;
          case 'webp':
            mimeType = 'image/webp';
            break;
          case 'heic':
          case 'heif':
            mimeType = 'image/heic';
            break;
          case 'jpg':
          case 'jpeg':
          default:
            mimeType = 'image/jpeg';
            break;
        }
      }

      formData.append('file', {
        uri: fileUri,
        name: filename || `${type}.${ext}`,
        type: mimeType
      });
      formData.append('type', type);

      const token = await AsyncStorage.getItem('@staff_app_token');

      // Note: Don't set Content-Type manually for FormData in React Native
      // The system will automatically set it with the correct boundary
      const headers = {
        'Authorization': token ? `Bearer ${token}` : '',
      };

      console.log(`📤 Uploading ${type} file: ${filename || `${type}.${ext}`} (${mimeType})`);

      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers,
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
        console.error('❌ Upload failed:', errorData);
        throw new Error(errorData.message || errorData.error || 'Failed to upload file');
      }

      const result = await response.json();
      console.log(`✅ Upload successful: ${result.url}`);
      return result;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Mark messages as read
  async markAsRead(conversationId, userId) {
    try {
      const response = await fetch(`${API_URL}/messages/read`, {
        method: 'PUT',
        headers: await this.getAuthHeaders(),
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
        method: 'DELETE',
        headers: await this.getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to delete message');
      return await response.json();
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // Add reaction to a message
  async addReaction(conversationId, messageId, emoji, userId) {
    try {
      const response = await fetch(`${API_URL}/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({ conversationId, emoji, userId })
      });
      if (!response.ok) {
        const text = await response.text();
        let error;
        try {
          error = JSON.parse(text);
        } catch {
          error = { message: `Server error: ${response.status}` };
        }
        throw new Error(error.message || 'Failed to add reaction');
      }
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        return { success: true };
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }

  // Remove reaction from a message
  async removeReaction(conversationId, messageId, emoji, userId) {
    try {
      const response = await fetch(`${API_URL}/messages/${messageId}/reactions`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({ conversationId, emoji, userId })
      });
      if (!response.ok) {
        const text = await response.text();
        let error;
        try {
          error = JSON.parse(text);
        } catch {
          error = { message: `Server error: ${response.status}` };
        }
        throw new Error(error.message || 'Failed to remove reaction');
      }
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        return { success: true };
      }
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  }

  // Search messages
  async searchMessages(userId, query, limit = 20) {
    try {
      const response = await fetch(
        `${API_URL}/messages/search?userId=${userId}&query=${encodeURIComponent(query)}&limit=${limit}`,
        { headers: await this.getAuthHeaders() }
      );
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
      const response = await fetch(`${API_URL}/messages/presence/${userId}`, {
        headers: await this.getAuthHeaders()
      });
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
      const response = await fetch(`${API_URL}/messages/presence/online`, {
        headers: await this.getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to get online users');
      return await response.json();
    } catch (error) {
      console.error('Error getting online users:', error);
      return [];
    }
  }

  // Get all contacts (staff and students)
  async getContacts(userType = 'staff') {
    try {
      const response = await fetch(
        `${API_URL}/messages/contacts?userType=${userType}`,
        { headers: await this.getAuthHeaders() }
      );
      
      if (!response.ok) {
        let errorMessage = `Failed to get contacts (Status: ${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage += ` - ${errorData.error || errorData.message || 'Unknown error'}`;
        } catch (e) {
          errorMessage += ` - ${response.statusText || 'Unknown error'}`;
        }
        console.error('❌', errorMessage);
        console.error('❌ Contacts endpoint not available, returning empty array');
        return [];
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Error getting contacts:', error.message);
      // Check if it's a network error
      if (error.message.includes('Network request failed')) {
        console.error('❌ Network error: Cannot connect to server at', API_URL);
        console.error('❌ Please check:');
        console.error('   1. Backend server is running');
        console.error('   2. Correct IP address in src/config/index.js');
        console.error('   3. Device is on same network as server');
      }
      return [];
    }
  }

  // Get total unread count
  async getUnreadCount(userId, userType) {
    try {
      const response = await fetch(
        `${API_URL}/messages/unread-count?userId=${userId}&userType=${userType}`,
        { headers: await this.getAuthHeaders() }
      );
      if (!response.ok) {
        console.log('Unread count endpoint not available, returning 0');
        return { count: 0 };
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting unread count:', error);
      return { count: 0 };
    }
  }
}

export default new ChatService();
