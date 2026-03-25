// Enhanced Chat Screen for Staff App
// Modern, polished UI with Material 3 Design
import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Dimensions,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import {
  Search,
  Plus,
  MessageCircle,
  Trash2,
  Users,
  X,
  ChevronRight,
  CloudOff,
  User as UserIcon
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Generate gradient colors based on name
const getAvatarGradient = (name) => {
  const { t } = useTranslation();
  const gradients = [
    ['#667eea', '#764ba2'],
    ['#f093fb', '#f5576c'],
    ['#4facfe', '#00f2fe'],
    ['#43e97b', '#38f9d7'],
    ['#fa709a', '#fee140'],
    ['#a18cd1', '#fbc2eb'],
    ['#ff9a9e', '#fecfef'],
    ['#ffecd2', '#fcb69f'],
    ['#ff8177', '#cf556c'],
    ['#6a11cb', '#2575fc'],
  ];
  const index = name ? name.charCodeAt(0) % gradients.length : 0;
  return gradients[index];
};

// Format relative time
const formatRelativeTime = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

// Animated Avatar Component
const Avatar = ({ name, size = 50, emoji }) => {
  const gradient = getAvatarGradient(name);
  const { typography } = useTheme();

  if (emoji) {
    return (
      <View style={[styles.avatarContainer, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[styles.avatarEmoji, { fontSize: size * 0.6 }]}>{emoji}</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.avatarGradient, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Text style={[typography.titleMedium, { color: '#FFF', fontSize: size * 0.4 }]}>
        {name?.charAt(0)?.toUpperCase() || '?'}
      </Text>
    </LinearGradient>
  );
};

// Online Status Indicator
const OnlineIndicator = ({ isOnline, size = 12 }) => {
  const { colors } = useTheme();

  if (!isOnline) return null;

  return (
    <View style={[styles.onlineDot, { width: size, height: size, borderRadius: size / 2, borderColor: colors.surface }]}>
      <View style={[styles.onlineDotInner, { backgroundColor: colors.tertiary }]} />
    </View>
  );
};

// Conversation item component with swipe actions
const ConversationItem = ({
  conversation,
  onPress,
  getConversationName,
  getConversationAvatar,
  onDelete
}) => {
  const { colors, typography, spacing, shape } = useTheme();
  const name = getConversationName(conversation);
  const avatar = getConversationAvatar(conversation);
  const swipeableRef = useRef(null);

  // Handle lastMessage - it could be a string or an object
  const getLastMessageText = () => {
    const lastMsg = conversation.lastMessage;

    if (typeof lastMsg === 'object' && lastMsg !== null) {
      const type = lastMsg.type || conversation.lastMessageType;
      if (type === 'image') return 'Sent a photo';
      if (type === 'voice' || type === 'audio') return 'Sent a voice message';
      if (type === 'file') return 'Sent a file';
      return lastMsg.content || lastMsg.text || 'No messages';
    }

    if (typeof lastMsg === 'string') {
      if (lastMsg.startsWith('📷') || lastMsg.startsWith('🎥')) return 'Sent a photo';
      if (lastMsg.startsWith('🎤')) return 'Sent a voice message';
      if (lastMsg.startsWith('📄')) return 'Sent a file';
      return lastMsg || 'No messages';
    }

    return 'No messages';
  };

  const lastMessageText = getLastMessageText();
  const unreadCount = conversation.unreadCount || 0;
  const time = formatRelativeTime(conversation.lastMessageAt || conversation.lastMessage?.timestamp);
  const isOnline = conversation.isOnline || conversation.participants?.[0]?.isOnline;

  // Swipe action handlers
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const renderRightActions = (progress, dragX) => {
    const trans = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [0, 80],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.swipeAction, { transform: [{ translateX: trans }] }]}>
        <Pressable
          style={[styles.deleteAction, { backgroundColor: colors.error }]}
          onPress={() => {
            swipeableRef.current?.close();
            onDelete && onDelete(conversation);
          }}
        >
          <Trash2 size={24} color={colors.onError} />
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
    >
      <Pressable
        style={({ pressed }) => [
          styles.chatItem,
          {
            backgroundColor: pressed ? colors.surfaceContainerHigh : colors.surface,
            borderBottomColor: colors.outlineVariant,
          }
        ]}
        onPress={handlePress}
      >
        <View style={styles.avatarWrapper}>
          <Avatar name={name} emoji={avatar} size={50} />
          <OnlineIndicator isOnline={isOnline} />
        </View>

        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text
              style={[
                unreadCount > 0 ? typography.titleMedium : typography.bodyLarge,
                { color: colors.onSurface, flex: 1, marginRight: spacing.sm }
              ]}
              numberOfLines={1}
            >
              {name}
            </Text>
            <Text
              style={[
                typography.labelSmall,
                { color: unreadCount > 0 ? colors.primary : colors.onSurfaceVariant }
              ]}
            >
              {time}
            </Text>
          </View>

          <View style={styles.chatFooter}>
            <Text
              style={[
                unreadCount > 0 ? typography.bodyMedium : typography.bodyMedium,
                {
                  color: unreadCount > 0 ? colors.onSurface : colors.onSurfaceVariant,
                  fontWeight: unreadCount > 0 ? '600' : '400',
                  flex: 1,
                  marginRight: spacing.sm
                }
              ]}
              numberOfLines={1}
            >
              {lastMessageText}
            </Text>
            {unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={[typography.labelSmall, { color: colors.onPrimary }]}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Swipeable>
  );
};

// Contact item for new chat modal
const ContactItem = ({ contact, onPress }) => {
  const { colors, typography, spacing, shape } = useTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const getRoleColor = (role) => {
    const roleColors = {
      'Admin': colors.primary,
      'Teacher': colors.tertiary,
      'Staff': colors.secondary,
      'Principal': colors.primary,
      'Student': colors.outline,
    };
    return roleColors[role] || colors.secondary;
  };

  const roleColor = getRoleColor(contact.role || contact.userType);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.contactItem,
        {
          backgroundColor: pressed ? colors.surfaceContainerHigh : colors.surface,
          borderBottomColor: colors.outlineVariant
        }
      ]}
      onPress={handlePress}
    >
      <Avatar name={contact.name || contact.email || '?'} size={48} />
      <View style={[styles.contactInfo, { marginLeft: spacing.md }]}>
        <Text style={[typography.titleMedium, { color: colors.onSurface }]}>{contact.name || 'Unknown'}</Text>
        <View style={styles.contactRoleContainer}>
          <View style={[styles.roleBadge, { backgroundColor: codeOpacity(roleColor, 0.1), borderColor: roleColor, borderWidth: 1 }]}>
            <Text style={[typography.labelSmall, { color: roleColor, fontWeight: '600' }]}>
              {contact.role || contact.userType || 'Staff'}
            </Text>
          </View>
        </View>
      </View>
      <ChevronRight size={20} color={colors.onSurfaceVariant} />
    </Pressable>
  );
};

