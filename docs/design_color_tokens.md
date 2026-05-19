# Design Color Tokens

## Overview

`docs/design_color.css` defines the core design tokens for the MORÉ clinic interface. The file uses semantic CSS custom properties for light and dark themes, then maps those tokens into Tailwind v4 `@theme inline` variables for application-wide use.

This token set is optimized for:

- Clean medical and wellness UI surfaces
- Warm amber primary actions and highlights
- Neutral supporting surfaces for forms, cards, and dashboards
- Consistent theming across light mode and dark mode
- Direct consumption in Tailwind, CSS, and component code

## Token Structure

The token system has two layers:

1. Source semantic tokens in `:root` and `.dark`
2. Tailwind-facing aliases in `@theme inline`

### Naming Convention

- Surface tokens: `--background`, `--card`, `--popover`, `--sidebar`
- Text pairing tokens: `--foreground`, `--card-foreground`, `--accent-foreground`
- Action tokens: `--primary`, `--secondary`, `--accent`, `--ring`
- Feedback tokens: `--destructive`
- Data visualization tokens: `--chart-1` through `--chart-5`
- Foundation tokens: `--font-*`, `--radius`, `--shadow-*`, `--spacing`
- Tailwind aliases: `--color-*`, `--radius-*`, `--shadow-*`

### Theme Behavior

- `:root` contains light theme defaults.
- `.dark` overrides the semantic tokens for dark mode.
- `@custom-variant dark (&:is(.dark *));` enables Tailwind dark mode styling based on a parent `.dark` class.
- `@theme inline` exposes the semantic tokens to Tailwind utilities such as `bg-background`, `text-foreground`, and `border-border`.

## Token Reference

### Core Surfaces and Content

| Token | Light Value | Dark Value | Usage | Preview |
|-------|-------------|------------|-------|---------|
| `--background` | `oklch(1.0000 0 0)` | `oklch(0.2046 0 0)` | App page background | White in light mode, deep charcoal in dark mode |
| `--foreground` | `oklch(0.2686 0 0)` | `oklch(0.9219 0 0)` | Primary text on page backgrounds | Near-black text or near-white text |
| `--card` | `oklch(1.0000 0 0)` | `oklch(0.2686 0 0)` | Card surfaces | Elevated neutral panel |
| `--card-foreground` | `oklch(0.2686 0 0)` | `oklch(0.9219 0 0)` | Text and icons inside cards | High-contrast card content |
| `--popover` | `oklch(1.0000 0 0)` | `oklch(0.2686 0 0)` | Menus, dialogs, floating layers | Neutral floating surface |
| `--popover-foreground` | `oklch(0.2686 0 0)` | `oklch(0.9219 0 0)` | Text inside popovers | High-contrast overlay text |

### Action, Support, and Feedback Colors

| Token | Light Value | Dark Value | Usage | Preview |
|-------|-------------|------------|-------|---------|
| `--primary` | `oklch(0.7686 0.1647 70.0804)` | `oklch(0.7686 0.1647 70.0804)` | Primary actions, selected states, brand emphasis | Warm amber accent |
| `--primary-foreground` | `oklch(0 0 0)` | `oklch(0 0 0)` | Text/icons on primary surfaces | Black text on amber |
| `--secondary` | `oklch(0.9670 0.0029 264.5419)` | `oklch(0.2686 0 0)` | Secondary surfaces, low-emphasis actions | Soft gray panel in light, neutral dark panel in dark |
| `--secondary-foreground` | `oklch(0.4461 0.0263 256.8018)` | `oklch(0.9219 0 0)` | Text on secondary surfaces | Medium contrast neutral text |
| `--muted` | `oklch(0.9846 0.0017 247.8389)` | `oklch(0.2393 0 0)` | Muted containers and subtle backgrounds | Soft subdued neutral |
| `--muted-foreground` | `oklch(0.5510 0.0234 264.3637)` | `oklch(0.7155 0 0)` | Helper text, meta text, placeholders | Subdued readable text |
| `--accent` | `oklch(0.9869 0.0214 95.2774)` | `oklch(0.4732 0.1247 46.2007)` | Highlight surfaces, hover fills, badges | Pale warm highlight in light, rich amber-brown in dark |
| `--accent-foreground` | `oklch(0.4732 0.1247 46.2007)` | `oklch(0.9243 0.1151 95.7459)` | Text on accent surfaces | Warm contrasting text |
| `--destructive` | `oklch(0.6368 0.2078 25.3313)` | `oklch(0.6368 0.2078 25.3313)` | Error, delete, critical actions | Strong red alert |
| `--destructive-foreground` | `oklch(1.0000 0 0)` | `oklch(1.0000 0 0)` | Text/icons on destructive surfaces | White error text |
| `--border` | `oklch(0.9276 0.0058 264.5313)` | `oklch(0.3715 0 0)` | Borders and dividers | Subtle neutral outline |
| `--input` | `oklch(0.9276 0.0058 264.5313)` | `oklch(0.3715 0 0)` | Input borders and control edges | Matches form outline treatment |
| `--ring` | `oklch(0.7686 0.1647 70.0804)` | `oklch(0.7686 0.1647 70.0804)` | Focus outlines and emphasis ring | Amber focus cue |

