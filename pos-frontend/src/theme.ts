/**
 * Design System — Serene Lash & Beauty
 * Effortless Elegance: warm petal surfaces, rose-gold accents, deep-charcoal text.
 * Source: DESIGN.md
 */

export const designTokens = {
  colors: {
    surface: '#fcf9f8',
    surfaceDim: '#dcd9d9',
    surfaceBright: '#fcf9f8',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f6f3f2',
    surfaceContainer: '#f0eded',
    surfaceContainerHigh: '#eae7e7',
    surfaceContainerHighest: '#e4e2e1',
    onSurface: '#1b1c1c',
    onSurfaceVariant: '#4e4545',
    inverseSurface: '#303030',
    inverseOnSurface: '#f3f0ef',
    outline: '#7f7475',
    outlineVariant: '#d1c3c3',
    surfaceTint: '#675c5c',
    primary: '#675c5c',
    onPrimary: '#ffffff',
    primaryContainer: '#f9e8e8',
    onPrimaryContainer: '#746767',
    secondary: '#79573c',
    onSecondary: '#ffffff',
    secondaryContainer: '#ffd1b0',
    onSecondaryContainer: '#7a583d',
    tertiary: '#735761',
    onTertiary: '#ffffff',
    tertiaryContainer: '#ffe5ed',
    onTertiaryContainer: '#7f626d',
    error: '#ba1a1a',
    onError: '#ffffff',
    errorContainer: '#ffdad6',
    onErrorContainer: '#93000a',
  },
} as const;

export const theme = {
  // ─── Colors ───────────────────────────────
  colors: {
    // Backgrounds — light, warm, tactile surfaces
    bg: '#fcf9f8',
    bgCard: '#ffffff',
    bgCardHover: '#f6f3f2',
    bgInput: '#ffffff',
    bgElevated: '#f9e8e8',

    // Borders
    border: '#d1c3c3',
    borderLight: '#e4e2e1',
    borderFocus: 'rgba(121, 87, 60, 0.38)',

    // Text
    text: '#1b1c1c',
    textSecondary: '#4e4545',
    textMuted: '#746767',
    textInverse: '#ffffff',

    // Accent — Rose Gold / Taupe
    accent: '#79573c',
    accentLight: 'rgba(255, 209, 176, 0.55)',
    accentGlow: 'rgba(121, 87, 60, 0.16)',
    accentGradient: ['#303030', '#675c5c'] as const,

    // Status colors tuned for light surface
    success: '#2f7d57',
    successLight: 'rgba(47, 125, 87, 0.11)',
    warning: '#a36523',
    warningLight: 'rgba(255, 209, 176, 0.52)',
    error: '#ba1a1a',
    errorLight: '#ffdad6',
    info: '#4f667f',
    infoLight: 'rgba(79, 102, 127, 0.10)',

    // Payment methods
    cash: '#2f7d57',
    qris: '#4f667f',
    debit: '#a36523',
    transfer: '#735761',
  },

  // ─── Spacing ───────────────────────────────
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  // ─── Border Radius ─────────────────────────
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 999,
  },

  // ─── Typography ────────────────────────────
  typography: {
    h1: { fontSize: 28, fontWeight: '600' as const, letterSpacing: -0.5, fontFamily: 'Playfair Display, serif' as const },
    h2: { fontSize: 22, fontWeight: '600' as const, letterSpacing: -0.3, fontFamily: 'Playfair Display, serif' as const },
    h3: { fontSize: 18, fontWeight: '600' as const, letterSpacing: -0.2, fontFamily: 'Playfair Display, serif' as const },
    body: { fontSize: 15, fontWeight: '400' as const, fontFamily: 'Inter, sans-serif' as const },
    bodyBold: { fontSize: 15, fontWeight: '600' as const, fontFamily: 'Inter, sans-serif' as const },
    caption: { fontSize: 12, fontWeight: '500' as const, fontFamily: 'Inter, sans-serif' as const },
    small: { fontSize: 11, fontWeight: '400' as const, fontFamily: 'Inter, sans-serif' as const },
    label: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const, fontFamily: 'Inter, sans-serif' as const },
    mono: { fontSize: 13, fontWeight: '500' as const, fontFamily: 'Inter, monospace' as const },
  },

  // ─── Shadows ───────────────────────────────
  shadows: {
    card: {
      shadowColor: '#1b1c1c',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 20,
      elevation: 3,
    },
    elevated: {
      shadowColor: '#1b1c1c',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.10,
      shadowRadius: 32,
      elevation: 10,
    },
    glow: {
      shadowColor: '#79573c',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 18,
      elevation: 4,
    },
  },

  // ─── Glass Effect ──────────────────────────
  glass: {
    background: 'rgba(255, 255, 255, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(209, 195, 195, 0.8)',
  },

  // ─── Gradients ─────────────────────────────
  gradients: {
    accent: ['#303030', '#675c5c'] as const,
    success: ['#2f7d57', '#4caf7d'] as const,
    info: ['#4f667f', '#7f98b4'] as const,
    warning: ['#79573c', '#a36523'] as const,
    error: ['#ba1a1a', '#93000a'] as const,
    purple: ['#735761', '#7f626d'] as const,
  },
} as const;

export type Theme = typeof theme;
export default theme;
