---
name: Aura Luxe Clinical
source:
  - docs/more_apps/aura_luxe_clinical/DESIGN.md
  - resources/js/Pages/Welcome.jsx
updated: 2026-05-21
colors:
  brand-primary: '#B5922A'
  brand-primary-hover: '#9D7E23'
  text-primary: '#020617'
  text-page: '#0F172A'
  text-secondary: '#475569'
  text-strong: '#334155'
  text-inverse: '#CBD5E1'
  surface-base: '#FCFBFA'
  surface-page-end: '#F8FAFC'
  surface-primary: '#FFFFFF'
  surface-muted: '#F3F5FB'
  surface-dark: '#151922'
  surface-tint: '#EEF2F7'
  accent-mist: '#D9E1E8'
  accent-mist-strong: '#D3D7DE'
  border-subtle: '#E7DFCF'
  border-neutral: '#CBD5E1'
typography:
  font-heading: Libre Caslon Text
  font-body: Hanken Grotesk
  display-hero-mobile: 36px
  display-hero-tablet: 48px
  display-hero-desktop: 60px
  heading-section-mobile: 30px
  heading-section-desktop: 36px
  title-card: 24px
  title-body: 18px
  body-lg: 18px
  body-md: 16px
  body-sm: 14px
  label-xs: 12px
spacing:
  base: 4px
  container-padding-mobile: 16px
  container-padding-tablet: 24px
  container-padding-desktop: 32px
  stack-xs: 12px
  stack-sm: 16px
  stack-md: 24px
  stack-lg: 40px
  section-y-mobile: 64px
  section-y-desktop: 96px
breakpoints:
  sm: 640px
  md: 768px
  lg: 1024px
  xl: 1280px
radii:
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  2xl: 1rem
  full: 9999px
shadows:
  soft-lift: 0 24px 50px -28px rgba(15, 23, 42, 0.18)
  soft-lift-strong: 0 24px 50px -28px rgba(15, 23, 42, 0.28)
motion:
  duration-default: 150ms
  easing-default: cubic-bezier(0.4, 0, 0.2, 1)
zIndex:
  sticky-header: 30
---

# Aura Luxe Clinical Design System

## Overview

Aura Luxe Clinical is a landing-page design system built around a clinical-luxury point of view. The visual language combines editorial serif typography, cool medical neutrals, restrained metallic gold, and large areas of breathing room. The system should feel premium and calm before it feels promotional.

This document is the project-level design guideline for page creation and page edits. It is based on the implementation in `resources/js/Pages/Welcome.jsx` and the reference document at `docs/more_apps/aura_luxe_clinical/DESIGN.md`. It captures the tokens, component patterns, layout rules, and accessibility guardrails already present in that page so future work can stay visually consistent.

## Source of Truth

- Primary implementation: `resources/js/Pages/Welcome.jsx`
- Reference guideline: `docs/more_apps/aura_luxe_clinical/DESIGN.md`
- Fonts are loaded at the page level through Google Fonts rather than Tailwind theme tokens
- Layout behavior relies on Tailwind's default responsive breakpoints plus page-specific max widths and custom arbitrary values

## Design Principles

1. Clinical clarity first
   Use clean alignment, calm copy density, and generous spacing before introducing decorative treatments.
2. Gold is for emphasis, not saturation
   `#B5922A` should highlight actions, labels, and moments of prestige. It should not dominate large reading surfaces.
3. Editorial hierarchy over dense UI chrome
   Headings carry personality through `Libre Caslon Text`; body content stays highly legible in `Hanken Grotesk`.
4. Soft geometry with disciplined structure
   Rounded cards, blurred overlays, and circular avatar treatments soften the experience without losing medical precision.
5. Dark panels are selective contrast devices
   The charcoal surface is reserved for spotlight moments such as premium service features and the closing CTA band.

## Color System

### Core Palette

