import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import { useTenant } from '../src/context/TenantContext';
import { getTenantProfileBySlug, type TenantProfile } from '../src/services/baserow';

const bgLight = '#F8F9FA';
const bgDark = '#0B0410';

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
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
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
    <View style={[styles.screen, { backgroundColor: isDark ? bgDark : bgLight }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: isDark ? '#F9FAFB' : '#111827' }]}>
          Perfil de {tenant.nombre}
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
          Información del local y vías de contacto.
        </Text>

        <View style={styles.cardWrap}>
          <BlurView
            intensity={isDark ? 44 : 30}
            tint={isDark ? 'dark' : 'light'}
            style={styles.cardBlur}
          />
          <View
            style={[
              styles.cardOverlay,
              {
                backgroundColor: isDark
                  ? 'rgba(46, 16, 101, 0.28)'
                  : 'rgba(255, 255, 255, 0.62)',
              },
            ]}
          />
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={tenant.colorPrimario} />
            </View>
          ) : (
            <View style={styles.cardBody}>
              <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                Dirección
              </Text>
              <Text style={[styles.value, { color: isDark ? '#F9FAFB' : '#111827' }]}>
                {profile.direccion || 'Pendiente de configuración'}
              </Text>

              <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                Horario
              </Text>
              <Text style={[styles.value, { color: isDark ? '#F9FAFB' : '#111827' }]}>
                {profile.horario || 'Pendiente de configuración'}
              </Text>

              <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                Contacto
              </Text>
              <Text style={[styles.value, { color: isDark ? '#F9FAFB' : '#111827' }]}>
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
            <Text style={styles.actionText}>Ver mapa</Text>
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
            <Text style={[styles.actionTextGhost, { color: tenant.colorPrimario }]}>
              Contactar
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingBottom: 120,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 130,
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
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    minHeight: 220,
  },
  cardBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
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
    backgroundColor: 'rgba(255,255,255,0.04)',
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
