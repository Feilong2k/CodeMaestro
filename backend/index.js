const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

// Basic CORS setup so the Vue dev server can talk to the backend during development
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.use(express.json());

// Simple health-check endpoint the frontend can call
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is reachable' });
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
