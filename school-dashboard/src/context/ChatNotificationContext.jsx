import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import socketService from '../services/socketServiceEnhanced';
import chatService from '../services/chatServiceEnhanced';
import { MessageCircle, X, Reply, Send } from 'lucide-react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Textarea } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import logger from '../utils/logger';

const ChatNotificationContext = createContext();

export function useChatNotifications() {
  return useContext(ChatNotificationContext);
}

export function ChatNotificationProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const locationRef = useRef(location.pathname);
  const dismissTimersRef = useRef(new Map());

  // Update location ref when location changes
  useEffect(() => {
    locationRef.current = location.pathname;
  }, [location.pathname]);

  // Cleanup all dismiss timers on unmount
  useEffect(() => {
    const timers = dismissTimersRef.current;
    return () => { timers.forEach(clearTimeout); timers.clear(); };
  }, []);

  // Check if user is on chat page
  const isOnChatPage = location.pathname.includes('/messaging');

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    let isSubscribed = true;

    // Initialize socket connection (auth via httpOnly cookies, no token needed)
    const initSocket = async () => {
      try {
        await socketService.connect();

        if (!isSubscribed) return;

        setIsConnected(true);

        // Store callback reference for proper cleanup
        const handleMessageNotification = (data) => {
          // Check current location using ref to avoid stale closure
          const isOnMessagingPage = locationRef.current.includes('/messaging');

          // Only show notification and increment count if not on chat page
          if (!isOnMessagingPage) {
            showNotification(data);
            playNotificationSound();
            // Increment unread count only when not on messaging page
            setUnreadCount(prev => prev + 1);
          }
        };

        // Listen for message notifications
        socketService.on('message_notification', handleMessageNotification);

        // Return cleanup function
        return () => {
          socketService.off('message_notification', handleMessageNotification);
        };

      } catch (error) {
        logger.error('❌ Failed to initialize chat notifications:', error);
      }
    };

    let cleanup;
    initSocket().then(cleanupFn => {
      if (isSubscribed) {
        cleanup = cleanupFn;
      }
    });
    
    return () => {
      isSubscribed = false;
      if (cleanup) cleanup();
    };
  }, [isAuthenticated, user?.id]); // Removed location.pathname from dependencies

  // Fetch actual unread count from conversations
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const fetchUnreadCount = async () => {
      try {
        const conversations = await chatService.getConversations();
        const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
        setUnreadCount(totalUnread);
      } catch (error) {
        logger.error('❌ Failed to fetch unread count:', error);
      }
    };

    fetchUnreadCount();
  }, [isAuthenticated, user?.id]);

  // Reset unread count when user visits chat page
  useEffect(() => {
    if (isOnChatPage) {
      setUnreadCount(0);
    }
  }, [isOnChatPage]);

  const showNotification = (data) => {
    const notification = {
      id: Date.now(),
      conversationId: data.conversationId,
      senderName: data.message.senderName,
      content: data.message.content,
      type: data.message.type,
      timestamp: new Date()
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-dismiss after 5 seconds — tracked for cleanup
    const timerId = setTimeout(() => {
      dismissTimersRef.current.delete(notification.id);
      dismissNotification(notification.id);
    }, 5000);
    dismissTimersRef.current.set(notification.id, timerId);
  };

  const dismissNotification = (id) => {
    const timerId = dismissTimersRef.current.get(id);
    if (timerId) { clearTimeout(timerId); dismissTimersRef.current.delete(id); }
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const playNotificationSound = () => {
    // Create a pleasant notification sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Create a two-tone notification sound (like WhatsApp/Messenger)
      const playTone = (frequency, startTime, duration, volume) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        // Envelope for smooth sound with increased volume
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = audioContext.currentTime;

      // First tone (higher pitch) - increased volume to 0.3
      playTone(800, now, 0.15, 0.3);

      // Second tone (slightly lower pitch) - increased volume to 0.3
      playTone(600, now + 0.1, 0.2, 0.3);

      // Close AudioContext after tones finish to prevent resource leak
      // Safe fire-and-forget — close() is idempotent and doesn't call setState
      const closeTimer = setTimeout(() => audioContext.close().catch(() => {}), 500);
      dismissTimersRef.current.set('audio-' + Date.now(), closeTimer);

    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  };

  const goToChat = (conversationId) => {
    navigate('/messaging');
    // The chat page will handle opening the specific conversation
  };

  const handleReply = (notification) => {
    setReplyingTo(notification);
    setReplyModalOpen(true);
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !replyingTo) return;

    setSendingReply(true);
    try {
      const messageData = {
        conversationId: replyingTo.conversationId,
        content: replyMessage.trim(),
        type: 'text'
      };

      // Send via socket if connected
      if (socketService.isConnected()) {
        socketService.sendMessage(messageData);
      } else {
        // Fallback to REST API
        await chatService.sendMessage(messageData);
      }

      // Close modal and clear
      setReplyModalOpen(false);
      setReplyMessage('');
      dismissNotification(replyingTo.id);
      setReplyingTo(null);
    } catch (error) {
      logger.error('❌ Error sending reply:', error);
      alert('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleCloseModal = () => {
    setReplyModalOpen(false);
    setReplyMessage('');
    setReplyingTo(null);
  };

  return (
    <ChatNotificationContext.Provider value={{ unreadCount, isConnected }}>
      {children}
      
      {/* Notification Toasts */}
      <div className="fixed top-16 right-4 z-[9999] space-y-2 max-w-sm">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden animate-slide-in-right"
          >
            {/* Notification Content */}
            <div
              className="p-4 flex items-start gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              onClick={() => {
                goToChat(notification.conversationId);
                dismissNotification(notification.id);
              }}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageCircle size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {notification.senderName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {notification.type === 'text' 
                    ? notification.content 
                    : notification.type === 'image' 
                      ? '📷 Image' 
                      : '📎 File'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleReply(notification);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
              >
                <Reply size={16} />
                Reply
              </button>
              <div className="w-px bg-gray-200 dark:bg-gray-700" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dismissNotification(notification.id);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={16} />
                Close
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Reply Modal */}
      <Modal 
        isOpen={replyModalOpen} 
        onClose={handleCloseModal}
        size="md"
        placement="center"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <p className="text-lg font-semibold">Quick Reply</p>
            {replyingTo && (
              <p className="text-sm text-default-500 font-normal">
                Replying to {replyingTo.senderName}
              </p>
            )}
          </ModalHeader>
          <ModalBody>
            {replyingTo && (
              <div className="mb-3 p-3 bg-default-100 rounded-lg">
                <p className="text-xs text-default-500 mb-1">Original message:</p>
                <p className="text-sm text-default-700">
                  {replyingTo.type === 'text' 
                    ? replyingTo.content 
                    : replyingTo.type === 'image' 
                      ? '📷 Image' 
                      : '📎 File'}
                </p>
              </div>
            )}
            <Textarea
              placeholder={t('messaging.replyPlaceholder')}
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendReply();
                }
              }}
              minRows={3}
              maxRows={6}
              autoFocus
            />
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="flat" 
              onPress={handleCloseModal}
              isDisabled={sendingReply}
            >
              Cancel
            </Button>
            <Button 
              color="primary" 
              onPress={handleSendReply}
              isLoading={sendingReply}
              isDisabled={!replyMessage.trim()}
              startContent={!sendingReply && <Send size={16} />}
            >
              Send Reply
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </ChatNotificationContext.Provider>
  );
}
