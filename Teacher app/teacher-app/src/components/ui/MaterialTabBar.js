import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Pressable } from 'react-native';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../theme';
import { Feather } from '@expo/vector-icons';

const getIcon = (tabName) => {
    switch (tabName) {
        case 'Home': return 'home';
        case 'Classes': return 'book-open';
        case 'Work': return 'check-square';
        case 'Me': return 'user';
        default: return 'circle';
    }
};

const getLabel = (tabName) => {
    switch (tabName) {
        case 'Home': return 'Today';
        case 'Classes': return 'Classes';
        case 'Work': return 'Work';
        case 'Me': return 'Profile';
        default: return tabName;
    }
};

export default function MaterialTabBar({ tabs, activeTab, onTabPress }) {
    return (
        <View style={styles.container}>
            {tabs.map((tab, index) => {
                const isActive = activeTab === index;
                const iconName = getIcon(tab);
                const label = getLabel(tab);

                return (
                    <View key={tab} style={styles.tabContainer}>
                        <Pressable
                            onPress={() => onTabPress(index)}
                            style={styles.pressable}
                            android_ripple={{ color: COLORS.primaryLight, borderless: true, radius: 40 }}
                        >
                            <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
                                <Feather
                                    name={iconName}
                                    size={24}
                                    color={isActive ? COLORS.primaryDark : COLORS.gray}
                                />
                            </View>
                            <Text style={[styles.label, isActive && styles.activeLabel]}>
                                {label}
                            </Text>
                        </Pressable>
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#F0F4F8', // Surface Color (slightly tinted like M3 Nav Bar)
        height: 80,
        paddingBottom: Platform.OS === 'ios' ? 20 : 0,
        elevation: 0, // M3 Nav Bar usually has no elevation, just distinct color
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    tabContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pressable: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
    },
    iconContainer: {
        width: 64,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    activeIconContainer: {
        backgroundColor: COLORS.primaryLight, // Active Indicator
    },
    label: {
        fontSize: 12,
        fontFamily: 'Inter_500Medium',
        color: COLORS.gray,
    },
    activeLabel: {
        color: COLORS.primaryDark, // OnSurface or Primary
        fontFamily: 'Inter_700Bold',
    },
});
