
import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../../theme';
import GlassView from '../ui/GlassView';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * FluidTabBar
 * - Renders a horizontal list of tabs.
 * - Uses a sliding "pill" background for the active tab.
 * - Provides a morphing/fluid feel.
 */
export default function FluidTabBar({ tabs, activeTab, onTabPress }) {
    const [measures, setMeasures] = useState([]);
    const containerRef = useRef();
    const slideAnim = useRef(new Animated.Value(0)).current;
    const widthAnim = useRef(new Animated.Value(0)).current;

    // Initialize animation when activeTab changes
    useEffect(() => {
        if (measures && measures[activeTab]) {
            const { x, width } = measures[activeTab];

            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: x,
                    useNativeDriver: false,
                    friction: 9,
                    tension: 60,
                }),
                Animated.spring(widthAnim, {
                    toValue: width,
                    useNativeDriver: false,
                    friction: 9,
                    tension: 60,
                }),
            ]).start();
        }
    }, [activeTab, measures]);

    // Measure tab layout
    const handleLayout = (event, index) => {
        const { x, width } = event.nativeEvent.layout;

        // Calculate centered pill dimensions
        // We want the pill to be slightly smaller than the tab area
        const padding = SPACING.s;
        const pillWidth = width - (padding * 2);
        const pillX = x + padding;

        setMeasures(prev => {
            const m = [...prev];
            // Only update if changed to avoid loops
            if (!m[index] || m[index].x !== pillX || m[index].width !== pillWidth) {
                m[index] = { x: pillX, width: pillWidth };
            }
            return m;
        });
    };

    return (
        <View style={styles.container}>
            <GlassView intensity={50} style={styles.glassContainer}>
                {/* Animated Pill Background */}
                {measures.length > 0 && measures[activeTab] && (
                    <Animated.View
                        style={[
                            styles.activePill,
                            {
                                transform: [{ translateX: slideAnim }],
                                width: widthAnim,
                            },
                        ]}
                    />
                )}

                {/* Tab Items */}
                <View style={styles.tabsRow}>
                    {tabs.map((tab, index) => {
                        const isActive = activeTab === index;
                        return (
                            <TouchableOpacity
                                key={tab}
                                activeOpacity={0.7}
                                onPress={() => onTabPress(index)}
                                style={styles.tabItem}
                                onLayout={(e) => handleLayout(e, index)}
                            >
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
            </GlassView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: SPACING.m,
        marginVertical: SPACING.s,
    },
    glassContainer: {
        borderRadius: 30,
        backgroundColor: 'rgba(235, 235, 235, 0.45)', // Slightly lighter glass for container
        padding: SPACING.xs, // Padding for the floating effect
        overflow: 'hidden',
        height: 52, // Fixed height for consistency
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    tabsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '100%',
        position: 'absolute',
        left: SPACING.xs,
        right: SPACING.xs,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        zIndex: 2,
        paddingHorizontal: 4, // Prevent touch overlap
    },
    tabText: {
        fontSize: 13,
        fontFamily: 'Inter_500Medium',
        color: COLORS.gray,
    },
    tabTextActive: {
        color: COLORS.black,
        fontFamily: 'Inter_500Medium',
    },
    activePill: {
        position: 'absolute',
        backgroundColor: COLORS.white,
        borderRadius: 25,
        zIndex: 1,
        top: 4,
        left: 4,
        bottom: 4,
        height: 44, // 52 (container) - 8 (padding)
        ...SHADOWS.small,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
    }
});
