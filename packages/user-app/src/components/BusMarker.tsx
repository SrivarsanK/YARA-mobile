// packages/user-app/src/components/BusMarker.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Bus } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import type { BusLeg } from '@yara/shared';

interface BusMarkerProps {
  leg: BusLeg;
  routeCode?: string;
  speedKmh?: number;
}

export const BusMarker: React.FC<BusMarkerProps> = ({
  leg,
  routeCode = 'S26',
  speedKmh,
}) => {
  const dwellPulse = useSharedValue(1);
  const haloScale = useSharedValue(1);
  const haloOpacity = useSharedValue(0.4);

  // Dwell amber pulsing animation
  useEffect(() => {
    if (leg === 'dwell') {
      dwellPulse.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      dwellPulse.value = 1;
    }
  }, [leg]);

  // Continuous outer halo pulse
  useEffect(() => {
    haloScale.value = withRepeat(
      withTiming(1.7, { duration: 1800, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    haloOpacity.value = withRepeat(
      withTiming(0, { duration: 1800, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, []);

  const haloAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: haloScale.value }],
    opacity: haloOpacity.value,
  }));

  const markerAnimatedStyle = useAnimatedStyle(() => {
    const isOutbound = leg === 'outbound';
    const isDwell = leg === 'dwell';

    return {
      opacity: isOutbound ? 0.6 : isDwell ? dwellPulse.value : 1,
    };
  });

  const getMarkerBgColor = () => {
    switch (leg) {
      case 'outbound':
        return '#64748B'; // desaturated slate
      case 'dwell':
        return '#F59E0B'; // amber
      case 'inbound':
      default:
        return '#2563EB'; // solid blue
    }
  };

  const getHaloBgColor = () => {
    switch (leg) {
      case 'outbound':
        return 'rgba(100, 116, 139, 0.4)';
      case 'dwell':
        return 'rgba(245, 158, 11, 0.45)';
      case 'inbound':
      default:
        return 'rgba(37, 99, 235, 0.4)';
    }
  };

  const bgColor = getMarkerBgColor();
  const haloColor = getHaloBgColor();

  return (
    <View style={styles.wrapper}>
      {/* Route Badge Pill floating above */}
      <View style={[styles.routePill, { borderColor: bgColor }]}>
        <Text style={[styles.routePillText, { color: bgColor }]}>{routeCode}</Text>
        {leg === 'dwell' ? (
          <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
        ) : (
          <View style={[styles.statusDot, { backgroundColor: leg === 'inbound' ? '#10B981' : '#64748B' }]} />
        )}
      </View>

      {/* Halo and Circle Icon */}
      <View style={styles.circleContainer}>
        {/* Pulsing Halo */}
        <Animated.View
          style={[
            styles.halo,
            { backgroundColor: haloColor },
            haloAnimatedStyle,
          ]}
        />

        {/* Core Marker Disc */}
        <Animated.View
          style={[
            styles.markerDisc,
            { backgroundColor: bgColor },
            markerAnimatedStyle,
          ]}
        >
          <Bus size={20} color="#FFFFFF" strokeWidth={2.5} />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
    height: 90,
  },
  routePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  routePillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  circleContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  halo: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  markerDisc: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
});
