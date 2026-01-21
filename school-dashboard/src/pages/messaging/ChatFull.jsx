import { useState, useEffect, useRef } from "react";
import { Avatar, ScrollShadow, Spinner, Button, Modal, ModalContent, ModalHeader, ModalBody, Input, Chip, Tooltip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Textarea } from "@heroui/react";
import { Send, Search, Phone, Video, MoreVertical, X, Plus, Users, Paperclip, Image as ImageIcon, File, Check, CheckCheck, Download, Mic, Reply, Forward, Pin, Trash2, Edit, Copy } from "lucide-react";
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
import MessageActionsMenu from "./components/MessageActionsMenu";
import MessageReactions from "./components/MessageReactions";
import ReplyPreview from "./components/ReplyPreview";
import VoiceMessageRecorder from "./components/VoiceMessageRecorder";
import EmojiPicker from "./components/EmojiPicker";

export default function ChatFull() {
  const { user } = useAuth();
  const { staff, students } = useApp();
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
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const selectedConversationRef = useRef(null);

  // Video call state
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [activeCall, setActiveCall] = useState(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const recordingTimerRef = useRef(null);

  // Reply/Forward states
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const messageInputRef = useRef(null);

  // Pinned messages state
  const [pinnedMessages, setPinnedMessages] = useState([]);

  // Edit message state
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState("");

  // Emoji picker state
  const [emojiPickerMessage, setEmojiPickerMessage] = useState(null);

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
    // Disconnecting here would break notifications on other pages
    return () => {
      console.log('🧹 ChatFull unmounting - socket stays connected for global notifications');
      // No cleanup needed - socket managed by ChatNotificationContext
    };
  }, [user?.id, staff, students]);

  const initializeChat = async () => {
    try {
      setLoading(true);
      console.log('🚀 Initializing full-featured chat...');

      // Load contacts
      loadContacts();

      // Connect Socket.IO
      try {
        await socketService.connect(user.id, 'staff');
        setSocketConnected(true);
        console.log('✅ Socket connected');

        // Setup socket listeners
        setupSocketListeners();

        // Load conversations
        await loadConversations();
      } catch (socketError) {
        console.warn('⚠️ Socket connection failed, using REST API only:', socketError);
        setSocketConnected(false);
        // Still load conversations via REST API
        await loadConversations();
      }
    } catch (error) {
      console.error('❌ Error initializing chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    // New message received
    socketService.on('new_message', (data) => {
      console.log('📨 New message:', data);
      handleNewMessage(data.message);

      // Update conversation list
      loadConversations();
    });

    // Typing indicator
    socketService.on('user_typing', (data) => {
      if (data.conversationId === selectedConversation?.id) {
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
    });

    // User status
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

      // Update conversations
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

    // Message read
    socketService.on('message_read', (data) => {
      setMessages(prev => prev.map(msg =>
        msg.id === data.messageId
          ? { ...msg, status: 'read', readAt: data.readAt }
          : msg
      ));
    });

    // Messages read (bulk)
    socketService.on('messages_read', (data) => {
      if (data.conversationId === selectedConversation?.id) {
        setMessages(prev => prev.map(msg =>
          msg.senderId === user.id
            ? { ...msg, status: 'read', readAt: new Date() }
            : msg
        ));
      }
    });

    // Message pinned/unpinned
    socketService.on('message_pinned', (data) => {
      console.log('📌 Message pinned event:', data);
      setMessages(prev => {
        const updated = prev.map(msg =>
          msg.id === data.messageId
            ? { ...msg, pinned: data.pinned }
            : msg
        );

        // Update pinned messages state
        setPinnedMessages(pinnedPrev => {
          if (data.pinned) {
            // Add to pinned messages
            const msgToAdd = updated.find(m => m.id === data.messageId);
            if (msgToAdd && !pinnedPrev.find(pm => pm.id === data.messageId)) {
              return [...pinnedPrev, { ...msgToAdd, pinned: true }];
            }
            return pinnedPrev;
          } else {
            // Remove from pinned messages
            return pinnedPrev.filter(pm => pm.id !== data.messageId);
          }
        });

        return updated;
      });
    });

    // Message reacted
    socketService.on('message_reacted', (data) => {
      console.log('😀 Message reacted event:', data);
      setMessages(prev => prev.map(msg =>
        msg.id === data.messageId
          ? { ...msg, reactions: data.reactions }
          : msg
      ));
    });
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
      console.log('✅ Loaded contacts:', staffContacts.length + studentContacts.length);
    } catch (error) {
      console.error('❌ Error loading contacts:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const convs = await chatService.getConversations(user.id, 'staff');
      console.log('✅ Loaded conversations:', convs.length);
      setConversations(convs);

      // Update online status
      const onlineUserIds = convs
        .filter(c => c.otherParticipant?.online)
        .map(c => c.otherParticipant.userId);
      setOnlineUsers(new Set(onlineUserIds));
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
    }
  };

  const handleSelectConversation = async (conversation) => {
    try {
      setSelectedConversation(conversation);
      console.log('📂 Selected conversation:', conversation.id);

      // Load messages
      const msgs = await chatService.getMessages(conversation.id);
      setMessages(msgs);

      // Join conversation room via socket
      if (socketService.isConnected()) {
        socketService.joinConversation(conversation.id);
        socketService.markAsRead(null, conversation.id);
      } else {
        // Mark as read via REST API
        await chatService.markAsRead(conversation.id, user.id);
      }

      // Scroll to bottom
      setTimeout(() => scrollToBottom(), 100);

      // Update conversation unread count
      setConversations(prev => prev.map(c =>
        c.id === conversation.id ? { ...c, unreadCount: 0 } : c
      ));
    } catch (error) {
      console.error('❌ Error selecting conversation:', error);
    }
  };

  const startNewConversation = async (contact) => {
    try {
      console.log('🆕 Starting conversation with:', contact.name);

      const conversation = await chatService.createConversation(
        user.id,
        'staff',
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
      if (!conversations.find(c => c.id === conversation.id)) {
        setConversations(prev => [conversation, ...prev]);
      }

      // Select conversation and join room
      handleSelectConversation(conversation);
      
      // Ensure we join the Socket.IO room
      if (socketService.isConnected()) {
        socketService.joinConversation(conversation.id);
      }
    } catch (error) {
      console.error('❌ Error starting conversation:', error);
      alert(error.message || 'Failed to start conversation');
    }
  };

  const handleNewMessage = (message) => {
    console.log('📨 Received new message:', message);
    
    // Use ref to get current conversation (avoids closure issue)
    const currentConversation = selectedConversationRef.current;
    
    console.log('📂 Current conversation ID:', currentConversation?.id || currentConversation?._id);
    console.log('📨 Message conversation ID:', message.conversationId);
    
    // Try both id and _id properties
    const currentConvId = currentConversation?.id || currentConversation?._id;
    console.log('🔍 IDs match?', String(message.conversationId) === String(currentConvId));
    
    // If message is for current conversation, add it
    // Convert both to strings for comparison to handle ObjectId vs string
    if (String(message.conversationId) === String(currentConvId)) {
      console.log('✅ Adding message to current conversation');
      setMessages(prev => {
        // Remove optimistic messages from the current user with the same content
        const filtered = prev.filter(m => {
          // Remove optimistic message if this is the confirmed version
          if (m._isOptimistic &&
              String(m.senderId) === String(message.senderId) &&
              m.content === message.content &&
              m._originalContent === message.content) {
            console.log('🗑️ Removing optimistic message');
            return false;
          }
          return true;
        });

        // Add new message if not already exists
        if (!filtered.find(m => String(m.id) === String(message.id))) {
          console.log('✅ Message added to state');
          return [...filtered, message];
        }
        console.log('⚠️ Message already exists in state');
        return filtered;
      });
      scrollToBottom();

      // Mark as read if conversation is open and not sent by me
      if (socketService.isConnected() && String(message.senderId) !== String(user?.id)) {
        socketService.markAsRead(message.id, message.conversationId);
      }
    } else {
      // Message for different conversation - show notification
      console.log('🔔 New message in other conversation');
      // Update conversation list to show unread count
      loadConversations();
    }
  };

  const handleSend = async () => {
    // If file is selected, send file with text
    if (selectedFile) {
      await handleSendFile();
      return;
    }

    if (!newMessage.trim() || !selectedConversation || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      // Get receiver info from conversation
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

      // Add replyTo if replying to a message (send only the ID)
      if (replyToMessage) {
        messageData.replyTo = replyToMessage.id;
      }

      if (socketService.isConnected()) {
        // Send via Socket.IO
        socketService.sendMessage(messageData);
        socketService.sendTyping(selectedConversation.id, false);

        // Optimistically add message with a temporary ID
        const tempId = `temp-${Date.now()}`;
        const optimisticMessage = {
          id: tempId,
          ...messageData,
          senderId: user.id,
          senderName: user.name,
          status: 'sending',
          createdAt: new Date(),
          _isOptimistic: true, // Flag to identify optimistic messages
          _originalContent: messageContent
        };
        setMessages(prev => [...prev, optimisticMessage]);
        scrollToBottom();
      } else {
        // Fallback to REST API
        const sentMessage = await chatService.sendMessage({
          ...messageData,
          senderId: user.id,
          senderModel: 'Staff'
        });
        setMessages(prev => [...prev, sentMessage]);
        scrollToBottom();
      }

      // Clear reply state
      setReplyToMessage(null);

      // Update conversation list
      loadConversations();
    } catch (error) {
      console.error('❌ Error sending message:', error);
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

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    // Store file and create preview
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

  const handleSendFile = async () => {
    if (!selectedFile || !selectedConversation) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      setUploadingFile(true);
      console.log('📤 Uploading file:', selectedFile.name, 'Type:', selectedFile.type, 'Size:', selectedFile.size);

      // Upload file
      const uploadResult = await chatService.uploadFile(selectedFile);
      console.log('✅ File uploaded:', uploadResult);

      if (!uploadResult.url) {
        throw new Error('Upload succeeded but no URL returned');
      }

      // Get receiver info
      const otherParticipant = selectedConversation.otherParticipant || 
        selectedConversation.participants?.find(p => p.userId !== user?.id);
      
      if (!otherParticipant) {
        throw new Error('Cannot find conversation participant');
      }

      // Send message with file (use text message if provided, otherwise use filename)
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

      console.log('📨 Sending file message:', messageData);

      if (socketService.isConnected()) {
        socketService.sendMessage(messageData);
        
        // Optimistically add message
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

      // Clear preview and file
      setSelectedFile(null);
      setFilePreview(null);

      // Reload conversations
      loadConversations();
    } catch (error) {
      console.error('❌ Error uploading file:', error);
      alert(`Failed to upload file: ${error.message}`);
      setNewMessage(messageText); // Restore message on error
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

  // Voice Recording Handlers
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });

        // Upload and send voice message
        setSelectedFile(file);
        setRecordedChunks([]);
        setIsRecording(false);
        setRecordingDuration(0);

        // Automatically send the voice message
        await handleSendFile();

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to access microphone');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
  };

  // Message Actions Handlers
  const handleReply = (message) => {
    setReplyToMessage(message);
    messageInputRef.current?.focus();
  };

  const handleForward = async (message) => {
    setSelectedMessage(message);
    setShowForwardModal(true);
  };

  const handleForwardSubmit = async (conversationIds) => {
    if (!selectedMessage || conversationIds.length === 0) return;

    try {
      // Send the message to each selected conversation
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
      console.error('Error forwarding message:', error);
      toast.error('Failed to forward message');
    }
  };

  const handleDelete = async (message) => {
    try {
      await chatService.deleteMessage(message.id, user.id);
      setMessages(prev => prev.filter(m => m.id !== message.id));
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  // Unified message action handler
  const handleMessageAction = async (action, data) => {
    console.log('🎯 Message action:', action, data);

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
        console.log('✏️ Editing message:', data.message);
        setEditingMessage(data.message);
        setEditText(data.message.content);
        console.log('✏️ Edit state set:', { id: data.message?.id, content: data.message?.content });
        break;

      case 'delete':
        handleDelete(data.message);
        break;

      case 'deleteForEveryone':
        handleDeleteMessage(data.message.id, true);
        break;

      case 'copy':
        navigator.clipboard.writeText(data.message.content);
        toast.success('Message copied');
        break;

      case 'pin':
        handlePinMessage(data.message.id);
        break;

      case 'unpin':
        handleUnpinMessage(data.message.id);
        break;

      case 'react':
        console.log('😀 React action clicked for message:', data.message.id);
        // If no emoji provided, show emoji picker
        if (!data.emoji) {
          setEmojiPickerMessage(data.message);
        } else {
          handleReaction(data.message.id, data.emoji);
        }
        break;

      default:
        console.warn('Unknown action:', action);
    }
  };

  // Handle message reactions
  const handleReaction = async (messageId, emoji) => {
    try {
      // Check if user already reacted with this emoji BEFORE updating
      const currentMessage = messages.find(m => m.id === messageId);
      const existingReaction = currentMessage?.reactions?.find(
        r => r.userId === user.id && r.emoji === emoji
      );
      const isRemoving = !!existingReaction;

      // Optimistically update local state
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          const existingReactionIndex = msg.reactions?.findIndex(
            r => r.userId === user.id && r.emoji === emoji
          );

          let newReactions = [...(msg.reactions || [])];

          if (existingReactionIndex >= 0) {
            // User clicking on same emoji - remove it
            newReactions.splice(existingReactionIndex, 1);
          } else {
            // Remove any existing reaction from this user
            newReactions = newReactions.filter(r => r.userId !== user.id);

            // Add new reaction
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

      // Always send API request (backend handles toggle)
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
      console.error('Error reacting to message:', error);
      toast.error('Failed to react');
    }
  };

  // Handle pin message
  const handlePinMessage = async (messageId) => {
    try {
      console.log('📌 Pinning message:', messageId, 'Type:', typeof messageId);
      const response = await request(`/messages/${messageId}/pin`, {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          pinned: true
        })
      });
      console.log('✅ Pin response:', response);

      // Update local state immediately - use String comparison
      setMessages(prev => {
        const updated = prev.map(msg => {
          const matches = String(msg.id) === String(messageId);
          if (matches) {
            console.log('📌 Updating message pinned status:', msg.id);
            return { ...msg, pinned: true, pinnedBy: [...(msg.pinnedBy || []), user.id] };
          }
          return msg;
        });

        // Also update pinned messages state directly
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

      toast.success('Message pinned');
    } catch (error) {
      console.error('❌ Error pinning message:', error);
      toast.error(error.response?.data?.error || 'Failed to pin');
    }
  };

  // Handle unpin message
  const handleUnpinMessage = async (messageId) => {
    try {
      console.log('📌 Unpinning message:', messageId);
      const response = await request(`/messages/${messageId}/pin`, {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          pinned: false
        })
      });
      console.log('✅ Unpin response:', response);

      // Update local state immediately
      setMessages(prev => {
        const updated = prev.map(msg => {
          const matches = String(msg.id) === String(messageId);
          if (matches) {
            return { ...msg, pinned: false, pinnedBy: (msg.pinnedBy || []).filter(id => String(id) !== String(user.id)) };
          }
          return msg;
        });

        // Also update pinned messages state directly
        setPinnedMessages(prev => prev.filter(pm => String(pm.id) !== String(messageId)));

        return updated;
      });

      toast.success('Message unpinned');
    } catch (error) {
      console.error('❌ Error unpinning message:', error);
      toast.error(error.response?.data?.error || 'Failed to unpin');
    }
  };

  // Handle delete message (with delete for everyone option)
  const handleDeleteMessage = async (messageId, deleteForEveryone = false) => {
    try {
      await chatService.deleteMessage(messageId, user.id);
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success(deleteForEveryone ? 'Message deleted for everyone' : 'Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  // Handle edit message
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
      toast.success('Message edited');
    } catch (error) {
      console.error('Error editing message:', error);
      toast.error('Failed to edit message');
    }
  };

  // Load pinned messages - filter from current messages
  const loadPinnedMessages = () => {
    if (!selectedConversation) return;

    // Filter pinned messages from the current messages array
    const pinned = messages.filter(msg => msg.pinned);
    console.log('📌 Pinned messages loaded:', pinned.length, pinned);
    setPinnedMessages(pinned);
  };

  // Handle voice message send
  const handleVoiceMessageSend = async (audioData) => {
    if (!selectedConversation || !audioData) return;

    try {
      const otherParticipant = selectedConversation.otherParticipant ||
        selectedConversation.participants?.find(p => p.userId !== user?.id);

      if (!otherParticipant) {
        throw new Error('Cannot find conversation participant');
      }

      const messageData = {
        conversationId: selectedConversation.id,
        senderId: user.id,
        senderModel: 'Staff',
        receiverId: otherParticipant.userId,
        receiverModel: otherParticipant.userType === 'staff' ? 'Staff' : 'Student',
        content: '', // Voice messages have no text
        type: 'audio',
        fileUrl: audioData.url,
        fileSize: audioData.size,
        duration: audioData.duration
      };

      if (socketService.isConnected()) {
        socketService.sendMessage(messageData);
      } else {
        await chatService.sendMessage(messageData);
      }

      loadConversations();
      scrollToBottom();
    } catch (error) {
      console.error('Error sending voice message:', error);
      toast.error('Failed to send voice message');
    }
  };

  // Handle search result click
  const handleSearchResultClick = (messageId) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add('bg-yellow-100');
      setTimeout(() => {
        messageElement.classList.remove('bg-yellow-100');
      }, 2000);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Offline';
    const date = new Date(lastSeen);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'ppt':
      case 'pptx':
        return '📽️';
      case 'zip':
      case 'rar':
        return '🗜️';
      case 'txt':
        return '📃';
      case 'mp4':
      case 'mov':
      case 'avi':
        return '🎥';
      default:
        return '📎';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getMessageStatus = (msg) => {
    if (msg.senderId !== user?.id) return null;

    if (msg.status === 'read') {
      return <CheckCheck size={14} className="text-blue-500" />;
    } else if (msg.status === 'delivered') {
      return <CheckCheck size={14} className="text-default-400" />;
    } else {
      return <Check size={14} className="text-default-400" />;
    }
  };

  const filteredConversations = conversations.filter(c =>
    c.otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.role.toLowerCase().includes(contactSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-default-500">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-0 h-full w-full">
        {/* Conversations List */}
        <div className="w-80 shrink-0 border-r border-default-200 bg-background h-full flex flex-col overflow-hidden">
          <div className="p-4 border-b border-default-200 shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-2 flex-1 px-4 py-2.5 bg-default-100 rounded-lg border border-default-200">
                <Search size={18} className="text-default-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="flex-1 bg-transparent outline-none text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                isIconOnly
                color="primary"
                variant="flat"
                onPress={() => setShowNewChatModal(true)}
              >
                <Plus size={20} />
              </Button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-success' : 'bg-warning'}`} />
              <span className="text-default-500">
                {socketConnected ? 'Connected' : 'Offline mode'}
              </span>
            </div>
          </div>

          <ScrollShadow className="flex-1 min-h-0">
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-default-400">
                <Users size={48} className="mx-auto mb-2 opacity-50" />
                <p>No conversations</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-default-100 transition-colors border-l-2 ${selectedConversation?.id === conv.id
                      ? "bg-primary-50 border-primary"
                      : "border-transparent"
                    }`}
                >
                  <div className="relative">
                    <Avatar
                      src={conv.otherParticipant?.avatar}
                      name={conv.otherParticipant?.name}
                      size="md"
                    />
                    {conv.otherParticipant?.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">
                        {conv.otherParticipant?.name}
                      </span>
                      {conv.lastMessage?.timestamp && (
                        <span className="text-xs text-default-400">
                          {formatTime(conv.lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-default-500 truncate flex-1">
                        {conv.lastMessage?.content || 'No messages'}
                      </p>
                      {conv.unreadCount > 0 && (
                        <Chip size="sm" color="primary" variant="solid" className="ml-2">
                          {conv.unreadCount}
                        </Chip>
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
          <div className="flex-1 bg-background h-full flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-default-200 shrink-0">
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
                  <p className="text-sm font-medium">
                    {selectedConversation.otherParticipant?.name}
                  </p>
                  <p className="text-xs text-default-500">
                    {selectedConversation.otherParticipant?.online
                      ? "Online"
                      : formatLastSeen(selectedConversation.otherParticipant?.lastSeen)
                    }
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Tooltip content="Search Messages">
                  <Button isIconOnly variant="light" size="sm" onPress={() => document.getElementById('chat-search-input')?.focus()}>
                    <Search size={18} />
                  </Button>
                </Tooltip>
                {pinnedMessages && pinnedMessages.length > 0 && (
                  <Tooltip content="View Pinned Messages">
                    <Button
                      isIconOnly
                      variant="light"
                      size="sm"
                      onPress={() => {
                        // Scroll to pinned messages section
                        const pinnedSection = document.querySelector('[data-pinned-messages]');
                        pinnedSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    >
                      <Pin size={18} />
                    </Button>
                  </Tooltip>
                )}
                <Tooltip content="Voice Call">
                  <Button isIconOnly variant="light" size="sm" onPress={() => handleVideoCall('audio')}>
                    <Phone size={18} />
                  </Button>
                </Tooltip>
                <Tooltip content="Video Call">
                  <Button isIconOnly variant="light" size="sm" onPress={() => handleVideoCall('video')}>
                    <Video size={18} />
                  </Button>
                </Tooltip>
                <Tooltip content="More">
                  <Button isIconOnly variant="light" size="sm">
                    <MoreVertical size={18} />
                  </Button>
                </Tooltip>
              </div>
            </div>

            {/* Pinned Messages Bar */}
            {pinnedMessages && pinnedMessages.length > 0 && (
              <div data-pinned-messages className="border-b border-default-200 bg-default-50 p-2 shrink-0">
                <div className="flex items-center gap-2 overflow-x-auto">
                  <Pin size={14} className="text-primary flex-shrink-0 mt-1" />
                  <span className="text-xs font-medium text-default-500 flex-shrink-0">Pinned:</span>
                  <div className="flex gap-2">
                    {pinnedMessages.map((msg) => (
                      <div
                        key={msg.id}
                        onClick={() => {
                          // Scroll to the message
                          const messageElement = document.getElementById(`message-${msg.id}`);
                          if (messageElement) {
                            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            // Highlight temporarily
                            messageElement.classList.add('bg-primary-100');
                            setTimeout(() => {
                              messageElement.classList.remove('bg-primary-100');
                            }, 2000);
                          }
                        }}
                        className="flex-shrink-0 max-w-xs px-3 py-2 bg-white rounded-lg border border-default-200 hover:border-primary-400 hover:bg-default-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-primary truncate">
                            {msg.senderName || 'Unknown'}
                          </span>
                          <span className="text-xs text-default-400">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-default-600 truncate">
                          {msg.content || (msg.type === 'image' ? '📷 Image' : msg.type === 'video' ? '🎥 Video' : msg.type === 'audio' ? '🎤 Voice' : msg.type === 'file' ? '📎 File' : 'Message')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            <ScrollShadow className="flex-1 min-h-0 p-4 space-y-3">
              {messages.map((msg) => {
                // Convert both to strings for proper comparison
                const isMe = String(msg.senderId) === String(user?.id);
                
                // Debug logging
                if (messages.length <= 5) { // Only log for first few messages to avoid spam
                  console.log('💬 Message:', {
                    content: msg.content?.substring(0, 20),
                    senderId: msg.senderId,
                    userId: user?.id,
                    senderIdString: String(msg.senderId),
                    userIdString: String(user?.id),
                    isMe
                  });
                }
                
                return (
                  <div
                    key={msg.id}
                    id={`message-${msg.id}`}
                    className={`flex group ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-start gap-2">
                        {/* Emoji Button - Left side of message bubble, appears on hover */}
                        {(!editingMessage) && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity relative pt-2">
                            <button
                              onClick={() => handleMessageAction('react', { message: msg })}
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-default-100 hover:bg-default-200 text-default-600 hover:text-primary transition-colors border border-default-200 shrink-0"
                              title="Add reaction"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                                <line x1="9" y1="9" x2="9.01" y2="9"/>
                                <line x1="15" y1="9" x2="15.01" y2="9"/>
                              </svg>
                            </button>

                            {/* Emoji Picker */}
                            {emojiPickerMessage?.id === msg.id && (
                              <div className="absolute top-10 left-0 z-50">
                                <EmojiPicker
                                  onSelect={(emoji) => {
                                    handleReaction(msg.id, emoji);
                                    setEmojiPickerMessage(null);
                                  }}
                                  onClose={() => setEmojiPickerMessage(null)}
                                />
                              </div>
                            )}
                          </div>
                        )}

                        <div
                          className={`max-w-[400px] w-full px-4 py-2 rounded-2xl overflow-hidden ${isMe
                              ? "bg-primary text-white rounded-br-sm"
                              : "bg-default-100 text-default-900 rounded-bl-sm"
                            }`}
                        >
                        {/* Forwarded indicator */}
                        {msg.forwardedFrom && (
                          <div className={`mb-2 pb-2 border-l-2 ${isMe ? 'border-white/30' : 'border-primary/30'} pl-2`}>
                            <p className="text-xs opacity-70 flex items-center gap-1">
                              ↪️ Forwarded from {msg.forwardedFrom.originalSenderName || 'another chat'}
                            </p>
                          </div>
                        )}

                        {/* Reply to indicator */}
                        {msg.replyTo && (
                          <div className={`mb-2 pb-2 border-l-2 ${isMe ? 'border-white/30' : 'border-primary/30'} pl-2`}>
                            <p className="text-xs opacity-70">
                              {msg.replyTo.senderName || 'Previous message'}
                            </p>
                            <p className="text-sm opacity-80 truncate">{msg.replyTo.content}</p>
                          </div>
                        )}

                        {/* Edit mode */}
                        {editingMessage && String(editingMessage.id) === String(msg.id) ? (
                          <div className="flex flex-col gap-2 w-full">
                            <Textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleEditMessage();
                                } else if (e.key === 'Escape') {
                                  setEditingMessage(null);
                                  setEditText('');
                                }
                              }}
                              autoFocus
                              minRows={2}
                              maxRows={4}
                              className="w-full"
                              classNames={{
                                base: "w-full max-w-full",
                                input: `text-sm break-words ${isMe ? 'text-white' : 'text-default-900'}`,
                                inputWrapper: `${isMe
                                  ? 'bg-white/20 border-white/30'
                                  : 'bg-white border-default-300'
                                } shadow-none w-full`
                              }}
                              variant="bordered"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" color="primary" onPress={handleEditMessage}>
                                Save
                              </Button>
                              <Button size="sm" variant="light" onPress={() => {
                                setEditingMessage(null);
                                setEditText('');
                              }}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {msg.type === 'image' && msg.fileUrl && (
                              <img
                                src={msg.fileUrl}
                            alt={msg.fileName}
                            className="max-w-full max-h-80 rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(msg.fileUrl, '_blank')}
                          />
                        )}
                        {msg.type === 'video' && msg.fileUrl && (
                          <video
                            src={msg.fileUrl}
                            controls
                            className="max-w-full max-h-80 rounded-lg mb-2"
                          />
                        )}
                        {msg.type === 'file' && msg.fileUrl && (
                          <div className="flex items-center gap-3 mb-2 p-3 bg-black/10 dark:bg-white/10 rounded-lg hover:bg-black/20 dark:hover:bg-white/20 transition-colors cursor-pointer"
                            onClick={() => window.open(msg.fileUrl, '_blank')}
                          >
                            <div className="text-2xl">{getFileIcon(msg.fileName)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{msg.fileName}</p>
                              <p className="text-xs opacity-70">{formatFileSize(msg.fileSize)}</p>
                            </div>
                            <Download size={18} className="opacity-70" />
                          </div>
                        )}
                        <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {msg.isEdited && (
                            <span className={`text-xs ${isMe ? 'text-white/60' : 'text-default-400'}`}>
                              (edited)
                            </span>
                          )}
                          <p className={`text-xs ${isMe ? 'text-white/70' : 'text-default-400'}`}>
                            {formatTime(msg.createdAt)}
                          </p>
                          {getMessageStatus(msg)}
                        </div>

                        {/* Message Reactions - Inside message bubble at bottom */}
                        {(!editingMessage) && (msg.reactions?.length > 0) && (
                          <div className="mt-2 pt-2 border-t border-white/20">
                            <MessageReactions
                              reactions={msg.reactions || []}
                              currentUserId={user.id}
                              onReact={(emoji) => handleReaction(msg.id, emoji)}
                            />
                          </div>
                        )}
                      </>
                    )}
                        </div>

                        {/* Message Actions Menu */}
                        <MessageActionsMenu
                          message={msg}
                          currentUserId={user.id}
                          onAction={handleMessageAction}
                        />
                      </div>
                    </div>
                  </div>
              );
              })}

              {typingUsers.size > 0 && (
                <div className="flex justify-start">
                  <div className="bg-default-100 px-4 py-2 rounded-2xl">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-default-400 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-default-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <span className="w-2 h-2 bg-default-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </ScrollShadow>

            {/* Input */}
            <div className="p-4 border-t border-default-200 shrink-0">
              {/* Reply Preview */}
              {replyToMessage && (
                <ReplyPreview
                  message={replyToMessage}
                  onCancel={() => setReplyToMessage(null)}
                />
              )}

              {/* File Preview */}
              {selectedFile && (
                <div className="mb-3 p-3 bg-default-50 rounded-lg border border-default-200">
                  <div className="flex items-center gap-3">
                    {filePreview ? (
                      <img 
                        src={filePreview} 
                        alt="Preview" 
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-default-200 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                        {getFileIcon(selectedFile.name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                      <p className="text-xs text-default-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={handleCancelFile}
                      isDisabled={uploadingFile}
                      className="flex-shrink-0"
                    >
                      <X size={18} />
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                />
                <Tooltip content="Attach file">
                  <Button
                    isIconOnly
                    variant="light"
                    onPress={() => fileInputRef.current?.click()}
                    isDisabled={uploadingFile || isRecording}
                  >
                    <Paperclip size={20} />
                  </Button>
                </Tooltip>

                {/* Voice Recording Button */}
                {isRecording ? (
                  <Button
                    color="danger"
                    variant="flat"
                    onPress={handleStopRecording}
                    className="min-w-120"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="text-sm">{Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}</span>
                    </div>
                  </Button>
                ) : (
                  <Tooltip content="Record voice message">
                    <Button
                      isIconOnly
                      variant="light"
                      onPress={handleStartRecording}
                      isDisabled={sending || uploadingFile || !!selectedFile}
                    >
                      <Mic size={20} />
                    </Button>
                  </Tooltip>
                )}

                <Input
                  ref={messageInputRef}
                  placeholder={replyToMessage ? `Replying to ${replyToMessage.senderName || 'message'}...` : selectedFile ? "Add a caption (optional)..." : "Type a message..."}
                  value={newMessage}
                  onChange={handleTyping}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  disabled={sending || uploadingFile || isRecording}
                  classNames={{
                    input: "text-sm",
                    inputWrapper: "h-10"
                  }}
                />
                <Button
                  color="primary"
                  onPress={handleSend}
                  isLoading={sending || uploadingFile}
                  isIconOnly
                  isDisabled={!selectedFile && !newMessage.trim() && !isRecording}
                >
                  <Send size={18} />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-default-50">
            <div className="text-center">
              <Users size={64} className="mx-auto mb-4 text-default-300" />
              <p className="text-lg text-default-400">Select a conversation</p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
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
                    <p className="font-medium text-sm">{contact.name}</p>
                    <p className="text-xs text-default-500">{contact.role}</p>
                  </div>
                  <Chip size="sm" variant="flat">
                    {contact.type}
                  </Chip>
                </div>
              ))}
            </ScrollShadow>
          </ModalBody>
        </ModalContent>
      </Modal>

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
