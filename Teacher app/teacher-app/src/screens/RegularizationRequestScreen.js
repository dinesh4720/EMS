import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, Platform, Alert
} from 'react-native';
import { useApp } from '../context/AppContext';
import { COLORS, SPACING, SHADOWS } from '../theme';
import { Feather } from '@expo/vector-icons';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function RegularizationRequestScreen({ navigation }) {
  const { requestRegularization } = useApp();
  const [date, setDate] = useState('');
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!date.trim()) {
      Alert.alert('Error', 'Please enter the date');
      return;
    }
    if (!checkInTime.trim() && !checkOutTime.trim()) {
      Alert.alert('Error', 'Please enter at least check-in or check-out time');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason');
      return;
    }

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

      Alert.alert(
        'Success',
        'Regularization request submitted successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Regularization Request</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Feather name="info" size={20} color={COLORS.blue} />
          </View>
          <Text style={styles.infoText}>
            Request attendance regularization for missed check-in/check-out
          </Text>
        </Card>

        <Card>
          <Text style={styles.label}>Date *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={date}
            onChangeText={setDate}
            placeholderTextColor={COLORS.gray}
          />

          <Text style={styles.label}>Check-In Time</Text>
          <TextInput
            style={styles.input}
            placeholder="HH:MM (e.g., 09:30)"
            value={checkInTime}
            onChangeText={setCheckInTime}
            placeholderTextColor={COLORS.gray}
          />

          <Text style={styles.label}>Check-Out Time</Text>
          <TextInput
            style={styles.input}
            placeholder="HH:MM (e.g., 17:30)"
            value={checkOutTime}
            onChangeText={setCheckOutTime}
            placeholderTextColor={COLORS.gray}
          />

          <Text style={styles.label}>Reason *</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Explain why you need regularization..."
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor={COLORS.gray}
          />
        </Card>

        <View style={styles.exampleCard}>
          <Text style={styles.exampleTitle}>Common Reasons:</Text>
          <Text style={styles.exampleText}>• Forgot to check-in/check-out</Text>
          <Text style={styles.exampleText}>• System/app issue</Text>
          <Text style={styles.exampleText}>• Official duty outside campus</Text>
          <Text style={styles.exampleText}>• Emergency situation</Text>
        </View>

        <Button
          title={loading ? "Submitting..." : "Submit Request"}
          onPress={handleSubmit}
          disabled={loading}
          size="large"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingTop: Platform.OS === 'android' ? 40 : 0
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.m,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray
  },
  backBtn: {
    padding: SPACING.s
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_500Medium',
    color: COLORS.dark
  },
  container: {
    padding: SPACING.l,
    paddingBottom: 100
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    marginBottom: SPACING.l
  },
  infoIcon: {
    marginRight: SPACING.m
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.blue,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: COLORS.dark,
    marginBottom: SPACING.s
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 10,
    padding: SPACING.m,
    fontSize: 15,
    marginBottom: SPACING.m,
    backgroundColor: COLORS.white,
    fontFamily: 'Inter_400Regular',
    color: COLORS.dark
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top'
  },
  exampleCard: {
    backgroundColor: '#F9FAFB',
    padding: SPACING.m,
    borderRadius: 10,
    marginBottom: SPACING.l
  },
  exampleTitle: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: COLORS.gray,
    marginBottom: SPACING.s
  },
  exampleText: {
    fontSize: 13,
    color: COLORS.gray,
    fontFamily: 'Inter_400Regular',
    marginTop: 4
  }
});
