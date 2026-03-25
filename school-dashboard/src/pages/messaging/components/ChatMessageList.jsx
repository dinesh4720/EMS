import { Avatar, ScrollShadow, Button, Textarea } from "@heroui/react";
import { Search, Phone, Video, MoreVertical, Pin, Check, CheckCheck, Forward, Download, Mic, MessageCircle, Plus } from "lucide-react";
import { Tooltip } from "@heroui/react";
import MessageActionsMenu from "./MessageActionsMenu";
import MessageReactions from "./MessageReactions";
import EmojiPicker from "./EmojiPicker";
import VoiceWaveform from "./VoiceWaveform";
import { formatTime, formatLastSeen, getFileIcon, formatFileSize } from "../utils/chatUtils";
import { useTranslation } from 'react-i18next';

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
}) {
  const { t } = useTranslation();

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

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-default-50 to-default-100 dark:from-zinc-900 dark:to-zinc-950">
        <div className="text-center max-w-md px-8">
          <div className="relative mx-auto mb-6">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/10 flex items-center justify-center shadow-xl shadow-primary/10">
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-lg">
                <MessageCircle size={32} className="text-primary" />
              </div>
            </div>
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
            onPress={onOpenNewChatModal}
            className="mt-6 rounded-xl"
            startContent={<Plus size={18} />}
          >
            Start new conversation
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background dark:bg-zinc-950 h-full flex flex-col overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-default-200 dark:border-zinc-800 shrink-0 bg-background dark:bg-zinc-950">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar
              src={selectedConversation.otherParticipant?.avatar}
              name={selectedConversation.otherParticipant?.name}
              size="md"
              className="ring-2 ring-default-100 dark:ring-zinc-800"
            />
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
              onPress={() => onVideoCall('audio')}
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
              onPress={() => onVideoCall('video')}
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
                <div
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
                  className="flex-shrink-0 max-w-xs px-3 py-2 bg-white dark:bg-zinc-950 rounded-xl border border-default-200 dark:border-zinc-700 hover:border-primary hover:shadow-md dark:hover:shadow-zinc-900/50 hover:shadow-primary/10 cursor-pointer transition-all duration-200 group"
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

      {/* Messages */}
      <ScrollShadow className="flex-1 min-h-0 p-4 space-y-3">
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
                  <div className={`absolute top-1 ${isMe ? '-left-9' : '-right-9'} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                    <button
                      onClick={() => onMessageAction('react', { message: msg })}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-zinc-950 hover:bg-primary/10 dark:hover:bg-primary/20 text-default-500 hover:text-primary transition-all duration-200 border border-default-200 dark:border-zinc-700 shrink-0 shadow-sm hover:shadow-md dark:shadow-zinc-900/50"
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
                  <div className={`absolute top-1 ${isMe ? '-right-9' : '-left-9'} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                    <MessageActionsMenu
                      message={msg}
                      currentUserId={user.id}
                      onAction={onMessageAction}
                    />
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`px-4 py-2.5 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md dark:hover:shadow-zinc-900/50 ${isMe
                      ? "bg-primary text-white rounded-br-md shadow-sm shadow-primary/20"
                      : "bg-default-100 dark:bg-zinc-800 text-default-900 dark:text-zinc-100 rounded-bl-md shadow-sm dark:shadow-zinc-900/30"
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
                        <Button size="sm" color="primary" onPress={onEditSave} className="rounded-lg">
                          Save
                        </Button>
                        <Button size="sm" variant="light" onPress={onEditCancel} className="rounded-lg">
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
                          onClick={() => window.open(msg.fileUrl, '_blank', 'noopener,noreferrer')}
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
                              <span className={`text-xs ${isMe ? 'text-white/70' : 'text-default-400'}`}>{t('pages.sendingVoiceMessage')}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {msg.type === 'file' && msg.fileUrl && (
                        <div className="flex items-center gap-3 mb-2 p-3 bg-black/10 dark:bg-white/5 rounded-xl hover:bg-black/15 dark:hover:bg-white/10 transition-colors cursor-pointer"
                          onClick={() => window.open(msg.fileUrl, '_blank', 'noopener,noreferrer')}
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
            <div className="bg-default-100 dark:bg-zinc-800 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
              <div className="flex gap-1.5 items-center">
                <span className="w-2 h-2 bg-default-400 dark:bg-zinc-500 rounded-full animate-bounce [animation-duration:600ms]" />
                <span className="w-2 h-2 bg-default-400 dark:bg-zinc-500 rounded-full animate-bounce [animation-duration:600ms] [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-default-400 dark:bg-zinc-500 rounded-full animate-bounce [animation-duration:600ms] [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </ScrollShadow>
    </div>
  );
}
