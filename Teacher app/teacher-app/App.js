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

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: COLORS.white },
  headerTintColor: COLORS.dark,
  headerTitleStyle: { fontWeight: '700', fontSize: 18 },
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

import FluidTabBar from './src/components/ui/FluidTabBar';

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={({ state, descriptors, navigation }) => (
        <View style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
          <FluidTabBar
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
        </View>
      )}
      sceneContainerStyle={{ backgroundColor: '#F8FAFC' }}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { position: 'absolute' }, // hidden usually if custom tabBar
      }}
    >
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="Classes" component={ClassesStack} />
      <Tab.Screen name="Work" component={WorkScreen} />
      <Tab.Screen name="Me" component={MeScreen} />
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
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
