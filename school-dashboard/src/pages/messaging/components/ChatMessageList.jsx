import { useEffect, useLayoutEffect, useRef } from "react";
import { ScrollShadow } from "@heroui/react";
import { Search, Phone, Video, Pin, Check, CheckCheck, Forward, Download, Loader2, Mic, MessageCircle, Plus, ChevronLeft } from "lucide-react";
import MessageActionsMenu from "./MessageActionsMenu";
import MessageReactions from "./MessageReactions";
import EmojiPicker from "./EmojiPicker";
import VoiceWaveform from "./VoiceWaveform";
import { formatTime, formatLastSeen, getFileIcon, formatFileSize } from "../utils/chatUtils";
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  Button,
  IconButton,
  Tooltip,
  Textarea,
  EmptyState,
} from "../../../components/ui";

export default function ChatMessageList({
  selectedConversation,
  messages,
  typingUsers,
  pinnedMessages,
  user,
  messagesEndRef,
  editingMessage,
  editText,
  onEditTextChange,
  onEditSave,
  onEditCancel,
  emojiPickerMessage,
  onMessageAction,
  onVideoCall,
  onOpenNewChatModal,
  isMobile,
  onBack,
  onLoadOlder,
  loadingOlder,
  hasMoreOlder,
}) {
  const { t } = useTranslation();
  const scrollRef = useRef(null);
  const loadMoreSentinelRef = useRef(null);
  const prevFirstIdRef = useRef(null);
  const prevScrollHeightRef = useRef(0);

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

  // PAG-06: trigger onLoadOlder when the sentinel above the message list
  // scrolls into view. Disconnect while a fetch is in flight so we don't
  // queue a second request for the same page.
  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    const root = scrollRef.current;
    if (!sentinel || !root || !onLoadOlder) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) onLoadOlder();
        }
      },
      { root, rootMargin: '120px 0px 0px 0px', threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onLoadOlder, hasMoreOlder]);

  // PAG-06: when an older page is prepended, the browser keeps the same
  // scrollTop — which would push the user's view down by the height of the
  // newly inserted rows. Capture the height delta before paint and shift the
  // scroll position so the viewport stays anchored on the same message.
  useLayoutEffect(() => {
    const firstId = messages[0]?._id || messages[0]?.id || null;
    const prevFirstId = prevFirstIdRef.current;
    const el = scrollRef.current;
    if (prevFirstId && firstId && firstId !== prevFirstId && el && prevScrollHeightRef.current > 0) {
      const heightDelta = el.scrollHeight - prevScrollHeightRef.current;
      if (heightDelta > 0) {
        el.scrollTop = el.scrollTop + heightDelta;
      }
    }
    prevFirstIdRef.current = firstId;
    prevScrollHeightRef.current = el?.scrollHeight || 0;
  }, [messages]);

  // PAG-06: reset the scroll-preservation baseline when the user switches
  // conversations — the next prepend is for a different chat, not the same
  // page that was on screen.
  useEffect(() => {
    prevFirstIdRef.current = null;
    prevScrollHeightRef.current = 0;
  }, [selectedConversation?.id]);

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--color-bg-secondary)]">
        <EmptyState
          icon={MessageCircle}
          size="lg"
          title={t('messaging.chat.selectConversation', 'Select a conversation')}
          description={t(
            'messaging.chat.selectConversationDescription',
            'Choose from your existing conversations or start a new one to begin messaging with colleagues and students'
          )}
          action={(
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={onOpenNewChatModal}
            >
              {t('messaging.chat.startNewConversation', 'Start New Conversation')}
            </Button>
          )}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[var(--color-bg)] h-full flex flex-col overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)] shrink-0 bg-[var(--color-bg)]">
        <div className="flex items-center gap-3">
          {isMobile && onBack && (
            <button
              type="button"
              className="chat-back"
              onClick={onBack}
              aria-label={t('common.back', 'Back')}
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <Avatar
            src={selectedConversation.otherParticipant?.avatar}
            name={selectedConversation.otherParticipant?.name}
            size="md"
            status={selectedConversation.otherParticipant?.online ? 'online' : undefined}
          />
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              {selectedConversation.otherParticipant?.name}
            </p>
            <p className={`text-xs font-medium flex items-center gap-1 ${
              selectedConversation.otherParticipant?.online
                ? 'text-green-600 dark:text-green-500'
                : 'text-[var(--color-text-muted)]'
            }`}>
              {selectedConversation.otherParticipant?.online
                ? t('messaging.chat.online', 'Online')
                : formatLastSeen(selectedConversation.otherParticipant?.lastSeen)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip content={t('messaging.chat.searchMessages', 'Search Messages')}>
            <IconButton
              variant="ghost"
              onClick={() => document.getElementById('chat-search-input')?.focus()}
              aria-label={t('messaging.chat.searchMessages', 'Search Messages')}
            >
              <Search size={18} />
            </IconButton>
          </Tooltip>
          {pinnedMessages && pinnedMessages.length > 0 && (
            <Tooltip content={t('messaging.chat.viewPinnedMessages', 'View Pinned Messages')}>
              <IconButton
                variant="ghost"
                onClick={() => {
                  const pinnedSection = document.querySelector('[data-pinned-messages]');
                  pinnedSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                aria-label={t('messaging.chat.viewPinnedMessages', 'View Pinned Messages')}
              >
                <Pin size={18} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip content={t('messaging.chat.voiceCall', 'Voice Call')}>
            <IconButton
              variant="ghost"
              onClick={() => onVideoCall('audio')}
              aria-label={t('messaging.chat.voiceCall', 'Voice Call')}
            >
              <Phone size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip content={t('messaging.chat.videoCall', 'Video Call')}>
            <IconButton
              variant="ghost"
              onClick={() => onVideoCall('video')}
              aria-label={t('messaging.chat.videoCall', 'Video Call')}
            >
              <Video size={18} />
            </IconButton>
          </Tooltip>
          {/* More-options menu placeholder removed: inert button violates accessibility. Re-add only when an action is wired. */}
        </div>
      </div>

      {/* Pinned Messages Bar */}
      {pinnedMessages && pinnedMessages.length > 0 && (
        <div data-pinned-messages className="border-b border-default-200 dark:border-zinc-800 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 p-3 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin">
            <div className="flex items-center gap-1.5 text-primary shrink-0">
              <Pin size={14} />
              <span className="text-xs font-semibold">{t('pages.pinned')}</span>
            </div>
            <div className="flex gap-2">
              {pinnedMessages.map((msg, i) => (
                <button
                  type="button"
                  key={msg.id || msg._id || `pinned-${i}`}
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
                  className="flex-shrink-0 max-w-xs px-3 py-2 bg-surface rounded-xl border border-default-200 dark:border-zinc-700 hover:border-primary hover:shadow-md dark:hover:shadow-zinc-900/50 hover:shadow-primary/10 cursor-pointer transition-all duration-200 group text-left"
                  aria-label={t('messaging.chat.jumpToPinnedMessage', 'Jump to pinned message from {{sender}}', { sender: msg.senderName || t('common.unknown', 'Unknown') })}
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
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollShadow ref={scrollRef} className="flex-1 min-h-0 p-4 space-y-3">
        {/* PAG-06: sentinel above the message list — when it scrolls into
            view we fetch the next older page. A small status row also keeps
            users oriented while a fetch is in flight or when we've reached
            the start of the conversation. */}
        {(hasMoreOlder || loadingOlder) && (
          <div
            ref={loadMoreSentinelRef}
            data-testid="load-older-sentinel"
            className="flex items-center justify-center gap-2 py-2 text-xs text-[var(--color-text-muted)]"
            aria-live="polite"
          >
            {loadingOlder ? (
              <>
                <Loader2 size={14} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                <span>{t('messaging.chat.loadingOlder', 'Loading older messages…')}</span>
              </>
            ) : (
              <span>{t('messaging.chat.scrollForOlder', 'Scroll up for older messages')}</span>
            )}
          </div>
        )}
        {(() => {
          // Deduplicate by _id / id, then sort chronologically (BUG-08, BUG-34)
          const seen = new Set();
          const deduped = messages
            .filter(m => {
              const id = m._id || m.id;
              if (!id) return true; // keep optimistic messages without a server id
              if (seen.has(String(id))) return false;
              seen.add(String(id));
              return true;
            })
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          return deduped;
        })().map((msg) => {
          const isMe = String(msg.senderId) === String(user?.id);
          // Always use server _id as key; fall back to temp id for optimistic messages (BUG-08)
          const msgKey = msg._id || msg.id;

          return (
            <div
              key={msgKey}
              id={`message-${msg.id || msg._id}`}
              className={`flex group ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div className="relative max-w-[75%]">
                {/* Emoji Button */}
                {(!editingMessage) && (
                  <div className={`absolute top-1 ${isMe ? '-left-9' : '-right-9'} opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100 transition-opacity duration-200`}>
                    <button
                      type="button"
                      onClick={() => onMessageAction('react', { message: msg })}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-surface hover:bg-primary/10 dark:hover:bg-primary/20 text-default-500 hover:text-primary transition-all duration-200 border border-default-200 dark:border-zinc-700 shrink-0 shadow-sm hover:shadow-md dark:shadow-zinc-900/50 focus-visible:ring-2 focus-visible:ring-primary/50"
                      aria-label={t('pages.addReaction')}
                      title={t('pages.addReaction')}
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
                            onMessageAction('react', { message: msg, emoji });
                          }}
                          onClose={() => onMessageAction('closeEmojiPicker', {})}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Message Actions Menu */}
                {(!editingMessage) && (
                  <div className={`absolute top-1 ${isMe ? '-right-9' : '-left-9'} opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100 transition-opacity duration-200`}>
                    <MessageActionsMenu
                      message={msg}
                      currentUserId={user.id}
                      onAction={onMessageAction}
                    />
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`chat-bubble ${isMe ? 'chat-bubble--me' : 'chat-bubble--them'} overflow-hidden transition-all duration-200 hover:shadow-md dark:hover:shadow-zinc-900/50`}
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
                      role="button"
                      tabIndex={0}
                      aria-label={t('messaging.chat.jumpToReply', 'Jump to replied message')}
                      className={`mb-2 pb-2 border-l-2 ${isMe ? 'border-white/30' : 'border-primary/30 dark:border-primary/50'} pl-2 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 rounded-r transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50`}
                      onClick={() => {
                        const replyEl = document.getElementById(`message-${msg.replyTo.id || msg.replyTo._id}`);
                        if (replyEl) {
                          replyEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          replyEl.classList.add('ring-2', 'ring-primary', 'ring-opacity-50');
                          setTimeout(() => replyEl.classList.remove('ring-2', 'ring-primary', 'ring-opacity-50'), 2000);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          const replyEl = document.getElementById(`message-${msg.replyTo.id || msg.replyTo._id}`);
                          if (replyEl) {
                            replyEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            replyEl.classList.add('ring-2', 'ring-primary', 'ring-opacity-50');
                            setTimeout(() => replyEl.classList.remove('ring-2', 'ring-primary', 'ring-opacity-50'), 2000);
                          }
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
                        onChange={(e) => onEditTextChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            onEditSave();
                          } else if (e.key === 'Escape') {
                            onEditCancel();
                          }
                        }}
                        autoFocus
                        rows={2}
                        aria-label={t('messaging.chat.editMessage', 'Edit message')}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" variant="primary" onClick={onEditSave}>
                          {t('common.save', 'Save')}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={onEditCancel}>
                          {t('common.cancel', 'Cancel')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {msg.type === 'image' && msg.fileUrl && (
                        <button
                          type="button"
                          onClick={() => window.open(msg.fileUrl, '_blank', 'noopener,noreferrer')}
                          aria-label={t('messaging.chat.openImage', 'Open image {{fileName}}', { fileName: msg.fileName })}
                          className="block max-w-full max-h-80 rounded-xl mb-2 cursor-pointer hover:opacity-95 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 p-0 border-0 bg-transparent"
                        >
                          <img
                            src={msg.fileUrl}
                            alt={msg.fileName}
                            className="max-w-full max-h-80 rounded-xl"
                          />
                        </button>
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
                              <span className={`text-xs ${isMe ? 'text-white/70' : 'text-default-400'}`}>{t('pages.sendingVoiceMessage')}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {msg.type === 'file' && msg.fileUrl && (
                        <div
                          role="button"
                          tabIndex={0}
                          aria-label={t('messaging.chat.downloadFile', 'Download file {{fileName}}', { fileName: msg.fileName })}
                          className="flex items-center gap-3 mb-2 p-3 bg-black/10 dark:bg-white/5 rounded-xl hover:bg-black/15 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                          onClick={() => window.open(msg.fileUrl, '_blank', 'noopener,noreferrer')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              window.open(msg.fileUrl, '_blank', 'noopener,noreferrer');
                            }
                          }}
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
                        <p className="chat-bubble__time">
                          {formatTime(msg.createdAt)}
                        </p>
                        {getMessageStatus(msg)}
                      </div>

                      {/* Message Reactions */}
                      {(!editingMessage) && (msg.reactions?.length > 0) && (
                        <div className="mt-2 pt-2 border-t border-white/20 dark:border-white/10">
                          <MessageReactions
                            reactions={msg.reactions || []}
                            currentUserId={user.id}
                            onReact={(emoji) => onMessageAction('react', { message: msg, emoji })}
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

        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <div className="flex justify-start">
            <div
              className="bg-default-100 dark:bg-zinc-800 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm"
              aria-live="polite"
              aria-atomic="true"
            >
              <span className="sr-only">
                {Array.from(typingUsers).join(', ')} {t('messaging.chat.typing', 'is typing')}
              </span>
              <div className="flex gap-1.5 items-center" aria-hidden="true">
                <span className="w-2 h-2 bg-default-400 dark:bg-zinc-500 rounded-full animate-bounce motion-reduce:animate-none [animation-duration:600ms]" />
                <span className="w-2 h-2 bg-default-400 dark:bg-zinc-500 rounded-full animate-bounce motion-reduce:animate-none [animation-duration:600ms] [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-default-400 dark:bg-zinc-500 rounded-full animate-bounce motion-reduce:animate-none [animation-duration:600ms] [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </ScrollShadow>
    </div>
  );
}
