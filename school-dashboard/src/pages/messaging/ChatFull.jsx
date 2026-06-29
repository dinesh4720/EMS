import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
import { useReducedMotion } from "../../hooks/useReducedMotion";
import videoCallService from "../../services/videoCallService";

// Below this viewport the two-pane shell collapses to a single pane with a
// back button on the message view. Matches StaffList's MOBILE_MAX.
const MOBILE_MAX = 1099;

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
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= MOBILE_MAX : false
  );

  // Refs
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const selectedConversationRef = useRef(null);
  const socketListenersSetupRef = useRef(false);
  const socketHandlersRef = useRef({});
  const pendingSocketMessagesRef = useRef(new Set());
  const outboxQueueRef = useRef([]);
  const sidebarListRef = useRef(null);
  const sidebarSearchInputRef = useRef(null);
  const rowRefs = useRef(new Map());

  // ── Responsive viewport ────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => setIsMobileViewport(window.innerWidth <= MOBILE_MAX);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const prefersReducedMotion = useReducedMotion();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
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
    loadOlderMessages,
    loadingOlder,
    hasMoreOlder,
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
    chatService,
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
    remoteStream,
    localStream,
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
  // Depend only on user?.id and the *loaded-ness* of staff/students (boolean
  // coercions), NOT their array identity. staff/students come from useApp()
  // and get a new identity on every socket-driven update and window-refocus
  // refetch; depending on the arrays themselves re-ran this effect on every
  // tick, tearing down listeners + destroying the PeerJS peer (dropping any
  // active video call) and re-fetching contacts+conversations each time.
  // !!staff/!!students flip only when loading completes (null → array), so the
  // effect fires once on initial load and again only on real auth teardown.
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
    // Depend on the *loaded-ness* of staff/students (boolean), not their array
    // identity, so the effect fires once on initial load instead of on every
    // socket tick. initializeChat is a per-render closure; including it would
    // re-fire every render. See MEM-06.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, !!staff, !!students]);

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

  // ── Keyboard navigation (J/K, Enter, /, Esc) ──────────────────────────────
  const filteredConversationsForNav = useMemo(
    () => conversations.filter(c =>
      c.otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [conversations, searchQuery]
  );

  const focusRow = useCallback((id) => {
    requestAnimationFrame(() => {
      rowRefs.current.get(id)?.scrollIntoView({ block: "nearest" });
      rowRefs.current.get(id)?.focus({ preventScroll: true });
    });
  }, []);

  const moveConversation = useCallback((delta) => {
    if (filteredConversationsForNav.length === 0) return;
    const currentId = selectedConversation?.id || selectedConversation?._id;
    const idx = filteredConversationsForNav.findIndex(c => (c.id || c._id) === currentId);
    const nextIdx = idx === -1
      ? (delta > 0 ? 0 : filteredConversationsForNav.length - 1)
      : Math.min(filteredConversationsForNav.length - 1, Math.max(0, idx + delta));
    const next = filteredConversationsForNav[nextIdx];
    if (!next) return;
    handleSelectConversation(next);
    focusRow(next.id || next._id);
  }, [filteredConversationsForNav, selectedConversation, handleSelectConversation, focusRow]);

  const handleListKeyDown = useCallback((e) => {
    const tag = e.target?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.key === "j" || e.key === "ArrowDown") {
      e.preventDefault();
      moveConversation(1);
    } else if (e.key === "k" || e.key === "ArrowUp") {
      e.preventDefault();
      moveConversation(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      messageInputRef.current?.focus?.();
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (searchQuery) setSearchQuery("");
    }
  }, [moveConversation, searchQuery]);

  // Global shortcuts: "/" focuses sidebar search; "Esc" exits message focus.
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        sidebarSearchInputRef.current?.focus?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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

  // On mobile, single-pane: show sidebar OR message view (based on selection)
  const showSidebar = !isMobileViewport || !selectedConversation;
  const showMain = !isMobileViewport || !!selectedConversation;
  const handleBack = () => setSelectedConversation(null);

  return (
    <>
      <div className={`chat-shell ${isMobileViewport ? 'chat-shell--mobile' : ''}`}>
        {/* Sidebar — conversation list + new chat modal */}
        {showSidebar && (
          <ChatSidebar
            ref={sidebarListRef}
            searchInputRef={sidebarSearchInputRef}
            rowRefs={rowRefs}
            onListKeyDown={handleListKeyDown}
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
        )}

        {/* Chat area — message list + input bar */}
        {showMain && (
        <div className="chat-shell__main">
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
            isMobile={isMobileViewport}
            onBack={isMobileViewport ? handleBack : undefined}
            onLoadOlder={loadOlderMessages}
            loadingOlder={loadingOlder}
            hasMoreOlder={hasMoreOlder}
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
        )}
      </div>

      {/* Video Call Modal */}
      {showVideoCall && activeCall && (
        <VideoCallModal
          isOpen={showVideoCall}
          onClose={closeVideoCall}
          call={activeCall}
          remoteStream={remoteStream}
          localStream={localStream}
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
