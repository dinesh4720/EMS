import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';

import ExamsScreen from '../screens/exams/ExamsScreen';
import ExamDetailScreen from '../screens/exams/ExamDetailScreen';
import ResultsEntryScreen from '../screens/exams/ResultsEntryScreen';
import CreateExamScreen from '../screens/exams/CreateExamScreen';

const Stack = createStackNavigator();

const ExamStackNavigator = () => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { colors, typography, isDark } = theme;

  return (
    <Stack.Navigator
      initialRouteName="ExamsList"
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
        name="ExamsList"
        component={ExamsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ExamDetail"
        component={ExamDetailScreen}
        options={({ route }) => ({
          title: route.params?.examName || 'Exam Details',
          headerBackTitle: 'Back',
        })}
      />
      <Stack.Screen
        name="ResultsEntry"
        component={ResultsEntryScreen}
        options={({ route }) => ({
          title: route.params?.examName ? `Results: ${route.params.examName}` : 'Enter Results',
          headerBackTitle: 'Back',
        })}
      />
      <Stack.Screen
        name="CreateExam"
        component={CreateExamScreen}
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

export default ExamStackNavigator;
