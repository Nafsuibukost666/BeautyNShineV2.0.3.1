/**
 * Design System — Premium Dark Theme
 * Inspired by: Linear, Revolut, Stripe
 * Accent: Warm Orange (#e8a87c → refined f0a070)
 */

export const theme = {
  // ─── Colors ───────────────────────────────
  colors: {
    // Backgrounds
    bg: '#0a0e1a',
    bgCard: '#121726',
    bgCardHover: '#181d30',
    bgInput: '#0d1222',
    bgElevated: '#1a2038',

    // Borders
    border: '#1e2640',
    borderLight: '#2a3350',
    borderFocus: 'rgba(240, 160, 112, 0.4)',

    // Text
    text: '#f0f2f8',
    textSecondary: '#8b92b0',
    textMuted: '#5a6180',
    textInverse: '#0a0e1a',

    // Accent — Warm Orange
    accent: '#f0a070',
    accentLight: 'rgba(240, 160, 112, 0.12)',
    accentGlow: 'rgba(240, 160, 112, 0.25)',
    accentGradient: ['#f0a070', '#e88860'] as const,

    // Status colors
    success: '#34d399',
    successLight: 'rgba(52, 211, 153, 0.12)',
    warning: '#f59e0b',
    warningLight: 'rgba(245, 158, 11, 0.12)',
    error: '#ef4444',
    errorLight: 'rgba(239, 68, 68, 0.12)',
    info: '#22d3ee',
    infoLight: 'rgba(34, 211, 238, 0.12)',

    // Payment methods
    cash: '#34d399',
    qris: '#22d3ee',
    debit: '#f59e0b',
    transfer: '#8b5cf6',
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
    h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },
    h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
    h3: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.2 },
    body: { fontSize: 15, fontWeight: '400' as const },
    bodyBold: { fontSize: 15, fontWeight: '600' as const },
    caption: { fontSize: 12, fontWeight: '500' as const },
    small: { fontSize: 11, fontWeight: '400' as const },
    label: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const },
    mono: { fontSize: 13, fontWeight: '500' as const, fontFamily: 'monospace' as const },
  },

  // ─── Shadows ───────────────────────────────
  shadows: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    elevated: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 24,
      elevation: 16,
    },
    glow: {
      shadowColor: '#f0a070',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 6,
    },
  },

  // ─── Glass Effect ──────────────────────────
  glass: {
    background: 'rgba(18, 23, 38, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },

  // ─── Gradients ─────────────────────────────
  gradients: {
    accent: ['#f0a070', '#e88860'] as const,
    success: ['#34d399', '#2dd4bf'] as const,
    info: ['#22d3ee', '#06b6d4'] as const,
    warning: ['#f59e0b', '#d97706'] as const,
    error: ['#ef4444', '#dc2626'] as const,
    purple: ['#8b5cf6', '#6d28d9'] as const,
  },
} as const;

export type Theme = typeof theme;
export default theme;
