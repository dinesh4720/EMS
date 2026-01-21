import { useState, useEffect, useRef } from "react";
import { Avatar, ScrollShadow, Spinner, Button, Modal, ModalContent, ModalHeader, ModalBody, Input, Progress, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { Send, Search, Phone, Video, MoreVertical, X, Plus, Users, Paperclip, Image as ImageIcon, File, Download, PushPin } from "lucide-react";
import { useApp } from "../../context/AppContext";
import socketService from "../../services/socketService";
import chatServiceEnhanced from "../../services/chatServiceEnhanced";
import api from "../../services/api";
import toast from "react-hot-toast";

// Phase 2 Components
import MessageActionsMenu from "./components/MessageActionsMenu";
import MessageReactions from "./components/MessageReactions";
import ReplyPreview from "./components/ReplyPreview";
import ForwardModal from "./components/ForwardModal";
import PinnedMessages from "./components/PinnedMessages";
import ChatSearch from "./components/ChatSearch";
import VoiceMessageRecorder from "./components/VoiceMessageRecorder";
import VideoCallModal from "./components/VideoCallModal";
import { videoCallService } from "../../services/videoCallService";
import { callsApi } from "../../services/api";

export default function ChatWithFileUpload() {
  const { user } = useApp();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [permissions, setPermissions] = useState(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [availableContacts, setAvailableContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState("");
  
  // File upload states
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  // Phase 2: Enhanced Chat states
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [activeCall, setActiveCall] = useState(null);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState("");

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (!user?.id) return;

    console.log('🚀 Initializing chat for user:', user.id, user.role);

    const loadingTimeout = setTimeout(() => {
      console.warn('⚠️ Chat loading timeout - setting loading to false');
      setLoading(false);
    }, 10000);

    loadPermissions();
    socketService.connect(user.id, 'staff');

    // Socket event listeners
    socketService.on('authenticated', () => {
      console.log('✅ Socket authenticated - loading conversations');
      loadConversations();
      clearTimeout(loadingTimeout);
    });

    socketService.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setLoading(false);
      clearTimeout(loadingTimeout);
    });

    socketService.on('new_message', (data) => {
      handleNewMessage(data.message);
    });

    socketService.on('message_notification', (data) => {
      loadConversations();
    });

    socketService.on('user_typing', (data) => {
      if (data.isTyping) {
        setTypingUsers(prev => new Set([...prev, data.userId]));
      } else {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }
    });

    socketService.on('user_status', (data) => {
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
    });

    socketService.on('message_read', (data) => {
      setMessages(prev => prev.map(msg =>
        msg.id === data.messageId ? { ...msg, status: 'read', readAt: data.readAt } : msg
      ));
    });

    // Phase 2: Enhanced Chat Socket Events
    socketService.on('message_edited', (data) => {
      setMessages(prev => prev.map(msg =>
        msg.id === data.messageId
          ? { ...msg, content: data.newContent, isEdited: true, editHistory: data.editHistory }
          : msg
      ));
      toast.success('Message edited');
    });

    socketService.on('message_deleted', (data) => {
      if (data.deleteForEveryone) {
        setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
      } else {
        setMessages(prev => prev.map(msg =>
          msg.id === data.messageId
            ? { ...msg, isDeleted: true, content: 'This message was deleted' }
            : msg
        ));
      }
      toast.success('Message deleted');
    });

    socketService.on('message_reacted', (data) => {
      setMessages(prev => prev.map(msg =>
        msg.id === data.messageId
          ? { ...msg, reactions: data.reactions }
          : msg
      ));
    });

    socketService.on('message_replied', (data) => {
      if (selectedConversation && data.conversationId === selectedConversation.id) {
        setMessages(prev => [...prev, data.replyMessage]);
        scrollToBottom();
      }
      loadConversations();
    });

    socketService.on('message_forwarded', (data) => {
      toast.success('Message forwarded');
    });

    socketService.on('message_pinned', (data) => {
      setMessages(prev => prev.map(msg =>
        msg.id === data.messageId
          ? { ...msg, pinned: data.pinned, pinnedBy: data.pinnedBy }
          : msg
      ));
      if (data.pinned) {
        loadPinnedMessages();
      }
      toast.success(data.pinned ? 'Message pinned' : 'Message unpinned');
    });

    socketService.on('conversation_pinned', (data) => {
      loadConversations();
      toast.success(data.pinned ? 'Conversation pinned' : 'Conversation unpinned');
    });

    // Video call events
    socketService.on('incoming_call', (data) => {
      setActiveCall({
        callId: data.callId,
        callerId: data.callerId,
        callerName: data.callerName,
        callType: data.callType,
        status: 'incoming'
      });
      setShowVideoCall(true);
      toast.success(`Incoming ${data.callType} call from ${data.callerName}`);
    });

    socketService.on('call_accepted', (data) => {
      setActiveCall(prev => ({ ...prev, status: 'connected' }));
    });

    socketService.on('call_rejected', (data) => {
      toast.error('Call rejected');
      setShowVideoCall(false);
      setActiveCall(null);
    });

    socketService.on('call_ended', (data) => {
      toast.success('Call ended');
      setShowVideoCall(false);
      setActiveCall(null);
    });

    socketService.on('error', (error) => {
      console.error('Socket error:', error);
      if (error.message?.includes('permission')) {
        toast.error(error.message);
      }
    });

    return () => {
      socketService.disconnect();
      console.log('🔌 Socket disconnected on cleanup');
    };
  }, [user?.id]);

  // Load user permissions
  const loadPermissions = async () => {
    try {
      console.log('🔐 Loading chat permissions for user:', user.id);
      const response = await api.get('/messages/permissions', {
        params: { userId: user.id, userType: 'staff' }
      });
      setPermissions(response.data);
      console.log('✅ User chat permissions loaded:', response.data);
    } catch (error) {
      console.error('❌ Error loading permissions:', error);
      toast.error('Failed to load chat permissions');
    }
  };

  // Load conversations
  const loadConversations = async () => {
    try {
      const data = await chatServiceEnhanced.getConversations(user.id, 'staff');
      setConversations(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setLoading(false);
    }
  };

  // Load messages
  const loadMessages = async (conversationId) => {
    try {
      const data = await chatServiceEnhanced.getMessages(conversationId);
      setMessages(data);
      scrollToBottom();
      
      // Mark as read
      if (data.length > 0) {
        await chatServiceEnhanced.markAsRead(conversationId, user.id);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Handle new message from socket
  const handleNewMessage = (message) => {
    if (selectedConversation && message.conversationId === selectedConversation.id) {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
      chatServiceEnhanced.markAsRead(selectedConversation.id, user.id);
    }
    loadConversations();
  };

  // Load available contacts
  const loadAvailableContacts = async () => {
    try {
      const response = await api.get('/messages/contacts', {
        params: { userId: user.id, userType: 'staff' }
      });
      setAvailableContacts(response.data);
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast.error('Failed to load contacts');
    }
  };

  // Start new conversation
  const startNewConversation = async (contact) => {
    try {
      const conversation = await chatServiceEnhanced.createConversation(
        user.id,
        'staff',
        contact.id,
        contact.type
      );
      
      setConversations(prev => {
        const exists = prev.find(c => c.id === conversation._id);
        if (exists) return prev;
        return [conversation, ...prev];
      });
      
      setSelectedConversation({
        id: conversation._id,
        otherParticipant: contact
      });
      
      socketService.joinConversation(conversation._id);
      loadMessages(conversation._id);
      setShowNewChatModal(false);
      toast.success('Conversation started');
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error(error.message || 'Failed to start conversation');
    }
  };

  // Select conversation
  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    socketService.joinConversation(conversation.id);
    loadMessages(conversation.id);
  };

  // Send text message
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      socketService.sendMessage({
        conversationId: selectedConversation.id,
        receiverId: selectedConversation.otherParticipant.userId,
        receiverModel: selectedConversation.otherParticipant.userType === 'staff' ? 'Staff' : 'Student',
        content: messageContent,
        type: 'text'
      });
      socketService.sendTyping(selectedConversation.id, false);
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('File type not supported. Use images, PDFs, or documents.');
      return;
    }

    setSelectedFile(file);

    // Create preview for images
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

  // Upload and send file
  const handleFileUpload = async () => {
    if (!selectedFile || !selectedConversation) return;

    setUploadingFile(true);
    setUploadProgress(0);

    try {
      // Upload file using chatServiceEnhanced
      const uploadData = await chatServiceEnhanced.uploadFile(selectedFile);
      
      setUploadProgress(100);

      // Determine message type
      const messageType = selectedFile.type.startsWith('image/') ? 'image' : 'file';
      const messageContent = messageType === 'image' ? 'Sent an image' : selectedFile.name;

      // Send message via socket with file data
      socketService.sendMessage({
        conversationId: selectedConversation.id,
        receiverId: selectedConversation.otherParticipant.userId,
        receiverModel: selectedConversation.otherParticipant.userType === 'staff' ? 'Staff' : 'Student',
        content: messageContent,
        type: messageType,
        fileUrl: uploadData.url,
        fileName: selectedFile.name,
        fileSize: (selectedFile.size / 1024).toFixed(2) + ' KB',
        fileType: selectedFile.type
      });

      // Clear file selection
      setSelectedFile(null);
      setFilePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast.success('File sent successfully');
    } catch (error) {
      console.error('File upload failed:', error);
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
      setUploadProgress(0);
    }
  };

  // Cancel file upload
  const cancelFileUpload = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle typing
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!selectedConversation) return;

    socketService.sendTyping(selectedConversation.id, true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketService.sendTyping(selectedConversation.id, false);
    }, 2000);
  };

  // Phase 2: Message Actions
  const handleMessageAction = async (action, data) => {
    if (!selectedMessage) return;

    try {
      switch (action) {
        case 'react':
          await handleReaction(selectedMessage.id, data.emoji);
          break;
        case 'reply':
          setReplyToMessage(selectedMessage);
          break;
        case 'forward':
          setShowForwardModal(true);
          break;
        case 'pin':
          await handlePinMessage(selectedMessage.id);
          break;
        case 'copy':
          navigator.clipboard.writeText(selectedMessage.content);
          toast.success('Copied to clipboard');
          break;
        case 'edit':
          setEditingMessage(selectedMessage);
          setEditText(selectedMessage.content);
          break;
        case 'delete':
          await handleDeleteMessage(selectedMessage.id, data.deleteForEveryone);
          break;
        case 'download':
          if (selectedMessage.fileUrl) {
            window.open(selectedMessage.fileUrl, '_blank');
          }
          break;
      }
    } catch (error) {
      console.error('Error handling message action:', error);
      toast.error('Failed to perform action');
    }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      await api.post(`/messages/${messageId}/react`, {
        emoji,
        userId: user.id,
        userModel: 'Staff'
      });
      socketService.emit('message_reacted', { messageId, emoji, userId: user.id });
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('Failed to add reaction');
    }
  };

  const handlePinMessage = async (messageId) => {
    try {
      const message = messages.find(m => m.id === messageId);
      const newPinnedState = !message?.pinned;

      await api.post(`/messages/${messageId}/pin`, {
        userId: user.id,
        pinned: newPinnedState
      });
      socketService.emit('message_pinned', { messageId, pinned: newPinnedState, userId: user.id });
    } catch (error) {
      console.error('Error pinning message:', error);
      toast.error('Failed to pin message');
    }
  };

  const handleDeleteMessage = async (messageId, deleteForEveryone = false) => {
    try {
      await api.delete(`/messages/${messageId}`, {
        data: { deleteForEveryone, userId: user.id }
      });
      socketService.emit('message_deleted', { messageId, deleteForEveryone });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const handleEditMessage = async () => {
    if (!editingMessage || !editText.trim()) return;

    try {
      await api.put(`/messages/${editingMessage.id}/edit`, {
        newContent: editText.trim(),
        userId: user.id
      });
      socketService.emit('message_edited', {
        messageId: editingMessage.id,
        newContent: editText.trim(),
        userId: user.id
      });
      setEditingMessage(null);
      setEditText("");
    } catch (error) {
      console.error('Error editing message:', error);
      toast.error('Failed to edit message');
    }
  };

  const handleReply = async () => {
    if (!replyToMessage || !newMessage.trim()) return;

    try {
      const response = await api.post(`/messages/${replyToMessage.id}/reply`, {
        content: newMessage.trim(),
        userId: user.id,
        userModel: 'Staff'
      });

      socketService.emit('message_replied', {
        messageId: replyToMessage.id,
        replyMessage: response.data,
        conversationId: selectedConversation.id
      });

      setNewMessage("");
      setReplyToMessage(null);
      scrollToBottom();
    } catch (error) {
      console.error('Error replying to message:', error);
      toast.error('Failed to reply');
    }
  };

  const handleForward = async (conversationIds) => {
    if (!selectedMessage) return;

    try {
      await api.post(`/messages/${selectedMessage.id}/forward`, {
        conversationIds,
        userId: user.id
      });
      toast.success(`Message forwarded to ${conversationIds.length} conversation(s)`);
      setShowForwardModal(false);
    } catch (error) {
      console.error('Error forwarding message:', error);
      toast.error('Failed to forward message');
    }
  };

  const handleSearchResultClick = (messageId) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-primary-100');
      setTimeout(() => element.classList.remove('bg-primary-100'), 2000);
    }
  };

  const handleVoiceMessageSend = async (audioData) => {
    try {
      const formData = new FormData();
      formData.append('file', audioData.blob, 'voice-message.webm');
      formData.append('type', 'audio');
      formData.append('duration', audioData.duration);
      formData.append('waveform', JSON.stringify(audioData.waveform));

      const uploadData = await chatServiceEnhanced.uploadFile(audioData.blob);

      socketService.sendMessage({
        conversationId: selectedConversation.id,
        receiverId: selectedConversation.otherParticipant.userId,
        receiverModel: selectedConversation.otherParticipant.userType === 'staff' ? 'Staff' : 'Student',
        content: '🎤 Voice message',
        type: 'audio',
        fileUrl: uploadData.url,
        duration: audioData.duration,
        waveform: audioData.waveform
      });

      toast.success('Voice message sent');
    } catch (error) {
      console.error('Error sending voice message:', error);
      toast.error('Failed to send voice message');
    }
  };

  const handleVideoCall = async (callType = 'video') => {
    if (!selectedConversation) return;

    try {
      // Initialize video call service
      await videoCallService.initialize(user.id);

      // Initiate call via API
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

      // Start WebRTC call via PeerJS
      await videoCallService.startCall(
        selectedConversation.otherParticipant.userId,
        { video: callType === 'video', audio: true, callId: response._id }
      );

      setShowVideoCall(true);
      toast.success(`${callType === 'video' ? 'Video' : 'Audio'} call initiated`);
    } catch (error) {
      console.error('Error initiating call:', error);
      toast.error('Failed to initiate call');
    }
  };

  const loadPinnedMessages = async () => {
    if (!selectedConversation) return;

    try {
      const response = await api.get(`/conversations/${selectedConversation.id}/pinned-messages`);
      setPinnedMessages(response.data);
    } catch (error) {
      console.error('Error loading pinned messages:', error);
    }
  };

  useEffect(() => {
    if (selectedConversation) {
      loadPinnedMessages();
    }
  }, [selectedConversation]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Filter conversations
  const filteredConversations = conversations.filter(c =>
    c.otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.otherParticipant?.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter contacts
  const filteredContacts = availableContacts.filter(c =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.role.toLowerCase().includes(contactSearch.toLowerCase())
  );

  // Format time
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render message content based on type
  const renderMessageContent = (msg) => {
    const isMe = msg.senderId === user.id;

    if (msg.type === 'audio' && msg.fileUrl) {
      return (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
            <span className="text-lg">🎤</span>
          </div>
          <div className="flex-1">
            <audio src={msg.fileUrl} controls className="h-8" />
            {msg.duration && (
              <p className="text-xs opacity-70 mt-1">{Math.floor(msg.duration / 60)}:{(msg.duration % 60).toString().padStart(2, '0')}</p>
            )}
          </div>
        </div>
      );
    }

    if (msg.type === 'image' && msg.fileUrl) {
      return (
        <div className="space-y-2">
          <img
            src={msg.fileUrl}
            alt={msg.fileName || 'Image'}
            className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(msg.fileUrl, '_blank')}
            style={{ maxHeight: '300px', objectFit: 'contain' }}
          />
          {msg.fileName && (
            <p className="text-xs opacity-70">{msg.fileName}</p>
          )}
        </div>
      );
    }

    if (msg.type === 'file' && msg.fileUrl) {
      return (
        <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
          <File size={24} className="shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{msg.fileName || 'File'}</p>
            {msg.fileSize && (
              <p className="text-xs opacity-70">{msg.fileSize}</p>
            )}
          </div>
          <a
            href={msg.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Download"
          >
            <Download size={18} />
          </a>
        </div>
      );
    }

    return (
      <p className="text-base leading-relaxed">{msg.content}</p>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  if (permissions && !permissions.canSendMessage) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8 max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-2">Chat Access Restricted</h2>
          <p className="text-default-500 mb-4">
            You do not have permission to use the chat feature. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-0 h-full w-full">
        {/* Conversations List - Same as before */}
        <div className="w-80 shrink-0 border-r border-default-200 bg-background h-full flex flex-col overflow-hidden">
          <div className="p-4 border-b border-default-200 shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-2 flex-1 px-4 py-2.5 bg-default-100 rounded-lg border border-default-200">
                <Search size={18} className="text-default-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="flex-1 bg-transparent outline-none text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                isIconOnly
                color="primary"
                variant="flat"
                onPress={() => {
                  loadAvailableContacts();
                  setShowNewChatModal(true);
                }}
              >
                <Plus size={20} />
              </Button>
            </div>
          </div>
          
          <ScrollShadow className="flex-1 min-h-0">
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-default-400">
                <Users size={48} className="mx-auto mb-2 opacity-50" />
                <p>No conversations yet</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation)}
                  className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-default-100 transition-colors border-l-2 ${
                    selectedConversation?.id === conversation.id
                      ? "bg-primary-50 border-primary"
                      : "border-transparent"
                  }`}
                >
                  <div className="relative">
                    <Avatar 
                      src={conversation.otherParticipant?.avatar} 
                      name={conversation.otherParticipant?.name}
                      size="md" 
                    />
                    {conversation.otherParticipant?.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base font-medium truncate">
                        {conversation.otherParticipant?.name}
                      </span>
                      {conversation.lastMessage?.timestamp && (
                        <span className="text-xs text-default-400">
                          {formatTime(conversation.lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-default-500 truncate flex-1">
                        {conversation.lastMessage?.content || 'No messages yet'}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </ScrollShadow>
        </div>

        {/* Chat Area */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col min-w-0 bg-default-50/30">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-default-200 shrink-0 bg-background">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar
                      src={selectedConversation.otherParticipant?.avatar}
                      name={selectedConversation.otherParticipant?.name}
                      size="md"
                    />
                    {selectedConversation.otherParticipant?.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedConversation.otherParticipant?.name}
                    </h3>
                    <p className="text-sm text-default-500">
                      {selectedConversation.otherParticipant?.online ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>

                {/* Phase 2: Chat Actions */}
                <div className="flex items-center gap-2">
                  {/* Video/Audio Call Buttons */}
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    onPress={() => handleVideoCall('audio')}
                    title="Voice call"
                  >
                    <Phone size={18} />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    onPress={() => handleVideoCall('video')}
                    title="Video call"
                  >
                    <Video size={18} />
                  </Button>

                  {/* Search */}
                  <ChatSearch
                    messages={messages}
                    onResultClick={handleSearchResultClick}
                  />

                  {/* Pinned Messages Toggle */}
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    onPress={() => setShowPinnedMessages(!showPinnedMessages)}
                    title="Pinned messages"
                  >
                    <PushPin size={18} />
                  </Button>

                  {/* More Options */}
                  <Dropdown>
                    <DropdownTrigger>
                      <Button isIconOnly size="sm" variant="flat">
                        <MoreVertical size={18} />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu>
                      <DropdownItem key="pin" onPress={() => api.post(`/conversations/${selectedConversation.id}/pin`, { userId: user.id })}>
                        Pin Conversation
                      </DropdownItem>
                      <DropdownItem key="mute" onPress={() => api.post(`/conversations/${selectedConversation.id}/mute`, { userId: user.id })}>
                        Mute Notifications
                      </DropdownItem>
                      <DropdownItem key="clear" onPress={() => setMessages([])} className="text-danger">
                        Clear Messages
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollShadow className="flex-1 min-h-0 p-6 space-y-4 overflow-y-auto">
              {/* Reply Preview */}
              {replyToMessage && (
                <div className="mb-4">
                  <ReplyPreview
                    message={replyToMessage}
                    onCancel={() => setReplyToMessage(null)}
                  />
                </div>
              )}

              {messages.map((msg) => {
                const isMe = msg.senderId === user.id;
                const isEditing = editingMessage?.id === msg.id;

                return (
                  <div
                    key={msg.id}
                    id={`message-${msg.id}`}
                    className={`group relative ${isMe ? "justify-end" : "justify-start"} flex`}
                    onMouseEnter={() => setSelectedMessage(msg)}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                        isMe
                          ? "bg-primary text-white rounded-br-sm"
                          : "bg-default-100 text-default-900 rounded-bl-sm"
                      }`}
                    >
                      {/* Reply to indicator */}
                      {msg.replyTo && (
                        <div className={`mb-2 pb-2 border-l-2 ${isMe ? 'border-white/30' : 'border-primary/30'} pl-2`}>
                          <p className="text-xs opacity-70">
                            {isMe ? 'You' : msg.senderName} replied to {msg.replyTo.senderName}
                          </p>
                          <p className="text-sm opacity-80 truncate">{msg.replyTo.content}</p>
                        </div>
                      )}

                      {/* Edit mode */}
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleEditMessage()}
                            className="w-full"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onPress={handleEditMessage}>Save</Button>
                            <Button size="sm" variant="flat" onPress={() => { setEditingMessage(null); setEditText(""); }}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {renderMessageContent(msg)}

                          {/* Message indicators */}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <p className={`text-xs ${isMe ? "text-white/70" : "text-default-400"}`}>
                              {formatTime(msg.createdAt)}
                            </p>
                            {isMe && msg.status && (
                              <span className="text-xs text-white/70">
                                {msg.status === 'read' ? '✓✓' : '✓'}
                              </span>
                            )}
                            {msg.isEdited && (
                              <span className="text-xs opacity-70">(edited)</span>
                            )}
                            {msg.forwardedFrom && (
                              <span className="text-xs opacity-70">
                                Forwarded from {msg.forwardedFrom.originalSenderName}
                              </span>
                            )}
                            {msg.pinned && (
                              <span className="text-xs flex items-center gap-1">
                                <PushPin size={12} /> Pinned
                              </span>
                            )}
                          </div>

                          {/* Reactions */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className="mt-2">
                              <MessageReactions
                                reactions={msg.reactions}
                                currentUserId={user.id}
                                onReact={(emoji) => handleReaction(msg.id, emoji)}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Phase 2: Message Actions Menu (visible on hover) */}
                    <div className={`absolute ${isMe ? '-left-16' : '-right-16'} top-0 opacity-0 group-hover:opacity-100 transition-opacity`}>
                      <MessageActionsMenu
                        message={msg}
                        currentUserId={user.id}
                        onAction={handleMessageAction}
                      />
                    </div>
                  </div>
                );
              })}
              
              {/* Typing indicator */}
              {typingUsers.size > 0 && (
                <div className="flex justify-start">
                  <div className="bg-default-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-default-400 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-default-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-default-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </ScrollShadow>

            {/* File Preview */}
            {selectedFile && (
              <div className="px-5 py-3 border-t border-default-200 bg-default-50">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-default-200">
                  {filePreview ? (
                    <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded" />
                  ) : (
                    <File size={32} className="text-default-400" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{selectedFile.name}</p>
                    <p className="text-sm text-default-500">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  {uploadingFile ? (
                    <div className="w-24">
                      <Progress value={uploadProgress} size="sm" />
                    </div>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        color="primary"
                        onPress={handleFileUpload}
                      >
                        Send
                      </Button>
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={cancelFileUpload}
                        isIconOnly
                      >
                        <X size={18} />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-5 border-t border-default-200 shrink-0 bg-default-50/30">
              {/* Voice Message Recorder */}
              <div className="mb-3">
                <VoiceMessageRecorder
                  onSend={handleVoiceMessageSend}
                  onCancel={() => {}}
                />
              </div>

              <div className="flex gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                />
                <Button
                  isIconOnly
                  variant="flat"
                  onPress={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  title="Attach file"
                >
                  <Paperclip size={20} />
                </Button>
                <div className="flex items-center gap-2 flex-1 px-4 py-3 bg-white rounded-lg border border-default-200">
                  <input
                    type="text"
                    placeholder={replyToMessage ? `Replying to ${replyToMessage.senderName}...` : "Type a message..."}
                    className="flex-1 bg-transparent outline-none text-base"
                    value={newMessage}
                    onChange={handleTyping}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (replyToMessage ? handleReply() : handleSend())}
                    disabled={sending || uploadingFile}
                  />
                </div>
                {replyToMessage ? (
                  <Button
                    color="primary"
                    onPress={handleReply}
                    disabled={!newMessage.trim() || sending}
                  >
                    Reply
                  </Button>
                ) : (
                  <button
                    onClick={handleSend}
                    disabled={sending || !newMessage.trim() || uploadingFile}
                    className="flex items-center justify-center w-12 h-12 bg-primary text-white rounded-lg hover:bg-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? <Spinner size="sm" color="white" /> : <Send size={18} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-default-50">
            <div className="text-center">
              <Users size={64} className="mx-auto mb-4 text-default-300" />
              <p className="text-xl text-default-400">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Phase 2: Pinned Messages Side Panel */}
      {showPinnedMessages && (
        <div className="w-80 border-l border-default-200 bg-background h-full flex flex-col">
          <div className="p-4 border-b border-default-200 flex items-center justify-between">
            <h3 className="font-semibold">Pinned Messages</h3>
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              onPress={() => setShowPinnedMessages(false)}
            >
              <X size={18} />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <PinnedMessages
              messages={pinnedMessages}
              onUnpin={(messageId) => handlePinMessage(messageId)}
              onJumpToMessage={handleSearchResultClick}
            />
          </div>
        </div>
      )}

      {/* Phase 2: Forward Modal */}
      <ForwardModal
        isOpen={showForwardModal}
        onClose={() => setShowForwardModal(false)}
        onForward={handleForward}
        conversations={conversations}
      />

      {/* Phase 2: Video Call Modal */}
      <VideoCallModal
        isOpen={showVideoCall}
        onClose={() => setShowVideoCall(false)}
        call={activeCall}
        currentUser={user}
        onAccept={async (callId) => {
          try {
            await callsApi.accept(callId);
            await videoCallService.acceptCall(callId);
            setActiveCall(prev => ({ ...prev, status: 'connected' }));
          } catch (error) {
            console.error('Error accepting call:', error);
            toast.error('Failed to accept call');
          }
        }}
        onReject={async (callId) => {
          try {
            await callsApi.reject(callId);
            videoCallService.rejectCall(callId);
            setShowVideoCall(false);
            setActiveCall(null);
          } catch (error) {
            console.error('Error rejecting call:', error);
            toast.error('Failed to reject call');
          }
        }}
        onEnd={async (callId) => {
          try {
            await callsApi.end(callId, 'user_ended');
            videoCallService.endCall(callId);
            setShowVideoCall(false);
            setActiveCall(null);
            toast.success('Call ended');
          } catch (error) {
            console.error('Error ending call:', error);
            toast.error('Failed to end call');
          }
        }}
      />

      {/* New Chat Modal - Same as before */}
      <Modal 
        isOpen={showNewChatModal} 
        onClose={() => setShowNewChatModal(false)}
        size="2xl"
      >
        <ModalContent>
          <ModalHeader>Start New Conversation</ModalHeader>
          <ModalBody>
            <Input
              placeholder="Search contacts..."
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              startContent={<Search size={18} />}
              className="mb-4"
            />
            <ScrollShadow className="max-h-96">
              {filteredContacts.length === 0 ? (
                <div className="text-center py-8 text-default-400">
                  No contacts available
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => startNewConversation(contact)}
                      className="flex items-center gap-3 p-3 hover:bg-default-100 rounded-lg cursor-pointer"
                    >
                      <Avatar 
                        src={contact.avatar}
                        name={contact.name}
                        size="md"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-default-500">{contact.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollShadow>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
