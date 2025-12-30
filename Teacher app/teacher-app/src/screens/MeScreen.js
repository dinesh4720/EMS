import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Platform, Modal, Alert
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, SHADOWS } from '../theme';
import { Feather } from '@expo/vector-icons';
import AnimatedPage from '../components/ui/AnimatedPage';
import Card from '../components/ui/Card';
import SectionHeader from '../components/ui/SectionHeader';

export default function MeScreen({ navigation }) {
  const { checkin, doCheckin, doCheckout, leaveBalance, salarySlips, notifications, markNotificationRead, getUnreadNotificationCount } = useApp();
  const { user, logout } = useAuth();
  const [activeModal, setActiveModal] = useState(null); // 'salary', 'notifications'

  const unreadCount = getUnreadNotificationCount();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout }
    ]);
  };

  const StatItem = ({ label, value, color }) => (
    <View style={[styles.statItem, { backgroundColor: color + '15' }]}>
      <Text style={[styles.statVal, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const MenuItem = ({ icon, title, subtitle, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIconBox}>
        <Feather name={icon} size={20} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSub}>{subtitle}</Text>}
      </View>
      <Feather name="chevron-right" size={20} color={COLORS.lightGray} />
    </TouchableOpacity>
  );

  return (
    <AnimatedPage style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>

        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <Feather name="x" size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={handleLogout}>
            <Feather name="log-out" size={24} color={COLORS.danger} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

          <View style={styles.profileSection}>
            <View style={styles.avatarBig}>
              <Text style={styles.avatarText}>{user?.name?.[0] || 'T'}</Text>
            </View>
            <Text style={styles.name}>{user?.name || 'Teacher'}</Text>
            <Text style={styles.role}>{user?.designation || 'Class Teacher'}</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatItem label="Present" value="22" color={COLORS.success} />
            <StatItem label="Leaves" value={leaveBalance.taken.casual} color={COLORS.warning} />
            <StatItem label="Balance" value={leaveBalance.casual} color={COLORS.primary} />
          </View>

          {/* Check In Action */}
          <SectionHeader title="Today's Status" />
          <View style={[styles.checkinCard, checkin.checkedIn && styles.activeCard]}>
            <View>
              <Text style={styles.checkinTitle}>{checkin.checkedIn ? "You are On Duty" : "You are Off Duty"}</Text>
              <Text style={styles.checkinSub}>{checkin.checkedIn ? `Since ${checkin.time}` : "Tap to check-in"}</Text>
            </View>
            <TouchableOpacity
              style={[styles.checkinBtn, checkin.checkedIn ? styles.checkOutStyle : styles.checkInStyle]}
              onPress={checkin.checkedIn ? doCheckout : doCheckin}
            >
              <Text style={styles.btnText}>{checkin.checkedIn ? "Check Out" : "Check In"}</Text>
            </TouchableOpacity>
          </View>

          {/* Menu */}
          <View style={styles.menuList}>
            <MenuItem icon="calendar" title="Leave & Regularization" subtitle="Manage your leaves" onPress={() => navigation.navigate('LeaveApplication')} />
            <MenuItem icon="dollar-sign" title="Salary & Payslips" subtitle="View monthly slips" onPress={() => setActiveModal('salary')} />
            <MenuItem icon="bell" title="Notifications" subtitle={`${unreadCount} unread alerts`} onPress={() => setActiveModal('notifications')} />
            <MenuItem icon="user" title="Edit Profile" onPress={() => navigation.navigate('ProfileEdit')} />
          </View>

          <Text style={styles.version}>Teacher App v1.0.2</Text>

        </ScrollView>

        {/* MODALS (Simplified for brevity, but functional) */}
        {/* Placeholder for modal content */}

      </SafeAreaView>
    </AnimatedPage>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' }, // Light blue tint
  container: { padding: SPACING.l, paddingBottom: 100 },

  header: { flexDirection: 'row', padding: SPACING.m, alignItems: 'center' },
  closeBtn: { padding: 8, backgroundColor: COLORS.fade, borderRadius: 20 },

  profileSection: { alignItems: 'center', marginBottom: 32 },
  avatarBig: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 4, borderColor: '#FFF', ...SHADOWS.medium },
  avatarText: { fontSize: 40, color: '#FFF', fontFamily: 'Inter_600SemiBold' },
  name: { fontSize: 24, fontFamily: 'Inter_700Bold', color: COLORS.dark },
  role: { fontSize: 16, color: COLORS.gray, fontFamily: 'Inter_500Medium' },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  statItem: { flex: 1, padding: 16, borderRadius: 20, alignItems: 'center' },
  statVal: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  statLabel: { fontSize: 13, color: COLORS.gray, fontWeight: '500' },

  checkinCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.fade, padding: 20, borderRadius: 24, marginBottom: 32 },
  activeCard: { backgroundColor: '#ECFDF5' },
  checkinTitle: { fontSize: 16, fontWeight: '700', color: COLORS.dark },
  checkinSub: { fontSize: 14, color: COLORS.gray },
  checkinBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 100 },
  checkInStyle: { backgroundColor: COLORS.primary },
  checkOutStyle: { backgroundColor: COLORS.danger },
  btnText: { color: '#FFF', fontWeight: '600' },

  menuList: { gap: 12, marginBottom: 32 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: COLORS.fade },
  menuIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  menuTitle: { fontSize: 16, fontWeight: '600', color: COLORS.dark },
  menuSub: { fontSize: 13, color: COLORS.gray },

  version: { textAlign: 'center', color: COLORS.lightGray, paddingBottom: 20 }
});
