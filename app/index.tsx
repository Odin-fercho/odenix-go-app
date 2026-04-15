import { BlurView } from 'expo-blur';
import {
  Component,
  useEffect,
  useMemo,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import {
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Hero3DScene } from '../src/components/hero3d/Hero3DScene';
import { HERO_HEIGHT } from '../src/components/hero3d/constants';
import { useTenant } from '../src/context/TenantContext';
import { getBannersByTenant, type Banner } from '../src/services/baserow';
import { postTenantInteractionEvent } from '../src/services/tenantEvents';
import { fontFamily, headingTracking, useOdenixFonts } from '../theme/fonts';
import { useThemeTokens } from '../theme/tokens';

type HeroBoundaryProps = { children: ReactNode; fallback: ReactNode };

class HeroErrorBoundary extends Component<
  HeroBoundaryProps,
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (__DEV__) {
      console.warn('[Odenix] Hero 3D desactivado:', error.message, info.componentStack);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function HeroFallback({ label }: { label: string }) {
  const theme = useThemeTokens() || {
    background: '#0B0410',
    surface: 'rgba(46, 16, 101, 0.4)',
    textPrimary: '#FFFFFF',
    textSecondary: '#9CA3AF',
    primary: '#9b5de5',
    secondaryDark: '#4c1d95',
    accentLime: '#a3e635',
    accentOlive: '#65a30d',
  };
  return (
    <View
      style={[styles.heroFallback, { backgroundColor: theme.surface }]}
      accessibilityLabel={label}
    >
      <Text style={[styles.heroFallbackTitle, { color: theme.textPrimary }]}>
        Odenix
      </Text>
      <Text style={[styles.heroFallbackSub, { color: theme.textSecondary }]}>
        Vista 3D no disponible — la app sigue activa.
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const theme = useThemeTokens() || {
    background: '#0B0410',
    surface: 'rgba(46, 16, 101, 0.4)',
    textPrimary: '#FFFFFF',
    textSecondary: '#9CA3AF',
    primary: '#9b5de5',
    secondaryDark: '#4c1d95',
    accentLime: '#a3e635',
    accentOlive: '#65a30d',
  };
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { useCustomFonts } = useOdenixFonts();
  const { tenant } = useTenant();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [citaNombre, setCitaNombre] = useState('');
  const [citaServicio, setCitaServicio] = useState('');
  const [citaPreferencia, setCitaPreferencia] = useState('');

  const font = (family: string | undefined) =>
    useCustomFonts && family ? { fontFamily: family } : {};

  useEffect(() => {
    const loadBanners = async () => {
      if (!tenant.id) {
        setBanners([]);
        return;
      }
      const nextBanners = await getBannersByTenant(tenant.id);
      setBanners(nextBanners.sort((a, b) => a.orden - b.orden));
    };

    void loadBanners();
  }, [tenant.id]);

  const openWhatsapp = async () => {
    const cleanPhone = tenant.whatsapp.replace(/[^\d]/g, '');
    const message = `Hola ${tenant.nombre}, quiero empezar mi proyecto`;
    await postTenantInteractionEvent({ tipo: 'pedido', detalle: message, total: 0 });
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    await Linking.openURL(url);
  };

  const openWhatsappCitaForm = async () => {
    const cleanPhone = tenant.whatsapp.replace(/[^\d]/g, '');
    const message =
      `Hola ${tenant.nombre}, quiero agendar una cita.\n` +
      `Nombre: ${citaNombre.trim() || '(no indicado)'}\n` +
      `Servicio: ${citaServicio.trim() || '(no indicado)'}\n` +
      `Preferencia / disponibilidad: ${citaPreferencia.trim() || '(no indicado)'}`;
    await postTenantInteractionEvent({ tipo: 'cita', detalle: message, total: 0 });
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    await Linking.openURL(url);
  };

  const bannerFallbacks = useMemo<Banner[]>(
    () => [
      {
        id: 1,
        titulo: 'Convierte visitas en ventas',
        subtitulo: 'Activa tu canal directo por WhatsApp en minutos.',
        imagenUrl: '',
        ctaTexto: 'Quiero activar',
        ctaTipo: 'whatsapp',
        ctaValor: '',
        orden: 1,
        activo: true,
      },
      {
        id: 2,
        titulo: 'Impulsa reservas y pedidos',
        subtitulo: 'Automatiza respuestas y acelera cierres.',
        imagenUrl: '',
        ctaTexto: 'Hablar con asesor',
        ctaTipo: 'whatsapp',
        ctaValor: '',
        orden: 2,
        activo: true,
      },
    ],
    [],
  );

  const bannerItems = banners.length > 0 ? banners : bannerFallbacks;

  const onPressBanner = async (banner: Banner) => {
    if (banner.ctaTipo === 'url' && banner.ctaValor) {
      await Linking.openURL(banner.ctaValor);
      return;
    }

    const message = `Hola ${tenant.nombre}, quiero información sobre: ${banner.titulo}`;
    await postTenantInteractionEvent({ tipo: 'pedido', detalle: message, total: 0 });
    const url = `https://wa.me/${tenant.whatsapp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;
    await Linking.openURL(url);
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.heroCard,
            {
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(76, 29, 149, 0.1)',
            },
          ]}
        >
          <BlurView
            intensity={isDark ? 48 : 36}
            tint={isDark ? 'dark' : 'light'}
            experimentalBlurMethod={
              Platform.OS === 'android' ? 'dimezisBlurView' : undefined
            }
            style={styles.heroBlur}
          />
          <View
            style={[
              styles.heroTint,
              {
                backgroundColor: isDark
                  ? 'rgba(46, 16, 101, 0.22)'
                  : 'rgba(255, 255, 255, 0.45)',
              },
            ]}
            pointerEvents="none"
          />
          <View style={styles.heroCanvasWrap}>
            {Platform.OS !== 'web' ? (
              <HeroErrorBoundary
                fallback={
                  <HeroFallback label="Marcador visual Odenix sin WebGL" />
                }
              >
                <Hero3DScene accentColor={tenant.colorPrimario} />
              </HeroErrorBoundary>
            ) : (
              <View style={styles.heroFallback}>
                <Text
                  style={[styles.heroFallbackSub, { color: theme.textPrimary }]}
                >
                  3D Preview (Mobile Only)
                </Text>
              </View>
            )}
          </View>
        </View>

        <Text
          style={[
            styles.headline,
            { color: theme.textPrimary, letterSpacing: headingTracking(30) },
            font(fontFamily.headingExtraBold),
          ]}
        >
          {tenant.nombre}
        </Text>

        <Text
          style={[
            styles.subhead,
            { color: theme.textSecondary },
            font(fontFamily.body),
          ]}
        >
          {tenant.slogan}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Comenzar ahora"
          onPress={() => {
            void openWhatsapp();
          }}
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: tenant.colorPrimario,
              transform: [{ scale: pressed ? 0.95 : 1 }],
            },
          ]}
        >
          <Text
            style={[
              styles.ctaLabel,
              {
                color: '#FFFFFF',
              },
              font(fontFamily.bodyMedium),
            ]}
          >
            {tenant.plantilla === 'citas' ? 'Hablar por WhatsApp' : 'Comenzar Ahora'}
          </Text>
        </Pressable>

        {tenant.plantilla === 'citas' ? (
          <View style={styles.citaCardWrap}>
            <BlurView
              intensity={isDark ? 44 : 32}
              tint={isDark ? 'dark' : 'light'}
              style={styles.citaBlur}
            />
            <View
              style={[
                styles.citaOverlay,
                {
                  backgroundColor: isDark
                    ? 'rgba(46, 16, 101, 0.28)'
                    : 'rgba(255, 255, 255, 0.58)',
                },
              ]}
            />
            <View style={styles.citaBody}>
              <Text
                style={[
                  styles.citaTitle,
                  { color: theme.textPrimary },
                  font(fontFamily.headingSemi),
                ]}
              >
                Agenda tu cita en un minuto
              </Text>
              <Text
                style={[
                  styles.citaHint,
                  { color: theme.textSecondary },
                  font(fontFamily.body),
                ]}
              >
                Cuéntanos qué necesitas; coordinamos por WhatsApp sin complicaciones.
              </Text>
              <TextInput
                value={citaNombre}
                onChangeText={setCitaNombre}
                placeholder="Tu nombre"
                placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                style={[
                  styles.citaInput,
                  {
                    borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(76,29,149,0.2)',
                    color: theme.textPrimary,
                  },
                ]}
              />
              <TextInput
                value={citaServicio}
                onChangeText={setCitaServicio}
                placeholder="Servicio o motivo de la visita"
                placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                style={[
                  styles.citaInput,
                  {
                    borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(76,29,149,0.2)',
                    color: theme.textPrimary,
                  },
                ]}
              />
              <TextInput
                value={citaPreferencia}
                onChangeText={setCitaPreferencia}
                placeholder="Preferencia (día/hora aproximados, en texto libre)"
                placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                multiline
                style={[
                  styles.citaInput,
                  styles.citaInputMultiline,
                  {
                    borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(76,29,149,0.2)',
                    color: theme.textPrimary,
                  },
                ]}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Enviar solicitud de cita por WhatsApp"
                onPress={() => {
                  void openWhatsappCitaForm();
                }}
                style={({ pressed }) => [
                  styles.citaSubmit,
                  {
                    backgroundColor: tenant.colorPrimario,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
              >
                <Text style={[styles.citaSubmitLabel, font(fontFamily.bodyMedium)]}>
                  Enviar por WhatsApp
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.bannerSection}>
          <Text
            style={[
              styles.bannerSectionTitle,
              { color: theme.textPrimary },
              font(fontFamily.headingSemi),
            ]}
          >
            Destacados para ti
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bannerTrack}
          >
            {bannerItems.map((banner) => (
              <View key={banner.id} style={styles.bannerCardWrap}>
                <BlurView
                  intensity={isDark ? 45 : 32}
                  tint={isDark ? 'dark' : 'light'}
                  style={styles.bannerBlur}
                />
                <View
                  style={[
                    styles.bannerOverlay,
                    {
                      backgroundColor: isDark
                        ? 'rgba(46, 16, 101, 0.24)'
                        : 'rgba(255, 255, 255, 0.56)',
                    },
                  ]}
                />

                {banner.imagenUrl ? (
                  <Image source={{ uri: banner.imagenUrl }} style={styles.bannerImage} />
                ) : (
                  <View style={styles.bannerImageFallback} />
                )}

                <View style={styles.bannerBody}>
                  <Text
                    style={[
                      styles.bannerTitle,
                      { color: theme.textPrimary },
                      font(fontFamily.headingBold),
                    ]}
                  >
                    {banner.titulo}
                  </Text>
                  <Text
                    style={[
                      styles.bannerSubtitle,
                      { color: theme.textSecondary },
                      font(fontFamily.body),
                    ]}
                  >
                    {banner.subtitulo}
                  </Text>
                  <Pressable
                    onPress={() => {
                      void onPressBanner(banner);
                    }}
                    style={({ pressed }) => [
                      styles.bannerCta,
                      {
                        backgroundColor: tenant.colorPrimario,
                        opacity: pressed ? 0.86 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.bannerCtaText, font(fontFamily.bodyMedium)]}>
                      {banner.ctaTexto}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
    paddingTop: 8,
    gap: 20,
  },
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    width: '100%',
    minHeight: HERO_HEIGHT,
    ...Platform.select({
      ios: {
        shadowColor: '#9b5de5',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 22,
      },
      android: { elevation: 10 },
      default: {},
    }),
  },
  heroBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  heroTint: {
    ...StyleSheet.absoluteFillObject,
  },
  heroCanvasWrap: {
    width: '100%',
    height: HERO_HEIGHT,
    zIndex: 1,
  },
  heroFallback: {
    width: '100%',
    height: HERO_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  heroFallbackTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroFallbackSub: {
    fontSize: 14,
    textAlign: 'center',
  },
  headline: {
    fontSize: 30,
    lineHeight: 36,
    marginTop: 4,
    fontWeight: '800',
  },
  subhead: {
    fontSize: 16,
    lineHeight: 24,
  },
  cta: {
    marginTop: 4,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  ctaLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  citaCardWrap: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    ...Platform.select({
      ios: {
        shadowColor: '#4c1d95',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  citaBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  citaOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  citaBody: {
    padding: 16,
    gap: 10,
  },
  citaTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  citaHint: {
    fontSize: 14,
    lineHeight: 20,
  },
  citaInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  citaInputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  citaSubmit: {
    marginTop: 4,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  citaSubmitLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  bannerSection: {
    marginTop: 8,
    gap: 12,
  },
  bannerSectionTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  bannerTrack: {
    gap: 14,
    paddingRight: 8,
  },
  bannerCardWrap: {
    width: 290,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#4c1d95',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  bannerBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerImage: {
    width: '100%',
    height: 130,
  },
  bannerImageFallback: {
    width: '100%',
    height: 130,
    backgroundColor: 'rgba(155, 93, 229, 0.18)',
  },
  bannerBody: {
    padding: 14,
    gap: 10,
  },
  bannerTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  bannerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  bannerCta: {
    marginTop: 2,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  bannerCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
