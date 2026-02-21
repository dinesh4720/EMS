import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Google Material 3 Pastel Colors
const GOOGLE_COLORS = {
  // Pastel Google colors
  blue: '#4285F4',
  blueLight: '#E8F0FE',
  red: '#EA4335',
  redLight: '#FCE8E6',
  yellow: '#FBBC04',
  yellowLight: '#FEF7E0',
  green: '#34A853',
  greenLight: '#E6F4EA',
  // Darker versions for dark mode
  blueDark: '#8AB4F8',
  redDark: '#F28B82',
  yellowDark: '#FDD663',
  greenDark: '#81C995',
};

// Simple animated Material 3 shape (rounded polygon)
const AnimatedM3Shape = ({ delay = 0, isDark }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous rotation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();

    // Gentle float
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  return (
    <Animated.View
      style={[
        styles.m3ShapeContainer,
        {
          transform: [
            { rotate: rotation },
            { scale: scaleAnim },
            { translateY: floatY },
          ],
        },
      ]}
    >
      {/* Main shape - Rounded square/pill */}
      <View style={[styles.m3ShapeMain, { backgroundColor: isDark ? '#8AB4F8' : '#4285F4' }]} />

      {/* Accent shapes */}
      <View style={[styles.m3ShapeAccent1, { backgroundColor: isDark ? '#F28B82' : '#EA4335' }]} />
      <View style={[styles.m3ShapeAccent2, { backgroundColor: isDark ? '#FDD663' : '#FBBC04' }]} />
      <View style={[styles.m3ShapeAccent3, { backgroundColor: isDark ? '#81C995' : '#34A853' }]} />
    </Animated.View>
  );
};

// Main ShapeBanner Component
const ShapeBanner = ({ children, height = 220 }) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Google pastel gradient
  const gradientColors = isDark
    ? ['#1a1a2e', '#16213e', '#0f3460']
    : ['#E8F0FE', '#F0F4FF', '#FFFFFF'];

  return (
    <View
      style={[
        styles.container,
        {
          height,
          paddingTop: insets.top + 8,
          backgroundColor: isDark ? '#1a1a2e' : '#E8F0FE',
        },
      ]}
    >
      {/* Subtle Gradient Background */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />

      {/* Animated M3 Shape on the right */}
      <AnimatedM3Shape delay={200} isDark={isDark} />

      {/* Content Layer */}
      <View style={styles.contentLayer}>
        {children}
      </View>

      {/* Bottom curve overlay */}
      <View
        style={[
          styles.bottomCurve,
          { backgroundColor: colors.surface },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  contentLayer: {
    flex: 1,
    zIndex: 1,
  },
  bottomCurve: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  // M3 Animated Shape
  m3ShapeContainer: {
    position: 'absolute',
    right: -30,
    top: 20,
    width: 180,
    height: 180,
    zIndex: 0,
  },
  m3ShapeMain: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 32,
    top: 20,
    right: 20,
    opacity: 0.9,
  },
  m3ShapeAccent1: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 20,
    top: 0,
    right: 80,
    opacity: 0.85,
  },
  m3ShapeAccent2: {
    position: 'absolute',
    width: 45,
    height: 45,
    borderRadius: 16,
    top: 90,
    right: 0,
    opacity: 0.8,
  },
  m3ShapeAccent3: {
    position: 'absolute',
    width: 35,
    height: 35,
    borderRadius: 12,
    top: 60,
    right: 130,
    opacity: 0.75,
  },
});

export default ShapeBanner;
