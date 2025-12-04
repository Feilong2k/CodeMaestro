# Accessibility & Motion Guidelines (Dark Futuristic/Matrix)

Owner: Una (UI/UX Architect)
Status: Draft v0.1
Scope: Accessibility and motion guidance for MVP chat-first dashboard using Vue 3 and Tailwind CSS.

---

## Accessibility

Color & Contrast
- Minimum AA contrast: 4.5:1 for text under 18px; 3:1 for ≥18px or bold
- Validate accent-on-dark contrast for all interactive states (hover/active/focus)
- Never rely on color alone for status; pair with icon or text label (e.g., Online)

Typography
- Base size fs.md (16px) for body; avoid <14px except metadata (fs.xs)
- Line-height lh.normal (1.5) for paragraphs; lh.tight (1.25) for UI labels

Keyboard & Focus
- All interactive controls must be reachable via Tab/Shift+Tab
- Visible focus ring: use --focus-ring; ensure sufficient contrast
- ChatInputBar: Enter=send, Shift+Enter=newline; Esc=blur input

ARIA & Semantics
- Chat transcript region: role="log" aria-live="polite"; new assistant messages announced
- Each ChatMessageItem: role="article"; timestamp available via aria-description
- Send button: aria-label="Send message"; input: aria-label="Message"

Error Handling
- Validation errors announced via aria-live; do not rely on color only
- Provide an inline hint under input for empty-submit attempts

Touch Targets
- Min 44x44px for buttons and key chips; adequate spacing on mobile

---

## Motion

General Principles
- Minimal motion; primary feedback via color/border/glow changes
- Use ease.standard and short durations; avoid bouncy or playful animations

Reduced Motion
- Honor prefers-reduced-motion: disable pulse/typing indicator animation; fade only

Micro-interactions
- Button hover: slight brightness or glow.cyan emphasis
- Focus: apply focus ring (no scale changes)
- TypingIndicator: 3-dot pulse at ~900ms cycle; replace with fade when reduced motion

Page Transitions
- None in MVP; if applied later, limit to opacity/translateY 8–12px, 140–220ms

---

## Testing Checklist (A11y)
- [ ] Keyboard navigation: all functions usable without mouse
- [ ] Focus order logical; no traps
- [ ] Contrast ratios pass AA on primary backgrounds
- [ ] aria-live announces new assistant messages
- [ ] Tooltips provide labels for disabled states (e.g., backend offline)
- [ ] Mobile hit areas ≥44px; spacing adequate
