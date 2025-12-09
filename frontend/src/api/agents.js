import client from './client.js'

export const getStatus = () => client.get('/agents/status')

export const chat = (message, mode = 'tactical', projectId = null) => 
  client.post('/agents/orion/chat', { message, mode, projectId })
