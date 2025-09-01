import apiClient from './apiClient'
import { ConversationFlow, moodDetection, personalityModes } from '../../utils/conversationPatterns.js'
import { maritimeStories, educationalTopics } from '../../data/maritimeStories.js'
import BartenderGestureService from '../BartenderGestureService.js'

class ConversationService {
  constructor() {
    this.sessionId = null
    this.conversationHistory = []
    this.patronProfile = null
    this.emotionalState = null
    this.conversationFlow = new ConversationFlow()
    this.currentPersonality = 'seasoned_bartender'
    this.storytellingEnabled = true
    this.gestureService = BartenderGestureService
    this.gesturesEnabled = true
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

  // Generate contextual response with storytelling and mood adaptation
  async generateResponse(userMessage, context = {}) {
    try {
      // Generate enhanced response using conversation patterns
      let enhancedResponse = null
      if (this.storytellingEnabled) {
        enhancedResponse = this.conversationFlow.generateResponse(
          userMessage, 
          context.order || null
        )
      }

      const contextPayload = { 
        ...context,
        storytelling: this.storytellingEnabled,
        personality: this.currentPersonality,
        enhancedResponse: enhancedResponse
      }
      
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

      // Use enhanced response if available, fallback to API response
      const finalResponse = enhancedResponse || response.data.response

      // Store both user message and AI response
      await this.storeMessage(userMessage, 'user')
      await this.storeMessage(finalResponse, 'assistant', {
        confidence: response.data.confidence,
        recommendedActions: response.data.recommendedActions,
        storytellingUsed: !!enhancedResponse,
        detectedMood: this.conversationFlow.currentMood
      })

      // Trigger gesture if enabled
      if (this.gesturesEnabled) {
        this.handleGestureForMessage(finalResponse, 'assistant', {
          conversationContext: this.determineConversationContext(userMessage, finalResponse),
          confidence: response.data.confidence,
          actions: response.data.recommendedActions
        })
      }

      return {
        success: true,
        response: finalResponse,
        actions: response.data.recommendedActions,
        confidence: response.data.confidence,
        storytelling: !!enhancedResponse,
        mood: this.conversationFlow.currentMood
      }
    } catch (error) {
      console.error('Failed to generate response:', error)
      
      // Fallback to local storytelling if API fails
      if (this.storytellingEnabled) {
        const fallbackResponse = this.conversationFlow.generateResponse(
          userMessage, 
          context.order || null
        )
        
        return {
          success: true,
          response: fallbackResponse,
          fallback: true,
          storytelling: true,
          mood: this.conversationFlow.currentMood
        }
      }
      
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

  // Storytelling and personality management methods
  setPersonality(personalityType) {
    if (personalityModes[personalityType]) {
      this.currentPersonality = personalityType
      return { success: true, personality: personalityModes[personalityType] }
    }
    return { success: false, error: 'Invalid personality type' }
  }

  toggleStorytelling() {
    this.storytellingEnabled = !this.storytellingEnabled
    return { success: true, enabled: this.storytellingEnabled }
  }

  // Get available stories for current context
  getAvailableStories(category = null) {
    if (category) {
      return maritimeStories[category] || {}
    }
    return maritimeStories
  }

  // Get conversation flow status
  getConversationFlowStatus() {
    return {
      currentMood: this.conversationFlow.currentMood,
      topicsDiscussed: Array.from(this.conversationFlow.topicsDiscussed),
      conversationLength: this.conversationFlow.conversationHistory.length,
      context: this.conversationFlow.currentContext
    }
  }

  // Reset conversation flow (useful for new conversations)
  resetConversationFlow() {
    this.conversationFlow.resetConversation()
    return { success: true }
  }

  // Get mood-based recommendations
  getMoodBasedRecommendations(detectedMood = null) {
    const mood = detectedMood || this.conversationFlow.currentMood
    const structure = this.conversationFlow.getResponseStructure(mood)
    
    return {
      mood: mood,
      structure: structure,
      recommendedStories: this.getSuggestedStoriesForMood(mood),
      conversationStyle: structure.pacing
    }
  }

  // Get suggested stories for a specific mood
  getSuggestedStoriesForMood(mood) {
    const suggestions = []
    
    Object.entries(maritimeStories.cocktailOrigins).forEach(([key, story]) => {
      if (story.mood === mood && !this.conversationFlow.topicsDiscussed.has(key)) {
        suggestions.push({
          key: key,
          story: story,
          type: 'cocktailOrigin'
        })
      }
    })
    
    Object.entries(maritimeStories.navalTraditions).forEach(([key, story]) => {
      if (story.mood === mood && !this.conversationFlow.topicsDiscussed.has(key)) {
        suggestions.push({
          key: key,
          story: story,
          type: 'navalTradition'
        })
      }
    })
    
    return suggestions.slice(0, 3) // Return top 3 suggestions
  }

  // Determine conversation context for gesture selection
  determineConversationContext(userMessage, assistantResponse) {
    const userLower = userMessage.toLowerCase()
    const responseLower = assistantResponse.toLowerCase()
    
    // Context detection based on keywords
    if (userLower.includes('recommend') || responseLower.includes('suggest')) {
      return 'cocktail_recommendation'
    }
    if (userLower.includes('order') || responseLower.includes('perfect choice')) {
      return 'order_confirmation'
    }
    if (responseLower.includes('ingredient') || responseLower.includes('made with')) {
      return 'ingredient_explanation'
    }
    if (userLower.includes('hello') || userLower.includes('hi') || responseLower.includes('welcome')) {
      return 'greeting_customer'
    }
    if (responseLower.includes('great') || responseLower.includes('excellent')) {
      return 'positive_feedback'
    }
    if (responseLower.includes('pour') || responseLower.includes('mix') || responseLower.includes('shake')) {
      return 'bartending_action'
    }
    
    return 'general'
  }

  // Handle gesture triggering for messages
  handleGestureForMessage(messageContent, messageType, context = {}) {
    try {
      this.gestureService.handleConversationGesture(
        messageContent,
        messageType,
        {
          ...context,
          delay: 800, // Slight delay for natural timing
          duration: context.confidence > 0.8 ? 3.0 : 2.5 // Longer gestures for confident responses
        }
      )
    } catch (error) {
      console.error('Error handling gesture for message:', error)
    }
  }

  // Enable/disable gesture system
  setGesturesEnabled(enabled) {
    this.gesturesEnabled = enabled
    return { success: true, enabled: this.gesturesEnabled }
  }

  // Manually trigger a specific gesture
  triggerGesture(gestureName, options = {}) {
    if (!this.gesturesEnabled) {
      return { success: false, error: 'Gestures disabled' }
    }
    
    try {
      this.gestureService.playBartenderGesture(gestureName, options)
      return { success: true, gesture: gestureName }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Get gesture system status
  getGestureStatus() {
    return {
      enabled: this.gesturesEnabled,
      ...this.gestureService.getGestureStatus()
    }
  }

  // Get session status
  getSessionStatus() {
    return {
      sessionId: this.sessionId,
      isActive: !!this.sessionId,
      messageCount: this.conversationHistory.length,
      patronProfile: this.patronProfile,
      emotionalState: this.emotionalState,
      storytelling: {
        enabled: this.storytellingEnabled,
        personality: this.currentPersonality,
        conversationFlow: this.getConversationFlowStatus()
      },
      gestures: this.getGestureStatus()
    }
  }
}

export default new ConversationService()
