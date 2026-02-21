import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, shadows } from '../styles/theme';

const AttendanceCard = ({ student }) => {
  return (
    <View style={[styles.card, shadows.card]}>
      <LinearGradient
        colors={['#11998e', '#38ef7d']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="calendar" size={22} color="#fff" />
        </View>

        {/* Content */}
        <View>
          <Text style={styles.label}>Attendance</Text>
          <Text style={styles.value}>{student.attendance}%</Text>
        </View>

        {/* Status */}
        <View style={styles.status}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Excellent Record</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  gradient: {
    padding: spacing.lg,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  value: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  statusText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});

export default AttendanceCard;
