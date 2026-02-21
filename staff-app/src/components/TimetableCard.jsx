import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';

const TimetableCard = ({
  item,
  index,
  onPress,
  isCurrent = false,
  isCompleted = false,
}) => {
  const { colors, typography, spacing, shape } = useTheme();
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    const animDelay = index * 80;
    scale.value = withDelay(animDelay, withSpring(1, { damping: 15, stiffness: 150 }));
    opacity.value = withDelay(animDelay, withSpring(1));
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(item);
  };

  const getStatusColor = () => {
    if (isCompleted) return colors.success;
    if (isCurrent) return colors.primary;
    return colors.onSurfaceVariant;
  };

  const getSubjectColor = (subject) => {
    const colorMap = {
      'Mathematics': colors.primary,
      'Physics': colors.secondary,
      'Chemistry': colors.tertiary,
      'English': colors.error,
      'Biology': colors.success,
      'History': colors.warning,
      'Computer Science': colors.info,
    };
    return colorMap[subject] || colors.onSurfaceVariant;
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={({ pressed }) => [
          styles.container,
          { 
            backgroundColor: isCurrent ? colors.primaryContainer : colors.surfaceContainer,
            borderRadius: shape.cornerLarge,
            marginHorizontal: spacing.md,
            padding: spacing.md,
            borderColor: isCurrent ? colors.primary : colors.outlineVariant,
            borderWidth: isCurrent ? 2 : 0,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
        onPress={handlePress}
      >
        {/* Time Column */}
        <View style={styles.timeColumn}>
          <Text style={[typography.labelLarge, { color: isCurrent ? colors.onPrimaryContainer : colors.onSurface }]}>{item.startTime}</Text>
          <View style={[styles.timeDivider, { backgroundColor: isCurrent ? colors.onPrimaryContainer + '40' : colors.outlineVariant }]} />
          <Text style={[typography.labelLarge, { color: isCurrent ? colors.onPrimaryContainer : colors.onSurface }]}>{item.endTime}</Text>
        </View>

        {/* Status Indicator */}
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: getStatusColor(), borderRadius: shape.pill },
          ]}
        />

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View
              style={[
                styles.subjectBadge,
                { backgroundColor: getSubjectColor(item.subject) + '20', borderRadius: shape.pill },
              ]}
            >
              <View
                style={[
                  styles.subjectDot,
                  { backgroundColor: getSubjectColor(item.subject), borderRadius: shape.pill },
                ]}
              />
              <Text
                style={[
                  typography.labelMedium,
                  { color: getSubjectColor(item.subject) },
                ]}
              >
                {item.subject}
              </Text>
            </View>
            {isCurrent && (
              <View style={[styles.currentBadge, { backgroundColor: colors.primary, borderRadius: shape.cornerSmall }]}>
                <Text style={[typography.labelSmall, { color: colors.onPrimary }]}>NOW</Text>
              </View>
            )}
          </View>

          <Text style={[typography.titleLarge, { color: isCurrent ? colors.onPrimaryContainer : colors.onSurface, marginBottom: spacing.xs }]}>
            {item.topic}
          </Text>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>📍</Text>
              <Text style={[typography.bodyMedium, { color: isCurrent ? colors.onPrimaryContainer : colors.onSurfaceVariant }]}>{item.room}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>👥</Text>
              <Text style={[typography.bodyMedium, { color: isCurrent ? colors.onPrimaryContainer : colors.onSurfaceVariant }]}>
                {item.class} • {item.students} students
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  timeColumn: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeDivider: {
    width: 2,
    height: 12,
    marginVertical: 4,
  },
  statusIndicator: {
    width: 4,
    marginHorizontal: 12,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  subjectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  subjectDot: {
    width: 8,
    height: 8,
    marginRight: 6,
  },
  currentBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 4,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 4,
  },
});

export default TimetableCard;