| Token | Value | Usage | Preview |
|-------|-------|-------|---------|
| `brand-primary` | `#B5922A` | Primary CTA fill, eyebrows, accent bullets, premium emphasis | <span style="background:#B5922A;width:24px;height:24px;display:inline-block;border-radius:4px;vertical-align:middle"></span> |
| `brand-primary-hover` | `#9D7E23` | Hover state for filled gold actions | <span style="background:#9D7E23;width:24px;height:24px;display:inline-block;border-radius:4px;vertical-align:middle"></span> |
| `surface-dark` | `#151922` | Premium spotlight panels and final CTA band | <span style="background:#151922;width:24px;height:24px;display:inline-block;border-radius:4px;vertical-align:middle"></span> |
| `text-primary` | `#020617` | Main headings and highest-emphasis foreground text | <span style="background:#020617;width:24px;height:24px;display:inline-block;border-radius:4px;vertical-align:middle"></span> |
| `text-page` | `#0F172A` | Page-level default foreground and supporting strong text | <span style="background:#0F172A;width:24px;height:24px;display:inline-block;border-radius:4px;vertical-align:middle"></span> |
| `text-secondary` | `#475569` | Long-form body copy and supporting text | <span style="background:#475569;width:24px;height:24px;display:inline-block;border-radius:4px;vertical-align:middle"></span> |
| `text-strong` | `#334155` | Higher-emphasis secondary UI text | <span style="background:#334155;width:24px;height:24px;display:inline-block;border-radius:4px;vertical-align:middle"></span> |
| `text-inverse` | `#CBD5E1` | Supporting text on dark backgrounds | <span style="background:#CBD5E1;width:24px;height:24px;display:inline-block;border-radius:4px;vertical-align:middle;border:1px solid #ddd"></span> |

### Surface Palette

| Token | Value | Usage | Preview |
|-------|-------|-------|---------|
| `surface-base` | `#FCFBFA` | Main warm page surface and header background | <span style="background:#FCFBFA;width:24px;height:24px;display:inline-block;border-radius:4px;vertical-align:middle;border:1px solid #ddd"></span> |
| `surface-page-end` | `#F8FAFC` | Gradient fade at the page bottom and hero background mix | <span style="background:#F8FAFC;width:24px;height:24px;display:inline-block;border-radius:4px;vertical-align:middle;border:1px solid #ddd"></span> |
| `surface-primary` | `#FFFFFF` | Default card and content surface | <span style="background:#FFFFFF;width:24px;height:24px;display:inline-block;border-radius:4px;vertical-align:middle;border:1px solid #ddd"></span> |
| `surface-muted` | `#F3F5FB` | Section background for process/timeline content | <span style="background:#F3F5FB;width:24px;height:24px;display:inline-block;border-radius:4px;vertical-align:middle;border:1px solid #ddd"></span> |
| `surface-tint` | `#EEF2F7` | Soft image placeholders and editorial card media blocks | <span style="background:#EEF2F7;width:24px;height:24px;display:inline-block;border-radius:4px;vertical-align:middle;border:1px solid #ddd"></span> |
| `accent-mist` | `#D9E1E8` | Light premium gradient anchors | <span style="background:#D9E1E8;width:24px;height:24px;display:inline-block;border-radius:4px;vertical-align:middle;border:1px solid #ddd"></span> |
| `accent-mist-strong` | `#D3D7DE` | Profile and decorative gradient depth | <span style="background:#D3D7DE;width:24px;height:24px;display:inline-block;border-radius:4px;vertical-align:middle;border:1px solid #ddd"></span> |

### Border and Overlay Treatments

| Token | Value | Usage |
|-------|-------|-------|
| `border-subtle` | `#E7DFCF` | Default warm border for cards, sections, and footer divisions |
| `border-neutral` | `#CBD5E1` | Neutral fallback border for light-outline controls such as secondary login actions |
| `white/60` | `rgba(255,255,255,0.6)` | Hero decorative borders on glass surfaces |
| `white/25` | `rgba(255,255,255,0.25)` | Hero translucent fill |
| `white/10` | `rgba(255,255,255,0.1)` | Inverse panel borders and nested cards |
| `brand-primary/20` | `rgba(181,146,42,0.2)` | Low-contrast connector line for process steps |
| `brand-primary/12` | `rgba(181,146,42,0.12)` | Page-level radial glow accent |

### Usage Rules

- Use gold for actions, labels, and small accent marks.
- Keep large reading surfaces white, cream, or pale blue-gray.
- On light backgrounds, do not rely on gold alone for small body-copy contrast.
- Dark charcoal sections should always switch supporting copy to `text-inverse` or white.

