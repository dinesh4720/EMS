import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import {
  ArrowLeft,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
  BookOpen,
  User,
  Award,
  TrendingUp,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

const StudentDetailScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, typography, spacing, shape, isDark } = useTheme();
  const { student } = route.params;

  const getInitials = (name) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getAvatarColor = (name) => {
    const avatarColors = ['#4285F4', '#EA4335', '#34A853', '#FBBC04'];
    const index = name.charCodeAt(0) % avatarColors.length;
    return avatarColors[index];
  };

  const handleCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`tel:${student.phone}`);
  };

  const handleEmail = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`mailto:${student.email}`);
  };

  const avatarColor = getAvatarColor(student.name);

  // Mock performance data
  const performance = {
    attendance: '94%',
    averageGrade: 'A',
    rank: '5th',
    totalMarks: '875/1000',
  };

  const InfoCard = ({ icon: Icon, label, value, color }) => (
    <View
      style={[
        styles.infoCard,
        {
          backgroundColor: colors.surfaceContainer,
          borderRadius: shape.cornerLarge,
        },
      ]}
    >
      <View style={[styles.infoIconWrap, { backgroundColor: color + '20', borderRadius: shape.cornerMedium }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginTop: spacing.sm }]}>
        {label}
      </Text>
      <Text style={[typography.titleMedium, { color: colors.onSurface, marginTop: 2 }]}>
        {value}
      </Text>
    </View>
  );

  const DetailRow = ({ icon: Icon, label, value, onPress }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.detailRow,
        {
          backgroundColor: pressed ? colors.surfaceContainerHigh : colors.surfaceContainer,
          borderRadius: shape.cornerMedium,
        },
      ]}
      disabled={!onPress}
    >
      <View style={[styles.detailIconWrap, { backgroundColor: colors.surfaceContainerHigh, borderRadius: shape.cornerSmall }]}>
        <Icon size={18} color={colors.onSurfaceVariant} />
      </View>
      <View style={styles.detailContent}>
        <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>{label}</Text>
        <Text style={[typography.bodyLarge, { color: colors.onSurface, marginTop: 2 }]}>{value}</Text>
      </View>
      {onPress && (
        <View style={[styles.actionBadge, { backgroundColor: '#4285F4' + '20', borderRadius: shape.pill }]}>
          <Text style={[typography.labelSmall, { color: '#4285F4' }]}>{t('screens.open')}</Text>
        </View>
      )}
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backButton,
            {
              backgroundColor: pressed ? colors.surfaceContainerHigh : colors.surfaceContainer,
              borderRadius: shape.pill,
            },
          ]}
        >
          <ArrowLeft size={24} color={colors.onSurface} />
        </Pressable>
        <Text style={[typography.titleLarge, { color: colors.onSurface, flex: 1, marginLeft: 12 }]}>
          Student Details
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={[styles.profileSection, { backgroundColor: colors.surfaceContainer, borderRadius: shape.cornerLarge }]}>
          <View style={[styles.avatarLarge, { backgroundColor: avatarColor, borderRadius: shape.pill }]}>
            <Text style={styles.avatarLargeText}>{getInitials(student.name)}</Text>
          </View>
          <Text style={[typography.headlineMedium, { color: colors.onSurface, marginTop: spacing.md }]}>
            {student.name}
          </Text>
          <Text style={[typography.bodyLarge, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
            Class {student.class} • Roll No. {student.rollNo}
          </Text>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Pressable
              onPress={handleCall}
              style={({ pressed }) => [
                styles.quickActionButton,
                {
                  backgroundColor: pressed ? '#34A853' : '#34A853' + '20',
                  borderRadius: shape.cornerMedium,
                },
              ]}
            >
              <Phone size={20} color={pressed ? '#FFFFFF' : '#34A853'} />
              <Text style={[typography.labelMedium, { color: pressed ? '#FFFFFF' : '#34A853', marginLeft: 6 }]}>
                Call
              </Text>
            </Pressable>
            <Pressable
              onPress={handleEmail}
              style={({ pressed }) => [
                styles.quickActionButton,
                {
                  backgroundColor: pressed ? '#4285F4' : '#4285F4' + '20',
                  borderRadius: shape.cornerMedium,
                },
              ]}
            >
              <Mail size={20} color={pressed ? '#FFFFFF' : '#4285F4'} />
              <Text style={[typography.labelMedium, { color: pressed ? '#FFFFFF' : '#4285F4', marginLeft: 6 }]}>
                Email
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Performance Cards */}
        <Text style={[typography.titleMedium, { color: colors.onSurface, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
          Performance
        </Text>
        <View style={styles.performanceGrid}>
          <InfoCard icon={TrendingUp} label={t('screens.attendance1')} value={performance.attendance} color="#34A853" />
          <InfoCard icon={Award} label={t('screens.avgGrade')} value={performance.averageGrade} color="#4285F4" />
          <InfoCard icon={GraduationCap} label={t('screens.classRank')} value={performance.rank} color="#FBBC04" />
          <InfoCard icon={BookOpen} label={t('screens.totalMarks1')} value={performance.totalMarks} color="#EA4335" />
        </View>

        {/* Contact Details */}
        <Text style={[typography.titleMedium, { color: colors.onSurface, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
          Contact Information
        </Text>
        <View style={[styles.detailsSection, { backgroundColor: colors.surfaceContainer, borderRadius: shape.cornerLarge }]}>
          <DetailRow icon={Phone} label={t('screens.phone1')} value={student.phone} onPress={handleCall} />
          <DetailRow icon={Mail} label={t('screens.email1')} value={student.email} onPress={handleEmail} />
        </View>

        {/* Academic Details */}
        <Text style={[typography.titleMedium, { color: colors.onSurface, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
          Academic Details
        </Text>
        <View style={[styles.detailsSection, { backgroundColor: colors.surfaceContainer, borderRadius: shape.cornerLarge }]}>
          <DetailRow icon={GraduationCap} label={t('screens.class')} value={student.class} />
          <DetailRow icon={User} label={t('screens.rollNumber')} value={student.rollNo} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  avatarLarge: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
  },
  infoIconWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsSection: {
    padding: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  detailIconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});

export default StudentDetailScreen;
