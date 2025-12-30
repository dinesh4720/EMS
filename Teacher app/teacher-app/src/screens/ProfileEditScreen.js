import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, Platform, Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { COLORS, SPACING, SHADOWS } from '../theme';
import { Feather } from '@expo/vector-icons';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ModernHeader from '../components/ui/ModernHeader';
import SectionHeader from '../components/ui/SectionHeader';

export default function ProfileEditScreen({ navigation }) {
  const { user } = useAuth();
  const { updateProfile } = useApp();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [emergencyContact, setEmergencyContact] = useState(user?.emergencyContact || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Name is required');
    if (!phone.trim()) return Alert.alert('Error', 'Phone number is required');

    setLoading(true);
    try {
      await updateProfile({ name, email, phone, address, emergencyContact });
      Alert.alert('Success', 'Profile updated successfully', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ label, value, onChange, placeholder, keyboardType, multiline }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textarea]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholderTextColor={COLORS.gray}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ModernHeader title="Edit Profile" subtitle="Update your personal details" backAction={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Avatar Section */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{name?.[0] || 'T'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.camBtn}>
            <Feather name="camera" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Basic Information */}
        <SectionHeader title="Basic Info" />
        <Card style={styles.formCard}>
          <InputField label="Full Name *" value={name} onChange={setName} placeholder="Enter your full name" />
          <InputField label="Email Address" value={email} onChange={setEmail} placeholder="email@example.com" keyboardType="email-address" />
          <InputField label="Phone Number *" value={phone} onChange={setPhone} placeholder="+91 XXXXX XXXXX" keyboardType="phone-pad" />
        </Card>

        {/* Additional Information */}
        <SectionHeader title="Personal Details" />
        <Card style={styles.formCard}>
          <InputField label="Address" value={address} onChange={setAddress} placeholder="Residential address" multiline />
          <InputField label="Emergency Contact" value={emergencyContact} onChange={setEmergencyContact} placeholder="Relative number" keyboardType="phone-pad" />
        </Card>

        {/* Read-only Employment Info */}
        <View style={styles.readOnlySection}>
          <Text style={styles.readOnlyTitle}>Employment Details (Read-Only)</Text>
          <View style={styles.readOnlyRow}>
            <Text style={styles.roLabel}>Employee ID</Text>
            <Text style={styles.roValue}>{user?.employeeId || 'EMP-001'}</Text>
          </View>
          <View style={styles.readOnlyRow}>
            <Text style={styles.roLabel}>Designation</Text>
            <Text style={styles.roValue}>{user?.designation || 'Teacher'}</Text>
          </View>
          <View style={styles.readOnlyRowLast}>
            <Text style={styles.roLabel}>Joined On</Text>
            <Text style={styles.roValue}>{user?.joiningDate || '01 Jan 2023'}</Text>
          </View>
        </View>

        <Button
          title={loading ? "Saving..." : "Save Changes"}
          onPress={handleSave}
          disabled={loading}
          size="large"
          style={{ marginBottom: 20 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.fade, paddingTop: Platform.OS === 'android' ? 30 : 0 },
  container: { padding: SPACING.l, paddingBottom: 100 },

  avatarContainer: { alignItems: 'center', marginBottom: 32, marginTop: 10 },
  avatarRing: { padding: 4, backgroundColor: '#FFF', borderRadius: 100, ...SHADOWS.small },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 36, color: '#FFF', fontWeight: 'bold' },
  camBtn: { position: 'absolute', bottom: 0, right: '35%', backgroundColor: COLORS.dark, padding: 8, borderRadius: 20, borderWidth: 2, borderColor: '#FFF' },

  formCard: { padding: 20, borderRadius: 20, marginBottom: 24, ...SHADOWS.small },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: COLORS.dark, marginBottom: 6 },
  input: { backgroundColor: COLORS.fade, borderRadius: 12, padding: 14, fontSize: 15, fontFamily: 'Inter_400Regular', color: COLORS.dark },
  textarea: { minHeight: 80, textAlignVertical: 'top' },

  readOnlySection: { padding: 20, backgroundColor: COLORS.surfaceVariant, borderRadius: 20, marginBottom: 32 },
  readOnlyTitle: { fontSize: 12, color: COLORS.gray, fontWeight: '600', textTransform: 'uppercase', marginBottom: 16, letterSpacing: 1 },
  readOnlyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.fade, paddingBottom: 12 },
  readOnlyRowLast: { flexDirection: 'row', justifyContent: 'space-between' },
  roLabel: { fontSize: 14, color: COLORS.gray },
  roValue: { fontSize: 14, color: COLORS.dark, fontWeight: '600' }
});
