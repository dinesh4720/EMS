import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  SafeAreaView, Platform, Alert
} from 'react-native';
import { useApp } from '../context/AppContext';
import { COLORS, SPACING, SHADOWS } from '../theme';
import { Feather } from '@expo/vector-icons';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ModernHeader from '../components/ui/ModernHeader';

export default function RegularizationRequestScreen({ navigation }) {
  const { requestRegularization } = useApp();
  const [date, setDate] = useState('');
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!date.trim()) { Alert.alert('Error', 'Please enter the date'); return; }
    if (!checkInTime.trim() && !checkOutTime.trim()) { Alert.alert('Error', 'Please enter at least check-in or check-out time'); return; }
    if (!reason.trim()) { Alert.alert('Error', 'Please provide a reason'); return; }

    setLoading(true);
    try {
      await requestRegularization({
        date,
        checkInTime: checkInTime || null,
        checkOutTime: checkOutTime || null,
        reason,
        requestedAt: new Date().toISOString(),
        status: 'pending'
      });
      Alert.alert('Success', 'Regularization request submitted successfully', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const InfoCard = () => (
    <View style={styles.infoBox}>
      <Feather name="info" size={20} color={COLORS.primary} />
      <Text style={styles.infoText}>Request correction for missed attendance punches.</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ModernHeader title="Regularization" subtitle="Fix attendance anomalies" backAction={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.container}>
        <InfoCard />

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Request Details</Text>

          <Text style={styles.label}>Date *</Text>
          <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} placeholderTextColor={COLORS.gray} />

          <View style={styles.rowInput}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Check In Time</Text>
              <TextInput style={styles.input} placeholder="09:00" value={checkInTime} onChangeText={setCheckInTime} placeholderTextColor={COLORS.gray} />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>Check Out Time</Text>
              <TextInput style={styles.input} placeholder="17:00" value={checkOutTime} onChangeText={setCheckOutTime} placeholderTextColor={COLORS.gray} />
            </View>
          </View>

          <Text style={styles.label}>Reason for miss *</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="E.g. Fingerprint scanner not working..."
            value={reason} onChangeText={setReason} multiline
            placeholderTextColor={COLORS.gray}
          />

          <Button title={loading ? "Submitting..." : "Submit Request"} onPress={handleSubmit} disabled={loading} style={{ marginTop: 16 }} />
        </Card>

        <View style={styles.tipsBox}>
          <Text style={styles.tipsTitle}>Common Reasons</Text>
          <Text style={styles.tipItem}>• Technical Issue with Scanner</Text>
          <Text style={styles.tipItem}>• On Duty (Outside Campus)</Text>
          <Text style={styles.tipItem}>• Forgot to Punch</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.fade, paddingTop: Platform.OS === 'android' ? 30 : 0 },
  container: { padding: SPACING.l, paddingBottom: 100 },

  infoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryLight + '40', padding: 16, borderRadius: 16, marginBottom: 20 },
  infoText: { marginLeft: 12, color: COLORS.primary, fontSize: 13, fontWeight: '500', flex: 1 },

  formCard: { padding: 20, borderRadius: 24, ...SHADOWS.medium, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: COLORS.dark, marginBottom: 20 },

  label: { fontSize: 13, fontFamily: 'Inter_500Medium', color: COLORS.dark, marginBottom: 8, marginTop: 4 },
  input: { backgroundColor: COLORS.fade, borderRadius: 12, padding: 14, fontSize: 15, fontFamily: 'Inter_400Regular', color: COLORS.dark, marginBottom: 16 },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  rowInput: { flexDirection: 'row', marginBottom: 0 },

  tipsBox: { padding: 20 },
  tipsTitle: { fontSize: 14, fontWeight: '600', color: COLORS.gray, marginBottom: 12, textTransform: 'uppercase' },
  tipItem: { fontSize: 13, color: COLORS.gray, marginBottom: 6 }
});
