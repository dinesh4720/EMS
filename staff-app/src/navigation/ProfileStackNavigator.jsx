import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';

import ProfileScreen from '../screens/ProfileScreen';
import PayslipsScreen from '../screens/PayslipsScreen';
import LeaveRequestsScreen from '../screens/LeaveRequestsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';

const Stack = createStackNavigator();

const ProfileStackNavigator = () => {
  const theme = useTheme();
  const { colors, typography, isDark } = theme;

  return (
    <Stack.Navigator
      initialRouteName="Profile"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.outlineVariant,
        },
        headerTintColor: colors.onSurface,
        headerTitleStyle: {
          ...typography.headline,
          color: colors.onSurface,
        },
        headerBackTitleVisible: false,
        cardStyle: {
          backgroundColor: isDark ? colors.surface : '#F8F9FA',
        },
      }}
    >
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Payslips"
        component={PayslipsScreen}
        options={{
          title: 'My Payslips',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="LeaveRequests"
        component={LeaveRequestsScreen}
        options={{
          title: 'Leave Requests',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          title: 'Edit Profile',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{
          title: 'Change Password',
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  );
};

export default ProfileStackNavigator;
