import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStudent } from '../context/StudentContext';
import { useTheme } from '../context/ThemeContext';
import { Card, Loading, EmptyState } from '../components';
import { formatDate } from '../utils/helpers';
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  ChevronRight,
} from 'lucide-react-native';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#f59e0b' },
  submitted: { label: 'Submitted', color: '#3b82f6' },
  graded: { label: 'Graded', color: '#22c55e' },
  overdue: { label: 'Overdue', color: '#ef4444' },
};

const HomeworkScreen = ({ navigation }) => {
  const { homework, loading, errors, fetchHomework } = useStudent();
  const { themeColors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('active');

  useEffect(() => {
    fetchHomework();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHomework();
    setRefreshing(false);
  };

  const getStatusInfo = (item) => {
    if (item.isOverdue && item.submissionStatus === 'pending') {
      return STATUS_CONFIG.overdue;
    }
    return STATUS_CONFIG[item.submissionStatus] || STATUS_CONFIG.pending;
  };

  const getStatusIcon = (item) => {
    const status = item.isOverdue && item.submissionStatus === 'pending'
      ? 'overdue'
      : item.submissionStatus;

    switch (status) {
      case 'graded':
        return CheckCircle;
      case 'submitted':
        return Clock;
      case 'overdue':
        return AlertTriangle;
      default:
        return FileText;
    }
  };

  const activeHomework = (homework || []).filter(
    (hw) => !hw.isOverdue && hw.submissionStatus === 'pending'
  );
  const completedHomework = (homework || []).filter(
    (hw) => hw.submissionStatus === 'submitted' || hw.submissionStatus === 'graded'
  );
  const overdueHomework = (homework || []).filter(
    (hw) => hw.isOverdue && hw.submissionStatus === 'pending'
  );

  const displayList =
    selectedTab === 'active'
      ? [...overdueHomework, ...activeHomework]
      : completedHomework;

  const HomeworkCard = ({ item }) => {
    const statusInfo = getStatusInfo(item);
    const StatusIcon = getStatusIcon(item);
    const dueDate = item.dueDate ? new Date(item.dueDate) : null;
    const isUpcoming = dueDate && dueDate > new Date();
    const daysUntilDue = dueDate
      ? Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24))
      : null;

    return (
      <Card style={styles.homeworkCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View
              style={[
                styles.subjectBadge,
                { backgroundColor: themeColors.backgroundSecondary },
              ]}
            >
              <BookOpen size={14} color={themeColors.text} />
              <Text style={[styles.subjectText, { color: themeColors.text }]}>
                {item.subject}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusInfo.color + '20' },
            ]}
          >
            <StatusIcon size={14} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <Text style={[styles.homeworkTitle, { color: themeColors.text }]}>
          {item.title}
        </Text>

        {item.description ? (
          <Text
            style={[styles.homeworkDescription, { color: themeColors.textSecondary }]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        ) : null}

        <View style={styles.cardFooter}>
          <View style={styles.dateInfo}>
            <Calendar size={14} color={themeColors.textSecondary} />
            <Text style={[styles.dateText, { color: themeColors.textSecondary }]}>
              Due: {formatDate(item.dueDate)}
            </Text>
          </View>

          {daysUntilDue !== null && item.submissionStatus === 'pending' && !item.isOverdue && (
            <Text style={[styles.daysText, { color: themeColors.textTertiary }]}>
              {daysUntilDue === 0
                ? 'Due today'
                : daysUntilDue === 1
                  ? '1 day left'
                  : `${daysUntilDue} days left`}
            </Text>
          )}

          {item.submission?.marks != null && (
            <View style={styles.marksContainer}>
              <Text style={[styles.marksText, { color: themeColors.text }]}>
                Marks: {item.submission.marks}
              </Text>
            </View>
          )}
        </View>

        {item.submission?.feedback ? (
          <View
            style={[
              styles.feedbackContainer,
              { borderTopColor: themeColors.border || '#e5e5e5' },
            ]}
          >
            <Text style={[styles.feedbackLabel, { color: themeColors.textSecondary }]}>
              Teacher Feedback:
            </Text>
            <Text
              style={[styles.feedbackText, { color: themeColors.text }]}
              numberOfLines={3}
            >
              {item.submission.feedback}
            </Text>
          </View>
        ) : null}
      </Card>
    );
  };

  if (loading.homework && !homework) {
    return <Loading fullScreen message="Loading homework..." />;
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={['left', 'right']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          {/* Tab Selector */}
          <View
            style={[
              styles.tabContainer,
              { backgroundColor: themeColors.backgroundSecondary },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.tab,
                selectedTab === 'active' && { backgroundColor: themeColors.surface },
              ]}
              onPress={() => setSelectedTab('active')}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      selectedTab === 'active'
                        ? themeColors.text
                        : themeColors.textSecondary,
                  },
                ]}
              >
                Active ({activeHomework.length + overdueHomework.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                selectedTab === 'completed' && { backgroundColor: themeColors.surface },
              ]}
              onPress={() => setSelectedTab('completed')}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      selectedTab === 'completed'
                        ? themeColors.text
                        : themeColors.textSecondary,
                  },
                ]}
              >
                Completed ({completedHomework.length})
              </Text>
            </TouchableOpacity>
          </View>

          {errors?.homework ? (
            <Card style={styles.errorCard}>
              <Text style={[styles.errorText, { color: themeColors.error || '#ef4444' }]}>
                {errors.homework}
              </Text>
            </Card>
          ) : null}

          {displayList.length > 0 ? (
            displayList.map((item) => (
              <HomeworkCard key={item._id} item={item} />
            ))
          ) : (
            <EmptyState
              title={
                selectedTab === 'active'
                  ? 'No Active Homework'
                  : 'No Completed Homework'
              }
              message={
                selectedTab === 'active'
                  ? 'There are no pending homework assignments right now.'
                  : 'Completed homework will appear here once submitted or graded.'
              }
              icon={<BookOpen size={48} color={themeColors.textTertiary} />}
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
  content: {
    padding: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  homeworkCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  subjectText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  homeworkTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  homeworkDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 13,
  },
  daysText: {
    fontSize: 12,
    fontWeight: '500',
  },
  marksContainer: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  marksText: {
    fontSize: 13,
    fontWeight: '600',
  },
  feedbackContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  feedbackLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 13,
    lineHeight: 18,
  },
  errorCard: {
    marginBottom: 12,
    padding: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default HomeworkScreen;
