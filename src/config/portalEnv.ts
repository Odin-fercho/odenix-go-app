/**
 * Origen del portal Next (proxy hacia Baserow).
 *
 * Prioridad:
 * 1. `EXPO_PUBLIC_PORTAL_URL` (EAS / `.env` cuando no se usa `EXPO_NO_CLIENT_ENV_VARS`)
 * 2. Release (`!__DEV__`): `https://hub.odenix.shop` (portal maestro; la web pública suele ser go.odenix.shop)
 * 3. Desarrollo: `EXPO_PUBLIC_PORTAL_URL_DEV` o `http://127.0.0.1:3000`
 *
 * Otros tenants pueden sobreescribir siempre con `EXPO_PUBLIC_PORTAL_URL`.
 */
export const DEFAULT_PORTAL_URL_PRODUCTION = 'https://hub.odenix.shop';

export function getDefaultPortalUrlDevelopment(): string {
  const dev = process.env.EXPO_PUBLIC_PORTAL_URL_DEV?.trim();
  if (dev) return dev.replace(/\/$/, '');
  return 'http://127.0.0.1:3000';
}

export function resolvePortalBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_PORTAL_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  return __DEV__ ? getDefaultPortalUrlDevelopment() : DEFAULT_PORTAL_URL_PRODUCTION;
}
