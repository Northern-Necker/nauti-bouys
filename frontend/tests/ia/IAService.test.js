import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { iaService } from '../../src/services/api/iaService'
import apiClient from '../../src/services/api/apiClient'

// Mock the apiClient
vi.mock('../../src/services/api/apiClient', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn()
  }
}))

describe('IAService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('sendMessage', () => {
    it('sends message successfully', async () => {
      const mockResponse = {
        data: {
          id: '123',
          message: 'Test response',
          sessionId: 'session-123'
        }
      }
      
      apiClient.post.mockResolvedValue(mockResponse)
      
      const result = await iaService.sendMessage('Hello', 'session-123')
      
      expect(apiClient.post).toHaveBeenCalledWith('/ia/chat', {
        message: 'Hello',
        sessionId: 'session-123'
      })
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data
      })
    })

    it('sends message without sessionId', async () => {
      const mockResponse = { data: { id: '123', message: 'Test response' } }
      apiClient.post.mockResolvedValue(mockResponse)
      
      const result = await iaService.sendMessage('Hello')
      
      expect(apiClient.post).toHaveBeenCalledWith('/ia/chat', {
        message: 'Hello',
        sessionId: null
      })
      
      expect(result.success).toBe(true)
    })

    it('handles send message error', async () => {
      const mockError = {
        response: {
          data: { message: 'Server error' }
        }
      }
      
      apiClient.post.mockRejectedValue(mockError)
      
      const result = await iaService.sendMessage('Hello')
      
      expect(result).toEqual({
        success: false,
        error: 'Server error'
      })
    })

    it('handles send message error without response data', async () => {
      const mockError = new Error('Network error')
      apiClient.post.mockRejectedValue(mockError)
      
      const result = await iaService.sendMessage('Hello')
      
      expect(result).toEqual({
        success: false,
        error: 'Failed to send message'
      })
    })
  })

  describe('startSession', () => {
    it('starts new session successfully', async () => {
      const mockResponse = {
        data: {
          sessionId: 'session-123',
          userId: 'user-456'
        }
      }
      
      apiClient.post.mockResolvedValue(mockResponse)
      
      const result = await iaService.startSession('user-456')
      
      expect(apiClient.post).toHaveBeenCalledWith('/ia/session', { userId: 'user-456' })
      expect(result).toEqual({
        success: true,
        data: mockResponse.data
      })
    })

    it('starts session without userId', async () => {
      const mockResponse = { data: { sessionId: 'session-123' } }
      apiClient.post.mockResolvedValue(mockResponse)
      
      const result = await iaService.startSession()
      
      expect(apiClient.post).toHaveBeenCalledWith('/ia/session', { userId: null })
      expect(result.success).toBe(true)
    })

    it('handles start session error', async () => {
      const mockError = {
        response: { data: { message: 'Unable to start session' } }
      }
      
      apiClient.post.mockRejectedValue(mockError)
      
      const result = await iaService.startSession()
      
      expect(result).toEqual({
        success: false,
        error: 'Unable to start session'
      })
    })
  })

  describe('getChatHistory', () => {
    it('fetches chat history successfully', async () => {
      const mockResponse = {
        data: {
          messages: [
            { id: 1, content: 'Hello', type: 'user' },
            { id: 2, content: 'Hi there!', type: 'ai' }
          ]
        }
      }
      
      apiClient.get.mockResolvedValue(mockResponse)
      
      const result = await iaService.getChatHistory('session-123')
      
      expect(apiClient.get).toHaveBeenCalledWith('/ia/history/session-123')
      expect(result).toEqual({
        success: true,
        data: mockResponse.data
      })
    })

    it('handles get chat history error', async () => {
      const mockError = {
        response: { data: { message: 'History not found' } }
      }
      
      apiClient.get.mockRejectedValue(mockError)
      
      const result = await iaService.getChatHistory('session-123')
      
      expect(result).toEqual({
        success: false,
        error: 'History not found'
      })
    })
  })

  describe('getUserSessions', () => {
    it('fetches user sessions successfully', async () => {
      const mockResponse = {
        data: {
          sessions: [
            { id: 'session-1', createdAt: '2023-01-01' },
            { id: 'session-2', createdAt: '2023-01-02' }
          ]
        }
      }
      
      apiClient.get.mockResolvedValue(mockResponse)
      
      const result = await iaService.getUserSessions('user-123')
      
      expect(apiClient.get).toHaveBeenCalledWith('/ia/sessions/user-123')
      expect(result).toEqual({
        success: true,
        data: mockResponse.data
      })
    })

    it('handles get user sessions error', async () => {
      const mockError = {
        response: { data: { message: 'User sessions not found' } }
      }
      
      apiClient.get.mockRejectedValue(mockError)
      
      const result = await iaService.getUserSessions('user-123')
      
      expect(result).toEqual({
        success: false,
        error: 'User sessions not found'
      })
    })
  })

  describe('processVoiceInput', () => {
    it('processes voice input successfully', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/wav' })
      const mockResponse = {
        data: {
          transcription: 'Hello, how are you?',
          response: 'I am doing well, thank you!'
        }
      }
      
      apiClient.post.mockResolvedValue(mockResponse)
      
      const result = await iaService.processVoiceInput(mockBlob, 'session-123')
      
      expect(apiClient.post).toHaveBeenCalledWith(
        '/ia/voice',
        expect.any(FormData),
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data
      })
      
      // Check FormData contents
      const formDataCall = apiClient.post.mock.calls[0][1]
      expect(formDataCall).toBeInstanceOf(FormData)
    })

    it('handles voice input processing error', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/wav' })
      const mockError = {
        response: { data: { message: 'Voice processing failed' } }
      }
      
      apiClient.post.mockRejectedValue(mockError)
      
      const result = await iaService.processVoiceInput(mockBlob, 'session-123')
      
      expect(result).toEqual({
        success: false,
        error: 'Voice processing failed'
      })
    })
  })

  describe('generateSpeech', () => {
    it('generates speech successfully', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/mp3' })
      
      apiClient.post.mockResolvedValue({
        data: mockBlob
      })
      
      const result = await iaService.generateSpeech('Hello world', 'female')
      
      expect(apiClient.post).toHaveBeenCalledWith(
        '/ia/speech',
        { text: 'Hello world', voice: 'female' },
        { responseType: 'blob' }
      )
      
      expect(result).toEqual({
        success: true,
        data: mockBlob
      })
    })

    it('generates speech with default voice', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/mp3' })
      apiClient.post.mockResolvedValue({ data: mockBlob })
      
      const result = await iaService.generateSpeech('Hello world')
      
      expect(apiClient.post).toHaveBeenCalledWith(
        '/ia/speech',
        { text: 'Hello world', voice: 'default' },
        { responseType: 'blob' }
      )
      
      expect(result.success).toBe(true)
    })

    it('handles speech generation error', async () => {
      const mockError = {
        response: { data: { message: 'Speech generation failed' } }
      }
      
      apiClient.post.mockRejectedValue(mockError)
      
      const result = await iaService.generateSpeech('Hello world')
      
      expect(result).toEqual({
        success: false,
        error: 'Speech generation failed'
      })
    })
  })

  describe('getAvatarConfig', () => {
    it('fetches avatar config successfully', async () => {
      const mockResponse = {
        data: {
          avatarId: 'avatar-123',
          animations: ['idle', 'speaking', 'listening']
        }
      }
      
      apiClient.get.mockResolvedValue(mockResponse)
      
      const result = await iaService.getAvatarConfig()
      
      expect(apiClient.get).toHaveBeenCalledWith('/ia/avatar/config')
      expect(result).toEqual({
        success: true,
        data: mockResponse.data
      })
    })

    it('handles avatar config fetch error', async () => {
      const mockError = {
        response: { data: { message: 'Avatar config not found' } }
      }
      
      apiClient.get.mockRejectedValue(mockError)
      
      const result = await iaService.getAvatarConfig()
      
      expect(result).toEqual({
        success: false,
        error: 'Avatar config not found'
      })
    })
  })

  describe('submitFeedback', () => {
    it('submits feedback successfully', async () => {
      const mockResponse = {
        data: {
          feedbackId: 'feedback-123',
          status: 'submitted'
        }
      }
      
      apiClient.post.mockResolvedValue(mockResponse)
      
      const result = await iaService.submitFeedback('session-123', 5, 'Great service!')
      
      expect(apiClient.post).toHaveBeenCalledWith('/ia/feedback', {
        sessionId: 'session-123',
        rating: 5,
        feedback: 'Great service!'
      })
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data
      })
    })

    it('handles feedback submission error', async () => {
      const mockError = {
        response: { data: { message: 'Failed to submit feedback' } }
      }
      
      apiClient.post.mockRejectedValue(mockError)
      
      const result = await iaService.submitFeedback('session-123', 3, 'Average')
      
      expect(result).toEqual({
        success: false,
        error: 'Failed to submit feedback'
      })
    })
  })

  describe('Error Handling Edge Cases', () => {
    it('handles network errors gracefully', async () => {
      const networkError = new Error('Network Error')
      networkError.code = 'NETWORK_ERROR'
      
      apiClient.post.mockRejectedValue(networkError)
      
      const result = await iaService.sendMessage('Hello')
      
      expect(result).toEqual({
        success: false,
        error: 'Failed to send message'
      })
    })

    it('handles timeout errors', async () => {
      const timeoutError = new Error('timeout of 5000ms exceeded')
      timeoutError.code = 'ECONNABORTED'
      
      apiClient.post.mockRejectedValue(timeoutError)
      
      const result = await iaService.sendMessage('Hello')
      
      expect(result).toEqual({
        success: false,
        error: 'Failed to send message'
      })
    })

    it('handles server errors without detailed message', async () => {
      const serverError = {
        response: {
          status: 500,
          data: {}
        }
      }
      
      apiClient.post.mockRejectedValue(serverError)
      
      const result = await iaService.sendMessage('Hello')
      
      expect(result).toEqual({
        success: false,
        error: 'Failed to send message'
      })
    })
  })
})