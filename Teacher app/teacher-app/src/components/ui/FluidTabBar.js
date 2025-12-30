import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../../theme';
import { Feather } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * FluidTabBar (Google Material 3 Navigation Bar)
 * - Full width at the bottom.
 * - Active state has a pill-shaped indicator around the icon.
 * - Labels always visible (or selected only, but we do always for M3 default).
 */
export default function FluidTabBar({ tabs, activeTab, onTabPress }) {
    // We map tab names to icons here for simplicity since we pass strings in App.js
    const getIcon = (tabName) => {
        switch (tabName) {
            case 'Home': return 'home'; // Updated from Today
            case 'Today': return 'sun'; // Fallback
            case 'Classes': return 'book-open'; // Better than users
            case 'Work': return 'check-square';
            case 'Me': return 'user';
            default: return 'circle';
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.tabsRow}>
                {tabs.map((tab, index) => {
                    const isActive = activeTab === index;
                    return (
                        <TouchableOpacity
                            key={tab}
                            activeOpacity={0.8}
                            onPress={() => onTabPress(index)}
                            style={styles.tabItem}
                        >
                            {/* Active Indicator Pill */}
                            <View style={[styles.iconContainer, isActive && styles.activeIndicator]}>
                                <Feather
                                    name={getIcon(tab)}
                                    size={24}
                                    color={isActive ? COLORS.primary : COLORS.gray}
                                />
                            </View>
                            <Text style={[
                                styles.tabText,
                                isActive && styles.tabTextActive
                            ]}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.surface || '#FFFFFF', // M3 Surface
        borderTopWidth: 0, // No border, maybe elevation
        elevation: 8, // Shadow for elevation
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        paddingBottom: SPACING.s, // Bottom safe area padding
        paddingTop: 12, // Top padding inside bar
        height: 80, // Standard M3 Nav Bar height
        width: '100%',
    },
    tabsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        width: '100%',
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1, // Distribute evenly
    },
    iconContainer: {
        width: 64, // M3 Active Indicator width
        height: 32, // M3 Active Indicator height
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16, // Pill shape
        marginBottom: 4,
    },
    activeIndicator: {
        backgroundColor: COLORS.primaryLight, // M3 Active Indicator color
    },
    tabText: {
        fontSize: 12,
        fontFamily: 'Inter_500Medium',
        color: COLORS.gray,
        marginTop: 4,
    },
    tabTextActive: {
        color: COLORS.dark, // Active label color
        fontFamily: 'Inter_600SemiBold', // Make it bold when active
    },
});
