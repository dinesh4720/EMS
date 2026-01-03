import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import socketService from '../services/socketServiceEnhanced';
import { MessageCircle, X } from 'lucide-react';

const ChatNotificationContext = createContext();

export function useChatNotifications() {
  return useContext(ChatNotificationContext);
}

export function ChatNotificationProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const locationRef = useRef(location.pathname);

  // Update location ref when location changes
  useEffect(() => {
    locationRef.current = location.pathname;
  }, [location.pathname]);

  // Check if user is on chat page
  const isOnChatPage = location.pathname.includes('/messaging');

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    let isSubscribed = true;

    // Initialize socket connection
    const initSocket = async () => {
      try {
        await socketService.connect(user.id, 'staff');
        
        if (!isSubscribed) return;
        
        setIsConnected(true);
        console.log('🔔 Global chat notifications initialized');

        // Store callback reference for proper cleanup
        const handleMessageNotification = (data) => {
          console.log('🔔 Message notification received:', data);
          console.log('📍 Current location:', locationRef.current);
          
          // Check current location using ref to avoid stale closure
          const isOnMessagingPage = locationRef.current.includes('/messaging');
          console.log('💬 Is on messaging page?', isOnMessagingPage);
          
          // Only show notification if not on chat page
          if (!isOnMessagingPage) {
            console.log('✅ Showing notification and playing sound');
            showNotification(data);
            playNotificationSound();
          } else {
            console.log('⏭️ Skipping notification - user is on messaging page');
          }
          
          // Always increment unread count
          setUnreadCount(prev => prev + 1);
        };

        // Listen for message notifications
        socketService.on('message_notification', handleMessageNotification);

        // Return cleanup function
        return () => {
          socketService.off('message_notification', handleMessageNotification);
          console.log('🧹 Cleaned up notification listeners');
        };

      } catch (error) {
        console.error('❌ Failed to initialize chat notifications:', error);
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

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      dismissNotification(notification.id);
    }, 5000);
  };

  const dismissNotification = (id) => {
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
      
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  };

  const goToChat = (conversationId) => {
    navigate('/messaging');
    // The chat page will handle opening the specific conversation
  };

  return (
    <ChatNotificationContext.Provider value={{ unreadCount, isConnected }}>
      {children}
      
      {/* Notification Toasts */}
      <div className="fixed top-16 right-4 z-[9999] space-y-2 max-w-sm">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 flex items-start gap-3 animate-slide-in-right cursor-pointer hover:shadow-xl transition-shadow"
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
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismissNotification(notification.id);
              }}
              className="flex-shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>
        ))}
      </div>
    </ChatNotificationContext.Provider>
  );
}
