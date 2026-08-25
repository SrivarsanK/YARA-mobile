import React, { useEffect } from 'react';
import { View, Image, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface YaraAnimatedLogoProps {
  height?: number;
  width?: number;
  animate?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const YaraAnimatedLogo: React.FC<YaraAnimatedLogoProps> = ({
  height = 38,
  width = 130,
  animate = true,
  style,
}) => {
  const bobY = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      bobY.value = withRepeat(
        withSequence(
          withTiming(-2, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 800, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );
    } else {
      bobY.value = 0;
    }
  }, [animate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bobY.value }],
  }));

  return (
    <View style={[styles.container, { width, height }, style]}>
      <Animated.View style={[{ width: '100%', height: '100%' }, animatedStyle]}>
        <Image
          source={require('../../assets/yara-logo.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
