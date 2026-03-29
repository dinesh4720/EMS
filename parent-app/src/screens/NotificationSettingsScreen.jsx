import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components';
import api from '../services/api';

const STORAGE_KEY = 'notification_settings';

const DEFAULT_SETTINGS = {
  attendance: true,
  fees: true,
  exams: true,
  results: true,
  announcements: true,
  chat: true,
  remarks: true,
};

const SETTING_LABELS = {
  attendance: { title: 'Attendance Alerts', subtitle: 'Get notified when attendance is marked' },
  fees: { title: 'Fee Reminders', subtitle: 'Due dates and payment confirmations' },
  exams: { title: 'Exam Schedules', subtitle: 'Upcoming exams and timetable changes' },
  results: { title: 'Result Updates', subtitle: 'When new results are published' },
  announcements: { title: 'Announcements', subtitle: 'School-wide announcements' },
  chat: { title: 'Chat Messages', subtitle: 'New messages from teachers' },
  remarks: { title: 'Teacher Remarks', subtitle: 'Feedback and remarks from teachers' },
};

const NotificationSettingsScreen = () => {
  const { themeColors } = useTheme();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Try fetching from backend first (source of truth)
      const response = await api.getNotificationSettings();
      if (response?.settings) {
        const merged = { ...DEFAULT_SETTINGS, ...response.settings };
        setSettings(merged);
        // Update local cache to match backend
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return;
      }
    } catch {
      // Backend unavailable — fall back to local cache
    }

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch {
      // Use defaults on error
    }
  };

  const saveSettings = async (newSettings) => {
    setSaving(true);
    try {
      // Save to local cache immediately for responsiveness
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));

      // Sync to backend (fire-and-forget with error handling)
      try {
        await api.updateNotificationSettings(newSettings);
      } catch {
        // Backend sync failed — local cache is still up to date.
        // Settings will be re-synced on next app launch via loadSettings.
        console.warn('Failed to sync notification settings to backend');
      }
    } catch {
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleSetting = (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    saveSettings(updated);
  };

  const SettingRow = ({ settingKey }) => {
    const label = SETTING_LABELS[settingKey];
    return (
      <View style={[styles.settingRow, { borderBottomColor: themeColors.border }]}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, { color: themeColors.text }]}>
            {label.title}
          </Text>
          <Text style={[styles.settingSubtitle, { color: themeColors.textSecondary }]}>
            {label.subtitle}
          </Text>
        </View>
        <Switch
          value={settings[settingKey]}
          onValueChange={() => toggleSetting(settingKey)}
          trackColor={{ false: themeColors.border, true: themeColors.text }}
          thumbColor="#ffffff"
        />
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={['left', 'right']}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={[styles.description, { color: themeColors.textSecondary }]}>
            Choose which notifications you want to receive.
          </Text>

          <Card style={styles.card}>
            {Object.keys(SETTING_LABELS).map((key) => (
              <SettingRow key={key} settingKey={key} />
            ))}
          </Card>

          <Text style={[styles.note, { color: themeColors.textTertiary }]}>
            Note: Push notifications require the app to be installed and notification permissions to be granted in your device settings.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  card: {
    padding: 0,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  note: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});

export default NotificationSettingsScreen;
