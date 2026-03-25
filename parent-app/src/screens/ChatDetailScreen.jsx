import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Avatar, Loading } from '../components';
import { Send, Paperclip, Smile, Check, CheckCheck, Clock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

const getRoleTag = (role) => {
  const { t } = useTranslation();
  if (!role) return null;
  const r = role.toLowerCase();
  if (r.includes('admin') || r.includes('principal')) return 'Admin';
  if (r.includes('teacher') || r.includes('faculty') || r.includes('staff')) return 'Teacher';
  if (r.includes('student')) return 'Student';
  if (r.includes('parent')) return 'Parent';
  return role;
};

const getRoleColor = (roleTag) => {
  switch (roleTag) {
    case 'Admin': return { bg: '#ef444420', text: '#ef4444' };
    case 'Teacher': return { bg: '#3b82f620', text: '#3b82f6' };
    case 'Student': return { bg: '#22c55e20', text: '#22c55e' };
    case 'Parent': return { bg: '#f59e0b20', text: '#f59e0b' };
    default: return { bg: '#6b728020', text: '#6b7280' };
  }
};

const formatMessageTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatDateSeparator = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const ChatDetailScreen = ({ route, navigation }) => {
  const {
    conversationId,
    participantId,
    participantName,
    participantRole,
    participantAvatar,
    participantOnline,
  } = route.params;
  const { messages, loading, sendMessage, currentChat, selectConversation } = useChat();
  const { user } = useAuth();
  const { themeColors } = useTheme();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef(null);

  const roleTag = getRoleTag(participantRole);
  const roleColor = getRoleColor(roleTag);

  // Set header with role tag and custom back action to clear currentChat
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            selectConversation(null);
            navigation.goBack();
          }}
          style={{ paddingHorizontal: 8, paddingVertical: 4 }}
        >
          <Text style={{ fontSize: 16, color: '#007AFF' }}>{'‹ Back'}</Text>
        </TouchableOpacity>
      ),
      headerTitle: () => (
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerName, { color: themeColors.text }]} numberOfLines={1}>
            {participantName}
          </Text>
          <View style={styles.headerSubRow}>
            {roleTag && (
              <View style={[styles.headerRoleTag, { backgroundColor: roleColor.bg }]}>
                <Text style={[styles.headerRoleText, { color: roleColor.text }]}>{roleTag}</Text>
              </View>
            )}
            {participantOnline && (
              <Text style={[styles.headerOnline, { color: '#22c55e' }]}>{t('screens.online')}</Text>
            )}
          </View>
        </View>
      ),
    });
  }, [participantName, roleTag, participantOnline]);

  useEffect(() => {
    if (!currentChat || currentChat.id !== conversationId) {
      selectConversation({
        id: conversationId,
        participant: {
          id: participantId,
          name: participantName,
          role: participantRole,
          avatar: participantAvatar,
          online: participantOnline,
        },
      });
    }
  }, [conversationId]);

  // Handle Android hardware back button — clear currentChat state
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const onBackPress = () => {
      selectConversation(null);
      navigation.goBack();
      return true; // prevent default back behavior
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [navigation, selectConversation]);

  // Scroll to bottom when messages list changes (new message added)
  const prevMessageCountRef = useRef(0);
  useEffect(() => {
    const newCount = messages.length;
    if (newCount > prevMessageCountRef.current) {
      // New messages arrived — scroll to end
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
    prevMessageCountRef.current = newCount;
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');
    await sendMessage(text);
  };

  // Group messages by date for date separators
  const getDateKey = (dateString) => {
    const date = new Date(dateString);
    return date.toDateString();
  };

  const StatusIcon = ({ status }) => {
    switch (status) {
      case 'read':
        return <CheckCheck size={14} color="#3b82f6" />;
      case 'delivered':
        return <CheckCheck size={14} color={themeColors.textTertiary} />;
      case 'sent':
        return <Check size={14} color={themeColors.textTertiary} />;
      default:
        return <Clock size={14} color={themeColors.textTertiary} />;
    }
  };

  const renderMessage = ({ item, index }) => {
    const isOwn = item.senderId === user?.id;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showDateSeparator =
      !prevMessage ||
      getDateKey(item.timestamp || item.createdAt) !== getDateKey(prevMessage.timestamp || prevMessage.createdAt);

    return (
      <>
        {showDateSeparator && (
          <View style={styles.dateSeparator}>
            <View style={[styles.dateLine, { backgroundColor: themeColors.border }]} />
            <Text style={[styles.dateText, { color: themeColors.textTertiary, backgroundColor: themeColors.background }]}>
              {formatDateSeparator(item.timestamp || item.createdAt)}
            </Text>
            <View style={[styles.dateLine, { backgroundColor: themeColors.border }]} />
          </View>
        )}
        <View style={[styles.messageContainer, isOwn && styles.ownMessageContainer]}>
          {!isOwn && (
            <Avatar name={participantName} source={participantAvatar} size="small" />
          )}
          <View
            style={[
              styles.messageBubble,
              {
                backgroundColor: isOwn
                  ? themeColors.text
                  : themeColors.backgroundSecondary,
              },
              isOwn && styles.ownMessageBubble,
              !isOwn && styles.otherMessageBubble,
            ]}
          >
            {!isOwn && item.senderName && (
              <Text style={[styles.senderName, { color: themeColors.textSecondary }]}>
                {item.senderName}
              </Text>
            )}
            {item.isEdited && (
              <Text style={[styles.editedTag, { color: isOwn ? themeColors.textInverse : themeColors.textTertiary }]}>
                edited
              </Text>
            )}
            <Text
              style={[
                styles.messageText,
                {
                  color: isOwn ? themeColors.textInverse : themeColors.text,
                },
              ]}
            >
              {item.text || item.content}
            </Text>
            <View style={styles.messageFooter}>
              <Text
                style={[
                  styles.messageTime,
                  {
                    color: isOwn
                      ? themeColors.textInverse
                      : themeColors.textTertiary,
                    opacity: 0.7,
                  },
                ]}
              >
                {formatMessageTime(item.timestamp || item.createdAt)}
              </Text>
              {isOwn && (
                <View style={styles.statusIcon}>
                  <StatusIcon status={item.status} />
                </View>
              )}
            </View>
          </View>
        </View>
      </>
    );
  };

  if (loading && !messages.length) {
    return <Loading fullScreen message="Loading messages..." />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: themeColors.textTertiary }]}>
                No messages yet. Start the conversation!
              </Text>
            </View>
          }
        />

        {/* Input Area */}
        <View style={[styles.inputContainer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
          <TouchableOpacity style={styles.attachButton}>
            <Paperclip size={20} color={themeColors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.inputWrapper, { backgroundColor: themeColors.backgroundSecondary }]}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder={t('screens.typeAMessage')}
              placeholderTextColor={themeColors.textTertiary}
              style={[styles.input, { color: themeColors.text }]}
              multiline
              maxLength={1000}
              returnKeyType="default"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: themeColors.text },
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Send size={18} color={themeColors.textInverse} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  headerTitleContainer: {
    alignItems: 'flex-start',
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  headerRoleTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  headerRoleText: {
    fontSize: 10,
    fontWeight: '600',
  },
  headerOnline: {
    fontSize: 11,
    fontWeight: '500',
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dateLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dateText: {
    fontSize: 12,
    paddingHorizontal: 12,
    fontWeight: '500',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
    gap: 8,
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  ownMessageBubble: {
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  editedTag: {
    fontSize: 10,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  messageTime: {
    fontSize: 10,
  },
  statusIcon: {
    marginLeft: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  attachButton: {
    padding: 8,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  input: {
    fontSize: 15,
    maxHeight: 80,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default ChatDetailScreen;
