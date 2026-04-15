import 'react-native-reanimated';

import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import {
  ColorSchemeName,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { CartProvider } from '../src/context/CartContext';
import { TenantProvider, useTenant } from '../src/context/TenantContext';
import type { TenantPlantilla } from '../src/lib/tenantPlantilla';
import { fontFamily } from '../theme/fonts';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Paleta Odenix (base de diseño; en multi-tenant vendrá de Baserow). */
const brand = {
  primary: '#9b5de5',
  accent: '#a3e635',
  surfaceDeep: '#2E1065',
} as const;

const light = {
  bg: '#F8F9FA',
  text: '#111827',
  iconInactive: '#6B7280',
  tabActive: brand.primary,
  glassOverlay: 'rgba(255, 255, 255, 0.78)',
  tabBorder: 'rgba(76, 29, 149, 0.08)',
  shadow: '#4c1d95',
} as const;

const dark = {
  bg: '#0B0410',
  text: '#F9FAFB',
  iconInactive: 'rgba(255, 255, 255, 0.42)',
  tabActive: brand.accent,
  glassOverlay: 'rgba(46, 16, 101, 0.18)',
  tabBorder: 'rgba(255, 255, 255, 0.1)',
} as const;

function palette(scheme: ColorSchemeName) {
  return scheme === 'dark' ? dark : light;
}

function tabIconName(
  routeName: string,
  plantilla: TenantPlantilla,
): keyof typeof Ionicons.glyphMap {
  switch (routeName) {
    case 'index':
      return 'home-outline';
    case 'explore':
      return plantilla === 'citas' ? 'calendar-outline' : 'compass-outline';
    case 'profile':
      return 'person-outline';
    default:
      return 'ellipse-outline';
  }
}

type TabBarItemProps = {
  route: BottomTabBarProps['state']['routes'][number];
  index: number;
  label: string;
  options: BottomTabBarProps['descriptors'][string]['options'];
  isFocused: boolean;
  activeIndex: SharedValue<number>;
  colorActive: string;
  colorInactive: string;
  navigation: BottomTabBarProps['navigation'];
  useCustomFonts: boolean;
  tenantPlantilla: TenantPlantilla;
};

function TabBarItem({
  route,
  index,
  label,
  options,
  isFocused,
  activeIndex,
  colorActive,
  colorInactive,
  navigation,
  useCustomFonts,
  tenantPlantilla,
}: TabBarItemProps) {
  const color = isFocused ? colorActive : colorInactive;

  const iconAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      activeIndex.value,
      [index - 0.45, index, index + 0.45],
      [1, 1.1, 1],
      Extrapolation.CLAMP,
    );
    return { transform: [{ scale }] };
  });

  const onPress = () => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const onLongPress = () => {
    navigation.emit({
      type: 'tabLongPress',
      target: route.key,
    });
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={
        typeof options.tabBarAccessibilityLabel === 'string'
          ? options.tabBarAccessibilityLabel
          : label
      }
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.tabPressable,
        { transform: [{ scale: pressed ? 0.95 : 1 }] },
      ]}
    >
      <Animated.View style={iconAnimatedStyle}>
        <Ionicons name={tabIconName(route.name, tenantPlantilla)} size={24} color={color} />
      </Animated.View>
      <Text
        style={[
          styles.tabLabel,
          { color },
          ...(useCustomFonts ? [{ fontFamily: fontFamily.bodyMedium }] : []),
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type FloatingTabBarProps = BottomTabBarProps & {
  useCustomFonts: boolean;
};

function FloatingTabBar({
  state,
  descriptors,
  navigation,
  useCustomFonts,
}: FloatingTabBarProps) {
  const scheme = useColorScheme();
  const t = palette(scheme);
  const isDark = scheme === 'dark';
  const { tenant } = useTenant();
  const insets = useSafeAreaInsets();
  const routes = state.routes;
  const tabCount = routes.length;

  const barWidth = useSharedValue(
    Math.max(0, Dimensions.get('window').width - 40),
  );
  const slotWidth = useSharedValue(barWidth.value / Math.max(tabCount, 1));
  const activeIndex = useSharedValue(state.index);

  useEffect(() => {
    activeIndex.value = withSpring(state.index, { damping: 17, stiffness: 210 });
  }, [state.index, activeIndex]);

  const indicatorStyle = useAnimatedStyle(() => {
    const w = slotWidth.value;
    const margin = 7;
    return {
      width: Math.max(w - margin * 2, 0),
      transform: [{ translateX: activeIndex.value * w + margin }],
    };
  });

  const bottomPad = Math.max(insets.bottom, 10);
  const blurTint: 'dark' | 'light' = isDark ? 'dark' : 'light';

  return (
    <View
      pointerEvents="box-none"
      style={[styles.tabBarWrap, { paddingBottom: bottomPad }]}
    >
      <View
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          barWidth.value = w;
          slotWidth.value = w / Math.max(tabCount, 1);
        }}
        style={[
          styles.tabBarIsland,
          isDark ? styles.tabBarIslandDark : styles.tabBarIslandLight,
        ]}
      >
        <BlurView
          intensity={isDark ? 55 : 45}
          tint={blurTint}
          experimentalBlurMethod={
            Platform.OS === 'android' ? 'dimezisBlurView' : undefined
          }
          style={styles.blurFill}
        />
        <View
          style={[styles.glassTint, { backgroundColor: t.glassOverlay }]}
          pointerEvents="none"
        />

        <View style={styles.tabBarContent}>
          <Animated.View
            style={[
              styles.indicatorPill,
              isDark ? styles.indicatorPillDark : styles.indicatorPillLight,
              indicatorStyle,
            ]}
            renderToHardwareTextureAndroid
          />
          <View style={styles.tabRow}>
            {routes.map((route, index) => {
              const { options } = descriptors[route.key];
              const rawLabel = options.tabBarLabel;
              const label =
                options.title ??
                (typeof rawLabel === 'string' ? rawLabel : String(route.name));
              const isFocused = state.index === index;

              return (
                <TabBarItem
                  key={route.key}
                  route={route}
                  index={index}
                  label={label}
                  options={options}
                  isFocused={isFocused}
                  activeIndex={activeIndex}
                  colorActive={t.tabActive}
                  colorInactive={t.iconInactive}
                  navigation={navigation}
                  useCustomFonts={useCustomFonts}
                  tenantPlantilla={tenant.plantilla}
                />
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const SPLASH_MAX_MS = 2500;

function AppNavigationShell() {
  const scheme = useColorScheme();
  const t = palette(scheme);
  const { tenant } = useTenant();
  // Temporal: forzar fallback a tipografía del sistema para desbloquear render.
  const useCustomFonts = false;
  const splashDone = useRef(false);

  useEffect(() => {
    const hide = () => {
      if (splashDone.current) return;
      splashDone.current = true;
      SplashScreen.hideAsync().catch(() => {});
    };

    hide();
    const id = setTimeout(hide, SPLASH_MAX_MS);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (__DEV__) return;
    void (async () => {
      try {
        const Updates = await import('expo-updates');
        if (!Updates.isEnabled) return;
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch {
        // Silencioso: OTA opcional hasta configurar EAS projectId.
      }
    })();
  }, []);

  const exploreTitle = tenant.plantilla === 'citas' ? 'Agendar' : 'Explorar';

  return (
    <SafeAreaProvider>
      <View style={[styles.root, { backgroundColor: t.bg }]}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Tabs
          screenOptions={{
            headerShown: false,
            sceneStyle: { backgroundColor: t.bg },
            tabBarStyle: {
              position: 'absolute',
              backgroundColor: 'transparent',
              borderTopWidth: 0,
              elevation: 0,
            },
          }}
          tabBar={(props) => (
            <FloatingTabBar {...props} useCustomFonts={useCustomFonts} />
          )}
        >
          <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
          <Tabs.Screen name="explore" options={{ title: exploreTitle }} />
          <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
        </Tabs>
      </View>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <TenantProvider>
        <CartProvider>
          <AppNavigationShell />
        </CartProvider>
      </TenantProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  root: {
    flex: 1,
  },
  tabBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
  },
  tabBarIsland: {
    borderRadius: 24,
    overflow: 'hidden',
    minHeight: 70,
    justifyContent: 'center',
    borderWidth: 1,
  },
  tabBarIslandDark: {
    borderColor: dark.tabBorder,
    ...Platform.select({
      ios: {
        shadowColor: brand.accent,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  tabBarIslandLight: {
    borderColor: light.tabBorder,
    ...Platform.select({
      ios: {
        shadowColor: light.shadow,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 28,
      },
      android: { elevation: 14 },
      default: {},
    }),
  },
  blurFill: {
    ...StyleSheet.absoluteFillObject,
  },
  glassTint: {
    ...StyleSheet.absoluteFillObject,
  },
  tabBarContent: {
    position: 'relative',
    paddingVertical: 10,
    zIndex: 1,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabPressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  indicatorPill: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    borderRadius: 18,
    borderWidth: 1,
  },
  indicatorPillDark: {
    backgroundColor: 'rgba(163, 230, 53, 0.22)',
    borderColor: 'rgba(163, 230, 53, 0.55)',
    ...Platform.select({
      ios: {
        shadowColor: brand.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
        shadowColor: brand.accent,
      },
      default: {},
    }),
  },
  indicatorPillLight: {
    backgroundColor: 'rgba(155, 93, 229, 0.2)',
    borderColor: 'rgba(155, 93, 229, 0.45)',
    ...Platform.select({
      ios: {
        shadowColor: brand.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
      },
      android: {
        elevation: 6,
        shadowColor: brand.primary,
      },
      default: {},
    }),
  },
});
