import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  FileText,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { homeworkApi } from '../services/api';

const STATUS_CONFIG = {
  active: { label: 'Active', color: '#3b82f6', Icon: Clock },
  completed: { label: 'Completed', color: '#22c55e', Icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: '#6b7280', Icon: XCircle },
};

const HomeworkCard = ({ item, theme }) => {
  const { colors, typography, shape } = theme;
  const statusInfo = STATUS_CONFIG[item.status] || STATUS_CONFIG.active;
  const StatusIcon = statusInfo.Icon;
  const dueDate = item.dueDate ? new Date(item.dueDate) : null;
  const isPastDue = dueDate && dueDate < new Date() && item.status === 'active';
  const submissionCount = item.submissions?.length || 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.homeworkCard,
        {
          backgroundColor: pressed
            ? colors.surfaceContainerHigh
            : colors.surfaceContainer,
          borderRadius: shape.cornerLarge,
          borderColor: isPastDue ? colors.error + '40' : colors.outlineVariant,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.subjectContainer}>
          <BookOpen size={18} color={colors.primary} />
          <Text
            style={[
              typography.titleMedium,
              { color: colors.onSurface, marginLeft: 8, flex: 1 },
            ]}
            numberOfLines={1}
          >
            {item.subject}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusInfo.color + '20' },
          ]}
        >
          <StatusIcon size={14} color={statusInfo.color} />
          <Text
            style={[
              typography.labelSmall,
              {
                color: statusInfo.color,
                marginLeft: 4,
                textTransform: 'capitalize',
              },
            ]}
          >
            {isPastDue ? 'Past Due' : statusInfo.label}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text
        style={[
          typography.titleSmall,
          { color: colors.onSurface, marginBottom: 8 },
        ]}
        numberOfLines={2}
      >
        {item.title}
      </Text>

      {/* Class & Due Date */}
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <FileText size={14} color={colors.onSurfaceVariant} />
          <Text
            style={[
              typography.bodySmall,
              { color: colors.onSurfaceVariant, marginLeft: 6 },
            ]}
          >
            {item.classId?.name || 'Class'}
            {item.classId?.section ? ` - ${item.classId.section}` : ''}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Calendar size={14} color={colors.onSurfaceVariant} />
          <Text
            style={[
              typography.bodySmall,
              {
                color: isPastDue ? colors.error : colors.onSurfaceVariant,
                marginLeft: 6,
              },
            ]}
          >
            Due: {formatDate(item.dueDate)}
          </Text>
        </View>
      </View>

      {/* Submissions count */}
      <View
        style={[
          styles.submissionsRow,
          { borderTopColor: colors.outlineVariant },
        ]}
      >
        <View style={styles.detailItem}>
          <Users size={14} color={colors.onSurfaceVariant} />
          <Text
            style={[
              typography.bodySmall,
              { color: colors.onSurfaceVariant, marginLeft: 6 },
            ]}
          >
            {submissionCount} submission{submissionCount !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const HomeworkScreen = () => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { colors, typography, spacing, shape } = theme;
  const { user } = useAuth();

  const [homeworkList, setHomeworkList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setError('User not found');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const params = {};
      if (selectedFilter !== 'all') {
        params.status = selectedFilter;
      }
      const data = await homeworkApi.getTeacherHomework(user.id, params);
      setHomeworkList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching homework:', err);
      setError(err.message || 'Failed to load homework');
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'completed', label: 'Completed' },
  ];

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Filter chips */}
      <View style={styles.filtersContainer}>
        {FILTERS.map((filter) => (
          <Pressable
            key={filter.id}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedFilter === filter.id
                    ? colors.primaryContainer
                    : colors.surfaceContainer,
                borderColor:
                  selectedFilter === filter.id ? colors.primary : colors.outline,
                borderRadius: shape.pill,
              },
            ]}
            onPress={() => {
              setSelectedFilter(filter.id);
              setLoading(true);
            }}
          >
            <Text
              style={[
                typography.labelMedium,
                {
                  color:
                    selectedFilter === filter.id
                      ? colors.onPrimaryContainer
                      : colors.onSurfaceVariant,
                },
              ]}
            >
              {filter.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Summary */}
      <View
        style={[
          styles.summaryContainer,
          {
            backgroundColor: colors.surfaceContainer,
            borderRadius: shape.cornerLarge,
          },
        ]}
      >
        <View style={styles.summaryItem}>
          <Text style={[typography.headlineSmall, { color: colors.primary }]}>
            {homeworkList.length}
          </Text>
          <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
            Total
          </Text>
        </View>
        <View
          style={[styles.summaryDivider, { backgroundColor: colors.outlineVariant }]}
        />
        <View style={styles.summaryItem}>
          <Text style={[typography.headlineSmall, { color: '#3b82f6' }]}>
            {homeworkList.filter((h) => h.status === 'active').length}
          </Text>
          <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
            Active
          </Text>
        </View>
        <View
          style={[styles.summaryDivider, { backgroundColor: colors.outlineVariant }]}
        />
        <View style={styles.summaryItem}>
          <Text style={[typography.headlineSmall, { color: '#22c55e' }]}>
            {homeworkList.filter((h) => h.status === 'completed').length}
          </Text>
          <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
            Completed
          </Text>
        </View>
      </View>

      <Text
        style={[
          typography.titleMedium,
          {
            color: colors.onSurface,
            marginTop: spacing.md,
            marginBottom: spacing.sm,
          },
        ]}
      >
        Homework Assignments
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <BookOpen size={64} color={colors.outline} />
      <Text
        style={[
          typography.titleLarge,
          { color: colors.onSurface, marginTop: spacing.md },
        ]}
      >
        No Homework
      </Text>
      <Text
        style={[
          typography.bodyMedium,
          {
            color: colors.onSurfaceVariant,
            textAlign: 'center',
            marginTop: spacing.sm,
          },
        ]}
      >
        Homework assignments you create will appear here.
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, backgroundColor: colors.surface },
        ]}
      >
        <View
          style={[
            styles.titleBar,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.outlineVariant,
            },
          ]}
        >
          <Text style={[typography.headlineMedium, { color: colors.onSurface }]}>
            Homework
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={[
              typography.bodyMedium,
              { color: colors.onSurfaceVariant, marginTop: spacing.sm },
            ]}
          >
            Loading...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: colors.surface },
      ]}
    >
      <View
        style={[
          styles.titleBar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.outlineVariant,
          },
        ]}
      >
        <Text style={[typography.headlineMedium, { color: colors.onSurface }]}>
          Homework
        </Text>
      </View>

      {error && (
        <View
          style={[styles.errorBanner, { backgroundColor: colors.errorContainer }]}
        >
          <Text
            style={[typography.labelMedium, { color: colors.onErrorContainer }]}
          >
            {error}
          </Text>
        </View>
      )}

      <FlatList
        data={homeworkList}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <HomeworkCard item={item} theme={theme} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[styles.listContent, { padding: spacing.md }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },
  header: {
    marginBottom: 8,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 4,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 32,
  },
  homeworkCard: {
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submissionsRow: {
    paddingTop: 10,
    borderTopWidth: 1,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  errorBanner: {
    padding: 12,
    alignItems: 'center',
  },
});

export default HomeworkScreen;
