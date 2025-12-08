require('dotenv').config();
const { pool } = require('./src/db/connection');

async function dump() {
  const res = await pool.query("SELECT * FROM workflows WHERE name = 'Git Operations'");
  const wf = res.rows[0];
  console.log(JSON.stringify(wf, null, 2));
  process.exit(0);
}

dump();

