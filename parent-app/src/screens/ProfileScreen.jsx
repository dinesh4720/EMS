import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Card, Avatar, Button } from '../components';
import { formatDate } from '../utils/helpers';
import { User, Phone, Mail, MapPin, Building, LogOut, ChevronRight, Bell, BookOpen, Hash } from 'lucide-react-native';

const ProfileScreen = ({ navigation }) => {
  // navigation is passed in from TabNavigator
  const { student, user, logout } = useAuth();
  const { themeColors, spacing, typography, borderRadius } = useTheme();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  // Safely extract class info - backend returns class as object {id, name, section}
  const className = typeof student?.class === 'object'
    ? student.class.name
    : student?.class || '';
  const classSection = typeof student?.class === 'object'
    ? student.class.section
    : student?.section || '';
  const admissionNumber = student?.admissionId || student?.admissionNumber || '';

  const InfoItem = ({ icon: Icon, label, value }) => (
    <View style={styles.infoItem}>
      <View style={[styles.infoIcon, { backgroundColor: themeColors.backgroundSecondary }]}>
        <Icon size={18} color={themeColors.text} />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>
          {label}
        </Text>
        <Text style={[styles.infoValue, { color: themeColors.text }]}>
          {value || 'N/A'}
        </Text>
      </View>
    </View>
  );

  const MenuItem = ({ icon: Icon, title, subtitle, onPress }) => (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: themeColors.border }]}
      onPress={onPress}
    >
      <View style={[styles.menuIcon, { backgroundColor: themeColors.backgroundSecondary }]}>
        <Icon size={20} color={themeColors.text} />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color: themeColors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.menuSubtitle, { color: themeColors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      <ChevronRight size={20} color={themeColors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={[styles.header, { backgroundColor: themeColors.surface }]}>
          <Avatar name={student?.name} source={student?.photo} size="xlarge" />
          <Text style={[styles.studentName, { color: themeColors.text }]}>
            {student?.name || 'Student'}
          </Text>
          <Text style={[styles.studentClass, { color: themeColors.textSecondary }]}>
            {className}{classSection ? ` - Section ${classSection}` : ''}
          </Text>
          <Text style={[styles.admissionNo, { color: themeColors.textTertiary }]}>
            {admissionNumber ? `Admission No: ${admissionNumber}` : ''}
          </Text>
        </View>

        <View style={styles.content}>
          {/* Student Details */}
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Student Details
          </Text>
          <Card style={styles.detailsCard}>
            <InfoItem icon={User} label="Date of Birth" value={formatDate(student?.dateOfBirth)} />
            <InfoItem icon={Building} label="Gender" value={student?.gender} />
            <InfoItem icon={MapPin} label="Blood Group" value={student?.bloodGroup} />
            <InfoItem icon={Hash} label="Roll Number" value={student?.rollNo?.toString()} />
            <InfoItem icon={MapPin} label="Address" value={student?.address} />
            <InfoItem icon={Phone} label="Phone" value={student?.phone} />
            <InfoItem icon={Mail} label="Email" value={student?.email} />
          </Card>

          {/* Parent Details */}
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Parent Details
          </Text>
          <Card style={styles.detailsCard}>
            {student?.parents?.length > 0 ? (
              student.parents.map((parent, index) => (
                <React.Fragment key={index}>
                  <InfoItem
                    icon={User}
                    label={`${parent.relationship ? parent.relationship.charAt(0).toUpperCase() + parent.relationship.slice(1) : 'Parent'}'s Name`}
                    value={parent.name}
                  />
                  {parent.phone && (
                    <InfoItem icon={Phone} label={`${parent.relationship || 'Parent'}'s Phone`} value={parent.phone} />
                  )}
                  {parent.email && (
                    <InfoItem icon={Mail} label={`${parent.relationship || 'Parent'}'s Email`} value={parent.email} />
                  )}
                  {parent.occupation && (
                    <InfoItem icon={Building} label="Occupation" value={parent.occupation} />
                  )}
                </React.Fragment>
              ))
            ) : (
              <>
                <InfoItem icon={User} label="Parent Name" value={student?.parentName || user?.name} />
                <InfoItem icon={Phone} label="Parent Phone" value={student?.parentPhone || user?.phone} />
                <InfoItem icon={Mail} label="Parent Email" value={student?.parentEmail || user?.email} />
              </>
            )}
          </Card>

          {/* Parent Account */}
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            My Account
          </Text>
          <Card style={styles.menuCard} variant="outlined">
            <MenuItem
              icon={Bell}
              title="Notifications"
              subtitle="Manage notification preferences"
              onPress={() => navigation.navigate('NotificationSettings')}
            />
            <MenuItem
              icon={User}
              title="Edit Profile"
              subtitle="Update your information"
              onPress={() => navigation.navigate('EditProfile')}
            />
            <MenuItem
              icon={BookOpen}
              title="Remarks"
              subtitle="View teacher feedback"
              onPress={() => navigation.navigate('Remarks')}
            />
          </Card>

          {/* Logout Button */}
          <Button
            title="Logout"
            variant="outline"
            onPress={handleLogout}
            style={styles.logoutButton}
            icon={<LogOut size={18} color={themeColors.text} />}
          />

          <Text style={[styles.version, { color: themeColors.textTertiary }]}>
            Version 1.0.0
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
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  studentName: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 4,
  },
  studentClass: {
    fontSize: 16,
    marginBottom: 4,
  },
  admissionNo: {
    fontSize: 14,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  detailsCard: {
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5e5',
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  menuCard: {
    marginBottom: 8,
    padding: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  menuSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  logoutButton: {
    marginTop: 24,
    marginBottom: 16,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 20,
  },
});

export default ProfileScreen;
