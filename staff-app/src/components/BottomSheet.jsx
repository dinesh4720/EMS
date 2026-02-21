import React, { useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { X } from 'lucide-react-native';

import { useTheme } from '../context/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const BottomSheet = ({
  visible,
  onClose,
  children,
  title,
  snapPoints = [0.5, 0.85],
  showHandle = true,
}) => {
  const theme = useTheme();
  const { colors, typography, spacing, shape, isDark } = theme;

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const context = useSharedValue({ y: SCREEN_HEIGHT });
  const isOpen = useSharedValue(false);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, {
        damping: 50,
        stiffness: 400,
        mass: 0.8,
      });
      isOpen.value = true;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
      isOpen.value = false;
    }
  }, [visible]);

  const closeSheet = useCallback(() => {
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
    isOpen.value = false;
    setTimeout(() => onClose(), 300);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [onClose]);

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        runOnJS(closeSheet)();
      } else {
        translateY.value = withSpring(0, {
          damping: 50,
          stiffness: 400,
        });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateY.value,
      [0, SCREEN_HEIGHT],
      [0.5, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const sheetHeight = SCREEN_HEIGHT * snapPoints[1];

  if (!visible && translateY.value >= SCREEN_HEIGHT - 10) return null;

  return (
    <View style={styles.overlay} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity
          activeOpacity={1}
          style={StyleSheet.absoluteFill}
          onPress={closeSheet}
        />
      </Animated.View>

      {/* Sheet */}
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[
            styles.sheet,
            animatedStyle,
            { 
              height: sheetHeight,
              backgroundColor: colors.surface,
              borderTopLeftRadius: shape.cornerXLarge,
              borderTopRightRadius: shape.cornerXLarge,
            },
          ]}
        >
          {showHandle && (
            <View style={styles.handleContainer}>
              <View style={[styles.handle, { backgroundColor: colors.outlineVariant }]} />
            </View>
          )}

          {title && (
            <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
              <Text style={[typography.titleLarge, { color: colors.onSurface, flex: 1 }]}>{title}</Text>
              <Pressable
                onPress={closeSheet}
                style={({ pressed }) => [
                  styles.closeButton,
                  { backgroundColor: pressed ? colors.surfaceContainerHigh : colors.surfaceContainer },
                ]}
                hitSlop={8}
              >
                <X size={20} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>
          )}

          <View style={styles.content}>{children}</View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 32,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
});

export default BottomSheet;
