---
name: Serene Lash & Beauty
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e4e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#4e4545'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0ef'
  outline: '#7f7475'
  outline-variant: '#d1c3c3'
  surface-tint: '#675c5c'
  primary: '#675c5c'
  on-primary: '#ffffff'
  primary-container: '#f9e8e8'
  on-primary-container: '#746767'
  inverse-primary: '#d3c3c3'
  secondary: '#79573c'
  on-secondary: '#ffffff'
  secondary-container: '#ffd1b0'
  on-secondary-container: '#7a583d'
  tertiary: '#735761'
  on-tertiary: '#ffffff'
  tertiary-container: '#ffe5ed'
  on-tertiary-container: '#7f626d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#efdfdf'
  primary-fixed-dim: '#d3c3c3'
  on-primary-fixed: '#22191a'
  on-primary-fixed-variant: '#4f4444'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#eabe9d'
  on-secondary-fixed: '#2d1603'
  on-secondary-fixed-variant: '#5f4027'
  tertiary-fixed: '#fed9e5'
  tertiary-fixed-dim: '#e1bdc9'
  on-tertiary-fixed: '#2a151e'
  on-tertiary-fixed-variant: '#593f49'
  background: '#fcf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e1'
typography:
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: '-0.02em'
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: '0.05em'
  data-mono:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: '0.02em'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

The design system is anchored in the concept of "Effortless Elegance." It targets high-end beauty professionals who require a POS system that reflects the same level of care and precision they provide to their clients. The aesthetic is a fusion of **Minimalism** and **Soft-Tactile** design, utilizing vast amounts of whitespace to evoke a sense of cleanliness, breathability, and luxury.

The emotional response should be one of calm and confidence. By avoiding cluttered interfaces and loud colors, the system reduces cognitive load during busy salon hours, ensuring the specialist feels organized and professional. Subtle transitions and soft layering create a digital environment that feels as premium as a boutique spa.

## Colors

The palette is designed to be warm, feminine, and sophisticated. 
- **Primary (Petal Pink):** Used for large surfaces and soft backgrounds to maintain a bright, welcoming atmosphere.
- **Secondary (Rose Gold):** A muted metallic-inspired taupe used for accents, active states, and call-to-action highlights. 
- **Tertiary (Dusty Rose):** Reserved for subtle semantic differences or decorative elements.
- **Neutral (Deep Charcoal):** Used exclusively for typography and iconography to ensure WCAG-compliant legibility against light backgrounds.
- **Surface (Pure White):** Used for interactive containers and input fields to differentiate them from the primary background.

## Typography

This design system utilizes a high-contrast typographic pairing to balance editorial beauty with functional clarity. 

**Playfair Display** is the primary display face. It should be used for page titles, section headers, and branding moments. Its high stroke contrast provides the "premium" feel essential to the brand.

**Inter** is the workhorse for the UI. It handles all data entry, appointment lists, and navigation. Use a tighter letter-spacing for labels to maintain a crisp, modern look. For monetary values and time-slots, use the `data-mono` style to ensure vertical alignment in tables.

## Layout & Spacing

The layout follows a **Fluid Grid** system designed primarily for Tablet (landscape) and Desktop use, as these are the primary form factors for POS terminals. 

- **Grid:** 12-column grid on desktop/tablet, 4-column on mobile.
- **Rhythm:** An 8px base unit drives all padding and margin decisions. 
- **Whitespace:** Emphasize "Generous Padding." Use `lg` (40px) or `xl` (64px) spacing between major sections to prevent the UI from feeling "cramped" or "busy."
- **POS Optimization:** Touch targets must be a minimum of 44x44px, with `md` (24px) gutters between interactive cards to prevent accidental taps during checkout.

## Elevation & Depth

To maintain a clean and luxurious feel, this design system avoids heavy drop shadows. Depth is communicated through **Tonal Layers** and **Ambient Shadows**:

1.  **Level 0 (Base):** The Primary color (#F9E8E8) serves as the canvas.
2.  **Level 1 (Cards/Surface):** Pure White (#FFFFFF) surfaces with a very soft, diffused shadow (Blur: 20px, Y: 4px, Opacity: 4% of Charcoal).
3.  **Level 2 (Modals/Popovers):** Pure White with a more pronounced ambient shadow and a 1px solid border of the Tertiary color at 20% opacity to define the edge.

Glassmorphism is used sparingly for navigation bars and overlays, employing a 12px backdrop blur to allow the soft pink background colors to bleed through.

## Shapes

The shape language is organic and approachable.
- **Standard Elements:** Buttons, input fields, and small cards use a 0.5rem (8px) radius.
- **Large Containers:** Main content areas and appointment cards use a `rounded-lg` (16px) or `rounded-xl` (24px) radius to emphasize the "soft" brand personality.
- **Circular Elements:** Avatars and status indicators should always be fully rounded (pill-shaped) to contrast against the structured grid.

## Components

### Buttons
- **Primary:** Solid Deep Charcoal background with White text. This provides a clear "final action" for checkouts.
- **Secondary:** Transparent background with a Rose Gold (Secondary) 1.5px border and matching text.
- **Ghost:** No border or background; text-only using Deep Charcoal. Use for "Cancel" or "Back" actions.

### Input Fields
- **Style:** Pure white background with a 1px border (#E5C1CD). On focus, the border transitions to Rose Gold.
- **Labels:** Always use the `label-md` style positioned above the field for maximum clarity.

### Appointment Cards
- Use `rounded-lg` corners. 
- Include a subtle 4px vertical accent bar on the left side of the card using the Secondary color to denote the "Active" or "Confirmed" status.

### Chips & Tags
- Used for service types (e.g., "Full Set," "Refill"). 
- Light pink backgrounds with Deep Charcoal text. High-radius (pill-shaped) for a friendly, soft appearance.

### Icons
- Use **Minimalist Line Icons** with a 1.5px stroke weight.
- Avoid filled icons unless they represent an active state in the navigation bar.