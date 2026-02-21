import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const Card = ({ children, style, variant = 'default', padding = true }) => {
  const { themeColors, borderRadius, spacing, shadows } = useTheme();

  const getVariantStyle = () => {
    switch (variant) {
      case 'elevated':
        return {
          ...shadows.md,
          backgroundColor: themeColors.surface,
        };
      case 'outlined':
        return {
          backgroundColor: themeColors.surface,
          borderWidth: 1,
          borderColor: themeColors.border,
        };
      case 'flat':
        return {
          backgroundColor: themeColors.backgroundSecondary,
        };
      default:
        return {
          backgroundColor: themeColors.surface,
          ...shadows.sm,
        };
    }
  };

  return (
    <View
      style={[
        styles.card,
        getVariantStyle(),
        padding && { padding: spacing.md },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
});

export default Card;
