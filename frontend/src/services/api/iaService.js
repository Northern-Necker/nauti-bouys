import apiClient from './apiClient'

export const iaService = {
  // Send message to IA assistant
  sendMessage: async (message, sessionId = null) => {
    try {
      const response = await apiClient.post('/ia/chat', {
        message,
        sessionId
      })
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to send message'
      }
    }
  },

  // Start new chat session
  startSession: async (userId = null) => {
    try {
      const response = await apiClient.post('/ia/session', { userId })
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to start session'
      }
    }
  },

  // Get chat history
  getChatHistory: async (sessionId) => {
    try {
      const response = await apiClient.get(`/ia/history/${sessionId}`)
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch chat history'
      }
    }
  },

  // Get user's chat sessions
  getUserSessions: async (userId) => {
    try {
      const response = await apiClient.get(`/ia/sessions/${userId}`)
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch sessions'
      }
    }
  },

  // Process voice input
  processVoiceInput: async (audioBlob, sessionId) => {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob)
      formData.append('sessionId', sessionId)

      const response = await apiClient.post('/ia/voice', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to process voice input'
      }
    }
  },

  // Generate speech from text
  generateSpeech: async (text, voice = 'default') => {
    try {
      const response = await apiClient.post('/ia/speech', { text, voice }, {
        responseType: 'blob'
      })
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to generate speech'
      }
    }
  },

  // Get D-ID avatar configuration
  getAvatarConfig: async () => {
    try {
      const response = await apiClient.get('/ia/avatar/config')
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch avatar config'
      }
    }
  },

  // Submit feedback
  submitFeedback: async (sessionId, rating, feedback) => {
    try {
      const response = await apiClient.post('/ia/feedback', {
        sessionId,
        rating,
        feedback
      })
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to submit feedback'
      }
    }
  }
}