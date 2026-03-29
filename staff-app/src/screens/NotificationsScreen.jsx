import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useChat } from '../context/ChatContext';
import api from '../services/api';
import {
  Bell,
  MessageCircle,
  Calendar,
  FileText,
  Users,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react-native';
import { triggerHaptic } from '../utils/helpers';
import { useTranslation } from 'react-i18next';

// Notification types with icons and colors
const NOTIFICATION_CONFIG = {
  message: { icon: MessageCircle, color: '#4285F4' },
  attendance: { icon: CheckCircle, color: '#34C759' },
  exam: { icon: FileText, color: '#FF9500' },
  schedule: { icon: Calendar, color: '#5856D6' },
  alert: { icon: AlertCircle, color: '#FF3B30' },
  info: { icon: Info, color: '#007AFF' },
  class: { icon: Users, color: '#34C759' },
};

const NotificationsScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors, typography, spacing, shape, isDark } = useTheme();
  const { conversations, unreadCount } = useChat();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Build notifications from backend API and chat sources
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const allNotifications = [];

      // Fetch real notifications from backend API
      try {
        const data = await api.notifications.getAll({ limit: 50 });
        const backendNotifications = data?.notifications || [];
        backendNotifications.forEach(n => {
          allNotifications.push({
            id: n._id,
            type: n.type || 'info',
            title: n.title,
            message: n.message,
            timestamp: n.createdAt,
            read: !!n.read,
            data: n.data || {},
          });
        });
      } catch (apiError) {
        console.warn('Failed to fetch notifications from API:', apiError.message);
      }

      // Add unread chat messages as notifications
      conversations.forEach(conv => {
        if (conv.unreadCount > 0) {
          const otherName = conv.name || conv.otherParticipant?.name || 'Unknown';
          let messageText = 'You have a new message';
          if (conv.lastMessage) {
            if (typeof conv.lastMessage === 'string') {
              messageText = conv.lastMessage;
            } else if (typeof conv.lastMessage === 'object') {
              messageText = conv.lastMessage.content || conv.lastMessage.text || 'You have a new message';
            }
          }
          allNotifications.push({
            id: `chat-${conv.id || conv._id}`,
            type: 'message',
            title: `New message from ${otherName}`,
            message: messageText,
            timestamp: conv.lastMessageAt || new Date().toISOString(),
            read: false,
            data: { conversationId: conv.id || conv._id },
          });
        }
      });

      // Sort by timestamp (newest first)
      allNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [conversations]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    triggerHaptic('light');
    await loadNotifications();
    setRefreshing(false);
  }, [loadNotifications]);

  const handleNotificationPress = useCallback(async (notification) => {
    triggerHaptic('light');

    // Mark backend notification as read
    if (!notification.read && !notification.id.startsWith('chat-')) {
      try {
        await api.notifications.markAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
      } catch (err) {
        console.warn('Failed to mark notification as read:', err.message);
      }
    }

    if (notification.type === 'message' && notification.data?.conversationId) {
      navigation.navigate('ChatTab', {
        screen: 'ChatDetail',
        params: {
          conversationId: notification.data.conversationId,
          name: notification.title.replace('New message from ', ''),
        },
      });
    }
  }, [navigation]);

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) {
        return 'Just now';
      } else if (diffMins < 60) {
        return `${diffMins}m ago`;
      } else if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays}d ago`;
      } else {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
      }
    } catch {
      return 'Unknown time';
    }
  };

  const renderNotification = ({ item, index }) => {
    const config = NOTIFICATION_CONFIG[item.type] || NOTIFICATION_CONFIG.info;
    const Icon = config.icon;

    return (
      <Pressable
        onPress={() => handleNotificationPress(item)}
        style={({ pressed }) => [
          styles.notificationItem,
          {
            backgroundColor: pressed
              ? colors.surfaceContainerHigh
              : item.read
                ? colors.surface
                : colors.primaryContainer + '20',
            borderRadius: shape.cornerLarge,
            marginBottom: spacing.sm,
            borderLeftWidth: item.read ? 0 : 3,
            borderLeftColor: item.read ? 'transparent' : config.color,
          },
        ]}
      >
        <View style={[
          styles.iconContainer,
          { backgroundColor: config.color + '20', borderRadius: shape.cornerMedium }
        ]}>
          <Icon size={20} color={config.color} />
        </View>
        <View style={styles.contentContainer}>
          <Text style={[typography.titleSmall, { color: colors.onSurface }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text
            style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: 2 }]}
            numberOfLines={2}
          >
            {item.message}
          </Text>
          <Text style={[typography.labelSmall, { color: colors.outline, marginTop: 4 }]}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>
        {!item.read && (
          <View style={[styles.unreadDot, { backgroundColor: config.color }]} />
        )}
        <ChevronRight size={18} color={colors.onSurfaceVariant} />
      </Pressable>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Bell size={56} color={colors.onSurfaceVariant} style={{ opacity: 0.3 }} />
      <Text style={[typography.titleMedium, { color: colors.onSurfaceVariant, marginTop: spacing.md }]}>
        No notifications
      </Text>
      <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, opacity: 0.7, marginTop: spacing.xs, textAlign: 'center' }]}>
        You're all caught up! New notifications will appear here.
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerContent}>
          <Text style={[typography.headlineMedium, { color: colors.onSurface }]}>{t('screens.notifications1')}</Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
            {notifications.filter(n => !n.read).length} unread
          </Text>
        </View>
      </View>

      {/* Notification List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
});

export default NotificationsScreen;