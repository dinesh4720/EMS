import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  TextInput,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  BookOpen,
  Users,
  MapPin,
  ClipboardList,
  History,
  Search,
  AlertTriangle,
  ChevronRight,
  Filter,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useClassContext } from '../context/ClassContext';
import { useTranslation } from 'react-i18next';

const ClassCard = ({ classItem, onPress, onActionPress, theme }) => {
  const { t } = useTranslation();
  const { colors, typography, shape, spacing } = theme;
  const attendancePercentage = classItem.attendancePercentage ?? null;

  // Dynamic status color based on percentage
  const getStatusColor = () => {
    if (attendancePercentage == null) return colors.textSecondary;
    if (attendancePercentage >= 90) return colors.primary;
    if (attendancePercentage >= 75) return colors.tertiary;
    return colors.error;
  };

  const statusColor = getStatusColor();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.classCard,
        {
          backgroundColor: pressed ? colors.surfaceContainerHigh : colors.surfaceContainer,
          borderRadius: shape.cornerLarge,
          borderColor: colors.outlineVariant,
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.classHeader}>
        <View
          style={[
            styles.classIconContainer,
            { backgroundColor: colors.secondaryContainer, borderRadius: shape.cornerMedium }
          ]}
        >
          <BookOpen size={24} color={colors.onSecondaryContainer} />
        </View>
        <View style={styles.classInfo}>
          <Text style={[typography.titleMedium, { color: colors.onSurface }]}>
            {classItem.name || classItem.id}
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>
            {classItem.subject || classItem.department || 'General'}
          </Text>
        </View>
        <View style={[styles.attendanceBadge, { backgroundColor: statusColor + '15' }]}>
          <Text style={[typography.labelMedium, { color: statusColor, fontWeight: '700' }]}>
            {attendancePercentage != null ? `${attendancePercentage}%` : 'N/A'}
          </Text>
        </View>
      </View>

      <View style={[styles.classDetails, { borderBottomColor: colors.outlineVariant }]}>
        <View style={styles.detailItem}>
          <Users size={16} color={colors.onSurfaceVariant} style={{ marginRight: spacing.xs }} />
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>
            {classItem.studentCount || classItem.students || 0} Students
          </Text>
        </View>
        {classItem.room && (
          <View style={styles.detailItem}>
            <MapPin size={16} color={colors.onSurfaceVariant} style={{ marginRight: spacing.xs }} />
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>
              {classItem.room}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardActions}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: pressed ? colors.surfaceContainerHighest : 'transparent',
              borderColor: colors.outline,
              borderRadius: shape.cornerMedium,
            }
          ]}
          onPress={() => onActionPress('attendance')}
        >
          <ClipboardList size={18} color={colors.primary} style={{ marginRight: spacing.xs }} />
          <Text style={[typography.labelLarge, { color: colors.primary, marginLeft: spacing.xs }]}>{t('screens.attendance1')}</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: pressed ? colors.surfaceContainerHighest : 'transparent',
              borderColor: colors.outline,
              borderRadius: shape.cornerMedium,
            }
          ]}
          onPress={() => onActionPress('students')}
        >
          <Users size={18} color={colors.primary} style={{ marginRight: spacing.xs }} />
          <Text style={[typography.labelLarge, { color: colors.primary, marginLeft: spacing.xs }]}>{t('screens.students1')}</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: pressed ? colors.surfaceContainerHighest : 'transparent',
              borderColor: colors.outline,
              borderRadius: shape.cornerMedium,
            }
          ]}
          onPress={() => onActionPress('history')}
        >
          <History size={18} color={colors.primary} style={{ marginRight: spacing.xs }} />
          <Text style={[typography.labelLarge, { color: colors.primary, marginLeft: spacing.xs }]}>{t('screens.history')}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

const ClassesScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const theme = useTheme();
  const { colors, typography, spacing, shape } = theme;

  const {
    classes,
    loading,
    error,
    fetchClasses,
    setSelectedClass,
    offlineQueue,
  } = useClassContext();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchClasses();
    }, [])
  );

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await fetchClasses();
    setRefreshing(false);
  };

  const handleClassPress = (classItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedClass(classItem);
    navigation.navigate('ClassDetail', {
      classId: classItem.id || classItem.name,
      className: classItem.name || classItem.id,
      classData: classItem,
    });
  };

  const handleActionPress = (classItem, action) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const classId = classItem.id || classItem.name;
    const className = classItem.name || classItem.id;

    switch (action) {
      case 'attendance':
        navigation.navigate('Attendance', { classId, className });
        break;
      case 'students':
        navigation.navigate('ClassStudents', { classId, className });
        break;
      case 'history':
        navigation.navigate('AttendanceHistory', { classId, className });
        break;
    }
  };

  // Calculate total stats
  const totalClasses = classes.length;
  const totalStudents = classes.reduce(
    (sum, c) => sum + (c.studentCount || c.students || 0),
    0
  );
  const uniqueSubjects = new Set(
    classes.map(c => c.subject || c.department).filter(Boolean)
  ).size;

  const filteredClasses = classes.filter(c => {
    const query = searchQuery.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(query)) ||
      (c.subject && c.subject.toLowerCase().includes(query))
    );
  });

  if (loading && classes.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.surface }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
          <Text style={[typography.headlineMedium, { color: colors.onSurface }]}>{t('screens.myClasses1')}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[typography.bodyLarge, { color: colors.onSurfaceVariant, marginTop: spacing.sm }]}>
            Loading classes...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.surface }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.md }]}>
        <Text style={[typography.headlineMedium, { color: colors.onSurface }]}>{t('screens.myClasses1')}</Text>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surfaceContainerHigh,
              borderRadius: shape.pill,
              marginTop: spacing.sm
            }
          ]}
        >
          <Search size={20} color={colors.onSurfaceVariant} style={{ marginLeft: spacing.sm }} />
          <TextInput
            style={[styles.searchInput, typography.bodyLarge, { color: colors.onSurface }]}
            placeholder={t('screens.searchClasses')}
            placeholderTextColor={colors.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Stats */}
      <View style={[styles.statsContainer, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
        <View style={styles.statItem}>
          <Text style={[typography.headlineMedium, { color: colors.primary }]}>{totalClasses}</Text>
          <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>{t('screens.classes')}</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
        <View style={styles.statItem}>
          <Text style={[typography.headlineMedium, { color: colors.primary }]}>{totalStudents}</Text>
          <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>{t('screens.students1')}</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
        <View style={styles.statItem}>
          <Text style={[typography.headlineMedium, { color: colors.primary }]}>{uniqueSubjects}</Text>
          <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>{t('screens.subjects')}</Text>
        </View>
      </View>

      {/* Offline Queue Indicator */}
      {offlineQueue.length > 0 && (
        <View style={[styles.offlineBanner, { backgroundColor: colors.tertiaryContainer }]}>
          <AlertTriangle size={16} color={colors.onTertiaryContainer} style={{ marginRight: spacing.sm }} />
          <Text style={[typography.labelMedium, { color: colors.onTertiaryContainer }]}>
            {offlineQueue.length} attendance record(s) pending sync
          </Text>
        </View>
      )}

      {/* Error Banner */}
      {error && (
        <View style={[styles.errorBanner, { backgroundColor: colors.errorContainer }]}>
          <AlertTriangle size={16} color={colors.onErrorContainer} style={{ marginRight: spacing.sm }} />
          <Text style={[typography.labelMedium, { color: colors.onErrorContainer }]}>{error}</Text>
        </View>
      )}

      {/* Class List */}
      <ScrollView
        style={styles.classList}
        contentContainerStyle={[styles.classListContent, { padding: spacing.md }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {filteredClasses.length > 0 ? (
          filteredClasses.map((classItem) => (
            <ClassCard
              key={classItem.id || classItem.name}
              classItem={classItem}
              onPress={() => handleClassPress(classItem)}
              onActionPress={(action) => handleActionPress(classItem, action)}
              theme={theme}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <View style={{ marginBottom: spacing.md, opacity: 0.5 }}>
              <BookOpen size={64} color={colors.onSurfaceVariant} />
            </View>

            <Text style={[typography.titleLarge, { color: colors.onSurface, marginBottom: spacing.sm }]}>
              {searchQuery ? 'No classes match your search' : 'No Classes Assigned'}
            </Text>
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
              {searchQuery
                ? 'Try adjusting your search terms'
                : "You haven't been assigned to any classes yet. Contact your administrator."}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    height: '100%',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  classList: {
    flex: 1,
  },
  classListContent: {
    paddingBottom: 100,
  },
  classCard: {
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 0,
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  classIconContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  classInfo: {
    flex: 1,
  },
  attendanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  classDetails: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderWidth: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
});

export default ClassesScreen;
