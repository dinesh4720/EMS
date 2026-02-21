import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';

const LargeTitle = ({
  children,
  subtitle,
  style,
  animated = true,
}) => {
  const opacity = useSharedValue(animated ? 0 : 1);
  const translateY = useSharedValue(animated ? 20 : 0);

  React.useEffect(() => {
    if (animated) {
      opacity.value = withTiming(1, { duration: 600 });
      translateY.value = withTiming(0, { duration: 600 });
    }
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={[styles.title, style]}>{children}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -1.5,
    color: '#1C1C1E',
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '400',
    color: '#8E8E93',
    marginTop: 6,
    letterSpacing: -0.2,
  },
});

export default LargeTitle;
