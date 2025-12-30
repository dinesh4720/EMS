import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { SHADOWS } from '../../theme';

export default function GradientBanner({
    title,
    subtitle,
    buttonText,
    onPress,
    colors = ['#FF9A9E', '#FECFEF'], // Default pink-ish gradient
    start = { x: 0, y: 0 },
    end = { x: 1, y: 1 }
}) {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={colors}
                start={start}
                end={end}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    <Text style={styles.title}>{title}</Text>
                    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

                    {buttonText && (
                        <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.8}>
                            <Text style={styles.buttonText}>{buttonText}</Text>
                            <Feather name="arrow-right" size={16} color="black" />
                        </TouchableOpacity>
                    )}
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 28,
        marginBottom: 20,
        ...SHADOWS.medium,
        marginHorizontal: 4,
    },
    gradient: {
        borderRadius: 28,
        padding: 24,
        minHeight: 180,
        justifyContent: 'space-between'
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 22,
        fontFamily: 'Inter_500Medium', // Using the app's font
        color: '#1F1F1F', // Dark text as per image
        lineHeight: 30,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: 'Inter_400Regular',
        color: '#1F1F1F',
        opacity: 0.8,
        lineHeight: 22,
        marginBottom: 24,
    },
    button: {
        backgroundColor: 'white',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 100, // Pill shape
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        ...SHADOWS.small,
    },
    buttonText: {
        fontSize: 14,
        fontFamily: 'Inter_600SemiBold',
        color: 'black',
        marginRight: 8,
    }
});
