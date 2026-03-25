import { Pin, X } from 'lucide-react';
import { ScrollShadow } from '@heroui/react';
import { useTranslation } from 'react-i18next';

export default function PinnedMessages({ messages = [], onUnpin, onJumpToMessage }) {
  const { t } = useTranslation();
  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-default-400">
        <p className="text-sm">{t('pages.noPinnedMessagesYet')}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-default-200">
        <div className="flex items-center gap-2">
          <PushPin size={18} className="text-primary" />
          <h3 className="font-semibold">{t('pages.pinnedMessages')}</h3>
          <span className="text-xs bg-default-100 px-2 py-1 rounded-full">
            {messages.length}
          </span>
        </div>
      </div>

      {/* Pinned Messages List */}
      <ScrollShadow className="flex-1">
        <div className="p-4 space-y-3">
          {messages.map(({ messageId, pinnedBy, pinnedAt }) => (
            <div
              key={messageId._id}
              className="bg-default-50 rounded-lg p-3 border border-default-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 text-xs text-default-500">
                  <PushPin size={14} className="text-primary" />
                  <span>Pinned by {pinnedBy?.name || 'Unknown'}</span>
                  <span>•</span>
                  <span>{new Date(pinnedAt).toLocaleDateString()}</span>
                </div>
                <button
                  onClick={() => onUnpin(messageId._id)}
                  className="text-default-400 hover:text-danger transition-colors"
                  title={t('pages.unpinMessage')}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Message Content */}
              <div className="mb-2">
                <p className="text-sm font-medium text-default-700 mb-1">
                  {messageId.senderId?.name || 'Unknown'}
                </p>
                <p className="text-sm text-default-600 line-clamp-3">
                  {messageId.content}
                </p>
                {messageId.type === 'image' && messageId.fileUrl && (
                  <img
                    src={messageId.fileUrl}
                    alt="Attachment"
                    className="mt-2 rounded-lg max-w-full h-auto"
                  />
                )}
                {messageId.type === 'file' && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-primary">
                    📎 {messageId.fileName}
                  </div>
                )}
              </div>

              {/* Jump to Message Button */}
              <button
                onClick={() => onJumpToMessage(messageId._id)}
                className="text-xs text-primary hover:underline"
              >
                Jump to message →
              </button>

              {/* Reactions */}
              {messageId.reactions && messageId.reactions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {messageId.reactions.map((reaction, idx) => (
                    <span
                      key={`${messageId._id}-${reaction.emoji}`}
                      className="px-2 py-1 bg-default-100 rounded-full text-xs"
                    >
                      {reaction.emoji} {reaction.reactionCount || 1}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollShadow>
    </div>
  );
}
