import 'react-native-reanimated';

import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import {
  Appearance,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
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
import { APP_BACKGROUND } from '../theme/appShell';
import { fontFamily, useOdenixFonts } from '../theme/fonts';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Paleta Odenix (base de diseño; en multi-tenant vendrá de Baserow). */
const brand = {
  primary: '#9b5de5',
  accent: '#a3e635',
  surfaceDeep: '#2E1065',
} as const;

/** Tema fijo de la barra de pestañas (siempre oscuro; no seguir al sistema). */
const shell = {
  bg: APP_BACKGROUND,
  text: '#F9FAFB',
  iconInactive: 'rgba(255, 255, 255, 0.42)',
  tabActive: brand.accent,
  glassOverlay: 'rgba(46, 16, 101, 0.22)',
  tabBorder: 'rgba(255, 255, 255, 0.1)',
} as const;

/** Rutas con pestaña visible (evita pantallas colgadas por carpetas bajo `app/`). */
const TAB_ROUTE_WHITELIST = new Set(['index', 'explore', 'profile']);

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
  const t = shell;
  const { tenant } = useTenant();
  const insets = useSafeAreaInsets();
  const routes = state.routes.filter((r) => TAB_ROUTE_WHITELIST.has(r.name));
  const tabCount = routes.length;
  const focusedRoute = state.routes[state.index];
  const visibleFocusIndex = Math.max(
    0,
    routes.findIndex((r) => r.key === focusedRoute?.key),
  );

  const barWidth = useSharedValue(
    Math.max(0, Dimensions.get('window').width - 40),
  );
  const slotWidth = useSharedValue(barWidth.value / Math.max(tabCount, 1));
  const activeIndex = useSharedValue(visibleFocusIndex);

  useEffect(() => {
    activeIndex.value = withSpring(visibleFocusIndex, { damping: 17, stiffness: 210 });
  }, [visibleFocusIndex, activeIndex]);

  const indicatorStyle = useAnimatedStyle(() => {
    const w = slotWidth.value;
    const margin = 7;
    return {
      width: Math.max(w - margin * 2, 0),
      transform: [{ translateX: activeIndex.value * w + margin }],
    };
  });

  const bottomPad = Math.max(insets.bottom, 10);

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
        style={styles.tabBarIsland}
      >
        <BlurView
          intensity={55}
          tint="dark"
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
            style={[styles.indicatorPill, indicatorStyle]}
            renderToHardwareTextureAndroid
          />
          <View style={styles.tabRow}>
            {routes.map((route, index) => {
              const { options } = descriptors[route.key];
              const rawLabel = options.tabBarLabel;
              const label =
                options.title ??
                (typeof rawLabel === 'string' ? rawLabel : String(route.name));
              const isFocused = visibleFocusIndex === index;

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
  const { tenant } = useTenant();
  const { useCustomFonts, loaded: fontsLoaded } = useOdenixFonts();
  const splashDone = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Appearance.setColorScheme('dark');
    }
  }, []);

  useEffect(() => {
    const hide = () => {
      if (splashDone.current) return;
      splashDone.current = true;
      SplashScreen.hideAsync().catch(() => {});
    };

    if (Platform.OS === 'web') {
      hide();
      return;
    }

    if (fontsLoaded) hide();
    const id = setTimeout(hide, SPLASH_MAX_MS);
    return () => clearTimeout(id);
  }, [fontsLoaded]);

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
      <View style={[styles.root, { backgroundColor: APP_BACKGROUND }]}>
        <StatusBar style="light" />
        <Tabs
          screenOptions={{
            headerShown: false,
            sceneStyle: { backgroundColor: APP_BACKGROUND },
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
    <GestureHandlerRootView
      style={[styles.gestureRoot, { backgroundColor: APP_BACKGROUND }]}
    >
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
    borderColor: shell.tabBorder,
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
});
