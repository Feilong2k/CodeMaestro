const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

// Basic CORS setup so the Vue dev server can talk to the backend during development
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());

// Simple health-check endpoint the frontend can call
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is reachable' });
});

// Only start the server if this file is run directly (not in tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
