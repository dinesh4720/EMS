import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Platform, Pressable } from 'react-native';
import { useApp } from '../context/AppContext';
import { COLORS, SPACING, SHADOWS, TYPOGRAPHY } from '../theme';
import { Feather } from '@expo/vector-icons';
import AnimatedPage from '../components/ui/AnimatedPage';
import ModernHeader from '../components/ui/ModernHeader';
import SectionHeader from '../components/ui/SectionHeader';

export default function ClassesScreen({ navigation }) {
  const { classes } = useApp();

  const classTeacherClasses = classes.filter(c => c.role === 'class_teacher');
  const subjectTeacherClasses = classes.filter(c => c.role === 'subject_teacher');

  const ClassCard = ({ cls, highlighted }) => (
    <View style={styles.cardContainer}>
      <Pressable
        android_ripple={{ color: highlighted ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)' }}
        onPress={() => navigation.navigate('ClassWorkspace', { classId: cls.id, className: cls.name })}
        style={[
          styles.card,
          highlighted ? styles.cardFilled : styles.cardOutlined
        ]}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <View>
              <Text style={[styles.className, highlighted && styles.textHighlighted]}>{cls.name}</Text>
              <Text style={[styles.subject, highlighted && styles.textHighlighted]}>{cls.subject}</Text>
            </View>
            <View style={[styles.iconBox, highlighted ? styles.highIconBox : styles.regIconBox]}>
              <Feather name={highlighted ? "star" : "book"} size={20} color={highlighted ? COLORS.primary : COLORS.gray} />
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.metaItem}>
              <Feather name="users" size={14} color={highlighted ? COLORS.primary : COLORS.gray} />
              <Text style={[styles.metaText, highlighted && styles.textHighlighted]}>{cls.studentCount || 42} Students</Text>
            </View>
            <View style={[styles.metaDivider, highlighted && { backgroundColor: COLORS.primary + '40' }]} />
            <View style={styles.metaItem}>
              <Feather name="clock" size={14} color={highlighted ? COLORS.primary : COLORS.gray} />
              <Text style={[styles.metaText, highlighted && styles.textHighlighted]}>{cls.time || '09:00 AM'}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );

  return (
    <AnimatedPage style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <ModernHeader title="My Classes" subtitle="Manage your teaching schedule" hideProfile={true} />
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

          {classTeacherClasses.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Class Teacher For" />
              {classTeacherClasses.map(cls => <ClassCard key={cls.id} cls={cls} highlighted />)}
            </View>
          )}

          {subjectTeacherClasses.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Subject Classes" />
              {subjectTeacherClasses.map(cls => <ClassCard key={cls.id} cls={cls} />)}
            </View>
          )}

          {classTeacherClasses.length === 0 && subjectTeacherClasses.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="book-open" size={48} color={COLORS.lightGray} />
              <Text style={styles.emptyText}>No classes assigned yet.</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </AnimatedPage >
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.fade, paddingTop: Platform.OS === 'android' ? 30 : 0 },
  container: { padding: SPACING.l, paddingBottom: 100 },

  section: { marginBottom: SPACING.xl },

  cardContainer: { marginBottom: SPACING.m, borderRadius: 16, overflow: 'hidden' }, // Container for clean rounded corners

  // MD3 Card Styles
  card: { padding: SPACING.m, borderRadius: 16, minHeight: 120 },
  cardFilled: { backgroundColor: COLORS.primaryLight }, // Primary Container
  cardOutlined: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.lightGray }, // Outlined Card

  cardContent: { flex: 1 },

  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.m },
  className: { fontSize: 20, fontFamily: 'Inter_600SemiBold', color: COLORS.dark },
  subject: { fontSize: 14, fontFamily: 'Inter_400Regular', color: COLORS.gray, marginTop: 2 },

  textHighlighted: { color: COLORS.primaryDark }, // OnPrimaryContainer

  iconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  highIconBox: { backgroundColor: '#FFFFFF' },
  regIconBox: { backgroundColor: COLORS.surfaceVariant },

  cardFooter: { flexDirection: 'row', alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { marginLeft: 6, fontSize: 13, color: COLORS.gray, fontFamily: 'Inter_500Medium' },
  metaDivider: { width: 1, height: 12, backgroundColor: COLORS.lightGray, marginHorizontal: 12 },

  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { marginTop: 16, color: COLORS.gray, fontFamily: 'Inter_400Regular' }
});
