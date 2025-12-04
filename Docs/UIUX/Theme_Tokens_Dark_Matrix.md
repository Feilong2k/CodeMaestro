# Theme & Tokens — Dark “Futuristic/Matrix” (Vue 3 + Tailwind)

Owner: Una (UI/UX Architect)
Status: Draft v0.1
Scope: Tokens for dark-mode-first, clean SaaS with subtle Matrix/robotic flavor. These map to CSS variables and Tailwind utility classes (via Tailwind config).

---

## 1) Palette

Base surfaces (charcoal, not pure black):
- bg.base: #0C0F12
- bg.layer: #12161C
- bg.elevated: #151A21
- bg.subtle: #0F1318

Text:
- text.primary: #E6F1FF
- text.secondary: #A3B3C5
- text.muted: #7A8898
- text.inverse: #0C0F12

Accents:
- accent.primary (electric cyan): #00E5FF
- accent.secondary (violet): #7C4DFF
- success: #22D3A0
- warning: #FFB020
- danger: #FF5A6E
- info: #5AC8FA

Lines & Dividers:
- line.base: #1E2630
- line.circuit (subtle cyan): rgba(0,229,255,0.12)

---

## 2) Typography
- font.sans: Inter, "SF Pro Text", Segoe UI, Roboto, Arial, sans-serif
- font.mono: "JetBrains Mono", "Roboto Mono", Consolas, monospace

Scale (px):
- fs.xs: 12
- fs.sm: 14
- fs.md: 16
- fs.lg: 20
- fs.xl: 24

Weights:
- fw.regular: 400
- fw.medium: 500
- fw.semibold: 600

Line-heights:
- lh.tight: 1.25
- lh.normal: 1.5
- lh.relaxed: 1.65

---

## 3) Spacing & Radii
- space: 4, 8, 12, 16, 20, 24, 32, 40
- radius.sm: 6px
- radius.md: 8px
- radius.lg: 12px

---

## 4) Elevation, Glow, Focus
Shadows:
- shadow.sm: 0 2px 8px rgba(0,0,0,0.3)
- shadow.md: 0 6px 18px rgba(0,0,0,0.35)

Subtle neon glow (use sparingly):
- glow.cyan: 0 0 0 1px rgba(0,229,255,0.15), 0 0 12px rgba(0,229,255,0.1)

Focus ring:
- focus.ring: 0 0 0 2px #00E5FF

---

## 5) Motion
- ease.standard: cubic-bezier(0.2, 0, 0, 1)
- duration.fast: 80ms
- duration.normal: 140ms
- duration.slow: 220ms
- reduceMotion: honor prefers-reduced-motion

---

## 6) Z-Index
- z.topbar: 1000
- z.drawer: 1100
- z.modal: 2000
- z.toast: 3000

---

## 7) CSS Variables (reference)
Expose as :root variables and use them in Tailwind (via config) and custom CSS.

```css
:root[data-theme="dark"] {
  /* Surfaces */
  --bg-base: #0C0F12;
  --bg-layer: #12161C;
  --bg-elevated: #151A21;
  --bg-subtle: #0F1318;

  /* Text */
  --text-primary: #E6F1FF;
  --text-secondary: #A3B3C5;
  --text-muted: #7A8898;
  --text-inverse: #0C0F12;

  /* Accents */
  --accent-primary: #00E5FF;
  --accent-secondary: #7C4DFF;
  --success: #22D3A0;
  --warning: #FFB020;
  --danger: #FF5A6E;
  --info: #5AC8FA;

  /* Lines */
  --line-base: #1E2630;
  --line-circuit: rgba(0,229,255,0.12);

  /* Typography */
  --font-sans: Inter, "SF Pro Text", Segoe UI, Roboto, Arial, sans-serif;
  --font-mono: "JetBrains Mono", "Roboto Mono", Consolas, monospace;
  --fs-xs: 12px; --fs-sm: 14px; --fs-md: 16px; --fs-lg: 20px; --fs-xl: 24px;
  --fw-regular: 400; --fw-medium: 500; --fw-semibold: 600;
  --lh-tight: 1.25; --lh-normal: 1.5; --lh-relaxed: 1.65;

  /* Spacing */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px;

  /* Radius */
  --radius-sm: 6px; --radius-md: 8px; --radius-lg: 12px;

  /* Effects */
  --shadow-sm: 0 2px 8px rgba(0,0,0,0.3);
  --shadow-md: 0 6px 18px rgba(0,0,0,0.35);
  --glow-cyan: 0 0 0 1px rgba(0,229,255,0.15), 0 0 12px rgba(0,229,255,0.1);
  --focus-ring: 0 0 0 2px #00E5FF;

  /* Motion */
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --dur-fast: 80ms; --dur-normal: 140ms; --dur-slow: 220ms;
}
```

---

## 8) Usage Notes (examples)

- Use the CSS variables directly in global styles for layout and component chrome.
- In `tailwind.config.js`, extend Tailwind's theme (colors, spacing, etc.) to mirror these tokens.
- Prefer utilities for most styling; fall back to custom CSS only when necessary.

---

## 9) Matrix/Robotic Touches (guidance)
- Use `--line-circuit` as hairline dividers in panels to imply “circuit traces”.
- Apply `--glow-cyan` to active/focus states only (avoid permanent neon).
- Prefer flat surfaces with crisp borders; reserve gradients for accent elements.

---

## 10) Light Mode (future)
- Invert surfaces to light grays; keep accent hues.
- Maintain contrast ratios; preserve focus ring visibility without glow.
