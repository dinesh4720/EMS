import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const Card = ({
  children,
  style,
  onPress,
  animated = true,
  delay = 0,
}) => {
  const scale = useSharedValue(animated ? 0.95 : 1);
  const opacity = useSharedValue(animated ? 0 : 1);

  React.useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        scale.value = withSpring(1, {
          damping: 15,
          stiffness: 150,
        });
        opacity.value = withSpring(1);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [animated, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Animated.View style={animatedStyle}>
      <Container
        style={[styles.card, style]}
        onPress={handlePress}
        activeOpacity={onPress ? 0.9 : 1}
      >
        {children}
      </Container>
    </Animated.View>
  );
};

const CardSection = ({ children, style, isFirst, isLast }) => {
  return (
    <View
      style={[
        styles.section,
        isFirst && styles.sectionFirst,
        isLast && styles.sectionLast,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const CardTitle = ({ children, style }) => (
  <Text style={[styles.sectionTitle, style]}>{children}</Text>
);

const CardValue = ({ children, style }) => (
  <Text style={[styles.sectionValue, style]}>{children}</Text>
);

Card.Section = CardSection;
Card.Title = CardTitle;
Card.Value = CardValue;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  section: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(60, 60, 67, 0.12)',
  },
  sectionFirst: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  sectionLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  sectionTitle: {
    fontSize: 13,
    color: '#8E8E93',
    letterSpacing: -0.1,
    marginBottom: 2,
  },
  sectionValue: {
    fontSize: 17,
    fontWeight: '400',
    color: '#1C1C1E',
    letterSpacing: -0.4,
  },
});

export default Card;
