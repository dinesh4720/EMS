// Enhanced Chat Detail Screen for Staff App
// Modern UI with Material 3 Design
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Pressable,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Audio } from 'expo-av';
import {
  ArrowLeft,
  Send,
  Image as ImageIcon,
  Mic,
  MoreVertical,
  Smile,
  Paperclip,
  Play,
  Pause,
  Copy,
  Reply,
  Forward,
  Trash2,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  X
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import chatService from '../services/chatService';
import socketService from '../services/socketService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Available reaction emojis
const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

// Generate gradient colors based on name
const getAvatarGradient = (name) => {
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

// Animated Avatar Component
const Avatar = ({ name, size = 40 }) => {
  const gradient = getAvatarGradient(name);
  const { typography } = useTheme();

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

// Animated Typing Indicator
const AnimatedTypingIndicator = () => {
  const { colors } = useTheme();
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (anim, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animate(dot1Anim, 0);
    animate(dot2Anim, 150);
    animate(dot3Anim, 300);
  }, []);

  const getScale = (anim) => anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.4],
  });

  const getOpacity = (anim) => anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  return (
    <View style={[styles.typingContainer, { backgroundColor: colors.surfaceContainerHighest }]}>
      <View style={styles.typingBubble}>
        <Animated.View style={[styles.typingDot, { backgroundColor: colors.onSurfaceVariant, transform: [{ scale: getScale(dot1Anim) }], opacity: getOpacity(dot1Anim) }]} />
        <Animated.View style={[styles.typingDot, { backgroundColor: colors.onSurfaceVariant, transform: [{ scale: getScale(dot2Anim) }], opacity: getOpacity(dot2Anim) }]} />
        <Animated.View style={[styles.typingDot, { backgroundColor: colors.onSurfaceVariant, transform: [{ scale: getScale(dot3Anim) }], opacity: getOpacity(dot3Anim) }]} />
      </View>
    </View>
  );
};

