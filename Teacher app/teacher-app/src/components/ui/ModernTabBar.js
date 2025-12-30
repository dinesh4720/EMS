import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SPACING, SHADOWS, TYPOGRAPHY } from '../../theme';

export default function ModernTabBar({ tabs, activeTab, onTabPress }) {
    const scrollViewRef = useRef(null);

    useEffect(() => {
        // Scroll to active tab roughly
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ x: activeTab * 80, animated: true });
        }
    }, [activeTab]);

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {tabs.map((tab, index) => {
                    const isActive = activeTab === index;
                    return (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, isActive && styles.activeTab]}
                            onPress={() => onTabPress(index)}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.fade,
        paddingVertical: SPACING.m,
    },
    scrollContent: {
        paddingHorizontal: SPACING.l,
        gap: SPACING.s,
    },
    tab: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 100,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    activeTab: {
        backgroundColor: COLORS.primaryLight,
        borderColor: COLORS.primaryLight,
    },
    tabText: {
        ...TYPOGRAPHY.label,
        color: COLORS.gray,
        fontSize: 14,
    },
    activeTabText: {
        color: COLORS.primary,
        fontFamily: 'Inter_600SemiBold',
    }
});
