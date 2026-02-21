import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';
import CONFIG from '../config';
import api from '../services/api';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize socket connection
  useEffect(() => {
    if (user && isAuthenticated) {
      initializeSocket();
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, isAuthenticated]);

  const initializeSocket = () => {
    try {
      // Disconnect existing socket if any
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      const newSocket = io(CONFIG.SOCKET_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        setConnected(true);
        // Authenticate with the socket
        newSocket.emit('authenticate', {
          userId: user.id,
          userType: 'parent',
        });
      });

      newSocket.on('authenticated', () => {
        console.log('Socket authenticated');
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      newSocket.on('new_message', (message) => {
        handleNewMessage(message);
      });

      newSocket.on('message_edited', (data) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.messageId ? { ...msg, content: data.content, isEdited: true } : msg
          )
        );
      });

      newSocket.on('user_status', (data) => {
        // Update participant online status in conversations
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.otherParticipant?.userId === data.userId) {
              return {
                ...conv,
                otherParticipant: {
                  ...conv.otherParticipant,
                  online: data.status === 'online',
                  lastSeen: data.lastSeen,
                },
              };
            }
            return conv;
          })
        );
      });

      socketRef.current = newSocket;
    } catch (error) {
      console.error('Error initializing socket:', error);
    }
  };

  const handleNewMessage = (message) => {
    // Add to current chat if it matches
    if (currentChat && message.conversationId === currentChat.id) {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });

      // Mark as read since we're in the conversation
      markAsRead(currentChat.id);
    } else {
      // Update unread count for background conversations
      if (message.senderId !== user?.id) {
        setUnreadCount((prev) => prev + 1);
      }
    }

    // Update conversation list
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === message.conversationId
          ? {
              ...conv,
              lastMessage: {
                content: message.content || message.text,
                timestamp: message.createdAt || message.timestamp,
                senderId: message.senderId,
              },
              unreadCount:
                currentChat?.id === conv.id
                  ? 0
                  : (conv.unreadCount || 0) + (message.senderId !== user?.id ? 1 : 0),
            }
          : conv
      )
    );
  };

  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const response = await api.get(CONFIG.API_ENDPOINTS.CHAT_LIST);
      if (response.success && response.data) {
        const convs = response.data.map((conv) => ({
          id: conv.id,
          type: conv.type,
          participant: conv.otherParticipant
            ? {
                id: conv.otherParticipant.userId,
                name: conv.otherParticipant.name,
                role: conv.otherParticipant.role || conv.otherParticipant.userType || 'User',
                avatar: conv.otherParticipant.avatar,
                online: conv.otherParticipant.online,
                lastSeen: conv.otherParticipant.lastSeen,
                userType: conv.otherParticipant.userType,
              }
            : null,
          otherParticipant: conv.otherParticipant,
          participants: conv.participants,
          groupName: conv.groupName,
          lastMessage: conv.lastMessage?.content || '',
          lastMessageTime: conv.lastMessage?.timestamp || conv.updatedAt,
          unread: conv.unreadCount || 0,
        }));

        setConversations(convs);

        // Calculate total unread
        const totalUnread = convs.reduce((acc, conv) => acc + (conv.unread || 0), 0);
        setUnreadCount(totalUnread);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      // If API fails, keep existing conversations
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchMessages = useCallback(
    async (conversationId, before = null) => {
      if (!conversationId) return;
      setLoading(true);
      try {
        const params = { limit: 50 };
        if (before) params.before = before;

        const response = await api.get(
          `${CONFIG.API_ENDPOINTS.CHAT_MESSAGES}/${conversationId}/messages`,
          params
        );

        if (response.success && response.data) {
          const msgs = response.data.map((msg) => ({
            id: msg.id,
            conversationId: msg.conversationId,
            senderId: msg.senderId,
            senderName: msg.senderName,
            senderAvatar: msg.senderAvatar,
            receiverId: msg.receiverId,
            receiverName: msg.receiverName,
            text: msg.content,
            content: msg.content,
            type: msg.type,
            fileUrl: msg.fileUrl,
            fileName: msg.fileName,
            status: msg.status,
            timestamp: msg.createdAt,
            createdAt: msg.createdAt,
            replyTo: msg.replyTo,
            pinned: msg.pinned,
            reactions: msg.reactions,
            isEdited: msg.isEdited,
            forwardedFrom: msg.forwardedFrom,
          }));

          if (before) {
            // Prepend older messages
            setMessages((prev) => [...msgs, ...prev]);
          } else {
            setMessages(msgs);
          }
        }

        // Mark as read
        await markAsRead(conversationId);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const sendMessage = useCallback(
    async (text, attachments = []) => {
      if (!currentChat) return null;

      const messagePayload = {
        conversationId: currentChat.id,
        content: text,
        type: attachments.length > 0 ? 'file' : 'text',
      };

      // If it's a new conversation (no id yet), include receiver info
      if (!currentChat.id && currentChat.participant) {
        messagePayload.receiverId = currentChat.participant.id;
        messagePayload.receiverModel = currentChat.participant.userType === 'parent' ? 'parent' : 'staff';
        delete messagePayload.conversationId;
      }

      try {
        const response = await api.post('/api/parent/messages', messagePayload);

        if (response.success && response.data) {
          const newMessage = {
            id: response.data.id,
            conversationId: response.data.conversationId,
            senderId: response.data.senderId || user?.id,
            senderName: response.data.senderName || user?.name,
            text: response.data.content,
            content: response.data.content,
            type: response.data.type,
            status: response.data.status,
            timestamp: response.data.createdAt,
            createdAt: response.data.createdAt,
          };

          setMessages((prev) => [...prev, newMessage]);

          // Update conversation list
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === (response.data.conversationId || currentChat.id)
                ? {
                    ...conv,
                    lastMessage: text,
                    lastMessageTime: newMessage.createdAt,
                  }
                : conv
            )
          );

          // Emit via socket for real-time delivery
          if (socketRef.current && connected) {
            socketRef.current.emit('send_message', {
              ...newMessage,
              conversationId: response.data.conversationId || currentChat.id,
            });
          }

          return newMessage;
        }
      } catch (error) {
        console.error('Error sending message:', error);
        // Optimistic: add message locally even if API fails
        const fallbackMessage = {
          id: Date.now().toString(),
          conversationId: currentChat.id,
          senderId: user?.id,
          senderName: user?.name,
          text,
          content: text,
          type: 'text',
          status: 'pending',
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, fallbackMessage]);
        return fallbackMessage;
      }

      return null;
    },
    [currentChat, user, connected]
  );

  const markAsRead = async (conversationId) => {
    if (!conversationId) return;
    try {
      await api.put(`/api/parent/messages/${conversationId}/read`, {});

      // Update local unread count
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === conversationId) {
            const prevUnread = conv.unread || 0;
            setUnreadCount((count) => Math.max(0, count - prevUnread));
            return { ...conv, unread: 0 };
          }
          return conv;
        })
      );
    } catch (error) {
      // Silently fail - read receipts are not critical
    }
  };

  const selectConversation = (conversation) => {
    setCurrentChat(conversation);
    if (conversation) {
      // Join socket room for this conversation
      if (socketRef.current && connected) {
        socketRef.current.emit('join_conversation', {
          conversationId: conversation.id,
        });
      }
      fetchMessages(conversation.id);
    } else {
      setMessages([]);
    }
  };

  const value = {
    conversations,
    currentChat,
    messages,
    connected,
    loading,
    unreadCount,
    fetchConversations,
    fetchMessages,
    sendMessage,
    selectConversation,
    markAsRead,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;
