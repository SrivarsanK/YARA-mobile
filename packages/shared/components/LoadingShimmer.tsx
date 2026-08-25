// packages/shared/components/LoadingShimmer.tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors } from '../theme/colors';

export interface LoadingShimmerProps {
  rows?: number;
}

export function LoadingShimmer({ rows = 4 }: LoadingShimmerProps) {
  const animatedOpacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedOpacity, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(animatedOpacity, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [animatedOpacity]);

  return (
    <View style={styles.container}>
      {Array.from({ length: rows }).map((_, index) => (
        <View key={`shimmer-row-${index}`} style={styles.card}>
          <View style={styles.leftRow}>
            <Animated.View
              style={[
                styles.iconBoxSkeleton,
                { opacity: animatedOpacity },
              ]}
            />
            <View style={styles.contentSkeleton}>
              <Animated.View
                style={[
                  styles.titleSkeleton,
                  { opacity: animatedOpacity },
                ]}
              />
              <Animated.View
                style={[
                  styles.lineLongSkeleton,
                  { opacity: animatedOpacity },
                ]}
              />
              <Animated.View
                style={[
                  styles.lineShortSkeleton,
                  { opacity: animatedOpacity },
                ]}
              />
            </View>
          </View>

          <Animated.View
            style={[
              styles.actionSkeleton,
              { opacity: animatedOpacity },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg.primary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  iconBoxSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.neutral[200],
    marginRight: 12,
    flexShrink: 0,
  },
  contentSkeleton: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  titleSkeleton: {
    height: 14,
    width: '35%',
    borderRadius: 4,
    backgroundColor: colors.neutral[200],
    marginBottom: 8,
  },
  lineLongSkeleton: {
    height: 11,
    width: '75%',
    borderRadius: 4,
    backgroundColor: colors.neutral[200],
    marginBottom: 6,
  },
  lineShortSkeleton: {
    height: 10,
    width: '50%',
    borderRadius: 4,
    backgroundColor: colors.neutral[200],
  },
  actionSkeleton: {
    width: 44,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.neutral[200],
    flexShrink: 0,
    marginLeft: 6,
  },
});
