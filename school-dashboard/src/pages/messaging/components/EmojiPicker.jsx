import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

// Common emojis for reactions - single row
const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '👏', '🙏', '💯', '✨'];

export default function EmojiPicker({ onSelect, onClose }) {
  const { t } = useTranslation();
  const pickerRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleEmojiSelect = (emoji) => {
    onSelect(emoji);
    onClose();
  };

  return (
    <div
      ref={pickerRef}
      role="dialog"
      aria-label={t('messaging.chat.emojiPicker', 'Choose a reaction')}
      className="absolute bottom-full right-0 mb-2 bg-surface border border-border-token rounded-2xl shadow-xl dark:shadow-zinc-900/50 z-50 p-2 animate-in fade-in zoom-in-95 duration-200 motion-reduce:animate-none"
    >
      {/* Single row of emojis */}
      <div className="flex gap-0.5" role="toolbar" aria-label={t('messaging.chat.reactions', 'Reactions')}>
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleEmojiSelect(emoji)}
            className="w-10 h-10 flex items-center justify-center text-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/20 hover:scale-125 rounded-xl transition-all duration-150 cursor-pointer active:scale-95 motion-reduce:hover:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            aria-label={t('messaging.chat.reactWith', 'React with {{emoji}}', { emoji })}
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
