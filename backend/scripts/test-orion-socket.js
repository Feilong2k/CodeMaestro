/*
 WebSocket + API harness to validate Orion chat events without the frontend.
 Requires backend running at http://localhost:4000

 Usage:
   node backend/scripts/test-orion-socket.js
*/
const http = require('http');
const { io } = require('socket.io-client');

function postJson(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      host: 'localhost',
      port: 4000,
      path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, res => {
      let text = '';
      res.on('data', chunk => text += chunk);
      res.on('end', () => resolve({ status: res.statusCode, text }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runCase(socket, name, message, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? 2000;
  const envThoughts = String(process.env.ORION_VERBOSE_THOUGHTS || 'false').toLowerCase() === 'true';
  const wantThoughts = Object.prototype.hasOwnProperty.call(opts, 'wantThoughts') ? !!opts.wantThoughts : envThoughts;

  const events = [];
  function onAgentAction(payload) { events.push({ type: 'agent_action', payload }); }
  function onSystemMessage(payload) { events.push({ type: 'system_message', payload }); }
  function onStateChange(payload) { events.push({ type: 'state_change', payload }); }

  socket.on('agent_action', onAgentAction);
  socket.on('system_message', onSystemMessage);
  socket.on('state_change', onStateChange);

  const start = Date.now();
  // Fire the API call after a short delay to ensure handlers are attached
  const apiPromise = postJson('/api/agents/orion/chat', { message });

  const result = await Promise.race([
    (async () => {
      const apiRes = await apiPromise;
      // keep listening a bit after HTTP returns
      await new Promise(r => setTimeout(r, 250));
      return { kind: 'api', apiRes };
    })(),
    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout waiting for API')), timeoutMs))
  ]).catch(e => ({ kind: 'api_error', error: e }));

  socket.off('agent_action', onAgentAction);
  socket.off('system_message', onSystemMessage);
  socket.off('state_change', onStateChange);

  // Assertions (simple, compact)
  let pass = true; const notes = [];
  if (result.kind !== 'api') {
    pass = false;
    notes.push(`API error: ${result.error?.message || 'unknown'}`);
  } else if (result.apiRes.status !== 200) {
    pass = false;
    notes.push(`HTTP ${result.apiRes.status}: ${result.apiRes.text}`);
  }

  // Look for executing_function -> function_result sequence on agent_action
  const aa = events.filter(e => e.type === 'agent_action').map(e => e.payload);
  const hasExec = aa.some(a => a.action === 'executing_function');
  const hasResult = aa.some(a => a.action === 'function_result');
  if (!hasExec || !hasResult) {
    pass = false;
    notes.push('Missing executing_function/function_result sequence');
  }

  if (wantThoughts) {
    const thoughts = aa.filter(a => a.action === 'thought').map(a => a.stage);
    const expected = ['OBSERVE', 'THINK', 'ACT', 'VERIFY', 'COMPLETE'];
    const missing = expected.filter(x => !thoughts.includes(x));
    if (missing.length) {
      pass = false;
      notes.push(`Missing thought stages: ${missing.join(', ')}`);
    }
  }

  const dur = Date.now() - start;
  return { name, pass, dur, notes, eventsCount: events.length };
}

(async () => {
  const socket = io('ws://localhost:4000', { transports: ['websocket'], timeout: 1500 });
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('socket connect timeout')), 1500);
    socket.on('connect', () => { clearTimeout(t); resolve(); });
    socket.on('connect_error', (e) => { clearTimeout(t); reject(e); });
  }).catch(e => { console.error('Socket connect failed:', e.message); process.exit(1); });

  const cases = [
    { name: 'list docs', msg: 'list docs' },
    { name: 'list docs/AfterPhase5', msg: 'list docs/AfterPhase5' },
    { name: 'read Phase5_Plan', msg: 'read Docs/Phase5_Plan.md' }
  ];

  const results = [];
  for (const c of cases) {
    try {
      const r = await runCase(socket, c.name, c.msg, { timeoutMs: 2500 });
      results.push(r);
      console.log(`CASE=${c.name} PASS=${r.pass} dur=${r.dur}ms events=${r.eventsCount}${r.notes.length ? ' notes=' + r.notes.join(' | ') : ''}`);
    } catch (e) {
      results.push({ name: c.name, pass: false, dur: 0, notes: [e.message], eventsCount: 0 });
      console.log(`CASE=${c.name} PASS=false error=${e.message}`);
    }
  }

  const ok = results.every(r => r.pass);
  socket.close();
  if (!ok) process.exit(1);
  console.log('All cases passed.');
})();
