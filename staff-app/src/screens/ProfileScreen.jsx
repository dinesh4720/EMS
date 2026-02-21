import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { classesApi } from '../services/api';

const SETTING_SECTIONS = [
  {
    title: 'Work',
    items: [
      { id: 'payslips', icon: '💰', label: 'My Payslips', badge: null },
      { id: 'leaves', icon: '📅', label: 'Leave Requests', badge: null },
    ],
  },
  {
    title: 'Account',
    items: [
      { id: 'edit', icon: '✏️', label: 'Edit Profile', badge: null },
      { id: 'password', icon: '🔐', label: 'Change Password', badge: null },
      { id: 'notifications', icon: '🔔', label: 'Notifications', badge: '3' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { id: 'theme', icon: '🎨', label: 'Appearance', badge: null },
      { id: 'language', icon: '🌐', label: 'Language', badge: 'EN' },
      { id: 'privacy', icon: '🔒', label: 'Privacy', badge: null },
    ],
  },
  {
    title: 'Support',
    items: [
      { id: 'help', icon: '❓', label: 'Help Center', badge: null },
      { id: 'feedback', icon: '💬', label: 'Send Feedback', badge: null },
      { id: 'about', icon: 'ℹ️', label: 'About', badge: 'v1.0.0' },
    ],
  },
];

const SettingItem = ({ item, onPress, theme }) => {
  const { colors, typography } = theme;
  
  return (
    <TouchableOpacity
      style={[
        styles.settingItem,
        { borderBottomColor: colors.outlineVariant }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <Text style={styles.settingIcon}>{item.icon}</Text>
        <Text style={[styles.settingLabel, typography.body, { color: colors.onSurface }]}>
          {item.label}
        </Text>
      </View>
      <View style={styles.settingRight}>
        {item.badge && (
          <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.badgeText, typography.labelSmall, { color: colors.primary }]}>
              {item.badge}
            </Text>
          </View>
        )}
        <Text style={[styles.chevron, { color: colors.onSurfaceVariant }]}>›</Text>
      </View>
    </TouchableOpacity>
  );
};

const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const { colors, typography, spacing, shape, isDark, toggleTheme } = theme;

  // Stats state
  const [stats, setStats] = useState({
    classesCount: 0,
    studentsCount: 0,
    rating: null,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // Fetch staff statistics
  useEffect(() => {
    if (user?.id) {
      fetchStaffStats();
    }
  }, [user?.id]);

  const fetchStaffStats = async () => {
    setStatsLoading(true);
    try {
      // Get staff classes to calculate stats
      const classes = await classesApi.getStaffClasses(user.id);
      let totalStudents = 0;
      let classesCount = classes?.length || 0;

      // Fetch students for each class to get total count
      if (classes && classes.length > 0) {
        const studentCounts = await Promise.all(
          classes.map(async (cls) => {
            try {
              const students = await classesApi.getClassStudents(cls.id || cls._id);
              return students?.length || 0;
            } catch (err) {
              console.error(`Error fetching students for class ${cls.id}:`, err);
              return 0;
            }
          })
        );
        totalStudents = studentCounts.reduce((sum, count) => sum + count, 0);
      }

      setStats({
        classesCount,
        studentsCount: totalStudents,
        rating: null, // Rating endpoint to be added to backend if needed
      });
    } catch (error) {
      console.error('Error fetching staff stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Format number for display (e.g., 1200 -> 1.2K)
  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const handleSettingPress = (itemId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    switch (itemId) {
      case 'payslips':
        navigation.navigate('Payslips');
        break;
      case 'leaves':
        navigation.navigate('LeaveRequests');
        break;
      case 'edit':
        navigation.navigate('EditProfile');
        break;
      case 'password':
        navigation.navigate('ChangePassword');
        break;
      case 'notifications':
        Alert.alert('Notifications', 'Notification settings coming soon!');
        break;
      case 'theme':
        toggleTheme();
        break;
      case 'language':
        Alert.alert('Language', 'Language settings coming soon!');
        break;
      case 'privacy':
        Alert.alert('Privacy', 'Privacy settings coming soon!');
        break;
      case 'help':
        Alert.alert('Help Center', 'Help center coming soon!');
        break;
      case 'feedback':
        Alert.alert('Send Feedback', 'Feedback feature coming soon!');
        break;
      case 'about':
        Alert.alert('About', 'EMS Staff App v1.0.0\nA school management application for staff members.');
        break;
      default:
        break;
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            logout();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.surface }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
        <Text style={[typography.largeTitle, { color: colors.onSurface }]}>Profile</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[
          styles.profileCard,
          { 
            backgroundColor: isDark ? colors.surfaceContainer : colors.surface,
            ...theme.shadows.medium,
          }
        ]}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
            {user?.picture || user?.photo ? (
              <Image
                source={{ uri: user.picture || user.photo }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatar}>
                {user?.name?.charAt(0) || 'S'}
              </Text>
            )}
          </View>
          <Text style={[typography.title2, { color: colors.onSurface, marginBottom: 4 }]}>
            {user?.name || 'Staff Member'}
          </Text>
          <Text style={[typography.subheadline, { color: colors.primary, fontWeight: '600', marginBottom: 4 }]}>
            {user?.role || 'Teacher'}
          </Text>
          <Text style={[typography.subheadline, { color: colors.onSurfaceVariant }]}>
            {user?.email || 'staff@school.edu'}
          </Text>

          <View style={[styles.profileStats, { borderTopColor: colors.outlineVariant }]}>
            {statsLoading ? (
              <View style={styles.profileStat}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : (
              <>
                <View style={styles.profileStat}>
                  <Text style={[typography.title3, { color: colors.onSurface }]}>
                    {stats.classesCount}
                  </Text>
                  <Text style={[typography.caption1, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
                    Classes
                  </Text>
                </View>
                <View style={[styles.profileStatDivider, { backgroundColor: colors.outlineVariant }]} />
                <View style={styles.profileStat}>
                  <Text style={[typography.title3, { color: colors.onSurface }]}>
                    {formatNumber(stats.studentsCount)}
                  </Text>
                  <Text style={[typography.caption1, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
                    Students
                  </Text>
                </View>
                {stats.rating !== null && (
                  <>
                    <View style={[styles.profileStatDivider, { backgroundColor: colors.outlineVariant }]} />
                    <View style={styles.profileStat}>
                      <Text style={[typography.title3, { color: colors.onSurface }]}>
                        {stats.rating}
                      </Text>
                      <Text style={[typography.caption1, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
                        Rating
                      </Text>
                    </View>
                  </>
                )}
              </>
            )}
          </View>
        </View>

        {SETTING_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[typography.labelLarge, { color: colors.onSurfaceVariant, marginBottom: spacing.sm, marginLeft: spacing.xs, textTransform: 'uppercase' }]}>
              {section.title}
            </Text>
            <View style={[
              styles.sectionContent,
              { 
                backgroundColor: isDark ? colors.surfaceContainer : colors.surface,
                borderRadius: shape.cornerMedium,
                overflow: 'hidden',
              }
            ]}>
              {section.items.map((item, index) => (
                <SettingItem
                  key={item.id}
                  item={item}
                  onPress={() => handleSettingPress(item.id)}
                  theme={theme}
                />
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[
            styles.logoutButton,
            { backgroundColor: colors.errorContainer }
          ]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={[typography.headline, { color: colors.error }]}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatar: {
    fontSize: 36,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 0.5,
    width: '100%',
  },
  profileStat: {
    alignItems: 'center',
    flex: 1,
  },
  profileStatDivider: {
    width: 1,
    height: 30,
  },
  section: {
    marginBottom: 24,
  },
  sectionContent: {
    borderWidth: 0,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  settingLabel: {
    fontWeight: '400',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  badgeText: {
    fontWeight: '600',
  },
  chevron: {
    fontSize: 20,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  logoutIcon: {
    fontSize: 18,
    marginRight: 8,
  },
});

export default ProfileScreen;
