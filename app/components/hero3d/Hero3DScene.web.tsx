/**
 * Web: sin Three.js / R3F — evita `import.meta` en el bundle Metro (rompe el runtime en el navegador).
 * El hero 3D WebGL vive solo en iOS/Android (`Hero3DScene.tsx`).
 */
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';

import { HERO_HEIGHT } from './constants';

type Props = {
  accentColor: string;
  style?: StyleProp<ViewStyle>;
};

const ORB = 120;

export function Hero3DScene({ accentColor, style }: Props) {
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [float]);

  const translateY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <View style={StyleSheet.flatten([styles.wrap, style])}>
      <LinearGradient
        colors={[
          `${accentColor}55`,
          'rgba(11, 4, 16, 0.92)',
          'rgba(46, 16, 101, 0.45)',
        ]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <Animated.View
        style={[
          styles.orb,
          {
            borderColor: `${accentColor}99`,
            backgroundColor: `${accentColor}40`,
            shadowColor: accentColor,
            transform: [{ translateY }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    height: HERO_HEIGHT,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb: {
    width: ORB,
    height: ORB,
    borderRadius: ORB / 2,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 28,
    elevation: 12,
  },
});