## Typography

### Font Families

| Token | Value | Purpose |
|-------|-------|---------|
| `font-heading` | `"Libre Caslon Text", serif` | Display and section headings |
| `font-body` | `"Hanken Grotesk", sans-serif` | Body copy, buttons, navigation, metadata |

### Type Scale

| Token | Size | Weight | Tracking | Usage |
|-------|------|--------|----------|-------|
| `display-hero` | `36px / 48px / 60px` | `400` | default | Main hero headline (`text-4xl sm:text-5xl lg:text-6xl`) |
| `heading-section` | `30px / 36px` | `400` | default | Section titles such as Philosophy, Services, Specialists |
| `title-card` | `24px` | `400` | default | Service cards, doctor names, CTA titles |
| `title-body` | `18px` | `600` | default | Supporting callouts inside content blocks |
| `body-lg` | `18px` | `400` | relaxed | Hero and CTA support copy on larger breakpoints |
| `body-md` | `16px` | `400` | relaxed | Standard paragraph size |
| `body-sm` | `14px` | `400-500` | relaxed | Card copy, metadata, secondary descriptions |
| `label-xs` | `12px` | `600` | `0.18em-0.34em` | Eyebrows, section labels, ordered feature markers |
| `micro-label` | `11px` | `400` | `0.18em` | Small premium stat labels |

### Typography Guidance

- Serif headings should stay sentence case and roomy. Avoid full-uppercase serif headlines.
- Uppercase labels are the main place for aggressive letter spacing.
- Body copy should generally stay within `max-w-lg` or `max-w-2xl` ranges to preserve the luxury reading rhythm.
- The current page overrides Tailwind's default `sans` family with `font-['Hanken_Grotesk']`. If this language becomes app-wide, move the token into `tailwind.config.js`.

## Spacing System

**Base unit:** `4px`

| Token | Value | Typical Usage |
|-------|-------|---------------|
| `space-3` | `12px` | Tight vertical spacing between small text elements |
| `space-4` | `16px` | Default inline gaps and paragraph offsets |
| `space-5` | `20px` | Button padding and compact card interiors |
| `space-6` | `24px` | Standard container side padding at tablet sizes |
| `space-8` | `32px` | Large card interiors and major stack separation |
| `space-10` | `40px` | Section intro to grid separation |
| `space-16` | `64px` | Mobile section vertical rhythm |
| `space-24` | `96px` | Desktop section vertical rhythm |

### Spacing Rules

- Use `16px` and `24px` gaps as the default interior rhythm.
- Use `32px` or `40px` to separate different content groups within the same section.
- Use `64px` vertical padding for mobile sections and expand to `96px` on desktop.
- Prefer consistent horizontal page padding: `16px` mobile, `24px` tablet, `32px` desktop.

## Layout and Breakpoints

### Breakpoints

| Token | Value | How it is used |
|-------|-------|----------------|
| `sm` | `640px` | Larger mobile type and button arrangements |
| `md` | `768px` | Two-column editorial layouts, service grids, footer columns |
| `lg` | `1024px` | Full hero split layout and desktop decorative framing |
| `xl` | `1280px` | Max container width alignment via `max-w-7xl` |

### Containers

| Token | Value | Usage |
|-------|-------|-------|
| `container-page` | `80rem` | Main shell (`max-w-7xl`) |
| `container-cta` | `64rem` | CTA focus area (`max-w-5xl`) |
| `container-reading` | `48rem` | Journal heading block (`max-w-3xl`) |
| `container-hero-copy` | `42rem` | Hero and introductory text (`max-w-2xl`) |

### Layout Patterns

1. Split hero
   A left text column pairs with a right decorative stage that only fully materializes at `lg` and above.
2. Asymmetric service grid
   One standard card, one double-width premium dark panel, and one supporting CTA card create hierarchy without looking uniform.
3. Modular stacked sections
   Every section is divided with a subtle border and uses strong internal max-width discipline.
4. Mobile-first collapse
   Multi-column compositions collapse to a single stack before re-expanding at `md` or `lg`.

