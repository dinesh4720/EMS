import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { useApp } from '../context/AppContext';
import { COLORS, SPACING, SHADOWS, TYPOGRAPHY } from '../theme';
import { Feather } from '@expo/vector-icons';
import Card from '../components/ui/Card';
import AnimatedPage from '../components/ui/AnimatedPage';

export default function ClassesScreen({ navigation }) {
  const { classes } = useApp();

  const classTeacherClasses = classes.filter(c => c.role === 'class_teacher');
  const subjectTeacherClasses = classes.filter(c => c.role === 'subject_teacher');

  const ClassCard = ({ cls, highlighted }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => navigation.navigate('ClassWorkspace', { classId: cls.id, className: cls.name })}
      style={{ marginBottom: SPACING.m }}
    >
      <Card style={[styles.card, highlighted && styles.highlightedCard]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, highlighted ? styles.highIconBox : styles.regIconBox]}>
            <Feather name={highlighted ? "star" : "book"} size={24} color={highlighted ? COLORS.primary : COLORS.gray} />
          </View>
          <View style={{ flex: 1, marginLeft: SPACING.m }}>
            <Text style={styles.className}>{cls.name}</Text>
            <Text style={styles.subject}>{cls.subject}</Text>
          </View>
          {cls.time ? (
            <View style={styles.timeBadge}>
              <Feather name="clock" size={12} color={COLORS.gray} style={{ marginRight: 4 }} />
              <Text style={styles.timeText}>{cls.time}</Text>
            </View>
          ) : cls.studentCount ? (
            <View style={styles.timeBadge}>
              <Feather name="users" size={12} color={COLORS.gray} style={{ marginRight: 4 }} />
              <Text style={styles.timeText}>{cls.studentCount} students</Text>
            </View>
          ) : null}
        </View>

        {/* Quick Actions Footer */}
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.footerAction}
            onPress={() => navigation.navigate('ClassWorkspace', { classId: cls.id, className: cls.name, initialTab: 1 })}
          >
            <View style={styles.actionIconBubble}>
              <Feather name="users" size={14} color={COLORS.dark} />
            </View>
            <Text style={styles.footerActionText}>Students</Text>
          </TouchableOpacity>

          <View style={styles.footerDivider} />

          <TouchableOpacity
            style={styles.footerAction}
            onPress={() => navigation.navigate('ClassWorkspace', { classId: cls.id, className: cls.name, initialTab: 0 })}
          >
            <View style={styles.actionIconBubble}>
              <Feather name="check-circle" size={14} color={COLORS.dark} />
            </View>
            <Text style={styles.footerActionText}>Attendance</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <AnimatedPage style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.pageTitle}>My Classes</Text>
            <Text style={styles.pageSubtitle}>Manage your teaching schedule</Text>
          </View>

          {classTeacherClasses.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Class Teacher</Text>
              {classTeacherClasses.map(cls => <ClassCard key={cls.id} cls={cls} highlighted />)}
            </View>
          )}

          {subjectTeacherClasses.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Subject Teacher</Text>
              {subjectTeacherClasses.map(cls => <ClassCard key={cls.id} cls={cls} />)}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </AnimatedPage >
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA', paddingTop: Platform.OS === 'android' ? 40 : 0 },
  container: { padding: SPACING.l, paddingBottom: 100 },

  header: { marginBottom: SPACING.xl },
  pageTitle: { ...TYPOGRAPHY.header, fontSize: 32, color: COLORS.dark },
  pageSubtitle: { ...TYPOGRAPHY.body, color: COLORS.gray, marginTop: 4 },

  section: { marginBottom: SPACING.xl },
  sectionTitle: { ...TYPOGRAPHY.subtitle, fontSize: 13, color: COLORS.gray, textTransform: 'uppercase', marginBottom: SPACING.m, letterSpacing: 1, fontWeight: '700' },

  card: { padding: 0, borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6' },
  highlightedCard: { borderColor: COLORS.primaryLight, borderWidth: 1 },

  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: SPACING.m },

  iconBox: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  highIconBox: { backgroundColor: COLORS.primaryLight },
  regIconBox: { backgroundColor: '#F3F4F6' },

  className: { ...TYPOGRAPHY.title, fontSize: 18 },
  subject: { ...TYPOGRAPHY.body, color: COLORS.gray, fontSize: 14 },

  timeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  timeText: { fontSize: 12, fontWeight: '600', color: COLORS.gray },

  cardFooter: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  footerAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  footerActionText: { fontSize: 14, fontWeight: '600', color: COLORS.dark, marginLeft: 8 },
  footerDivider: { width: 1, backgroundColor: '#F3F4F6' },

  actionIconBubble: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
});
