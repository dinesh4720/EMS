import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import logger from "../../utils/logger";
import { ErrorState } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import socketService from "../../services/socketServiceEnhanced";
import chatService from "../../services/chatService";
import toast from "react-hot-toast";
import VideoCallModal from "./components/VideoCallModal";
import ForwardModal from "./components/ForwardModal";
import ChatSidebar from "./components/ChatSidebar";
import ChatMessageList from "./components/ChatMessageList";
import ChatInputBar from "./components/ChatInputBar";
import ChatSkeleton from "./components/ChatSkeleton";
import { useVoiceRecording } from "./hooks/useVoiceRecording";
import { useVoiceMessageHandler } from "./hooks/useVoiceMessageHandler";
import { useSocketListeners } from "./hooks/useSocketListeners";
import { useMessageActions } from "./hooks/useMessageActions";
import { useConversationManager } from "./hooks/useConversationManager";
import { useChatFileUpload } from "./hooks/useChatFileUpload";
import { useChatMessageInteractions } from "./hooks/useChatMessageInteractions";
import { useChatVideoCall } from "./hooks/useChatVideoCall";
import { useChatSend } from "./hooks/useChatSend";
import { useTranslation } from 'react-i18next';
import videoCallService from "../../services/videoCallService";

export default function ChatFull() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { staff, students } = useApp();
  const location = useLocation();
  const autoSelectDoneRef = useRef(false);

  // Core state
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [sending, setSending] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const selectedConversationRef = useRef(null);
  const socketListenersSetupRef = useRef(false);
  const socketHandlersRef = useRef({});
  const pendingSocketMessagesRef = useRef(new Set());
  const outboxQueueRef = useRef([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ── Message interaction state (reply/forward/edit/pin/emoji) ──────────────
  const {
    replyToMessage, setReplyToMessage,
    showForwardModal, setShowForwardModal,
    selectedMessage, setSelectedMessage,
    pinnedMessages, setPinnedMessages,
    editingMessage, setEditingMessage,
    editText, setEditText,
    emojiPickerMessage, setEmojiPickerMessage,
  } = useChatMessageInteractions();

  // ── File upload state ──────────────────────────────────────────────────────
  const {
    uploadingFile, setUploadingFile,
    uploadProgress: _uploadProgress, setUploadProgress,
    selectedFile, setSelectedFile,
    filePreview, setFilePreview,
    fileInputRef,
  } = useChatFileUpload();

  // ── Voice recording ────────────────────────────────────────────────────────
  const voiceRecordingState = useVoiceRecording();
  const {
    isRecording,
    recordingDuration,
    voicePreview,
    liveWaveform,
  } = voiceRecordingState;

  // ── Conversation manager ───────────────────────────────────────────────────
  const {
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
  } = useConversationManager({
    chatService,
    socketService,
    user,
    staff,
    students,
    setMessages,
    setOnlineUsers: () => {},   // handled inside useSocketListeners
    scrollToBottom,
    setShowMessageSearch: () => {},
  });

  // ── Socket listeners ───────────────────────────────────────────────────────
  const {
    socketConnected,
    setSocketConnected,
    typingUsers,
    setOnlineUsers,
    setupSocketListeners: setupListeners,
    handleNewMessage,
  } = useSocketListeners({
    socketService,
    user,
    selectedConversationRef,
    setMessages,
    setConversations,
    setPinnedMessages,
    onNewMessageReceived: loadConversations,
    scrollToBottom,
    pendingSocketMessagesRef,
  });

  // ── Message actions (react/pin/unpin/delete/edit) ─────────────────────────
  const {
    handleMessageAction,
    handleEditMessage,
    loadPinnedMessages,
  } = useMessageActions({
    user,
    chatService,
    messages,
    setMessages,
    setPinnedMessages,
    setReplyToMessage,
    setSelectedMessage,
    setShowForwardModal,
    setEditingMessage,
    setEditText,
    setEmojiPickerMessage,
    messageInputRef,
  });

  // ── Send (text / file / typing / forward) ─────────────────────────────────
  const {
    handleSend,
    handleCancelFile,
    handleFileSelect,
    handleTyping,
    handleForwardSubmit,
  } = useChatSend({
    user,
    selectedConversation,
    newMessage,
    setNewMessage,
    sending,
    setSending,
    setMessages,
    setUploadingFile,
    replyToMessage,
    setReplyToMessage,
    selectedFile,
    setSelectedFile,
    setFilePreview,
    fileInputRef,
    outboxQueueRef,
    loadConversations,
    scrollToBottom,
    selectedMessage,
    setShowForwardModal,
    setSelectedMessage,
    conversations,
  });

  // ── Video call ─────────────────────────────────────────────────────────────
  const {
    showVideoCall,
    activeCall,
    handleVideoCall,
    handleAcceptCall,
    handleRejectCall,
    handleEndCall,
    closeVideoCall,
  } = useChatVideoCall({ user, selectedConversation });

  // ── Voice message handler ──────────────────────────────────────────────────
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

  // ── Keep selectedConversationRef in sync ───────────────────────────────────
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // ── Load pinned messages when conversation/messages change ─────────────────
  useEffect(() => {
    if (selectedConversation && messages.length > 0) {
      loadPinnedMessages(messages);
    }
  }, [selectedConversation, messages]);

  // ── Auto-select conversation navigated from notification ───────────────────
  useEffect(() => {
    const targetId = location.state?.conversationId;
    if (!targetId || autoSelectDoneRef.current || conversations.length === 0) return;
    const match = conversations.find(c => c.id === targetId || c._id === targetId);
    if (match) {
      autoSelectDoneRef.current = true;
      handleSelectConversation(match);
    }
  }, [conversations, location.state?.conversationId]);

  // ── Initialization + cleanup ───────────────────────────────────────────────
  useEffect(() => {
    if (user?.id && staff && students) {
      initializeChat();
    }

    // IMPORTANT: Do NOT disconnect socket on unmount!
    // The socket is shared with ChatNotificationContext for global notifications.
    // Remove only this component's listeners to prevent memory leaks (AP-15).
    return () => {
      const h = socketHandlersRef.current;
      if (h.cleanup) h.cleanup();
      socketHandlersRef.current = {};
      socketListenersSetupRef.current = false;

      // Release PeerJS and media tracks if navigating away mid-call (AUDIT-930)
      if (videoCallService.currentCallId) {
        videoCallService.endCall(videoCallService.currentCallId);
      }
      if (videoCallService.peer && !videoCallService.peer.destroyed) {
        videoCallService.peer.destroy();
        videoCallService.peer = null;
      }
    };
  }, [user?.id, staff, students]);

  const initializeChat = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      loadContacts();

      try {
        await socketService.connect();
        setSocketConnected(true);

        if (!socketListenersSetupRef.current) {
          socketListenersSetupRef.current = true;
          const cleanup = setupListeners();
          socketHandlersRef.current.cleanup = cleanup;
        }

        await loadConversations();
      } catch (socketError) {
        logger.warn('Socket connection failed, using REST API only:', socketError);
        setSocketConnected(false);
        await loadConversations();
      }
    } catch (error) {
      logger.error('Error initializing chat:', error);
      setLoadError(error);
      toast.error(t('toast.error.failedToLoadChatPleaseRefreshThePage'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ChatSkeleton />;
  }

  if (loadError) {
    return (
      <ErrorState
        title={t('messaging.chat.failedToLoad', 'Failed to load chat')}
        description={t('messaging.chat.failedToLoadDescription', 'There was a problem loading your conversations. Please try again.')}
        onRetry={initializeChat}
      />
    );
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
            onEditSave={() => handleEditMessage(editingMessage, editText)}
            onEditCancel={() => { setEditingMessage(null); setEditText(''); }}
            emojiPickerMessage={emojiPickerMessage}
            onMessageAction={handleMessageAction}
            onVideoCall={handleVideoCall}
            onOpenNewChatModal={() => setShowNewChatModal(true)}
          />

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
          onClose={closeVideoCall}
          call={activeCall}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
          onEnd={handleEndCall}
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
