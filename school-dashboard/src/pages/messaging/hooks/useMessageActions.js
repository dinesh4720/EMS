import { useCallback } from 'react';
import logger from '../../../utils/logger';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { request } from '../../../services/api';

export function useMessageActions({ user, chatService, messages, setMessages, setPinnedMessages, setReplyToMessage, setSelectedMessage, setShowForwardModal, setEditingMessage, setEditText, setEmojiPickerMessage, messageInputRef }) {
  const { t } = useTranslation();

  // Handle message reactions
  const handleReaction = useCallback(async (messageId, emoji) => {
    try {
      // Check if user already reacted with this emoji BEFORE updating
      const currentMessage = messages.find(m => m.id === messageId);
      const existingReaction = currentMessage?.reactions?.find(
        r => r.userId === user.id && r.emoji === emoji
      );
      const isRemoving = !!existingReaction;

      // Optimistically update local state
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          const existingReactionIndex = msg.reactions?.findIndex(
            r => r.userId === user.id && r.emoji === emoji
          );

          let newReactions = [...(msg.reactions || [])];

          if (existingReactionIndex >= 0) {
            // User clicking on same emoji - remove it
            newReactions.splice(existingReactionIndex, 1);
          } else {
            // Remove any existing reaction from this user
            newReactions = newReactions.filter(r => r.userId !== user.id);

            // Add new reaction
            newReactions.push({
              emoji,
              userId: user.id,
              userModel: user.role === 'parent' ? 'Parent' : user.role === 'student' ? 'Student' : 'Staff',
              createdAt: new Date()
            });
          }

          return { ...msg, reactions: newReactions };
        }
        return msg;
      }));

      // Always send API request (backend handles toggle)
      await request(`/messages/${messageId}/react`, {
        method: 'POST',
        body: JSON.stringify({ emoji })
      });

      toast.success(isRemoving ? 'Reaction removed' : 'Reaction added');
    } catch (error) {
      logger.error('Error reacting to message:', error);
      toast.error(t('messaging.toast.failedToReact', 'Failed to react'));
    }
  }, [user, messages, setMessages, t]);

  // Handle pin message
  const handlePinMessage = useCallback(async (messageId) => {
    try {
      await request(`/messages/${messageId}/pin`, {
        method: 'POST',
        body: JSON.stringify({ pinned: true })
      });

      // Update local state immediately - use String comparison
      setMessages(prev => {
        const updated = prev.map(msg => {
          const matches = String(msg.id) === String(messageId);
          if (matches) {
            return { ...msg, pinned: true, pinnedBy: [...(msg.pinnedBy || []), user.id] };
          }
          return msg;
        });

        // Also update pinned messages state directly
        const msgToPin = updated.find(m => String(m.id) === String(messageId));
        if (msgToPin) {
          setPinnedMessages(prev => {
            if (!prev.find(pm => String(pm.id) === String(messageId))) {
              return [...prev, { ...msgToPin, pinned: true }];
            }
            return prev;
          });
        }

        return updated;
      });

      toast.success(t('messaging.toast.messagePinned', 'Message pinned'));
    } catch (error) {
      logger.error('Error pinning message:', error);
      toast.error(error.response?.data?.error || 'Failed to pin');
    }
  }, [user, setMessages, setPinnedMessages, t]);

  // Handle unpin message
  const handleUnpinMessage = useCallback(async (messageId) => {
    try {
      await request(`/messages/${messageId}/pin`, {
        method: 'POST',
        body: JSON.stringify({ pinned: false })
      });

      // Update local state immediately
      setMessages(prev => {
        const updated = prev.map(msg => {
          const matches = String(msg.id) === String(messageId);
          if (matches) {
            return { ...msg, pinned: false, pinnedBy: (msg.pinnedBy || []).filter(id => String(id) !== String(user.id)) };
          }
          return msg;
        });

        // Also update pinned messages state directly
        setPinnedMessages(prev => prev.filter(pm => String(pm.id) !== String(messageId)));

        return updated;
      });

      toast.success(t('messaging.toast.messageUnpinned', 'Message unpinned'));
    } catch (error) {
      logger.error('Error unpinning message:', error);
      toast.error(error.response?.data?.error || 'Failed to unpin');
    }
  }, [user, setMessages, setPinnedMessages, t]);

  // Handle delete message (with delete for everyone option)
  const handleDeleteMessage = useCallback(async (messageId, deleteForEveryone = false) => {
    try {
      await chatService.deleteMessage(messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success(deleteForEveryone
        ? t('messaging.toast.messageDeletedForEveryone', 'Message deleted for everyone')
        : t('messaging.toast.messageDeleted', 'Message deleted'));
    } catch (error) {
      logger.error('Error deleting message:', error);
      toast.error(t('messaging.toast.failedToDeleteMessage', 'Failed to delete message'));
    }
  }, [chatService, user, setMessages, t]);

  // Handle edit message - receives current editingMessage and editText as parameters
  const handleEditMessageWithState = useCallback(async (editingMessage, editText) => {
    if (!editingMessage || !editText.trim()) return;

    try {
      await request(`/messages/${editingMessage.id}/edit`, {
        method: 'PUT',
        body: JSON.stringify({ content: editText.trim() })
      });

      setMessages(prev => prev.map(msg =>
        msg.id === editingMessage.id
          ? { ...msg, content: editText.trim(), isEdited: true }
          : msg
      ));

      setEditingMessage(null);
      setEditText('');
      toast.success(t('messaging.toast.messageEdited', 'Message edited'));
    } catch (error) {
      logger.error('Error editing message:', error);
      toast.error(t('messaging.toast.failedToEditMessage', 'Failed to edit message'));
    }
  }, [user, setMessages, setEditingMessage, setEditText, t]);

  // Load pinned messages - filter from current messages
  const loadPinnedMessages = useCallback((currentMessages) => {
    const pinned = currentMessages.filter(msg => msg.pinned);
    setPinnedMessages(pinned);
  }, [setPinnedMessages]);

  // Unified message action handler
  const handleMessageAction = useCallback(async (action, data) => {
    switch (action) {
      case 'reply':
        setReplyToMessage(data.message);
        messageInputRef.current?.focus();
        break;

      case 'forward':
        setSelectedMessage(data.message);
        setShowForwardModal(true);
        break;

      case 'edit':
        setEditingMessage(data.message);
        setEditText(data.message.content);
        break;

      case 'delete':
        handleDeleteMessage(data.message.id, false);
        break;

      case 'deleteForEveryone':
        handleDeleteMessage(data.message.id, true);
        break;

      case 'copy':
        navigator.clipboard.writeText(data.message.content);
        toast.success(t('messaging.toast.messageCopied', 'Message copied'));
        break;

      case 'pin':
        handlePinMessage(data.message.id);
        break;

      case 'unpin':
        handleUnpinMessage(data.message.id);
        break;

      case 'react':
        if (!data.emoji) {
          setEmojiPickerMessage(data.message);
        } else {
          handleReaction(data.message.id, data.emoji);
        }
        break;

      default:
        console.warn('Unknown action:', action);
    }
  }, [handleDeleteMessage, handlePinMessage, handleUnpinMessage, handleReaction, setReplyToMessage, setSelectedMessage, setShowForwardModal, setEditingMessage, setEditText, setEmojiPickerMessage, messageInputRef, t]);

  return {
    handleMessageAction,
    handleReaction,
    handlePinMessage,
    handleUnpinMessage,
    handleDeleteMessage,
    handleEditMessage: handleEditMessageWithState,
    loadPinnedMessages,
  };
}
