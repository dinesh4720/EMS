import { useState, useCallback, useRef } from 'react';
import logger from '../../../utils/logger';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const MESSAGE_PAGE_SIZE = 50;

export function useConversationManager({ chatService, socketService, user, staff, students, setMessages, setOnlineUsers, scrollToBottom, setShowMessageSearch }) {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  // Refs mirror the latest values so loadOlderMessages can read them without
  // depending on stale closures when fired from an IntersectionObserver.
  const oldestCursorRef = useRef(null);
  const loadMoreInFlightRef = useRef(false);

  const loadContacts = useCallback(() => {
    try {
      const staffContacts = staff
        .filter(s => s.id !== user?.id)
        .map(s => ({
          id: s.id,
          name: s.name,
          role: s.role,
          avatar: s.photo,
          type: 'staff'
        }));

      const studentContacts = students.map(s => ({
        id: s.id,
        name: s.name,
        role: s.class || 'Student',
        avatar: s.photo,
        type: 'student'
      }));

      setContacts([...staffContacts, ...studentContacts]);
    } catch (error) {
      logger.error('Error loading contacts:', error);
    }
  }, [staff, students, user?.id]);

  const loadConversations = useCallback(async () => {
    try {
      const convs = await chatService.getConversations();
      setConversations(convs);

      // Update online status
      const onlineUserIds = convs
        .filter(c => c.otherParticipant?.online)
        .map(c => c.otherParticipant.userId);
      setOnlineUsers(new Set(onlineUserIds));
    } catch (error) {
      logger.error('Error loading conversations:', error);
    }
  }, [chatService, user?.id, setOnlineUsers]);

  const handleSelectConversation = useCallback(async (conversation) => {
    try {
      setSelectedConversation(conversation);
      setShowMessageSearch(false);

      // PAG-06: load the latest page and seed the older-pages cursor so the
      // chat view can scroll back further than the first 50 messages.
      const msgs = await chatService.getMessages(conversation.id, MESSAGE_PAGE_SIZE, null);
      setMessages(msgs);
      const ordered = Array.isArray(msgs) ? [...msgs] : [];
      ordered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      oldestCursorRef.current = ordered[0]?.createdAt || null;
      setHasMoreOlder(Array.isArray(msgs) && msgs.length === MESSAGE_PAGE_SIZE);

      // Join conversation room via socket
      if (socketService.isConnected()) {
        socketService.joinConversation(conversation.id);
        socketService.markAsRead(null, conversation.id);
      } else {
        // Mark as read via REST API
        await chatService.markAsRead(conversation.id);
      }

      // Scroll to bottom
      setTimeout(() => scrollToBottom(), 100);

      // Update conversation unread count
      setConversations(prev => prev.map(c =>
        c.id === conversation.id ? { ...c, unreadCount: 0 } : c
      ));
    } catch (error) {
      logger.error('Error selecting conversation:', error);
    }
  }, [chatService, socketService, user?.id, setMessages, setShowMessageSearch, scrollToBottom]);

  // PAG-06: fetch the next older page of messages and prepend it to the list.
  // The chat view triggers this when the user scrolls near the top.
  const loadOlderMessages = useCallback(async () => {
    if (loadMoreInFlightRef.current) return;
    const cursor = oldestCursorRef.current;
    if (!cursor || !selectedConversation?.id) return;
    loadMoreInFlightRef.current = true;
    setLoadingOlder(true);
    try {
      const older = await chatService.getMessages(
        selectedConversation.id,
        MESSAGE_PAGE_SIZE,
        cursor
      );
      const ordered = Array.isArray(older) ? [...older] : [];
      ordered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      if (ordered.length === 0) {
        setHasMoreOlder(false);
        return;
      }
      oldestCursorRef.current = ordered[0]?.createdAt || oldestCursorRef.current;
      setHasMoreOlder(ordered.length === MESSAGE_PAGE_SIZE);
      setMessages(prev => {
        // Drop any optimistic messages (no _id/id) so they re-sort to the
        // correct chronological slot after the prepend.
        const optimistic = prev.filter(m => !m._id && !m.id);
        const seen = new Set();
        const merged = [...ordered, ...prev.filter(m => {
          const id = m._id || m.id;
          if (!id) return false;
          if (seen.has(String(id))) return false;
          seen.add(String(id));
          return true;
        })];
        merged.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        // Re-attach any optimistic messages at their original timestamp slot.
        return [...merged, ...optimistic];
      });
    } catch (error) {
      logger.error('Error loading older messages:', error);
    } finally {
      loadMoreInFlightRef.current = false;
      setLoadingOlder(false);
    }
  }, [chatService, selectedConversation?.id, setMessages]);

  const startNewConversation = useCallback(async (contact) => {
    try {
      const conversation = await chatService.createConversation(
        contact.id,
        contact.type
      );

      setShowNewChatModal(false);
      setContactSearch("");

      // Ensure conversation has otherParticipant field
      if (!conversation.otherParticipant && conversation.participants) {
        conversation.otherParticipant = conversation.participants.find(
          p => p.userId !== user.id
        );
      }

      // Add to conversations if not exists
      setConversations(prev => {
        if (!prev.find(c => c.id === conversation.id)) {
          return [conversation, ...prev];
        }
        return prev;
      });

      // Select conversation and join room
      handleSelectConversation(conversation);

      // Ensure we join the Socket.IO room
      if (socketService.isConnected()) {
        socketService.joinConversation(conversation.id);
      }
    } catch (error) {
      logger.error('Error starting conversation:', error);
      toast.error(t('messaging.chat.startFailed', 'Failed to start conversation'));
    }
  }, [chatService, socketService, user?.id, handleSelectConversation, t]);

  return {
    contacts,
    conversations,
    setConversations,
    selectedConversation,
    setSelectedConversation,
    loadContacts,
    loadConversations,
    handleSelectConversation,
    startNewConversation,
    loadOlderMessages,
    loadingOlder,
    hasMoreOlder,
    showNewChatModal,
    setShowNewChatModal,
    contactSearch,
    setContactSearch,
  };
}
