# Phase 5.5: Stabilization & Context API

**Status:** Planned
**Goal:** Stabilize the "Infant" CodeMaestro (Phase 5) before moving to full Context Intelligence (Phase 6).
**Focus:** Fix hallucinations, path resolution issues, and enable manual context management.

---

## Overview
Phase 5.5 addresses critical usability issues identified by the Architect (Lei Wang).
1.  **Hallucinations:** Orion forces tool usage when not needed.
2.  **Path Resolution:** Orion fails with relative paths when no project is selected.
3.  **Missing Context API:** The backend service exists, but no API exposes it.

---

## Tasks

### Task 5-10: Stabilization (TacticalAdapter & Pathing)
**Priority:** 🔴 Critical
**Owner:** Devon (Impl) / Tara (Tests)
**Type:** Bug Fix

**Description:**
Refactor `TacticalAdapter.js` to remove keyword-based tool forcing. Update `OrionAgent.js` to inject a default `cwd` into the system prompt.

**Acceptance Criteria:**
- [ ] **Test (Tara):** "How do I create a file?" should NOT trigger a tool call.
- [ ] **Test (Tara):** `FileSystemTool` works with relative paths (e.g., `list_files .`) without an active project.
- [ ] **Impl (Devon):** Removed `tool_choice: 'required'` logic in `TacticalAdapter.js`.
- [ ] **Impl (Devon):** Added `Default Context` injection in `OrionAgent.js`.

---

### Task 5-11: Project Context API
**Priority:** 🔴 High
**Owner:** Devon (Impl) / Tara (Tests)
**Type:** Feature

**Description:**
Expose `ProjectContextService` via REST API to allow context inspection and management.

**Endpoints:**
- `GET /api/projects/:id/context` - Get full context object
- `POST /api/projects/:id/context` - Update specific keys (optional)

**Acceptance Criteria:**
- [ ] **Test (Tara):** Endpoint returns valid JSON context for an existing project.
- [ ] **Impl (Devon):** Routes added to `backend/src/routes/projects.js`.
- [ ] **Impl (Devon):** Connected to `ProjectContextService.buildContext()`.

---

## Execution Order
1.  **5-10:** Fix the "Brain" and "Eyes" first (Safety & Reliability).
2.  **5-11:** Enable the "Memory" API.
