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
import ModernHeader from '../components/ui/ModernHeader';

export default function LeaveApplicationScreen({ navigation }) {
  const { leaveBalance, applyLeave } = useApp();
  const [leaveType, setLeaveType] = useState('casual');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const leaveTypes = [
    { id: 'casual', name: 'Casual', available: leaveBalance.casual, color: COLORS.primary },
    { id: 'sick', name: 'Sick', available: leaveBalance.sick, color: COLORS.warning },
    { id: 'earned', name: 'Earned', available: leaveBalance.earned, color: COLORS.success },
  ];

  const calculateDays = () => {
    if (!fromDate || !toDate) return 0;
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const diffTime = Math.abs(to - from);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diffDays) ? 0 : diffDays;
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
      const success = await applyLeave({ leaveType, fromDate, toDate, reason, days });
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
      <ModernHeader title="Apply Leave" subtitle="Request time off" backAction={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Balance Cards */}
        <View style={styles.balanceRow}>
          {leaveTypes.map(type => (
            <View key={type.id} style={styles.balanceCard}>
              <Text style={[styles.balanceVal, { color: type.color }]}>{type.available}</Text>
              <Text style={styles.balanceLabel}>{type.name}</Text>
            </View>
          ))}
        </View>

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Leave Details</Text>

          <Text style={styles.label}>Leave Type</Text>
          <View style={styles.typeRow}>
            {leaveTypes.map(type => (
              <TouchableOpacity
                key={type.id}
                style={[styles.typeBtn, leaveType === type.id && { backgroundColor: type.color, borderColor: type.color }]}
                onPress={() => setLeaveType(type.id)}
              >
                <Text style={[styles.typeText, leaveType === type.id && { color: '#FFF' }]}>{type.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.rowInput}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>From Date</Text>
              <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={fromDate} onChangeText={setFromDate} placeholderTextColor={COLORS.gray} />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>To Date</Text>
              <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={toDate} onChangeText={setToDate} placeholderTextColor={COLORS.gray} />
            </View>
          </View>

          {days > 0 && (
            <View style={styles.infoRow}>
              <Feather name="clock" size={14} color={COLORS.primary} />
              <Text style={styles.infoText}>Duration: {days} Day{days > 1 ? 's' : ''}</Text>
            </View>
          )}

          <Text style={styles.label}>Reason</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Why are you taking leave?"
            value={reason} onChangeText={setReason} multiline
            placeholderTextColor={COLORS.gray}
          />

          <Button title={loading ? "Submitting..." : "Submit Application"} onPress={handleSubmit} disabled={loading} style={{ marginTop: 16 }} />
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.fade, paddingTop: Platform.OS === 'android' ? 30 : 0 },
  container: { padding: SPACING.l, paddingBottom: 100 },

  balanceRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  balanceCard: { flex: 1, backgroundColor: '#FFF', padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', ...SHADOWS.small },
  balanceVal: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  balanceLabel: { fontSize: 12, color: COLORS.gray, textTransform: 'uppercase', letterSpacing: 0.5 },

  formCard: { padding: 20, borderRadius: 24, ...SHADOWS.medium },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: COLORS.dark, marginBottom: 20 },

  label: { fontSize: 13, fontFamily: 'Inter_500Medium', color: COLORS.dark, marginBottom: 8, marginTop: 4 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.lightGray, alignItems: 'center' },
  typeText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: COLORS.gray },

  input: { backgroundColor: COLORS.fade, borderRadius: 12, padding: 14, fontSize: 15, fontFamily: 'Inter_400Regular', color: COLORS.dark },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  rowInput: { flexDirection: 'row', marginBottom: 16 },

  infoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryLight + '40', padding: 12, borderRadius: 10, marginBottom: 16 },
  infoText: { marginLeft: 8, color: COLORS.primary, fontSize: 13, fontWeight: '600' }
});
