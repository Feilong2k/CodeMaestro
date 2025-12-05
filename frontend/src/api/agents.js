import client from './client.js'

export const getStatus = () => client.get('/agents/status')

export const chat = (message) => client.post('/agents/orion/chat', { message })
