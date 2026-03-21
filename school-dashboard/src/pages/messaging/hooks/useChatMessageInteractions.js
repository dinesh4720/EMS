import { useState } from 'react';

export function useChatMessageInteractions() {
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState("");
  const [emojiPickerMessage, setEmojiPickerMessage] = useState(null);

  return {
    replyToMessage, setReplyToMessage,
    showForwardModal, setShowForwardModal,
    selectedMessage, setSelectedMessage,
    pinnedMessages, setPinnedMessages,
    editingMessage, setEditingMessage,
    editText, setEditText,
    emojiPickerMessage, setEmojiPickerMessage,
  };
}
