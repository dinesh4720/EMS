import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export function useConversationManager({ chatService, socketService, user, staff, students, setMessages, setOnlineUsers, scrollToBottom, setShowMessageSearch }) {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [contactSearch, setContactSearch] = useState("");

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
      console.error('Error loading contacts:', error);
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
      console.error('Error loading conversations:', error);
    }
  }, [chatService, user?.id, setOnlineUsers]);

  const handleSelectConversation = useCallback(async (conversation) => {
    try {
      setSelectedConversation(conversation);
      setShowMessageSearch(false);

      // Load messages
      const msgs = await chatService.getMessages(conversation.id);
      setMessages(msgs);

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
      console.error('Error selecting conversation:', error);
    }
  }, [chatService, socketService, user?.id, setMessages, setShowMessageSearch, scrollToBottom]);

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
      console.error('Error starting conversation:', error);
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
    showNewChatModal,
    setShowNewChatModal,
    contactSearch,
    setContactSearch,
  };
}
