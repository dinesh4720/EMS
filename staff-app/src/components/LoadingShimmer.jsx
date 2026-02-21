import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const Shimmer = ({ width, height, borderRadius = 8, style }) => {
  const shimmerValue = useSharedValue(0);

  React.useEffect(() => {
    shimmerValue.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(shimmerValue.value, [0, 1], [0.3, 0.7]);
    return { opacity };
  });

  return (
    <Animated.View
      style={[
        styles.shimmer,
        { width, height, borderRadius },
        animatedStyle,
        style,
      ]}
    />
  );
};

const LoadingShimmer = () => {
  return (
    <View style={styles.container}>
      {/* Stats Row */}
      <View style={styles.statsRow}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.statCard}>
            <Shimmer width={40} height={40} borderRadius={12} />
            <Shimmer width={50} height={28} borderRadius={4} style={{ marginTop: 8 }} />
            <Shimmer width={60} height={12} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>

      {/* Timetable Cards */}
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.timetableCard}>
          <View style={styles.timeColumn}>
            <Shimmer width={40} height={14} borderRadius={4} />
            <Shimmer width={40} height={14} borderRadius={4} style={{ marginTop: 16 }} />
          </View>
          <View style={styles.contentColumn}>
            <Shimmer width={100} height={24} borderRadius={12} />
            <Shimmer width={'70%'} height={18} borderRadius={4} style={{ marginTop: 8 }} />
            <View style={styles.detailsRow}>
              <Shimmer width={80} height={14} borderRadius={4} />
              <Shimmer width={120} height={14} borderRadius={4} style={{ marginLeft: 16 }} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  shimmer: {
    backgroundColor: '#E5E5EA',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  timetableCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
  },
  timeColumn: {
    width: 50,
    alignItems: 'center',
    paddingTop: 10,
  },
  contentColumn: {
    flex: 1,
    paddingLeft: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
});

export default LoadingShimmer;
export { Shimmer };
