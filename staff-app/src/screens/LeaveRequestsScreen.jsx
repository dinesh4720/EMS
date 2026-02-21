import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Calendar,
  Plus,
  X,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { leavesApi } from '../services/api';

const LEAVE_TYPES = [
  { id: 'sick', label: 'Sick Leave' },
  { id: 'casual', label: 'Casual Leave' },
  { id: 'earned', label: 'Earned Leave' },
  { id: 'unpaid', label: 'Unpaid Leave' },
];

const LeaveCard = ({ leave, onPress, onCancel, theme }) => {
  const { colors, typography, shape } = theme;

  const getStatusIcon = () => {
    switch (leave.status) {
      case 'approved':
        return <CheckCircle size={18} color={colors.success} />;
      case 'rejected':
        return <XCircle size={18} color={colors.error} />;
      case 'cancelled':
        return <XCircle size={18} color={colors.onSurfaceVariant} />;
      default:
        return <AlertCircle size={18} color={colors.warning} />;
    }
  };

  const getStatusColor = () => {
    switch (leave.status) {
      case 'approved':
        return colors.success;
      case 'rejected':
        return colors.error;
      case 'cancelled':
        return colors.onSurfaceVariant;
      default:
        return colors.warning;
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const statusColor = getStatusColor();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.leaveCard,
        {
          backgroundColor: pressed ? colors.surfaceContainerHigh : colors.surfaceContainer,
          borderRadius: shape.cornerLarge,
          borderColor: colors.outlineVariant,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.leaveHeader}>
        <View style={styles.leaveTypeContainer}>
          <FileText size={18} color={colors.primary} />
          <Text style={[typography.titleMedium, { color: colors.onSurface, marginLeft: 8 }]}>
            {leave.leaveType?.charAt(0).toUpperCase() + leave.leaveType?.slice(1)} Leave
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          {getStatusIcon()}
          <Text style={[typography.labelSmall, { color: statusColor, marginLeft: 4, textTransform: 'capitalize' }]}>
            {leave.status}
          </Text>
        </View>
      </View>

      <View style={styles.leaveDetails}>
        <View style={styles.dateRow}>
          <Calendar size={16} color={colors.onSurfaceVariant} />
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginLeft: 8 }]}>
            {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
          </Text>
        </View>
        <View style={styles.daysRow}>
          <Clock size={16} color={colors.onSurfaceVariant} />
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginLeft: 8 }]}>
            {leave.days} day(s)
          </Text>
        </View>
      </View>

      {leave.reason && (
        <View style={[styles.reasonContainer, { borderTopColor: colors.outlineVariant }]}>
          <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
            {leave.reason}
          </Text>
        </View>
      )}

      {leave.status === 'pending' && (
        <View style={styles.cardActions}>
          <Pressable
            style={[styles.cancelBtn, { backgroundColor: colors.errorContainer, borderRadius: shape.cornerSmall }]}
            onPress={onCancel}
          >
            <Text style={[typography.labelMedium, { color: colors.onErrorContainer }]}>Cancel Request</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
};

const NewLeaveModal = ({ visible, onClose, onSubmit, theme }) => {
  const { colors, typography, shape, spacing } = theme;

  const [leaveType, setLeaveType] = useState('sick');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!startDate || !endDate || !reason.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        leaveType,
        startDate,
        endDate,
        reason: reason.trim(),
      });
      // Reset form
      setLeaveType('sick');
      setStartDate('');
      setEndDate('');
      setReason('');
      onClose();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface, borderRadius: shape.cornerLarge }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.outlineVariant }]}>
            <Text style={[typography.titleLarge, { color: colors.onSurface }]}>Apply for Leave</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Leave Type */}
            <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginBottom: spacing.sm }]}>
              Leave Type
            </Text>
            <View style={styles.leaveTypesContainer}>
              {LEAVE_TYPES.map((type) => (
                <Pressable
                  key={type.id}
                  style={({ pressed }) => [
                    styles.leaveTypeChip,
                    {
                      backgroundColor: leaveType === type.id ? colors.primaryContainer : colors.surfaceContainer,
                      borderColor: leaveType === type.id ? colors.primary : colors.outline,
                      borderRadius: shape.pill,
                    },
                  ]}
                  onPress={() => setLeaveType(type.id)}
                >
                  <Text style={[
                    typography.labelMedium,
                    { color: leaveType === type.id ? colors.onPrimaryContainer : colors.onSurfaceVariant }
                  ]}>
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Dates */}
            <View style={styles.dateInputsContainer}>
              <View style={styles.dateInputWrapper}>
                <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginBottom: spacing.xs }]}>
                  Start Date
                </Text>
                <TextInput
                  style={[styles.dateInput, { backgroundColor: colors.surfaceContainer, color: colors.onSurface, borderRadius: shape.cornerSmall }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={startDate}
                  onChangeText={setStartDate}
                />
              </View>
              <View style={styles.dateInputWrapper}>
                <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginBottom: spacing.xs }]}>
                  End Date
                </Text>
                <TextInput
                  style={[styles.dateInput, { backgroundColor: colors.surfaceContainer, color: colors.onSurface, borderRadius: shape.cornerSmall }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={endDate}
                  onChangeText={setEndDate}
                />
              </View>
            </View>

            {/* Reason */}
            <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginBottom: spacing.xs, marginTop: spacing.sm }]}>
              Reason
            </Text>
            <TextInput
              style={[styles.reasonInput, { backgroundColor: colors.surfaceContainer, color: colors.onSurface, borderRadius: shape.cornerSmall }]}
              placeholder="Enter reason for leave..."
              placeholderTextColor={colors.onSurfaceVariant}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: colors.outlineVariant }]}>
            <Pressable
              style={[styles.cancelModalBtn, { borderColor: colors.outline, borderRadius: shape.cornerMedium }]}
              onPress={onClose}
            >
              <Text style={[typography.labelLarge, { color: colors.onSurfaceVariant }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                { backgroundColor: pressed ? colors.primaryContainer : colors.primary, borderRadius: shape.cornerMedium },
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={colors.onPrimary} size="small" />
              ) : (
                <Text style={[typography.labelLarge, { color: colors.onPrimary }]}>Submit Request</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const LeaveRequestsScreen = () => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { colors, typography, spacing, shape } = theme;
  const { user } = useAuth();

  const [leaves, setLeaves] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showNewLeaveModal, setShowNewLeaveModal] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setError('User not found');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const currentYear = new Date().getFullYear();
      const [leavesData, statsData] = await Promise.all([
        leavesApi.getTeacherLeaves(user.id),
        leavesApi.getStats(user.id, currentYear),
      ]);
      setLeaves(leavesData || []);
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching leaves:', err);
      setError(err.message || 'Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleNewLeave = async (leaveData) => {
    try {
      const newLeave = await leavesApi.apply({
        ...leaveData,
        teacherId: user.id,
      });
      setLeaves(prev => [newLeave, ...prev]);
      Alert.alert('Success', 'Leave request submitted successfully');
    } catch (err) {
      throw err;
    }
  };

  const handleCancelLeave = async (leaveId) => {
    Alert.alert(
      'Cancel Leave',
      'Are you sure you want to cancel this leave request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await leavesApi.cancel(leaveId);
              setLeaves(prev =>
                prev.map(l => (l._id === leaveId ? { ...l, status: 'cancelled' } : l))
              );
              Alert.alert('Success', 'Leave request cancelled');
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to cancel leave');
            }
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Stats */}
      {stats && (
        <View style={[styles.statsContainer, { backgroundColor: colors.surfaceContainer, borderRadius: shape.cornerLarge }]}>
          <View style={styles.statItem}>
            <Text style={[typography.headlineSmall, { color: colors.primary }]}>{stats.total || 0}</Text>
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>Total</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.statItem}>
            <Text style={[typography.headlineSmall, { color: colors.success }]}>{stats.approved || 0}</Text>
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>Approved</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.statItem}>
            <Text style={[typography.headlineSmall, { color: colors.warning }]}>{stats.pending || 0}</Text>
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>Pending</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.statItem}>
            <Text style={[typography.headlineSmall, { color: colors.error }]}>{stats.rejected || 0}</Text>
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>Rejected</Text>
          </View>
        </View>
      )}

      {/* New Leave Button */}
      <Pressable
        style={({ pressed }) => [
          styles.newLeaveBtn,
          { backgroundColor: pressed ? colors.primaryContainer : colors.primary, borderRadius: shape.cornerMedium },
        ]}
        onPress={() => setShowNewLeaveModal(true)}
      >
        <Plus size={20} color={colors.onPrimary} />
        <Text style={[typography.labelLarge, { color: colors.onPrimary, marginLeft: 8 }]}>Apply for Leave</Text>
      </Pressable>

      <Text style={[typography.titleMedium, { color: colors.onSurface, marginTop: spacing.md, marginBottom: spacing.sm }]}>
        Leave History
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Calendar size={64} color={colors.outline} />
      <Text style={[typography.titleLarge, { color: colors.onSurface, marginTop: spacing.md }]}>
        No Leave Requests
      </Text>
      <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.sm }]}>
        Tap "Apply for Leave" to submit a new leave request.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.surface }]}>
        <View style={[styles.titleBar, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
          <Text style={[typography.headlineMedium, { color: colors.onSurface }]}>Leave Requests</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: spacing.sm }]}>
            Loading...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.surface }]}>
      <View style={[styles.titleBar, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
        <Text style={[typography.headlineMedium, { color: colors.onSurface }]}>Leave Requests</Text>
      </View>

      {error && (
        <View style={[styles.errorBanner, { backgroundColor: colors.errorContainer }]}>
          <Text style={[typography.labelMedium, { color: colors.onErrorContainer }]}>{error}</Text>
        </View>
      )}

      <FlatList
        data={leaves}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <LeaveCard
            leave={item}
            onPress={() => {}}
            onCancel={() => handleCancelLeave(item._id)}
            theme={theme}
          />
        )}
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

      <NewLeaveModal
        visible={showNewLeaveModal}
        onClose={() => setShowNewLeaveModal(false)}
        onSubmit={handleNewLeave}
        theme={theme}
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
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  newLeaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  leaveCard: {
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  leaveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leaveTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  leaveDetails: {
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reasonContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
  },
  cardActions: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  errorBanner: {
    padding: 12,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  leaveTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  leaveTypeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
  },
  dateInputsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  dateInputWrapper: {
    flex: 1,
  },
  dateInput: {
    padding: 12,
    fontSize: 16,
  },
  reasonInput: {
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    borderTopWidth: 0.5,
  },
  cancelModalBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
  },
  submitBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    minWidth: 120,
    alignItems: 'center',
  },
});

export default LeaveRequestsScreen;
