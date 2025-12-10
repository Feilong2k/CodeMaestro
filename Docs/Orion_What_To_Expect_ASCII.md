# Orion - What To Expect (Now That Built-ins Are Enabled)

This guide explains what you will see in chat and in the database with the current setup, plus simple commands you can try right away.

## 1) Chat (Orion) - Local Actions (No AI Key Required)
Orion can handle common, high-signal requests directly without calling an external LLM.

Try these messages in chat:
- list docs
  - Lists top-level files in `Docs/`
- read Docs/<file>
  - Returns the first ~1200 chars of the file contents (e.g., `read Docs/Phase6_Plan.md`)
- git status or which branch
  - Shows current branch/status via GitTool

Notes:
- Local router is enabled by default: `ORION_LOCAL_ROUTER=true`
- If you want to turn it off, set `ORION_LOCAL_ROUTER=false` and restart the backend.

## 2) Cleaner System Log (No Synthetic State Noise)
- Synthetic chat state events are disabled by default. You will not see fake OBSERVE/THINK/ACT lines in the System Log.
- If you ever need them back for debugging:
  - Set `ORION_EMIT_SYNTHETIC=true` and restart
  - Synthetic events are clearly labeled with `synthetic: true` and prefixed with `[synthetic] ...` in system messages

## 3) Database Logging (6-1) - Queued Path Only
- Only the queued AgentExecutor path writes transitions to the DB table `agent_fsm_log`.
- Chat does not write FSM transitions to the DB.

To verify quickly:
1. From repo root, run:
   ```bash
   node scripts/run-agent-executor-once.js
   ```
   - The runner auto-loads `backend/.env` for `DATABASE_URL`
   - It enqueues a demo task with a unique `subtaskId`
2. You will see rows like:
   - `OBSERVE -> THINK`
   - `THINK -> ACT`
   (If you wire a real tool call, you may also see `ACT -> VERIFY -> COMPLETE`.)

## 4) Environment Flags Summary
- `ORION_LOCAL_ROUTER=true|false`
  - Enables simple file/git actions in chat without an AI key (default: `true`)
- `ORION_EMIT_SYNTHETIC=true|false`
  - Controls synthetic chat state events (default: `false`)
- `ORION_VERBOSE_THOUGHTS=true|false`
  - Emits agent_action "thought" entries at OBSERVE/THINK/ACT/VERIFY/COMPLETE in System Log (default: `false`)
- `DATABASE_URL`
  - Used by the runner and backend to connect to Postgres

## 5) Troubleshooting
- "Orion says he can't read Docs": Use the exact phrases above (e.g., `list docs`, `read Docs/<file>`). The local router matches simple patterns and uses FileSystemTool/GitTool directly.
- If a file path is wrong: start with `list docs` to see the actual top-level files and use a matching path in `read Docs/...`.
- DB rows not appearing: remember only queued runs (AgentExecutor) write FSM rows. Use the runner.

## 6) Next Steps (optional)
- I can extend local intents to handle:
  - `list docs/<folder>`
  - `search docs for <term>`
  - `read <relative path>` with auto-suggestions

That's it - you can now read Docs and check git status directly from chat, and verify FSM logging via the runner without any external AI key.
