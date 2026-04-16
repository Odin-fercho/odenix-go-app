import { APP_BACKGROUND, TEXT_PRIMARY, TEXT_SECONDARY } from './appShell';

/** Paleta modo claro (multi-tenant: sustituir por API más adelante). */
export const light = {
  background: APP_BACKGROUND,
  surface: '#FFFFFF',
  textPrimary: TEXT_PRIMARY,
  textSecondary: TEXT_SECONDARY,
  primary: '#9b5de5',
  secondaryDark: '#4c1d95',
  accentLime: '#a3e635',
  accentOlive: '#65a30d',
} as const;

export const dark = {
  background: '#0B0410',
  surface: 'rgba(46, 16, 101, 0.4)',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  primary: '#9b5de5',
  secondaryDark: '#4c1d95',
  accentLime: '#a3e635',
  accentOlive: '#65a30d',
} as const;

export type ThemeTokens = typeof light | typeof dark;

/** App cliente en modo claro fijo. */
export const useThemeTokens = (): ThemeTokens => light;
