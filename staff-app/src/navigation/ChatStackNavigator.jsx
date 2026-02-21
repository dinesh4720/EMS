import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';

import ChatScreen from '../screens/ChatScreen';
import ChatDetailScreen from '../screens/ChatDetailScreen';

const Stack = createNativeStackNavigator();

const ChatStackNavigator = () => {
  const theme = useTheme();
  const { colors, isDark } = theme;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: isDark ? colors.surface : '#F8F9FA',
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="ChatList"
        component={ChatScreen}
      />
      <Stack.Screen
        name="ChatDetail"
        component={ChatDetailScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
};

export default ChatStackNavigator;
