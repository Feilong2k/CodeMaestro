# First Brain Tool Guide

This document captures the detailed examples, tool descriptions, and usage patterns discussed during the planning of the two‑tiered brain. It is intended as a reference for the first‑brain prompt and for developers implementing the UnifiedAdapter.

## Tool Overview

The first brain (UnifiedAdapter) will have access to the following tools. Each tool is described with its purpose, when to use it, and concrete examples of the thought process and JSON output.

## 1. FileSystemTool

### Current Capabilities
- `read(path)` – read the contents of a file.
- `write(path, content)` – create or overwrite a file.
- `list(path, recursive?)` – list files and directories.

### Planned Enhancements (Milestone 2)
- `search(path, pattern)` – grep‑like search across files.
- `fileTree(path, depth?)` – get a tree view of the directory structure.

### When to Use
- **Read**: When you need to examine the contents of a file to understand its implementation, configuration, or data.
- **Write**: When the user explicitly asks to create or modify a file, or when your plan requires writing a new file (e.g., generating a configuration, creating a component).
- **List**: When you need to explore the project structure to find relevant files or understand the layout.
- **Search**: When the user asks to find something in the codebase (e.g., “find all uses of `useFocus`”) or when you need to locate specific patterns.
- **FileTree**: When you need a broader view of the project hierarchy (e.g., to understand module organization).

### Examples

#### Example 1: Reading a File
**User**: “What’s in `src/components/ChatPanel.vue`?”
**Assistant’s Thought Process**:
```json
{
  "thought": "The user wants to see the contents of ChatPanel.vue. I'll read the file.",
  "action": "FileSystemTool.read",
  "parameters": { "path": "src/components/ChatPanel.vue" }
}
```

#### Example 2: Creating a File
**User**: “create a todo.md file with a list of tasks”
**Assistant’s Thought Process**:
```json
{
  "thought": "The user wants a new file called todo.md with a task list. I'll write the content using FileSystemTool.write.",
  "action": "FileSystemTool.write",
  "parameters": {
    "path": "todo.md",
    "content": "# Tasks\n- [ ] Item 1\n- [ ] Item 2"
  }
}
```

#### Example 3: Listing a Directory
**User**: “show me the files in the `Docs` folder”
**Assistant’s Thought Process**:
```json
{
  "thought": "The user wants to see what’s in the Docs folder. I'll list its contents.",
  "action": "FileSystemTool.list",
  "parameters": { "path": "Docs", "recursive": false }
}
```

## 2. GitTool

### Current Capabilities
- `status()` – show the working tree status.
- `diff()` – show changes between commits, commit and working tree, etc.
- `add(files?)` – add file contents to the index.
- `commit(message)` – commit the staged changes.
- `push(remote?, branch?)` – push commits to a remote repository.
- `pull(remote?, branch?)` – fetch and integrate from a remote repository.
- `branch(name?, create?)` – list, create, or delete branches.
- `log(options?)` – show commit logs.

### When to Use
- **Status**: When the user asks about the current git state or before making changes to see if the workspace is clean.
- **Diff**: When the user wants to see what has changed (or after you make changes, to show a diff).
- **Add/Commit/Push**: When the user asks to commit and push changes, or when your plan includes version‑control steps.
- **Branch**: When the user wants to create, switch, or list branches.
- **Log**: When the user wants to see the commit history.

### Examples

#### Example: Checking Git Status
**User**: “what’s the git status?”
**Assistant’s Thought Process**:
```json
{
  "thought": "The user wants to see the current git status. I'll call GitTool.status.",
  "action": "GitTool.status",
  "parameters": {}
}
```

## 3. ShellTool

### Current Capabilities
- `execute(command)` – run a shell command (whitelisted for safety).

### When to Use
- When the user asks to run a command (e.g., `npm install`, `docker compose up`, `ls`).
- When your plan requires executing build, test, or deployment scripts.
- **Caution**: Only use for commands that are safe and whitelisted. If a command is not whitelisted, consider explaining why you cannot run it.

### Example

#### Example: Running Tests
**User**: “run the tests”
**Assistant’s Thought Process**:
```json
{
  "thought": "The user wants to run the test suite. I'll use ShellTool.execute with the appropriate command.",
  "action": "ShellTool.execute",
  "parameters": { "command": "npm test" }
}
```

## 4. ProjectTool (Existing)

### Current Capabilities
- `getProjectInfo()` – retrieve project metadata (name, type, etc.).
- `getDependencies()` – list project dependencies.

### When to Use
- When you need to know the project type (Node, Python, etc.) or its dependencies to tailor your actions.

## 5. New Tool: consultArchitect (or validateManifest)

### Purpose
- Send a manifest (structured plan) to the second‑level brain for advisory analysis via the Constraint Discovery Protocol (Full v4).
- The second brain returns an advisory report (not a boolean) with constraints, gaps, and conditions.

