import client from './client.js'

export const classifyMessage = (message) => client.post('/router/classify', { message })

