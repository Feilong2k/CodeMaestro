# MatrixBackground Component Spec — Visual Modes (Matrix Ambient | Robotic Control Grid)

Owner: Una (UI/UX Architect)
Status: Draft v0.1
Scope: A reusable, switchable background layer that adds subtle ambience without impacting content readability, accessibility, or performance.

---

## Purpose
Provide a low-noise atmospheric layer behind the app shell that can render either:
- matrixAmbient: a faint glyph field with gentle vertical drift (Matrix-like), or
- roboticGrid: a subtle instrument-panel grid with occasional circuit traces and optional slow scan sweep (robotic).

The foreground (chat, input, status) remains on solid/semi-solid panels for legibility.

---

## Placement & Composition
- Render as a fixed, full-viewport layer beneath the main content:
  - DOM container sits directly under `.app-shell` root, with `position: fixed; inset: 0; pointer-events: none; z-index: 0`.
  - Ensure main content and top bar sit on higher z-index layers.
- Respect “gutters-first” visibility:
  - Keep motion primarily visible in page gutters and behind the top bar.
  - Chat transcript and input areas remain on solid panels; do not place moving elements directly beneath body text.

---

## API
Props (or global store inputs):
- mode: 'matrixAmbient' | 'roboticGrid' | 'none' (default: 'none')
- enabled: boolean (default: true)
- respectsReducedMotion: boolean (default: true)
- density: number (0.0–1.0, default 0.35) — controls glyph column count or grid intensity
- speed: number (0.0–1.0, default 0.4) — scales motion speed (matrix drizzle or scan sweep)
- quality: 'low' | 'medium' | 'high' (default: 'medium') — caps resolution / work per frame
- paletteOverrides?: { glyph?: string; grid?: string; circuit?: string } — optional hex/rgba overrides

Events (optional):
- onPerfWarn(detail) — emitted if frame time regularly exceeds a threshold (e.g., > 16ms for 5s)

Theme dependencies (CSS variables from Theme_Tokens_Dark_Matrix.md):
- Surfaces: --bg-base, --bg-layer, --bg-elevated
- Lines: --line-circuit
- Accents: --accent-primary (cyan), optional greenish glyph tint derived from accent

---

## Rendering Strategies
Two implementation options; pick based on performance and complexity.

### Option A: Canvas 2D (recommended)
- One on-screen canvas sized to `min(window.devicePixelRatio, 1.5)` to balance sharpness and perf.
- Pause loop with `document.visibilityState === 'hidden'`.
- Throttle to ~30 fps if perf drops or when idle.

Matrix Ambient algorithm:
1. Precompute columns across viewport (columnWidth ~ 16–20 px @ dpr=1).
2. For each column, keep a head `y` position and a per-column speed = baseSpeed * random(0.9..1.1).
3. Each frame:
   - Clear with slight alpha (e.g., fillRect with rgba(0,0,0,0.05)) for a trailing effect or do full clear for crisp mode.
   - Draw 6–10 glyphs per active column: choose from a small glyph set (alnum + a few katakana-like). Use low globalAlpha (0.05–0.1).
   - Increment `y` by speed; wrap when beyond height.
4. Keep density low; leave large negative space so it reads as texture.
5. Constrain rendering to gutter rects if needed (left/right strips and top band) to avoid under text panels.

Robotic Control Grid algorithm:
1. Draw a subtle grid into an offscreen canvas once (lines every 24–32 px using --line-circuit).
2. Optionally overlay sparse circuit traces: thin cyan/teal lines with node dots, randomized seed, very low opacity.
3. For the scan sweep (if enabled and not reduced-motion):
   - Animate a faint vertical or diagonal gradient band across the screen every 10–20s.
   - Use CSS transform on a separate overlay or draw a low-cost opacity wave in canvas.
4. Keep everything low-contrast and sparse.

### Option B: Pure CSS (simpler, less flexible)
- Matrix Ambient:
  - Layer multiple background images with tiny repeating glyph tiles and a slow `background-position-y` animation.
  - Pros: zero JS; Cons: less control; potential tiling artifacts.
- Robotic Grid:
  - Use `repeating-linear-gradient` for grid lines.
  - Scan sweep via a semi-transparent pseudo-element moving across with `@keyframes`.

---

## Reduced Motion & Accessibility
- If `respectsReducedMotion` and `prefers-reduced-motion: reduce`, set `mode='none'` or render a non-animated static pattern.
- All animations must be low-amplitude and non-distracting by default.

---

## Performance Budget
- Idle CPU target < 2–3% on typical laptop CPU.
- Skip frames if last frame > 20ms (dynamic dt step or frame-skipping strategy).
- Pause the loop when the tab is hidden; resume on visibility change.
- Provide a `quality` prop to scale column count (matrix) or grid resolution.

---

## Integration & Switching
- Add `data-visual-mode` to `<body>`: `matrixAmbient | roboticGrid | none` to support CSS hooks.
- Expose a simple setting in the app’s preferences later (not MVP) that updates the `mode` prop/store.
- On switch, cross-fade opacity between modes over ~140ms to avoid abrupt changes.

DOM structure example (Vue):
```html
<div class="app-shell">
  <MatrixBackground :mode="visualMode" :enabled="true" />
  <TopBar />
  <main> ... </main>
</div>
```

---

## Developer Notes (Devon)
- Start with Canvas 2D; implement `matrixAmbient` first, then add `roboticGrid` after the API is stable.
- Provide a boolean `maskUnderPanels` that prevents drawing under known panel rects (optional; or rely on solid panels).
- Keep glyph set tiny; precompute glyph bitmaps for speed if needed.
- Ensure colors come from CSS variables; do not hardcode hex values.

---

## QA Checklist
- [ ] With both modes, chat text remains perfectly legible.
- [ ] Motion is subtle and not distracting; respects reduced motion.
- [ ] Perf stays within budget on idle.
- [ ] Switching modes cross-fades cleanly without flashes.
- [ ] Theme variables control colors consistently.
