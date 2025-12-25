import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
// import { BlurView } from 'expo-blur';
import { COLORS } from '../../theme';

export default function GlassView({ children, style, intensity = 50, tint = 'light' }) {
    // Universal Fallback (High-performance, no native dependencies)
    return (
        <View style={[styles.glass, style]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    glass: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)', // Solid glass feel
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        overflow: 'hidden',
    },
});
