import { useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

export function useSocketListeners({ socketService, user, selectedConversationRef, setMessages, setConversations, setPinnedMessages, onNewMessageReceived, scrollToBottom, pendingSocketMessagesRef }) {
  const [socketConnected, setSocketConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const wasDisconnectedRef = useRef(false);

  const handleNewMessage = useCallback((message) => {
    // Use ref to get current conversation (avoids closure issue)
    const currentConversation = selectedConversationRef.current;

    // Try both id and _id properties
    const currentConvId = currentConversation?.id || currentConversation?._id;

    // If message is for current conversation, add it
    // Convert both to strings for comparison to handle ObjectId vs string
    if (String(message.conversationId) === String(currentConvId)) {
      setMessages(prev => {
        // Remove optimistic messages from the current user
        const filtered = prev.filter(m => {
          if (!m._isOptimistic) return true;
          if (String(m.senderId) !== String(message.senderId)) return true;

          // For voice/audio messages, match by fileUrl
          if (message.type === 'audio' && m.type === 'audio') {
            if (m.fileUrl && message.fileUrl && m.fileUrl === message.fileUrl) {
              pendingSocketMessagesRef?.current?.delete(m.id);
              return false;
            }
            // Also match if both have no content (empty voice messages)
            if (!m.content && !message.content && m._originalContent === '') {
              pendingSocketMessagesRef?.current?.delete(m.id);
              return false;
            }
            return true;
          }

          // For other message types, match by content
          if (m.content === message.content && m._originalContent === message.content) {
            pendingSocketMessagesRef?.current?.delete(m.id);
            return false;
          }
          return true;
        });

        // Add new message if not already exists, maintaining chronological order
        if (!filtered.find(m => String(m.id) === String(message.id))) {
          const msgTime = new Date(message.createdAt || message.timestamp).getTime();
          // Find insertion index to keep messages sorted by createdAt
          let insertIdx = filtered.length;
          for (let i = filtered.length - 1; i >= 0; i--) {
            const t = new Date(filtered[i].createdAt || filtered[i].timestamp).getTime();
            if (t <= msgTime) { insertIdx = i + 1; break; }
            if (i === 0) insertIdx = 0;
          }
          const result = [...filtered];
          result.splice(insertIdx, 0, message);
          return result;
        }
        return filtered;
      });

      if (scrollToBottom) scrollToBottom();

      // Mark as read if conversation is open and not sent by me
      if (socketService.isConnected() && String(message.senderId) !== String(user?.id)) {
        socketService.markAsRead(message.id, message.conversationId);
      }

      return true; // Message was for current conversation
    }

    return false; // Message was for a different conversation
  }, [socketService, user, selectedConversationRef, setMessages, scrollToBottom, pendingSocketMessagesRef]);

  const setupSocketListeners = useCallback(() => {
    // Connection status listeners
    const handleDisconnected = () => {
      wasDisconnectedRef.current = true;
      setSocketConnected(false);
      toast.error('Connection lost — messages will be sent via fallback', {
        id: 'socket-status',
        duration: 4000,
      });
    };

    const handleAuthenticated = () => {
      setSocketConnected(true);
      if (wasDisconnectedRef.current) {
        wasDisconnectedRef.current = false;
        toast.success('Reconnected', { id: 'socket-status', duration: 2000 });
      }
    };

    const handleReconnectFailed = () => {
      setSocketConnected(false);
      toast.error('Unable to reconnect — using offline mode', {
        id: 'socket-status',
        duration: 5000,
      });
    };

    // New message received
    const handleNewMsg = (data) => {
      handleNewMessage(data.message);
      if (onNewMessageReceived) onNewMessageReceived();
    };

    // Typing indicator
    const handleTyping = (data) => {
      const currentConversation = selectedConversationRef.current;
      if (data.conversationId === currentConversation?.id) {
        if (data.isTyping) {
          setTypingUsers(prev => new Set([...prev, data.userId]));
        } else {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.userId);
            return newSet;
          });
        }
      }
    };

    // User status
    const handleUserStatus = (data) => {
      if (data.status === 'online') {
        setOnlineUsers(prev => new Set([...prev, data.userId]));
      } else {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }

      setConversations(prev => prev.map(conv => {
        if (conv.otherParticipant?.userId === data.userId) {
          return {
            ...conv,
            otherParticipant: {
              ...conv.otherParticipant,
              online: data.status === 'online',
              lastSeen: data.lastSeen
            }
          };
        }
        return conv;
      }));
    };

    // Message read
    const handleMessageRead = (data) => {
      setMessages(prev => prev.map(msg =>
        msg.id === data.messageId
          ? { ...msg, status: 'read', readAt: data.readAt }
          : msg
      ));
    };

    // Messages read (bulk)
    const handleMessagesRead = (data) => {
      const currentConversation = selectedConversationRef.current;
      if (data.conversationId === currentConversation?.id) {
        setMessages(prev => prev.map(msg =>
          msg.senderId === user.id
            ? { ...msg, status: 'read', readAt: new Date() }
            : msg
        ));
      }
    };

    // Message pinned/unpinned
    const handleMessagePinned = (data) => {
      setMessages(prev => {
        const updated = prev.map(msg =>
          msg.id === data.messageId
            ? { ...msg, pinned: data.pinned }
            : msg
        );

        setPinnedMessages(pinnedPrev => {
          if (data.pinned) {
            const msgToAdd = updated.find(m => m.id === data.messageId);
            if (msgToAdd && !pinnedPrev.find(pm => pm.id === data.messageId)) {
              return [...pinnedPrev, { ...msgToAdd, pinned: true }];
            }
            return pinnedPrev;
          } else {
            return pinnedPrev.filter(pm => pm.id !== data.messageId);
          }
        });

        return updated;
      });
    };

    // Message reacted
    const handleMessageReacted = (data) => {
      setMessages(prev => prev.map(msg =>
        msg.id === data.messageId
          ? { ...msg, reactions: data.reactions }
          : msg
      ));
    };

    const listeners = [
      ['disconnected', handleDisconnected],
      ['authenticated', handleAuthenticated],
      ['reconnect_failed', handleReconnectFailed],
      ['new_message', handleNewMsg],
      ['user_typing', handleTyping],
      ['user_status', handleUserStatus],
      ['message_read', handleMessageRead],
      ['messages_read', handleMessagesRead],
      ['message_pinned', handleMessagePinned],
      ['message_reacted', handleMessageReacted],
    ];

    listeners.forEach(([event, handler]) => socketService.on(event, handler));

    // Return cleanup function to remove all listeners
    return () => {
      listeners.forEach(([event, handler]) => socketService.off(event, handler));
    };
  }, [socketService, user, selectedConversationRef, setMessages, setConversations, setPinnedMessages, onNewMessageReceived, handleNewMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    socketConnected,
    setSocketConnected,
    typingUsers,
    onlineUsers,
    setOnlineUsers,
    setupSocketListeners,
    handleNewMessage,
  };
}
