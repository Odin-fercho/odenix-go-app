/**
 * iOS / Android: `@react-three/fiber/native` + expo-gl.
 *
 * Nota: el simulador iOS (EXGL) no implementa multisample; R3F arranca GLView con
 * `msaaSamples: 4` antes de poder leer `gl.antialias: false`. Por eso en simulador
 * usamos el mismo hero 2D que en web (`Hero3DScene.web`).
 */
import { Icosahedron } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber/native';
import Constants from 'expo-constants';
import { useRef } from 'react';
import { Platform, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import type { Mesh } from 'three';

import { HERO_HEIGHT } from './constants';
import { Hero3DScene as Hero3DSceneWeb } from './Hero3DScene.web';

type Props = {
  accentColor: string;
  style?: StyleProp<ViewStyle>;
};

function GlassIcosahedron({ color, simple }: { color: string; simple: boolean }) {
  const meshRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = clock.elapsedTime;
    mesh.rotation.x = t * 0.38;
    mesh.rotation.y = t * 0.52;
    mesh.position.y = Math.sin(t * 1.08) * 0.14;
  });

  if (simple) {
    return (
      <Icosahedron ref={meshRef} args={[1, 1]}>
        <meshStandardMaterial color={color} metalness={0.28} roughness={0.22} />
      </Icosahedron>
    );
  }

  return (
    <Icosahedron ref={meshRef} args={[1, 1]}>
      <meshPhysicalMaterial
        color={color}
        metalness={0.28}
        roughness={0.14}
        transmission={0.9}
        thickness={0.55}
        ior={1.47}
        transparent
      />
    </Icosahedron>
  );
}

const isIosSimulator = Platform.OS === 'ios' && !Constants.isDevice;
const useSimpleNativeMaterial = Platform.OS === 'ios' || Platform.OS === 'android';

export function Hero3DScene({ accentColor, style }: Props) {
  if (isIosSimulator) {
    return <Hero3DSceneWeb accentColor={accentColor} style={style} />;
  }

  return (
    <Canvas
      style={StyleSheet.flatten([styles.canvas, style])}
      camera={{ position: [0, 0, 3.35], fov: 42 }}
      gl={{ antialias: false }}
    >
      <ambientLight intensity={0.48} />
      <directionalLight position={[5, 7, 6]} intensity={1.2} />
      <directionalLight position={[-4, -3, -5]} intensity={0.4} color="#c4b5fd" />
      <GlassIcosahedron color={accentColor} simple={useSimpleNativeMaterial} />
    </Canvas>
  );
}

const styles = StyleSheet.create({
  canvas: {
    width: '100%',
    height: HERO_HEIGHT,
  },
});
