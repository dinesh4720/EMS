import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, shadows } from '../styles/theme';

const GradeCard = ({ student }) => {
  return (
    <View style={[styles.card, shadows.card]}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="trending-up" size={22} color="#fff" />
        </View>

        {/* Content */}
        <View>
          <Text style={styles.label}>Current GPA</Text>
          <Text style={styles.value}>{student.gpa.toFixed(1)}</Text>
        </View>

        {/* Trend */}
        <View style={styles.trend}>
          <Text style={styles.trendText}>+0.2 from last term</Text>
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
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  trendText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});

export default GradeCard;
