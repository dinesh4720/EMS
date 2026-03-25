import { Button, Input, Tooltip } from "@heroui/react";
import { Send, Paperclip, Mic, X, Image as ImageIcon } from "lucide-react";
import ReplyPreview from "./ReplyPreview";
import VoiceWaveform from "./VoiceWaveform";
import { getFileIcon, formatFileSize } from "../utils/chatUtils";
import { useTranslation } from 'react-i18next';

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

  return (
    <div className="p-4 border-t border-default-200 dark:border-zinc-800 shrink-0 bg-background dark:bg-zinc-950">
      {/* Reply Preview */}
      {replyToMessage && (
        <ReplyPreview
          message={replyToMessage}
          onCancel={onCancelReply}
        />
      )}

      {/* File Preview */}
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
              <div className="w-14 h-14 bg-white dark:bg-zinc-900 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 shadow-md dark:shadow-zinc-900/50 border border-default-200 dark:border-zinc-700">
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
              onPress={onCancelFile}
              isDisabled={uploadingFile}
              className="flex-shrink-0 text-default-500 hover:text-danger hover:bg-danger/10 rounded-lg transition-all duration-200"
            >
              <X size={18} />
            </Button>
          </div>
        </div>
      )}

      {/* Voice Message Preview */}
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
              onPress={onCancelVoicePreview}
              className="text-danger hover:bg-danger/10 rounded-lg"
              startContent={<X size={14} />}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              color="primary"
              onPress={onSendVoiceMessage}
              isLoading={sending || uploadingFile}
              startContent={!sending && !uploadingFile && <Send size={14} />}
              className="rounded-lg"
            >
              Send
            </Button>
          </div>
        </div>
      )}

      {/* Recording Indicator */}
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
              onPress={onStopRecording}
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
          onChange={onFileSelect}
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

        {/* Voice Recording Button */}
        {!voicePreview && !isRecording && (
          <Tooltip content="Record voice message" placement="top">
            <Button
              isIconOnly
              variant="light"
              onPress={onStartRecording}
              isDisabled={sending || uploadingFile || !!selectedFile}
              className="text-default-500 hover:text-danger hover:bg-danger/10 dark:hover:bg-danger/20 rounded-xl transition-all duration-200"
            >
              <Mic size={20} />
            </Button>
          </Tooltip>
        )}

        {/* Input Field */}
        <div className="flex-1 relative">
          <Input
            ref={messageInputRef}
            placeholder={replyToMessage ? `Replying to ${replyToMessage.senderName || 'message'}...` : selectedFile ? "Add a caption (optional)..." : voicePreview ? "Voice message ready..." : "Type a message..."}
            value={newMessage}
            onChange={onTyping}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSend()}
            disabled={sending || uploadingFile || isRecording || !!voicePreview}
            classNames={{
              input: "text-sm",
              inputWrapper: "h-11 rounded-xl border-default-200 dark:border-zinc-700 hover:border-primary dark:hover:border-primary focus-within:border-primary dark:focus-within:border-primary shadow-sm"
            }}
            variant="bordered"
          />
        </div>

        {/* Send Button */}
        {!voicePreview && (
          <Tooltip content="Send message" placement="top">
            <Button
              color="primary"
              onPress={onSend}
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
  );
}
