---
name: Aura Luxe Clinical
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daea'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eefe'
  surface-container-high: '#e2e8f8'
  surface-container-highest: '#dce2f3'
  on-surface: '#151c27'
  on-surface-variant: '#4d4636'
  inverse-surface: '#2a313d'
  inverse-on-surface: '#ebf1ff'
  outline: '#7f7664'
  outline-variant: '#d0c5b0'
  surface-tint: '#755b00'
  primary: '#755b00'
  on-primary: '#ffffff'
  primary-container: '#b5922a'
  on-primary-container: '#3b2d00'
  inverse-primary: '#e9c256'
  secondary: '#555f6f'
  on-secondary: '#ffffff'
  secondary-container: '#d6e0f3'
  on-secondary-container: '#596373'
  tertiary: '#5c5f60'
  on-tertiary: '#ffffff'
  tertiary-container: '#949697'
  on-tertiary-container: '#2c2f30'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdf91'
  primary-fixed-dim: '#e9c256'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#584400'
  secondary-fixed: '#d9e3f6'
  secondary-fixed-dim: '#bdc7d9'
  on-secondary-fixed: '#121c2a'
  on-secondary-fixed-variant: '#3d4756'
  tertiary-fixed: '#e1e3e4'
  tertiary-fixed-dim: '#c5c7c8'
  on-tertiary-fixed: '#191c1d'
  on-tertiary-fixed-variant: '#454748'
  background: '#f9f9ff'
  on-background: '#151c27'
  surface-variant: '#dce2f3'
  clinical-gold: '#B5922A'
  charcoal-depth: '#111827'
  surface-cream: '#FCFBFA'
  status-success: '#059669'
  status-warning: '#D97706'
  border-subtle: '#E5E7EB'
typography:
  display-lg:
    fontFamily: Libre Caslon Text
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.3'
  headline-lg-mobile:
    fontFamily: Libre Caslon Text
    fontSize: 24px
    fontWeight: '400'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Libre Caslon Text
    fontSize: 24px
    fontWeight: '400'
    lineHeight: '1.4'
  title-lg:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.5'
    letterSpacing: 0.01em
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  container-max-width: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The brand identity for the design system is rooted in the intersection of medical precision and high-end hospitality. It targets a discerning clientele seeking "Clinical Luxury"—a space where professional expertise meets a restorative aesthetic. The personality is authoritative yet welcoming, sophisticated but never intimidating.

The chosen design style is **Minimalist-High-Fidelity**. It utilizes heavy whitespace to evoke a sense of "breathing room" found in luxury spas, while maintaining the structured clarity of a medical dashboard. Every element is intentional, avoiding decorative clutter in favor of refined typography and subtle, high-fidelity shadows that suggest a physical, premium quality. The interface should feel "expensive" through its restraint and the deliberate use of its signature metallic accent.

## Colors

The palette is anchored by **Clinical Gold (#B5922A)**, used sparingly for primary actions, branding elements, and meaningful highlights. This is balanced against a high-contrast foundation of **Charcoal Depth** and **Surface Cream** to ensure readability and a professional "clinical" feel.

- **Primary**: Clinical Gold is the signature of the design system. It should be used for call-to-actions, active navigation states, and progress indicators.
- **Surface Strategy**: Use `surface-cream` for the main background to avoid the harshness of pure white, providing a softer, more organic "wellness" vibe. 
- **Neutrality**: Grays are kept cool to maintain a modern, tech-forward aesthetic.
- **Semantic Logic**: Status colors (success, warning, error) should be slightly desaturated to align with the premium nature of the palette, preventing them from feeling "jarring" against the gold accents.

## Typography

This design system uses a high-contrast typographic pairing to signal both elegance and efficiency. 

- **The Serif (Libre Caslon Text)**: Reserved for headings and display moments. It brings an editorial, "wellness journal" quality to the interface. For display sizes, a slight negative letter-spacing should be applied to enhance the premium feel.
- **The Sans-Serif (Hanken Grotesk)**: A sharp, contemporary typeface used for all UI components, body text, and data visualization. Its high legibility ensures that clinical data and financial figures feel precise and trustworthy.
- **Labels**: Utilize `label-md` with uppercase styling and increased letter spacing for section headers within cards and small metadata categories to create a rhythmic, structured hierarchy.

## Layout & Spacing

The layout utilizes a **Fixed Grid** system for desktop to maintain the "contained" and "ordered" feeling of a professional clinical dashboard. On mobile, the system transitions to a fluid model with generous side margins to ensure touch targets are comfortable.

- **Grid Model**: A 12-column grid on desktop (1280px max-width) with a 24px gutter.
- **Spacing Rhythm**: All margins and paddings must be multiples of 4px. Use `stack-lg` (32px) to separate major sections, and `stack-md` (16px) for internal card elements.
- **Reflow Rules**: On mobile devices, cards should expand to full width, and multi-column forms should stack vertically to maintain accessibility and focus.

## Elevation & Depth

Hierarchy is established through a **Tonal Layering** approach combined with **Ambient Shadows**. This creates a sense of "High-Fidelity" depth that is characteristic of premium SaaS and medical platforms.

- **Surface Levels**:
    - **Level 0 (Background)**: `surface-cream` (#FCFBFA).
    - **Level 1 (Cards/Containers)**: Pure White (#FFFFFF) with a `1px` subtle border (#E5E7EB).
- **Shadow Character**: Shadows should be extremely diffused and low-opacity. Use a "soft-lift" effect (e.g., `0 4px 20px -2px rgba(0,0,0,0.05)`) for interactive cards.
- **Glassmorphism**: Use semi-transparent white backgrounds with a `12px` backdrop blur for sticky navigation bars and modal overlays to maintain a sense of depth and lightness.

## Shapes

The design system adopts a **Soft** shape language. This strikes the perfect balance between the rigid precision of a medical environment and the inviting softness of a wellness centre.

- **Primary Radius**: 0.25rem (4px) for small components like checkboxes and tags.
- **Secondary Radius (Standard)**: 0.5rem (8px) for buttons, input fields, and small cards.
- **Large Radius**: 0.75rem (12px) for main dashboard containers and modal windows.
- **Avatars**: Circular (fully rounded) to soften the presence of human profiles within the data-heavy layout.

## Components

### Buttons
- **Primary**: Solid Gold (#B5922A) with white text. High-fidelity shadow on hover.
- **Secondary**: Charcoal outline or solid ghost style.
- **Styling**: Rectangular with `rounded-md` (8px). Typography should be `label-sm` or `body-md` (semi-bold) for clarity.

### Cards
- **Structure**: White background, 1px `border-subtle`, and 12px corner radius.
- **Header**: Use `label-md` for small sub-headers within the card to categorize data.
- **Shadow**: Apply "soft-lift" ambient shadow only to cards that are interactive.

### Form Elements
- **Inputs**: 1px border (#E5E7EB) that transitions to Gold (#B5922A) on focus. 
- **Labels**: Always positioned above the input using `label-sm` in `charcoal-depth`.
- **Feedback**: Error states use a muted red; success states use `status-success` emerald.

### Chips & Status Indicators
- **Style**: Small, pill-shaped with light tinted backgrounds (e.g., 10% opacity of the status color) and bold text. 
- **Usage**: Used for appointment status (PAID, PENDING, CANCELLED) to provide immediate visual scannability.

### Data Visualization (Recharts)
- Use the Gold (#B5922A) as the primary line/bar color.
- Use a light charcoal for axes and grid lines to maintain a "clean" and "clinical" aesthetic.