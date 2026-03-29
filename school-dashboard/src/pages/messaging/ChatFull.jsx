import { useState, useEffect, useRef } from "react";
import logger from "../../utils/logger";
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import socketService from "../../services/socketServiceEnhanced";
import chatService from "../../services/chatServiceEnhanced";
import { request } from "../../services/api";
import { callsApi } from "../../services/api";
import videoCallService from "../../services/videoCallService";
import toast from "react-hot-toast";
import VideoCallModal from "./components/VideoCallModal";
import ForwardModal from "./components/ForwardModal";
import ChatSidebar from "./components/ChatSidebar";
import ChatMessageList from "./components/ChatMessageList";
import ChatInputBar from "./components/ChatInputBar";
import { useVoiceRecording } from "./hooks/useVoiceRecording";
import { useVoiceMessageHandler } from "./hooks/useVoiceMessageHandler";
import { useTranslation } from 'react-i18next';

export default function ChatFull() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { staff, students } = useApp();

  // Core state
  const [contacts, setContacts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [, setOnlineUsers] = useState(new Set());

  // New chat modal state
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [contactSearch, setContactSearch] = useState("");

  // File state
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  // Reply / Forward state
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // Pinned messages state
  const [pinnedMessages, setPinnedMessages] = useState([]);

  // Edit message state
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState("");

  // Emoji picker state
  const [emojiPickerMessage, setEmojiPickerMessage] = useState(null);

  // Video call state
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [activeCall, setActiveCall] = useState(null);

  // Upload progress + delivery tracking (used by voice message handler)
  const [, setUploadProgress] = useState(0);

  // Refs
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const selectedConversationRef = useRef(null);
  const socketListenersSetupRef = useRef(false);
  // Store handler refs so we can remove them on unmount without disconnecting the socket (AP-15)
  const socketHandlersRef = useRef({});
  const messageInputRef = useRef(null);
  const pendingSocketMessagesRef = useRef(new Set());
  // Outbox queue: messages buffered while socket is disconnected (BUG-07)
  const outboxQueueRef = useRef([]);

  // Voice recording state (managed by useVoiceRecording hook)
  const voiceRecordingState = useVoiceRecording();
  const {
    isRecording, setIsRecording,
    recordingDuration, setRecordingDuration,
    mediaRecorder, setMediaRecorder,
    recordedChunks, setRecordedChunks,
    voicePreview, setVoicePreview,
    liveWaveform, setLiveWaveform,
    recordingTimerRef,
    mediaStreamRef,
    analyserRef,
    audioContextRef,
    animationFrameRef,
    recordingDurationRef,
  } = voiceRecordingState;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Update ref when selectedConversation changes
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // Load pinned messages when conversation changes or messages are loaded
  useEffect(() => {
    if (selectedConversation && messages.length > 0) {
      loadPinnedMessages();
    }
  }, [selectedConversation, messages]);

  // Initialize
  useEffect(() => {
    if (user?.id && staff && students) {
      initializeChat();
    }

    // IMPORTANT: Do NOT disconnect socket on unmount!
    // The socket is shared with ChatNotificationContext for global notifications
    // Disconnecting here would break notifications on other pages.
    // However, we must remove this component's event listeners to prevent memory leaks (AP-15).
    return () => {
      const h = socketHandlersRef.current;
      if (h.onNewMessage)     socketService.off('new_message',     h.onNewMessage);
      if (h.onUserTyping)     socketService.off('user_typing',     h.onUserTyping);
      if (h.onUserStatus)     socketService.off('user_status',     h.onUserStatus);
      if (h.onMessageRead)    socketService.off('message_read',    h.onMessageRead);
      if (h.onMessagesRead)   socketService.off('messages_read',   h.onMessagesRead);
      if (h.onMessagePinned)  socketService.off('message_pinned',  h.onMessagePinned);
      if (h.onMessageReacted) socketService.off('message_reacted', h.onMessageReacted);
      if (h.onConnected)      socketService.off('connected',       h.onConnected);
      socketHandlersRef.current = {};
      socketListenersSetupRef.current = false;
    };
  }, [user?.id, staff, students]);

  const initializeChat = async () => {
    try {
      setLoading(true);
      loadContacts();

      try {
        await socketService.connect();
        setSocketConnected(true);
        setupSocketListeners();
        await loadConversations();
      } catch (socketError) {
        console.warn('⚠️ Socket connection failed, using REST API only:', socketError);
        setSocketConnected(false);
        await loadConversations();
      }
    } catch (error) {
      logger.error('❌ Error initializing chat:', error);
      toast.error(t('toast.error.failedToLoadChatPleaseRefreshThePage'));
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    if (socketListenersSetupRef.current) return;
    socketListenersSetupRef.current = true;

    // Named handlers stored in ref so cleanup can remove them individually (AP-15)
    const onNewMessage = (data) => {
      handleNewMessage(data.message);
      loadConversations();
    };
    socketHandlersRef.current.onNewMessage = onNewMessage;
    socketService.on('new_message', onNewMessage);

    const onUserTyping = (data) => {
      if (data.conversationId === selectedConversationRef.current?.id) {
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
    socketHandlersRef.current.onUserTyping = onUserTyping;
    socketService.on('user_typing', onUserTyping);

    const onUserStatus = (data) => {
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
    socketHandlersRef.current.onUserStatus = onUserStatus;
    socketService.on('user_status', onUserStatus);

    const onMessageRead = (data) => {
      setMessages(prev => prev.map(msg =>
        msg.id === data.messageId
          ? { ...msg, status: 'read', readAt: data.readAt }
          : msg
      ));
    };
    socketHandlersRef.current.onMessageRead = onMessageRead;
    socketService.on('message_read', onMessageRead);

    const onMessagesRead = (data) => {
      if (data.conversationId === selectedConversationRef.current?.id) {
        setMessages(prev => prev.map(msg =>
          msg.senderId === user.id
            ? { ...msg, status: 'read', readAt: new Date() }
            : msg
        ));
      }
    };
    socketHandlersRef.current.onMessagesRead = onMessagesRead;
    socketService.on('messages_read', onMessagesRead);

    const onMessagePinned = (data) => {
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
    socketHandlersRef.current.onMessagePinned = onMessagePinned;
    socketService.on('message_pinned', onMessagePinned);

    const onMessageReacted = (data) => {
      setMessages(prev => prev.map(msg =>
        msg.id === data.messageId
          ? { ...msg, reactions: data.reactions }
          : msg
      ));
    };
    socketHandlersRef.current.onMessageReacted = onMessageReacted;
    socketService.on('message_reacted', onMessageReacted);

    const onConnected = () => {
      setSocketConnected(true);
      const conv = selectedConversationRef.current;
      if (conv) {
        chatService.getMessages(conv.id).then(msgs => {
          if (msgs) setMessages(msgs);
        }).catch(() => {});
      }
      loadConversations();
      // Flush outbox: send any messages buffered during disconnect (BUG-07)
      const queued = outboxQueueRef.current.splice(0);
      queued.forEach(async (queuedData) => {
        try {
          socketService.sendMessage(queuedData.messageData);
          setMessages(prev => prev.filter(m => m.id !== queuedData.tempId));
        } catch {
          // Re-queue on failure
          outboxQueueRef.current.push(queuedData);
        }
      });
    };
    socketHandlersRef.current.onConnected = onConnected;
    socketService.on('connected', onConnected);
  };

  const loadContacts = () => {
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
      logger.error('❌ Error loading contacts:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const convs = await chatService.getConversations();
      setConversations(convs);

      const onlineUserIds = convs
        .filter(c => c.otherParticipant?.online)
        .map(c => c.otherParticipant.userId);
      setOnlineUsers(new Set(onlineUserIds));
    } catch (error) {
      logger.error('❌ Error loading conversations:', error);
    }
  };

  const handleSelectConversation = async (conversation) => {
    try {
      setSelectedConversation(conversation);

      const msgs = await chatService.getMessages(conversation.id);
      setMessages(msgs);

      if (socketService.isConnected()) {
        socketService.joinConversation(conversation.id);
        socketService.markAsRead(null, conversation.id);
      } else {
        await chatService.markAsRead(conversation.id);
      }

      setTimeout(() => scrollToBottom(), 100);

      setConversations(prev => prev.map(c =>
        c.id === conversation.id ? { ...c, unreadCount: 0 } : c
      ));
    } catch (error) {
      logger.error('❌ Error selecting conversation:', error);
    }
  };

  const startNewConversation = async (contact) => {
    try {
      const conversation = await chatService.createConversation(
        contact.id,
        contact.type
      );

      setShowNewChatModal(false);
      setContactSearch("");

      if (!conversation.otherParticipant && conversation.participants) {
        conversation.otherParticipant = conversation.participants.find(
          p => p.userId !== user.id
        );
      }

      if (!conversations.find(c => c.id === conversation.id)) {
        setConversations(prev => [conversation, ...prev]);
      }

      handleSelectConversation(conversation);

      if (socketService.isConnected()) {
        socketService.joinConversation(conversation.id);
      }
    } catch (error) {
      logger.error('❌ Error starting conversation:', error);
      alert(error.message || 'Failed to start conversation');
    }
  };

  const handleNewMessage = (message) => {
    const currentConversation = selectedConversationRef.current;
    const currentConvId = currentConversation?.id || currentConversation?._id;

    if (String(message.conversationId) === String(currentConvId)) {
      setMessages(prev => {
        const filtered = prev.filter(m => {
          if (!m._isOptimistic) return true;
          if (String(m.senderId) !== String(message.senderId)) return true;

          if (message.type === 'audio' && m.type === 'audio') {
            if (m.fileUrl && message.fileUrl && m.fileUrl === message.fileUrl) {
              return false;
            }
            if (!m.content && !message.content && m._originalContent === '') {
              return false;
            }
            return true;
          }

          if (m.content === message.content && m._originalContent === message.content) {
            return false;
          }
          return true;
        });

        if (!filtered.find(m => String(m.id) === String(message.id))) {
          const updated = [...filtered, message];
          return updated.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }
        return filtered;
      });
      scrollToBottom();

      if (socketService.isConnected() && String(message.senderId) !== String(user?.id)) {
        socketService.markAsRead(message.id, message.conversationId);
      }
    } else {
      loadConversations();
    }
  };

  const handleSend = async () => {
    if (selectedFile) {
      await handleSendFile();
      return;
    }

    if (!newMessage.trim() || !selectedConversation || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      const otherParticipant = selectedConversation.otherParticipant ||
        selectedConversation.participants?.find(p => p.userId !== user?.id);

      if (!otherParticipant) {
        throw new Error('Cannot find conversation participant');
      }

      const messageData = {
        conversationId: selectedConversation.id,
        receiverId: otherParticipant.userId,
        receiverModel: otherParticipant.userType === 'staff' ? 'Staff' : 'Student',
        content: messageContent,
        type: 'text'
      };

      if (replyToMessage) {
        messageData.replyTo = replyToMessage.id;
      }

      const tempId = `temp-${Date.now()}`;
      if (socketService.isConnected()) {
        socketService.sendMessage(messageData);
        socketService.sendTyping(selectedConversation.id, false);

        const optimisticMessage = {
          id: tempId,
          ...messageData,
          senderId: user.id,
          senderName: user.name,
          status: 'sending',
          createdAt: new Date(),
          _isOptimistic: true,
          _originalContent: messageContent
        };
        setMessages(prev => [...prev, optimisticMessage]);
        scrollToBottom();
      } else {
        // Queue message for delivery when socket reconnects (BUG-07)
        const queuedMessage = {
          id: tempId,
          ...messageData,
          senderId: user.id,
          senderName: user.name,
          status: 'queued',
          createdAt: new Date(),
          _isOptimistic: true,
          _originalContent: messageContent
        };
        outboxQueueRef.current.push({ tempId, messageData });
        setMessages(prev => [...prev, queuedMessage]);
        scrollToBottom();
        toast('Message queued — will send when reconnected', { icon: '📤' });
      }

      setReplyToMessage(null);
      loadConversations();
    } catch (error) {
      logger.error('❌ Error sending message:', error);
      setNewMessage(messageContent);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!selectedConversation || !socketService.isConnected()) return;

    socketService.sendTyping(selectedConversation.id, true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketService.sendTyping(selectedConversation.id, false);
    }, 2000);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleSendFile = async () => {
    if (!selectedFile || !selectedConversation) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      setUploadingFile(true);

      const uploadResult = await chatService.uploadFile(selectedFile);

      if (!uploadResult.url) {
        throw new Error('Upload succeeded but no URL returned');
      }

      const otherParticipant = selectedConversation.otherParticipant ||
        selectedConversation.participants?.find(p => p.userId !== user?.id);

      if (!otherParticipant) {
        throw new Error('Cannot find conversation participant');
      }

      const messageData = {
        conversationId: selectedConversation.id,
        receiverId: otherParticipant.userId,
        receiverModel: otherParticipant.userType === 'staff' ? 'Staff' : 'Student',
        content: messageText || selectedFile.name,
        type: selectedFile.type.startsWith('image/') ? 'image' : selectedFile.type.startsWith('video/') ? 'video' : 'file',
        fileUrl: uploadResult.url,
        fileName: selectedFile.name,
        fileSize: selectedFile.size
      };

      if (socketService.isConnected()) {
        socketService.sendMessage(messageData);

        const optimisticMessage = {
          id: Date.now(),
          ...messageData,
          senderId: user.id,
          senderName: user.name,
          status: 'sending',
          createdAt: new Date()
        };
        setMessages(prev => [...prev, optimisticMessage]);
        setTimeout(() => scrollToBottom(), 100);
      } else {
        const sentMessage = await chatService.sendMessage({
          ...messageData,
          senderId: user.id,
          senderModel: 'Staff'
        });
        setMessages(prev => [...prev, sentMessage]);
        setTimeout(() => scrollToBottom(), 100);
      }

      setSelectedFile(null);
      setFilePreview(null);
      loadConversations();
    } catch (error) {
      logger.error('❌ Error uploading file:', error);
      alert(`Failed to upload file: ${error.message}`);
      setNewMessage(newMessage);
    } finally {
      setUploadingFile(false);
      setSending(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCancelFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Video Call Handlers
  const handleVideoCall = async (callType = 'video') => {
    if (!selectedConversation) return;

    try {
      await videoCallService.initialize(user.id);

      const response = await callsApi.initiate({
        to: {
          userId: selectedConversation.otherParticipant.userId,
          userModel: selectedConversation.otherParticipant.userType === 'staff' ? 'Staff' : 'Student'
        },
        callType
      });

      setActiveCall({
        callId: response._id,
        callerId: user.id,
        callerName: user.name,
        callType,
        status: 'initiated',
        remoteUserName: selectedConversation.otherParticipant.name
      });

      await videoCallService.startCall(
        selectedConversation.otherParticipant.userId,
        { video: callType === 'video', audio: true, callId: response._id }
      );

      setShowVideoCall(true);
      toast.success(`${callType === 'video' ? 'Video' : 'Audio'} call initiated`);
    } catch (error) {
      logger.error('Error initiating call:', error);
      toast.error(t('toast.error.failedToInitiateCall'));
    }
  };

  // Voice Recording Handlers (delegated to useVoiceMessageHandler)
  const {
    handleStartRecording,
    handleStopRecording,
    handleCancelVoicePreview,
    handleSendVoiceMessage,
  } = useVoiceMessageHandler({
    user,
    selectedConversation,
    voiceRecordingState,
    chatService,
    socketService,
    setMessages,
    setSending,
    setUploadingFile,
    setUploadProgress,
    scrollToBottom,
    loadConversations,
    pendingSocketMessagesRef,
  });

  // Unified message action handler
  const handleMessageAction = async (action, data) => {
    switch (action) {
      case 'reply':
        setReplyToMessage(data.message);
        messageInputRef.current?.focus();
        break;

      case 'forward':
        setSelectedMessage(data.message);
        setShowForwardModal(true);
        break;

      case 'edit':
        setEditingMessage(data.message);
        setEditText(data.message.content);
        break;

      case 'delete':
        handleDeleteMessage(data.message.id, false);
        break;

      case 'deleteForEveryone':
        handleDeleteMessage(data.message.id, true);
        break;

      case 'copy':
        navigator.clipboard.writeText(data.message.content);
        toast.success(t('toast.success.messageCopied'));
        break;

      case 'pin':
        handlePinMessage(data.message.id);
        break;

      case 'unpin':
        handleUnpinMessage(data.message.id);
        break;

      case 'react':
        if (!data.emoji) {
          setEmojiPickerMessage(data.message);
        } else {
          handleReaction(data.message.id, data.emoji);
          setEmojiPickerMessage(null);
        }
        break;

      case 'closeEmojiPicker':
        setEmojiPickerMessage(null);
        break;

      default:
        console.warn('Unknown action:', action);
    }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      const currentMessage = messages.find(m => m.id === messageId);
      const existingReaction = currentMessage?.reactions?.find(
        r => r.userId === user.id && r.emoji === emoji
      );
      const isRemoving = !!existingReaction;

      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          const existingReactionIndex = msg.reactions?.findIndex(
            r => r.userId === user.id && r.emoji === emoji
          );

          let newReactions = [...(msg.reactions || [])];

          if (existingReactionIndex >= 0) {
            newReactions.splice(existingReactionIndex, 1);
          } else {
            newReactions = newReactions.filter(r => r.userId !== user.id);
            newReactions.push({
              emoji,
              userId: user.id,
              userModel: 'Staff',
              createdAt: new Date()
            });
          }

          return { ...msg, reactions: newReactions };
        }
        return msg;
      }));

      await request(`/messages/${messageId}/react`, {
        method: 'POST',
        body: JSON.stringify({
          emoji,
          userId: user.id,
          userModel: 'Staff'
        })
      });

      toast.success(isRemoving ? 'Reaction removed' : 'Reaction added');
    } catch (error) {
      logger.error('Error reacting to message:', error);
      toast.error(t('toast.error.failedToReact'));
    }
  };

  const handlePinMessage = async (messageId) => {
    try {
      await request(`/messages/${messageId}/pin`, {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          pinned: true
        })
      });

      setMessages(prev => {
        const updated = prev.map(msg => {
          const matches = String(msg.id) === String(messageId);
          if (matches) {
            return { ...msg, pinned: true, pinnedBy: [...(msg.pinnedBy || []), user.id] };
          }
          return msg;
        });

        const msgToPin = updated.find(m => String(m.id) === String(messageId));
        if (msgToPin) {
          setPinnedMessages(prev => {
            if (!prev.find(pm => String(pm.id) === String(messageId))) {
              return [...prev, { ...msgToPin, pinned: true }];
            }
            return prev;
          });
        }

        return updated;
      });

      toast.success(t('toast.success.messagePinned'));
    } catch (error) {
      logger.error('❌ Error pinning message:', error);
      toast.error(error.response?.data?.error || 'Failed to pin');
    }
  };

  const handleUnpinMessage = async (messageId) => {
    try {
      await request(`/messages/${messageId}/pin`, {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          pinned: false
        })
      });

      setMessages(prev => {
        const updated = prev.map(msg => {
          const matches = String(msg.id) === String(messageId);
          if (matches) {
            return { ...msg, pinned: false, pinnedBy: (msg.pinnedBy || []).filter(id => String(id) !== String(user.id)) };
          }
          return msg;
        });

        setPinnedMessages(prev => prev.filter(pm => String(pm.id) !== String(messageId)));

        return updated;
      });

      toast.success(t('toast.success.messageUnpinned'));
    } catch (error) {
      logger.error('❌ Error unpinning message:', error);
      toast.error(error.response?.data?.error || 'Failed to unpin');
    }
  };

  const handleDeleteMessage = async (messageId, deleteForEveryone = false) => {
    try {
      await chatService.deleteMessage(messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success(deleteForEveryone ? 'Message deleted for everyone' : 'Message deleted');
    } catch (error) {
      logger.error('Error deleting message:', error);
      toast.error(t('toast.error.failedToDeleteMessage'));
    }
  };

  const handleEditMessage = async () => {
    if (!editingMessage || !editText.trim()) return;

    try {
      await request(`/messages/${editingMessage.id}/edit`, {
        method: 'PUT',
        body: JSON.stringify({
          content: editText.trim(),
          userId: user.id
        })
      });

      setMessages(prev => prev.map(msg =>
        msg.id === editingMessage.id
          ? { ...msg, content: editText.trim(), isEdited: true }
          : msg
      ));

      setEditingMessage(null);
      setEditText('');
      toast.success(t('toast.success.messageEdited'));
    } catch (error) {
      logger.error('Error editing message:', error);
      toast.error(t('toast.error.failedToEditMessage'));
    }
  };

  const loadPinnedMessages = () => {
    if (!selectedConversation) return;
    const pinned = messages.filter(msg => msg.pinned);
    setPinnedMessages(pinned);
  };

  const handleForwardSubmit = async (conversationIds) => {
    if (!selectedMessage || conversationIds.length === 0) return;

    try {
      for (const conversationId of conversationIds) {
        const conversation = conversations.find(c => c.id === conversationId);
        if (!conversation) continue;

        const otherParticipant = conversation.otherParticipant ||
          conversation.participants?.find(p => p.userId !== user?.id);

        if (!otherParticipant) continue;

        await chatService.sendMessage({
          conversationId,
          senderId: user.id,
          senderModel: 'Staff',
          receiverId: otherParticipant.userId,
          receiverModel: otherParticipant.userType === 'staff' ? 'Staff' : 'Student',
          content: selectedMessage.content,
          type: selectedMessage.type || 'text',
          fileUrl: selectedMessage.fileUrl,
          fileName: selectedMessage.fileName,
          fileSize: selectedMessage.fileSize,
          forwardedFrom: {
            messageId: selectedMessage.id,
            conversationId: selectedMessage.conversationId,
            forwardedBy: user.id,
            originalSenderName: selectedMessage.senderName
          }
        });
      }

      toast.success(`Message forwarded to ${conversationIds.length} conversation(s)`);
      setShowForwardModal(false);
      setSelectedMessage(null);
    } catch (error) {
      logger.error('Error forwarding message:', error);
      toast.error(t('toast.error.failedToForwardMessage'));
    }
  };

  if (loading) {
    return <TablePageSkeleton />;
  }

  return (
    <>
      <div className="flex gap-0 h-full w-full">
        {/* Sidebar — conversation list + new chat modal */}
        <ChatSidebar
          conversations={conversations}
          selectedConversation={selectedConversation}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectConversation={handleSelectConversation}
          socketConnected={socketConnected}
          showNewChatModal={showNewChatModal}
          onOpenNewChatModal={() => setShowNewChatModal(true)}
          onCloseNewChatModal={() => setShowNewChatModal(false)}
          contacts={contacts}
          contactSearch={contactSearch}
          onContactSearchChange={setContactSearch}
          onStartNewConversation={startNewConversation}
        />

        {/* Chat area — message list + input bar */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <ChatMessageList
            selectedConversation={selectedConversation}
            messages={messages}
            typingUsers={typingUsers}
            pinnedMessages={pinnedMessages}
            user={user}
            messagesEndRef={messagesEndRef}
            editingMessage={editingMessage}
            editText={editText}
            onEditTextChange={setEditText}
            onEditSave={handleEditMessage}
            onEditCancel={() => { setEditingMessage(null); setEditText(''); }}
            emojiPickerMessage={emojiPickerMessage}
            onMessageAction={handleMessageAction}
            onVideoCall={handleVideoCall}
            onOpenNewChatModal={() => setShowNewChatModal(true)}
          />

          {/* Only show input bar when a conversation is selected */}
          {selectedConversation && (
            <ChatInputBar
              newMessage={newMessage}
              onTyping={handleTyping}
              onSend={handleSend}
              sending={sending}
              uploadingFile={uploadingFile}
              fileInputRef={fileInputRef}
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
              filePreview={filePreview}
              onCancelFile={handleCancelFile}
              replyToMessage={replyToMessage}
              onCancelReply={() => setReplyToMessage(null)}
              voicePreview={voicePreview}
              isRecording={isRecording}
              liveWaveform={liveWaveform}
              recordingDuration={recordingDuration}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              onCancelVoicePreview={handleCancelVoicePreview}
              onSendVoiceMessage={handleSendVoiceMessage}
              messageInputRef={messageInputRef}
            />
          )}
        </div>
      </div>

      {/* Video Call Modal */}
      {showVideoCall && activeCall && (
        <VideoCallModal
          isOpen={showVideoCall}
          onClose={() => {
            setShowVideoCall(false);
            setActiveCall(null);
          }}
          call={activeCall}
          onAccept={async (callId) => {
            try {
              await callsApi.accept(callId);
              await videoCallService.acceptCall(callId);
              setActiveCall(prev => ({ ...prev, status: 'connected' }));
            } catch (error) {
              logger.error('Error accepting call:', error);
              toast.error(t('toast.error.failedToAcceptCall'));
            }
          }}
          onReject={async (callId) => {
            try {
              await callsApi.reject(callId);
              videoCallService.rejectCall(callId);
              setShowVideoCall(false);
              setActiveCall(null);
            } catch (error) {
              logger.error('Error rejecting call:', error);
              toast.error(t('toast.error.failedToRejectCall'));
            }
          }}
          onEnd={async (callId) => {
            try {
              await callsApi.end(callId, 'user_ended');
              videoCallService.endCall(callId);
              setShowVideoCall(false);
              setActiveCall(null);
              toast.success(t('toast.success.callEnded'));
            } catch (error) {
              logger.error('Error ending call:', error);
              toast.error(t('toast.error.failedToEndCall'));
            }
          }}
        />
      )}

      {/* Forward Modal */}
      <ForwardModal
        isOpen={showForwardModal}
        onClose={() => {
          setShowForwardModal(false);
          setSelectedMessage(null);
        }}
        onForward={handleForwardSubmit}
        conversations={conversations}
      />
    </>
  );
}
