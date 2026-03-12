import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ChatProvider } from './src/context/ChatContext';
import { ClassProvider } from './src/context/ClassContext';
import { ExamProvider } from './src/context/ExamContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import LoginScreen from './src/screens/LoginScreen';
import TabNavigator from './src/navigation/TabNavigator';
import EditProfileScreen from './src/screens/EditProfileScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';

const Stack = createNativeStackNavigator();

const ThemedStatusBar = () => {
  const { isDark } = useTheme();
  return (
    <StatusBar style={isDark ? 'light' : 'dark'} />
  );
};

const RootNavigator = () => {
  const { isAuthenticated, loading } = useAuth();
  const { colors, isDark } = useTheme();

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? colors.surface : '#F8F9FA' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: isDark ? colors.surface : '#FFFFFF' },
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            animation: 'fade',
          }}
        />
      ) : (
        <>
          <Stack.Screen
            name="MainApp"
            component={TabNavigator}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
            options={{
              presentation: 'modal',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AuthProvider>
              <ChatProvider>
                <ClassProvider>
                  <ExamProvider>
                    <ErrorBoundary>
                      <NavigationContainer>
                        <ThemedStatusBar />
                        <RootNavigator />
                      </NavigationContainer>
                    </ErrorBoundary>
                  </ExamProvider>
                </ClassProvider>
              </ChatProvider>
            </AuthProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