### When to Use
- When the user’s request involves **architecture, security, scalability, or multi‑system design**.
- When the confidence‑driven router classifies the intent as `design/refactor` with high confidence (≥80%).
- **Do not use** for simple changes (single‑file edits, syntax fixes).

### Manifest Schema (Updated)
```json
{
  "intent": "string (e.g., 'Refactor chat panel for virtual scrolling')",
  "escalation_reason": "string (why this needs architectural review)",
  "risk_assessment": "Low|Medium|High – brief rationale",
  "files": [
    { "path": "string", "operation": "read|write|delete", "purpose": "string" }
  ],
  "dependencies": [ { "name": "string", "version": "string" } ],
  "approach": "string (high‑level description of the plan)",
  "context": {
    "relevantFileSnippets": ["..."],
    "conversationSummary": "string",
    "knownConstraints": []
  }
}
```

### Example

**User**: “Refactor the chat panel to use virtual scrolling and ensure accessibility.”
**Assistant’s Thought Process**:
```json
{
  "thought": "This is a design/refactor request with architectural and accessibility implications. I'll create a manifest and consult the architect.",
  "action": "consultArchitect",
  "parameters": {
    "manifest": {
      "intent": "Refactor ChatPanel.vue for virtual scrolling and accessibility",
      "escalation_reason": "Changes affect core UI component and accessibility standards",
      "risk_assessment": "Medium – may impact user experience if virtual scrolling breaks keyboard navigation",
      "files": [
        { "path": "src/components/ChatPanel.vue", "operation": "write", "purpose": "Implement virtual scroll and ARIA attributes" },
        { "path": "src/components/ChatPanel.vue", "operation": "read", "purpose": "Understand current structure" },
        { "path": "src/assets/styles/chat.css", "operation": "write", "purpose": "Update CSS for virtual scroll" }
      ],
      "dependencies": [ { "name": "vue‑virtual‑scroller", "version": "^3.0.0" } ],
      "approach": "Add a virtual‑scroll library, adjust the template, add accessibility roles, and update CSS.",
      "context": {
        "relevantFileSnippets": ["Current ChatPanel template snippet"],
        "conversationSummary": "User wants virtual scrolling and accessibility improvements.",
        "knownConstraints": ["Must support keyboard navigation", "Must maintain existing theme"]
      }
    }
  }
}
```

## 6. New Tool: displayDocument

### Purpose
- Send a document (Markdown, text, HTML) to the frontend’s **Orion’s Workspace** tab for rendering.
- Allows Orion to present generated documents (CDP reports, manifests, architecture diagrams) without cluttering the chat.

### When to Use
- After receiving an advisory report from the second brain, to present it to the user.
- When you generate a summary, plan, or any structured output that is better viewed as a document.
- When the user asks to “show me the plan” or “display the analysis”.

### Example

**After a consultation, Orion wants to show the CDP report**:
```json
{
  "thought": "I'll present the advisory report in the Workspace tab so the user can review it.",
  "action": "displayDocument",
  "parameters": {
    "title": "CDP Advisory Report: Chat Panel Refactor",
    "content": "# Constraint Discovery Report\n\n## Constraints Discovered\n- **Performance**: Virtual scrolling may impact initial load time.\n- **Accessibility**: Must ensure focus management for keyboard users.\n\n## Gaps\n- No rollback plan specified.\n\n## Conditions\n- If the library `vue‑virtual‑scroller` is compatible with Vue 3, then feasible.",
    "format": "markdown"
  }
}
```

## 7. Dynamic Context Sliding Window

### How It Works
- The first brain’s prompt includes a **static** core (identity, tool definitions, project overview) and a **dynamic** context window.
- The dynamic context contains:
  - Recent conversation turns (truncated to a token limit).
  - Snippets of files that have been explicitly read or referenced in the current session.
- When the agent needs more information about a file or directory, it **proactively uses `FileSystemTool.read`** to fetch the relevant content.
- This approach mimics an IDE: the agent sees only what it needs at each step, reducing token usage and allowing it to scale to large codebases.

### Example
**Scenario**: The user says “Update the chat component to use the new API.”  
**Agent’s Process**:
1. The agent first reads the chat component file to understand its current implementation.
2. It then reads the API definition file to see the new interface.
3. If it needs to know how the API is used elsewhere, it can search (`FileSystemTool.search`) for references.

**JSON Reasoning**:
```json
{
  "thought": "I need to understand the current chat component and the new API. I'll read the relevant files.",
  "action": "FileSystemTool.read",
  "parameters": { "path": "src/components/ChatPanel.vue" }
},
{
  "thought": "Now I need the new API definition.",
  "action": "FileSystemTool.read",
  "parameters": { "path": "src/api/chat.js" }
}
```

