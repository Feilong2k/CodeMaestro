const { Server } = require('socket.io');

class SocketServer {
  constructor() {
    this.io = null;
    this.clients = new Map(); // Map socketId -> { socket, subtaskRooms }
  }

  /**
   * Initialize Socket.IO server
   * @param {http.Server} httpServer - HTTP server instance
   * @returns {Server} Socket.IO server instance
   */
  init(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    this.setupEventHandlers();
    return this.io;
  }

  /**
   * Set up Socket.IO event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      this.clients.set(socket.id, { socket, subtaskRooms: new Set() });

      // Event handlers
      socket.on('state_change', (payload) => this.handleStateChange(socket, payload));
      socket.on('agent_action', (payload) => this.handleAgentAction(socket, payload));
      socket.on('log_entry', (payload) => this.handleLogEntry(socket, payload));
      socket.on('error', (payload) => this.handleError(socket, payload));
      socket.on('join_subtask', (subtaskId) => this.handleJoinSubtask(socket, subtaskId));
      socket.on('leave_subtask', (subtaskId) => this.handleLeaveSubtask(socket, subtaskId));
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }

  /**
   * Handle state change event
   * @param {Socket} socket - Socket instance
   * @param {Object} payload - Event payload
   */
  handleStateChange(socket, payload) {
    // Validate payload
    if (!payload.subtaskId || !payload.from || !payload.to) {
      socket.emit('error', { message: 'Invalid state_change payload' });
      return;
    }

    console.log(`State change: ${payload.subtaskId} from ${payload.from} to ${payload.to}`);
    
    // Broadcast to all clients
    this.io.emit('state_change', payload);
    
    // Also broadcast to subtask-specific room
    this.broadcastToSubtask(payload.subtaskId, 'state_change', payload);
  }

  /**
   * Handle agent action event
   * @param {Socket} socket - Socket instance
   * @param {Object} payload - Event payload
   */
  handleAgentAction(socket, payload) {
    if (!payload.agent || !payload.action) {
      socket.emit('error', { message: 'Invalid agent_action payload' });
      return;
    }

    console.log(`Agent action: ${payload.agent} - ${payload.action}`);
    this.io.emit('agent_action', payload);
  }

  /**
   * Handle log entry event
   * @param {Socket} socket - Socket instance
   * @param {Object} payload - Event payload
   */
  handleLogEntry(socket, payload) {
    if (!payload.level || !payload.message) {
      socket.emit('error', { message: 'Invalid log_entry payload' });
      return;
    }

    console.log(`Log [${payload.level}]: ${payload.message}`);
    this.io.emit('log_entry', payload);
  }

  /**
   * Handle error event
   * @param {Socket} socket - Socket instance
   * @param {Object} payload - Event payload
   */
  handleError(socket, payload) {
    console.error(`WebSocket error: ${payload.message || 'Unknown error'}`);
    this.io.emit('error', payload);
  }

  /**
   * Handle client joining a subtask room
   * @param {Socket} socket - Socket instance
   * @param {string} subtaskId - Subtask ID
   */
  handleJoinSubtask(socket, subtaskId) {
    const roomName = `subtask-${subtaskId}`;
    socket.join(roomName);
    
    const client = this.clients.get(socket.id);
    if (client) {
      client.subtaskRooms.add(roomName);
    }
    
    console.log(`Client ${socket.id} joined room ${roomName}`);
    socket.emit('joined_subtask', { subtaskId, room: roomName });
  }

  /**
   * Handle client leaving a subtask room
   * @param {Socket} socket - Socket instance
   * @param {string} subtaskId - Subtask ID
   */
  handleLeaveSubtask(socket, subtaskId) {
    const roomName = `subtask-${subtaskId}`;
    socket.leave(roomName);
    
    const client = this.clients.get(socket.id);
    if (client) {
      client.subtaskRooms.delete(roomName);
    }
    
    console.log(`Client ${socket.id} left room ${roomName}`);
    socket.emit('left_subtask', { subtaskId, room: roomName });
  }

  /**
   * Handle client disconnection
   * @param {Socket} socket - Socket instance
   */
  handleDisconnect(socket) {
    console.log(`Client disconnected: ${socket.id}`);
    this.clients.delete(socket.id);
  }

  /**
   * Broadcast event to all clients in a subtask room
   * @param {string} subtaskId - Subtask ID
   * @param {string} event - Event name
   * @param {Object} payload - Event payload
   */
  broadcastToSubtask(subtaskId, event, payload) {
    const roomName = `subtask-${subtaskId}`;
    this.io.to(roomName).emit(event, payload);
  }

  /**
   * Get all connected clients
   * @returns {Array} List of client information
   */
  getConnectedClients() {
    return Array.from(this.clients.entries()).map(([id, data]) => ({
      id,
      subtaskRooms: Array.from(data.subtaskRooms)
    }));
  }
}

// Singleton instance
const socketServer = new SocketServer();

// Export the singleton and the class
module.exports = {
  init: (httpServer) => socketServer.init(httpServer),
  getIO: () => socketServer.io,
  broadcastToSubtask: (subtaskId, event, payload) => socketServer.broadcastToSubtask(subtaskId, event, payload),
  getConnectedClients: () => socketServer.getConnectedClients(),
  SocketServer // for testing
};
