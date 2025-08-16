import apiClient from './apiClient'

class ConversationService {
  constructor() {
    this.sessionId = null
    this.conversationHistory = []
    this.patronProfile = null
    this.emotionalState = null
  }

  // Summarize recent conversation messages
  summarizeConversation(limit = 10) {
    const recent = this.conversationHistory.slice(-limit)
    return recent.map(m => `${m.type}: ${m.message}`).join(' | ')
  }

  // Initialize conversation session with patron profiling
  async startSession(userId = null) {
    try {
      const response = await apiClient.post('/ia/session/start', {
        userId,
        timestamp: new Date().toISOString(),
        features: ['emotion_analysis', 'preference_learning', 'memory_persistence']
      })

      this.sessionId = response.data.sessionId
      this.patronProfile = response.data.patronProfile || {
        preferences: {},
        favoriteCategories: [],
        excludedIngredients: [],
        emotionalProfile: {},
        visitHistory: []
      }

      return {
        success: true,
        sessionId: this.sessionId,
        patronProfile: this.patronProfile
      }
    } catch (error) {
      console.error('Failed to start conversation session:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to start session'
      }
    }
  }

  // Store conversation message with context
  async storeMessage(message, type, metadata = {}) {
    const messageData = {
      sessionId: this.sessionId,
      message,
      type, // 'user' or 'assistant'
      timestamp: new Date().toISOString(),
      metadata: {
        emotionalState: this.emotionalState,
        ...metadata
      }
    }

    this.conversationHistory.push(messageData)

    try {
      await apiClient.post('/ia/conversation/store', messageData)
      return { success: true }
    } catch (error) {
      console.error('Failed to store message:', error)
      return { success: false }
    }
  }

  // Update patron's emotional state
  updateEmotionalState(emotionData) {
    this.emotionalState = {
      primary: emotionData.primary,
      confidence: emotionData.confidence,
      emotions: emotionData.emotions,
      timestamp: new Date().toISOString()
    }

    // Store emotional state update
    this.storeMessage(`Emotional state updated: ${emotionData.primary}`, 'system', {
      emotionAnalysis: emotionData
    })
  }

  // Learn and update patron preferences
  async updatePatronPreferences(preferences) {
    try {
      this.patronProfile.preferences = {
        ...this.patronProfile.preferences,
        ...preferences
      }

      const response = await apiClient.post('/ia/patron/preferences', {
        sessionId: this.sessionId,
        preferences: this.patronProfile.preferences,
        timestamp: new Date().toISOString()
      })

      return { success: true, data: response.data }
    } catch (error) {
      console.error('Failed to update patron preferences:', error)
      return { success: false, error: error.message }
    }
  }

  // Add favorite beverage
  async addFavoriteBeverage(beverage) {
    try {
      const response = await apiClient.post('/ia/patron/favorites/add', {
        sessionId: this.sessionId,
        beverage: {
          id: beverage.id,
          name: beverage.name,
          category: beverage.category,
          rating: beverage.rating || 5,
          timestamp: new Date().toISOString()
        }
      })

      if (!this.patronProfile.favoriteBeverages) {
        this.patronProfile.favoriteBeverages = []
      }
      this.patronProfile.favoriteBeverages.push(beverage)

      return { success: true, data: response.data }
    } catch (error) {
      console.error('Failed to add favorite beverage:', error)
      return { success: false, error: error.message }
    }
  }

  // Get conversation history
  async getConversationHistory(limit = 50) {
    try {
      const response = await apiClient.get(`/ia/conversation/history`, {
        params: {
          sessionId: this.sessionId,
          limit
        }
      })

      return { success: true, history: response.data.history }
    } catch (error) {
      console.error('Failed to fetch conversation history:', error)
      return { 
        success: false, 
        history: this.conversationHistory.slice(-limit) 
      }
    }
  }

  // Generate contextual response with patron profiling
  async generateResponse(userMessage, context = {}) {
    try {
      const contextPayload = { ...context }
      if (this.patronProfile) contextPayload.patronProfile = this.patronProfile
      if (this.emotionalState) contextPayload.emotionalState = this.emotionalState
      if (this.conversationHistory.length) {
        contextPayload.conversationSummary = this.summarizeConversation(10)
      }

      const response = await apiClient.post('/ia/chat/contextual', {
        message: userMessage,
        sessionId: this.sessionId,
        context: contextPayload
      })

      // Store both user message and AI response
      await this.storeMessage(userMessage, 'user')
      await this.storeMessage(response.data.response, 'assistant', {
        confidence: response.data.confidence,
        recommendedActions: response.data.recommendedActions
      })

      return {
        success: true,
        response: response.data.response,
        actions: response.data.recommendedActions,
        confidence: response.data.confidence
      }
    } catch (error) {
      console.error('Failed to generate response:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to generate response'
      }
    }
  }

  // Get personalized beverage recommendations
  async getPersonalizedRecommendations(context = {}) {
    try {
      const response = await apiClient.post('/ia/recommendations/personalized', {
        sessionId: this.sessionId,
        patronProfile: this.patronProfile,
        emotionalState: this.emotionalState,
        context: {
          occasion: context.occasion,
          mood: context.mood,
          timeOfDay: new Date().getHours(),
          ...context
        }
      })

      return {
        success: true,
        recommendations: response.data.recommendations,
        reasoning: response.data.reasoning
      }
    } catch (error) {
      console.error('Failed to get personalized recommendations:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // End session and save patron profile
  async endSession() {
    try {
      const response = await apiClient.post('/ia/session/end', {
        sessionId: this.sessionId,
        patronProfile: this.patronProfile,
        emotionalState: this.emotionalState,
        conversationSummary: {
          messageCount: this.conversationHistory.length,
          duration: this.calculateSessionDuration(),
          keyTopics: this.extractKeyTopics()
        }
      })

      return { success: true, data: response.data }
    } catch (error) {
      console.error('Failed to end session:', error)
      return { success: false, error: error.message }
    }
  }

  // Helper methods
  calculateSessionDuration() {
    if (this.conversationHistory.length < 2) return 0
    const start = new Date(this.conversationHistory[0].timestamp)
    const end = new Date(this.conversationHistory[this.conversationHistory.length - 1].timestamp)
    return end - start
  }

  extractKeyTopics() {
    // Simple keyword extraction from conversation
    const messages = this.conversationHistory
      .filter(m => m.type === 'user')
      .map(m => m.message.toLowerCase())
      .join(' ')

    const keywords = ['cocktail', 'wine', 'beer', 'spirit', 'recommendation', 'favorite', 'sweet', 'strong', 'light']
    return keywords.filter(keyword => messages.includes(keyword))
  }

  // Get session status
  getSessionStatus() {
    return {
      sessionId: this.sessionId,
      isActive: !!this.sessionId,
      messageCount: this.conversationHistory.length,
      patronProfile: this.patronProfile,
      emotionalState: this.emotionalState
    }
  }
}

export default new ConversationService()
