import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { COLORS, SPACING, SHADOWS, TYPOGRAPHY } from '../../theme';
import { Feather } from '@expo/vector-icons';

export default function ActionCard({
    title,
    subtitle,
    time,
    location,
    onPress,
    actionLabel = "Start Class",
}) {
    return (
        <View style={styles.cardContainer}>
            <Pressable
                onPress={onPress}
                android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
                style={styles.card}
            >
                <View style={styles.content}>
                    <View style={styles.topRow}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>UP NEXT</Text>
                        </View>
                        <Text style={styles.time}>{time}</Text>
                    </View>

                    <View>
                        <Text style={styles.title} numberOfLines={1}>{title}</Text>
                        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
                    </View>

                    <View style={styles.footer}>
                        <View style={styles.location}>
                            <Feather name="map-pin" size={14} color={COLORS.primaryDark} />
                            <Text style={styles.locationText}>{location}</Text>
                        </View>

                        <View style={styles.actionBtn}>
                            <Text style={styles.actionText}>{actionLabel}</Text>
                            <Feather name="arrow-right" size={16} color={COLORS.white} />
                        </View>
                    </View>
                </View>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        marginHorizontal: SPACING.l,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: COLORS.primaryLight, // Tertiary Container or Primary Container
        ...SHADOWS.small,
        elevation: 0
    },
    card: {
        padding: SPACING.l,
        minHeight: 180,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    badge: {
        backgroundColor: COLORS.white,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8, // M3 small shape
    },
    badgeText: {
        color: COLORS.primary,
        fontSize: 11,
        fontFamily: 'Inter_700Bold',
        letterSpacing: 0.5,
    },
    time: {
        color: COLORS.primaryDark,
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
    },
    title: {
        color: COLORS.primaryDark, // OnPrimaryContainer
        fontFamily: 'Inter_400Regular', // Display/Headline
        fontSize: 28,
        marginBottom: 4,
    },
    subtitle: {
        color: COLORS.primary, // OnPrimaryContainer variant
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        marginBottom: SPACING.l,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    location: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.5)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8
    },
    locationText: {
        color: COLORS.primaryDark,
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
    },
    actionBtn: {
        backgroundColor: COLORS.primary, // Primary Button inside Container
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 100, // Pill
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        elevation: 2
    },
    actionText: {
        color: COLORS.white,
        fontFamily: 'Inter_600SemiBold',
        fontSize: 13,
    }
});
