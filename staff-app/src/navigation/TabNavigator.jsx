import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, MessageCircle, BookOpen, GraduationCap, User, Bell, FileText } from 'lucide-react-native';

import HomeScreen from '../screens/HomeScreen';
import ProfileStackNavigator from './ProfileStackNavigator';
import ChatStackNavigator from './ChatStackNavigator';
import ClassStackNavigator from './ClassStackNavigator';
import StudentsStackNavigator from './StudentsStackNavigator';
import NotificationsStackNavigator from './NotificationsStackNavigator';
import ExamStackNavigator from './ExamStackNavigator';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();

const TabIcon = ({ Icon, label, focused, theme }) => {
  const { colors, typography, isDark } = theme;
  
  return (
    <View style={styles.tabIconContainer}>
      <View
        style={[
          styles.iconPill,
          focused && { 
            backgroundColor: isDark 
              ? colors.primary + '30'
              : colors.primaryContainer,
          },
        ]}
      >
        <Icon
          size={22}
          color={focused 
            ? (isDark ? colors.primary : colors.onPrimaryContainer)
            : colors.onSurfaceVariant
          }
          strokeWidth={focused ? 2.5 : 2}
        />
      </View>
      <Text
        style={[
          styles.tabLabel,
          typography.labelMedium,
          { 
            color: focused 
              ? (isDark ? colors.primary : colors.onSurface)
              : colors.onSurfaceVariant,
            fontWeight: focused ? '600' : '500',
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const TabNavigator = () => {
  const insets = useSafeAreaInsets();
  const { unreadCount } = useChat();
  const theme = useTheme();
  const { colors, isDark, shadows } = theme;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          borderTopWidth: 0,
          height: 72 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 10,
          elevation: 0,
          shadowOpacity: 0,
          ...shadows.medium,
          borderTopColor: isDark ? colors.outlineVariant : 'rgba(0,0,0,0.05)',
          borderTopWidth: isDark ? 0.5 : 0,
        },
        tabBarShowLabel: false,
        tabBarItemStyle: {
          paddingTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Home} label="Home" focused={focused} theme={theme} />
          ),
        }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={MessageCircle} label="Chat" focused={focused} theme={theme} />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : null,
          tabBarBadgeStyle: {
            backgroundColor: colors.error,
            color: colors.onError,
            fontSize: 11,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            lineHeight: 16,
            fontWeight: '700',
          },
        }}
      />
      <Tab.Screen
        name="ClassesTab"
        component={ClassStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={BookOpen} label="Classes" focused={focused} theme={theme} />
          ),
        }}
      />
      <Tab.Screen
        name="StudentsTab"
        component={StudentsStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={GraduationCap} label="Students" focused={focused} theme={theme} />
          ),
        }}
      />
      <Tab.Screen
        name="ExamsTab"
        component={ExamStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={FileText} label="Exams" focused={focused} theme={theme} />
          ),
        }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Bell} label="Notifications" focused={focused} theme={theme} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={User} label="Profile" focused={focused} theme={theme} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
  },
  iconPill: {
    width: 56,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tabLabel: {
    textAlign: 'center',
  },
});

export default TabNavigator;
