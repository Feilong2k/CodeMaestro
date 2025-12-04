# Visual Modes — Matrix Ambient vs Robotic Control Grid

Owner: Una (UI/UX Architect)
Status: Draft v0.1
Scope: Two switchable background aesthetics that preserve the same layout and components. The visual mode is an atmospheric layer only; content remains clean and legible.

---

## Overview
- Modes: 
  - matrixAmbient — subtle Matrix-inspired glyph field with gentle vertical drift
  - roboticGrid — robotic/instrumentation grid with circuit traces and status accents
- Shared principles:
  - Never reduce text contrast or readability
  - Motion is minimal and respects `prefers-reduced-motion`
  - Only background/gutter areas receive motion; content panels remain solid

---

## Mode A: Matrix Ambient
Purpose: Provide a cinematic, code-inspired ambience without distracting from the work area.

Background
- Dark base (bg.base) with faint vertical columns of glyphs
- Glyphs: random alphanumeric + occasional katakana-like symbols (no readable text)
- Opacity: 5–10%; density low; large column spacing so it reads as a texture

Motion
- Slow downward drift (drizzle), 0.2–0.4 px per frame @ 60fps (clamped)
- Jitter: light per-column speed variation (±10%)
- Disabled when `prefers-reduced-motion` is on (falls back to static render)

Composition
- Visible primarily in gutters and under the top bar
- Chat and input sit on `bg.subtle`/`bg.layer` panels; no moving elements behind message text

Palette Accents
- Slightly greener tint acceptable for glyphs; keep UI accents in electric cyan (accent.primary) to avoid theme clash

Do / Don’t
- Do: keep glyphs low-contrast; large spacing; avoid literal words
- Don’t: render rain directly under body text; don’t use high-speed motion

---

## Mode B: Robotic Control Grid
Purpose: Convey precision, instrumentation, and machine-like structure; more “robotic” than “Matrix”.

Background
- Dark base with subtle geometric grid (squares or hex), 1px hairlines using line.circuit
- Circuit traces: occasional thin cyan/teal lines with small node dots (very sparse)

Motion
- Optional slow "scan line" sweep across background every 10–20s (opacity wave or faint glow)
- Reduced-motion: disable sweep entirely

Composition
- Panels framed like modules: slightly stronger borders; corner brackets (optional) using accent.primary
- Status chips feel like LEDs (rectangular light bars, thin outlines, soft pulse)

Palette Accents
- Lean more into cyan/teal and neutral steel tones; avoid green glyph color

Do / Don’t
- Do: use micro-ornaments (seams, brackets) sparingly; keep grid low-contrast
- Don’t: draw thick grid lines or dense node networks that compete with content

---

## Accessibility & Performance
- Motion: obey `prefers-reduced-motion`; provide a per-user toggle to disable visual mode entirely
- Contrast: AA contrast maintained for all text areas (panels remain solid)
- Perf: aim for <2% CPU on idle laptops; prefer offscreen canvas or CSS transforms; throttle to 30fps when tab is hidden

---

## Implementation Notes (Devon handoff preview)
- Global data attribute on <body>: `data-visual-mode="matrixAmbient|roboticGrid|none"`
- Layer component (see MatrixBackground_Component_Spec.md): positioned fixed, z-index below app shell content, pointer-events: none
- Theming via CSS variables from Theme_Tokens_Dark_Matrix.md; do not hardcode colors
- Reduced motion: detect once and keep a derived store value; re-render static background accordingly

---

## Usage Guidance
- Default: roboticGrid for everyday work (cleaner, calmer)
- Alternative: matrixAmbient for demos or when user explicitly opts in
- Provide a settings toggle (later) to switch modes; remember last choice

---

## Visual QA Checklist
- [ ] Chat and input remain perfectly legible in both modes
- [ ] Background motion is barely noticeable when focused on content
- [ ] `prefers-reduced-motion` disables all animations
- [ ] No significant CPU/GPU spikes while idle
- [ ] Top bar and gutters show intended ambience without banding or artifacts
