import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Platform, Modal, Alert
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, SHADOWS } from '../theme';
import { Feather } from '@expo/vector-icons';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import AnimatedPage from '../components/ui/AnimatedPage';

export default function MeScreen({ navigation }) {
  const { checkin, doCheckin, doCheckout, leaveBalance, salarySlips, notifications, markNotificationRead, getUnreadNotificationCount } = useApp();
  const { user, logout } = useAuth();
  const [activeModal, setActiveModal] = useState(null); // 'salary', 'notifications'

  const unreadCount = getUnreadNotificationCount();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout }
    ]);
  };

  return (
    <AnimatedPage style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.[0] || 'T'}</Text>
            </View>
            <Text style={styles.userName}>{user?.name || 'Teacher'}</Text>
            <Text style={styles.userRole}>{user?.designation || 'Teacher'}</Text>
          </View>

          {/* Check-in Card */}
          <Card style={styles.checkinCard}>
            <View style={styles.checkinHeader}>
              <View>
                <Text style={styles.checkinLabel}>Today's Attendance</Text>
                <Text style={styles.checkinDate}>{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}</Text>
              </View>
              <View style={[styles.statusBadge, checkin.checkedIn ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
                <View style={[styles.statusDot, checkin.checkedIn && styles.statusDotActive]} />
                <Text style={[styles.statusText, checkin.checkedIn && styles.statusTextActive]}>
                  {checkin.checkedIn ? 'On Duty' : 'Off Duty'}
                </Text>
              </View>
            </View>

            <View style={styles.checkinTimes}>
              <View style={styles.checkinTimeItem}>
                <Feather name="log-in" size={20} color={checkin.checkedIn ? COLORS.success : COLORS.gray} />
                <Text style={styles.checkinTimeLabel}>Check In</Text>
                <Text style={styles.checkinTimeValue}>{checkin.time || '--:--'}</Text>
              </View>
              <View style={styles.checkinDivider} />
              <View style={styles.checkinTimeItem}>
                <Feather name="log-out" size={20} color={checkin.checkoutTime ? COLORS.danger : COLORS.gray} />
                <Text style={styles.checkinTimeLabel}>Check Out</Text>
                <Text style={styles.checkinTimeValue}>{checkin.checkoutTime || '--:--'}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.checkinBtn, checkin.checkedIn && styles.checkoutBtn]}
              onPress={checkin.checkedIn ? doCheckout : doCheckin}
              activeOpacity={0.8}
            >
              <Feather name={checkin.checkedIn ? "log-out" : "log-in"} size={20} color={COLORS.white} />
              <Text style={styles.checkinBtnText}>{checkin.checkedIn ? 'Check Out' : 'Check In'}</Text>
            </TouchableOpacity>
          </Card>

          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>22</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: COLORS.warning }]}>{leaveBalance.taken.casual}</Text>
              <Text style={styles.statLabel}>Leaves</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: COLORS.success }]}>{leaveBalance.casual}</Text>
              <Text style={styles.statLabel}>Balance</Text>
            </View>
          </View>

          {/* Menu Items */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HR & Personal</Text>

            <MenuItem
              icon="calendar"
              title="Leave & Regularization"
              subtitle={`${leaveBalance.casual + leaveBalance.sick + leaveBalance.earned} days available`}
              onPress={() => navigation.navigate('LeaveApplication')}
            />
            <MenuItem
              icon="credit-card"
              title="Salary & Payslips"
              subtitle="View salary details"
              onPress={() => setActiveModal('salary')}
            />
            <MenuItem
              icon="bell"
              title="Notifications"
              subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              badge={unreadCount}
              onPress={() => setActiveModal('notifications')}
            />
            <MenuItem
              icon="user"
              title="Profile"
              subtitle="Edit your profile"
              onPress={() => navigation.navigate('ProfileEdit')}
            />
          </View>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Feather name="log-out" size={20} color={COLORS.danger} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>

          <View style={styles.appInfo}>
            <Text style={styles.appName}>Teacher App</Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
          </View>
        </ScrollView>



        {/* Salary Modal */}
        <Modal visible={activeModal === 'salary'} animationType="slide">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Feather name="x" size={24} color={COLORS.dark} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Salary & Payslips</Text>
              <View style={{ width: 24 }} />
            </View>
            <ScrollView contentContainerStyle={styles.modalContent}>
              {salarySlips.map(slip => (
                <Card key={slip.id} style={styles.salaryCard}>
                  <View style={styles.salaryHeader}>
                    <Text style={styles.salaryMonth}>{slip.month}</Text>
                    <View style={[styles.salaryStatus, slip.status === 'paid' && styles.salaryStatusPaid]}>
                      <Text style={[styles.salaryStatusText, slip.status === 'paid' && styles.salaryStatusTextPaid]}>
                        {slip.status}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.salaryDetails}>
                    <View style={styles.salaryRow}>
                      <Text style={styles.salaryLabel}>Gross</Text>
                      <Text style={styles.salaryValue}>₹{slip.gross.toLocaleString()}</Text>
                    </View>
                    <View style={styles.salaryRow}>
                      <Text style={styles.salaryLabel}>Deductions</Text>
                      <Text style={[styles.salaryValue, { color: COLORS.danger }]}>-₹{slip.deductions.toLocaleString()}</Text>
                    </View>
                    <View style={[styles.salaryRow, styles.salaryRowNet]}>
                      <Text style={styles.salaryLabelNet}>Net Pay</Text>
                      <Text style={styles.salaryValueNet}>₹{slip.net.toLocaleString()}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.downloadBtn}>
                    <Feather name="download" size={16} color={COLORS.primary} />
                    <Text style={styles.downloadText}>Download Payslip</Text>
                  </TouchableOpacity>
                </Card>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Notifications Modal */}
        <Modal visible={activeModal === 'notifications'} animationType="slide">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Feather name="x" size={24} color={COLORS.dark} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Notifications</Text>
              <View style={{ width: 24 }} />
            </View>
            <ScrollView contentContainerStyle={styles.modalContent}>
              {notifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <Feather name="bell-off" size={48} color={COLORS.lightGray} />
                  <Text style={styles.emptyText}>No notifications</Text>
                </View>
              ) : (
                notifications.map(notif => (
                  <TouchableOpacity
                    key={notif.id}
                    style={[styles.notifCard, !notif.read && styles.notifCardUnread]}
                    onPress={() => markNotificationRead(notif.id)}
                  >
                    <View style={[styles.notifIcon, !notif.read && styles.notifIconUnread]}>
                      <Feather name="bell" size={18} color={!notif.read ? COLORS.primary : COLORS.gray} />
                    </View>
                    <View style={styles.notifContent}>
                      <Text style={[styles.notifTitle, !notif.read && styles.notifTitleUnread]}>{notif.title}</Text>
                      <Text style={styles.notifMessage}>{notif.message}</Text>
                      <Text style={styles.notifTime}>{notif.time}</Text>
                    </View>
                    {!notif.read && <View style={styles.notifDot} />}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>


      </SafeAreaView>
    </AnimatedPage>
  );
}

function MenuItem({ icon, title, subtitle, badge, onPress }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuIcon}>
        <Feather name={icon} size={20} color={COLORS.primary} />
      </View>
      <View style={styles.menuInfo}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      {badge > 0 && (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>{badge}</Text>
        </View>
      )}
      <Feather name="chevron-right" size={20} color={COLORS.gray} />
    </TouchableOpacity>
  );
}

