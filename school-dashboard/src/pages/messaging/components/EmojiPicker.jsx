import { useEffect, useRef } from 'react';

// Common emojis for reactions - single row
const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '👏', '🙏', '💯', '✨'];

export default function EmojiPicker({ onSelect, onClose }) {
  const pickerRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleEmojiSelect = (emoji) => {
    onSelect(emoji);
    onClose();
  };

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-full right-0 mb-2 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-2xl shadow-xl dark:shadow-zinc-900/50 z-50 p-2 animate-in fade-in zoom-in-95 duration-200"
    >
      {/* Single row of emojis */}
      <div className="flex gap-0.5">
        {REACTION_EMOJIS.map((emoji, index) => (
          <button
            key={emoji}
            onClick={() => handleEmojiSelect(emoji)}
            className="w-10 h-10 flex items-center justify-center text-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/20 hover:scale-125 rounded-xl transition-all duration-150 cursor-pointer active:scale-95"
            title={emoji}
            style={{ animationDelay: `${index * 20}ms` }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
