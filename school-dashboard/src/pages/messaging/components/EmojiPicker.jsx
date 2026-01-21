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
      className="absolute bottom-full right-0 mb-2 bg-background border border-default-200 rounded-lg shadow-lg z-50 p-2"
    >
      {/* Single row of emojis */}
      <div className="flex gap-1">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleEmojiSelect(emoji)}
            className="w-9 h-9 flex items-center justify-center text-xl hover:bg-default-100 rounded transition-colors cursor-pointer"
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
