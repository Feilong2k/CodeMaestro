require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

console.log('Testing connection to:', process.env.DATABASE_URL?.split('@')[1] || 'URL hidden');

client.connect()
  .then(() => {
    console.log('✅ Connection successful!');
    return client.query('SELECT NOW()');
  })
  .then(res => {
    console.log('Time from DB:', res.rows[0].now);
    return client.end();
  })
  .catch(err => {
    console.error('❌ Connection failed:', err);
    process.exit(1);
  });

