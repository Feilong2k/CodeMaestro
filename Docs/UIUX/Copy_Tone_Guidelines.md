# Copy & Tone Guidelines (Dark Futuristic/Matrix)

Owner: Una (UI/UX Architect)
Status: Draft v0.1
Scope: Microcopy, labels, and message patterns for the MVP chat-first dashboard. Style balances clean SaaS clarity with a subtle “agent/Matrix” vibe.

---

## Principles
- Clear and concise: Prefer short, direct phrases over clever wording.
- Action-oriented: Buttons/state labels describe outcomes (Approve, Reject, Stop).
- Friendly, professional: No slang; avoid playful metaphors.
- Accessible by default: Avoid jargon; explain errors in one line with a next step.
- Consistent terminology: Plan Mode, Act Mode, Approve, Reject, Stop, Online/Offline.

Style
- Voice: Calm, helpful, confident.
- Tense: Present (“Generate files”, “Run tests”).
- Casing: Sentence case for UI labels/buttons; Title Case for panel headings.
- Numbers & time: Use plain numbers (e.g., “2 steps remaining”).

---

## Core Terminology (MVP)
- Plan Mode: Plan changes; no file writes.
- Act Mode: Execute actions (generate, test, commit).
- Approve / Reject: Confirm or discard the proposed change set.
- Stop: Cancel the current operation.
- Online / Offline: Backend availability state.
- Test passed / failed: Unit/Vitest results summary.

---

## Chat Screen Microcopy

Placeholders
- Chat input: “Describe your app idea or ask a question…”
- Chat input (alternate for brief): “Share a one‑line brief to get a minimal plan.”

Buttons
- Primary send: “Send”
- Disabled send (tooltip): “Backend unavailable” or “Enter a message to send”

System/Assistant Lines (examples)
- Greeting: “Hi! Share a short brief and I’ll propose a minimal plan.”
- After plan ready (future): “Plan ready. Switch to Act to generate files and tests.”
- Typing indicator (aria-label): “Assistant is typing”

Validation
- Empty message: “Enter a message before sending.”
- Too long (optional): “Message is too long. Try splitting into smaller parts.”

Connectivity
- Online chip: “Online”
- Offline chip: “Offline” (tooltip: “Backend not reachable. Retry shortly.”)

---

## Activity/Status Phrases (future-ready)
- Planning: “Creating a minimal plan…”
- Generate: “Generating files and tests…”
- Test pass: “Tests passed.”
- Test fail: “Tests failed. You can refine and retry.”
- Awaiting approval (plan): “Review and approve the plan to continue.”
- Awaiting approval (commit): “Approve to commit changes, or reject to discard.”
- Commit success: “Committed changes.”
- Stopped: “Operation stopped.”

---

## Error Message Pattern
Structure
- One-line summary + optional hint; avoid stack traces in UI.
Format
- “Action failed: <short reason>. <next step>.”
Examples
- “Plan failed: brief was empty. Add a short description and retry.”
- “File generation failed: working tree not clean. Commit or discard local changes, then retry.”
- “Tests failed: 1 suite red. Open the activity details for errors, then refine and retry.”
- “Git error: unable to commit. Check repository configuration and try again.”

---

## Tooltips & Helper Text
Buttons
- Approve: “Commit the current change set.”
- Reject: “Discard uncommitted changes.”
- Stop: “Cancel the current operation.”
Inputs
- Chat textarea: “Enter text. Press Enter to send, Shift+Enter for newline.”
Status Chips
- Plan Mode: “Plan and preview changes only.”
- Act Mode: “Execute actions that modify files and run tests.”

---

## Labels & Headings
Panels (future)
- Chat
- Activity
- Status
Headings
- “Dashboard” (top bar title)
- “Changed Files” (activity expansion)

---

## Accessibility Notes
- Announce new assistant messages via aria-live="polite".
- Always pair color with text for status messages.
- Prefer explicit labels over placeholders for critical actions.

---

## Internationalization Ready
- Keep strings short and unambiguous.
- Avoid idioms and culture-specific phrases.
- Punctuate consistently; avoid exclamation points unless celebrating success.

---

## Copy Checklist (MVP Chat)
- [ ] Chat input placeholder present and descriptive
- [ ] Send button labels and tooltips applied
- [ ] Offline tooltip shown when backend unreachable
- [ ] Validation hints for empty submit
- [ ] Accessibility attributes for live announcements and controls
