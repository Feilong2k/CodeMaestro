# Branching & PR Policy (MVP)

Status: Adopted
Owner: Orion (Orchestrator)
Scope: All code changes for tasks/subtasks; applies to frontend and backend
Related: .clinerules/workflows/General_Workflows.md, .clinerules/workflows/Test_Workflows.md

---

## 1) Guiding Principles
- **One Subtask = One Branch = One PR**.
- Tests must be green (verified by Tara) before merge.
- Orchestrator (Orion) executes the merge; Human approves.

---

## 2) Branching Protocol (Phase A - MVP)

### Branch Naming
Use folders for organization: `subtask/<id>-<slug>`
- Example: `subtask/2-1-4-deepseek-adapter`
- Example: `subtask/2-2-8-markdown-rendering`

### Creating a Branch (Devon/Tara)
1. **Fresh Start**: Always branch from up-to-date `main`.
   ```bash
   git checkout main
   git pull origin main
   git checkout -b subtask/<id>-<slug>
   ```
2. **Syncing**: If `main` changes while you work, merge it in locally to resolve conflicts *before* asking for a PR.

### Committing
- **Devon**: Commits implementation changes.
- **Tara**: Commits test artifacts.
- **Orion**: Does NOT commit code (only merge commits).

### Commit After Each Phase (REQUIRED)

Agents MUST commit after completing each TDD phase so changes are visible across worktrees:

| Phase | Who | Commit Message |
|-------|-----|----------------|
| Red (tests written) | Tara | `test: add failing tests for <subtask>` |
| Green (tests pass) | Devon | `feat: implement <subtask>` |
| Refactor | Devon | `refactor: cleanup <subtask>` |
| Verify | Tara | `test: verify <subtask> complete` |

**Example:**
```bash
git add .
git commit -m "feat: implement 3-1 API client"
```

**Why?** Worktrees share the repo but NOT uncommitted changes. Orion can only see committed updates.

---

## 3) PR & Merge Workflow

### Step 1: Open PR (Devon)
- Push the branch: `git push origin subtask/...`
- Create PR (or signal readiness in chat).
- **Body Requirement**: Must include the **PR Checklist** from the subtask log.

### Step 2: Verification (Tara)
- Runs final verification suite.
- Posts `TestReport` (Pass/Fail).

### Step 3: Merge (Orion + Human)
- **Condition**: 
  1. Tara's Report is ✅ GREEN.
  2. Checklist is complete (Dev + Tara items).
- **Action**: Orion presents the **Merge Request Report** (template below).
- **Execution**:
  - Human says "Approve".
  - Orion runs:
    ```bash
    git checkout main
    git merge --squash subtask/<id>-<slug>
    git commit -m "feat: complete subtask <id> (<slug>)"
    git push origin main
    git branch -d subtask/<id>-<slug>
    ```
  - *Why Squash?* Keeps `main` history clean (one commit per subtask).
  - *Why Delete Branch?* Keeps `git branch` output clean. Commits are preserved in main.

---

## 4) Role Restrictions
- **Developers/Testers**: Commit to **subtask branches ONLY**. Never commit to `main`.
- **Architect/Orchestrator**: The ONLY role authorized to push to `main`.

---

## 5) Git Worktrees (Multi-Agent Parallel Work)

### Why Worktrees?

When multiple agents (Tara, Devon) work in parallel, they need **separate working directories** but share the **same repository**. Git worktrees solve this:

- **Problem**: Git branches are repo-wide. If Tara switches to branch 3-2, Devon is also on 3-2.
- **Solution**: Each agent gets their own folder (worktree), each on a different branch.

### Architecture

```
C:\Coding\CM\              ← Main repo (Orion uses this, contains .git)
C:\Coding\CM-tara\         ← Worktree for Tara
C:\Coding\CM-devon\        ← Worktree for Devon
```

All worktrees share the same `.git` — commits from any folder go to the same repo.

### Setup Commands

**Create worktree for Tara:**
```powershell
cd C:\Coding\CM
git worktree add ../CM-tara subtask/3-2-websocket-client
```

**Create worktree for Devon:**
```powershell
cd C:\Coding\CM
git worktree add ../CM-devon subtask/3-1-api-client-setup
```

### Switching Branches in a Worktree

```powershell
cd C:\Coding\CM-tara
git checkout subtask/3-3-pinia-store-tasks
```

### Listing Worktrees

```powershell
git worktree list
# Output:
# C:/Coding/CM        abc1234 [master]
# C:/Coding/CM-tara   def5678 [subtask/3-2-websocket-client]
# C:/Coding/CM-devon  ghi9012 [subtask/3-1-api-client-setup]
```

### Removing a Worktree (When Agent Done)

```powershell
git worktree remove ../CM-tara
```

### Troubleshooting Worktrees

**Problem: "fatal: not a git repository" in worktree**

This happens when:
- Worktree removal was interrupted
- Worktree became corrupted
- `.git` file in worktree is broken

**Solution:**

```powershell
# Step 1: From MAIN repo, check worktree status
cd C:\Coding\CM
git worktree list

# Step 2: If worktree shows "prunable", clean it up
git worktree prune

# Step 3: Close any VSCode/editors using the broken worktree folder

# Step 4: Delete the broken worktree folder
Remove-Item -Recurse -Force C:\Coding\CM-devon

# Step 5: Recreate the worktree on the correct branch
git worktree add ../CM-devon subtask/3-2-websocket-client

# Step 6: Agent can now open VSCode in the new worktree
```

**⚠️ IMPORTANT FOR AGENTS:**
- If `git status` fails with "not a git repository" — **STOP**
- Do NOT try to fix it yourself (no `git init`, no random commands)
- Report to Orion: "Worktree broken, need recreation"
- Orion will fix from main repo

### Syncing Worktree with Master

If agent's worktree is missing files from master (e.g., new logs):

**Agent reports:** "Missing Phase 3 logs in my worktree"

**Orion runs:**
```powershell
cd C:\Coding\CM-<agent>
git merge master -m "merge: sync with master"
```

Agents should NOT run merge commands themselves — Orion handles all git syncs.

### Rules

| Rule | Description |
|------|-------------|
| **One branch per worktree** | A branch can only be checked out in ONE worktree at a time |
| **Main repo = Orion** | Orion uses the main folder for merges and orchestration |
| **Agent folders** | Each agent (Tara, Devon) gets their own worktree folder |
| **Merges in main** | All merges happen in the main repo folder |

### Space Efficiency

| Setup | Space Used |
|-------|------------|
| 6 full clones | ~3 GB |
| 1 repo + 5 worktrees | ~750 MB |

Worktrees only duplicate working files, NOT the `.git` history.

---

## 6) Templates
- **Merge Request**: `.clinerules/workflows/templates/Merge_Request_Orion.md`
