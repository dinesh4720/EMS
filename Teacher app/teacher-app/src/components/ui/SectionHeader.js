import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme';

export default function SectionHeader({ title, action, onAction }) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            {action && (
                <TouchableOpacity onPress={onAction}>
                    <Text style={styles.action}>{action}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        paddingHorizontal: SPACING.l,
        marginBottom: SPACING.m,
        marginTop: SPACING.l,
    },
    title: {
        ...TYPOGRAPHY.h3,
        fontSize: 18,
        color: COLORS.dark,
    },
    action: {
        ...TYPOGRAPHY.label,
        color: COLORS.primary,
    }
});
