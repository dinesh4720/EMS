import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../theme';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function ModernHeader({ title, subtitle, userInitials, image }) {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <View>
                <Text style={styles.subtitle}>{subtitle}</Text>
                <Text style={styles.title}>{title}</Text>
            </View>

            <TouchableOpacity
                style={styles.profileBtn}
                onPress={() => navigation.navigate('Profile')}
                activeOpacity={0.8}
            >
                {image ? (
                    <Image source={{ uri: image }} style={styles.image} />
                ) : (
                    <View style={styles.initialsContainer}>
                        <Text style={styles.initials}>{userInitials}</Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.l,
        paddingTop: SPACING.l, // Adjust based on SafeArea
        paddingBottom: SPACING.m,
    },
    title: {
        ...TYPOGRAPHY.h1,
        color: COLORS.dark,
        lineHeight: 38,
    },
    subtitle: {
        ...TYPOGRAPHY.label,
        color: COLORS.gray,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontSize: 12,
    },
    profileBtn: {
        ...SHADOWS.medium,
        shadowColor: COLORS.primary,
        shadowOpacity: 0.2,
    },
    initialsContainer: {
        width: 48,
        height: 48,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.surface,
    },
    image: {
        width: 48,
        height: 48,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: COLORS.surface,
    },
    initials: {
        ...TYPOGRAPHY.h3,
        color: COLORS.primary,
    }
});
