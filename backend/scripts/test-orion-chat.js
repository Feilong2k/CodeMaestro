/*
 Simple API harness to exercise Orion chat + System Log in dev.
 Usage:
   node backend/scripts/test-orion-chat.js
*/
const http = require('http');

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

(async () => {
  try {
    const cases = [
      { message: 'list docs' },
      { message: 'list docs/AfterPhase5' },
      { message: 'read Docs/Phase5_Plan.md' },
      { message: 'read Docs:Phase5_Plan.md' }
    ];

    for (const c of cases) {
      const r = await postJson('/api/agents/orion/chat', c);
      console.log(`\nCASE: ${c.message}`);
      console.log('STATUS:', r.status);
      console.log(r.text);
    }
    console.log('\nDone.');
  } catch (e) {
    console.error('Harness failed:', e.message);
    process.exit(1);
  }
})();