### Data Visualization Tokens

| Token | Light Value | Dark Value | Usage | Preview |
|-------|-------------|------------|-------|---------|
| `--chart-1` | `oklch(0.7686 0.1647 70.0804)` | `oklch(0.8369 0.1644 84.4286)` | Primary series or key metric | Bright amber |
| `--chart-2` | `oklch(0.6658 0.1574 58.3183)` | `oklch(0.6658 0.1574 58.3183)` | Secondary data series | Deep golden orange |
| `--chart-3` | `oklch(0.5553 0.1455 48.9975)` | `oklch(0.4732 0.1247 46.2007)` | Tertiary data series | Burnt amber |
| `--chart-4` | `oklch(0.4732 0.1247 46.2007)` | `oklch(0.5553 0.1455 48.9975)` | Supporting series | Bronze brown |
| `--chart-5` | `oklch(0.4137 0.1054 45.9038)` | `oklch(0.4732 0.1247 46.2007)` | Low-priority series or overflow palette | Dark warm brown |

### Sidebar Tokens

| Token | Light Value | Dark Value | Usage | Preview |
|-------|-------------|------------|-------|---------|
| `--sidebar` | `oklch(0.9846 0.0017 247.8389)` | `oklch(0.1684 0 0)` | Sidebar background | Soft neutral panel or deep dark rail |
| `--sidebar-foreground` | `oklch(0.2686 0 0)` | `oklch(0.9219 0 0)` | Default sidebar text | High-contrast navigation text |
| `--sidebar-primary` | `oklch(0.7686 0.1647 70.0804)` | `oklch(0.7686 0.1647 70.0804)` | Active sidebar action or selected item | Amber active state |
| `--sidebar-primary-foreground` | `oklch(1.0000 0 0)` | `oklch(1.0000 0 0)` | Text on sidebar primary surface | White selected text |
| `--sidebar-accent` | `oklch(0.9869 0.0214 95.2774)` | `oklch(0.4732 0.1247 46.2007)` | Hover or supporting sidebar highlight | Warm highlighted row |
| `--sidebar-accent-foreground` | `oklch(0.4732 0.1247 46.2007)` | `oklch(0.9243 0.1151 95.7459)` | Text on sidebar accent surfaces | Warm contrast text |
| `--sidebar-border` | `oklch(0.9276 0.0058 264.5313)` | `oklch(0.3715 0 0)` | Sidebar separators | Soft navigation divider |
| `--sidebar-ring` | `oklch(0.7686 0.1647 70.0804)` | `oklch(0.7686 0.1647 70.0804)` | Focus treatment in sidebar UI | Amber focus ring |

### Typography Tokens

