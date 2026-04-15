import { DEFAULT_PORTAL_URL_PRODUCTION } from './portalEnv';

const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]', '0.0.0.0']);

/**
 * Ajusta URLs de medios para Web / release: protocolo relativo, upgrade http→https
 * y reescritura de hosts de loopback hacia el portal de producción (misma base que la API).
 */
export function finalizePublicMediaUrl(url: string): string {
  let u = url.trim();
  if (!u) return '';
  if (u.startsWith('//')) {
    u = `https:${u}`;
  }
  if (!__DEV__ && u.startsWith('http://')) {
    try {
      const { hostname } = new URL(u);
      const h = hostname.toLowerCase();
      if (
        h.includes('baserow') ||
        h.includes('odenix') ||
        h.startsWith('files.') ||
        h.endsWith('.baserow.io')
      ) {
        return `https://${u.slice('http://'.length)}`;
      }
    } catch {
      return u;
    }
  }
  if (!__DEV__) {
    try {
      const abs = u.startsWith('//') ? `https:${u}` : u;
      const parsed = new URL(abs);
      if (LOOPBACK_HOSTNAMES.has(parsed.hostname.toLowerCase())) {
        const base = DEFAULT_PORTAL_URL_PRODUCTION.replace(/\/$/, '');
        return `${base}${parsed.pathname}${parsed.search}`;
      }
    } catch {
      /* URL relativa u otro formato: se devuelve tal cual */
    }
  }
  return u;
}
