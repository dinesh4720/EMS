import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Platform, Modal, ActivityIndicator, RefreshControl
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, SHADOWS } from '../theme';
import { Feather } from '@expo/vector-icons';
import Button from '../components/ui/Button';
import AnimatedPage from '../components/ui/AnimatedPage';

export default function TodayScreen({ navigation }) {
  const { user } = useAuth();
  const {
    classes = [],
    todaySchedule = [],
    alerts = [],
    teacherProfile,
    loading,
    refetch,
    isAttendanceMarked,
    checkin,
    doCheckin,
  } = useApp();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // If there's specific schedule data, use it; otherwise fallback to classes
  const scheduleData = todaySchedule.length > 0 ? todaySchedule : classes;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const teacherName = teacherProfile?.name || user?.name || 'Teacher';
  const firstName = teacherName.split(' ')[0];
  const todaysDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Calculate stats
  const pendingAttendanceCount = scheduleData.filter(c => !isAttendanceMarked?.(c.classId || c.id)).length;
  const totalClasses = scheduleData.length;
  const completedClasses = scheduleData.filter(c => isAttendanceMarked?.(c.classId || c.id)).length;

  const getClassStatus = (timeStr) => {
    if (!timeStr) return 'upcoming';
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    const classMinutes = hours * 60 + (minutes || 0);
    // Assume 45 min class for status logic
    const classEndMinutes = classMinutes + 45;

    if (currentMinutes >= classMinutes && currentMinutes < classEndMinutes) return 'active';
    if (currentMinutes < classMinutes) return 'upcoming';
    return 'past';
  };

  const handleAlertPress = (alert) => {
    if (alert.action) {
      navigation.navigate('Classes', { screen: alert.action, params: alert.params });
    } else {
      setSelectedAlert(alert);
      setModalVisible(true);
    }
  };

  const handleOpenClass = (cls) => {
    const classId = cls.classId || cls.id;
    navigation.navigate('Classes', {
      screen: 'ClassWorkspace',
      params: { classId, className: cls.name }
    });
  };

  const handleMarkAttendance = (cls) => {
    const classId = cls.classId || cls.id;
    navigation.navigate('Classes', {
      screen: 'ClassWorkspace',
      params: { classId, className: cls.name, initialTab: 0 }
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.mainContainer, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Calculate time indicator position (for reference if needed, though unused in list view)
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  return (
    <AnimatedPage style={styles.mainContainer}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.name}>{firstName}</Text>
            <Text style={styles.date}>{todaysDate}</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileInitials}>{firstName.substring(0, 2).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        >
          {/* Status Bar */}
          <View style={styles.statusBar}>
            <View style={styles.statusTextContainer}>
              <View style={[styles.statusDot, checkin.checkedIn ? styles.dotOnline : styles.dotOffline]} />
              <View>
                <Text style={styles.statusTitle}>{checkin.checkedIn ? 'On Duty' : 'Off Duty'}</Text>
                {checkin.checkedIn && <Text style={styles.statusSubtitle}>Since {checkin.time}</Text>}
              </View>
            </View>
            <TouchableOpacity
              style={[styles.checkInBtn, checkin.checkedIn ? styles.checkInBtnActive : styles.checkInBtnInactive]}
              onPress={checkin.checkedIn ? null : doCheckin}
              activeOpacity={0.8}
              disabled={checkin.checkedIn}
            >
              <Text style={[styles.checkInBtnText, checkin.checkedIn ? styles.textSuccess : styles.textWhite]}>
                {checkin.checkedIn ? "Checked In" : "Check In"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Stats - Restored for completeness if needed, or Alerts */}

          {/* Alerts - Restored */}
          {alerts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Important</Text>
              {alerts.slice(0, 2).map((alert, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.alertItem}
                  onPress={() => handleAlertPress(alert)}
                >
                  <Feather name="alert-circle" size={18} color={COLORS.danger} />
                  <Text style={styles.alertText} numberOfLines={1}>{alert.message}</Text>
                  <Feather name="chevron-right" size={16} color={COLORS.gray} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Schedule List */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Today's Schedule</Text>
            {scheduleData.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="calendar" size={40} color={COLORS.lightGray} />
                <Text style={styles.emptyText}>No classes today</Text>
              </View>
            ) : (
              <View style={styles.timelineContainer}>
                {scheduleData.map((cls, index) => {
                  const status = getClassStatus(cls.time);
                  const isMarked = isAttendanceMarked(cls.classId || cls.id);
                  const isActive = status === 'active';
                  const isPending = status === 'past' && !isMarked;

                  const [timeStr, modifier] = cls.time ? cls.time.split(' ') : ['--', ''];

                  return (
                    <View key={index} style={styles.timeSlotRow}>
                      {/* Time Column */}
                      <View style={styles.timeLabelContainer}>
                        <Text style={styles.timeLabelText}>{timeStr}</Text>
                        <Text style={styles.meridiemText}>{modifier}</Text>
                      </View>

                      {/* Content Column with timeline connector */}
                      <View style={styles.gridLineContainer}>
                        {/* Timeline Connector Line */}
                        {index !== scheduleData.length - 1 && (
                          <View style={styles.connectorLine} />
                        )}

                        <TouchableOpacity
                          style={[
                            styles.eventCard,
                            isActive ? styles.eventActive : isPending ? styles.eventPending : styles.eventDefault,
                            isMarked && styles.eventDone
                          ]}
                          onPress={() => handleOpenClass(cls)}
                          activeOpacity={0.9}
                        >
                          <View style={styles.eventContent}>
                            <Text style={styles.eventTitle} numberOfLines={1}>
                              {cls.name} <Text style={{ fontSize: 13, color: COLORS.dark, opacity: 0.7 }}>({cls.subject})</Text>
                            </Text>
                            <Text style={styles.eventRoom}>{cls.room ? `Room ${cls.room}` : 'No Room'}</Text>

                            {/* Action Button */}
                            <View style={styles.eventActionRow}>
                              {isMarked ? (
                                <View style={styles.checkBadge}>
                                  <Feather name="check" size={12} color="#166534" />
                                  <Text style={styles.checkText}>Done</Text>
                                </View>
                              ) : (isActive || isPending) ? (
                                <TouchableOpacity
                                  style={styles.miniMarkBtn}
                                  onPress={() => handleMarkAttendance(cls)}
                                >
                                  <Text style={styles.miniMarkText}>Mark Attendance</Text>
                                </TouchableOpacity>
                              ) : null}
                            </View>
                          </View>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Modal */}
        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Notice</Text>
              <Text style={styles.modalBody}>{selectedAlert?.note || selectedAlert?.message}</Text>
              <Button title="Close" onPress={() => setModalVisible(false)} />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </AnimatedPage>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  safeArea: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 100 },

  // Header
  header: {
    paddingHorizontal: SPACING.l,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: SPACING.m,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  greeting: { fontSize: 14, color: COLORS.gray, fontFamily: 'Inter_500Medium' },
  name: { fontSize: 26, color: COLORS.dark, fontFamily: 'Inter_500Medium', marginVertical: 2 },
  date: { fontSize: 13, color: COLORS.gray, fontFamily: 'Inter_500Medium', letterSpacing: 0.5 },
  profileButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center',
    ...SHADOWS.small, borderWidth: 1, borderColor: '#F3F4F6'
  },
  profileInitials: { fontSize: 16, fontFamily: 'Inter_500Medium', color: COLORS.primary },

  // Status Bar
  statusBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F8FAFC', padding: 12, borderRadius: 16,
    marginHorizontal: SPACING.l, marginBottom: SPACING.l,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  statusTextContainer: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  dotOnline: { backgroundColor: COLORS.success },
  dotOffline: { backgroundColor: COLORS.gray },
  statusTitle: { fontSize: 14, fontFamily: 'Inter_500Medium', color: COLORS.dark },
  statusSubtitle: { fontSize: 11, color: COLORS.gray, marginTop: 1, fontFamily: 'Inter_400Regular' },
  checkInBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  checkInBtnActive: { backgroundColor: '#DCFCE7' },
  checkInBtnInactive: { backgroundColor: COLORS.dark },
  checkInBtnText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  textWhite: { color: COLORS.white },
  textSuccess: { color: COLORS.success },

  // Alerts
  section: { marginBottom: SPACING.l, paddingHorizontal: SPACING.l },
  sectionHeader: { fontSize: 18, fontFamily: 'Inter_500Medium', color: COLORS.dark, marginBottom: SPACING.m },
  alertItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2',
    padding: 16, borderRadius: 16, marginBottom: 8,
    borderWidth: 1, borderColor: '#FECACA'
  },
  alertText: { flex: 1, marginHorizontal: 12, fontSize: 14, color: '#991B1B', fontFamily: 'Inter_500Medium' },

  // Timeline
  timelineContainer: {
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: SPACING.l,
  },
  timeSlotRow: {
    flexDirection: 'row',
    marginBottom: 20,
    minHeight: 100,
  },
  timeLabelContainer: {
    width: 60,
    alignItems: 'center',
    paddingTop: 0,
    paddingRight: 8,
  },
  timeLabelText: {
    fontSize: 14,
    color: COLORS.dark,
    fontFamily: 'Inter_500Medium',
  },
  meridiemText: {
    fontSize: 11,
    color: COLORS.gray,
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  gridLineContainer: {
    flex: 1,
    position: 'relative',
    paddingRight: SPACING.l,
    borderLeftWidth: 2,
    borderLeftColor: '#F1F5F9', // vertical timeline line
    paddingLeft: 16,
    marginLeft: -8,
  },

  connectorLine: {
    // Optional: stronger connector if needed, currently using borderLeft of container
    position: 'absolute',
    top: 20, bottom: -24, width: 2, backgroundColor: '#E2E8F0', left: -1,
    display: 'none',
  },

  // Events
  eventCard: {
    borderRadius: 16,
    flex: 1,
    padding: 16,
    borderLeftWidth: 4,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
    elevation: 2,
    justifyContent: 'center',
    marginBottom: 4,
  },
  eventActive: { borderLeftColor: COLORS.primary, backgroundColor: '#FFF7ED' },
  eventPending: { borderLeftColor: COLORS.danger, backgroundColor: '#FEF2F2' },
  eventDefault: { borderLeftColor: COLORS.blue, backgroundColor: '#EFF6FF' },
  eventDone: { borderLeftColor: COLORS.success, backgroundColor: '#F0FDF4', opacity: 0.8 },

  eventContent: {},
  eventTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: COLORS.dark, marginBottom: 4 },
  eventRoom: { fontSize: 13, color: COLORS.gray, fontFamily: 'Inter_500Medium', marginBottom: 8 },

  eventActionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  miniMarkBtn: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    alignSelf: 'flex-start',
    ...SHADOWS.small
  },
  miniMarkText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: COLORS.dark },

  checkBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, alignSelf: 'flex-start' },
  checkText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#166534', marginLeft: 4 },

  // Empty
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { color: COLORS.gray, marginTop: 12, fontSize: 14, fontFamily: 'Inter_400Regular' },

  // Modal matches previous
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: COLORS.white, borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_500Medium', marginBottom: 12 },
  modalBody: { fontSize: 15, color: COLORS.gray, lineHeight: 22, marginBottom: 24, fontFamily: 'Inter_400Regular' },
});
