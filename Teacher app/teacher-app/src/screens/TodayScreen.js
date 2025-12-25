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

          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{totalClasses}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: COLORS.warning }]}>{pendingAttendanceCount}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: COLORS.success }]}>{completedClasses}</Text>
              <Text style={styles.statLabel}>Done</Text>
            </View>
          </View>

          {/* Alerts */}
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

          {/* Schedule */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Today's Schedule</Text>
            {scheduleData.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="calendar" size={40} color={COLORS.lightGray} />
                <Text style={styles.emptyText}>No classes today</Text>
              </View>
            ) : (
              <View style={styles.scheduleList}>
                {scheduleData.map((cls, index) => {
                  const status = getClassStatus(cls.time);
                  const isMarked = isAttendanceMarked(cls.classId || cls.id);
                  const isActive = status === 'active';

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.classItem,
                        isActive && styles.classItemActive,
                        isMarked && styles.classItemDone
                      ]}
                      onPress={() => handleOpenClass(cls)}
                      activeOpacity={0.9}
                    >
                      <View style={styles.timeContainer}>
                        <Text style={[styles.timeText, isActive && styles.textPrimary]}>
                          {cls.time ? cls.time.split(' ')[0] : '--'}
                        </Text>
                        <Text style={styles.meridiemText}>
                          {cls.time ? cls.time.split(' ')[1] : ''}
                        </Text>
                      </View>

                      <View style={styles.verticalDivider} />

                      <View style={styles.classContent}>
                        <Text style={styles.className}>{cls.name}</Text>
                        <Text style={styles.classSubject}>
                          {cls.subject}{cls.room ? ` • R-${cls.room}` : ''}
                        </Text>
                      </View>

                      <View style={styles.actionContainer}>
                        {isMarked ? (
                          <View style={styles.iconBadgeDone}>
                            <Feather name="check" size={14} color={COLORS.success} />
                          </View>
                        ) : isActive ? (
                          <TouchableOpacity
                            style={styles.markBtn}
                            onPress={() => handleMarkAttendance(cls)}
                          >
                            <Text style={styles.markBtnText}>Mark</Text>
                          </TouchableOpacity>
                        ) : (
                          <Feather name="chevron-right" size={18} color={COLORS.lightGray} />
                        )}
                      </View>
                    </TouchableOpacity>
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
  mainContainer: { flex: 1, backgroundColor: '#FAFAFA' },
  safeArea: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: SPACING.l, paddingBottom: 100 },

  // Header
  header: {
    paddingHorizontal: SPACING.l,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: SPACING.m,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#FAFAFA',
  },
  greeting: { fontSize: 14, color: COLORS.gray, fontFamily: 'Inter_500Medium' },
  name: { fontSize: 26, color: COLORS.dark, fontFamily: 'Inter_500Medium', marginVertical: 2 },
  date: { fontSize: 13, color: COLORS.gray, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 0.5 },
  profileButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center',
    ...SHADOWS.small, borderWidth: 1, borderColor: '#F3F4F6'
  },
  profileInitials: { fontSize: 16, fontFamily: 'Inter_500Medium', color: COLORS.primary },

  // Status Bar
  statusBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.white, padding: 16, borderRadius: 20,
    marginBottom: SPACING.l,
    borderWidth: 1, borderColor: '#F1F5F9',
    ...SHADOWS.small,
    elevation: 1,
  },
  statusTextContainer: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  dotOnline: { backgroundColor: COLORS.success },
  dotOffline: { backgroundColor: COLORS.gray },
  statusTitle: { fontSize: 16, fontFamily: 'Inter_500Medium', color: COLORS.dark },
  statusSubtitle: { fontSize: 12, color: COLORS.gray, marginTop: 2, fontFamily: 'Inter_400Regular' },
  checkInBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
  },
  checkInBtnActive: { backgroundColor: '#DCFCE7' },
  checkInBtnInactive: { backgroundColor: COLORS.dark },
  checkInBtnText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  textWhite: { color: COLORS.white },
  textSuccess: { color: COLORS.success },

  // Stats
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.l },
  statCard: {
    flex: 1, backgroundColor: COLORS.white, padding: 16, borderRadius: 18,
    alignItems: 'center', marginHorizontal: 4,
    borderWidth: 1, borderColor: '#F1F5F9',
    ...SHADOWS.small, elevation: 1
  },
  statNumber: { fontSize: 20, fontFamily: 'Inter_500Medium', color: COLORS.dark, marginBottom: 4 },
  statLabel: { fontSize: 12, color: COLORS.gray, fontFamily: 'Inter_500Medium' },

  // Section
  section: { marginBottom: SPACING.xl },
  sectionHeader: { fontSize: 18, fontFamily: 'Inter_500Medium', color: COLORS.dark, marginBottom: SPACING.m },

  // Alerts
  alertItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2',
    padding: 16, borderRadius: 16, marginBottom: 8,
    borderWidth: 1, borderColor: '#FECACA'
  },
  alertText: { flex: 1, marginHorizontal: 12, fontSize: 14, color: '#991B1B', fontFamily: 'Inter_500Medium' },

  // Schedule List
  scheduleList: {},
  classItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    padding: 16, borderRadius: 18, marginBottom: 12,
    borderWidth: 1, borderColor: '#F1F5F9',
    ...SHADOWS.small, elevation: 1
  },
  classItemActive: { borderColor: COLORS.primary, backgroundColor: '#FFF7ED' },
  classItemDone: { opacity: 0.8, backgroundColor: '#F8FAFC' },

  timeContainer: { alignItems: 'center', width: 45 },
  timeText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: COLORS.dark },
  meridiemText: { fontSize: 11, color: COLORS.gray, marginTop: 2, fontFamily: 'Inter_400Regular' },
  textPrimary: { color: COLORS.primary },

  verticalDivider: { width: 1, height: 24, backgroundColor: '#E2E8F0', marginHorizontal: 16 },

  classContent: { flex: 1 },
  className: { fontSize: 16, fontFamily: 'Inter_500Medium', color: COLORS.dark, marginBottom: 4 },
  classSubject: { fontSize: 13, color: COLORS.gray, fontFamily: 'Inter_500Medium' },

  actionContainer: { paddingLeft: 10 },
  markBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  markBtnText: { color: COLORS.white, fontSize: 12, fontFamily: 'Inter_500Medium' },
  iconBadgeDone: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#DCFCE7',
    alignItems: 'center', justifyContent: 'center'
  },

  // Empty
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { color: COLORS.gray, marginTop: 12, fontSize: 14, fontFamily: 'Inter_400Regular' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: COLORS.white, borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_500Medium', marginBottom: 12 },
  modalBody: { fontSize: 15, color: COLORS.gray, lineHeight: 22, marginBottom: 24, fontFamily: 'Inter_400Regular' },
});
