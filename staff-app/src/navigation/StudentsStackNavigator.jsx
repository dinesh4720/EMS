import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';

import StudentsListScreen from '../screens/students/StudentsListScreen';
import StudentDetailScreen from '../screens/students/StudentDetailScreen';

const Stack = createStackNavigator();

const StudentsStackNavigator = () => {
  const { colors, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.surface },
      }}
    >
      <Stack.Screen name="StudentsList" component={StudentsListScreen} />
      <Stack.Screen name="StudentDetail" component={StudentDetailScreen} />
    </Stack.Navigator>
  );
};

export default StudentsStackNavigator;
