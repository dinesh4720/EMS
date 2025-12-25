import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, SafeAreaView, Platform, Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../theme';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useApp } from '../context/AppContext';

export default function LeaveApplicationScreen({ navigation }) {
  const { leaveBalance, applyLeave } = useApp();
  const [leaveType, setLeaveType] = useState('casual');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const leaveTypes = [
    { id: 'casual', name: 'Casual Leave', available: leaveBalance.casual, color: COLORS.primary },
    { id: 'sick', name: 'Sick Leave', available: leaveBalance.sick, color: COLORS.warning },
    { id: 'earned', name: 'Earned Leave', available: leaveBalance.earned, color: COLORS.success },
  ];

  const calculateDays = () => {
    if (!fromDate || !toDate) return 0;
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const diffTime = Math.abs(to - from);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleSubmit = async () => {
    if (!fromDate || !toDate || !reason.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const days = calculateDays();
    const selectedLeave = leaveTypes.find(l => l.id === leaveType);

    if (days > selectedLeave.available) {
      Alert.alert('Insufficient Balance', `You only have ${selectedLeave.available} ${selectedLeave.name} days available`);
      return;
    }

    setLoading(true);
    try {
      const success = await applyLeave({
        leaveType,
        fromDate,
        toDate,
        reason,
        days,
      });

      if (success) {
        Alert.alert('Success', 'Leave application submitted successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit leave application');
    } finally {
      setLoading(false);
    }
  };

  const days = calculateDays();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Apply for Leave</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Leave Balance Card */}
        <Card style={styles.balanceCard}>
          <Text style={styles.balanceTitle}>Available Leave Balance</Text>
          <View style={styles.balanceRow}>
            {leaveTypes.map(type => (
              <View key={type.id} style={styles.balanceItem}>
                <Text style={[styles.balanceValue, { color: type.color }]}>
                  {type.available}
                </Text>
                <Text style={styles.balanceLabel}>{type.name}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Leave Type Selection */}
        <Text style={styles.sectionLabel}>Leave Type *</Text>
        <View style={styles.leaveTypeRow}>
          {leaveTypes.map(type => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.leaveTypeBtn,
                leaveType === type.id && styles.leaveTypeBtnActive,
                { borderColor: type.color }
              ]}
              onPress={() => setLeaveType(type.id)}
            >
              <Text style={[
                styles.leaveTypeText,
                leaveType === type.id && { color: type.color, fontFamily: 'Inter_500Medium' }
              ]}>
                {type.name}
              </Text>
              <Text style={styles.leaveTypeAvailable}>{type.available} days</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date Selection */}
        <Text style={styles.sectionLabel}>From Date *</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={fromDate}
          onChangeText={setFromDate}
        />

        <Text style={styles.sectionLabel}>To Date *</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={toDate}
          onChangeText={setToDate}
        />

        {days > 0 && (
          <View style={styles.daysInfo}>
            <Feather name="calendar" size={16} color={COLORS.primary} />
            <Text style={styles.daysText}>
              Total: {days} day{days > 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* Reason */}
        <Text style={styles.sectionLabel}>Reason *</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Enter reason for leave..."
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={4}
        />

        {/* Submit Button */}
        <Button
          title={loading ? "Submitting..." : "Submit Application"}
          onPress={handleSubmit}
          disabled={loading}
          style={{ marginTop: SPACING.l }}
        />

        {/* Info */}
        <View style={styles.infoBox}>
          <Feather name="info" size={16} color={COLORS.blue} />
          <Text style={styles.infoText}>
            Your leave application will be sent to the admin for approval.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA', paddingTop: Platform.OS === 'android' ? 40 : 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.m,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_500Medium', color: COLORS.dark },
  container: { padding: SPACING.l, paddingBottom: 100 },

  balanceCard: { marginBottom: SPACING.l, backgroundColor: COLORS.primaryLight },
  balanceTitle: { fontSize: 14, fontFamily: 'Inter_500Medium', color: COLORS.primary, marginBottom: SPACING.m },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-around' },
  balanceItem: { alignItems: 'center' },
  balanceValue: { fontSize: 24, fontFamily: 'Inter_500Medium' },
  balanceLabel: { fontSize: 11, color: COLORS.gray, marginTop: 4, fontFamily: 'Inter_400Regular' },

  sectionLabel: { fontSize: 14, fontFamily: 'Inter_500Medium', color: COLORS.dark, marginBottom: SPACING.s },

  leaveTypeRow: { flexDirection: 'row', gap: SPACING.s, marginBottom: SPACING.l },
  leaveTypeBtn: {
    flex: 1,
    padding: SPACING.m,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  leaveTypeBtnActive: { backgroundColor: COLORS.white },
  leaveTypeText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: COLORS.gray, textAlign: 'center' },
  leaveTypeAvailable: { fontSize: 11, color: COLORS.gray, marginTop: 4, fontFamily: 'Inter_400Regular' },

  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    padding: SPACING.m,
    fontSize: 15,
    marginBottom: SPACING.m,
    backgroundColor: COLORS.white,
    fontFamily: 'Inter_400Regular',
  },
  textarea: { height: 100, textAlignVertical: 'top' },

  daysInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.m,
    borderRadius: 10,
    marginBottom: SPACING.m,
  },
  daysText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: COLORS.primary, marginLeft: 8 },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    padding: SPACING.m,
    borderRadius: 10,
    marginTop: SPACING.l,
  },
  infoText: { flex: 1, fontSize: 13, color: COLORS.blue, marginLeft: 8, lineHeight: 18, fontFamily: 'Inter_400Regular' },
});
