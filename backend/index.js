const express = require('express');
const cors = require('cors');
const subtasksRouter = require('./src/routes/subtasks');
const agentsRouter = require('./src/routes/agents');
const eventsRouter = require('./src/routes/events');

const app = express();
const PORT = process.env.PORT || 4000;

// Basic CORS setup so the Vue dev server can talk to the backend during development
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// JSON parser with graceful invalid JSON handling
const jsonParser = express.json();
app.use((req, res, next) =>
  jsonParser(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
    return next();
  })
);

// Simple health-check endpoint the frontend can call
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is reachable' });
});

// Routes
app.use('/api/subtasks', subtasksRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/events', eventsRouter);

// Global JSON error handler (including body parser errors)
app.use((err, req, res, next) => {
  if (err) {
    const status = err.status || 400;
    return res.status(status).json({ error: err.message || 'Invalid request' });
  }
  return next();
});

// Only start the server if this file is run directly (not in tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
