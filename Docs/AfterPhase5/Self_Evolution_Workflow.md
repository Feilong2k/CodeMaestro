# CodeMaestro Self-Evolution Workflow (Git-Ops Model)

**Goal:** How to safely upgrade the CodeMaestro system using itself, without breaking the live environment.

---

## 1. The Architecture

*   **Production (The "Live" Mind):** The active CodeMaestro instance hosted on Cloud (e.g., Render).
*   **The Repository (The Source of Truth):** GitHub/GitLab. All changes must pass through here.
*   **Local Mirror (The Sandbox):** Your local machine. Used for verification and final approval.
*   **Database (The Memory):** A managed PostgreSQL instance. Survives restarts and deployments.

---

## 2. The Upgrade Loop

### Step 1: The Request (Production)
You interact with the Live Orion.
*   **You:** "Orion, we need a new tool: `SlackTool` to send notifications."
*   **Orion:** Analyzes request, creates a plan.

### Step 2: The Isolation (Branching)
Orion does **not** edit live files directly.
*   **Action:** Orion creates a new branch: `feature/slack-tool` from `master`.
*   **Action:** Orion (via Devon) implements the code in a temporary workspace.
*   **Action:** Orion (via Tara) runs unit tests in the workspace.

### Step 3: The Proposal (Push)
Once tests pass (Green Phase):
*   **Orion:** Commits changes.
*   **Orion:** Pushes branch to Origin: `git push origin feature/slack-tool`.
*   **Orion:** Notifies you: "Feature implemented and pushed. Please verify."

### Step 4: The Verification (Local Mirror)
You pull the changes to your local machine to check them.
*   **You (Terminal):**
    ```bash
    git fetch
    git checkout feature/slack-tool
    npm run dev
    ```
*   **You:** Test the new `SlackTool` locally.
*   **Decision:**
    *   *Good?* Proceed to Step 5.
    *   *Bad?* Make edits locally OR tell Live Orion to fix it (Go back to Step 2).

### Step 5: The Evolution (Merge & Deploy)
*   **You:** Merge the branch.
    ```bash
    git checkout master
    git merge feature/slack-tool
    git push origin master
    ```
*   **Cloud Provider (Render):** Detects push to `master`.
    *   **Auto-Build:** Compiles the new code.
    *   **Auto-Deploy:** Replaces the old instance with the new one.

### Step 6: The Rebirth
*   The new CodeMaestro starts up.
*   It connects to the **same database**, preserving all projects, logs, and user context.
*   **Result:** You are now talking to Orion v1.1 who knows how to use Slack.

---

## 3. Safety Rules

1.  **Never Push to Master:** The AI should strictly be forbidden from pushing directly to `master`.
2.  **Database Migrations:**
    *   Migrations run on deploy.
    *   AI must ensure migrations are *additive* (don't break existing data).
3.  **The "Kill Switch":** If the AI deploys bad code that crashes the server:
    *   **You (Locally):** `git revert HEAD` -> `git push`.
    *   Render will deploy the previous working version automatically.

---

## 4. Context Preservation
*   **Code:** Stored in Git.
*   **Project/Task Data:** Stored in PostgreSQL.
*   **Personality/Habits:** Stored in `user_context` (in PostgreSQL).

This architecture ensures CodeMaestro can grow infinitely without ever losing its memory or stability.

