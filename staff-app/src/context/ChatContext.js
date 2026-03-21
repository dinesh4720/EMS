// Chat Context for Staff App
// Provides global chat state and real-time messaging
// Supports: text, images, voice messages, reactions

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { getAuthToken } from '../services/api';
import chatService from '../services/chatService';
import socketService from '../services/socketService';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [messageReactions, setMessageReactions] = useState({}); // messageId -> reactions
  const listenersRef = useRef([]);

  // Load initial data
  const loadData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Load conversations and contacts in parallel with timeout
      const [convs, conts, unread] = await Promise.race([
        Promise.all([
          chatService.getConversations(user.id, 'staff'),
          chatService.getContacts('staff'),
          chatService.getUnreadCount(user.id, 'staff')
        ]),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout loading chat data')), 5000)
        )
      ]);

      setConversations(convs || []);
      setContacts(conts || []);
      setUnreadCount(unread?.count || 0);
    } catch (error) {
      console.error('Error loading chat data:', error);
      // Set empty defaults on error
      setConversations([]);
      setContacts([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Connect to socket
  const connectSocket = useCallback(async () => {
    if (!user?.id || socketConnected) return;

    try {
      await socketService.connect(user.id, 'staff');
      setSocketConnected(true);
    } catch (error) {
      console.error('ChatContext: Socket connection error:', error);
      // Will retry on next action
    }
  }, [user?.id, socketConnected]);

  // Setup socket listeners
  const setupSocketListeners = useCallback(() => {
    // New message notification
    const handleNewMessage = (data) => {

      const message = data.message || data;
      const conversationId = data.conversationId || message.conversationId;

      // Update reactions if present
      if (message.reactions) {
        setMessageReactions(prev => ({
          ...prev,
          [message.id]: message.reactions
        }));
      }

      // Update conversations list
      setConversations(prev => {
        const existingIndex = prev.findIndex(c =>
          c.id?.toString() === conversationId?.toString() ||
          c._id?.toString() === conversationId?.toString()
        );
        if (existingIndex >= 0) {
          const updated = [...prev];
          const lastMessageText = typeof message.content === 'string'
            ? (message.type === 'image' ? '📷 Image' :
               message.type === 'voice' ? '🎤 Voice message' :
               message.type === 'file' ? '📄 File' : message.content)
            : 'New message';

          updated[existingIndex] = {
            ...updated[existingIndex],
            lastMessage: lastMessageText,
            lastMessageAt: message.createdAt || message.timestamp || new Date().toISOString(),
            unreadCount: (updated[existingIndex].unreadCount || 0) + 1
          };
          // Move to top
          const [conv] = updated.splice(existingIndex, 1);
          return [conv, ...updated];
        }
        return prev;
      });

      // Increment unread count if message is from someone else
      if (message.senderId !== user?.id && message.senderId?._id !== user?.id) {
        setUnreadCount(prev => prev + 1);
      }
    };

    // User typing
    const handleUserTyping = (data) => {
      if (data.isTyping) {
        setTypingUsers(prev => ({
          ...prev,
          [data.conversationId]: data.userId
        }));
      } else {
        setTypingUsers(prev => {
          const updated = { ...prev };
          delete updated[data.conversationId];
          return updated;
        });
      }
    };

    // Messages read
    const handleMessagesRead = (data) => {
      if (data.conversationId) {
        setConversations(prev => prev.map(conv => {
          if (conv.id?.toString() === data.conversationId?.toString() ||
              conv._id?.toString() === data.conversationId?.toString()) {
            return { ...conv, unreadCount: 0 };
          }
          return conv;
        }));
      }
    };

    // Reaction added
    const handleReactionAdded = (data) => {
      if (data.messageId) {
        setMessageReactions(prev => ({
          ...prev,
          [data.messageId]: data.reactions || []
        }));
      }
    };

    // Reaction removed
    const handleReactionRemoved = (data) => {
      if (data.messageId) {
        setMessageReactions(prev => ({
          ...prev,
          [data.messageId]: data.reactions || []
        }));
      }
    };

    // Connection status
    const handleDisconnected = () => {
      setSocketConnected(false);
    };

    // Register listeners
    socketService.on('new_message', handleNewMessage);
    socketService.on('message_notification', handleNewMessage);
    socketService.on('user_typing', handleUserTyping);
    socketService.on('messages_read', handleMessagesRead);
    socketService.on('message_read', handleMessagesRead);
    socketService.on('reaction_added', handleReactionAdded);
    socketService.on('reaction_removed', handleReactionRemoved);
    socketService.on('disconnected', handleDisconnected);

    // Store for cleanup
    listenersRef.current = [
      { event: 'new_message', handler: handleNewMessage },
      { event: 'message_notification', handler: handleNewMessage },
      { event: 'user_typing', handler: handleUserTyping },
      { event: 'messages_read', handler: handleMessagesRead },
      { event: 'message_read', handler: handleMessagesRead },
      { event: 'reaction_added', handler: handleReactionAdded },
      { event: 'reaction_removed', handler: handleReactionRemoved },
      { event: 'disconnected', handler: handleDisconnected },
    ];
  }, [user?.id]);

  // Initialize on auth change
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadData();
      connectSocket();
      setupSocketListeners();
    } else {
      // Clear state on logout
      setConversations([]);
      setContacts([]);
      setUnreadCount(0);
      setSocketConnected(false);
      setMessageReactions({});
      socketService.disconnect();
    }

    // Cleanup on unmount
    return () => {
      listenersRef.current.forEach(({ event, handler }) => {
        socketService.off(event, handler);
      });
    };
  }, [isAuthenticated, user?.id, loadData, connectSocket, setupSocketListeners]);

  // Create or get conversation with a user
  const createConversation = useCallback(async (otherUserId, otherUserType = 'staff') => {
    try {
      const conversation = await chatService.createConversation(
        user.id,
        'staff',
        otherUserId,
        otherUserType
      );

      // Add to conversations if new
      setConversations(prev => {
        const exists = prev.find(c =>
          c.id?.toString() === conversation.id?.toString() ||
          c._id?.toString() === conversation._id?.toString()
        );
        if (!exists) {
          return [conversation, ...prev];
        }
        return prev;
      });

      return conversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }, [user?.id]);

  // Send a message (supports text, image, voice, file)
  const sendMessage = useCallback(async (
    conversationId,
    content,
    type = 'text',
    replyTo = null,
    fileName = null,
    duration = 0,
    fileUrl = null
  ) => {
    const messageData = {
      conversationId,
      senderId: user.id,
      senderType: 'staff',
      content,
      type,
      replyTo
    };

    // Add file data for non-text messages
    if (type === 'image' && fileUrl) {
      messageData.fileUrl = fileUrl;
      messageData.content = content || '';
    }
    if (type === 'voice' && fileUrl) {
      messageData.fileUrl = fileUrl;
      messageData.duration = duration;
      messageData.content = '';
    }
    if (type === 'file') {
      messageData.fileUrl = fileUrl;
      messageData.fileName = fileName;
      messageData.content = content || fileName || '';
    }

    try {
      // Try socket first
      if (socketService.isConnected()) {
        socketService.sendMessage(messageData);
      } else {
        // Fallback to REST
        await chatService.sendMessage(messageData);
      }

      // Update conversation locally
      setConversations(prev => {
        const index = prev.findIndex(c =>
          c.id?.toString() === conversationId?.toString() ||
          c._id?.toString() === conversationId?.toString()
        );
        if (index >= 0) {
          const updated = [...prev];
          const lastMessageText = type === 'image' ? '📷 Image' :
                                  type === 'voice' ? '🎤 Voice message' :
                                  type === 'file' ? '📄 File' : content;

          updated[index] = {
            ...updated[index],
            lastMessage: lastMessageText,
            lastMessageAt: new Date().toISOString()
          };
          // Move to top
          const [conv] = updated.splice(index, 1);
          return [conv, ...updated];
        }
        return prev;
      });

      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [user?.id]);

  // Add reaction to a message
  const addReaction = useCallback(async (conversationId, messageId, emoji) => {
    try {
      await chatService.addReaction(conversationId, messageId, emoji, user.id);

      // Optimistic update
      setMessageReactions(prev => ({
        ...prev,
        [messageId]: [...(prev[messageId] || []), {
          emoji,
          userId: user.id,
          createdAt: new Date().toISOString()
        }]
      }));
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }, [user?.id]);

  // Remove reaction from a message
  const removeReaction = useCallback(async (conversationId, messageId, emoji) => {
    try {
      await chatService.removeReaction(conversationId, messageId, emoji, user.id);

      // Optimistic update
      setMessageReactions(prev => ({
        ...prev,
        [messageId]: (prev[messageId] || []).filter(
          r => !(r.emoji === emoji && r.userId?.toString() === user?.id?.toString())
        )
      }));
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  }, [user?.id]);

  // Mark conversation as read
  const markAsRead = useCallback(async (conversationId) => {
    try {
      await chatService.markAsRead(conversationId, user.id);

      // Update local state
      setConversations(prev => prev.map(conv => {
        if (conv.id?.toString() === conversationId?.toString() ||
            conv._id?.toString() === conversationId?.toString()) {
          const wasUnread = conv.unreadCount || 0;
          setUnreadCount(prev => Math.max(0, prev - wasUnread));
          return { ...conv, unreadCount: 0 };
        }
        return conv;
      }));

      // Notify via socket
      if (socketService.isConnected()) {
        socketService.markAsRead(null, conversationId);
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [user?.id]);

  // Send typing indicator
  const sendTyping = useCallback((conversationId, isTyping) => {
    if (socketService.isConnected()) {
      socketService.sendTyping(conversationId, isTyping);
    }
  }, []);

  // Join conversation room
  const joinConversation = useCallback((conversationId) => {
    if (socketService.isConnected()) {
      socketService.joinConversation(conversationId);
    }
  }, []);

  // Leave conversation room
  const leaveConversation = useCallback((conversationId) => {
    if (socketService.isConnected()) {
      socketService.leaveConversation(conversationId);
    }
  }, []);

  // Delete a conversation (removes from current user's view)
  const deleteConversation = useCallback(async (conversationId) => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };
    try {
      await chatService.deleteConversation(conversationId, user.id);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return { success: false, error: error.message };
    }
  }, [user?.id]);

  // Refresh conversations
  const refreshConversations = useCallback(async () => {
    if (!user?.id) return;

    try {
      const convs = await chatService.getConversations(user.id, 'staff');
      setConversations(convs || []);

      const unread = await chatService.getUnreadCount(user.id, 'staff');
      setUnreadCount(unread?.count || 0);
    } catch (error) {
      console.error('Error refreshing conversations:', error);
    }
  }, [user?.id]);

  // Get display name for a conversation
  const getConversationName = useCallback((conversation) => {
    if (!conversation || !user) return 'Unknown';

    // If it's a group chat
    if (conversation.isGroup) {
      return conversation.name || 'Group Chat';
    }

    // Find the other participant
    const otherParticipant = conversation.participants?.find(
      p => p.userId?.toString() !== user?.id?.toString() &&
           p.userId?._id?.toString() !== user?.id?.toString()
    );

    if (otherParticipant) {
      return otherParticipant.name || 'Unknown User';
    }

    return 'Unknown';
  }, [user]);

  // Get avatar for a conversation
  const getConversationAvatar = useCallback((conversation) => {
    if (!conversation || !user) return null;

    // If it's a group chat
    if (conversation.isGroup) {
      return conversation.avatar || null;
    }

    // Find the other participant
    const otherParticipant = conversation.participants?.find(
      p => p.userId?.toString() !== user?.id?.toString() &&
           p.userId?._id?.toString() !== user?.id?.toString()
    );

    return otherParticipant?.avatar || otherParticipant?.photo || null;
  }, [user]);

  const value = {
    // State
    conversations,
    contacts,
    unreadCount,
    loading,
    socketConnected,
    typingUsers,
    messageReactions,

    // Actions
    createConversation,
    deleteConversation,
    sendMessage,
    markAsRead,
    sendTyping,
    joinConversation,
    leaveConversation,
    refreshConversations,
    loadData,
    addReaction,
    removeReaction,

    // Helpers
    getConversationName,
    getConversationAvatar,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;
