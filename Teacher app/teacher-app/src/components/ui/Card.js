import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { COLORS, SHADOWS, SPACING } from '../../theme';

export default function Card({ children, style, variant = 'elevated' }) {
    return (
        <View style={[
            styles.card,
            variant === 'elevated' && styles.elevated,
            variant === 'outlined' && styles.outlined,
            style
        ]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: SPACING.m,
        marginBottom: SPACING.m,
    },
    elevated: {
        ...SHADOWS.small,
    },
    outlined: {
        borderWidth: 1,
        borderColor: COLORS.lightGray,
        elevation: 0,
        shadowOpacity: 0,
    }
});