### Two‑Phase Delivery for Complex Requests
When a request requires architectural consultation (via `consultArchitect`), the first brain can provide immediate feedback while the advisory report is being generated:

1. **Preliminary Plan**: The first brain outputs a quick summary of the intended changes, based on its initial analysis.
2. **Background Consultation**: The manifest is sent to the strategic consultant in parallel.
3. **Advisory Update**: Once the advisory report is ready, it is displayed in the **Orion’s Workspace** tab as an update to the preliminary plan.

This keeps the user informed and engaged without waiting for the entire consultation to complete.

## 8. Router Logic & Clarification Prompts

### Intent Classification
- **Router** (lightweight classifier) analyzes the user’s message and returns:
  - `intent`: `"change"` (single‑file, syntax) or `"design/refactor"` (architectural, multi‑file).
  - `confidence`: 0‑100% (how sure the router is about the intent).

### Decision Logic
```
if intent == "change" and confidence >= 80%:
    → Proceed directly with Tier 1 (first brain) execution.
elif intent == "design/refactor" and confidence >= 80%:
    → Tier 1 creates a manifest → consultArchitect.
elif confidence < 80% and intent is identifiable:
    → Router asks first brain to generate a clarification question.
else (intent unidentifiable, confidence too low for both):
    → Router asks first brain to generate probing questions.
```

### Low‑Confidence Clarification (Intent Known)
When the router’s confidence is low (<80%) but an intent is assigned, it sends this prompt to the first brain:

```
The user said: “{user message}”
I think they want a {intent} but I’m only {confidence}% sure.
What single, concise question could I ask to clarify their intent and raise my confidence?
Respond with only the question.
```

**First Brain’s Expected Output**:
```json
{
  "clarification": "Your question here?"
}
```

**Example**:
- **User**: “make the chat panel better”
- **Router**: intent = `design/refactor`, confidence = 60%.
- **Prompt to first brain**: (as above)
- **First brain returns**:
```json
{
  "clarification": "What specific improvement would you like? (e.g., performance, UI, accessibility?)"
}
```

### Intent Unidentifiable
When the router cannot decide between `change` and `design/refactor` (confidence too low for both), it sends:

```
The user said: “{user message}”
I’m not sure whether they want a simple change or a larger design/refactor.
What one or two short questions could I ask to understand their intention?
Respond with a numbered list of questions.
```

**First Brain’s Expected Output**:
```json
{
  "questions": [
    "Are you asking for a small fix (like a typo) or a bigger redesign?",
    "Do you want me to modify a single file, or multiple files?"
  ]
}
```

### After Clarification
- The user answers the question(s).
- The router re‑runs classification on the **combined context** (original message + answer).
- If confidence now ≥ 80%, proceed with the appropriate path.
- If still low, repeat or escalate (e.g., ask the user to rephrase).

## Router Output Format

The lightweight router classifies the user’s message and returns:

```json
{
  "intent": "change|design/refactor",
  "confidence": 0.85,  // between 0 and 1
  "explanation": "Optional short explanation of why this intent was chosen"
}
```

This object is used by the system to decide the next step (direct execution, manifest creation, or clarification). It is also logged and can be included in the first brain’s context.

## JSON Reasoning Output Schema

Every response from the first brain should follow this structure:

```json
{
  "router": {
    "intent": "change|design/refactor",
    "confidence": 0.85,
    "explanation": "string (optional)"
  },
  "reasoning": [
    {
      "step": 1,
      "thought": "string describing the thought",
      "action": "ToolName.method (if a tool is called)",
      "parameters": { ... },
      "rationale": "string explaining why this action was chosen (optional but encouraged)"
    },
    ...
  ],
  "tool_calls": [ ... ],  // actual tool calls to execute (if any)
  "final_response": "string (the natural‑language response to the user, if any)",
  "clarification": "string (if a clarification question is needed)"
}
```

**Note**: The `router` field is optional and may be omitted if the router was not used (e.g., for explicit commands handled by the local router). When present, it provides visibility into the classification that led to the current reasoning.


## Summary of Tool‑Calling Principles

1. **Think step‑by‑step** – Always break down the request into logical steps.
2. **Use the right tool for the job** – Refer to the tool guide for when to use each tool.
3. **Ask when uncertain** – If the intent is unclear or confidence is low, generate a clarification question.
4. **Output reasoning** – Every thought and tool‑call decision must be captured in the JSON reasoning array.
5. **Present advisories, not gatekeepers** – The second brain’s report is advisory; the final decision rests with the human.
6. **Manage context dynamically** – Use the dynamic context sliding window to keep token usage low; read files as needed.
7. **Two‑phase delivery for complex tasks** – Provide a preliminary plan immediately, then update with the advisory report when ready.

---
*Document generated by Adam (Architect) on 2025‑12‑09. Last updated: 2025‑12‑10.*