function ProfileRow({ icon, label, value, last }) {
  return (
    <View style={[styles.profileRow, !last && styles.profileRowBorder]}>
      <Feather name={icon} size={18} color={COLORS.gray} />
      <Text style={styles.profileRowLabel}>{label}</Text>
      <Text style={styles.profileRowValue}>{value}</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA', paddingTop: Platform.OS === 'android' ? 40 : 0 },
  container: { padding: SPACING.l, paddingBottom: 100 },

  // Profile Header
  profileHeader: { alignItems: 'center', marginBottom: SPACING.xl },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.m },
  avatarText: { fontSize: 32, fontFamily: 'Inter_500Medium', color: COLORS.white },
  userName: { fontSize: 22, fontFamily: 'Inter_500Medium', color: COLORS.dark },
  userRole: { fontSize: 14, color: COLORS.gray, marginTop: 4, fontFamily: 'Inter_400Regular' },

  // Check-in Card
  checkinCard: { marginBottom: SPACING.l },
  checkinHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.m },
  checkinLabel: { fontSize: 16, fontFamily: 'Inter_500Medium', color: COLORS.dark },
  checkinDate: { fontSize: 13, color: COLORS.gray, marginTop: 2, fontFamily: 'Inter_400Regular' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: COLORS.lightGray },
  statusBadgeActive: { backgroundColor: '#D1FAE5' },
  statusBadgeInactive: { backgroundColor: '#FEE2E2' },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.danger, marginRight: 6 },
  statusDotActive: { backgroundColor: COLORS.success },
  statusText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: COLORS.danger },
  statusTextActive: { color: COLORS.success },
  checkinTimes: { flexDirection: 'row', backgroundColor: '#F9FAFB', borderRadius: 12, padding: SPACING.m, marginBottom: SPACING.m },
  checkinTimeItem: { flex: 1, alignItems: 'center' },
  checkinTimeLabel: { fontSize: 12, color: COLORS.gray, marginTop: 4, fontFamily: 'Inter_400Regular' },
  checkinTimeValue: { fontSize: 18, fontFamily: 'Inter_500Medium', color: COLORS.dark, marginTop: 2 },
  checkinDivider: { width: 1, backgroundColor: COLORS.lightGray },
  checkinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.success, paddingVertical: 14, borderRadius: 12 },
  checkoutBtn: { backgroundColor: COLORS.danger },
  checkinBtnText: { color: COLORS.white, fontSize: 16, fontFamily: 'Inter_500Medium', marginLeft: SPACING.s },

  // Stats Row
  statsRow: { flexDirection: 'row', gap: SPACING.m, marginBottom: SPACING.xl },
  statCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: SPACING.m, alignItems: 'center', ...SHADOWS.small },
  statValue: { fontSize: 24, fontFamily: 'Inter_500Medium', color: COLORS.dark },
  statLabel: { fontSize: 11, color: COLORS.gray, marginTop: 2, fontFamily: 'Inter_400Regular' },

  // Section
  section: { marginBottom: SPACING.xl },
  sectionTitle: { fontSize: 13, fontFamily: 'Inter_500Medium', color: COLORS.gray, textTransform: 'uppercase', marginBottom: SPACING.m, letterSpacing: 0.5 },

  // Menu Item
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: SPACING.m, borderRadius: 12, marginBottom: SPACING.s, ...SHADOWS.small },
  menuIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  menuInfo: { flex: 1, marginLeft: SPACING.m },
  menuTitle: { fontSize: 15, fontFamily: 'Inter_500Medium', color: COLORS.dark },
  menuSubtitle: { fontSize: 13, color: COLORS.gray, marginTop: 2, fontFamily: 'Inter_400Regular' },
  menuBadge: { backgroundColor: COLORS.danger, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginRight: SPACING.s },
  menuBadgeText: { color: COLORS.white, fontSize: 12, fontFamily: 'Inter_500Medium' },

  // Logout
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEE2E2', padding: SPACING.m, borderRadius: 12, marginBottom: SPACING.l },
  logoutText: { color: COLORS.danger, fontSize: 16, fontFamily: 'Inter_500Medium', marginLeft: SPACING.s },

  // App Info
  appInfo: { alignItems: 'center', paddingVertical: SPACING.l },
  appName: { fontSize: 14, fontFamily: 'Inter_500Medium', color: COLORS.gray },
  appVersion: { fontSize: 12, color: COLORS.lightGray, marginTop: 4, fontFamily: 'Inter_400Regular' },

  // Modal
  modalContainer: { flex: 1, backgroundColor: '#FAFAFA' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.m, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_500Medium', color: COLORS.dark },
  modalContent: { padding: SPACING.l },

  // Leave Balance
  leaveBalanceCard: { marginBottom: SPACING.l },
  leaveBalanceTitle: { fontSize: 14, fontFamily: 'Inter_500Medium', color: COLORS.gray, marginBottom: SPACING.m },
  leaveBalanceRow: { flexDirection: 'row' },
  leaveBalanceItem: { flex: 1, alignItems: 'center' },
  leaveBalanceValue: { fontSize: 28, fontFamily: 'Inter_500Medium', color: COLORS.primary },
  leaveBalanceLabel: { fontSize: 12, color: COLORS.gray, marginTop: 4, fontFamily: 'Inter_400Regular' },

  // Salary Card
  salaryCard: { marginBottom: SPACING.m },
  salaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.m },
  salaryMonth: { fontSize: 16, fontFamily: 'Inter_500Medium', color: COLORS.dark },
  salaryStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: COLORS.lightGray },
  salaryStatusPaid: { backgroundColor: '#D1FAE5' },
  salaryStatusText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: COLORS.gray, textTransform: 'uppercase' },
  salaryStatusTextPaid: { color: COLORS.success },
  salaryDetails: { backgroundColor: '#F9FAFB', borderRadius: 10, padding: SPACING.m, marginBottom: SPACING.m },
  salaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.s },
  salaryRowNet: { borderTopWidth: 1, borderTopColor: COLORS.lightGray, paddingTop: SPACING.s, marginTop: SPACING.s, marginBottom: 0 },
  salaryLabel: { fontSize: 14, color: COLORS.gray, fontFamily: 'Inter_400Regular' },
  salaryValue: { fontSize: 14, fontFamily: 'Inter_500Medium', color: COLORS.dark },
  salaryLabelNet: { fontSize: 15, fontFamily: 'Inter_500Medium', color: COLORS.dark },
  salaryValueNet: { fontSize: 18, fontFamily: 'Inter_500Medium', color: COLORS.success },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  downloadText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: COLORS.primary, marginLeft: 6 },

  // Notifications
  notifCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.white, padding: SPACING.m, borderRadius: 12, marginBottom: SPACING.s },
  notifCardUnread: { backgroundColor: '#EFF6FF' },
  notifIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.lightGray, alignItems: 'center', justifyContent: 'center' },
  notifIconUnread: { backgroundColor: COLORS.primaryLight },
  notifContent: { flex: 1, marginLeft: SPACING.m },
  notifTitle: { fontSize: 14, fontFamily: 'Inter_500Medium', color: COLORS.dark },
  notifTitleUnread: { fontFamily: 'Inter_500Medium', color: COLORS.dark },
  notifMessage: { fontSize: 13, color: COLORS.gray, marginTop: 2, fontFamily: 'Inter_400Regular' },
  notifTime: { fontSize: 11, color: COLORS.gray, marginTop: 4, fontFamily: 'Inter_400Regular' },
  notifDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },

  // Profile
  profileSection: { alignItems: 'center', marginBottom: SPACING.xl },
  profileAvatarLarge: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.m },
  profileAvatarText: { fontSize: 40, fontFamily: 'Inter_500Medium', color: COLORS.white },
  profileName: { fontSize: 24, fontFamily: 'Inter_500Medium', color: COLORS.dark },
  profileDesignation: { fontSize: 14, color: COLORS.gray, marginTop: 4, fontFamily: 'Inter_400Regular' },
  profileRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.m },
  profileRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  profileRowLabel: { flex: 1, fontSize: 14, color: COLORS.gray, marginLeft: SPACING.m, fontFamily: 'Inter_400Regular' },
  profileRowValue: { fontSize: 14, fontFamily: 'Inter_500Medium', color: COLORS.dark },

  // Empty State
  emptyState: { alignItems: 'center', padding: SPACING.xl },
  emptyText: { marginTop: SPACING.m, color: COLORS.gray, fontFamily: 'Inter_400Regular' },
});
