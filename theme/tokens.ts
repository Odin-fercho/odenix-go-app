import {
  ODENIX_ACCENT_LIME,
  ODENIX_ACCENT_OLIVE,
  ODENIX_PURPLE,
  ODENIX_PURPLE_DEEP,
} from './brand';
import { APP_BACKGROUND, TEXT_PRIMARY, TEXT_SECONDARY } from './appShell';

/** Paleta modo claro (multi-tenant: `primary`/`secondaryDark` pueden venir de Baserow). */
export const light = {
  background: APP_BACKGROUND,
  surface: '#FFFFFF',
  textPrimary: TEXT_PRIMARY,
  textSecondary: TEXT_SECONDARY,
  primary: ODENIX_PURPLE,
  secondaryDark: ODENIX_PURPLE_DEEP,
  accentLime: ODENIX_ACCENT_LIME,
  accentOlive: ODENIX_ACCENT_OLIVE,
} as const;

export const dark = {
  background: '#0B0410',
  surface: 'rgba(46, 16, 101, 0.4)',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  primary: ODENIX_PURPLE,
  secondaryDark: ODENIX_PURPLE_DEEP,
  accentLime: ODENIX_ACCENT_LIME,
  accentOlive: ODENIX_ACCENT_OLIVE,
} as const;

export type ThemeTokens = typeof light | typeof dark;

/** App cliente en modo claro fijo. */
export const useThemeTokens = (): ThemeTokens => light;
