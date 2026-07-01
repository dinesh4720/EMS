import { useRef } from 'react';
import logger from '../../../utils/logger';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import chatService from '../../../services/chatService';
import socketService from '../../../services/socketServiceEnhanced';

/**
 * Handles text send, file send, typing indicator, and message forwarding.
 */
export function useChatSend({
  user,
  selectedConversation,
  newMessage,
  setNewMessage,
  sending,
  setSending,
  setMessages,
  setUploadingFile,
  replyToMessage,
  setReplyToMessage,
  selectedFile,
  setSelectedFile,
  setFilePreview,
  fileInputRef,
  outboxQueueRef,
  loadConversations,
  scrollToBottom,
  selectedMessage,
  setShowForwardModal,
  setSelectedMessage,
  conversations,
}) {
  const { t } = useTranslation();
  const typingTimeoutRef = useRef(null);

  const handleSend = async () => {
    if (selectedFile) {
      await handleSendFile();
      return;
    }

    if (!newMessage.trim() || !selectedConversation || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const otherParticipant = selectedConversation.otherParticipant ||
        selectedConversation.participants?.find(p => p.userId !== user?.id);

      if (!otherParticipant) throw new Error('Cannot find conversation participant');

      const messageData = {
        conversationId: selectedConversation.id,
        receiverId: otherParticipant.userId,
        receiverModel: otherParticipant.userType === 'staff' ? 'Staff' : 'Student',
        content: messageContent,
        type: 'text'
      };

      if (replyToMessage) {
        messageData.replyTo = replyToMessage.id;
      }

      const tempId = `temp-${Date.now()}`;

      if (socketService.isConnected()) {
        socketService.sendMessage(messageData);
        socketService.sendTyping(selectedConversation.id, false);

        const optimisticMessage = {
          id: tempId,
          ...messageData,
          senderId: user.id,
          senderName: user.name,
          status: 'sending',
          createdAt: new Date(),
          _isOptimistic: true,
          _originalContent: messageContent
        };
        setMessages(prev => [...prev, optimisticMessage]);
        scrollToBottom();
      } else {
        // Queue message for delivery when socket reconnects (BUG-07)
        const queuedMessage = {
          id: tempId,
          ...messageData,
          senderId: user.id,
          senderName: user.name,
          status: 'queued',
          createdAt: new Date(),
          _isOptimistic: true,
          _originalContent: messageContent
        };
        outboxQueueRef.current.push({ tempId, messageData });
        setMessages(prev => [...prev, queuedMessage]);
        scrollToBottom();
        toast('Message queued — will send when reconnected', { icon: '📤' });
      }

      setReplyToMessage(null);
      loadConversations();
    } catch (error) {
      logger.error('Error sending message:', error);
      setNewMessage(messageContent);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleSendFile = async () => {
    if (!selectedFile || !selectedConversation) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      setUploadingFile(true);

      const uploadResult = await chatService.uploadFile(selectedFile);

      if (!uploadResult.url) throw new Error('Upload succeeded but no URL returned');

      const otherParticipant = selectedConversation.otherParticipant ||
        selectedConversation.participants?.find(p => p.userId !== user?.id);

      if (!otherParticipant) throw new Error('Cannot find conversation participant');

      const messageData = {
        conversationId: selectedConversation.id,
        receiverId: otherParticipant.userId,
        receiverModel: otherParticipant.userType === 'staff' ? 'Staff' : 'Student',
        content: messageText || selectedFile.name,
        type: selectedFile.type.startsWith('image/') ? 'image' : selectedFile.type.startsWith('video/') ? 'video' : 'file',
        fileUrl: uploadResult.url,
        fileName: selectedFile.name,
        fileSize: selectedFile.size
      };

      if (socketService.isConnected()) {
        socketService.sendMessage(messageData);

        const optimisticMessage = {
          id: Date.now(),
          ...messageData,
          senderId: user.id,
          senderName: user.name,
          status: 'sending',
          createdAt: new Date()
        };
        setMessages(prev => [...prev, optimisticMessage]);
        setTimeout(() => scrollToBottom(), 100);
      } else {
        const sentMessage = await chatService.sendMessage({
          ...messageData,
          senderId: user.id,
          senderModel: 'Staff'
        });
        setMessages(prev => [...prev, sentMessage]);
        setTimeout(() => scrollToBottom(), 100);
      }

      setSelectedFile(null);
      setFilePreview(null);
      loadConversations();
    } catch (error) {
      logger.error('Error uploading file:', error);
      toast.error(`Failed to upload file: ${error.message}`);
    } finally {
      setUploadingFile(false);
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCancelFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
        reader.onloadend = null;
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!selectedConversation || !socketService.isConnected()) return;

    socketService.sendTyping(selectedConversation.id, true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socketService.sendTyping(selectedConversation.id, false);
    }, 2000);
  };

  const handleForwardSubmit = async (conversationIds) => {
    if (!selectedMessage || conversationIds.length === 0) return;

    try {
      for (const conversationId of conversationIds) {
        const conversation = conversations.find(c => c.id === conversationId);
        if (!conversation) continue;

        const otherParticipant = conversation.otherParticipant ||
          conversation.participants?.find(p => p.userId !== user?.id);

        if (!otherParticipant) continue;

        await chatService.sendMessage({
          conversationId,
          senderId: user.id,
          senderModel: 'Staff',
          receiverId: otherParticipant.userId,
          receiverModel: otherParticipant.userType === 'staff' ? 'Staff' : 'Student',
          content: selectedMessage.content,
          type: selectedMessage.type || 'text',
          fileUrl: selectedMessage.fileUrl,
          fileName: selectedMessage.fileName,
          fileSize: selectedMessage.fileSize,
          forwardedFrom: {
            messageId: selectedMessage.id,
            conversationId: selectedMessage.conversationId,
            forwardedBy: user.id,
            originalSenderName: selectedMessage.senderName
          }
        });
      }

      toast.success(`Message forwarded to ${conversationIds.length} conversation(s)`);
      setShowForwardModal(false);
      setSelectedMessage(null);
    } catch (error) {
      logger.error('Error forwarding message:', error);
      toast.error(t('toast.error.failedToForwardMessage'));
    }
  };

  return {
    handleSend,
    handleSendFile,
    handleCancelFile,
    handleFileSelect,
    handleTyping,
    handleForwardSubmit,
  };
}
