import io from 'socket.io-client'

// Create socket connection
const socket = io('http://localhost:4000', {
  // Default options, can be extended
  transports: ['websocket', 'polling'],
  autoConnect: true
})

// Ensure the uri is set on the io property (for compatibility with tests)
if (!socket.io.uri) {
  socket.io.uri = 'http://localhost:4000'
}

export default socket
