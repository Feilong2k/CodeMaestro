import client from './client.js'

export const list = () => client.get('/subtasks')

export const get = (id) => client.get(`/subtasks/${id}`)

export const update = (id, data) => client.put(`/subtasks/${id}`, data)
