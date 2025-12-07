# System Assumptions & Physical Constraints

**Status:** Living Document
**Purpose:** Track the "Physics" of our environment to prevent hidden logic bugs.

---

## 1. Global Constraints (The "Physics")

| Resource | Constraint | Risk | Mitigation |
| :--- | :--- | :--- | :--- |
| **Git Repository** | Single `index.lock` file per repo | Concurrent Git commands crash | Serialized execution (Orion Queue) |
| **File System** | Non-atomic writes on Windows | Read-Modify-Write race conditions | File Locks or Single Writer |
| **Database** | Transaction Isolation Levels | Dirty reads / Lost updates | Explicit `FOR UPDATE` locks |
| **Network Ports** | Single listener per port | "EADDRINUSE" crashes | Check port before start |
| **LLM Context** | Finite Token Window | "Context Length Exceeded" | Pruning (Phase 4-11) |

---

## 2. Verified Assumptions (Things we checked)

*   [x] **Worktrees share `.git`:** TRUE. Branches are visible to all worktrees immediately.
*   [x] **Git Merge is atomic:** FALSE. It involves multiple file writes. Needs locking.
*   [x] **Node.js Single Thread:** TRUE. In-memory state is safe from *thread* races, but not *async* races.

## 3. Dangerous Assumptions (Things to avoid)

*   [ ] "Agent A is done, so Agent B can start." -> FALSE. Agent A might be done logic, but Git lock still held.
*   [ ] "I can delete this folder." -> FALSE. Windows file locking might block deletion if a terminal is open in it.
*   [ ] "The Database is always up." -> FALSE. Connection pool might timeout.

---

## 4. Phase Zero Checklist (Run before ANY new feature)

1.  **Atomic Actions:** List every disk/net/db touch.
2.  **Resource Map:** What does it touch?
3.  **Physics Check:** Is that resource infinite? Shared? Locked?
4.  **Toy Test:** Script a tiny failure case.

