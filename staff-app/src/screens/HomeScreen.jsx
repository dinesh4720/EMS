import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  interpolate,
  Extrapolation,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import {
  Bell,
  MessageCircle,
  CalendarDays,
  GraduationCap,
  Moon,
  Sun,
  ChevronRight,
  Clock,
  Coffee,
  BookOpen,
  CheckCircle,
  FileText,
  Users,
  MapPin,
  Sparkles,
} from 'lucide-react-native';

import { BottomSheet, AttendanceCard, ExamCard } from '../components';
import { useAuth } from '../context/AuthContext';
import { useExamContext } from '../context/ExamContext';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import { staffApi } from '../services/api';
import { useTranslation } from 'react-i18next';

// ── M3 Motion constants ─────────────────────────────────────────
const SPRING_SNAPPY = { damping: 15, stiffness: 180 };       // press feedback
const SPRING_EMPHASIZED = { damping: 18, stiffness: 140 };   // card entrances
const SPRING_GENTLE = { damping: 22, stiffness: 90 };        // slow reveals
const SPRING_BOUNCE = { damping: 12, stiffness: 200 };       // playful bounce

// ── Timetable helpers ───────────────────────────────────────────
const parseTime = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const { t } = useTranslation();
const nowMins = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
const getCurrentIdx = (tt) => {
  if (!tt?.length) return -1;
  const n = nowMins();
  return tt.findIndex((i) => n >= parseTime(i.startTime) && n <= parseTime(i.endTime));
};
const getNextIdx = (tt) => {
  if (!tt?.length) return -1;
  const n = nowMins();
  return tt.findIndex((i) => parseTime(i.startTime) > n);
};
const getProgress = (item) => {
  if (!item) return 0;
  const n = nowMins(), s = parseTime(item.startTime), e = parseTime(item.endTime);
  if (n < s) return 0; if (n > e) return 1;
  return (n - s) / (e - s);
};
const getMinsLeft = (item) => item ? Math.max(0, parseTime(item.endTime) - nowMins()) : 0;
const getDoneCount = (tt) => {
  if (!tt?.length) return 0;
  const n = nowMins();
  return tt.filter((i) => n > parseTime(i.endTime)).length;
};

// ═══════════════════════════════════════════════════════════════════
//  EXPRESSIVE M3 PRIMITIVES
// ═══════════════════════════════════════════════════════════════════

// ── SpringPressable: every tap has physics ──────────────────────
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SpringPress = ({ children, onPress, style, scale = 0.97, haptic = true, ...rest }) => {
  const pressed = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressed.value }],
  }));
  return (
    <AnimatedPressable
      onPressIn={() => { pressed.value = withSpring(scale, SPRING_SNAPPY); }}
      onPressOut={() => { pressed.value = withSpring(1, SPRING_SNAPPY); }}
      onPress={() => {
        if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      style={[animStyle, style]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
};

// ── Pulsing dot with spring ─────────────────────────────────────
const PulseDot = ({ color, size = 8 }) => {
  const s = useSharedValue(1);
  useEffect(() => {
    s.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      ), -1, false,
    );
  }, []);
  const a = useAnimatedStyle(() => ({ opacity: s.value }));
  return <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }, a]} />;
};

