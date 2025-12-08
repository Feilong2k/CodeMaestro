# Phase 5 Batch 1: Factory Acceptance Checklist

**Goal:** Verify the new "Hands" of CodeMaestro (Tools, Safety, Projects, Memory) are functional and safe.

---

## 1. Tool Registry & Safety (5-1)

### A. Core Registry
- [ ] **Orion's Toolbox:** Ask Orion `list tools`. Verify he sees `database_tool`, `git_tool`, `filesystem_tool`.
- [ ] **Devon's Toolbox:** Switch to Devon context (if possible) or check logs. Ensure he **cannot** see `database_tool`.
- [ ] **Tara's Toolbox:** Ensure she has read access to `src` but write access only to `tests`.

### B. Safety Constraints (The "Red Button" Test)
- [ ] **Path Traversal:** Ask Orion/Devon to `read_file("../../../windows/system32/drivers/etc/hosts")`.
    *   *Expected Result:* Error "Access Denied: Path outside project root."
- [ ] **Command Injection:** Ask Orion/Devon to `git commit -m 'fix'; rm -rf /`.
    *   *Expected Result:* Error "Command Rejected: Illegal characters or blocked command."
- [ ] **Blocked Commands:** Try to run `curl google.com`.
    *   *Expected Result:* Error "Command 'curl' is not whitelisted."

### C. Git Safety
- [ ] **Status Check:** Run `git status` via the tool. Should return JSON status.
- [ ] **Commit:** Stage a dummy file and commit. Should succeed.

---

## 2. Project Management (5-5)

### A. Lifecycle
- [ ] **Create:** Ask Orion: "Create a new project called 'Test-Project-Alpha' with description 'Sandbox test'".
    *   *Verify:*
        1.  Folder `projects/Test-Project-Alpha` exists.
        2.  DB Query `SELECT * FROM projects WHERE name='Test-Project-Alpha'` returns 1 row.
- [ ] **List:** Ask Orion: "List all active projects".
    *   *Verify:* 'Test-Project-Alpha' appears in the list.
- [ ] **Delete (Soft):** Ask Orion: "Delete 'Test-Project-Alpha'".
    *   *Verify:*
        1.  Folder might still exist (safety) or be moved to archive.
        2.  DB Query `SELECT status FROM projects...` returns `'deleted'`.
        3.  List command **no longer shows** it.

---

## 3. Feature Backlog & Memory (5-9)

### A. The "Mind Upload"
- [ ] **Context Check:** Ask Orion: "What is your role and what are my preferences?"
    *   *Expected Result:* He should quote the `user_context.json` data (e.g., "I am the Orchestrator, you are the Architect. You prefer TDD and no && chains.").
    *   *Tech Check:* `SELECT * FROM memories WHERE type='user_context'` returns data.

### B. The Roadmap
- [ ] **UI Check:** Navigate to `/features` in the Dashboard.
    *   *Verify:* You see the "Future Features" list (e.g., "AI Council").
- [ ] **Search:** Type "Harvesting" in the search bar.
    *   *Verify:* The list filters to show "Pattern Library & Harvesting".

---

## 4. Workflow Integration (Logic Test)

### A. The "Hello World" Task
- [ ] **Trigger:** Create a subtask "5-X Test Task".
- [ ] **State Transition:** Move it from `pending` -> `in_progress`.
- [ ] **Locking:** Verify in DB `locks` table that the agent working on it has a lock.

---

## 5. System Health
- [ ] **Logs:** Check `Agents/Subtasks/Logs/FlightRecorder.log` (or equivalent).
    *   *Verify:* Actions are logged with timestamps and roles.
- [ ] **Performance:** Dashboard loads in < 1s.

