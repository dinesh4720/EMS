import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, Text } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AppProvider } from './src/context/AppContext';
import { Feather } from '@expo/vector-icons';
import { COLORS } from './src/theme';

import LoginScreen from './src/screens/LoginScreen';
import TodayScreen from './src/screens/TodayScreen';
import ClassesScreen from './src/screens/ClassesScreen';
import ClassWorkspace from './src/screens/ClassWorkspace';
import WorkScreen from './src/screens/WorkScreen';
import MeScreen from './src/screens/MeScreen';
import LeaveApplicationScreen from './src/screens/LeaveApplicationScreen';
import RegularizationRequestScreen from './src/screens/RegularizationRequestScreen';
import ProfileEditScreen from './src/screens/ProfileEditScreen';
import PersonalLessonPlanningScreen from './src/screens/PersonalLessonPlanningScreen';

import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: COLORS.white },
  headerTintColor: COLORS.dark,
  headerTitleStyle: { fontFamily: 'Inter_500Medium', fontSize: 18 },
  headerBackTitleVisible: false,
};

function ClassesStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ClassesList" component={ClassesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ClassWorkspace" component={ClassWorkspace}
        options={({ route }) => ({ title: route.params?.className || 'Class', headerShadowVisible: false })} />
    </Stack.Navigator>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="TodayMain" component={TodayScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Profile" component={MeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="LeaveApplication" component={LeaveApplicationScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RegularizationRequest" component={RegularizationRequestScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function WorkStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="WorkMain" component={WorkScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PersonalLessonPlanning" component={PersonalLessonPlanningScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

import FluidTabBar from './src/components/ui/FluidTabBar'; // Kept for reference but unused
import MaterialTabBar from './src/components/ui/MaterialTabBar';

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={({ state, descriptors, navigation }) => (
        <MaterialTabBar
          tabs={state.routes.map(r => r.name)}
          activeTab={state.index}
          onTabPress={(index) => {
            const route = state.routes[index];
            const isFocused = state.index === index;

            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          }}
        />
      )}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Classes" component={ClassesStack} />
      <Tab.Screen name="Work" component={WorkStack} />
    </Tab.Navigator>
  );
}


function AppContent() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      {isLoggedIn ? (
        <AppProvider>
          <MainTabs />
        </AppProvider>
      ) : (
        <LoginScreen />
      )}
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
