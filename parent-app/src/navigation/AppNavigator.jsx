import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import TabNavigator from './TabNavigator';
import ChatDetailScreen from '../screens/ChatDetailScreen';
import ExamDetailScreen from '../screens/ExamDetailScreen';
import ResultDetailScreen from '../screens/ResultDetailScreen';
import TimetableScreen from '../screens/TimetableScreen';
import PaymentScreen from '../screens/PaymentScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();
  const { themeColors } = useTheme();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: themeColors.surface,
          },
          headerTitleStyle: {
            color: themeColors.text,
          },
          headerTintColor: themeColors.text,
          headerBackTitleVisible: false,
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Main"
              component={TabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ChatDetail"
              component={ChatDetailScreen}
              options={{
                title: 'Chat',
              }}
            />
            <Stack.Screen
              name="ExamDetail"
              component={ExamDetailScreen}
              options={({ route }) => ({
                title: route.params?.examName || 'Exam Details',
              })}
            />
            <Stack.Screen
              name="ResultDetail"
              component={ResultDetailScreen}
              options={({ route }) => ({
                title: route.params?.examName || 'Result Details',
              })}
            />
            <Stack.Screen
              name="Timetable"
              component={TimetableScreen}
              options={{
                title: 'Class Timetable',
              }}
            />
            <Stack.Screen
              name="Payment"
              component={PaymentScreen}
              options={{
                title: 'Pay Fees',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
