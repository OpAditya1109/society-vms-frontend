// src/components/resident/SkeletonCard.js
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from 'react-native-paper';

/**
 * SkeletonCard — animated shimmer placeholder card.
 *
 * @param {{ height?: number, borderRadius?: number, style?: object }} props
 */
export default function SkeletonCard({ height = 90, borderRadius = 16, style }) {
  const { colors } = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.85],
  });

  return (
    <Animated.View
      style={[
        styles.card,
        {
          height,
          borderRadius,
          backgroundColor: colors.outlineVariant,
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * SkeletonDashboard — renders 4 skeleton stat cards in a 2×2 grid.
 */
export function SkeletonDashboard() {
  return (
    <View style={styles.grid}>
      <SkeletonCard style={styles.gridItem} />
      <SkeletonCard style={styles.gridItem} />
      <SkeletonCard style={styles.gridItem} />
      <SkeletonCard style={styles.gridItem} />
    </View>
  );
}

/**
 * SkeletonList — renders N skeleton list rows.
 */
export function SkeletonList({ count = 5 }) {
  return (
    <View style={{ gap: 10, paddingHorizontal: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} height={100} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
  },
  gridItem: {
    width: '47%',
    height: 100,
  },
});