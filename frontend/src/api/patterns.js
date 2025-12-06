import client from './client'

export const search = (params) => {
  return client.get('/patterns', { params })
}

export const create = (data) => {
  return client.post('/patterns', data)
}

export const update = (id, data) => {
  return client.put(`/patterns/${id}`, data)
}

export const remove = (id) => {
  return client.delete(`/patterns/${id}`)
}