// Message Context Menu
const MessageContextMenu = ({ visible, position, message, isOwn, onClose, onAction }) => {
  const { colors, typography, shape } = useTheme();

  if (!visible) return null;

  const actions = [
    { id: 'reply', icon: Reply, label: 'Reply', color: colors.primary },
    { id: 'copy', icon: Copy, label: 'Copy', color: colors.onSurface },
    { id: 'forward', icon: Forward, label: 'Forward', color: colors.onSurface },
  ];

  if (isOwn) {
    actions.push({ id: 'delete', icon: Trash2, label: 'Delete', color: colors.error });
  }

  const handleAction = (action) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAction(action, message);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.contextMenuOverlay} onPress={onClose}>
        <View style={[
          styles.contextMenu,
          {
            top: position.y,
            left: position.x,
            backgroundColor: colors.surfaceContainerHighest,
            borderColor: colors.outlineVariant,
            borderWidth: 1,
            borderRadius: shape.cornerMedium,
          }
        ]}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[styles.contextMenuItem, { borderBottomColor: colors.outlineVariant }]}
              onPress={() => handleAction(action)}
            >
              <action.icon size={20} color={action.color} />
              <Text style={[styles.contextMenuText, typography.labelLarge, { color: action.color }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
};

// Voice Waveform Component - stable bars that don't re-randomize on every render
const VoiceWaveform = ({ duration, isOwn, waveformData, progress = 0 }) => {
  const { colors } = useTheme();
  // Use provided waveform data or generate stable random bars based on duration
  const bars = React.useMemo(() => {
    if (waveformData && waveformData.length > 0) {
      // Compress to 20 bars if needed
      if (waveformData.length <= 20) return waveformData;
      const result = [];
      const step = waveformData.length / 20;
      for (let i = 0; i < 20; i++) {
        result.push(waveformData[Math.floor(i * step)] || 0.3);
      }
      return result;
    }
    // Generate pseudo-random bars based on duration as seed for stability
    const seed = (duration || 1) * 1000;
    return Array.from({ length: 20 }, (_, i) => {
      const val = ((seed * (i + 1) * 9301 + 49297) % 233280) / 233280;
      return val * 0.8 + 0.2;
    });
  }, [duration, waveformData]);

  return (
    <View style={styles.voiceWaveform}>
      {bars.map((height, index) => {
        const barProgress = (index / bars.length) * 100;
        const isPassed = barProgress <= progress;
        return (
          <View
            key={index}
            style={[
              styles.waveformBar,
              {
                height: height * 16,
                backgroundColor: isOwn ? colors.onPrimary : colors.onSurfaceVariant,
                opacity: isPassed ? 1 : (isOwn ? 0.5 : 0.4),
              },
            ]}
          />
        );
      })}
    </View>
  );
};

// Voice Message Player - handles actual audio playback via expo-av
const VoiceMessagePlayer = ({ message, isOwn, colors, typography }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const soundRef = useRef(null);

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  const handlePlayPause = async () => {
    try {
      if (isPlaying && soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        return;
      }

      // Configure audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      if (soundRef.current) {
        // Resume existing sound
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          if (status.didJustFinish || status.positionMillis >= status.durationMillis) {
            await soundRef.current.setPositionAsync(0);
          }
          await soundRef.current.playAsync();
          setIsPlaying(true);
          return;
        }
      }

      // Load and play new sound
      if (!message.fileUrl) {
        Alert.alert('Error', 'Voice message URL not available');
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: message.fileUrl },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            if (status.durationMillis > 0) {
              setPlaybackProgress((status.positionMillis / status.durationMillis) * 100);
              setCurrentTime(status.positionMillis / 1000);
            }
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPlaybackProgress(0);
              setCurrentTime(0);
            }
          }
        }
      );

      soundRef.current = sound;
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing voice message:', error);
      setIsPlaying(false);
      Alert.alert('Playback Error', 'Failed to play voice message. The file may be unavailable.');
    }
  };

  const totalDuration = message.duration || 0;

  return (
    <View style={styles.voiceContainer}>
      <TouchableOpacity
        onPress={handlePlayPause}
        style={[
          styles.voicePlayButton,
          { backgroundColor: isOwn ? 'rgba(255,255,255,0.2)' : colors.secondaryContainer }
        ]}
      >
        {isPlaying ? (
          <Pause
            size={18}
            color={isOwn ? colors.onPrimary : colors.onSecondaryContainer}
          />
        ) : (
          <Play
            size={18}
            fill={isOwn ? colors.onPrimary : colors.onSecondaryContainer}
            color={isOwn ? colors.onPrimary : colors.onSecondaryContainer}
          />
        )}
      </TouchableOpacity>
      <View style={styles.voiceContent}>
        <VoiceWaveform
          duration={totalDuration}
          isOwn={isOwn}
          waveformData={message.waveform}
          progress={playbackProgress}
        />
        <Text style={[
          styles.voiceDuration,
          typography.labelSmall,
          { color: isOwn ? colors.onPrimary : colors.onSurfaceVariant }
        ]}>
          {isPlaying ? formatDuration(currentTime) : formatDuration(totalDuration)}
        </Text>
      </View>
    </View>
  );
};

