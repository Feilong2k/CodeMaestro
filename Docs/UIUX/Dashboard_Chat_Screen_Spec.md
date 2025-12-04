# Dashboard — Chat-First (Dark Futuristic/Matrix)

Owner: Una (UI/UX Architect)
Status: Draft v0.1
Scope: MVP-first screen with chat-only functionality initially; designed to expand with Activity and Status panels later without layout rework.

---

Page Name:
Dashboard — Chat-First

Purpose:
Provide a single place to converse with the agent, submit a brief, and (in later iterations) view activity and status. For the first cut, only the chatbox is interactive; all other regions are placeholders or omitted.

Target User:
- Primary: Solo developer/founder
- Secondary: PM/PO interested in quick planning handoff

Main Goal:
Enable the user to send a short brief/clarifications to the agent in a clean, readable interface that sets the visual tone for the product.

Layout Structure:
Header → Main (Chat Area) → Optional Status Bar (minimal) → Footer (none)

- Header (Top Bar):
  - Left: Logo mark (minimal), App name (CodeMaestro)
  - Center: Page title “Dashboard” (hidden on small screens)
  - Right: Connectivity indicator (Backend: Online/Offline), Theme switch (future), Profile/avatar stub
  - Style: bg.elevated with 1px line.base bottom border; z-index z.topbar

- Main (Chat Area):
  - Container width: max 1200px, centered; padding space-6
  - Chat transcript column (centered, column layout)
    - Message bubbles with role distinction
    - Timestamp (muted)
  - Chat input docked at bottom of the container (sticky within main, not viewport)

- Optional Status Bar (deferred for now):
  - A thin row under the header with current mode/status tokens (read-only at first)

- Footer: none in MVP

Components per section:
- Header:
  - TopBar (header container)
  - Icon: Simple glyph mark; Text: CodeMaestro
  - ConnectivityChip: shows Online/Offline state (tag/pill styled)

- Chat Transcript:
  - ChatMessageItem
    - Container (ElCard-like, custom styles):
      - User: right-aligned bubble, bg.layer, accent border on left (accent.primary at 2px), rounded radius.md
      - Assistant: left-aligned bubble, bg.elevated, subtle glow on hover/focus
      - Markdown minimal support for code spans and inline bold
    - Meta row: avatar (U/A), timestamp (text.muted)

- Chat Input:
  - ChatInputBar
    - ElInput (textarea autosize) + Send button (ElButton primary)
    - Keyboard: Enter to send; Shift+Enter newline
    - Disabled state while request in-flight (future)

Primary user flow:
1) User lands on Dashboard (dark theme, chat visible)
2) Types a brief in ChatInputBar and presses Enter or clicks Send
3) Message renders in transcript (user)
4) Assistant echoes a placeholder or calls backend (future); renders incoming message

Edge cases / error states:
- Backend offline: ConnectivityChip shows Offline (danger); Send disabled with tooltip “Backend unavailable”
- Empty send: prevent submission; show subtle validation message under input
- Long message (multi-line): textarea expands to max 6 lines then scrolls
- Loading indicator: show a small typing indicator bubble (assistant) during in-flight request (future)

Responsive notes:
- Desktop (≥1200px): centered column; transcript width ~720–960px
- Tablet (≥768px): padding reduced; header title hidden; components stacked similarly
- Mobile (<768px): full-width; reduced paddings; bubbles edge-to-edge with radius maintained
- All: maintain AA contrast; focus outlines visible; touch targets ≥44px

Optional enhancements:
- Background: subtle radial vignette + ultra-faint circuit-line grid using line.circuit
- Message bubble tails: none (keep geometry crisp)
- Quick actions (chips) under input for common prompts (future)

Suggested navigation pattern (for later phases):
- Top-level single-page with anchor regions (Chat | Activity | Status)
- Left sidebar may be introduced when multi-project/agent grows; for MVP chat-only, omit

Relationship to other parts of the app:
- Chat will post to /api/project and /api/plan endpoints later
- Activity/Status regions will appear adjacent to chat without changing the chat column width

Where it fits in the overall product journey:
- First screen post-login, immediately usable to produce a minimal plan via chat

Visual notes (Matrix/robotic flavor):
- Keep surfaces flat; apply glow.cyan only to active send button and focus rings
- Use line.circuit as ultra-light separators in header and (later) activity panel
- Avatars: round with subtle halo for assistant (cyan micro-glow)

Visual modes (switchable; see Visual_Modes_Matrix_vs_Robotic.md):
- matrixAmbient: faint glyph columns visible in gutters/top area; very low opacity; respects reduced-motion
- roboticGrid: subtle geometric grid + sparse circuit traces; optional slow scan sweep; reduced-motion disables sweep
