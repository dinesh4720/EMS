import { Send, Paperclip, Mic, X, Image as ImageIcon } from "lucide-react";
import ReplyPreview from "./ReplyPreview";
import VoiceWaveform from "./VoiceWaveform";
import { getFileIcon, formatFileSize } from "../utils/chatUtils";
import { useTranslation } from 'react-i18next';
import { Button, IconButton, Input, Tooltip } from "../../../components/ui";

export default function ChatInputBar({
  newMessage,
  onTyping,
  onSend,
  sending,
  uploadingFile,
  fileInputRef,
  onFileSelect,
  selectedFile,
  filePreview,
  onCancelFile,
  replyToMessage,
  onCancelReply,
  voicePreview,
  isRecording,
  liveWaveform,
  recordingDuration,
  onStartRecording,
  onStopRecording,
  onCancelVoicePreview,
  onSendVoiceMessage,
  messageInputRef,
}) {
  const { t } = useTranslation();
  const inputDisabled = sending || uploadingFile || isRecording || !!voicePreview;

  return (
    <div className="chat-input flex-col items-stretch shrink-0">
      {replyToMessage && (
        <ReplyPreview message={replyToMessage} onCancel={onCancelReply} />
      )}

      {selectedFile && (
        <div className="mb-3 p-3 bg-accent-bg rounded-lg border border-accent-border">
          <div className="flex items-center gap-3">
            {filePreview ? (
              <div className="relative group">
                <img
                  src={filePreview}
                  alt={t('messaging.chat.preview', 'Preview')}
                  className="w-14 h-14 object-cover rounded-md flex-shrink-0"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                  <ImageIcon size={18} className="text-white" />
                </div>
              </div>
            ) : (
              <div className="w-14 h-14 bg-surface-2 rounded-md flex items-center justify-center text-2xl flex-shrink-0 border border-border-token">
                {getFileIcon(selectedFile.name)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-fg truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-accent font-medium">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <IconButton
              variant="danger"
              onClick={onCancelFile}
              disabled={uploadingFile}
              aria-label={t('messaging.chat.removeAttachment', 'Remove attachment')}
            >
              <X size={18} />
            </IconButton>
          </div>
        </div>
      )}

      {voicePreview && (
        <div className="mb-3 p-3 bg-accent-bg rounded-lg border border-accent-border">
          <VoiceWaveform
            audioUrl={voicePreview.url}
            waveformData={voicePreview.waveform || []}
            duration={voicePreview.duration}
            isOwn={false}
          />
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-divider">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelVoicePreview}
              icon={<X size={14} />}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onSendVoiceMessage}
              loading={sending || uploadingFile}
              icon={!sending && !uploadingFile ? <Send size={14} /> : null}
            >
              {t('common.send', 'Send')}
            </Button>
          </div>
        </div>
      )}

      {isRecording && (
        <div className="mb-3 p-3 bg-danger-bg rounded-lg border border-danger-token">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-danger-token flex items-center justify-center flex-shrink-0 animate-pulse">
              <Mic size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <VoiceWaveform
                isRecording
                liveLevels={liveWaveform}
                duration={recordingDuration}
                isOwn={false}
                size="small"
              />
            </div>
            <Button variant="danger" size="sm" onClick={onStopRecording}>
              {t('messaging.chat.stop', 'Stop')}
            </Button>
          </div>
        </div>
      )}

      <div className="chat-input__shell glass">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={onFileSelect}
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
        />

        <Tooltip content={t('messaging.chat.attachFile', 'Attach file')}>
          <IconButton
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFile || isRecording || !!voicePreview}
            aria-label={t('messaging.chat.attachFile', 'Attach file')}
          >
            <Paperclip size={16} />
          </IconButton>
        </Tooltip>

        <div className="chat-input__field">
          <Input
            ref={messageInputRef}
            placeholder={
              replyToMessage
                ? `${t('messaging.chat.replyingTo', 'Replying to')} ${replyToMessage.senderName || t('messaging.chat.message', 'message')}...`
                : selectedFile
                  ? t('messaging.chat.addCaptionOptional', 'Add a caption (optional)...')
                  : voicePreview
                    ? t('messaging.chat.voiceMessageReady', 'Voice message ready...')
                    : t('messaging.chat.typeAMessage', 'Type a message...')
            }
            value={newMessage}
            onChange={onTyping}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSend()}
            disabled={inputDisabled}
            aria-label={t('messaging.chat.messageInput', 'Message input')}
            wrapperClassName="!border-0 !bg-transparent !shadow-none w-full"
            className="!border-0 !bg-transparent !shadow-none focus:!ring-0 focus:!shadow-none"
          />
        </div>

        {!voicePreview && !isRecording && (
          <Tooltip content={t('messaging.chat.recordVoice', 'Record voice message')}>
            <IconButton
              variant="ghost"
              size="sm"
              onClick={onStartRecording}
              disabled={sending || uploadingFile || !!selectedFile}
              aria-label={t('messaging.chat.recordVoice', 'Record voice message')}
            >
              <Mic size={16} />
            </IconButton>
          </Tooltip>
        )}

        {!voicePreview && (
          <Tooltip content={t('common.send', 'Send (↵)')}>
            <IconButton
              variant="primary"
              size="sm"
              onClick={onSend}
              disabled={(!selectedFile && !newMessage.trim()) || sending || uploadingFile}
              aria-label={t('common.send', 'Send')}
            >
              <Send size={14} />
            </IconButton>
          </Tooltip>
        )}
      </div>

      <div className="chat-input__hint" aria-hidden>
        <span className="kbd">↵</span>
        <span>{t('common.send', 'send')}</span>
        <span className="chat-input__hint-sep">·</span>
        <span className="kbd">⇧↵</span>
        <span>{t('messaging.chat.newLine', 'new line')}</span>
      </div>
    </div>
  );
}
