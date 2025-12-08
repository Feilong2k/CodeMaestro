# AI Test Prompt: Git Checkout Error
# Give ONLY this file to the AI being tested

---

## Context

You are helping debug a git-related error in CodeMaestro, a multi-agent development platform.

The system uses multiple AI agents (Tara, Devon, Orion) that work on subtasks.
Each subtask is supposed to have its own branch.

Users are reporting this error when starting a new subtask:

```
ERROR: fatal: 'subtask/5-2-task-queue' is already checked out at 'C:/Coding/CM'
```

---

## The Code

```javascript
// backend/src/services/orchestrator.js
async function startSubtask(subtaskId) {
  const branchName = `subtask/${subtaskId}`;
  
  // Check if branch exists
  const branchExists = await git.branchExists(branchName);
  
  if (branchExists) {
    // Try to checkout existing branch
    await git.checkout(branchName);
  } else {
    // Create and checkout new branch
    await git.checkoutNewBranch(branchName);
  }
  
  // Continue with subtask setup...
}
```

---

## The Error

The error happens because:
1. The main CodeMaestro instance is already on branch `subtask/5-2-task-queue`
2. When a second process tries to checkout the same branch, Git blocks it
3. This is Git's safety feature to prevent two working directories from being on the same branch

---

## Your Task

How would you fix this error?

