import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';

import ClassesScreen from '../screens/ClassesScreen';
import ClassDetailScreen from '../screens/classes/ClassDetailScreen';
import AttendanceScreen from '../screens/classes/AttendanceScreen';
import AttendanceHistoryScreen from '../screens/classes/AttendanceHistoryScreen';
import ClassStudentsScreen from '../screens/classes/ClassStudentsScreen';
import HomeworkScreen from '../screens/HomeworkScreen';

const Stack = createStackNavigator();

const BackButton = ({ onPress, colors }) => (
  <TouchableOpacity style={styles.backButton} onPress={onPress}>
    <Text style={[styles.backIcon, { color: colors.primary }]}>←</Text>
  </TouchableOpacity>
);

const ClassStackNavigator = () => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { colors, typography, isDark } = theme;

  return (
    <Stack.Navigator
      initialRouteName="ClassesList"
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
        headerLeftContainerStyle: {
          paddingLeft: 8,
        },
        cardStyle: {
          backgroundColor: isDark ? colors.surface : '#F8F9FA',
        },
      }}
    >
      <Stack.Screen
        name="ClassesList"
        component={ClassesScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ClassDetail"
        component={ClassDetailScreen}
        options={({ route }) => ({
          title: route.params?.className || 'Class Details',
          headerBackTitle: 'Back',
        })}
      />
      <Stack.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={({ route }) => ({
          title: route.params?.className ? `${route.params.className} - Attendance` : 'Mark Attendance',
          headerBackTitle: 'Back',
        })}
      />
      <Stack.Screen
        name="AttendanceHistory"
        component={AttendanceHistoryScreen}
        options={({ route }) => ({
          title: 'Attendance History',
          headerBackTitle: 'Back',
        })}
      />
      <Stack.Screen
        name="ClassStudents"
        component={ClassStudentsScreen}
        options={({ route }) => ({
          title: route.params?.className ? `${route.params.className} - Students` : 'Students',
          headerBackTitle: 'Back',
        })}
      />
      <Stack.Screen
        name="Homework"
        component={HomeworkScreen}
        options={{
          title: 'Homework',
          headerBackTitle: 'Back',
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
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  backIcon: {
    fontSize: 24,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerLeftPlaceholder: {
    width: 40,
  },
  headerRightPlaceholder: {
    width: 40,
  },
});

export default ClassStackNavigator;