## Borders, Radii, and Shape Language

### Border Widths

| Token | Value | Usage |
|-------|-------|-------|
| `border-default` | `1px` | Section dividers, cards, circular icon frames |

### Radii

| Token | Value | Usage |
|-------|-------|-------|
| `radius-md` | `0.375rem` | Buttons and compact controls |
| `radius-lg` | `0.5rem` | Inner cards and small panels |
| `radius-xl` | `0.75rem` | Main content cards |
| `radius-2xl` | `1rem` | Large hero or editorial media blocks |
| `radius-full` | `9999px` | Avatars, badges, icon buttons |

### Shape Guidance

- Use rectangular buttons with moderate rounding rather than pills.
- Reserve circular shapes for avatars, numeric steps, and compact utility links.
- Large decorative shapes may use custom radii when creating the hero's arched glass forms.

## Shadows and Elevation

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-soft-lift` | `0 24px 50px -28px rgba(15, 23, 42, 0.18)` | Standard editorial cards and light floating surfaces |
| `shadow-soft-lift-strong` | `0 24px 50px -28px rgba(15, 23, 42, 0.28)` | Dark spotlight panels needing stronger depth |
| `shadow-soft-sm` | Tailwind `shadow-sm` | Small avatar or nested surface definition |

### Elevation Guidance

- Use borders and tonal changes first.
- Add shadow only when a surface should feel lifted or interactive.
- Dark surfaces can take slightly stronger shadows than light cards.
- Sticky chrome should prefer translucency and blur over heavy shadow.

## Motion and Layering

### Motion Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `duration-default` | `150ms` | Tailwind `transition` default for hover changes |
| `easing-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | Standard hover and color transitions |

### Layering Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `z-sticky-header` | `30` | Header stays above page content and decorative layers |

### Motion Guidance

- Keep interactions understated: color shifts, subtle shadow increase, soft background fills.
- Avoid bouncy or spring-heavy animation in this visual language.
- Backdrop blur is allowed for premium chrome, especially sticky navigation.

## Component Library

### Button

#### Overview

The system uses concise rectangular CTAs with medium font weight and short labels. Buttons are never oversized or heavily stylized; the luxury tone comes from contrast, whitespace, and typography rather than ornament.

#### Variants

| Variant | Use case | Visual treatment |
|---------|----------|------------------|
| `primary` | Main conversion actions | Gold background, white text, darker gold hover |
| `secondary` | Neutral alternate action on light surfaces | White or transparent surface with light border and dark text |
| `outline-accent` | Strong but non-filled action | White background with gold border and gold text, inverts on hover |
| `inverse-outline` | Secondary action on dark surfaces | Transparent background, white border, white text |
| `text-link` | Low-weight supporting action | Inline gold text or charcoal text with no container |

#### Anatomy

| Part | Description | Required |
|------|-------------|----------|
| Label | Short action-oriented copy | Yes |
| Container | Rounded rectangle with 1px border or solid fill | Yes |
| Hover treatment | Color or shadow shift | Yes |

#### States

| State | Primary | Secondary / Outline |
|-------|---------|---------------------|
| Default | Gold fill, white text | Border present, neutral or gold text |
| Hover | Darker gold, optional soft-lift | White or accent inversion, optional fill |
| Focus | Must show visible focus ring in production | Must show visible focus ring in production |
| Disabled | Not currently demonstrated on the page | Not currently demonstrated on the page |

#### Accessibility

- Minimum touch target: `44px` height.
- Add `focus-visible` ring styles when productionizing shared button components.
- Gold text on white should be limited to large or semibold interactive labels; use darker text for long copy.

#### React Example

```jsx
function PrimaryButton({ href, children }) {
    return (
        <Link
            href={href}
            className="rounded-md bg-[#b5922a] px-6 py-3 text-center text-sm font-medium text-white transition hover:bg-[#9d7e23] hover:shadow-[0_24px_50px_-28px_rgba(15,23,42,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b5922a] focus-visible:ring-offset-2"
        >
            {children}
        </Link>
    );
}
```

### Section Header

#### Overview

Section headers pair a gold uppercase eyebrow with a serif heading. This is the main rhythm-setting pattern across the page.

#### Anatomy

