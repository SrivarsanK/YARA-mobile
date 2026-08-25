import React, { useEffect } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Svg, {
  G,
  Path,
  Rect,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@yara/shared';

interface YaraAnimatedLogoProps {
  height?: number;
  width?: number;
  animate?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const YaraAnimatedLogo: React.FC<YaraAnimatedLogoProps> = ({
  height = 56,
  width = 240,
  animate = true,
  style,
}) => {
  const bobY = useSharedValue(0);
  const glowOpacity = useSharedValue(0.6);

  useEffect(() => {
    if (animate) {
      bobY.value = withRepeat(
        withSequence(
          withTiming(-2.5, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
          withTiming(1.5, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 800, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );

      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.4, { duration: 1200, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    } else {
      bobY.value = 0;
      glowOpacity.value = 0.8;
    }
  }, [animate]);

  const animatedBobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bobY.value }],
  }));

  return (
    <View style={[styles.container, { width, height }, style]}>
      <Animated.View style={[{ width: '100%', height: '100%' }, animatedBobStyle]}>
        <Svg viewBox="0 0 260 60" width="100%" height="100%">
          <Defs>
            {/* Badge Gradient */}
            <LinearGradient id="badgeGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#F59E0B" />
              <Stop offset="100%" stopColor="#D97706" />
            </LinearGradient>

            {/* Text Gradient */}
            <LinearGradient id="textGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor="#0F172A" />
              <Stop offset="100%" stopColor="#334155" />
            </LinearGradient>

            {/* Bus Glass Gradient */}
            <LinearGradient id="glassGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#E0F2FE" />
              <Stop offset="100%" stopColor="#7DD3FC" />
            </LinearGradient>
          </Defs>

          {/* Bus Shield Emblem */}
          <G transform="translate(6, 4)">
            <Rect
              x="0"
              y="0"
              width="52"
              height="52"
              rx="16"
              fill="url(#badgeGrad)"
            />

            <Rect
              x="1.5"
              y="1.5"
              width="49"
              height="49"
              rx="14.5"
              fill="none"
              stroke="#FEF3C7"
              strokeWidth="1.5"
              strokeOpacity="0.6"
            />

            {/* Bus Body */}
            <G transform="translate(8, 12)">
              <Rect
                x="0"
                y="4"
                width="36"
                height="22"
                rx="5"
                fill="#0F172A"
              />

              <Rect
                x="3"
                y="7"
                width="13"
                height="10"
                rx="2.5"
                fill="url(#glassGrad)"
              />

              <Rect
                x="18"
                y="7"
                width="7"
                height="8"
                rx="2"
                fill="url(#glassGrad)"
              />
              <Rect
                x="27"
                y="7"
                width="6"
                height="8"
                rx="2"
                fill="url(#glassGrad)"
              />

              {/* Headlights */}
              <Circle cx="3" cy="21" r="2" fill="#FDE047" />
              <Circle cx="33" cy="21" r="2" fill="#EF4444" />

              {/* Wheels */}
              <Circle cx="9" cy="26" r="4.5" fill="#020617" />
              <Circle cx="9" cy="26" r="2" fill="#94A3B8" />

              <Circle cx="27" cy="26" r="4.5" fill="#020617" />
              <Circle cx="27" cy="26" r="2" fill="#94A3B8" />

              {/* Roof Sensor Beacon */}
              <Rect x="15" y="1.5" width="6" height="3" rx="1.5" fill="#22C55E" />
              <Circle cx="18" cy="0.5" r="1.5" fill="#4ADE80" />
            </G>
          </G>

          {/* Brand Name Typography */}
          <G transform="translate(68, 8)">
            <SvgText
              x="0"
              y="29"
              fill="url(#textGrad)"
              fontSize="30"
              fontWeight="900"
              letterSpacing="2"
            >
              YARA
            </SvgText>

            <Circle cx="96" cy="14" r="3.5" fill="#F59E0B" />

            <SvgText
              x="1"
              y="42"
              fill="#64748B"
              fontSize="8.5"
              fontWeight="800"
              letterSpacing="1.8"
            >
              TRANSIT INTELLIGENCE
            </SvgText>
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
