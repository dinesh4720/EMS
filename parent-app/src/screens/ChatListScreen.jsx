import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import { Card, Avatar, Loading, EmptyState } from '../components';
import { truncateText } from '../utils/helpers';
import { Search, MessageCircle } from 'lucide-react-native';

const getRoleTag = (role, userType) => {
  if (!role && !userType) return null;
  const r = (role || userType || '').toLowerCase();
  if (r.includes('admin') || r.includes('principal') || r.includes('management')) return 'Admin';
  if (r.includes('teacher') || r.includes('faculty') || r.includes('staff')) return 'Teacher';
  if (r.includes('student')) return 'Student';
  if (r.includes('parent')) return 'Parent';
  // Default: capitalize the role
  return role || userType || null;
};

const getRoleColor = (roleTag) => {
  switch (roleTag) {
    case 'Admin':
      return { bg: '#ef444420', text: '#ef4444' };
    case 'Teacher':
      return { bg: '#3b82f620', text: '#3b82f6' };
    case 'Student':
      return { bg: '#22c55e20', text: '#22c55e' };
    case 'Parent':
      return { bg: '#f59e0b20', text: '#f59e0b' };
    default:
      return { bg: '#6b728020', text: '#6b7280' };
  }
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const ChatListScreen = ({ navigation }) => {
  const { conversations, loading, fetchConversations, selectConversation } = useChat();
  const { themeColors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (conv) =>
        conv.participant?.name?.toLowerCase().includes(q) ||
        conv.participant?.role?.toLowerCase().includes(q) ||
        conv.lastMessage?.toLowerCase?.().includes(q) ||
        conv.groupName?.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  const handleConversationPress = (conversation) => {
    selectConversation(conversation);
    navigation.navigate('ChatDetail', {
      conversationId: conversation.id,
      participantId: conversation.participant?.id,
      participantName: conversation.participant?.name || conversation.groupName || 'Chat',
      participantRole: conversation.participant?.role,
      participantAvatar: conversation.participant?.avatar,
      participantOnline: conversation.participant?.online,
    });
  };

  const ConversationItem = ({ conversation }) => {
    const participant = conversation.participant;
    const roleTag = getRoleTag(participant?.role, participant?.userType);
    const roleColor = getRoleColor(roleTag);
    const lastMsg = typeof conversation.lastMessage === 'object'
      ? conversation.lastMessage.content
      : conversation.lastMessage;

    return (
      <TouchableOpacity onPress={() => handleConversationPress(conversation)}>
        <Card style={styles.conversationCard}>
          <View style={styles.conversationContent}>
            <View style={styles.avatarContainer}>
              <Avatar
                name={participant?.name || conversation.groupName}
                source={participant?.avatar}
                size="medium"
              />
              {participant?.online && (
                <View style={[styles.onlineIndicator, { backgroundColor: '#22c55e', borderColor: themeColors.surface }]} />
              )}
            </View>
            <View style={styles.conversationInfo}>
              <View style={styles.conversationHeader}>
                <View style={styles.nameRow}>
                  <Text style={[styles.participantName, { color: themeColors.text }]} numberOfLines={1}>
                    {participant?.name || conversation.groupName || 'Unknown'}
                  </Text>
                  {roleTag && (
                    <View style={[styles.roleTag, { backgroundColor: roleColor.bg }]}>
                      <Text style={[styles.roleTagText, { color: roleColor.text }]}>
                        {roleTag}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.timeText, { color: themeColors.textTertiary }]}>
                  {formatTimeAgo(conversation.lastMessageTime)}
                </Text>
              </View>
              <Text
                style={[
                  styles.lastMessage,
                  { color: conversation.unread > 0 ? themeColors.text : themeColors.textTertiary },
                  conversation.unread > 0 && styles.lastMessageUnread,
                ]}
                numberOfLines={1}
              >
                {truncateText(lastMsg || 'No messages yet', 45)}
              </Text>
            </View>
            {conversation.unread > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: themeColors.text }]}>
                <Text style={[styles.unreadText, { color: themeColors.textInverse }]}>
                  {conversation.unread > 99 ? '99+' : conversation.unread}
                </Text>
              </View>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading && !conversations.length) {
    return <Loading fullScreen message="Loading conversations..." />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['left', 'right']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>
          Messages
        </Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: themeColors.backgroundSecondary }]}>
        <Search size={18} color={themeColors.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: themeColors.text }]}
          placeholder="Search conversations..."
          placeholderTextColor={themeColors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => (
              <ConversationItem key={conversation.id} conversation={conversation} />
            ))
          ) : (
            <EmptyState
              title={searchQuery ? 'No Results' : 'No Messages'}
              message={
                searchQuery
                  ? 'No conversations match your search.'
                  : 'Start a conversation with your child\'s teachers or school administration.'
              }
              icon={<MessageCircle size={48} color={themeColors.textTertiary} />}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  conversationCard: {
    marginBottom: 10,
    padding: 12,
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  conversationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    gap: 6,
  },
  participantName: {
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  roleTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 11,
  },
  lastMessage: {
    fontSize: 13,
  },
  lastMessageUnread: {
    fontWeight: '500',
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default ChatListScreen;
