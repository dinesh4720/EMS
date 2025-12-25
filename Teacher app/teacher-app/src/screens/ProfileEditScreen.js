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
    // Validation
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Error', 'Phone number is required');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        name,
        email,
        phone,
        address,
        emergencyContact
      });

      Alert.alert(
        'Success',
        'Profile updated successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
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
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name?.[0] || 'T'}</Text>
          </View>
          <TouchableOpacity style={styles.changePhotoBtn}>
            <Feather name="camera" size={16} color={COLORS.primary} />
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Basic Information */}
        <Card>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
            placeholderTextColor={COLORS.gray}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="your.email@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={COLORS.gray}
          />

          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="+91 XXXXX XXXXX"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor={COLORS.gray}
          />
        </Card>

        {/* Additional Information */}
        <Card>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Enter your address"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor={COLORS.gray}
          />

          <Text style={styles.label}>Emergency Contact</Text>
          <TextInput
            style={styles.input}
            placeholder="+91 XXXXX XXXXX"
            value={emergencyContact}
            onChangeText={setEmergencyContact}
            keyboardType="phone-pad"
            placeholderTextColor={COLORS.gray}
          />
        </Card>

        {/* Read-only Information */}
        <Card style={styles.readOnlyCard}>
          <Text style={styles.sectionTitle}>Employment Details</Text>
          <View style={styles.readOnlyRow}>
            <Text style={styles.readOnlyLabel}>Employee ID</Text>
            <Text style={styles.readOnlyValue}>{user?.employeeId || 'N/A'}</Text>
          </View>
          <View style={styles.readOnlyRow}>
            <Text style={styles.readOnlyLabel}>Designation</Text>
            <Text style={styles.readOnlyValue}>{user?.designation || 'N/A'}</Text>
          </View>
          <View style={[styles.readOnlyRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.readOnlyLabel}>Joining Date</Text>
            <Text style={styles.readOnlyValue}>{user?.joiningDate || 'N/A'}</Text>
          </View>
          <Text style={styles.readOnlyNote}>
            Contact HR to update employment details
          </Text>
        </Card>

        <Button
          title={loading ? "Saving..." : "Save Changes"}
          onPress={handleSave}
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.m
  },
  avatarText: {
    fontSize: 40,
    fontFamily: 'Inter_500Medium',
    color: COLORS.white
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s
  },
  changePhotoText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: COLORS.primary,
    marginLeft: 6
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: COLORS.dark,
    marginBottom: SPACING.m
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
    height: 80,
    textAlignVertical: 'top'
  },
  readOnlyCard: {
    backgroundColor: '#F9FAFB'
  },
  readOnlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray
  },
  readOnlyLabel: {
    fontSize: 14,
    color: COLORS.gray,
    fontFamily: 'Inter_400Regular'
  },
  readOnlyValue: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: COLORS.dark
  },
  readOnlyNote: {
    fontSize: 12,
    color: COLORS.gray,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    marginTop: SPACING.m
  }
});
