import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Platform, Modal, ActivityIndicator, RefreshControl, Image, Pressable
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, SHADOWS, GRADIENTS, TYPOGRAPHY } from '../theme';
import { Feather } from '@expo/vector-icons';
import Button from '../components/ui/Button';
import AnimatedPage from '../components/ui/AnimatedPage';
import ModernHeader from '../components/ui/ModernHeader';
import ActionCard from '../components/ui/ActionCard';
import SectionHeader from '../components/ui/SectionHeader';
import { LinearGradient } from 'expo-linear-gradient';

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
  const [refreshing, setRefreshing] = useState(false);

  // Data Logic
  const scheduleData = todaySchedule.length > 0 ? todaySchedule : classes;
  const teacherName = teacherProfile?.name || user?.name || 'Teacher';
  const firstName = teacherName.split(' ')[0];
  const todaysDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Helper: Get Status
  const getClassStatus = (timeStr) => {
    if (!timeStr) return 'upcoming';
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    const classMinutes = hours * 60 + (minutes || 0);
    const classEndMinutes = classMinutes + 45; // Assume 45 min

    if (currentMinutes >= classMinutes && currentMinutes < classEndMinutes) return 'active';
    if (currentMinutes < classMinutes) return 'upcoming';
    return 'past';
  };

  // Logic: Find Hero Class (First Active or Next Upcoming)
  const heroClass = scheduleData.find(c => {
    const status = getClassStatus(c.time);
    return status === 'active' || status === 'upcoming';
  }) || scheduleData[0]; // Fallback to first if all past

  const handleOpenClass = (cls) => {
    navigation.navigate('Classes', {
      screen: 'ClassWorkspace',
      params: { classId: cls?.classId || cls?.id, className: cls?.name }
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

        <ModernHeader
          title={`Hello, ${firstName}`}
          subtitle={todaysDate}
          userInitials={firstName[0]}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        >
          {/* 1. Hero Section */}
          {heroClass ? (
            <ActionCard
              title={heroClass.name}
              subtitle={heroClass.subject || "No Subject"}
              time={heroClass.time || "Today"}
              location={`Room ${heroClass.room || "N/A"}`}
              onPress={() => handleOpenClass(heroClass)}
              colors={getClassStatus(heroClass.time) === 'active' ? GRADIENTS.primary : GRADIENTS.cool}
              actionLabel={getClassStatus(heroClass.time) === 'active' ? "Resume Class" : "Prepare Class"}
            />
          ) : (
            <ActionCard
              title="All Done!"
              subtitle="No more classes scheduled for today."
              time="Freedom"
              location="Relax"
              onPress={() => { }}
              colors={GRADIENTS.success}
              actionLabel="View Calendar"
            />
          )}

          {/* 2. Quick Actions Grid */}
          <SectionHeader title="Quick Actions" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsContainer}>
            <QuickActionItem
              icon="check-circle"
              label={checkin.checkedIn ? "Check Out" : "Check In"}
              color={checkin.checkedIn ? COLORS.success : COLORS.warning}
              bg={checkin.checkedIn ? '#DCFCE7' : '#FEF3C7'}
              onPress={checkin.checkedIn ? undefined : doCheckin}
            />
            <QuickActionItem
              icon="calendar"
              label="Apply Leave"
              color={COLORS.primary}
              bg={COLORS.primaryLight}
              onPress={() => navigation.navigate('Home', { screen: 'LeaveApplication' })}
            />
            <QuickActionItem
              icon="clock"
              label="Regularize"
              color={COLORS.secondary}
              bg={COLORS.secondaryLight}
              onPress={() => navigation.navigate('Home', { screen: 'RegularizationRequest' })}
            />
            <QuickActionItem
              icon="bell"
              label="Notices"
              color={COLORS.info}
              bg="#DBEAFE"
              onPress={() => setModalVisible(true)}
            />
          </ScrollView>

          {/* 3. Schedule List */}
          <SectionHeader title="Today's Schedule" action="View All" onAction={() => navigation.navigate('Classes')} />
          <View style={styles.scheduleList}>
            {scheduleData.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="coffee" size={48} color={COLORS.gray} />
                <Text style={styles.emptyText}>No classes scheduled</Text>
              </View>
            ) : (
              scheduleData.map((cls, index) => {
                const status = getClassStatus(cls.time);
                const isHero = cls === heroClass;
                if (isHero) return null; // Don't duplicate hero in list

                return (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [styles.scheduleItem, pressed && styles.pressedState]}
                    onPress={() => handleOpenClass(cls)}
                    android_ripple={{ color: COLORS.primaryLight }}
                  >
                    <View style={styles.timeContainer}>
                      <Text style={styles.timeText}>{cls.time ? cls.time.split(' ')[0] : '--'}</Text>
                      <Text style={styles.ampmText}>{cls.time ? cls.time.split(' ')[1] : ''}</Text>
                    </View>

                    <View style={styles.scheduleCard}>
                      <View style={[styles.statusStrip, { backgroundColor: status === 'past' ? COLORS.lightGray : COLORS.primary }]} />
                      <View style={styles.scheduleContent}>
                        <Text style={[styles.scheduleTitle, status === 'past' && styles.dimText]}>{cls.name}</Text>
                        <Text style={styles.scheduleSubject}>{cls.subject}</Text>
                      </View>

                      <View style={styles.scheduleMeta}>
                        {isAttendanceMarked(cls.classId || cls.id) ? (
                          <Feather name="check-circle" size={20} color={COLORS.success} />
                        ) : (
                          <Feather name="chevron-right" size={20} color={COLORS.lightGray} />
                        )}
                      </View>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>

        </ScrollView>
      </SafeAreaView>
    </AnimatedPage>
  );
}

// Sub-component for Quick Actions with Material Ripple
function QuickActionItem({ icon, label, color, bg, onPress }) {
  return (
    <View style={[styles.quickActionWrapper, { backgroundColor: bg }]}>
      <Pressable
        style={({ pressed }) => [styles.quickAction, pressed && { opacity: 0.7 }]}
        android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: true }}
        onPress={onPress}
      >
        <Feather name={icon} size={28} color={color} />
        <Text style={[styles.quickActionLabel, { color: COLORS.dark }]}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.fade }, // Slate 50
  safeArea: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 120 },

  // Quick Actions (M3 Secondary Container Style)
  quickActionsContainer: {
    paddingHorizontal: SPACING.l,
    gap: SPACING.m,
  },
  quickActionWrapper: {
    width: 100,
    height: 100,
    borderRadius: 16, // M3 Large Corner
    overflow: 'hidden',
    marginRight: SPACING.s,
    ...SHADOWS.small,
  },
  quickAction: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.s,
  },
  quickActionLabel: {
    ...TYPOGRAPHY.label,
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
    fontWeight: '600'
  },

  // Schedule
  scheduleList: {
    paddingHorizontal: SPACING.l,
  },
  scheduleItem: {
    flexDirection: 'row',
    marginBottom: SPACING.m,
    alignItems: 'center',
  },
  pressedState: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }]
  },
  timeContainer: {
    width: 60,
    alignItems: 'center',
  },
  timeText: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    color: COLORS.dark,
  },
  ampmText: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
  },
  scheduleCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16, // M3 standard
    height: 72,
    alignItems: 'center',
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  statusStrip: {
    width: 6,
    height: '100%',
  },
  scheduleContent: {
    flex: 1,
    paddingHorizontal: SPACING.m,
    justifyContent: 'center',
  },
  scheduleTitle: {
    ...TYPOGRAPHY.label,
    fontSize: 16,
    color: COLORS.dark,
    fontWeight: '600'
  },
  scheduleSubject: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
  },
  dimText: {
    color: COLORS.gray,
    textDecorationLine: 'line-through',
  },
  scheduleMeta: {
    paddingRight: SPACING.m,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    opacity: 0.5
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    marginTop: 12
  },
});
