/*
 Seed a single consolidated WebSocket/UI telemetry pattern into the DB directly (bypassing the UI).
 - Reads Docs/pattern_websocket_telemetry_single.json (Title, Problem, Solution, Tags)
 - Inserts via backend/src/db/patterns.createPattern

 Usage (from repo root):
   node scripts/seed-websocket-pattern.js
*/

const path = require('path');
const fs = require('fs');

(async () => {
  try {
    const patternsDb = require('../backend/src/db/patterns');
    const payloadPath = path.resolve(__dirname, '../Docs/pattern_websocket_telemetry_single.json');

    let data;
    if (fs.existsSync(payloadPath)) {
      const raw = fs.readFileSync(payloadPath, 'utf8');
      data = JSON.parse(raw);
      console.log('[seed-websocket-pattern] Loaded payload from file:', payloadPath);
    } else {
      console.warn('[seed-websocket-pattern] Payload file not found, using embedded fallback.');
      data = {
        Title: 'WebSocket and UI Telemetry Patterns (system_message, state_change, agent_action, log_entry)',
        Problem:
          'We lacked a single, stable source of truth for how WebSocket events are emitted and rendered. System Log and Activity Log were inconsistent, making it hard for agents and tests to rely on event structure. We need one concise pattern that agents can reference to: (1) emit consistent event payloads across the app, (2) know which events belong to which UI surface (System Log vs Activity Log), (3) apply uniform formatting rules, and (4) keep tests deterministic with known contracts.',
        Solution:
          'Emit and render these four event types, with clear ownership and UI projections.\n\n1) system_message (for concise summaries and lifecycle)\n- Emit when: socket connect/disconnect, and notable Orion actions (e.g., “Orion: FileSystemTool.list completed (N items)”)\n- Shape: { timestamp, level, text }\n  • timestamp: HH:mm:ss or ISO\n  • level: info | warn | error\n  • text: concise, human-readable summary\n- UI: System Log displays text; Activity Log does not consume by default.\n\n2) state_change (FSM-like transitions)\n- Emit when:\n  • Queued tasks: AgentExecutor emits for OBSERVE→THINK→ACT→… transitions\n  • Chat path: OrionAgent emits synthetic transitions so users see the flow even without queue\n- Shape: { subtaskId, agent, from, to, timestamp }\n- UI: System Log formats as “{agent}: {from} → {to}”; Activity Log does not consume (keeps timeline concise).\n\n3) agent_action (narrative timeline)\n- Emit when: Orion changes activity (processing message, function_calls_detected, executing_function, function_result, replied)\n- Shape: { agent, action, status?, mode?, tool?, functionAction?, params?, result?, callId?, timestamp }\n  • mode: tactical | strategic\n- UI: Activity Log formats as “{agent}: {action} {tool}.{functionAction} [result]”, include “(mode)” if present; System Log may mirror for completeness.\n\n4) log_entry (generic backend log pipe)\n- Emit when: we need quick info/warn/error surfaced to UI without custom code\n- Shape: { level, message, text?, timestamp }\n- UI: System Log shows message and styles by level; Activity Log does not consume.\n\nUI Roles\n- System Log (middle panel): comprehensive telemetry stream (system_message, state_change, agent_action, log_entry) with the formatting above; can show everything.\n- Activity Log (right panel): concise narrative of agent_action + mode only (optimized for readability).\n\nExamples\n- system_message: { "timestamp": "14:20:50", "level": "info", "text": "WebSocket client connected: <id>" }\n- state_change: { "subtaskId": "chat", "agent": "Orion", "from": "THINK", "to": "ACT", "timestamp": "2025-12-09T19:36:33Z" }\n- agent_action: { "agent": "Orion", "action": "executing_function", "mode": "tactical", "tool": "FileSystemTool", "functionAction": "read", "timestamp": "2025-12-09T19:36:36Z" }\n- log_entry: { "level": "warn", "message": "Subtask 6-10 delayed", "timestamp": "2025-12-09T19:36:39Z" }\n',
        Tags: ['websocket', 'system_log', 'activity_log', 'fsm', 'projection', 'schema']
      };
    }

    const title = data.Title?.toString().trim();
    const problem = data.Problem?.toString().trim();
    const solution = data.Solution?.toString().trim();
    const tags = Array.isArray(data.Tags) ? data.Tags : [];

    if (!title || !solution) {
      throw new Error('Title and Solution are required for creating a pattern');
    }

    const toInsert = {
      title,
      description: 'Consolidated WebSocket and UI telemetry pattern for agents (system_message, state_change, agent_action, log_entry).',
      problem: problem || null,
      solution,
      type: 'schema',
      project_id: null,
      tags,
      metadata: {}
    };

    const created = await patternsDb.createPattern(toInsert);
    console.log('[seed-websocket-pattern] Created pattern:', {
      id: created.id,
      title: created.title,
      tags: created.tags,
      created_at: created.created_at
    });
    process.exit(0);
  } catch (err) {
    console.error('[seed-websocket-pattern] Failed:', err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
})();
