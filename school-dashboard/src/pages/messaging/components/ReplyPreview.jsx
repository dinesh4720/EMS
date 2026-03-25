import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
    <div className="w-full flex items-start gap-3 px-4 py-3 mb-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 border-l-4 border-indigo-500 rounded-r-xl shadow-sm">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 truncate">
            {getSenderName()}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
            Replying
          </span>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 break-all">
          {getMessagePreview()}
        </p>
      </div>
      <button
        onClick={onCancel}
        type="button"
        className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/60 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-150"
      >
        <X size={16} />
      </button>
    </div>
  );
}
