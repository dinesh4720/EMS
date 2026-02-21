import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Calendar, CreditCard, FileText, MessageCircle, User } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useChat } from '../context/ChatContext';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import FeesScreen from '../screens/FeesScreen';
import ExamsScreen from '../screens/ExamsScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

// Simple icon wrapper component to handle icon rendering
const TabIcon = ({ name, color, size }) => {
  const icons = {
    Home: Home,
    Calendar: Calendar,
    CreditCard: CreditCard,
    FileText: FileText,
    MessageCircle: MessageCircle,
    User: User,
  };
  const IconComponent = icons[name];
  if (!IconComponent) return null;
  return <IconComponent size={size} color={color} />;
};

const TabNavigator = () => {
  const { themeColors } = useTheme();
  const { unreadCount } = useChat();
  const insets = useSafeAreaInsets();

  const tabBarHeight = Platform.OS === 'ios' ? 50 + insets.bottom : Platform.OS === 'web' ? 60 : 60;
  const tabBarPaddingBottom = Platform.OS === 'ios' ? insets.bottom : Platform.OS === 'web' ? 8 : 8;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: themeColors.text,
        tabBarInactiveTintColor: themeColors.textTertiary,
        tabBarStyle: {
          backgroundColor: themeColors.surface,
          borderTopColor: themeColors.border,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: themeColors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: themeColors.border,
        },
        headerTitleStyle: {
          color: themeColors.text,
          fontSize: 18,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="Home" color={color} size={size} />
          ),
          headerTitle: 'Parent Portal',
        }}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{
          title: 'Attendance',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="Calendar" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Fees"
        component={FeesScreen}
        options={{
          title: 'Fees',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="CreditCard" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Exams"
        component={ExamsScreen}
        options={{
          title: 'Exams',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="FileText" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatListScreen}
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <View>
              <TabIcon name="MessageCircle" color={color} size={size} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <View style={[styles.badgeInner, { backgroundColor: themeColors.text }]} />
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="User" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -2,
    right: -6,
  },
  badgeInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default TabNavigator;
