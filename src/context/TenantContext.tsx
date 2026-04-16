import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ActivityIndicator, AppState, StyleSheet, Text, View } from 'react-native';

import { fallbackTenant, getTenantData, type Tenant } from '../services/baserow';
import { APP_BACKGROUND } from '../../theme/appShell';

type TenantContextValue = {
  tenant: Tenant;
  loading: boolean;
  reload: () => Promise<void>;
};

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant>(fallbackTenant);
  const [loading, setLoading] = useState(true);

  const loadTenant = useCallback(async () => {
    setLoading(true);
    const tenantData = await getTenantData();
    setTenant(tenantData);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadTenant();
  }, [loadTenant]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        void loadTenant();
      }
    });
    return () => sub.remove();
  }, [loadTenant]);

  const value = useMemo<TenantContextValue>(
    () => ({
      tenant,
      loading,
      reload: loadTenant,
    }),
    [tenant, loading],
  );

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={tenant.colorPrimario} />
        <Text style={[styles.loaderTitle, { color: tenant.colorPrimario }]}>
          Cargando tu experiencia...
        </Text>
      </View>
    );
  }

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant debe usarse dentro de TenantProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    backgroundColor: APP_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 24,
  },
  loaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