// Message Bubble Component
const MessageBubble = ({
  message,
  isOwn,
  showAvatar,
  otherUserName,
  currentUserId,
  onReact,
  onLongPress,
}) => {
  const { colors, typography, shape, spacing } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, []);

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toFixed(0).padStart(2, '0')}`;
  };

  const handleLongPress = (event) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { pageX, pageY } = event.nativeEvent;

    // Adjust position to stay within screen bounds
    const x = Math.min(pageX - 100, SCREEN_WIDTH - 200);
    const y = Math.min(pageY - 50, SCREEN_HEIGHT - 300);

    setMenuPosition({ x, y });
    setMenuVisible(true);
    onLongPress && onLongPress(message);
  };

  const handleMenuAction = (action, msg) => {
    switch (action.id) {
      case 'copy':
        Clipboard.setStringAsync(msg.content || '');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'reply':
        // Reply is handled via the parent's onLongPress + reaction picker for now
        // Could be extended with a reply state in ChatDetailScreen
        break;
      case 'forward':
        // Forward is a future feature
        break;
      case 'delete':
        Alert.alert(
          'Delete Message',
          'Are you sure you want to delete this message?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                try {
                  await chatService.deleteMessage(msg.id, currentUserId);
                  // Remove from local state - parent handles this via socket event
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } catch (error) {
                  Alert.alert('Error', 'Failed to delete message');
                }
              },
            },
          ]
        );
        break;
    }
  };

  // Render message content based on type
  const renderContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <View style={[styles.imageContainer, { backgroundColor: colors.surfaceContainerHighest }]}>
            {message.fileUrl ? (
              <Image
                source={{ uri: message.fileUrl }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <ImageIcon size={32} color={colors.onSurfaceVariant} />
                <Text style={[styles.imagePlaceholderText, typography.bodyMedium, { color: colors.onSurfaceVariant }]}>Image</Text>
              </View>
            )}
            {message.content && (
              <Text style={[styles.messageText, typography.bodyLarge, { color: isOwn ? colors.onPrimary : colors.onSurface, marginTop: spacing.xs }]}>
                {message.content}
              </Text>
            )}
          </View>
        );

      case 'voice':
      case 'audio':
        return (
          <VoiceMessagePlayer
            message={message}
            isOwn={isOwn}
            colors={colors}
            typography={typography}
          />
        );

      case 'file':
        return (
          <View style={styles.fileContainer}>
            <View style={[
              styles.fileIconContainer,
              { backgroundColor: isOwn ? 'rgba(255,255,255,0.2)' : colors.secondaryContainer }
            ]}>
              <Paperclip size={20} color={isOwn ? colors.onPrimary : colors.onSecondaryContainer} />
            </View>
            <View style={styles.fileInfo}>
              <Text style={[
                styles.fileName,
                typography.bodyMedium,
                { color: isOwn ? colors.onPrimary : colors.onSurface, fontWeight: '500' }
              ]} numberOfLines={1}>
                {message.fileName || 'File'}
              </Text>
              {message.fileSize && (
                <Text style={[
                  styles.fileSize,
                  typography.labelSmall,
                  { color: isOwn ? 'rgba(255,255,255,0.8)' : colors.onSurfaceVariant }
                ]}>
                  {(message.fileSize / 1024).toFixed(1)} KB
                </Text>
              )}
            </View>
          </View>
        );

      default:
        return (
          <Text style={[styles.messageText, typography.bodyLarge, { color: isOwn ? colors.onPrimary : colors.onSurface }]}>
            {message.content}
          </Text>
        );
    }
  };

  // Render reactions
  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;

    const groupedReactions = {};
    message.reactions.forEach((reaction) => {
      if (!groupedReactions[reaction.emoji]) {
        groupedReactions[reaction.emoji] = [];
      }
      groupedReactions[reaction.emoji].push(reaction);
    });

    return (
      <View style={styles.reactionsContainer}>
        {Object.entries(groupedReactions).map(([emoji, reactions]) => {
          const userHasReacted = reactions.some(
            (r) => r.userId?.toString() === currentUserId?.toString()
          );
          return (
            <TouchableOpacity
              key={emoji}
              style={[
                styles.reactionBadge,
                {
                  backgroundColor: userHasReacted ? colors.primaryContainer : colors.surfaceContainerHigh,
                  borderColor: colors.outlineVariant
                }
              ]}
              onPress={() => onReact && onReact(message, emoji)}
            >
              <Text style={styles.reactionEmoji}>{emoji}</Text>
              {reactions.length > 1 && (
                <Text style={[styles.reactionCount, typography.labelSmall, { color: colors.onSurface }]}>{reactions.length}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const getStatusIcon = () => {
    if (!isOwn) return null;

    switch (message.status) {
      case 'sending':
        return <Clock size={14} color="rgba(255,255,255,0.7)" />;
      case 'sent':
        return <Check size={14} color="rgba(255,255,255,0.7)" />;
      case 'delivered':
        return <CheckCheck size={14} color="rgba(255,255,255,0.7)" />;
      case 'read':
        return <CheckCheck size={14} color={colors.tertiaryContainer} />; // Highlight read
      case 'failed':
        return <AlertCircle size={14} color={colors.errorContainer} />;
      default:
        return null;
    }
  };

  return (
    <Animated.View
      style={[
        styles.messageContainer,
        isOwn ? styles.ownMessageContainer : styles.otherMessageContainer,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      {!isOwn && showAvatar && (
        <View style={styles.messageAvatar}>
          <Avatar name={otherUserName} size={32} />
        </View>
      )}
      {!isOwn && !showAvatar && <View style={styles.avatarSpacer} />}

      <TouchableOpacity
        onLongPress={handleLongPress}
        activeOpacity={0.8}
        delayLongPress={300}
      >
        <View style={[
          styles.messageBubble,
          isOwn
            ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
            : { backgroundColor: colors.surfaceContainerHighest, borderBottomLeftRadius: 4 }
        ]}>
          {renderContent()}
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              typography.labelSmall,
              { color: isOwn ? 'rgba(255,255,255,0.7)' : colors.onSurfaceVariant }
            ]}>
              {formatTime(message.createdAt || message.timestamp)}
            </Text>
            {getStatusIcon()}
          </View>
        </View>
        {renderReactions()}
      </TouchableOpacity>

      <MessageContextMenu
        visible={menuVisible}
        position={menuPosition}
        message={message}
        isOwn={isOwn}
        onClose={() => setMenuVisible(false)}
        onAction={handleMenuAction}
      />
    </Animated.View>
  );
};

// Reaction Picker Modal
const ReactionPicker = ({ visible, onClose, onSelect }) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Animated.View style={[
          styles.reactionPicker,
          {
            backgroundColor: colors.surfaceContainer,
            transform: [{ scale: scaleAnim }]
          }
        ]}>
          {REACTION_EMOJIS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={styles.reactionPickerItem}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(emoji);
                onClose();
              }}
            >
              <Text style={styles.reactionPickerEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

// Voice Recording Button
const VoiceRecordingButton = ({ onRecordingComplete, disabled }) => {
  const { colors, typography } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant microphone permission to record voice messages.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingTime(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      clearInterval(recordingIntervalRef.current);
      setIsRecording(false);

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      if (uri && onRecordingComplete) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onRecordingComplete(uri, recordingTime);
      }

      setRecording(null);
      setRecordingTime(0);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isRecording) {
    return (
      <TouchableOpacity
        style={[styles.recordingContainer, { backgroundColor: colors.errorContainer }]}
        onPress={stopRecording}
      >
        <Animated.View style={[styles.recordingPulse, { backgroundColor: colors.error, transform: [{ scale: pulseAnim }] }]} />
        <View style={[styles.recordingDot, { backgroundColor: colors.error }]} />
        <Text style={[styles.recordingTime, typography.labelMedium, { color: colors.onErrorContainer }]}>{formatTime(recordingTime)}</Text>
        <Text style={[styles.recordingHint, typography.labelSmall, { color: colors.onErrorContainer }]}>Tap to stop</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.attachButton}
      onPress={startRecording}
      disabled={disabled}
    >
      <Mic size={24} color={disabled ? colors.onSurfaceVariant : colors.onSurface} strokeWidth={2} />
    </TouchableOpacity>
  );
};

const ChatDetailScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { colors, typography, spacing, shape } = useTheme();
  const {
    sendMessage,
    markAsRead,
    sendTyping,
    joinConversation,
    leaveConversation,
    getConversationName,
    getConversationAvatar,
    typingUsers,
    socketConnected
  } = useChat();

  const { conversationId, conversation: initialConversation, contactId, contactName } = route.params || {};

  const [conversation, setConversation] = useState(initialConversation || null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [selectedMessageForReaction, setSelectedMessageForReaction] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const scrollViewRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Get conversation name
  const conversationName = conversation
    ? getConversationName(conversation)
    : contactName || 'Chat';

  // Check if other user is typing
  const isOtherUserTyping = conversationId && typingUsers[conversationId];

  // Handle incoming messages from socket
  useEffect(() => {
    const handleNewMessage = (data) => {
      const msgConvId = data.conversationId || data.message?.conversationId;
      const currentConvId = conversationId || conversation?.id;

      if (msgConvId?.toString() === currentConvId?.toString()) {
        const newMessage = data.message || data;
        const newMessageId = newMessage.id || newMessage._id;
        const newSenderId = newMessage.senderId?._id || newMessage.senderId;

        setMessages((prev) => {
          const exists = prev.some(
            (m) => m.id?.toString() === newMessageId?.toString()
          );
          if (exists) return prev;

          // Deduplicate optimistic update
          if (newSenderId?.toString() === user?.id?.toString()) {
            const tempIndex = prev.findIndex(
              (m) => m.id?.toString().startsWith('temp-') &&
                m.senderId?.toString() === user?.id?.toString()
            );

            if (tempIndex !== -1) {
              const updated = [...prev];
              updated[tempIndex] = {
                ...newMessage,
                id: newMessageId,
                senderId: newSenderId,
                status: 'sent',
              };
              return updated;
            }
          }

          return [...prev, {
            ...newMessage,
            id: newMessageId,
            senderId: newSenderId,
          }];
        });
      }
    };

    const handleMessageRead = (data) => {
      if (data.conversationId?.toString() === (conversationId || conversation?.id)?.toString()) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.senderId?.toString() === user?.id?.toString()) {
              return { ...msg, status: 'read' };
            }
            return msg;
          })
        );
      }
    };

    socketService.on('new_message', handleNewMessage);
    socketService.on('message_read', handleMessageRead);
    socketService.on('messages_read', handleMessageRead);

    return () => {
      socketService.off('new_message', handleNewMessage);
      socketService.off('message_read', handleMessageRead);
      socketService.off('messages_read', handleMessageRead);
    };
  }, [conversationId, conversation?.id, user?.id]);

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!conversationId && !conversation?.id) return;

    const convId = conversationId || conversation.id;
    setLoading(true);

    try {
      const msgs = await chatService.getMessages(convId);
      const formattedMsgs = (msgs || []).map((msg) => ({
        ...msg,
        id: msg.id || msg._id,
        senderId: msg.senderId?._id || msg.senderId,
      }));
      setMessages(formattedMsgs);
      await markAsRead(convId);
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [conversationId, conversation?.id, markAsRead]);

  // Initialize conversation if coming from contact
  const initializeConversation = useCallback(async () => {
    if (!conversation && contactId) {
      try {
        const conv = await chatService.createConversation(
          user.id,
          'staff',
          contactId,
          'staff'
        );
        setConversation(conv);
      } catch (error) {
        console.error('Error creating conversation:', error);
        Alert.alert('Error', 'Failed to start conversation');
        navigation.goBack();
      }
    }
  }, [conversation, contactId, user?.id, navigation]);

  // Setup on mount
  useEffect(() => {
    initializeConversation();
  }, [initializeConversation]);

  // Load messages when conversation is ready
  useEffect(() => {
    if (conversation?.id || conversationId) {
      loadMessages();
      joinConversation(conversation?.id || conversationId);
    }

    return () => {
      if (conversation?.id || conversationId) {
        leaveConversation(conversation?.id || conversationId);
      }
    };
  }, [conversation?.id, conversationId, loadMessages, joinConversation, leaveConversation]);

  // Scroll to bottom when messages load
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, loading]);

  // Handle typing indicator
  const handleTyping = useCallback((text) => {
    setInputText(text);

    const convId = conversationId || conversation?.id;
    if (convId) {
      sendTyping(convId, true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(convId, false);
      }, 2000);
    }
  }, [conversationId, conversation?.id, sendTyping]);

  // Pick and send image
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingImage(true);
        // Logic to upload image would go here
        // For now simulating image send via message type
        // Real implementation depends on how chatService handles file uploads
        Alert.alert('Coming Soon', 'Image upload is being implemented.');
        setUploadingImage(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      setUploadingImage(false);
    }
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !uploadingImage) || sending) return;

    const convId = conversationId || conversation?.id;
    if (!convId) return;

    const content = inputText.trim();
    setInputText('');
    setSending(true);

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      content,
      senderId: user.id,
      conversationId: convId,
      createdAt: new Date().toISOString(),
      status: 'sending',
      type: 'text',
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      await sendMessage(convId, content, 'text');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInputText(content);
    } finally {
      setSending(false);
    }
  };

  const handleVoiceRecording = async (uri, duration) => {
    if (!uri) return;

    const convId = conversationId || conversation?.id;
    if (!convId) {
      Alert.alert('Error', 'No active conversation');
      return;
    }

    setSending(true);

    // Optimistic update
    const tempId = `temp-voice-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      content: '',
      senderId: user.id,
      conversationId: convId,
      createdAt: new Date().toISOString(),
      status: 'sending',
      type: 'voice',
      duration: duration,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      // Upload the voice file
      const uploadResult = await chatService.uploadFile(uri, 'voice');

      if (!uploadResult || !uploadResult.url) {
        throw new Error('Upload succeeded but no URL returned');
      }

      // Send the voice message via context
      await sendMessage(convId, '', 'voice', null, null, duration, uploadResult.url);

      // Remove optimistic message (real one will come via socket)
      setMessages((prev) => prev.filter((m) => m.id !== tempId));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error sending voice message:', error);
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      Alert.alert('Error', 'Failed to send voice message');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.outlineVariant, backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color={colors.onSurface} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, typography.titleLarge, { color: colors.onSurface }]} numberOfLines={1}>
              {conversationName}
            </Text>
            {isOtherUserTyping ? (
              <Text style={[styles.headerStatus, typography.bodySmall, { color: colors.primary }]}>Typing...</Text>
            ) : (
              <Text style={[styles.headerStatus, typography.bodySmall, { color: colors.onSurfaceVariant }]}>
                Online
              </Text>
            )}
          </View>

          <TouchableOpacity style={styles.headerAction}>
            <MoreVertical size={24} color={colors.onSurface} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
          ) : (
            messages.map((msg, index) => {
              const isOwn = msg.senderId?.toString() === user?.id?.toString();
              const showAvatar = !isOwn && (
                index === 0 ||
                messages[index - 1].senderId?.toString() !== msg.senderId?.toString()
              );

              return (
                <MessageBubble
                  key={msg.id || index}
                  message={msg}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  otherUserName={conversationName}
                  currentUserId={user?.id}
                  onReact={async (m, e) => {
                    const convId = conversationId || conversation?.id;
                    try {
                      // Check if user already reacted with this emoji - toggle it
                      const userReaction = m.reactions?.find(
                        (r) => r.emoji === e && r.userId?.toString() === user?.id?.toString()
                      );
                      if (userReaction) {
                        await chatService.removeReaction(convId, m.id, e, user?.id);
                      } else {
                        await chatService.addReaction(convId, m.id, e, user?.id);
                      }
                    } catch (error) {
                      console.error('Error toggling reaction:', error);
                    }
                  }}
                  onLongPress={(m) => {
                    setSelectedMessageForReaction(m);
                    setShowReactionPicker(true);
                  }}
                />
              );
            })
          )}
          {isOtherUserTyping && <AnimatedTypingIndicator />}
        </ScrollView>

        {/* Input Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
          <View style={[styles.inputContainer, { borderTopColor: colors.outlineVariant, backgroundColor: colors.surface }]}>
            <TouchableOpacity style={styles.attachButton} onPress={handlePickImage} disabled={sending}>
              <ImageIcon size={24} color={colors.onSurfaceVariant} />
            </TouchableOpacity>

            <View style={[styles.textInputWrapper, { backgroundColor: colors.surfaceContainerHigh }]}>
              <TextInput
                ref={inputRef}
                style={[styles.textInput, typography.bodyLarge, { color: colors.onSurface }]}
                value={inputText}
                onChangeText={handleTyping}
                placeholder="Message..."
                placeholderTextColor={colors.onSurfaceVariant}
                multiline
                maxLength={1000}
              />
            </View>

            {inputText.trim() ? (
              <TouchableOpacity
                style={[styles.sendButton, { backgroundColor: colors.primary }]}
                onPress={handleSendMessage}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <Send size={20} color={colors.onPrimary} />
                )}
              </TouchableOpacity>
            ) : (
              <VoiceRecordingButton onRecordingComplete={handleVoiceRecording} disabled={sending} />
            )}
          </View>
        </KeyboardAvoidingView>

        <ReactionPicker
          visible={showReactionPicker}
          onClose={() => setShowReactionPicker(false)}
          onSelect={async (emoji) => {
            if (selectedMessageForReaction) {
              const convId = conversationId || conversation?.id;
              try {
                await chatService.addReaction(convId, selectedMessageForReaction.id, emoji, user?.id);
              } catch (error) {
                console.error('Error adding reaction:', error);
              }
            }
            setShowReactionPicker(false);
            setSelectedMessageForReaction(null);
          }}
        />
      </View>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '600',
  },
  headerStatus: {
    marginTop: 2,
  },
  headerAction: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  attachButton: {
    padding: 8,
  },
  textInputWrapper: {
    flex: 1,
    borderRadius: 24,
    marginHorizontal: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
    justifyContent: 'center',
  },
  textInput: {
    maxHeight: 100,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  // Message Styles
  messageContainer: {
    marginBottom: 16,
    width: '100%',
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageAvatar: {
    marginRight: 8,
    marginBottom: 4,
  },
  avatarSpacer: {
    width: 40,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    maxWidth: SCREEN_WIDTH * 0.75,
    minWidth: 80,
  },
  messageText: {
    marginBottom: 4,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  messageTime: {
    fontSize: 10,
  },

  // Image Message
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 4,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: 200,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  // Voice Message
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 160,
  },
  voicePlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  voiceContent: {
    flex: 1,
  },
  voiceWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    gap: 2,
    marginBottom: 4,
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
  },

  // File Message
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 220,
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  fileInfo: {
    flex: 1,
  },

  // Reactions
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
    justifyContent: 'flex-end',
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
  },
  reactionEmoji: {
    fontSize: 12,
  },

  // Typing Indicator
  typingContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
    marginLeft: 40,
    marginBottom: 16,
  },
  typingBubble: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Context Menu
  contextMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  contextMenu: {
    position: 'absolute',
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    paddingVertical: 4,
  },
  contextMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  contextMenuText: {
    fontWeight: '500',
  },

  // Reaction Picker
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionPicker: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 32,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  reactionPickerItem: {
    padding: 4,
  },
  reactionPickerEmoji: {
    fontSize: 24,
  },

  // Avatar Gradient
  avatarGradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Recording UI
  recordingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 24,
    marginLeft: 12,
  },
  recordingPulse: {
    position: 'absolute',
    left: 16,
    width: 12,
    height: 12,
    borderRadius: 6,
    opacity: 0.5,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  recordingTime: {
    flex: 1,
    fontWeight: '600',
  },
  recordingHint: {
    opacity: 0.8,
  },
});

export default ChatDetailScreen;
