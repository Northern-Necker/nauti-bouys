 import { useState } from 'react'
import { Brain, Sparkles, MessageCircle, User, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import NautiBouysDIDAgent from '../components/d-id/NautiBouysDIDAgent'

const SimpleIAPage = () => {
  const [agentReady, setAgentReady] = useState(false)
  const [agentError, setAgentError] = useState(false)
  const [suggestedMessage, setSuggestedMessage] = useState(null)
  const [activeService, setActiveService] = useState(null)

  const handleAgentReady = (data) => {
    console.log('Agent is ready:', data)
    setAgentReady(true)
    setAgentError(false)
  }

  const handleAgentError = (error) => {
    console.error('Agent error:', error)
    setAgentError(true)
    setAgentReady(false)
  }

  // Service box click handlers
  const handleServiceClick = (serviceType, message) => {
    if (!agentReady) {
      alert('Please wait for the AI assistant to finish loading before using quick actions.')
      return
    }

    console.log(`[Service Click] ${serviceType}:`, message)
    setActiveService(serviceType)
    setSuggestedMessage(message)
    
    // Scroll to the AI agent
    const agentElement = document.querySelector('#nauti-bouys-did-agent-container')
    if (agentElement) {
      agentElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    // Clear the suggestion after a delay to allow for re-triggering
    setTimeout(() => {
      setSuggestedMessage(null)
      setActiveService(null)
    }, 3000)
  }

  // Service configurations
  const services = [
    {
      id: 'cocktail',
      title: 'Cocktail Expert',
      description: 'Get personalized cocktail recommendations based on your taste preferences and mood.',
      emoji: '🍹',
      gradient: 'from-teal-400 to-teal-600',
      message: "Hi! I'm interested in cocktail recommendations. What are your signature cocktails and what would you recommend for someone who enjoys refreshing drinks?"
    },
    {
      id: 'wine',
      title: 'Wine Sommelier',
      description: 'Discover perfect wine pairings for your meal and learn about our curated selection.',
      emoji: '🍷',
      gradient: 'from-blue-400 to-blue-600',
      message: "Hello! I'd love to learn about your wine selection. Can you tell me about your wine menu and recommend some good pairings for seafood?"
    },
    {
      id: 'spirits',
      title: 'Spirit Guide',
      description: 'Explore premium spirits, learn about distillation, and find your perfect dram.',
      emoji: '🥃',
      gradient: 'from-amber-400 to-amber-600',
      message: "Hi there! I'm interested in your premium spirits collection. What are some of your best whiskeys, bourbons, and unique spirits you'd recommend?"
    },
    {
      id: 'concierge',
      title: 'Concierge Service',
      description: 'Make reservations, check availability, and plan your perfect waterfront experience.',
      emoji: '📅',
      gradient: 'from-green-400 to-green-600',
      message: "Hello! I'd like to make a reservation and learn about your waterfront dining experience. What are your available times and seating options?"
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

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-bay-900">
                  Nauti Bouys AI Assistant
                </h1>
                <div className="flex items-center justify-center mt-2">
                  <Sparkles className="h-5 w-5 text-sunset-500 mr-2" />
                  <p className="text-lg md:text-xl text-bay-700">
                    Your AI Bartender & Concierge
                  </p>
                </div>
              </div>
            </div>
          </div>
          <p className="text-lg text-bay-600 max-w-3xl mx-auto">
            Meet your intelligent waterfront companion. 
            Get personalized drink recommendations, make reservations, and discover the best of Chesapeake Bay dining.
          </p>
        </div>


        {/* Main AI Agent */}
        <div className="card-bay">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-bay-800 mb-2 flex items-center">
              <Brain className="h-8 w-8 mr-3 text-teal-600" />
              Chat with Your AI Assistant
            </h2>
            <p className="text-bay-600">
              Start a conversation about cocktails, wines, spirits, reservations, or anything about Nauti Bouys!
            </p>
          </div>

          <NautiBouysDIDAgent
            size="large"
            showControls={true}
            onAgentReady={handleAgentReady}
            onAgentError={handleAgentError}
            triggerMessage={suggestedMessage}
            className="w-full"
          />
        </div>

        {/* Interactive Service Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => handleServiceClick(service.id, service.message)}
              className={`card-bay text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group ${
                activeService === service.id ? 'ring-2 ring-teal-500 bg-teal-50' : ''
              } ${!agentReady ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!agentReady}
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${service.gradient} rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <span className="text-2xl">{service.emoji}</span>
              </div>
              <h3 className="font-bold text-bay-800 mb-2 group-hover:text-teal-700 transition-colors">
                {service.title}
              </h3>
              <p className="text-sm text-bay-600 mb-3">
                {service.description}
              </p>
              <div className="text-xs text-teal-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {agentReady ? 'Click to start conversation' : 'Waiting for AI to load...'}
              </div>
              {activeService === service.id && (
                <div className="mt-2 text-xs text-teal-700 font-medium animate-pulse">
                  Starting conversation...
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Quick Start Tips */}
        <div className="mt-8 card-bay bg-gradient-to-r from-teal-50 to-blue-50 border-teal-200">
          <h3 className="text-2xl font-bold text-bay-800 mb-4 flex items-center">
            <Sparkles className="h-6 w-6 mr-2 text-teal-600" />
            Quick Start Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-bay-700 mb-2">🎤 Voice Commands</h4>
              <ul className="text-sm text-bay-600 space-y-1">
                <li>• "What cocktails do you recommend for a sunset dinner?"</li>
                <li>• "I'd like to make a reservation for tonight"</li>
                <li>• "Tell me about your wine selection"</li>
                <li>• "What's the best bourbon you have?"</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-bay-700 mb-2">💬 Text Questions</h4>
              <ul className="text-sm text-bay-600 space-y-1">
                <li>• Ask about daily specials and fresh catches</li>
                <li>• Request pairing suggestions for your meal</li>
                <li>• Inquire about waterfront seating availability</li>
                <li>• Learn about Nauti Bouys history and atmosphere</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Error State */}
        {agentError && (
          <div className="mt-8 card-bay border-red-200 bg-red-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl text-white">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-red-800 mb-2">Connection Issue</h3>
              <p className="text-red-600 mb-4">
                We're having trouble connecting to the AI assistant. This might be due to network issues or browser restrictions.
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
      </div>
    </div>
  )
}

export default SimpleIAPage
