import { useState, useCallback } from 'react'
import { Brain, Sparkles, MessageCircle, User, ArrowLeft, Zap, Shield, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import VisibleDidAvatar from '../components/d-id/VisibleDidAvatar'

const EnhancedDidAgentPage = () => {
  const [agentReady, setAgentReady] = useState(false)
  const [agentError, setAgentError] = useState(false)
  const [sessionData, setSessionData] = useState(null)
  const [suggestedMessage, setSuggestedMessage] = useState(null)
  const [activeService, setActiveService] = useState(null)
  const [conversationStats, setConversationStats] = useState({
    messages: 0,
    recommendations: 0,
    sessionTime: 0
  })

  const handleAgentReady = useCallback((data) => {
    console.log('D-ID Agent is ready:', data)
    setAgentReady(true)
    setAgentError(false)
  }, [])

  const handleAgentError = useCallback((error) => {
    console.error('D-ID Agent error:', error)
    setAgentError(true)
    setAgentReady(false)
  }, [])

  const handleSessionStart = useCallback((data) => {
    console.log('D-ID Agent session started:', data)
    setSessionData(data)
  }, [])

  const handleMessage = useCallback((message) => {
    console.log('D-ID Agent message:', message)
    setConversationStats(prev => ({
      ...prev,
      messages: prev.messages + 1,
      recommendations: message.content?.toLowerCase().includes('recommend') ? prev.recommendations + 1 : prev.recommendations
    }))
  }, [])

  // Enhanced service box click handlers
  const handleServiceClick = useCallback((serviceType, message) => {
    if (!agentReady) {
      alert('Please wait for the AI assistant to finish loading before using quick actions.')
      return
    }

    console.log(`[Enhanced Service Click] ${serviceType}:`, message)
    setActiveService(serviceType)
    setSuggestedMessage(message)
    
    // Scroll to the AI agent
    const agentElement = document.querySelector('#did-agent-api-container')
    if (agentElement) {
      agentElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    // Clear the suggestion after a delay to allow for re-triggering
    setTimeout(() => {
      setSuggestedMessage(null)
      setActiveService(null)
    }, 3000)
  }, [agentReady])

  // Enhanced service configurations with advanced features
  const services = [
    {
      id: 'personalized_cocktails',
      title: 'Personalized Cocktails',
      description: 'AI-powered recommendations based on your taste profile, mood, and past preferences.',
      emoji: '🍹',
      gradient: 'from-teal-400 to-teal-600',
      features: ['Taste Memory', 'Mood Analysis', 'Seasonal Suggestions'],
      message: "Hi Savannah! I'd love some personalized cocktail recommendations. Please consider my past preferences and current mood to suggest something perfect for me today."
    },
    {
      id: 'expert_sommelier',
      title: 'Expert Sommelier',
      description: 'Professional wine guidance with food pairings and detailed tasting notes.',
      emoji: '🍷',
      gradient: 'from-purple-400 to-purple-600',
      features: ['Food Pairing', 'Vintage Analysis', 'Region Expertise'],
      message: "Hello! I'm looking for expert wine guidance. Can you help me with wine selections, food pairings, and tell me about your most exceptional bottles?"
    },
    {
      id: 'spirit_connoisseur',
      title: 'Spirit Connoisseur',
      description: 'Deep knowledge of whiskeys, bourbons, and premium spirits with tasting guidance.',
      emoji: '🥃',
      gradient: 'from-amber-400 to-amber-600',
      features: ['Age Statements', 'Distillery Stories', 'Tasting Notes'],
      message: "Hi there! I'm interested in exploring premium spirits. Can you guide me through your whiskey and bourbon collection with detailed tasting notes and recommendations?"
    },
    {
      id: 'waterfront_concierge',
      title: 'Waterfront Concierge',
      description: 'Complete dining experience planning with reservations and special occasion coordination.',
      emoji: '🌊',
      gradient: 'from-blue-400 to-blue-600',
      features: ['Reservation Planning', 'Special Events', 'Waterfront Views'],
      message: "Hello! I'd like to plan a complete waterfront dining experience. Can you help with reservations, seating preferences, and make this visit truly special?"
    },
    {
      id: 'celebration_planner',
      title: 'Celebration Planner',
      description: 'Special occasion planning with custom drink menus and memorable experiences.',
      emoji: '🎉',
      gradient: 'from-pink-400 to-pink-600',
      features: ['Custom Menus', 'Special Occasions', 'Memory Making'],
      message: "Hi Savannah! I'm planning a special celebration and want to make it unforgettable. Can you help create a custom experience with perfect drinks and atmosphere?"
    },
    {
      id: 'health_conscious',
      title: 'Health-Conscious Options',
      description: 'Low-alcohol, mocktails, and health-focused beverage recommendations.',
      emoji: '🌱',
      gradient: 'from-green-400 to-green-600',
      features: ['Low-Alcohol', 'Fresh Ingredients', 'Wellness Focus'],
      message: "Hello! I'm looking for health-conscious beverage options. Can you recommend low-alcohol cocktails, fresh mocktails, and wellness-focused drinks?"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-bay-50 via-sand-50 to-oyster-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back to Home Link */}
        <div className="mb-4">
          <Link 
            to="/" 
            className="inline-flex items-center text-bay-600 hover:text-bay-800 transition-colors font-medium"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center shadow-xl">
                <Brain className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-5xl md:text-6xl font-bold text-bay-900">
                  D-ID Agent API
                </h1>
                <div className="flex items-center justify-center mt-3">
                  <Zap className="h-6 w-6 text-yellow-500 mr-2" />
                  <p className="text-xl md:text-2xl text-bay-700 font-semibold">
                    Professional AI Bartender & Concierge
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-lg text-bay-600 max-w-4xl mx-auto mb-6">
            Experience the next generation of AI hospitality with professional avatar interaction, 
            voice synthesis, complete patron memory, and Gemini 2.5 Flash intelligence.
          </p>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="flex items-center justify-center space-x-2 bg-white rounded-lg p-3 shadow-sm border border-teal-100">
              <Shield className="h-5 w-5 text-teal-600" />
              <span className="text-sm font-medium text-gray-700">Professional Avatar</span>
            </div>
            <div className="flex items-center justify-center space-x-2 bg-white rounded-lg p-3 shadow-sm border border-blue-100">
              <Brain className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Gemini 2.5 Flash</span>
            </div>
            <div className="flex items-center justify-center space-x-2 bg-white rounded-lg p-3 shadow-sm border border-purple-100">
              <Clock className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Patron Memory</span>
            </div>
          </div>
        </div>

        {/* Main D-ID Agent API */}
        <div className="card-bay mb-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-bay-800 mb-3 flex items-center">
              <MessageCircle className="h-8 w-8 mr-3 text-teal-600" />
              Professional AI Assistant
            </h2>
            <p className="text-bay-600 mb-4">
              Interact with Savannah, your AI bartender, through advanced voice and text capabilities 
              powered by D-ID Agent API and Gemini 2.5 Flash intelligence.
            </p>
            
            {/* Session Stats */}
            {sessionData && (
              <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Session Active</span>
                </div>
                <div>Messages: {conversationStats.messages}</div>
                <div>Recommendations: {conversationStats.recommendations}</div>
                {sessionData.sessionId && (
                  <div>ID: {sessionData.sessionId.substring(0, 8)}...</div>
                )}
              </div>
            )}
          </div>

          <VisibleDidAvatar
            size="large"
            showControls={true}
            onAgentReady={handleAgentReady}
            onAgentError={handleAgentError}
            onSessionStart={handleSessionStart}
            onMessage={handleMessage}
            triggerMessage={suggestedMessage}
            className="w-full"
          />
        </div>

        {/* Enhanced Interactive Service Boxes */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-bay-800 mb-6 text-center flex items-center justify-center">
            <Sparkles className="h-6 w-6 mr-2 text-teal-600" />
            Specialized AI Services
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => handleServiceClick(service.id, service.message)}
                className={`card-bay text-left hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group ${
                  activeService === service.id ? 'ring-2 ring-teal-500 bg-teal-50' : ''
                } ${!agentReady ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!agentReady}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${service.gradient} rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-2xl">{service.emoji}</span>
                </div>
                
                <h4 className="font-bold text-bay-800 mb-2 group-hover:text-teal-700 transition-colors">
                  {service.title}
                </h4>
                
                <p className="text-sm text-bay-600 mb-4">
                  {service.description}
                </p>

                {/* Feature Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {service.features.map((feature, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
                
                <div className="text-xs text-teal-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {agentReady ? 'Click to start specialized conversation' : 'Waiting for AI to load...'}
                </div>
                
                {activeService === service.id && (
                  <div className="mt-2 text-xs text-teal-700 font-medium animate-pulse">
                    Starting conversation...
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Features Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Technical Capabilities */}
          <div className="card-bay bg-gradient-to-r from-blue-50 to-teal-50 border-blue-200">
            <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
              <Brain className="h-6 w-6 mr-2" />
              Technical Capabilities
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <strong className="text-blue-700">D-ID Agent API Integration:</strong>
                  <p className="text-blue-600">Professional avatar with realistic lip-sync and Microsoft Neural voice synthesis</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-teal-500 rounded-full mt-2"></div>
                <div>
                  <strong className="text-teal-700">Gemini 2.5 Flash Backend:</strong>
                  <p className="text-teal-600">Advanced reasoning with 90% cost savings compared to OpenAI</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <strong className="text-purple-700">Patron Memory System:</strong>
                  <p className="text-purple-600">Complete conversation history, preferences, and emotional intelligence</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <strong className="text-green-700">Real-time Integration:</strong>
                  <p className="text-green-600">Live beverage inventory, menu updates, and contextual recommendations</p>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Guidelines */}
          <div className="card-bay bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center">
              <MessageCircle className="h-6 w-6 mr-2" />
              Advanced Interaction Tips
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <strong className="text-purple-700">🎯 Be Specific:</strong>
                <p className="text-purple-600">"I'm celebrating my anniversary and love smoky flavors - what's your most special whiskey?"</p>
              </div>
              <div>
                <strong className="text-pink-700">💭 Share Context:</strong>
                <p className="text-pink-600">"It's a business dinner for 4 people, we need wine pairings for seafood"</p>
              </div>
              <div>
                <strong className="text-blue-700">🔄 Reference History:</strong>
                <p className="text-blue-600">"Remember that cocktail I loved last time? Suggest something similar but different"</p>
              </div>
              <div>
                <strong className="text-teal-700">🌟 Ask for Learning:</strong>
                <p className="text-teal-600">"Teach me about bourbon aging and recommend something to expand my palate"</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {agentError && (
          <div className="card-bay border-red-200 bg-red-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl text-white">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-red-800 mb-2">D-ID Agent Connection Issue</h3>
              <p className="text-red-600 mb-4">
                We're having trouble connecting to the D-ID Agent API. This might be due to network issues, 
                authentication problems, or service availability.
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="btn-primary bg-red-500 hover:bg-red-600"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        {import.meta.env.DEV && sessionData && (
          <div className="card-bay bg-gray-50 border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Development Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <strong className="text-gray-700">Session ID:</strong>
                <p className="text-gray-600 font-mono">{sessionData.sessionId?.substring(0, 16)}...</p>
              </div>
              <div>
                <strong className="text-gray-700">Messages:</strong>
                <p className="text-gray-600">{conversationStats.messages}</p>
              </div>
              <div>
                <strong className="text-gray-700">Recommendations:</strong>
                <p className="text-gray-600">{conversationStats.recommendations}</p>
              </div>
              <div>
                <strong className="text-gray-700">Status:</strong>
                <p className="text-gray-600">{agentReady ? 'Ready' : 'Loading'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EnhancedDidAgentPage
