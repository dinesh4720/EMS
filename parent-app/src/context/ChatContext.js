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
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Keep refs for values used inside socket callbacks to avoid stale closures
  const currentChatRef = useRef(currentChat);
  const userRef = useRef(user);

  useEffect(() => {
    currentChatRef.current = currentChat;
  }, [currentChat]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Initialize socket connection
  useEffect(() => {
    if (user && isAuthenticated) {
      initializeSocket();
      fetchConversations();
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?.id, isAuthenticated]); // depend on user.id not whole user object

  const initializeSocket = () => {
    try {
      // Disconnect existing socket cleanly
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
      }

      const newSocket = io(CONFIG.SOCKET_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      newSocket.on('connect', () => {
        setConnected(true);
        newSocket.emit('authenticate', {
          userId: userRef.current?.id,
          userType: 'parent',
        });
      });

      newSocket.on('authenticated', () => {
        // Re-join current conversation room if any
        const chat = currentChatRef.current;
        if (chat?.id) {
          newSocket.emit('join_conversation', { conversationId: chat.id });
        }
      });

      newSocket.on('disconnect', () => {
        setConnected(false);
      });

      newSocket.on('new_message', (message) => {
        // Always use the ref values for fresh state
        handleNewMessage(message, currentChatRef.current, userRef.current);
      });

      newSocket.on('message_edited', (data) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.messageId ? { ...msg, content: data.content, text: data.content, isEdited: true } : msg
          )
        );
      });

      newSocket.on('user_status', (data) => {
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
                participant: conv.participant?.id === data.userId
                  ? { ...conv.participant, online: data.status === 'online', lastSeen: data.lastSeen }
                  : conv.participant,
              };
            }
            return conv;
          })
        );
      });

      // Confirmation that the room join was acknowledged by server
      newSocket.on('joined_conversation', (data) => {
      });

      socketRef.current = newSocket;
    } catch (error) {
      console.error('Error initializing chat socket:', error);
    }
  };

  // Pure function — receives currentChat and user as params to avoid stale closures
  const handleNewMessage = (message, chat, currentUser) => {
    if (chat && message.conversationId === chat.id) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      markAsRead(chat.id);
    } else {
      if (message.senderId !== currentUser?.id) {
        setUnreadCount((prev) => prev + 1);
      }
    }

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
                chat?.id === conv.id
                  ? 0
                  : (conv.unreadCount || 0) + (message.senderId !== currentUser?.id ? 1 : 0),
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
        const totalUnread = convs.reduce((acc, conv) => acc + (conv.unread || 0), 0);
        setUnreadCount(totalUnread);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchMessages = useCallback(
    async (conversationId, before = null) => {
      if (!conversationId) return;
      if (before) {
        // Loading older messages — use separate flag
        setMessagesLoading(true);
      } else {
        setLoading(true);
      }
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

          // Indicate if there are more (full page = more likely available)
          setHasMoreMessages(msgs.length === 50);

          if (before) {
            setMessages((prev) => [...msgs, ...prev]);
          } else {
            setMessages(msgs);
          }
        }

        await markAsRead(conversationId);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
        setMessagesLoading(false);
      }
    },
    []
  );

  // Load older messages (pagination)
  const loadMoreMessages = useCallback(() => {
    if (!currentChatRef.current || messages.length === 0 || !hasMoreMessages) return;
    const oldest = messages[0];
    fetchMessages(currentChatRef.current.id, oldest.createdAt || oldest.timestamp);
  }, [messages, hasMoreMessages, fetchMessages]);

  const sendMessage = useCallback(
    async (text, attachments = []) => {
      const chat = currentChatRef.current;
      if (!chat) return null;

      const messagePayload = {
        conversationId: chat.id,
        content: text,
        type: attachments.length > 0 ? 'file' : 'text',
      };

      if (!chat.id && chat.participant) {
        messagePayload.receiverId = chat.participant.id;
        messagePayload.receiverModel = chat.participant.userType === 'parent' ? 'parent' : 'staff';
        delete messagePayload.conversationId;
      }

      // Optimistic message with pending status
      const optimisticId = `pending_${Date.now()}`;
      const optimisticMessage = {
        id: optimisticId,
        conversationId: chat.id,
        senderId: userRef.current?.id,
        senderName: userRef.current?.name,
        text,
        content: text,
        type: 'text',
        status: 'pending',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      try {
        const response = await api.post('/api/parent/messages', messagePayload);

        if (response.success && response.data) {
          const confirmedMessage = {
            id: response.data.id,
            conversationId: response.data.conversationId,
            senderId: response.data.senderId || userRef.current?.id,
            senderName: response.data.senderName || userRef.current?.name,
            text: response.data.content,
            content: response.data.content,
            type: response.data.type,
            status: response.data.status || 'sent',
            timestamp: response.data.createdAt,
            createdAt: response.data.createdAt,
          };

          // Replace optimistic message with confirmed one
          setMessages((prev) =>
            prev.map((m) => (m.id === optimisticId ? confirmedMessage : m))
          );

          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === (response.data.conversationId || chat.id)
                ? { ...conv, lastMessage: text, lastMessageTime: confirmedMessage.createdAt }
                : conv
            )
          );

          // Emit via socket for real-time delivery to recipient
          if (socketRef.current?.connected) {
            socketRef.current.emit('send_message', {
              ...confirmedMessage,
              conversationId: response.data.conversationId || chat.id,
            });
          }

          return confirmedMessage;
        } else {
          // Mark optimistic message as failed
          setMessages((prev) =>
            prev.map((m) => (m.id === optimisticId ? { ...m, status: 'failed' } : m))
          );
        }
      } catch (error) {
        console.error('Error sending message:', error);
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticId ? { ...m, status: 'failed' } : m))
        );
      }

      return null;
    },
    []
  );

  const markAsRead = async (conversationId) => {
    if (!conversationId) return;
    try {
      await api.put(`/api/parent/messages/${conversationId}/read`, {});
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
    } catch {
      // Read receipts are non-critical
    }
  };

  const selectConversation = useCallback((conversation) => {
    setCurrentChat(conversation);
    if (conversation) {
      if (socketRef.current?.connected) {
        socketRef.current.emit('join_conversation', { conversationId: conversation.id });
      }
      fetchMessages(conversation.id);
    } else {
      setMessages([]);
      setHasMoreMessages(false);
    }
  }, [fetchMessages]);

  const value = {
    conversations,
    currentChat,
    messages,
    connected,
    loading,
    messagesLoading,
    hasMoreMessages,
    unreadCount,
    fetchConversations,
    fetchMessages,
    loadMoreMessages,
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
