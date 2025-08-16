import { useState, useRef, useEffect } from 'react'
import { Send, Mic, MicOff, RotateCcw, Heart, Brain, Star, TrendingUp, MessageSquare } from 'lucide-react'
import EnhancedIAAvatar from '../components/common/EnhancedIAAvatar'
import conversationService from '../services/api/conversationService'
import { beverageService } from '../services/api/beverageService'

const EnhancedIAPage = () => {
  // State management
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionActive, setSessionActive] = useState(false)
  const [patronProfile, setPatronProfile] = useState(null)
  const [currentEmotion, setCurrentEmotion] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [conversationInsights, setConversationInsights] = useState(null)
  
  const messagesEndRef = useRef(null)
  const sessionIdRef = useRef(null)

  // Initialize session on component mount
  useEffect(() => {
    initializeSession()
    return () => {
      if (sessionIdRef.current) {
        handleEndSession()
      }
    }
  }, [])

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const initializeSession = async () => {
    try {
      const result = await conversationService.startSession()
      if (result.success) {
        setSessionActive(true)
        setPatronProfile(result.patronProfile)
        sessionIdRef.current = result.sessionId
        
        // Add welcome message
        setMessages([{
          id: 1,
          type: 'assistant',
          content: "Welcome back to Nauti Bouys! I'm your enhanced AI bartender and concierge. I can read your emotions, remember your preferences, and create personalized beverage experiences just for you. I'm here to make your visit extraordinary! How are you feeling today?",
          timestamp: new Date(),
          emotion: 'friendly',
          confidence: 1.0
        }])
      }
    } catch (error) {
      console.error('Session initialization failed:', error)
    }
  }

  const handleEmotionDetected = (emotionData) => {
    setCurrentEmotion(emotionData)
    
    // Update conversation service with emotion
    if (conversationService) {
      conversationService.updateEmotionalState(emotionData)
    }
  }

  const handleConversationUpdate = (update) => {
    setMessages(prev => [
      ...prev,
      {
        id: prev.length + 1,
        type: 'user',
        content: update.userMessage,
        timestamp: new Date(),
        emotion: update.emotionalState?.primary,
        inputMode: 'voice'
      },
      {
        id: prev.length + 2,
        type: 'assistant',
        content: update.aiResponse,
        timestamp: new Date(),
        confidence: 0.9
      }
    ])
    
    scrollToBottom()
  }

  const sendMessage = async (message) => {
    if (!message.trim() || !sessionActive) return

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: message,
      timestamp: new Date(),
      emotion: currentEmotion?.primary,
      inputMode: 'text'
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Generate contextual response
      const response = await conversationService.generateResponse(message, {
        inputMode: 'text',
        emotionalState: currentEmotion
      })

      if (response.success) {
        const aiMessage = {
          id: messages.length + 2,
          type: 'assistant',
          content: response.response,
          timestamp: new Date(),
          confidence: response.confidence,
          actions: response.actions
        }

        setMessages(prev => [...prev, aiMessage])

        // Check if response includes recommendations
        if (response.actions?.includes('learn:interested_in_recommendations')) {
          await getPersonalizedRecommendations()
        }

        // Update patron profile if preferences were expressed
        if (response.actions?.includes('learn:expressed_preference')) {
          await updatePatronProfile(message)
        }
      } else {
        // Fallback response
        setMessages(prev => [...prev, {
          id: messages.length + 2,
          type: 'assistant',
          content: "I apologize, but I'm having trouble processing your request. Could you please try again?",
          timestamp: new Date(),
          confidence: 0.5
        }])
      }
    } catch (error) {
      console.error('Message processing failed:', error)
      setMessages(prev => [...prev, {
        id: messages.length + 2,
        type: 'assistant',
        content: "I'm experiencing some technical difficulties. Let me try to help you in a different way.",
        timestamp: new Date(),
        confidence: 0.3
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const getPersonalizedRecommendations = async () => {
    try {
      const result = await conversationService.getPersonalizedRecommendations({
        occasion: 'casual visit',
        emotionalState: currentEmotion,
        timeOfDay: new Date().getHours() < 12 ? 'morning' : 
                   new Date().getHours() < 17 ? 'afternoon' : 'evening'
      })

      if (result.success) {
        setRecommendations(result.recommendations)
      }
    } catch (error) {
      console.error('Failed to get recommendations:', error)
    }
  }

  const updatePatronProfile = async (message) => {
    try {
      // Extract preferences from message (simple keyword matching)
      const preferences = {}
      
      if (message.toLowerCase().includes('sweet')) {
        preferences.cocktails = { sweetness: 4 }
      }
      if (message.toLowerCase().includes('strong')) {
        preferences.cocktails = { strength: 5 }
      }
      if (message.toLowerCase().includes('light')) {
        preferences.cocktails = { strength: 2 }
      }

      if (Object.keys(preferences).length > 0) {
        await conversationService.updatePatronPreferences(preferences)
      }
    } catch (error) {
      console.error('Failed to update patron profile:', error)
    }
  }

  const addToFavorites = async (beverage) => {
    try {
      await conversationService.addFavoriteBeverage({
        id: beverage.id || beverage._id,
        name: beverage.name,
        category: beverage.category,
        rating: 5
      })
      
      // Update local state
      setPatronProfile(prev => ({
        ...prev,
        favoriteBeverages: [...(prev.favoriteBeverages || []), beverage]
      }))
    } catch (error) {
      console.error('Failed to add favorite:', error)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(inputMessage)
  }

  const clearChat = async () => {
    try {
      if (sessionIdRef.current) {
        await conversationService.endSession()
      }
      
      setMessages([])
      setRecommendations([])
      setCurrentEmotion(null)
      setConversationInsights(null)
      
      // Start new session
      await initializeSession()
    } catch (error) {
      console.error('Failed to clear chat:', error)
    }
  }

  const handleEndSession = async () => {
    try {
      if (sessionIdRef.current) {
        const result = await conversationService.endSession()
        if (result.success) {
          setConversationInsights(result.data?.summary)
        }
      }
      setSessionActive(false)
    } catch (error) {
      console.error('Failed to end session:', error)
    }
  }

  const getEmotionColor = (emotion) => {
    const colors = {
      happy: 'text-yellow-600',
      sad: 'text-blue-600', 
      excited: 'text-orange-600',
      calm: 'text-green-600',
      neutral: 'text-gray-600'
    }
    return colors[emotion] || 'text-gray-600'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bay-50 via-sand-50 to-oyster-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-bay-900 mb-4">
            Enhanced IA Assistant
          </h1>
          <p className="text-xl text-bay-700 max-w-3xl mx-auto">
            Your intelligent bartender with emotional awareness, memory, and personalized recommendations
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Avatar & Profile Section */}
          <div className="xl:col-span-4 space-y-6">
            {/* Enhanced Avatar */}
            <div className="card-bay">
              <EnhancedIAAvatar 
                size="large" 
                onEmotionDetected={handleEmotionDetected}
                onConversationUpdate={handleConversationUpdate}
              />
            </div>

            {/* Emotional State Display */}
            {currentEmotion && (
              <div className="card-bay">
                <h3 className="text-lg font-bold text-bay-800 mb-4 flex items-center">
                  <Heart className="h-5 w-5 mr-2" />
                  Current Mood
                </h3>
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getEmotionColor(currentEmotion.primary)} mb-2`}>
                    {currentEmotion.primary.charAt(0).toUpperCase() + currentEmotion.primary.slice(1)}
                  </div>
                  <div className="text-sm text-bay-600">
                    Confidence: {Math.round(currentEmotion.confidence * 100)}%
                  </div>
                  <div className="mt-3 space-y-1">
                    {Object.entries(currentEmotion.emotions).map(([emotion, value]) => (
                      <div key={emotion} className="flex justify-between text-xs">
                        <span className="capitalize">{emotion}</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-bay-500 h-2 rounded-full" 
                            style={{ width: `${value * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Patron Profile */}
            {patronProfile && (
              <div className="card-bay">
                <h3 className="text-lg font-bold text-bay-800 mb-4 flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  Your Profile
                </h3>
                <div className="space-y-3">
                  {patronProfile.favoriteBeverages?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-bay-700">Favorite Beverages:</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {patronProfile.favoriteBeverages.slice(0, 3).map((beverage, index) => (
                          <span key={index} className="bg-bay-100 text-bay-800 px-2 py-1 rounded-full text-xs">
                            {beverage.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-semibold text-bay-700">Communication Style:</h4>
                    <span className="text-bay-600 capitalize">
                      {patronProfile.communicationStyle?.formality || 'Friendly'}
                    </span>
                  </div>
                  
                  {patronProfile.personalNotes?.dietaryRestrictions?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-bay-700">Dietary Notes:</h4>
                      <div className="text-bay-600 text-sm">
                        {patronProfile.personalNotes.dietaryRestrictions.join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Session Controls */}
            <div className="space-y-3">
              <button
                onClick={clearChat}
                className="w-full btn-secondary flex items-center justify-center"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                New Session
              </button>
              
              <div className="text-center text-xs text-bay-600">
                Session Status: 
                <span className={`ml-1 font-semibold ${sessionActive ? 'text-green-600' : 'text-red-600'}`}>
                  {sessionActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Chat Section */}
          <div className="xl:col-span-8 space-y-6">
            <div className="card-bay flex flex-col" style={{ height: '600px' }}>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-bay-600 text-white'
                          : 'bg-sand-100 text-bay-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className={`text-xs ${
                          message.type === 'user' ? 'text-bay-100' : 'text-bay-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                        {message.emotion && (
                          <span className={`text-xs ${getEmotionColor(message.emotion)}`}>
                            {message.emotion}
                          </span>
                        )}
                        {message.confidence && (
                          <span className="text-xs text-bay-400">
                            {Math.round(message.confidence * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-sand-100 text-bay-900 max-w-xs lg:max-w-md px-4 py-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-bay-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-bay-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-bay-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-bay-500">Bay AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-bay-200 p-4">
                <form onSubmit={handleSubmit} className="flex space-x-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Tell me about your mood, preferences, or what you're looking for..."
                    className="flex-1 input-field"
                    disabled={isLoading || !sessionActive}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !inputMessage.trim() || !sessionActive}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </form>
              </div>
            </div>

            {/* Personalized Recommendations */}
            {recommendations.length > 0 && (
              <div className="card-bay">
                <h3 className="text-lg font-bold text-bay-800 mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Personalized Recommendations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendations.slice(0, 4).map((beverage, index) => (
                    <div key={index} className="bg-bay-50 rounded-lg p-4">
                      <h4 className="font-semibold text-bay-800">{beverage.name}</h4>
                      <p className="text-sm text-bay-600 mt-1">
                        {beverage.description?.substring(0, 100)}...
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-lg font-bold text-bay-700">
                          ${beverage.price}
                        </span>
                        <button
                          onClick={() => addToFavorites(beverage)}
                          className="flex items-center text-xs text-bay-600 hover:text-bay-800"
                        >
                          <Star className="h-4 w-4 mr-1" />
                          Add to Favorites
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Conversation Insights */}
        {conversationInsights && (
          <div className="mt-8 card-bay">
            <h3 className="text-lg font-bold text-bay-800 mb-4 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Session Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-bay-700">
                  {conversationInsights.messageCount}
                </div>
                <div className="text-sm text-bay-600">Messages</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-bay-700">
                  {conversationInsights.keyTopics?.length || 0}
                </div>
                <div className="text-sm text-bay-600">Topics Discussed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-bay-700">
                  {conversationInsights.recommendationsMade || 0}
                </div>
                <div className="text-sm text-bay-600">Recommendations Made</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EnhancedIAPage