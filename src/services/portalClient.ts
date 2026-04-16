import Constants from 'expo-constants';

import { resolvePortalBaseUrl } from '../config/portalEnv';

const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]', '0.0.0.0']);

function assertPortalUrlNotLocalhost(base: string): void {
  if (__DEV__) return;
  let host: string;
  try {
    host = new URL(base).hostname.toLowerCase();
  } catch {
    throw new Error('La URL del portal no es válida');
  }
  if (LOOPBACK_HOSTNAMES.has(host)) {
    throw new Error(
      'La URL del portal no puede apuntar a localhost en build de producción; define EXPO_PUBLIC_PORTAL_URL o el origen público del hub.',
    );
  }
}

/**
 * Base URL del portal Next (proxy Baserow). Nunca hardcodees URLs en pantallas;
 * la resolución vive en `src/config/portalEnv.ts`.
 */
export function getPortalBaseUrl(): string {
  const base = resolvePortalBaseUrl();
  assertPortalUrlNotLocalhost(base);
  return base;
}

type ExtraShape = { tenantSlug?: string };
const DEV_DEFAULT_TENANT_SLUG = 'odenix_studio';

function readTenantSlugFromUrl(): string | null {
  const locationSearch = (globalThis as { location?: { search?: string } }).location?.search;
  if (!locationSearch || typeof URLSearchParams === 'undefined') return null;
  const params = new URLSearchParams(locationSearch);
  const fromQuery =
    params.get('slug')?.trim() ??
    params.get('tenant')?.trim() ??
    params.get('tenantSlug')?.trim() ??
    '';
  return fromQuery || null;
}

export function getCurrentTenantSlug(): string | null {
  const fromUrl = readTenantSlugFromUrl();
  if (fromUrl) return fromUrl;
  const fromEnv = process.env.EXPO_PUBLIC_CURRENT_TENANT_SLUG?.trim();
  if (fromEnv) return fromEnv;
  const extra = Constants.expoConfig?.extra as ExtraShape | undefined;
  const fromExtra = extra?.tenantSlug?.trim();
  if (fromExtra) return fromExtra;
  if (__DEV__) return DEV_DEFAULT_TENANT_SLUG;
  return null;
}

export type PortalFetchOptions = RequestInit & {
  /** JWT emitido por el portal (futuro: guardar en SecureStore tras login). */
  authToken?: string | null;
};

export async function portalFetch(
  path: string,
  options: PortalFetchOptions = {},
): Promise<Response> {
  const base = getPortalBaseUrl();
  const { authToken, ...rest } = options;
  const headers = new Headers(rest.headers);
  headers.set('Accept', 'application/json');
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }
  return fetch(`${base}${path}`, {
    ...rest,
    headers,
    credentials: 'omit',
  });
}
