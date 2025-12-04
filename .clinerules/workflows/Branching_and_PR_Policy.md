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
    ```
  - *Why Squash?* Keeps `main` history clean (one commit per subtask).

---

## 4) Role Restrictions
- **Developers/Testers**: Commit to **subtask branches ONLY**. Never commit to `main`.
- **Architect/Orchestrator**: The ONLY role authorized to push to `main`.

---

## 5) Templates
- **Merge Request**: `.clinerules/workflows/templates/Merge_Request_Orion.md`