// ── Spring-animated progress bar ────────────────────────────────
const SpringProgress = ({ progress, trackColor, fillColor, borderRadius = 4, height = 6, style }) => {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withSpring(progress, { damping: 20, stiffness: 80 });
  }, [progress]);
  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.round(w.value * 100)}%`,
  }));
  return (
    <View style={[{ height, borderRadius, backgroundColor: trackColor, overflow: 'hidden' }, style]}>
      <Animated.View style={[{ height, borderRadius, backgroundColor: fillColor }, fillStyle]} />
    </View>
  );
};

// ── Stagger-in wrapper with spring physics ──────────────────────
const SpringIn = ({ children, delay = 0, from = 'bottom', style }) => {
  const opacity = useSharedValue(0);
  const translate = useSharedValue(from === 'bottom' ? 24 : from === 'top' ? -16 : 0);
  const sc = useSharedValue(0.92);

  useEffect(() => {
    const t = setTimeout(() => {
      opacity.value = withSpring(1, SPRING_GENTLE);
      translate.value = withSpring(0, SPRING_EMPHASIZED);
      sc.value = withSpring(1, SPRING_EMPHASIZED);
    }, delay);
    return () => clearTimeout(t);
  }, [delay]);

  const a = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translate.value },
      { scale: sc.value },
    ],
  }));

  return <Animated.View style={[a, style]}>{children}</Animated.View>;
};

// ── M3 Assist Chip ──────────────────────────────────────────────
const AssistChip = ({ label, icon: Icon, color, onPress, shape }) => (
  <SpringPress
    onPress={onPress}
    scale={0.95}
    style={[
      styles.chip,
      {
        borderRadius: shape.pill,
        borderColor: color + '30',
        borderWidth: 1,
      },
    ]}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    <Icon size={16} color={color} />
    <Text style={[styles.chipLabel, { color }]}>{label}</Text>
  </SpringPress>
);

// ═══════════════════════════════════════════════════════════════════
//  HOME SCREEN
// ═══════════════════════════════════════════════════════════════════
const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const { user } = useAuth();
  const { unreadCount } = useChat();
  const { exams, loading: examsLoading, fetchExams } = useExamContext();
  const { colors, typography, spacing, shape, shadows, isDark, toggleTheme } = useTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── scroll-driven elevation (M3 lift-on-scroll) ──────────────
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => { scrollY.value = e.contentOffset.y; },
  });
  const topBarShadow = useAnimatedStyle(() => {
    const elev = interpolate(scrollY.value, [0, 40], [0, 1], Extrapolation.CLAMP);
    return {
      shadowOpacity: elev * 0.08,
      shadowRadius: elev * 4,
      elevation: elev * 2,
    };
  });

  // ── data fetching ─────────────────────────────────────────────
  const fetchTimetable = useCallback(async () => {
    if (!user?.id) return;
    try {
      setError(null);
      const data = await staffApi.getTodayTimetable(user.id);
      setTimetable(data || []);
    } catch (err) {
      console.error('Error fetching timetable:', err);
      setError('Failed to load schedule');
      setTimetable([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchTimetable(); fetchExams(); }, [fetchTimetable, fetchExams]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([fetchTimetable(), fetchExams()]);
    setRefreshing(false);
  }, [fetchTimetable, fetchExams]);

  const handleClassPress = useCallback((item) => {
    setSelectedClass(item);
    setSheetVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  // ── derived state ─────────────────────────────────────────────
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const greeting = useMemo(() => {
    const h = today.getHours();
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    return 'Evening';
  }, []);

  const currentIdx = getCurrentIdx(timetable);
  const nextIdx = getNextIdx(timetable);
  const completed = getDoneCount(timetable);
  const remaining = timetable.length - completed - (currentIdx >= 0 ? 1 : 0);
  const totalStudents = useMemo(() => timetable.reduce((s, c) => s + (c.students || 0), 0), [timetable]);

  const staffName = user?.name?.split(' ')[0] || 'Teacher';
  const initials = (user?.name || staffName).split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('');

  const upcomingExams = useMemo(
    () => (exams || []).filter((e) => e.status === 'scheduled' || e.status === 'ongoing').slice(0, 3),
    [exams],
  );

  const px = spacing.x3;
  const focusClass = currentIdx >= 0 ? timetable[currentIdx] : null;
  const nextClass = nextIdx >= 0 ? timetable[nextIdx] : null;
  const isLive = currentIdx >= 0;
  const allDone = !isLive && nextIdx < 0 && timetable.length > 0;

  // ═════════════════════════════════════════════════════════════════
  //  RENDER
  // ═════════════════════════════════════════════════════════════════
  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>

      {/* ── LIFT-ON-SCROLL TOP BAR (M3 TopAppBar) ─────────────── */}
      <Animated.View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + 8,
            paddingHorizontal: px,
            backgroundColor: colors.surface,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
          },
          topBarShadow,
        ]}
      >
        <SpringPress onPress={() => nav.navigate('ProfileTab')} scale={0.9}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryContainer, borderRadius: shape.pill }]}>
            <Text style={[styles.avatarText, { color: colors.onPrimaryContainer }]}>{initials || 'S'}</Text>
          </View>
        </SpringPress>
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={[typography.titleMedium, { color: colors.onSurface }]} numberOfLines={1}>
            {greeting}, {staffName}
          </Text>
          <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>{formattedDate}</Text>
        </View>
        <View style={styles.topBarActions}>
          <SpringPress
            onPress={toggleTheme}
            scale={0.85}
            style={[styles.iconBtn, { backgroundColor: colors.surfaceContainer, borderRadius: shape.pill }]}
            accessibilityLabel={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark
              ? <Sun size={18} color={colors.onSurfaceVariant} />
              : <Moon size={18} color={colors.onSurfaceVariant} />}
          </SpringPress>
          <View>
            <SpringPress
              onPress={() => nav.navigate('NotificationsTab')}
              scale={0.85}
              style={[styles.iconBtn, { backgroundColor: colors.surfaceContainer, borderRadius: shape.pill }]}
              accessibilityLabel="Notifications"
            >
              <Bell size={18} color={colors.onSurfaceVariant} />
            </SpringPress>
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.error, borderColor: colors.surface }]}>
                <Text style={[styles.badgeText, { color: colors.onError }]}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>

      {/* ── SCROLLABLE BODY ───────────────────────────────────── */}
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} progressViewOffset={80} />
        }
      >

        {/* ── FOCUS CARD (M3 Elevated Card, cornerXLarge) ────── */}
        {!loading && (isLive || nextClass || allDone) && (
          <SpringIn delay={80} style={{ paddingHorizontal: px, marginTop: spacing.md }}>

            {/* LIVE state */}
            {isLive && focusClass && (() => {
              const prog = getProgress(focusClass);
              const mins = getMinsLeft(focusClass);
              return (
                <SpringPress
                  onPress={() => handleClassPress(focusClass)}
                  scale={0.975}
                  style={[
                    styles.focusCard,
                    shadows.medium,
                    { backgroundColor: colors.primaryContainer, borderRadius: shape.cornerXLarge },
                  ]}
                >
                  <View style={styles.focusTop}>
                    <View style={[styles.livePill, { backgroundColor: colors.primary, borderRadius: shape.pill }]}>
                      <PulseDot color={colors.onPrimary} size={7} />
                      <Text style={[typography.labelSmall, { color: colors.onPrimary, marginLeft: 5 }]}>{t('screens.lIVE')}</Text>
                    </View>
                    <Text style={[typography.labelSmall, { color: colors.onPrimaryContainer, opacity: 0.5 }]}>
                      {focusClass.startTime} – {focusClass.endTime}
                    </Text>
                  </View>

                  <Text style={[typography.headlineMedium, { color: colors.onPrimaryContainer, marginTop: spacing.md }]} numberOfLines={1}>
                    {focusClass.subject}
                  </Text>

                  <View style={[styles.metaRow, { marginTop: spacing.xs, gap: spacing.md }]}>
                    <View style={styles.metaItem}>
                      <BookOpen size={13} color={colors.onPrimaryContainer} style={{ opacity: 0.6 }} />
                      <Text style={[typography.bodySmall, { color: colors.onPrimaryContainer, opacity: 0.7, marginLeft: 4 }]}>{focusClass.class}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <MapPin size={13} color={colors.onPrimaryContainer} style={{ opacity: 0.6 }} />
                      <Text style={[typography.bodySmall, { color: colors.onPrimaryContainer, opacity: 0.7, marginLeft: 4 }]}>{focusClass.room}</Text>
                    </View>
                    {!!focusClass.students && (
                      <View style={styles.metaItem}>
                        <Users size={13} color={colors.onPrimaryContainer} style={{ opacity: 0.6 }} />
                        <Text style={[typography.bodySmall, { color: colors.onPrimaryContainer, opacity: 0.7, marginLeft: 4 }]}>{focusClass.students}</Text>
                      </View>
                    )}
                  </View>

                  <SpringProgress
                    progress={prog}
                    trackColor={colors.primary + '25'}
                    fillColor={colors.primary}
                    borderRadius={3}
                    height={5}
                    style={{ marginTop: spacing.lg }}
                  />
                  <Text style={[typography.labelMedium, { color: colors.onPrimaryContainer, alignSelf: 'flex-end', marginTop: 5 }]}>
                    {mins} min left
                  </Text>
                </SpringPress>
              );
            })()}

            {/* NEXT state */}
            {!isLive && nextClass && (() => {
              const minsUntil = parseTime(nextClass.startTime) - nowMins();
              return (
                <SpringPress
                  onPress={() => handleClassPress(nextClass)}
                  scale={0.975}
                  style={[
                    styles.focusCard,
                    shadows.small,
                    { backgroundColor: colors.secondaryContainer, borderRadius: shape.cornerXLarge },
                  ]}
                >
                  <View style={styles.focusTop}>
                    <View style={[styles.livePill, { backgroundColor: colors.secondary, borderRadius: shape.pill }]}>
                      <Clock size={11} color={colors.onSecondary} />
                      <Text style={[typography.labelSmall, { color: colors.onSecondary, marginLeft: 4 }]}>{t('screens.uPNext')}</Text>
                    </View>
                    <View style={[styles.countdownPill, { backgroundColor: colors.secondary + '20', borderRadius: shape.pill }]}>
                      <Sparkles size={11} color={colors.onSecondaryContainer} />
                      <Text style={[typography.labelMedium, { color: colors.onSecondaryContainer, marginLeft: 3 }]}>in {minsUntil}m</Text>
                    </View>
                  </View>
                  <Text style={[typography.headlineSmall, { color: colors.onSecondaryContainer, marginTop: spacing.sm }]} numberOfLines={1}>
                    {nextClass.subject}
                  </Text>
                  <Text style={[typography.bodySmall, { color: colors.onSecondaryContainer, opacity: 0.65, marginTop: 3 }]}>
                    {nextClass.class} · {nextClass.room} · {nextClass.startTime}
                  </Text>
                </SpringPress>
              );
            })()}

            {/* ALL DONE state */}
            {allDone && (
              <View style={[
                styles.focusCard,
                shadows.small,
                { backgroundColor: colors.tertiaryContainer, borderRadius: shape.cornerXLarge, alignItems: 'center', paddingVertical: spacing.xl },
              ]}>
                <Coffee size={28} color={colors.onTertiaryContainer} style={{ opacity: 0.7 }} />
                <Text style={[typography.titleMedium, { color: colors.onTertiaryContainer, marginTop: spacing.sm }]}>
                  You're done for today
                </Text>
                <Text style={[typography.bodySmall, { color: colors.onTertiaryContainer, opacity: 0.6, marginTop: 2 }]}>
                  {completed} class{completed !== 1 ? 'es' : ''} completed
                </Text>
              </View>
            )}
          </SpringIn>
        )}

        {/* ── ASSIST CHIPS (M3 horizontal chip row) ──────────── */}
        {!loading && timetable.length > 0 && (
          <SpringIn delay={160} style={{ marginTop: spacing.lg }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: px, gap: spacing.sm }}
            >
              <AssistChip
                label={`${timetable.length} Classes`}
                icon={CalendarDays}
                color={colors.primary}
                onPress={() => nav.navigate('ClassesTab')}
                shape={shape}
              />
              <AssistChip
                label={`${totalStudents} Students`}
                icon={GraduationCap}
                color={colors.secondary}
                onPress={() => nav.navigate('StudentsTab')}
                shape={shape}
              />
              {upcomingExams.length > 0 && (
                <AssistChip
                  label={`${upcomingExams.length} Exam${upcomingExams.length !== 1 ? 's' : ''}`}
                  icon={FileText}
                  color={colors.tertiary}
                  onPress={() => nav.navigate('ExamsTab')}
                  shape={shape}
                />
              )}
              {unreadCount > 0 && (
                <AssistChip
                  label={`${unreadCount} Unread`}
                  icon={MessageCircle}
                  color={colors.error}
                  onPress={() => nav.navigate('ChatTab')}
                  shape={shape}
                />
              )}
            </ScrollView>
          </SpringIn>
        )}

        {/* ── BENTO TILES (M3 Filled Cards, cornerLarge) ─────── */}
        <SpringIn delay={220} style={{ paddingHorizontal: px, marginTop: spacing.x4 }}>
          <View style={[styles.bentoGrid, { gap: spacing.sm }]}>
            {[
              { key: 'classes', icon: CalendarDays, val: timetable.length, label: 'Classes', sub: completed > 0 ? `${completed} done` : 'today', accent: colors.primaryContainer, accentFg: colors.onPrimaryContainer, nav: 'ClassesTab' },
              { key: 'students', icon: GraduationCap, val: totalStudents, label: 'Students', sub: `${timetable.length} classes`, accent: colors.secondaryContainer, accentFg: colors.onSecondaryContainer, nav: 'StudentsTab' },
              { key: 'exams', icon: FileText, val: upcomingExams.length, label: 'Exams', sub: upcomingExams[0]?.name || upcomingExams[0]?.subjectName || 'none', accent: colors.tertiaryContainer, accentFg: colors.onTertiaryContainer, nav: 'ExamsTab' },
              { key: 'messages', icon: MessageCircle, val: unreadCount || 0, label: 'Messages', sub: unreadCount > 0 ? 'unread' : 'all clear', accent: colors.errorContainer, accentFg: colors.onErrorContainer, nav: 'ChatTab' },
            ].map((tile, idx) => {
              const Icon = tile.icon;
              return (
                <SpringPress
                  key={tile.key}
                  onPress={() => nav.navigate(tile.nav)}
                  scale={0.95}
                  style={[
                    styles.bentoTile,
                    { backgroundColor: colors.surfaceContainer, borderRadius: shape.cornerLarge },
                  ]}
                >
                  <View style={[styles.tileIcon, { backgroundColor: tile.accent, borderRadius: shape.cornerSmall }]}>
                    <Icon size={16} color={tile.accentFg} />
                  </View>
                  <Text style={[styles.tileVal, { color: colors.onSurface }]}>
                    {loading ? '–' : tile.val}
                  </Text>
                  <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>{tile.label}</Text>
                  <Text style={[typography.labelSmall, { color: tile.accentFg, marginTop: 1, opacity: 0.8 }]} numberOfLines={1}>
                    {tile.sub}
                  </Text>
                </SpringPress>
              );
            })}
          </View>
        </SpringIn>

        {/* ── SCHEDULE TIMELINE (M3 Outlined Card) ───────────── */}
        <SpringIn delay={300} style={{ paddingHorizontal: px, marginTop: spacing.x4 }}>
          <View style={styles.sectionHead}>
            <Text style={[typography.titleMedium, { color: colors.onSurface }]}>
              {isLive ? 'Schedule' : "Today's Schedule"}
            </Text>
            {timetable.length > 0 && (
              <SpringPress onPress={() => nav.navigate('ClassesTab')} scale={0.95}
                style={[styles.seeAll, { borderRadius: shape.pill }]}>
                <Text style={[typography.labelLarge, { color: colors.primary }]}>{t('screens.seeAll')}</Text>
                <ChevronRight size={16} color={colors.primary} />
              </SpringPress>
            )}
          </View>

          <View style={[
            styles.scheduleCard,
            {
              borderRadius: shape.cornerLarge,
              borderWidth: 1,
              borderColor: colors.outlineVariant,
              backgroundColor: colors.surface,
            },
          ]}>
            {loading ? (
              <View style={styles.centered}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : error ? (
              <View style={styles.centered}>
                <Text style={[typography.bodyMedium, { color: colors.error }]}>{error}</Text>
              </View>
            ) : timetable.length === 0 ? (
              <View style={[styles.centered, { paddingVertical: 36 }]}>
                <CalendarDays size={28} color={colors.onSurfaceVariant} style={{ opacity: 0.3 }} />
                <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: spacing.sm }]}>
                  No classes today
                </Text>
              </View>
            ) : (
              <View style={{ paddingVertical: 6 }}>
                {timetable.map((item, idx) => {
                  const isCurr = idx === currentIdx;
                  const isDone = nowMins() > parseTime(item.endTime);
                  const isLast = idx === timetable.length - 1;

                  return (
                    <SpringPress
                      key={item.id}
                      onPress={() => handleClassPress(item)}
                      scale={0.98}
                      style={[
                        styles.timelineRow,
                        {
                          backgroundColor: isCurr ? colors.primaryContainer : 'transparent',
                          borderRadius: isCurr ? shape.cornerMedium : 0,
                          marginHorizontal: isCurr ? 6 : 0,
                          marginVertical: isCurr ? 2 : 0,
                        },
                      ]}
                    >
                      {/* dot + line column */}
                      <View style={styles.dotCol}>
                        {isCurr ? (
                          <PulseDot color={colors.primary} size={10} />
                        ) : (
                          <View style={[
                            styles.dot,
                            {
                              backgroundColor: isDone ? colors.primary : 'transparent',
                              borderColor: isDone ? colors.primary : colors.outlineVariant,
                            },
                          ]} />
                        )}
                        {!isLast && (
                          <View style={[
                            styles.line,
                            { backgroundColor: isDone ? colors.primary + '40' : colors.outlineVariant },
                          ]} />
                        )}
                      </View>

                      {/* content */}
                      <View style={styles.tlContent}>
                        <View style={styles.tlRow}>
                          <Text style={[
                            typography.labelMedium,
                            {
                              color: isCurr ? colors.onPrimaryContainer : isDone ? colors.onSurfaceVariant : colors.onSurface,
                              width: 44, opacity: isDone ? 0.5 : 1,
                            },
                          ]}>
                            {item.startTime}
                          </Text>
                          <Text
                            style={[
                              typography.titleSmall,
                              {
                                color: isCurr ? colors.onPrimaryContainer : isDone ? colors.onSurfaceVariant : colors.onSurface,
                                flex: 1,
                                textDecorationLine: isDone ? 'line-through' : 'none',
                                opacity: isDone ? 0.5 : 1,
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {item.subject}
                          </Text>
                          {isCurr && (
                            <View style={[styles.nowPill, { backgroundColor: colors.primary, borderRadius: shape.pill }]}>
                              <Text style={[typography.labelSmall, { color: colors.onPrimary }]}>{t('screens.nOW')}</Text>
                            </View>
                          )}
                          {isDone && <CheckCircle size={14} color={colors.primary} style={{ opacity: 0.4 }} />}
                        </View>
                        <Text
                          style={[
                            typography.bodySmall,
                            {
                              color: isCurr ? colors.onPrimaryContainer : colors.onSurfaceVariant,
                              marginLeft: 44, marginTop: 1,
                              opacity: isDone ? 0.4 : 0.6,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {item.class} · {item.room}
                        </Text>
                      </View>
                    </SpringPress>
                  );
                })}
              </View>
            )}
          </View>
        </SpringIn>

        {/* ── ATTENDANCE + EXAM (existing components) ────────── */}
        <SpringIn delay={380} style={{ marginTop: spacing.x4 }}>
          <AttendanceCard staffId={user?.id} staffName={user?.name} />
        </SpringIn>
        <SpringIn delay={420} style={{ marginTop: spacing.x3 }}>
          <ExamCard exams={exams} loading={examsLoading} />
        </SpringIn>

      </Animated.ScrollView>

      {/* ── BOTTOM SHEET ─────────────────────────────────────── */}
      <BottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        title={selectedClass?.subject}
        snapPoints={[0.45, 0.65]}
      >
        {selectedClass && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetBody}>
            {selectedClass.topic && (
              <View style={styles.sheetSec}>
                <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 }]}>{t('screens.topic')}</Text>
                <Text style={[typography.titleLarge, { color: colors.onSurface, marginTop: spacing.xs }]}>{selectedClass.topic}</Text>
              </View>
            )}
            <View style={[styles.sheetGrid, { gap: spacing.md }]}>
              {[
                { l: 'Time', v: `${selectedClass.startTime} – ${selectedClass.endTime}` },
                { l: 'Room', v: selectedClass.room },
                { l: 'Class', v: selectedClass.class },
                { l: 'Students', v: String(selectedClass.students || '—') },
              ].map((d) => (
                <View key={d.l} style={styles.sheetGridItem}>
                  <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 }]}>{d.l}</Text>
                  <Text style={[typography.titleSmall, { color: colors.onSurface, marginTop: 2 }]}>{d.v}</Text>
                </View>
              ))}
            </View>
            {selectedClass.notes && (
              <View style={styles.sheetSec}>
                <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 }]}>{t('screens.notes')}</Text>
                <Text style={[typography.bodyMedium, { color: colors.onSurface, marginTop: spacing.xs }]}>{selectedClass.notes}</Text>
              </View>
            )}
            <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
              <SpringPress
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setSheetVisible(false); }}
                scale={0.97}
                style={[styles.sheetBtn, { backgroundColor: colors.primary, borderRadius: shape.cornerMedium }]}
              >
                <Text style={[typography.labelLarge, { color: colors.onPrimary }]}>{t('screens.takeAttendance')}</Text>
              </SpringPress>
              <SpringPress
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setSheetVisible(false); }}
                scale={0.97}
                style={[styles.sheetBtn, { backgroundColor: colors.surfaceContainer, borderRadius: shape.cornerMedium }]}
              >
                <Text style={[typography.labelLarge, { color: colors.onSurface }]}>{t('screens.viewDetails')}</Text>
              </SpringPress>
            </View>
          </ScrollView>
        )}
      </BottomSheet>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },

  /* top bar — sticky with lift-on-scroll */
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingBottom: 10, zIndex: 10,
  },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  avatar: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700' },
  iconBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute', top: -2, right: -4,
    minWidth: 17, height: 17, paddingHorizontal: 4,
    borderRadius: 9, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 9, fontWeight: '800' },

  /* focus card (M3 Elevated Card) */
  focusCard: { padding: 22 },
  focusTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  livePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4 },
  countdownPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center' },

  /* assist chips */
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8, gap: 6,
    backgroundColor: 'transparent',
  },
  chipLabel: { fontSize: 13, fontWeight: '600', letterSpacing: 0.1 },

  /* bento grid (M3 Filled Cards) */
  bentoGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  bentoTile: { width: '48.5%', paddingVertical: 16, paddingHorizontal: 14 },
  tileIcon: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  tileVal: { fontSize: 26, fontWeight: '700', lineHeight: 30 },

  /* section header */
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  seeAll: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, height: 32, gap: 2 },
  centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },

  /* schedule timeline (M3 Outlined Card) */
  scheduleCard: { overflow: 'hidden' },
  timelineRow: { flexDirection: 'row', minHeight: 54, paddingHorizontal: 6 },
  dotCol: { width: 24, alignItems: 'center', paddingTop: 14 },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  line: { width: 2, flex: 1, marginTop: 4 },
  tlContent: { flex: 1, paddingVertical: 10, paddingHorizontal: 8 },
  tlRow: { flexDirection: 'row', alignItems: 'center' },
  nowPill: { paddingHorizontal: 8, paddingVertical: 2 },

  /* bottom sheet */
  sheetBody: { paddingVertical: 16, paddingHorizontal: 8 },
  sheetSec: { marginBottom: 20 },
  sheetGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  sheetGridItem: { width: '50%', marginBottom: 16 },
  sheetBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 15, marginHorizontal: 8 },
});

export default HomeScreen;
