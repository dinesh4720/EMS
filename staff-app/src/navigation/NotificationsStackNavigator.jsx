import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

import NotificationsScreen from '../screens/NotificationsScreen';

const Stack = createStackNavigator();

const NotificationsStackNavigator = () => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { colors, typography, isDark } = theme;

  return (
    <Stack.Navigator
      initialRouteName="NotificationsList"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.onSurface,
        headerTitleStyle: {
          ...typography.headline,
          color: colors.onSurface,
        },
        cardStyle: {
          backgroundColor: isDark ? colors.surface : '#F8F9FA',
        },
      }}
    >
      <Stack.Screen
        name="NotificationsList"
        component={NotificationsScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 44,
  },
});

export default NotificationsStackNavigator;
