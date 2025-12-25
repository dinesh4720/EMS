import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Platform, Modal, Dimensions, Animated,
  Easing, ActivityIndicator, RefreshControl
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, SHADOWS, TYPOGRAPHY } from '../theme';
import { Feather } from '@expo/vector-icons';
import Button from '../components/ui/Button';
import GlassView from '../components/ui/GlassView';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedPage from '../components/ui/AnimatedPage';


const { width } = Dimensions.get('window');

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
    getPendingActions,
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
  const todaysDate = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  // Calculate stats
  const pendingAttendanceCount = scheduleData.filter(c => !isAttendanceMarked?.(c.classId || c.id)).length;
  const totalClasses = scheduleData.length;

  // Get current time status for classes
  const getClassStatus = (timeStr) => {
    if (!timeStr) return 'upcoming';
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    const classMinutes = hours * 60 + (minutes || 0);
    const classEndMinutes = classMinutes + 45; // Assume 45 min class

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
        <Text style={styles.loadingText}>Loading your day...</Text>
      </View>
    );
  }

  const headerHeight = 280;

  return (

    <AnimatedPage style={styles.mainContainer}>
      <View style={styles.mainContainer}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.white} />}
          >
            {/* Hero Background */}
            <View style={styles.heroContainer}>
              <LinearGradient
                colors={[COLORS.primary, '#FB923C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroGradient}
              />
              {/* Decorative Circles */}
              <View style={styles.circle1} />
              <View style={styles.circle2} />

              {/* Header Content */}
              <View style={styles.headerContent}>
                <View>
                  <Text style={styles.headerDate}>{todaysDate}</Text>
                  <Text style={styles.headerGreeting}>{getGreeting()},</Text>
                  <Text style={styles.headerName}>{firstName}</Text>
                </View>
                <TouchableOpacity style={styles.profileBtn}>
                  <Text style={styles.profileInitials}>{firstName.substring(0, 2).toUpperCase()}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Floating Dashboard Card */}
            {/* Floating Dashboard Card */}
            <View
              style={styles.dashboardCard}
            >
              {/* Check-In Section */}
              <View style={styles.checkInSection}>
                <View style={styles.checkInInfo}>
                  <Text style={styles.checkInLabel}>Status</Text>
                  <View style={styles.checkInStatusRow}>
                    <View style={[styles.statusDot, checkin.checkedIn ? styles.dotActive : styles.dotInactive]} />
                    <Text style={styles.checkInStatusText}>
                      {checkin.checkedIn ? 'On Duty' : 'Off Duty'}
                    </Text>
                  </View>
                  {checkin.checkedIn && (
                    <Text style={styles.checkInTime}>Since {checkin.time}</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.mainCheckInBtn, checkin.checkedIn && styles.mainCheckInBtnActive]}
                  onPress={checkin.checkedIn ? null : doCheckin}
                  disabled={checkin.checkedIn}
                  activeOpacity={0.8}
                >
                  <Feather name={checkin.checkedIn ? "check-circle" : "log-in"} size={20} color={checkin.checkedIn ? COLORS.success : COLORS.white} />
                  <Text style={[styles.mainCheckInText, checkin.checkedIn && styles.mainCheckInTextActive]}>
                    {checkin.checkedIn ? "Checked In" : "Check In"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              {/* Quick Stats Grid */}
              <View style={styles.statsGrid}>
                <View style={styles.gridItem}>
                  <Text style={styles.gridNumber}>{totalClasses}</Text>
                  <Text style={styles.gridLabel}>Classes</Text>
                </View>
                <View style={styles.gridDivider} />
                <View style={styles.gridItem}>
                  <Text style={[styles.gridNumber, pendingAttendanceCount > 0 && styles.textDanger]}>
                    {pendingAttendanceCount}
                  </Text>
                  <Text style={styles.gridLabel}>Pending</Text>
                </View>
                <View style={styles.gridDivider} />
                <View style={styles.gridItem}>
                  <Text style={styles.gridNumber}>
                    {Math.round((scheduleData.filter(c => isAttendanceMarked?.(c.classId || c.id)).length / (totalClasses || 1)) * 100)}%
                  </Text>
                  <Text style={styles.gridLabel}>Done</Text>
                </View>
              </View>
            </View>

            {/* Priority Actions */}
            {alerts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Action Needed</Text>
                {alerts.slice(0, 3).map((alert, index) => (
                  <TouchableOpacity
                    key={alert.id || index}
                    style={styles.alertCard}
                    onPress={() => handleAlertPress(alert)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.alertIcon, alert.type === 'substitution' ? styles.alertIconWarning : styles.alertIconDanger]}>
                      <Feather
                        name={alert.type === 'substitution' ? 'shuffle' : alert.type === 'attendance' ? 'users' : 'alert-circle'}
                        size={18}
                        color={alert.type === 'substitution' ? COLORS.warning : COLORS.danger}
                      />
                    </View>
                    <View style={styles.alertContent}>
                      <Text style={styles.alertTitle}>
                        {alert.type === 'substitution' ? 'Substitution' : 'Alert'}
                      </Text>
                      <Text style={styles.alertText} numberOfLines={1}>{alert.message}</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color={COLORS.lightGray} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Today's Timeline */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Today's Schedule</Text>
                <View style={styles.badgeCount}>
                  <Text style={styles.badgeCountText}>{totalClasses}</Text>
                </View>
              </View>

              {scheduleData.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconBg}>
                    <Feather name="calendar" size={32} color={COLORS.primary} />
                  </View>
                  <Text style={styles.emptyText}>No classes scheduled for today.</Text>
                  <Text style={styles.emptySubText}>Enjoy your free time!</Text>
                </View>
              ) : (
                <View style={styles.timeline}>
                  {scheduleData.map((cls, index) => {
                    const status = getClassStatus(cls.time);
                    const classId = cls.classId || cls.id;
                    const isMarked = isAttendanceMarked(classId);
                    const isLast = index === scheduleData.length - 1;

                    return (
                      <View key={cls.id || index} style={styles.timelineItem}>
                        {/* Time Column */}
                        <View style={styles.timeColumn}>
                          <Text style={[styles.timeText, status === 'active' && styles.timeTextActive]}>
                            {cls.time ? cls.time.split(' ')[0] : '--:--'}
                          </Text>
                          <Text style={styles.meridiem}>
                            {cls.time ? cls.time.split(' ')[1] : ''}
                          </Text>
                        </View>

                        {/* Timeline Node */}
                        <View style={styles.nodeColumn}>
                          {!isLast && <View style={styles.timelineLine} />}
                          <View style={[
                            styles.timelineNode,
                            status === 'active' && styles.nodeActive,
                            status === 'past' && styles.nodePast,
                            isMarked && styles.nodeDone
                          ]}>
                            {isMarked && <Feather name="check" size={8} color={COLORS.white} />}
                          </View>
                        </View>

                        {/* Class Card */}
                        <TouchableOpacity
                          style={[
                            styles.classCard,
                            status === 'active' && styles.classCardActive,
                            status === 'past' && !isMarked && styles.classCardPending
                          ]}
                          onPress={() => handleOpenClass(cls)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.classInfo}>
                            <Text style={[styles.className, status === 'active' && styles.classNameActive]}>
                              {cls.name}
                            </Text>
                            <Text style={[styles.classSubject, status === 'active' && styles.classSubjectActive]}>
                              {cls.subject}{cls.room ? ` • Room ${cls.room}` : ''}
                            </Text>
                          </View>

                          {/* Status/Action */}
                          {status === 'active' ? (
                            !isMarked ? (
                              <TouchableOpacity
                                style={styles.markAttendanceBtn}
                                onPress={() => handleMarkAttendance(cls)}
                              >
                                <Text style={styles.markAttendanceText}>Mark</Text>
                              </TouchableOpacity>
                            ) : (
                              <View style={styles.runningBadge}>
                                <Text style={styles.runningText}>Active</Text>
                              </View>
                            )
                          ) : status === 'past' && !isMarked ? (
                            <View style={styles.miniAlertBadge}>
                              <Feather name="alert-circle" size={14} color={COLORS.danger} />
                            </View>
                          ) : isMarked ? (
                            <View style={styles.doneBadge}>
                              <Feather name="check" size={14} color={COLORS.success} />
                            </View>
                          ) : null}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Alert Detail Modal */}
          <Modal visible={modalVisible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Notice</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                    <Feather name="x" size={20} color={COLORS.dark} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalBody}>{selectedAlert?.note || selectedAlert?.message}</Text>
                <Button title="Understood" onPress={() => setModalVisible(false)} />
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </View>
    </AnimatedPage>
  );
}


const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' }, // Light gray/blue-ish background
  safeArea: { flex: 1 },
  container: { paddingBottom: 100 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: SPACING.m, color: COLORS.gray },

  // Hero Section
  heroContainer: {
    height: 260,
    position: 'relative',
    marginBottom: 60, // Space for the floating card to overlap
  },
  heroGradient: {
    position: 'absolute',
    left: 0, right: 0, top: -100, bottom: 0, // Extend up for safe area
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  circle1: {
    position: 'absolute', top: -50, right: -50, width: 200, height: 200,
    borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.1)',
  },
  circle2: {
    position: 'absolute', top: 50, left: -60, width: 150, height: 150,
    borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerContent: {
    paddingHorizontal: SPACING.l,
    paddingTop: Platform.OS === 'android' ? 60 : 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerDate: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  headerGreeting: { color: COLORS.white, fontSize: 18, fontWeight: '500' },
  headerName: { color: COLORS.white, fontSize: 32, fontWeight: '800', lineHeight: 40 },

  profileBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
  },
  profileInitials: { color: COLORS.white, fontSize: 16, fontWeight: '700' },

  // Dashboard Card
  dashboardCard: {
    marginHorizontal: SPACING.l,
    marginTop: -80, // Overlap
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.l,
    ...SHADOWS.medium,
  },
  checkInSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  checkInInfo: { flex: 1 },
  checkInLabel: { fontSize: 12, color: COLORS.gray, fontWeight: '500' },
  checkInStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  dotActive: { backgroundColor: COLORS.success },
  dotInactive: { backgroundColor: COLORS.gray },
  checkInStatusText: { fontSize: 15, fontWeight: '700', color: COLORS.dark },
  checkInTime: { fontSize: 12, color: COLORS.success, marginTop: 2, fontWeight: '500' },

  mainCheckInBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 16,
    ...SHADOWS.small,
  },
  mainCheckInBtnActive: {
    backgroundColor: '#DCFCE7', // Light green
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1, borderColor: '#86EFAC',
  },
  mainCheckInText: { color: COLORS.white, fontWeight: '700', marginLeft: 8 },
  mainCheckInTextActive: { color: COLORS.success },

  divider: { height: 1, backgroundColor: COLORS.lightGray, marginVertical: SPACING.m },

  // Stats Grid
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  gridItem: { flex: 1, alignItems: 'center' },
  gridNumber: { fontSize: 20, fontWeight: '800', color: COLORS.dark },
  textDanger: { color: COLORS.danger },
  gridLabel: { fontSize: 12, color: COLORS.gray, marginTop: 4, fontWeight: '500' },
  gridDivider: { width: 1, height: '80%', backgroundColor: COLORS.lightGray, alignSelf: 'center' },

  // Sections
  section: { marginTop: SPACING.l, paddingHorizontal: SPACING.l },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.m },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.dark },
  badgeCount: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 8 },
  badgeCountText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },

  // Alerts
  alertCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: 16, padding: SPACING.m, marginBottom: SPACING.s,
    ...SHADOWS.small
  },
  alertIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.m },
  alertIconWarning: { backgroundColor: '#FEF3C7' },
  alertIconDanger: { backgroundColor: '#FEE2E2' },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: 13, fontWeight: '700', color: COLORS.dark, marginBottom: 2 },
  alertText: { fontSize: 13, color: COLORS.gray },

  // Timeline
  timeline: { marginTop: SPACING.s },
  timelineItem: { flexDirection: 'row', marginBottom: SPACING.l },

  timeColumn: { width: 50, alignItems: 'flex-end', paddingRight: SPACING.s },
  timeText: { fontSize: 14, fontWeight: '700', color: COLORS.dark },
  timeTextActive: { color: COLORS.primary },
  meridiem: { fontSize: 11, color: COLORS.gray, marginTop: 2 },

  nodeColumn: { width: 24, alignItems: 'center' },
  timelineLine: { position: 'absolute', top: 12, bottom: -SPACING.l, width: 2, backgroundColor: '#E2E8F0' },
  timelineNode: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#E2E8F0', borderWidth: 2, borderColor: '#F8FAFC', zIndex: 1 },
  nodeActive: { width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.primary, borderWidth: 3 },
  nodePast: { backgroundColor: '#CBD5E1' },
  nodeDone: { backgroundColor: COLORS.success, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },

  // Class Card
  classCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: 16, padding: SPACING.m, marginBottom: SPACING.s,
    ...SHADOWS.small
  },
  classCardActive: { backgroundColor: COLORS.primary, transform: [{ scale: 1.02 }] },
  classCardPending: { backgroundColor: '#FFFBEB' },
  classInfo: { flex: 1 },
  className: { fontSize: 16, fontWeight: '700', color: COLORS.dark },
  classNameActive: { color: COLORS.white },
  classSubject: { fontSize: 13, color: COLORS.gray, marginTop: 4 },
  classSubjectActive: { color: 'rgba(255,255,255,0.9)' },

  markAttendanceBtn: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  markAttendanceText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  runningBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  runningText: { color: COLORS.white, fontSize: 10, fontWeight: '700' },

  miniAlertBadge: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  doneBadge: { backgroundColor: '#D1FAE5', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  // Empty State
  emptyState: { alignItems: 'center', padding: SPACING.xl, marginTop: SPACING.m },
  emptyIconBg: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.m },
  emptyText: { color: COLORS.dark, fontSize: 16, fontWeight: '600' },
  emptySubText: { color: COLORS.gray, fontSize: 14, marginTop: 4 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: SPACING.l },
  modalContent: { width: '100%', backgroundColor: COLORS.white, borderRadius: 24, padding: SPACING.l },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.m },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.dark },
  closeBtn: { padding: 4, backgroundColor: '#F1F5F9', borderRadius: 20 },
  modalBody: { fontSize: 15, color: COLORS.gray, lineHeight: 24, marginBottom: SPACING.xl },
});