| Part | Description | Required |
|------|-------------|----------|
| Eyebrow | Small uppercase gold label with wide tracking | Optional |
| Heading | Serif title in charcoal | Yes |
| Intro copy | Short supporting paragraph | Optional |

#### Usage Guidance

- Use when introducing a new content band.
- Center the pattern for ceremonial sections like Services or Journal.
- Left-align it when the section flows into cards, profiles, or data.

#### React Example

```jsx
function SectionHeader({ eyebrow, title, align = 'left', children }) {
    return (
        <div className={align === 'center' ? 'text-center' : ''}>
            {eyebrow ? (
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b5922a]">
                    {eyebrow}
                </p>
            ) : null}
            <h2 className="mt-3 text-3xl text-slate-950 sm:text-4xl" style={{ fontFamily: '"Libre Caslon Text", serif' }}>
                {title}
            </h2>
            {children}
        </div>
    );
}
```

### Editorial Card

#### Overview

Editorial cards are the default light-surface container across services, journal entries, process steps, and fallback states. They rely on cream borders, white backgrounds, generous padding, and restrained shadows.

#### Variants

| Variant | Use case | Notes |
|---------|----------|-------|
| `service-card` | Standard feature summaries | Often uses serif card title and accent bullet list |
| `journal-card` | Educational content teasers | Includes media placeholder block |
| `centered-card` | Process steps and empty states | Centers content vertically and horizontally |

#### Specs

| Token | Value |
|-------|-------|
| Background | `#FFFFFF` or `#FCFBFA` |
| Border | `1px solid #E7DFCF` |
| Radius | `0.75rem` |
| Padding | `24px` to `32px` |
| Shadow | `shadow-soft-lift` |

#### Accessibility

- Treat the whole card as static unless the card contains an actual link or button.
- Keep decorative media placeholders hidden from assistive tech when they do not convey content.
- Maintain heading order when cards are used inside section grids.

### Inverse Spotlight Panel

#### Overview

The inverse spotlight panel is the dark premium surface used to elevate the "Wellness and Longevity" message and the closing CTA. It creates contrast without switching the whole page into dark mode.

#### Anatomy

| Part | Description | Required |
|------|-------------|----------|
| Dark container | `#151922` background with stronger shadow | Yes |
| Gold heading | Serif title in gold | Yes |
| Inverse body copy | Light slate text | Yes |
| Nested translucent cards | Optional supporting features | Optional |

#### Usage Guidance

- Use once per viewport band whenever a premium service or decisive CTA needs emphasis.
- Pair with gold headings and white or pale slate supporting text.
- Avoid stacking multiple dark spotlight panels back-to-back.

### Journey Step Card

#### Overview

The process card pattern explains structured journeys such as consultations, onboarding, and treatment steps. It uses numbered circles, centered copy, and a subtle horizontal connector on desktop.

#### Responsive Behavior

- Mobile: cards stack vertically with no connector line.
- Desktop: cards align in a four-column grid with a faint gold rule behind them.

#### Accessibility

- Keep the numeric marker supplementary; the actual step title must carry meaning on its own.
- If the pattern becomes interactive, convert it into a semantic list or stepper with clear current-state indication.

### Doctor Profile Card

#### Overview

Doctor profile cards use a portrait placeholder with circular initials, serif naming, and small uppercase specialization text. The pattern balances human warmth with editorial polish.

#### Anatomy

| Part | Description | Required |
|------|-------------|----------|
| Portrait surface | Tall 3:4 frame with mist gradient | Yes |
| Avatar/initials | Circular inset profile marker | Yes when photos are absent |
| Name | Serif heading | Yes |
| Specialization | Gold uppercase metadata line | Yes |
| Bio | Supporting paragraph | Optional |

### Footer Action Cluster

#### Overview

The footer closes with practical navigation and real account actions instead of dead-end forms. This is an important product rule as much as a visual pattern.

#### Guidance

- Every footer CTA should lead to a functional route.
- Prefer one primary footer action and one secondary fallback.
- Keep the supporting copy short and operational.

## Page Patterns

### Hero Split Layout

**Purpose:** Introduce the clinic with editorial confidence and a premium atmosphere before users scroll.

**Structure:**