| Token | Value | Usage | Preview |
|-------|-------|-------|---------|
| `--font-sans` | `Inter, sans-serif` | Default UI text, forms, navigation, data display | Modern neutral sans serif |
| `--font-serif` | `Source Serif 4, serif` | Editorial accents, testimonials, premium brand moments | Refined serif accent |
| `--font-mono` | `JetBrains Mono, monospace` | Code, identifiers, logs, tabular technical content | Technical monospace |
| `--tracking-normal` | `0em` | Default letter spacing | Standard tracking |

### Radius Tokens

| Token | Value | Usage | Preview |
|-------|-------|-------|---------|
| `--radius` | `0.375rem` | Base corner radius for controls and surfaces | 6px rounded corners |
| `--radius-sm` | `calc(var(--radius) - 4px)` | Small controls and tight chips | 2px corners |
| `--radius-md` | `calc(var(--radius) - 2px)` | Default medium controls | 4px corners |
| `--radius-lg` | `var(--radius)` | Standard card and input radius | 6px corners |
| `--radius-xl` | `calc(var(--radius) + 4px)` | Larger feature panels and modals | 10px corners |

### Shadow Tokens

| Token | Value | Usage | Preview |
|-------|-------|-------|---------|
| `--shadow-2xs` | `0px 4px 8px -1px hsl(0 0% 0% / 0.05)` | Minimal elevation | Very soft shadow |
| `--shadow-xs` | `0px 4px 8px -1px hsl(0 0% 0% / 0.05)` | Light elevation for compact UI | Soft compact shadow |
| `--shadow-sm` | `0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 1px 2px -2px hsl(0 0% 0% / 0.10)` | Inputs, buttons, small cards | Layered low elevation |
| `--shadow` | `0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 1px 2px -2px hsl(0 0% 0% / 0.10)` | Default elevation | Standard surface shadow |
| `--shadow-md` | `0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 2px 4px -2px hsl(0 0% 0% / 0.10)` | Cards, dropdowns | Moderate depth |
| `--shadow-lg` | `0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 4px 6px -2px hsl(0 0% 0% / 0.10)` | Menus, drawers | Stronger layered shadow |
| `--shadow-xl` | `0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 8px 10px -2px hsl(0 0% 0% / 0.10)` | Large overlays, dialogs | Prominent overlay shadow |
| `--shadow-2xl` | `0px 4px 8px -1px hsl(0 0% 0% / 0.25)` | High-emphasis overlays | Dense modal shadow |

### Layout Tokens

| Token | Value | Usage | Preview |
|-------|-------|-------|---------|
| `--spacing` | `0.25rem` | Base spacing multiplier | 4px layout unit |
| `--shadow-x` | `0px` | Shadow offset X foundation | Neutral horizontal shadow |
| `--shadow-y` | `4px` | Shadow offset Y foundation | Downward elevation bias |
| `--shadow-blur` | `8px` | Shadow blur foundation | Soft edges |
| `--shadow-spread` | `-1px` | Shadow spread foundation | Tightened shadow footprint |
| `--shadow-opacity` | `0.1` | Shadow opacity foundation | 10% opacity basis |
| `--shadow-color` | `hsl(0 0% 0%)` | Shared shadow color source | Black shadow color |

## Implementation

### CSS Custom Properties

```css
:root {
  --background: oklch(1.0000 0 0);
  --foreground: oklch(0.2686 0 0);
  --primary: oklch(0.7686 0.1647 70.0804);
  --primary-foreground: oklch(0 0 0);
  --border: oklch(0.9276 0.0058 264.5313);
  --ring: oklch(0.7686 0.1647 70.0804);
  --font-sans: Inter, sans-serif;
  --radius: 0.375rem;
  --spacing: 0.25rem;
}

.dark {
  --background: oklch(0.2046 0 0);
  --foreground: oklch(0.9219 0 0);
  --border: oklch(0.3715 0 0);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-border: var(--border);
  --color-ring: var(--ring);
}
```

### JavaScript/JSON

