import { APP_BACKGROUND } from './appShell';

/** Paleta Odenix — unificada para Light/Dark (multi-tenant: sustituir por API más adelante). */
export const light = {
  background: '#F8F9FA',
  surface: '#FFFFFF',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  primary: '#9b5de5',
  secondaryDark: '#4c1d95',
  accentLime: '#a3e635',
  accentOlive: '#65a30d',
} as const;

export const dark = {
  background: APP_BACKGROUND,
  surface: 'rgba(46, 16, 101, 0.4)',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  primary: '#9b5de5',
  secondaryDark: '#4c1d95',
  accentLime: '#a3e635',
  accentOlive: '#65a30d',
} as const;

export type ThemeTokens = typeof light | typeof dark;

/** Siempre oscuro: la app no sigue el modo claro del sistema (unificación web/simulador). */
export const useThemeTokens = (): ThemeTokens => dark;
