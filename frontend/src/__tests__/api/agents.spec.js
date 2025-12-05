import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the client module
vi.mock('../../../src/api/client.js', () => {
  const mockClient = {
    get: vi.fn(),
    post: vi.fn()
  }
  return {
    default: mockClient
  }
})

describe('Agents API module', () => {
  let agents

  beforeEach(() => {
    vi.clearAllMocks()
    // Dynamically import the agents module (will fail because implementation doesn't exist)
    // This is expected to fail (Red state)
  })

  it('should export getStatus function that calls GET /api/agents/status', async () => {
    try {
      agents = await import('../../../src/api/agents.js')
    } catch (error) {
      // Expected failure - module doesn't exist yet
      expect(error).toBeDefined()
      return
    }

    const client = await import('../../../src/api/client.js')
    await agents.getStatus()
    expect(client.default.get).toHaveBeenCalledWith('/agents/status')
  })

  it('should export chat function that calls POST /api/agents/orion/chat', async () => {
    try {
      agents = await import('../../../src/api/agents.js')
    } catch (error) {
      expect(error).toBeDefined()
      return
    }

    const client = await import('../../../src/api/client.js')
    const testMessage = 'Hello, Orion!'
    await agents.chat(testMessage)
    expect(client.default.post).toHaveBeenCalledWith('/agents/orion/chat', { message: testMessage })
  })

  it('should handle timeout errors', async () => {
    try {
      agents = await import('../../../src/api/agents.js')
    } catch (error) {
      expect(error).toBeDefined()
      return
    }

    const client = await import('../../../src/api/client.js')
    // Mock a timeout error
    const timeoutError = new Error('timeout of 5000ms exceeded')
    timeoutError.code = 'ECONNABORTED'
    client.default.post.mockRejectedValue(timeoutError)

    await expect(agents.chat('test')).rejects.toThrow('timeout of 5000ms exceeded')
  })

  it('should handle 500 server errors', async () => {
    try {
      agents = await import('../../../src/api/agents.js')
    } catch (error) {
      expect(error).toBeDefined()
      return
    }

    const client = await import('../../../src/api/client.js')
    // Mock a 500 response
    const error500 = new Error('Request failed with status code 500')
    error500.response = { status: 500, data: { message: 'Internal server error' } }
    client.default.get.mockRejectedValue(error500)

    await expect(agents.getStatus()).rejects.toThrow('Request failed with status code 500')
  })

  it('should pass the correct request body for chat', async () => {
    try {
      agents = await import('../../../src/api/agents.js')
    } catch (error) {
      expect(error).toBeDefined()
      return
    }

    const client = await import('../../../src/api/client.js')
    const testMessage = 'Test message with special characters: !@#$%^&*()'
    await agents.chat(testMessage)
    expect(client.default.post).toHaveBeenCalledWith(
      '/agents/orion/chat',
      { message: testMessage }
    )
  })
})
