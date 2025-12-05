import axios from 'axios'

// Create axios instance with baseURL
const client = axios.create({
  baseURL: 'http://localhost:4000/api'
})

// Request interceptor for logging and error handling
client.interceptors.request.use(
  (config) => {
    // You can add auth headers or other request modifications here
    // For example: config.headers.Authorization = `Bearer ${token}`
    console.log(`Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`)
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
client.interceptors.response.use(
  (response) => {
    // Transform response data if needed
    return response
  },
  (error) => {
    // Handle different types of errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response error:', error.response.status, error.response.data)
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request)
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message)
    }
    return Promise.reject(error)
  }
)

export default client