- Left: eyebrow, serif display, supporting copy, two actions
- Right: decorative stage with layered translucent forms
- Background: warm cream surface with subtle radial gold glow

**Responsive behavior:**

- Decorative architecture is reduced on mobile to avoid empty vertical mass.
- Desktop restores the full right-side composition.

### Asymmetric Services Grid

**Purpose:** Create hierarchy between standard service categories and the premium wellness spotlight.

**Structure:**

- One standard light card
- One double-width dark spotlight card
- One supporting action card

**Why it works:**

- The broken grid avoids a generic three-equal-card marketing layout.
- The dark panel acts as the focal point without requiring animation or imagery.

### Closing CTA Band

**Purpose:** End the narrative with a decisive, luxurious conversion moment.

**Structure:**

- Full-width charcoal band
- Large serif heading
- Supporting paragraph capped at comfortable reading width
- Paired primary and secondary actions

## Accessibility Standards

### Global Requirements

- Maintain semantic landmarks: `header`, `main`, and `footer`.
- Preserve real links and buttons for every visible action.
- Ensure visible focus treatment for keyboard users, even if the current page mostly relies on browser defaults.
- Keep paragraph text at or above `16px` for primary reading content.

### Color and Contrast

- Use gold on cream for accents, labels, and large semibold text only.
- For standard-size interactive text on light surfaces, prefer charcoal or add stronger contrast treatment.
- Inverse sections must keep light text and border contrast above WCAG 2.1 AA thresholds.

### Motion and Interaction

- Hover feedback must never be the only affordance.
- Transitions should remain subtle and fast.
- Decorative gradients, placeholder blocks, and purely ornamental shapes should be ignored by assistive technologies.

## Do and Don't

| Do | Don't |
|----|-------|
| Use gold sparingly for actions and premium cues | Flood large surfaces with gold |
| Pair serif headings with calm sans-serif body copy | Use serif for long body paragraphs |
| Keep section spacing generous and consistent | Compress the page into dense marketing blocks |
| Use real routes for footer and CTA actions | Add non-functional signup or inquiry controls |
| Let dark spotlight panels punctuate the page | Turn every section into a high-contrast block |

## Implementation Reference

### CSS Variables

```css
:root {
  --aura-color-brand-primary: #b5922a;
  --aura-color-brand-primary-hover: #9d7e23;
  --aura-color-text-primary: #020617;
  --aura-color-text-page: #0f172a;
  --aura-color-text-secondary: #475569;
  --aura-color-text-inverse: #cbd5e1;
  --aura-color-surface-base: #fcfbfa;
  --aura-color-surface-primary: #ffffff;
  --aura-color-surface-muted: #f3f5fb;
  --aura-color-surface-dark: #151922;
  --aura-color-border-subtle: #e7dfcf;

  --aura-font-heading: "Libre Caslon Text", serif;
  --aura-font-body: "Hanken Grotesk", sans-serif;

  --aura-radius-md: 0.375rem;
  --aura-radius-xl: 0.75rem;
  --aura-shadow-soft-lift: 0 24px 50px -28px rgba(15, 23, 42, 0.18);

  --aura-space-4: 16px;
  --aura-space-6: 24px;
  --aura-space-8: 32px;
  --aura-space-16: 64px;
  --aura-space-24: 96px;
}
```

### Shared Section Shell

```jsx
function SectionShell({ id, className = '', children }) {
    return (
        <section id={id} className={`border-b border-[#e7dfcf]/80 bg-[#fcfbfa] ${className}`}>
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
                {children}
            </div>
        </section>
    );
}
```

## Maintenance Notes

- If the Aura Luxe direction expands beyond the landing page, move the font family tokens into `tailwind.config.js` instead of page-local overrides.
- Promote repeated card and heading patterns into shared React components before introducing more page variations.
- If gold text usage expands, add a darker accessible brand text token for smaller copy on light surfaces.

## Related References

- `docs/more_apps/aura_luxe_clinical/DESIGN.md` - original design system reference
- `resources/js/Pages/Welcome.jsx` - page implementation and token source
- Hero and sticky header patterns - top of file through the first service section
- Reusable card and CTA patterns - services, journey, journal, and footer sections