```json
{
  "color": {
    "background": {
      "light": "oklch(1.0000 0 0)",
      "dark": "oklch(0.2046 0 0)"
    },
    "foreground": {
      "light": "oklch(0.2686 0 0)",
      "dark": "oklch(0.9219 0 0)"
    },
    "primary": {
      "light": "oklch(0.7686 0.1647 70.0804)",
      "dark": "oklch(0.7686 0.1647 70.0804)"
    },
    "accent": {
      "light": "oklch(0.9869 0.0214 95.2774)",
      "dark": "oklch(0.4732 0.1247 46.2007)"
    },
    "destructive": {
      "light": "oklch(0.6368 0.2078 25.3313)",
      "dark": "oklch(0.6368 0.2078 25.3313)"
    }
  },
  "font": {
    "sans": "Inter, sans-serif",
    "serif": "Source Serif 4, serif",
    "mono": "JetBrains Mono, monospace"
  },
  "radius": {
    "base": "0.375rem",
    "sm": "calc(var(--radius) - 4px)",
    "md": "calc(var(--radius) - 2px)",
    "lg": "var(--radius)",
    "xl": "calc(var(--radius) + 4px)"
  }
}
```

### Tailwind Usage

```tsx
export function ExampleCard() {
  return (
    <section className="bg-card text-card-foreground border border-border shadow-md rounded-lg p-6">
      <h2 className="text-foreground text-lg font-semibold">Consultation Summary</h2>
      <p className="text-muted-foreground mt-2 text-sm">
        Tokens are consumed through Tailwind semantic utilities.
      </p>
      <button className="bg-primary text-primary-foreground ring-ring mt-4 rounded-md px-4 py-2 focus-visible:outline-none focus-visible:ring-2">
        Continue
      </button>
    </section>
  );
}
```

## Usage Guidelines

- Use semantic tokens, not raw color values, in application code.
- Prefer `bg-background`, `text-foreground`, `border-border`, and `ring-ring` over hard-coded utility values.
- Use `--primary` for primary CTAs only. Do not use it as a general decorative fill.
- Use `--accent` for supportive emphasis such as badges, hover rows, or selected secondary surfaces.
- Use `--muted` and `--muted-foreground` for helper copy, meta information, and low-priority UI.
- Keep `--destructive` reserved for dangerous actions and error states.
- Use the sidebar token family for navigation containers instead of reusing general page tokens.
- Derive all corner sizes from `--radius` to keep shape language consistent.
- Reuse the existing shadow scale rather than inventing one-off elevation values.

## Accessibility Considerations

- Verify text contrast whenever text is placed on `--primary`, `--accent`, or chart colors, especially in custom components.
- Use `--ring` consistently for keyboard focus states so focus remains visible in both themes.
- Do not communicate status by color alone; pair `--destructive` and chart tokens with labels or icons.
- Treat `--muted-foreground` as secondary text only, not as the default body text color.

## Do and Don't

| Do | Don't |
|----|-------|
| Use `text-muted-foreground` for supporting metadata | Use muted text for primary instructions or critical labels |
| Use `bg-primary text-primary-foreground` for the main CTA | Apply amber styling to every button on a page |
| Use `border-border` and `bg-card` for default cards | Hard-code custom gray hex values for panels |
| Use `ring-ring` for focus-visible states | Remove focus outlines without replacing them |
| Use sidebar-specific tokens in navigation | Reuse page background tokens for all sidebar states |

## Migration Notes

- The file already follows semantic token naming, so future component work should consume tokens directly instead of introducing literal palette values.
- The dark theme is implemented as overrides rather than a separate token namespace. Keep that pattern to avoid duplicate component logic.
- If the system expands, add new semantic roles such as `success`, `warning`, or `info` before adding literal palette names.
- If a token must be deprecated, preserve the semantic alias temporarily in `@theme inline` and migrate component usage in a controlled pass.

## Related System Elements

- `docs/design_color.css` - Source token definitions and Tailwind mappings
- Tailwind v4 theme layer - Consumes `@theme inline` aliases
- Shadcn/ui components - Expected to consume semantic tokens such as `background`, `foreground`, `border`, and `ring`

## Changelog

| Version | Changes |
|---------|---------|
| 1.0 | Initial documentation generated from `docs/design_color.css` |