// Helper for opacity - simplified as we can't easily blend hex without a util
const codeOpacity = (hex, alpha) => {
  return hex; // Improve if you have hexToRgba utility
};

// Empty State Component
const EmptyState = ({ icon: Icon, title, subtitle, actionLabel, onAction }) => {
  const { colors, typography, spacing, shape } = useTheme();

  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.surfaceContainerHigh }]}>
        <Icon size={48} color={colors.onSurfaceVariant} />
      </View>
      <Text style={[typography.headlineSmall, { color: colors.onSurface, textAlign: 'center', marginTop: spacing.md }]}>{title}</Text>
      <Text style={[typography.bodyLarge, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.xs, paddingHorizontal: spacing.xl }]}>{subtitle}</Text>
      {actionLabel && (
        <Pressable
          style={({ pressed }) => [
            styles.startChatButton,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.9 : 1
            }
          ]}
          onPress={onAction}
        >
          <MessageCircle size={18} color={colors.onPrimary} style={{ marginRight: 8 }} />
          <Text style={[typography.labelLarge, { color: colors.onPrimary }]}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
};

const ChatScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors, typography, spacing, shape } = useTheme();
  const {
    conversations,
    contacts,
    unreadCount,
    loading,
    socketConnected,
    refreshConversations,
    deleteConversation,
    getConversationName,
    getConversationAvatar,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showContacts, setShowContacts] = useState(false);

  // Ensure arrays are valid
  const safeConversations = Array.isArray(conversations) ? conversations : [];
  const safeContacts = Array.isArray(contacts) ? contacts : [];

  // Filter conversations based on search
  const filteredConversations = useMemo(() => safeConversations.filter(conv => {
    if (!searchQuery) return true;
    const name = getConversationName(conv).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  }), [safeConversations, searchQuery, getConversationName]);

  // Filter contacts based on search
  const filteredContacts = useMemo(() => safeContacts.filter(contact => {
    if (!searchQuery) return true;
    const name = (contact.name || '').toLowerCase();
    const email = (contact.email || '').toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
  }), [safeContacts, searchQuery]);

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await refreshConversations();
    setRefreshing(false);
  }, [refreshConversations]);

  // Navigate to chat detail
  const handleConversationPress = useCallback((conversation) => {
    navigation.navigate('ChatDetail', {
      conversationId: conversation.id,
      conversation,
    });
  }, [navigation]);

  // Start new conversation with contact
  const handleContactPress = useCallback((contact) => {
    setShowContacts(false);
    setSearchQuery('');
    navigation.navigate('ChatDetail', {
      contactId: contact.id || contact.userId,
      contactName: contact.name,
    });
  }, [navigation]);

  // Handle delete conversation
  const handleDeleteConversation = useCallback((conversation) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Delete Conversation',
      `Remove your conversation with ${getConversationName(conversation)}? This only removes it from your view.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteConversation(conversation.id);
            if (!result.success) {
              Alert.alert('Error', result.error || 'Failed to delete conversation');
            }
          },
        },
      ]
    );
  }, [deleteConversation, getConversationName]);

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: spacing.md, borderBottomColor: colors.outlineVariant }]}>
          <View style={styles.headerLeft}>
            <Text style={[typography.headlineMedium, { color: colors.onSurface }]}>{t('screens.messages')}</Text>
            {unreadCount > 0 && (
              <View style={[styles.headerBadge, { backgroundColor: colors.primary }]}>
                <Text style={[typography.labelSmall, { color: colors.onPrimary }]}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.newChatButton,
              {
                backgroundColor: showContacts ? colors.surfaceContainerHighest : colors.primaryContainer,
                opacity: pressed ? 0.8 : 1
              }
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowContacts(!showContacts);
            }}
          >
            {showContacts ?
              <X size={24} color={colors.onSurfaceVariant} /> :
              <Plus size={24} color={colors.onPrimaryContainer} />
            }
          </Pressable>
        </View>

        {/* Search Bar */}
        <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: colors.surfaceContainerHigh,
                borderRadius: shape.cornerFull,
              }
            ]}
          >
            <Search size={20} color={colors.onSurfaceVariant} style={{ marginLeft: spacing.md }} />
            <TextInput
              style={[
                styles.searchInput,
                typography.bodyLarge,
                { color: colors.onSurface }
              ]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={showContacts ? 'Search contacts...' : 'Search messages...'}
              placeholderTextColor={colors.onSurfaceVariant}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => {
                  setSearchQuery('');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={{ padding: spacing.sm }}
              >
                <X size={18} color={colors.onSurfaceVariant} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Connection Status */}
        {!socketConnected && (
          <View style={[styles.connectionBanner, { backgroundColor: colors.errorContainer }]}>
            <CloudOff size={16} color={colors.onErrorContainer} />
            <Text style={[typography.labelMedium, { color: colors.onErrorContainer }]}>{t('screens.connectingToChatServer')}</Text>
            <ActivityIndicator size="small" color={colors.onErrorContainer} />
          </View>
        )}

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: spacing.md }]}>
              Loading conversations...
            </Text>
          </View>
        ) : showContacts ? (
          // Contact list for new chat
          <ScrollView
            style={styles.listContainer}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.sectionTitle, typography.labelMedium, { color: colors.onSurfaceVariant }]}>
              Select a contact
            </Text>
            {filteredContacts.length === 0 ? (
              <EmptyState
                icon={Users}
                title={t('screens.noContactsFound')}
                subtitle={searchQuery ? 'Try a different search term' : 'No contacts available'}
              />
            ) : (
              filteredContacts.map((contact, index) => (
                <ContactItem
                  key={contact.id || contact.userId || index}
                  contact={contact}
                  onPress={() => handleContactPress(contact)}
                />
              ))
            )}
          </ScrollView>
        ) : (
          // Conversations list
          <ScrollView
            style={styles.listContainer}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          >
            {filteredConversations.length === 0 ? (
              <EmptyState
                icon={MessageCircle}
                title={t('screens.noMessagesYet')}
                subtitle={searchQuery ? 'No conversations match your search' : 'Start a conversation with your colleagues'}
                actionLabel={searchQuery ? null : 'Start Chatting'}
                onAction={() => setShowContacts(true)}
              />
            ) : (
              filteredConversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  onPress={() => handleConversationPress(conversation)}
                  getConversationName={getConversationName}
                  getConversationAvatar={getConversationAvatar}
                  onDelete={handleDeleteConversation}
                />
              ))
            )}
          </ScrollView>
        )}
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
  },
  newChatButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    height: '100%',
  },
  connectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingTop: 8,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Chat Item Styles
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  avatarContainer: {
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    textAlign: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDotInner: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  // Swipe Action Styles
  swipeAction: {
    width: 80,
    flexDirection: 'row',
  },
  deleteAction: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Empty State Styles
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    marginTop: 24,
  },
  // Contact Styles
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  contactInfo: {
    flex: 1,
  },
  contactRoleContainer: {
    marginTop: 4,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
});

export default ChatScreen;
