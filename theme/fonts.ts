import {
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';

/**
 * Familias registradas por `useOdenixFonts` (usar el mismo string en `fontFamily`).
 * Headings: Plus Jakarta 600–800 · Cuerpo: Inter 400–500.
 */
export const fontFamily = {
  headingSemi: 'PlusJakartaSans_600SemiBold',
  headingBold: 'PlusJakartaSans_700Bold',
  headingExtraBold: 'PlusJakartaSans_800ExtraBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
} as const;

/** Letter-spacing ~ -0.02em a tamaño típico de título (px). */
export const headingTracking = (fontSize: number) => -0.02 * fontSize;

export type OdenixFontsState = {
  /** true cuando todas las fuentes cargaron sin error */
  loaded: boolean;
  /** error de expo-font, si hubo */
  error: Error | null;
  /** true si se puede usar fontFamily custom (no forzar sistema) */
  useCustomFonts: boolean;
};

/**
 * Carga fuentes Google. En web o si falla la carga, `useCustomFonts` será false
 * y la UI debe usar tipografía del sistema (no bloquear el árbol).
 */
export function useOdenixFonts(): OdenixFontsState {
  const [loaded, error] = useFonts({
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
  });

  const useCustomFonts = Boolean(loaded && !error);

  return { loaded, error: error ?? null, useCustomFonts };
}
