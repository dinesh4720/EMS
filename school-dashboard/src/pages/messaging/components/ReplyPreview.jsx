import { X } from 'lucide-react';

export default function ReplyPreview({ message, onCancel }) {
  if (!message) return null;

  const getSenderName = () => {
    return message.senderName || message.senderId?.name || message.senderId || 'Unknown';
  };

  const getMessagePreview = () => {
    // Handle different message types
    if (message.type === 'image') {
      return '📷 Photo';
    }
    if (message.type === 'video') {
      return '🎥 Video';
    }
    if (message.type === 'file') {
      return `📎 ${message.fileName || 'File'}`;
    }
    if (message.type === 'audio') {
      return '🎤 Voice message';
    }
    // For text messages, show content with line limit
    return message.content || '';
  };

  return (
    <div className="w-full flex items-start gap-2 px-3 py-2 mb-3 bg-default-50 border-l-4 border-primary rounded-r-lg">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-default-600 truncate">
            {getSenderName()}
          </span>
          <span className="text-xs text-default-400 flex-shrink-0">
            Replying
          </span>
        </div>
        <p className="text-sm text-default-600 line-clamp-4 break-all">
          {getMessagePreview()}
        </p>
      </div>
      <button
        onClick={onCancel}
        type="button"
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-default-200 text-default-500 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}
