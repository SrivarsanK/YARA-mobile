// packages/shared/components/LiveSignalIcon.tsx
import React, { useEffect } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  useAnimatedProps,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

interface LiveSignalIconProps {
  isConnected: boolean;
  size?: number;
  color?: string;
}

export function LiveSignalIcon({ isConnected, size = 20, color }: LiveSignalIconProps) {
  const tint = color ?? (isConnected ? colors.transit.connected : colors.transit.disconnected);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isConnected) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    } else {
      opacity.value = 1;
    }
  }, [isConnected]);

  const animProps = useAnimatedProps(() => ({ opacity: opacity.value }));

  return (
    <AnimatedSvg
      animatedProps={animProps}
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      stroke={tint}
      strokeWidth={2.5}
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <Circle cx={5} cy={19} r={1.5} fill={tint} />
      <Path d='M5 13.5a5.5 5.5 0 0 1 5.5 5.5' />
      <Path d='M5 8.5a10.5 10.5 0 0 1 10.5 10.5' />
      <Path d='M5 3.5a15.5 15.5 0 0 1 15.5 15.5' />
    </AnimatedSvg>
  );
}
