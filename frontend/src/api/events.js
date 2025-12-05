import client from './client.js'

export const list = () => client.get('/events')
