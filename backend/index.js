require('dotenv').config();
const express = require('express');
const cors = require('cors');
const subtasksRouter = require('./src/routes/subtasks');
const agentsRouter = require('./src/routes/agents');
const eventsRouter = require('./src/routes/events');
const { healthCheck } = require('./src/db/connection');
const socketService = require('./src/socket');

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

/**
 * Check database connection and log status
 */
async function checkDatabaseConnection() {
  console.log('Checking database connection...');
  try {
    const isHealthy = await healthCheck();
    if (isHealthy) {
      console.log('✅ Database connection successful');
    } else {
      console.warn('⚠️ Database connection check returned false');
    }
    return isHealthy;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Enhanced health endpoint with DB status
app.get('/api/health', async (req, res) => {
  try {
    const dbHealthy = await healthCheck();
    res.json({
      status: 'ok',
      message: 'Backend is reachable',
      database: dbHealthy ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      database: 'error',
      error: error.message
    });
  }
});

// Only start the server if this file is run directly (not in tests)
if (require.main === module) {
  // Check database connection on startup
  checkDatabaseConnection().then(dbHealthy => {
    if (!dbHealthy) {
      console.warn('⚠️ Starting server with database connection issues');
    }
    
    const server = app.listen(PORT, () => {
      console.log(`Backend listening on http://localhost:${PORT}`);
    });
    
    // Initialize Socket.IO
    socketService.init(server);
    console.log('WebSocket server initialized');
  }).catch(error => {
    console.error('Failed to check database connection:', error);
    // Still start the server even if DB check fails
    const server = app.listen(PORT, () => {
      console.log(`Backend listening on http://localhost:${PORT} (database check failed)`);
    });
    
    // Initialize Socket.IO even if DB failed
    socketService.init(server);
    console.log('WebSocket server initialized');
  });
}

module.exports = app;
