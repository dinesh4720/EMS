import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { COLORS, SPACING } from '../../theme';

export default function Button({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    loading = false,
    style,
    textStyle,
    icon
}) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const getBackgroundColor = () => {
        if (variant === 'primary') return COLORS.primary;
        if (variant === 'secondary') return COLORS.secondary; // Tonal button (Light Blue)
        if (variant === 'outline') return 'transparent';
        if (variant === 'danger') return COLORS.danger;
        return COLORS.primary;
    };

    const getTextColor = () => {
        if (variant === 'primary' || variant === 'danger') return COLORS.white;
        if (variant === 'secondary') return COLORS.onSecondary; // Dark blue text
        if (variant === 'outline') return COLORS.primary;
        return COLORS.white;
    };

    return (
        <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity
                style={[
                    styles.container,
                    { backgroundColor: getBackgroundColor() },
                    variant === 'outline' && styles.border, // Only outline has border, secondary is now filled
                    size === 'small' && styles.small,
                    size === 'large' && styles.large,
                    style,
                ]}
                onPress={onPress}
                onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()}
                disabled={loading}
                activeOpacity={0.8}
            >
                {loading ? (
                    <ActivityIndicator color={getTextColor()} />
                ) : (
                    <>
                        {icon && icon}
                        <Text style={[
                            styles.text,
                            { color: getTextColor() },
                            size === 'small' && styles.smallText,
                            size === 'large' && styles.largeText,
                            textStyle
                        ]}>
                            {title}
                        </Text>
                    </>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 100, // Pill shape
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    border: {
        borderWidth: 1,
        borderColor: '#747775', // Google outline color
    },
    text: {
        fontSize: 14,
        fontFamily: 'Inter_500Medium',
        letterSpacing: 0.1,
    },
    small: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    large: {
        paddingVertical: 16,
        paddingHorizontal: 32,
    },
    smallText: {
        fontSize: 13,
    },
    largeText: {
        fontSize: 16,
    }
});
