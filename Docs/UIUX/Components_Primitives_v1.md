# Components — Primitives v1 (Chat-First)

Owner: Una (UI/UX Architect)
Status: Draft v0.1
Scope: Initial component set to deliver the chat-first dashboard in dark "Futuristic/Matrix" style using Vue 3 and Tailwind CSS.

Notes
- Map tokens from Theme_Tokens_Dark_Matrix.md to CSS variables and Tailwind utility classes (via Tailwind config).
- Keep components minimal and accessible; add sci-fi flavor via borders, subtle glows, and circuit-line dividers.

---

Component: AppShell
- Purpose: Provide the page frame (header + main container) with proper paddings and max widths.
- Anatomy: <header> TopBar; <main> centered container (max 1200px); optional StatusBar (deferred)
- Layout: Main content column width 720–960px; page padding var(--space-6)
- Behavior: Sticky TopBar; main scrolls; StatusBar placeholder hidden for MVP
- Style: bg.base page, bg.elevated header, 1px line.base divider under header

Component: TopBar
- Purpose: Global header with product identity and connectivity
- Anatomy: Left (Logo mark + CodeMaestro), Center (title "Dashboard" hidden on small), Right (ConnectivityChip, theme switch stub, avatar stub)
- States: Default; Compact (mobile)
- Behavior: No dropdowns in MVP; just static elements
- Style: bg.elevated; border-bottom: 1px solid var(--line-base); z-index var(--z-topbar)

Component: ConnectivityChip
- Purpose: Show backend online/offline status
- Anatomy: Tag/Pill with icon + label
- States: online (success), offline (danger), unknown (info)
- Behavior: Poll backend health periodically (frontend logic); Read-only in MVP
- Style: Pill/tag style using token colors; strong contrast on dark

Component: ChatMessageItem
- Purpose: Render a single chat message in the transcript
- Anatomy: Bubble (card-like), Meta row (avatar, timestamp)
- Alignment: User → right; Assistant → left
- States: Normal, Hover, Focus (for keyboard navigation), Error (send failure)
- Behavior: Markdown-lite (bold, inline code), monospace for code only
- Style (User): bg.layer; border-left: 2px solid var(--accent-primary); radius var(--radius-md)
- Style (Assistant): bg.elevated; subtle var(--glow-cyan) on hover/focus; radius var(--radius-md)
- Accessibility: Role=article; timestamp as aria-description; maintain readable color contrast
- Implementation: Simple div with utility classes

Component: ChatInputBar
- Purpose: Compose and send messages
- Anatomy: Multiline textarea + Primary Send button
- Keyboard: Enter = Send; Shift+Enter = newline; Esc = blur
- Validation: Empty → disabled; Max lines before scroll: 6
- Loading: Disable controls during in-flight (future)
- Style: Input on bg.layer; button primary with subtle glow on hover/focus
- Accessibility: Label via aria-label="Message"; button has aria-label="Send message"

Component: TypingIndicator (future-ready)
- Purpose: Show assistant typing state
- Anatomy: Three-dot pulse
- Style: Accent-primary with reduced opacity; respect prefers-reduced-motion
- Behavior: Appears inline as an assistant message when awaiting response

Component: StatusBar (placeholder)
- Purpose: Display read-only mode and run status tokens in MVP (later: interactive)
- Anatomy: Thin row under TopBar; compact tags (Plan/Act, Last result)
- Style: bg.layer; 1px border top & bottom in line.base; hidden in chat-only MVP

---

States & Interaction Summary
- Focus: Use var(--focus-ring) on focusable controls (buttons, inputs); ensure keyboard tab order is logical
- Hover: Subtle elevation or glow; avoid strong neon unless active/selected
- Disabled: Reduce opacity; maintain legible text

---

Token Usage Quick Reference
- Surfaces: --bg-base/page, --bg-elevated/cards, --bg-layer/inputs
- Text: --text-primary/main, --text-secondary/meta, --text-muted/auxiliary
- Lines: --line-base/dividers, --line-circuit/decorative hairlines
- Effects: --glow-cyan for active/focus states only

---

Acceptance for Handoff (Dev Ready)
- Each component above includes: purpose, anatomy, behavior, style, and accessibility notes sufficient to implement MVP chat screen.
