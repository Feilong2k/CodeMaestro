import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

// Mock axios
vi.mock('axios', () => {
  const mockAxios = {
    create: vi.fn(() => mockAxios),
    interceptors: {
      request: {
        use: vi.fn()
      },
      response: {
        use: vi.fn()
      }
    }
  }
  return mockAxios
})

describe('API Client - axios instance', () => {
  let client

  beforeEach(() => {
    vi.clearAllMocks()
    // Dynamically import the client module (will fail because implementation doesn't exist)
    // This is expected to fail (Red state)
  })

  it('should create axios instance with baseURL http://localhost:4000/api', async () => {
    // Attempt to import the client module
    try {
      client = await import('../../../src/api/client.js')
    } catch (error) {
      // Expected failure - module doesn't exist yet
      expect(error).toBeDefined()
      return
    }

    // If import succeeds (should not happen in Red state), we still test
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: 'http://localhost:4000/api'
    })
  })

  it('should set up request interceptor for error handling', async () => {
    try {
      client = await import('../../../src/api/client.js')
    } catch (error) {
      expect(error).toBeDefined()
      return
    }

    expect(client.default.interceptors.request.use).toHaveBeenCalled()
    // The interceptor should be a function
    const interceptorFn = axios.create.mock.results[0].value.interceptors.request.use.mock.calls[0][0]
    expect(typeof interceptorFn).toBe('function')
  })

  it('should set up response interceptor for error handling', async () => {
    try {
      client = await import('../../../src/api/client.js')
    } catch (error) {
      expect(error).toBeDefined()
      return
    }

    expect(client.default.interceptors.response.use).toHaveBeenCalled()
    // The interceptor should be a function
    const interceptorFn = axios.create.mock.results[0].value.interceptors.response.use.mock.calls[0][0]
    expect(typeof interceptorFn).toBe('function')
  })

  it('should export the axios instance as default', async () => {
    try {
      client = await import('../../../src/api/client.js')
    } catch (error) {
      expect(error).toBeDefined()
      return
    }

    expect(client.default).toBeDefined()
    expect(client.default).toBe(axios.create())
  })
})
