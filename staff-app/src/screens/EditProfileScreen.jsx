import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';
import { staffApi, uploadApi } from '../services/api';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';
import { useTranslation } from 'react-i18next';

const EditProfileScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
    department: '',
    qualification: '',
    experience: '',
    address: '',
    emergencyContact: '',
  });
  const [photoUri, setPhotoUri] = useState(null);
  const [photoChanged, setPhotoChanged] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const profile = await staffApi.getMyProfile();
      if (profile) {
        setFormData({
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          designation: profile.designation || '',
          department: profile.department || '',
          qualification: profile.qualification || '',
          experience: profile.experience?.toString() || '',
          address: profile.address || '',
          emergencyContact: profile.emergencyContact || '',
        });
        if (profile.photo || profile.picture) {
          setPhotoUri(profile.photo || profile.picture);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Fall back to user data from auth context
      if (user) {
        setFormData({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          designation: user.designation || '',
          department: user.department || '',
          qualification: user.qualification || '',
          experience: user.experience?.toString() || '',
          address: user.address || '',
          emergencyContact: user.emergencyContact || '',
        });
        if (user.picture || user.photo) {
          setPhotoUri(user.picture || user.photo);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to change your profile picture.');
        return;
      }

      Alert.alert(
        'Change Photo',
        'Choose an option',
        [
          {
            text: 'Take Photo',
            onPress: takePhoto,
          },
          {
            text: 'Choose from Library',
            onPress: chooseFromLibrary,
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your camera to take a photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        setPhotoChanged(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  };

  const chooseFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        setPhotoChanged(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error choosing photo:', error);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    // Validate required fields
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Name is required.');
      return;
    }

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let pictureUrl = photoUri;

      // Upload photo if changed
      if (photoChanged && photoUri && !photoUri.startsWith('http')) {
        try {
          const uploadResult = await uploadApi.uploadImage(photoUri);
          pictureUrl = uploadResult.url || uploadResult.fileUrl || photoUri;
        } catch (uploadError) {
          console.error('Photo upload error:', uploadError);
          // Continue with local URI if upload fails
        }
      }

      // Update profile using self-service endpoint
      const updateData = {
        ...formData,
        experience: formData.experience ? parseInt(formData.experience) : null,
      };

      if (pictureUrl) {
        updateData.picture = pictureUrl;
      }

      const result = await staffApi.updateMyProfile(updateData);

      // Update local user state
      await updateUser({
        ...formData,
        picture: pictureUrl,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error saving profile:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (field, label, placeholder, keyboardType = 'default', multiline = false) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        value={formData[field]}
        onChangeText={(value) => handleChange(field, value)}
        placeholder={placeholder}
        placeholderTextColor={Colors.text.tertiary}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.blue} />
        <Text style={styles.loadingText}>{t('screens.loadingProfile')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('screens.editProfile1')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Photo */}
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={pickImage} style={styles.photoContainer}>
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                style={styles.profilePhoto}
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>
                  {formData.name?.charAt(0) || 'S'}
                </Text>
              </View>
            )}
            <View style={styles.editPhotoBadge}>
              <Text style={styles.editPhotoIcon}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.photoHint}>{t('screens.tapToChangePhoto')}</Text>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('screens.personalInformation')}</Text>
          <View style={styles.sectionContent}>
            {renderInput('name', 'Full Name', 'Enter your full name')}
            {renderInput('email', 'Email', 'Enter your email', 'email-address')}
            {renderInput('phone', 'Phone', 'Enter your phone number', 'phone-pad')}
          </View>
        </View>

        {/* Professional Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('screens.professionalInformation')}</Text>
          <View style={styles.sectionContent}>
            {renderInput('designation', 'Designation', 'e.g., Teacher, HOD')}
            {renderInput('department', 'Department', 'e.g., Science, Mathematics')}
            {renderInput('qualification', 'Qualification', 'e.g., M.Sc., B.Ed.')}
            {renderInput('experience', 'Years of Experience', 'e.g., 5', 'numeric')}
          </View>
        </View>

        {/* Additional Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('screens.additionalInformation')}</Text>
          <View style={styles.sectionContent}>
            {renderInput('address', 'Address', 'Enter your address', 'default', true)}
            {renderInput('emergencyContact', 'Emergency Contact', 'Enter emergency contact number', 'phone-pad')}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.7}
        >
          {saving ? (
            <ActivityIndicator size="small" color={Colors.background.primary} />
          ) : (
            <Text style={styles.saveButtonText}>{t('screens.saveChanges')}</Text>
          )}
        </TouchableOpacity>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.gray.light,
  },
  backButton: {
    padding: Spacing.xs,
  },
  backIcon: {
    fontSize: 24,
    color: Colors.blue,
  },
  headerTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
  },
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  loadingText: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  photoContainer: {
    position: 'relative',
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.background.primary,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    fontSize: 40,
    fontWeight: '600',
    color: Colors.background.primary,
  },
  editPhotoBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background.primary,
  },
  editPhotoIcon: {
    fontSize: 14,
  },
  photoHint: {
    ...Typography.caption1,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.headline,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
    textTransform: 'uppercase',
    fontSize: 13,
  },
  sectionContent: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  inputGroup: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.gray.light,
  },
  inputLabel: {
    ...Typography.caption1,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  input: {
    ...Typography.body,
    color: Colors.text.primary,
    padding: 0,
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: Colors.blue,
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    ...Typography.headline,
    color: Colors.background.primary,
  },
});

export default EditProfileScreen;
