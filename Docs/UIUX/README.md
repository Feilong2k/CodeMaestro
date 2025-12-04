# CodeMaestro UI/UX — Dark “Futuristic/Matrix” Direction (Una)

Owner: Una (UI/UX Architect)
Status: Draft (ready for implementation guidance)
Scope: MVP single-page dashboard with chatbox first, dark-mode-first, clean + robotic/futuristic feel with subtle Matrix influence.

This folder contains the UI/UX specifications and guidance used to style and compose the MVP dashboard (chat-first). It prioritizes clarity, low cognitive load, and modern SaaS ergonomics while incorporating a subtle Matrix/agent aesthetic.

Documents
- Theme and Tokens: Theme_Tokens_Dark_Matrix.md
- Dashboard (Chat-First) Spec: Dashboard_Chat_Screen_Spec.md
- Components (Initial Set): Components_Primitives_v1.md
- Accessibility & Motion: A11y_Motion_Guidelines.md
- Copy & Tone (microcopy): Copy_Tone_Guidelines.md

Design Principles
- Clean first, “futuristic/robotic” as flavor
- Dark-mode-first, legible on standard monitors (not pitch black)
- Minimal glow, restrained gradients, crisp geometry
- Strong visual hierarchy, generous spacing, accessible contrasts
- Familiar component behavior (buttons, dropdowns, dialogs behave as users expect)

Matrix/Agent Flavor (subtle)
- Accents use electric-cyan/teal hues with minimal neon glow
- Optional faint “circuit-line” separators / borders in panels
- Monospace for logs/code only; sans-serif elsewhere
- Sparse sci-fi micro-ornaments (icons/indicators) only where helpful

Implementation Notes (dev-facing)
- Base stack: Vue 3 + Tailwind CSS
- Token-first approach: map design tokens to CSS variables and Tailwind utility classes
- Support future light mode by inverting surfaces and reusing tokens

Next Steps
- Start with Dashboard_Chat_Screen_Spec.md to wire the screen layout
- Apply Theme_Tokens_Dark_Matrix.md tokens via Tailwind config and CSS variables
- Build only the chat panel + top bar initially, defer other panels

Change Log
- v0.1: Initial draft folder and index
