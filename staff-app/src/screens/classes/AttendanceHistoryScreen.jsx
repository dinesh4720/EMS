import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Share,
  Pressable
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Calendar as CalendarIcon, ChevronDown, Upload, BarChart2, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useClassContext } from '../../context/ClassContext';
import { useTranslation } from 'react-i18next';

const VIEW_MODES = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

const AttendanceHistoryScreen = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { colors, typography, spacing, shape } = theme;
  const { classId, className } = route.params || {};

  const {
    attendanceHistory,
    loading,
    error,
    fetchAttendanceHistory,
  } = useClassContext();

  const [viewMode, setViewMode] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
    loadHistory();
  }, [classId, viewMode, selectedDate]);

  const loadHistory = async () => {
    if (!classId) return;

    let startDate, endDate;

    if (viewMode === 'daily') {
      startDate = selectedDate;
      endDate = selectedDate;
    } else if (viewMode === 'weekly') {
      const date = new Date(selectedDate);
      const day = date.getDay();
      startDate = new Date(date);
      startDate.setDate(date.getDate() - day);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      startDate = startDate.toISOString().split('T')[0];
      endDate = endDate.toISOString().split('T')[0];
    } else {
      const date = new Date(selectedDate);
      startDate = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
      endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
    }

    await fetchAttendanceHistory(classId, startDate, endDate);
  };

  useEffect(() => {
    // Process history data
    if (attendanceHistory && attendanceHistory.length > 0) {
      setHistoryData(processHistoryData(attendanceHistory));
    } else {
      setHistoryData([]);
    }
  }, [attendanceHistory]);

  const processHistoryData = (data) => {
    // Group by date and calculate summary
    const grouped = {};

    data.forEach(record => {
      const date = record.date;
      if (!grouped[date]) {
        grouped[date] = {
          date,
          records: [],
          summary: { present: 0, absent: 0, late: 0, leave: 0, halfday: 0, total: 0 },
        };
      }

      grouped[date].records.push(record);
      grouped[date].summary.total++;

      if (record.status === 'present') grouped[date].summary.present++;
      else if (record.status === 'absent') grouped[date].summary.absent++;
      else if (record.status === 'late') grouped[date].summary.late++;
      else if (record.status === 'leave') grouped[date].summary.leave++;
      else if (record.status === 'halfday') grouped[date].summary.halfday++;
    });

    return Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const handleViewModeChange = (mode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewMode(mode);
  };

  const handleExport = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Generate CSV content
      let csvContent = 'Date,Student Name,Status,Remarks\n';

      historyData.forEach(day => {
        day.records.forEach(record => {
          csvContent += `${day.date},${record.studentName || 'Unknown'},${record.status},${record.remarks || ''}\n`;
        });
      });

      await Share.share({
        message: csvContent,
        title: `Attendance Report - ${className || 'Class'}`,
      });
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const renderDayItem = ({ item }) => {
    const percentage = item.summary.total > 0
      ? Math.round(((item.summary.present + item.summary.late + item.summary.excused) / item.summary.total) * 100)
      : 0;

    // Determine status color based on percentage
    const getStatusColor = () => {
      if (percentage >= 90) return colors.primary;
      if (percentage >= 75) return colors.tertiary;
      return colors.error;
    };

    const statusColor = getStatusColor();

    return (
      <View style={[styles.dayCard, { backgroundColor: colors.surfaceContainer, borderRadius: shape.cornerLarge }]}>
        <View style={[styles.dayHeader, { marginBottom: spacing.md }]}>
          <View>
            <Text style={[typography.titleMedium, { color: colors.onSurface }]}>
              {new Date(item.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
              {item.summary.total} students
            </Text>
          </View>
          <View style={[styles.percentageBadge, { backgroundColor: statusColor + '15', borderRadius: shape.pill }]}>
            <Text style={[typography.labelMedium, { color: statusColor, fontWeight: '700' }]}>
              {percentage}%
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={[styles.progressBar, { backgroundColor: colors.surfaceContainerHighest, borderRadius: shape.pill }]}>
          {item.summary.present > 0 && (
            <View style={[styles.progressSegment, { flex: item.summary.present, backgroundColor: colors.primary }]} />
          )}
          {item.summary.late > 0 && (
            <View style={[styles.progressSegment, { flex: item.summary.late, backgroundColor: colors.tertiary }]} />
          )}
          {item.summary.excused > 0 && (
            <View style={[styles.progressSegment, { flex: item.summary.excused, backgroundColor: colors.secondary }]} />
          )}
          {item.summary.absent > 0 && (
            <View style={[styles.progressSegment, { flex: item.summary.absent, backgroundColor: colors.error }]} />
          )}
        </View>

        {/* Stats */}
        <View style={styles.dayStats}>
          <View style={styles.dayStatItem}>
            <View style={[styles.statDot, { backgroundColor: colors.primary }]} />
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>{item.summary.present}</Text>
          </View>
          <View style={styles.dayStatItem}>
            <View style={[styles.statDot, { backgroundColor: colors.error }]} />
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>{item.summary.absent}</Text>
          </View>
          <View style={styles.dayStatItem}>
            <View style={[styles.statDot, { backgroundColor: colors.tertiary }]} />
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>{item.summary.late}</Text>
          </View>
          <View style={styles.dayStatItem}>
            <View style={[styles.statDot, { backgroundColor: colors.secondary }]} />
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>{item.summary.excused}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <ChevronRight size={24} color={colors.onSurface} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', marginRight: 28 }}>
          <Text style={[typography.titleLarge, { color: colors.onSurface, textAlign: 'center' }]}>
            Attendance History
          </Text>
        </View>
      </View>

      {/* View Mode Selector */}
      <View style={[styles.viewModeSelector, { backgroundColor: colors.surfaceContainerHigh, borderRadius: shape.pill }]}>
        {VIEW_MODES.map(mode => (
          <Pressable
            key={mode.id}
            style={({ pressed }) => [
              styles.viewModeButton,
              { borderRadius: shape.pill },
              viewMode === mode.id && { backgroundColor: colors.primary },
            ]}
            onPress={() => handleViewModeChange(mode.id)}
          >
            <Text
              style={[
                typography.labelMedium,
                { color: viewMode === mode.id ? colors.onPrimary : colors.onSurfaceVariant },
              ]}
            >
              {mode.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Date Selector */}
      <Pressable
        style={({ pressed }) => [
          styles.dateSelector,
          {
            backgroundColor: pressed ? colors.surfaceContainerHigh : colors.surfaceContainer,
            borderRadius: shape.cornerMedium
          }
        ]}
        onPress={() => setShowDatePicker(!showDatePicker)}
      >
        <CalendarIcon size={20} color={colors.primary} style={{ marginRight: spacing.sm }} />
        <Text style={[typography.labelLarge, { color: colors.onSurface, flex: 1 }]}>
          {viewMode === 'daily' && selectedDate}
          {viewMode === 'weekly' && `Week of ${selectedDate}`}
          {viewMode === 'monthly' && new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
        <ChevronDown size={20} color={colors.onSurfaceVariant} />
      </Pressable>

      {/* Export Button */}
      {!showDatePicker && (
        <TouchableOpacity
          style={[styles.exportButton, { backgroundColor: colors.secondaryContainer, borderRadius: shape.pill }]}
          onPress={handleExport}
        >
          <Upload size={18} color={colors.onSecondaryContainer} style={{ marginRight: spacing.sm }} />
          <Text style={[typography.labelLarge, { color: colors.onSecondaryContainer }]}>{t('screens.exportReport')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <BarChart2 size={64} color={colors.outline} style={{ marginBottom: spacing.md }} />
      <Text style={[typography.titleMedium, { color: colors.onSurface, marginBottom: spacing.sm }]}>{t('screens.noAttendanceRecords')}</Text>
      <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
        {viewMode === 'daily'
          ? 'No attendance was recorded for this date.'
          : `No attendance records found for this ${viewMode.slice(0, -2)}.`}
      </Text>
    </View>
  );

  if (loading && historyData.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: spacing.sm }]}>{t('screens.loadingHistory')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.surface }]}>
      <FlatList
        data={historyData}
        keyExtractor={(item) => item.date}
        renderItem={renderDayItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 16,
  },
  viewModeSelector: {
    flexDirection: 'row',
    padding: 4,
    marginBottom: 16,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  datePickerContainer: {
    marginBottom: 16,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  dayCard: {
    padding: 16,
    marginBottom: 12,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  percentageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  progressBar: {
    flexDirection: 'row',
    height: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressSegment: {
    height: '100%',
  },
  dayStats: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  dayStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
});

export default AttendanceHistoryScreen;
