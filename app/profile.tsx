import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTenant } from '../src/context/TenantContext';
import { getTenantProfileBySlug, type TenantProfile } from '../src/services/baserow';
import { APP_BACKGROUND, CARD_BORDER, TEXT_PRIMARY, TEXT_SECONDARY } from '../theme/appShell';
import { fontFamily, useOdenixFonts } from '../theme/fonts';

const emptyProfile: TenantProfile = {
  direccion: '',
  horario: '',
  telefono: '',
  email: '',
  instagram: '',
  latitud: null,
  longitud: null,
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { useCustomFonts } = useOdenixFonts();
  const { tenant } = useTenant();
  const [profile, setProfile] = useState<TenantProfile>(emptyProfile);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      const nextProfile = await getTenantProfileBySlug();
      setProfile(nextProfile);
      setLoading(false);
    };
    void loadProfile();
  }, []);

  const font = (family: string | undefined) =>
    useCustomFonts && family ? { fontFamily: family } : {};

  const tabClearance = 92 + Math.max(insets.bottom, 10);

  const openMap = async () => {
    const label = `${tenant.nombre} ${profile.direccion}`.trim();
    if (profile.latitud !== null && profile.longitud !== null) {
      const coords = `${profile.latitud},${profile.longitud}`;
      const url =
        Platform.OS === 'ios'
          ? `http://maps.apple.com/?ll=${coords}&q=${encodeURIComponent(label)}`
          : `geo:${coords}?q=${encodeURIComponent(label)}`;
      await Linking.openURL(url);
      return;
    }
    if (profile.direccion) {
      const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profile.direccion)}`;
      await Linking.openURL(fallbackUrl);
    }
  };

  const openWhatsapp = async () => {
    const message = `Hola ${tenant.nombre}, quiero más información`;
    const url = `https://wa.me/${tenant.whatsapp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;
    await Linking.openURL(url);
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: APP_BACKGROUND }]}
      edges={['top', 'left', 'right']}
    >
      <View style={[styles.screen, { backgroundColor: APP_BACKGROUND }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabClearance + 36 }]}
      >
        <Text
          style={[
            styles.title,
            { color: TEXT_PRIMARY },
            font(fontFamily.headingExtraBold),
          ]}
        >
          Perfil de {tenant.nombre}
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: TEXT_SECONDARY },
            font(fontFamily.body),
          ]}
        >
          Información del local y vías de contacto.
        </Text>

        <View style={[styles.cardWrap, { backgroundColor: '#FFFFFF', borderColor: CARD_BORDER }]}>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={tenant.colorPrimario} />
            </View>
          ) : (
            <View style={styles.cardBody}>
              <Text
                style={[styles.label, { color: TEXT_SECONDARY }, font(fontFamily.bodyMedium)]}
              >
                Dirección
              </Text>
              <Text style={[styles.value, { color: TEXT_PRIMARY }, font(fontFamily.body)]}>
                {profile.direccion || 'Pendiente de configuración'}
              </Text>

              <Text
                style={[styles.label, { color: TEXT_SECONDARY }, font(fontFamily.bodyMedium)]}
              >
                Horario
              </Text>
              <Text style={[styles.value, { color: TEXT_PRIMARY }, font(fontFamily.body)]}>
                {profile.horario || 'Pendiente de configuración'}
              </Text>

              <Text
                style={[styles.label, { color: TEXT_SECONDARY }, font(fontFamily.bodyMedium)]}
              >
                Contacto
              </Text>
              <Text style={[styles.value, { color: TEXT_PRIMARY }, font(fontFamily.body)]}>
                {profile.telefono || 'Sin teléfono'} {profile.email ? `· ${profile.email}` : ''}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => {
              void openMap();
            }}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: tenant.colorPrimario, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[styles.actionText, font(fontFamily.bodyMedium)]}>Ver mapa</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              void openWhatsapp();
            }}
            style={({ pressed }) => [
              styles.actionBtnGhost,
              {
                borderColor: tenant.colorPrimario,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.actionTextGhost,
                { color: tenant.colorPrimario },
                font(fontFamily.bodyMedium),
              ]}
            >
              Contactar
            </Text>
          </Pressable>
        </View>
      </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 14,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  cardWrap: {
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    minHeight: 220,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  cardBody: {
    padding: 16,
    gap: 8,
  },
  loadingWrap: {
    flex: 1,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  actionsRow: {
    marginTop: 2,
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  actionBtnGhost: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionTextGhost: {
    fontSize: 14,
    fontWeight: '700',
  },
});
