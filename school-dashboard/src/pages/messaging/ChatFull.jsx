import { useState, useEffect, useRef } from "react";
import { Avatar, ScrollShadow, Spinner, Button, Modal, ModalContent, ModalHeader, ModalBody, Input, Chip, Tooltip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Textarea } from "@heroui/react";
import { Send, Search, Phone, Video, MoreVertical, X, Plus, Users, Paperclip, Image as ImageIcon, File as FileIcon, Check, CheckCheck, Download, Mic, Reply, Forward, Pin, Trash2, Edit, Copy, MessageCircle, Play, Pause } from "lucide-react";
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
import EmojiPicker from "./components/EmojiPicker";
import VoiceWaveform from "./components/VoiceWaveform";

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
  const [voicePreview, setVoicePreview] = useState(null); // { blob, url, duration, waveform }
  const mediaStreamRef = useRef(null);
  const [liveWaveform, setLiveWaveform] = useState([]); // Real-time waveform during recording
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const animationFrameRef = useRef(null);
  const recordingDurationRef = useRef(0); // To track latest duration

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
      // No cleanup needed - socket managed by ChatNotificationContext
    };
  }, [user?.id, staff, students]);

  const initializeChat = async () => {
    try {
      setLoading(true);

      // Load contacts
      loadContacts();

      // Connect Socket.IO
      try {
        await socketService.connect(user.id, 'staff');
        setSocketConnected(true);

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
    } catch (error) {
      console.error('❌ Error loading contacts:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const convs = await chatService.getConversations(user.id, 'staff');
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
              return false;
            }
            // Also match if both have no content (empty voice messages)
            if (!m.content && !message.content && m._originalContent === '') {
              return false;
            }
            return true;
          }

          // For other message types, match by content
          if (m.content === message.content && m._originalContent === message.content) {
            return false;
          }
          return true;
        });

        // Add new message if not already exists
        if (!filtered.find(m => String(m.id) === String(message.id))) {
          return [...filtered, message];
        }
        return filtered;
      });
      scrollToBottom();

      // Mark as read if conversation is open and not sent by me
      if (socketService.isConnected() && String(message.senderId) !== String(user?.id)) {
        socketService.markAsRead(message.id, message.conversationId);
      }
    } else {
      // Message for different conversation - show notification
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

      // Upload file
      const uploadResult = await chatService.uploadFile(selectedFile);

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
      // Clear any previous preview
      if (voicePreview?.url) {
        URL.revokeObjectURL(voicePreview.url);
        setVoicePreview(null);
      }
      setLiveWaveform([]);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Setup audio analyser for waveform visualization
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 2048; // Higher resolution for better amplitude detection
      analyser.smoothingTimeConstant = 0.3;
      analyserRef.current = analyser;
      audioContextRef.current = audioContext;

      const recorder = new MediaRecorder(stream);
      const chunks = [];
      const allAmplitudeSamples = []; // Store all amplitude samples over time

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);

        // Get the latest values from refs
        const finalDuration = recordingDurationRef.current;

        // Compress all amplitude samples to 50 bars for display
        const compressedWaveform = compressWaveform(allAmplitudeSamples, 50);

        // Show preview instead of auto-sending
        setVoicePreview({
          blob,
          url,
          duration: finalDuration,
          waveform: compressedWaveform
        });
        setRecordedChunks([]);
        setIsRecording(false);

        // Stop animation
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;

        // Close audio context
        audioContext.close();
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingDuration(0);
      recordingDurationRef.current = 0;

      // Store samples array reference for the recorder
      recorder.amplitudeSamples = allAmplitudeSamples;

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newValue = prev + 1;
          recordingDurationRef.current = newValue;
          return newValue;
        });
      }, 1000);

      // Sample amplitude at regular intervals (100ms = 10 samples per second)
      const sampleInterval = setInterval(() => {
        if (!analyserRef.current || !recorder.amplitudeSamples) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteTimeDomainData(dataArray);

        // Calculate RMS (root mean square) amplitude
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const normalized = (dataArray[i] - 128) / 128;
          sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / dataArray.length);

        // Store the amplitude sample
        recorder.amplitudeSamples.push(rms);

        // Update live display - show last 50 samples for real-time visualization
        const recentSamples = recorder.amplitudeSamples.slice(-50);
        setLiveWaveform(recentSamples);
      }, 100); // Sample every 100ms

      recorder.sampleInterval = sampleInterval;

    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to access microphone');
    }
  };

  // Compress waveform samples to a specific number of bars
  const compressWaveform = (samples, targetBars) => {
    if (!samples || samples.length === 0) {
      return Array(targetBars).fill(0.1);
    }

    const result = [];
    const samplesPerBar = Math.max(1, Math.floor(samples.length / targetBars));

    for (let i = 0; i < targetBars; i++) {
      const start = i * samplesPerBar;
      const end = Math.min(start + samplesPerBar, samples.length);

      if (start >= samples.length) {
        result.push(0.1);
        continue;
      }

      // Take the maximum amplitude in this segment (peak detection)
      let max = 0.1;
      for (let j = start; j < end; j++) {
        if (samples[j] > max) max = samples[j];
      }

      // Apply some gain and normalize
      const amplified = Math.min(1, max * 3);
      result.push(Math.max(0.1, amplified));
    }

    return result;
  };

  const handleStopRecording = () => {
    // Clear the sample interval
    if (mediaRecorder && mediaRecorder.sampleInterval) {
      clearInterval(mediaRecorder.sampleInterval);
    }

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const handleCancelVoicePreview = () => {
    if (voicePreview?.url) {
      URL.revokeObjectURL(voicePreview.url);
    }
    setVoicePreview(null);
    setRecordingDuration(0);
    setLiveWaveform([]);
    recordingDurationRef.current = 0;
  };

  const handleSendVoiceMessage = async () => {
    if (!voicePreview || !selectedConversation) return;

    const { blob, duration, waveform } = voicePreview;
    const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });

    setSending(true);
    try {
      setUploadingFile(true);

      // Upload file
      const uploadResult = await chatService.uploadFile(file);

      if (!uploadResult.url) {
        throw new Error('Upload succeeded but no URL returned');
      }

      // Get receiver info
      const otherParticipant = selectedConversation.otherParticipant ||
        selectedConversation.participants?.find(p => p.userId !== user?.id);

      if (!otherParticipant) {
        throw new Error('Cannot find conversation participant');
      }

      // Send message with audio
      const messageData = {
        conversationId: selectedConversation.id,
        receiverId: otherParticipant.userId,
        receiverModel: otherParticipant.userType === 'staff' ? 'Staff' : 'Student',
        content: '',
        type: 'audio',
        fileUrl: uploadResult.url,
        duration: duration,
        waveform: waveform
      };

      if (socketService.isConnected()) {
        socketService.sendMessage(messageData);

        // Optimistically add message with proper flags for deduplication
        const optimisticMessage = {
          id: `temp_${Date.now()}`,
          ...messageData,
          senderId: user.id,
          senderName: user.name,
          status: 'sending',
          createdAt: new Date(),
          _isOptimistic: true,
          _originalContent: '' // For voice messages, content is empty
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

      // Clear preview
      URL.revokeObjectURL(voicePreview.url);
      setVoicePreview(null);
      setRecordingDuration(0);
      setLiveWaveform([]);

      // Reload conversations
      loadConversations();
      toast.success('Voice message sent');
    } catch (error) {
      console.error('❌ Error sending voice message:', error);
      toast.error('Failed to send voice message');
    } finally {
      setUploadingFile(false);
      setSending(false);
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
      const response = await request(`/messages/${messageId}/pin`, {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          pinned: true
        })
      });

      // Update local state immediately - use String comparison
      setMessages(prev => {
        const updated = prev.map(msg => {
          const matches = String(msg.id) === String(messageId);
          if (matches) {
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
      const response = await request(`/messages/${messageId}/pin`, {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          pinned: false
        })
      });

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
        <div className="w-80 shrink-0 border-r border-default-200 dark:border-zinc-800 bg-background h-full flex flex-col overflow-hidden">
          <div className="p-4 border-b border-default-200 dark:border-zinc-800 shrink-0">
            <div className="flex items-center gap-2 mb-3">
              {/* Improved Search Input */}
              <div className="flex items-center gap-2 flex-1 px-4 py-2.5 bg-default-50 dark:bg-zinc-900 rounded-xl border border-default-200 dark:border-zinc-800 focus-within:border-primary dark:focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
                <Search size={18} className="text-default-400 dark:text-zinc-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="flex-1 bg-transparent outline-none text-sm text-default-900 dark:text-zinc-100 placeholder:text-default-400 dark:placeholder:text-zinc-600"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-default-400 hover:text-default-600 dark:hover:text-zinc-300 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              {/* Improved New Chat Button */}
              <Tooltip content="New conversation" placement="top">
                <Button
                  isIconOnly
                  color="primary"
                  variant="solid"
                  onPress={() => setShowNewChatModal(true)}
                  className="rounded-xl bg-primary hover:bg-primary-600 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
                >
                  <Plus size={20} />
                </Button>
              </Tooltip>
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-2 text-xs px-1">
              <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-success' : 'bg-warning'} ${socketConnected ? 'animate-pulse' : ''}`} />
              <span className="text-default-500 dark:text-zinc-500 font-medium">
                {socketConnected ? 'Connected' : 'Offline mode'}
              </span>
            </div>
          </div>

          <ScrollShadow className="flex-1 min-h-0">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-default-400 dark:text-zinc-600">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-default-100 dark:bg-zinc-900 flex items-center justify-center">
                  <Users size={28} className="text-default-300 dark:text-zinc-700" />
                </div>
                <p className="font-medium text-default-500 dark:text-zinc-500">No conversations</p>
                <p className="text-sm mt-1">Start a new chat to begin messaging</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`flex items-center gap-3 p-3 cursor-pointer rounded-xl transition-all duration-200 border-l-[3px] group ${selectedConversation?.id === conv.id
                        ? "bg-primary-50 dark:bg-primary/10 border-primary"
                        : "border-transparent hover:bg-default-50 dark:hover:bg-zinc-900 hover:border-default-300 dark:hover:border-zinc-700"
                      }`}
                  >
                    <div className="relative shrink-0">
                      <Avatar
                        src={conv.otherParticipant?.avatar}
                        name={conv.otherParticipant?.name}
                        size="md"
                        className="ring-2 ring-transparent group-hover:ring-default-200 dark:group-hover:ring-zinc-700 transition-all duration-200"
                      />
                      {/* Improved Online Status with Pulse Animation */}
                      {conv.otherParticipant?.online && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-success-500 rounded-full border-2 border-white dark:border-zinc-900 shadow-lg shadow-success/30">
                          <span className="absolute inset-0 rounded-full bg-success-500 animate-ping opacity-75" />
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-sm truncate ${selectedConversation?.id === conv.id ? 'font-semibold text-primary' : 'font-medium text-default-900 dark:text-zinc-100 group-hover:text-default-900 dark:group-hover:text-zinc-100'}`}>
                          {conv.otherParticipant?.name}
                        </span>
                        {conv.lastMessage?.timestamp && (
                          <span className="text-[11px] text-default-400 dark:text-zinc-600 font-medium">
                            {formatTime(conv.lastMessage.timestamp)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-default-500 dark:text-zinc-500 truncate flex-1">
                          {conv.lastMessage?.content || (conv.lastMessage?.type === 'audio' ? '🎤 Voice message' : conv.lastMessage?.type === 'image' ? '📷 Photo' : conv.lastMessage?.type === 'video' ? '🎥 Video' : conv.lastMessage?.type === 'file' ? '📎 File' : 'No messages')}
                        </p>
                        {conv.unreadCount > 0 && (
                          <Chip size="sm" color="primary" variant="solid" className="ml-2 min-w-5 h-5 text-[10px] font-bold shadow-sm shadow-primary/30">
                            {conv.unreadCount}
                          </Chip>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollShadow>
        </div>

        {/* Chat Area */}
        {selectedConversation ? (
          <div className="flex-1 bg-background dark:bg-zinc-950 h-full flex flex-col overflow-hidden">
            {/* Chat Header - Improved with better status display and hover effects */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-default-200 dark:border-zinc-800 shrink-0 bg-background dark:bg-zinc-950">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar
                    src={selectedConversation.otherParticipant?.avatar}
                    name={selectedConversation.otherParticipant?.name}
                    size="md"
                    className="ring-2 ring-default-100 dark:ring-zinc-800"
                  />
                  {/* Improved Online Status with Pulse */}
                  {selectedConversation.otherParticipant?.online && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-success-500 rounded-full border-2 border-white dark:border-zinc-950 shadow-lg shadow-success/30">
                      <span className="absolute inset-0 rounded-full bg-success-500 animate-ping opacity-75" />
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-default-900 dark:text-zinc-100">
                    {selectedConversation.otherParticipant?.name}
                  </p>
                  <p className={`text-xs font-medium flex items-center gap-1 ${selectedConversation.otherParticipant?.online ? 'text-success-600 dark:text-success-500' : 'text-default-500 dark:text-zinc-500'}`}>
                    {selectedConversation.otherParticipant?.online ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-success-500" />
                        Online
                      </>
                    ) : (
                      formatLastSeen(selectedConversation.otherParticipant?.lastSeen)
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Tooltip content="Search Messages" placement="top">
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onPress={() => document.getElementById('chat-search-input')?.focus()}
                    className="text-default-500 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-xl transition-all duration-200"
                  >
                    <Search size={18} />
                  </Button>
                </Tooltip>
                {pinnedMessages && pinnedMessages.length > 0 && (
                  <Tooltip content="View Pinned Messages" placement="top">
                    <Button
                      isIconOnly
                      variant="light"
                      size="sm"
                      onPress={() => {
                        const pinnedSection = document.querySelector('[data-pinned-messages]');
                        pinnedSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className="text-default-500 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-xl transition-all duration-200"
                    >
                      <Pin size={18} />
                    </Button>
                  </Tooltip>
                )}
                <Tooltip content="Voice Call" placement="top">
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onPress={() => handleVideoCall('audio')}
                    className="text-default-500 hover:text-success-600 hover:bg-success/10 dark:hover:bg-success/20 rounded-xl transition-all duration-200"
                  >
                    <Phone size={18} />
                  </Button>
                </Tooltip>
                <Tooltip content="Video Call" placement="top">
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onPress={() => handleVideoCall('video')}
                    className="text-default-500 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-xl transition-all duration-200"
                  >
                    <Video size={18} />
                  </Button>
                </Tooltip>
                <Tooltip content="More options" placement="top">
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    className="text-default-500 hover:text-default-700 dark:hover:text-zinc-300 hover:bg-default-100 dark:hover:bg-zinc-800 rounded-xl transition-all duration-200"
                  >
                    <MoreVertical size={18} />
                  </Button>
                </Tooltip>
              </div>
            </div>

            {/* Pinned Messages Bar - Improved styling */}
            {pinnedMessages && pinnedMessages.length > 0 && (
              <div data-pinned-messages className="border-b border-default-200 dark:border-zinc-800 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 p-3 shrink-0">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin">
                  <div className="flex items-center gap-1.5 text-primary shrink-0">
                    <Pin size={14} />
                    <span className="text-xs font-semibold">Pinned</span>
                  </div>
                  <div className="flex gap-2">
                    {pinnedMessages.map((msg) => (
                      <div
                        key={msg.id}
                        onClick={() => {
                          const messageElement = document.getElementById(`message-${msg.id}`);
                          if (messageElement) {
                            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            messageElement.classList.add('bg-primary-100', 'dark:bg-primary/20');
                            setTimeout(() => {
                              messageElement.classList.remove('bg-primary-100', 'dark:bg-primary/20');
                            }, 2000);
                          }
                        }}
                        className="flex-shrink-0 max-w-xs px-3 py-2 bg-white dark:bg-zinc-900 rounded-xl border border-default-200 dark:border-zinc-700 hover:border-primary hover:shadow-md hover:shadow-primary/10 cursor-pointer transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-primary truncate group-hover:text-primary-600">
                            {msg.senderName || 'Unknown'}
                          </span>
                          <span className="text-[10px] text-default-400 dark:text-zinc-600">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-default-600 dark:text-zinc-400 truncate">
                          {msg.content || (msg.type === 'image' ? 'Image' : msg.type === 'video' ? 'Video' : msg.type === 'audio' ? 'Voice' : msg.type === 'file' ? 'File' : 'Message')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Messages - Improved bubble styling */}
            <ScrollShadow className="flex-1 min-h-0 p-4 space-y-3">
              {messages.map((msg) => {
                // Convert both to strings for proper comparison
                const isMe = String(msg.senderId) === String(user?.id);

                return (
                  <div
                    key={msg.id}
                    id={`message-${msg.id}`}
                    className={`flex group ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div className="relative max-w-[75%]">
                      {/* Emoji Button - Positioned absolutely outside the bubble */}
                      {(!editingMessage) && (
                        <div className={`absolute top-1 ${isMe ? '-left-9' : '-right-9'} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                          <button
                            onClick={() => handleMessageAction('react', { message: msg })}
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-zinc-800 hover:bg-primary/10 dark:hover:bg-primary/20 text-default-500 hover:text-primary transition-all duration-200 border border-default-200 dark:border-zinc-700 shrink-0 shadow-sm hover:shadow-md"
                            title="Add reaction"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"/>
                              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                              <line x1="9" y1="9" x2="9.01" y2="9"/>
                              <line x1="15" y1="9" x2="15.01" y2="9"/>
                            </svg>
                          </button>

                          {/* Emoji Picker */}
                          {emojiPickerMessage?.id === msg.id && (
                            <div className={`absolute top-10 ${isMe ? 'right-0' : 'left-0'} z-50`}>
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

                      {/* Message Actions Menu - Positioned absolutely outside the bubble */}
                      {(!editingMessage) && (
                        <div className={`absolute top-1 ${isMe ? '-right-9' : '-left-9'} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                          <MessageActionsMenu
                            message={msg}
                            currentUserId={user.id}
                            onAction={handleMessageAction}
                          />
                        </div>
                      )}

                      {/* Message Bubble - Modern rounded corners and better spacing */}
                      <div
                        className={`px-4 py-2.5 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md ${isMe
                            ? "bg-primary text-white rounded-br-md shadow-sm shadow-primary/20"
                            : "bg-default-100 dark:bg-zinc-800 text-default-900 dark:text-zinc-100 rounded-bl-md shadow-sm"
                          }`}
                      >
                        {/* Forwarded indicator */}
                        {msg.forwardedFrom && (
                          <div className={`mb-2 pb-2 border-l-2 ${isMe ? 'border-white/30' : 'border-primary/30 dark:border-primary/50'} pl-2`}>
                            <p className="text-xs opacity-70 flex items-center gap-1">
                              <Forward size={12} />
                              Forwarded from {msg.forwardedFrom.originalSenderName || 'another chat'}
                            </p>
                          </div>
                        )}

                        {/* Reply to indicator */}
                        {msg.replyTo && (
                          <div
                            className={`mb-2 pb-2 border-l-2 ${isMe ? 'border-white/30' : 'border-primary/30 dark:border-primary/50'} pl-2 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 rounded-r transition-colors`}
                            onClick={() => {
                              const replyEl = document.getElementById(`message-${msg.replyTo.id || msg.replyTo._id}`);
                              if (replyEl) {
                                replyEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                replyEl.classList.add('ring-2', 'ring-primary', 'ring-opacity-50');
                                setTimeout(() => replyEl.classList.remove('ring-2', 'ring-primary', 'ring-opacity-50'), 2000);
                              }
                            }}
                          >
                            <p className="text-xs opacity-70 font-medium">
                              {typeof msg.replyTo === 'object'
                                ? (msg.replyTo.senderName || msg.replyTo.senderId?.name || 'Message')
                                : 'Message'}
                            </p>
                            <p className="text-sm opacity-80 truncate">
                              {typeof msg.replyTo === 'object'
                                ? (msg.replyTo.content || (msg.replyTo.type === 'image' ? '📷 Photo' : msg.replyTo.type === 'audio' ? '🎤 Voice' : msg.replyTo.type === 'file' ? '📎 File' : 'Message'))
                                : 'View message'}
                            </p>
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
                                input: `text-sm break-words ${isMe ? 'text-white' : 'text-default-900 dark:text-zinc-100'}`,
                                inputWrapper: `${isMe
                                  ? 'bg-white/20 border-white/30'
                                  : 'bg-white dark:bg-zinc-700 border-default-300 dark:border-zinc-600'
                                } shadow-none w-full`
                              }}
                              variant="bordered"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" color="primary" onPress={handleEditMessage} className="rounded-lg">
                                Save
                              </Button>
                              <Button size="sm" variant="light" onPress={() => {
                                setEditingMessage(null);
                                setEditText('');
                              }} className="rounded-lg">
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
                                className="max-w-full max-h-80 rounded-xl mb-2 cursor-pointer hover:opacity-95 transition-opacity"
                                onClick={() => window.open(msg.fileUrl, '_blank')}
                              />
                            )}
                            {msg.type === 'video' && msg.fileUrl && (
                              <video
                                src={msg.fileUrl}
                                controls
                                className="max-w-full max-h-80 rounded-xl mb-2"
                              />
                            )}
                            {msg.type === 'audio' && (
                              <div className="mb-2 min-w-[200px] max-w-[280px]">
                                {msg.fileUrl ? (
                                  <VoiceWaveform
                                    audioUrl={msg.fileUrl}
                                    waveformData={msg.waveform || []}
                                    duration={msg.duration || 0}
                                    isOwn={isMe}
                                  />
                                ) : (
                                  <div className="flex items-center gap-2 py-1">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isMe ? 'bg-white/20' : 'bg-primary/20'}`}>
                                      <Mic size={14} className={isMe ? 'text-white' : 'text-primary'} />
                                    </div>
                                    <span className={`text-xs ${isMe ? 'text-white/70' : 'text-default-400'}`}>Sending voice message...</span>
                                  </div>
                                )}
                              </div>
                            )}
                            {msg.type === 'file' && msg.fileUrl && (
                              <div className="flex items-center gap-3 mb-2 p-3 bg-black/10 dark:bg-white/5 rounded-xl hover:bg-black/15 dark:hover:bg-white/10 transition-colors cursor-pointer"
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
                            {msg.content && msg.type !== 'audio' && (
                              <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                            )}
                            <div className="flex items-center gap-1.5 mt-1.5 pt-1.5">
                              {msg.isEdited && (
                                <span className={`text-[10px] ${isMe ? 'text-white/60' : 'text-default-400 dark:text-zinc-500'}`}>
                                  edited
                                </span>
                              )}
                              <p className={`text-[11px] ${isMe ? 'text-white/70' : 'text-default-400 dark:text-zinc-500'}`}>
                                {formatTime(msg.createdAt)}
                              </p>
                              {getMessageStatus(msg)}
                            </div>

                            {/* Message Reactions - Improved display */}
                            {(!editingMessage) && (msg.reactions?.length > 0) && (
                              <div className="mt-2 pt-2 border-t border-white/20 dark:border-white/10">
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
                    </div>
                  </div>
              );
              })}

              {/* Typing Indicator - Improved animation */}
              {typingUsers.size > 0 && (
                <div className="flex justify-start">
                  <div className="bg-default-100 dark:bg-zinc-800 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                    <div className="flex gap-1.5 items-center">
                      <span className="w-2 h-2 bg-default-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDuration: '600ms' }} />
                      <span className="w-2 h-2 bg-default-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDuration: '600ms', animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-default-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDuration: '600ms', animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </ScrollShadow>

            {/* Input Area - Improved styling */}
            <div className="p-4 border-t border-default-200 dark:border-zinc-800 shrink-0 bg-background dark:bg-zinc-950">
              {/* Reply Preview */}
              {replyToMessage && (
                <ReplyPreview
                  message={replyToMessage}
                  onCancel={() => setReplyToMessage(null)}
                />
              )}

              {/* File Preview - Improved card design */}
              {selectedFile && (
                <div className="mb-3 p-3 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 rounded-xl border border-primary/20 dark:border-primary/30">
                  <div className="flex items-center gap-3">
                    {filePreview ? (
                      <div className="relative group">
                        <img
                          src={filePreview}
                          alt="Preview"
                          className="w-14 h-14 object-cover rounded-lg flex-shrink-0 shadow-md"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <ImageIcon size={18} className="text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-14 h-14 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 shadow-md border border-default-200 dark:border-zinc-700">
                        {getFileIcon(selectedFile.name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-default-900 dark:text-zinc-100 truncate">{selectedFile.name}</p>
                      <p className="text-xs text-primary font-medium">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={handleCancelFile}
                      isDisabled={uploadingFile}
                      className="flex-shrink-0 text-default-500 hover:text-danger hover:bg-danger/10 rounded-lg transition-all duration-200"
                    >
                      <X size={18} />
                    </Button>
                  </div>
                </div>
              )}

              {/* Voice Message Preview - WhatsApp style */}
              {voicePreview && (
                <div className="mb-3 p-3 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 rounded-xl border border-primary/20 dark:border-primary/30">
                  <VoiceWaveform
                    audioUrl={voicePreview.url}
                    waveformData={voicePreview.waveform || []}
                    duration={voicePreview.duration}
                    isOwn={false}
                  />
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-primary/10">
                    <Button
                      size="sm"
                      variant="light"
                      onPress={handleCancelVoicePreview}
                      className="text-danger hover:bg-danger/10 rounded-lg"
                      startContent={<X size={14} />}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      color="primary"
                      onPress={handleSendVoiceMessage}
                      isLoading={sending || uploadingFile}
                      startContent={!sending && !uploadingFile && <Send size={14} />}
                      className="rounded-lg"
                    >
                      Send
                    </Button>
                  </div>
                </div>
              )}

              {/* Recording Indicator - Live waveform */}
              {isRecording && (
                <div className="mb-3 p-3 bg-danger/10 dark:bg-danger/20 rounded-xl border border-danger/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-danger flex items-center justify-center flex-shrink-0 animate-pulse">
                      <Mic size={18} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <VoiceWaveform
                        isRecording={true}
                        liveLevels={liveWaveform}
                        duration={recordingDuration}
                        isOwn={false}
                        size="small"
                      />
                    </div>
                    <Button
                      size="sm"
                      color="danger"
                      variant="solid"
                      onPress={handleStopRecording}
                      className="rounded-lg"
                    >
                      Stop
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                />
                {/* Attachment Button */}
                <Tooltip content="Attach file" placement="top">
                  <Button
                    isIconOnly
                    variant="light"
                    onPress={() => fileInputRef.current?.click()}
                    isDisabled={uploadingFile || isRecording || !!voicePreview}
                    className="text-default-500 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-xl transition-all duration-200"
                  >
                    <Paperclip size={20} />
                  </Button>
                </Tooltip>

                {/* Voice Recording Button - hide when recording or preview is shown */}
                {!voicePreview && !isRecording && (
                  <Tooltip content="Record voice message" placement="top">
                    <Button
                      isIconOnly
                      variant="light"
                      onPress={handleStartRecording}
                      isDisabled={sending || uploadingFile || !!selectedFile}
                      className="text-default-500 hover:text-danger hover:bg-danger/10 dark:hover:bg-danger/20 rounded-xl transition-all duration-200"
                    >
                      <Mic size={20} />
                    </Button>
                  </Tooltip>
                )}

                {/* Input Field - Improved with border */}
                <div className="flex-1 relative">
                  <Input
                    ref={messageInputRef}
                    placeholder={replyToMessage ? `Replying to ${replyToMessage.senderName || 'message'}...` : selectedFile ? "Add a caption (optional)..." : voicePreview ? "Voice message ready..." : "Type a message..."}
                    value={newMessage}
                    onChange={handleTyping}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    disabled={sending || uploadingFile || isRecording || !!voicePreview}
                    classNames={{
                      input: "text-sm",
                      inputWrapper: "h-11 rounded-xl border-default-200 dark:border-zinc-700 hover:border-primary dark:hover:border-primary focus-within:border-primary dark:focus-within:border-primary shadow-sm"
                    }}
                    variant="bordered"
                  />
                </div>

                {/* Send Button - Improved hover effect (hide when voice preview) */}
                {!voicePreview && (
                  <Tooltip content="Send message" placement="top">
                    <Button
                      color="primary"
                      onPress={handleSend}
                      isLoading={sending || uploadingFile}
                      isIconOnly
                      isDisabled={!selectedFile && !newMessage.trim()}
                      className="rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-105 transition-all duration-200 disabled:hover:scale-100 disabled:shadow-none"
                    >
                      <Send size={18} />
                    </Button>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Empty State - Improved illustration style */
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-default-50 to-default-100 dark:from-zinc-900 dark:to-zinc-950">
            <div className="text-center max-w-md px-8">
              {/* Illustration-style icon container */}
              <div className="relative mx-auto mb-6">
                <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/10 flex items-center justify-center shadow-xl shadow-primary/10">
                  <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-lg">
                    <MessageCircle size={32} className="text-primary" />
                  </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
                </div>
                <div className="absolute -bottom-1 -left-3 w-6 h-6 rounded-full bg-primary/20" />
              </div>
              <h3 className="text-xl font-semibold text-default-900 dark:text-zinc-100 mb-2">
                Select a conversation
              </h3>
              <p className="text-default-500 dark:text-zinc-500 text-sm leading-relaxed">
                Choose from your existing conversations or start a new one to begin messaging with colleagues and students
              </p>
              <Button
                color="primary"
                variant="flat"
                onPress={() => setShowNewChatModal(true)}
                className="mt-6 rounded-xl"
                startContent={<Plus size={18} />}
              >
                Start new conversation
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal - Improved styling */}
      <Modal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        size="2xl"
        classNames={{
          base: "max-h-[90vh]",
          body: "p-0"
        }}
      >
        <ModalContent className="overflow-hidden">
          <ModalHeader className="border-b border-default-200 dark:border-zinc-800 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                <MessageCircle size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-default-900 dark:text-zinc-100">Start New Conversation</h3>
                <p className="text-xs text-default-500 dark:text-zinc-500">Select a contact to begin messaging</p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="p-4">
            <Input
              placeholder="Search contacts by name or role..."
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              startContent={<Search size={18} className="text-default-400" />}
              classNames={{
                input: "text-sm",
                inputWrapper: "rounded-xl border-default-200 dark:border-zinc-700"
              }}
              variant="bordered"
              className="mb-4"
            />
            <ScrollShadow className="max-h-96">
              {filteredContacts.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-default-100 dark:bg-zinc-800 flex items-center justify-center">
                    <Users size={20} className="text-default-400 dark:text-zinc-600" />
                  </div>
                  <p className="text-default-500 dark:text-zinc-500 text-sm">No contacts found</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => startNewConversation(contact)}
                      className="flex items-center gap-3 p-3 hover:bg-primary/10 dark:hover:bg-primary/20 rounded-xl cursor-pointer transition-all duration-200 group border border-transparent hover:border-primary/30"
                    >
                      <Avatar
                        src={contact.avatar}
                        name={contact.name}
                        size="md"
                        className="ring-2 ring-transparent group-hover:ring-primary/30 transition-all duration-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-default-900 dark:text-zinc-100 group-hover:text-primary transition-colors">{contact.name}</p>
                        <p className="text-xs text-default-500 dark:text-zinc-500">{contact.role}</p>
                      </div>
                      <Chip size="sm" variant="flat" className="capitalize bg-default-100 dark:bg-zinc-800 text-default-600 dark:text-zinc-400">
                        {contact.type}
                      </Chip>
                    </div>
                  ))}
                </div>
              )}
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
