import { useState, useRef, useEffect } from 'react'
import { Send, Mic, MicOff, Volume2, VolumeX, RotateCcw } from 'lucide-react'
import IAAvatar from '../components/common/IAAvatar'

const IAPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hello! I'm your Nauti Bouys IA assistant. I can help you discover beverages, make reservations, and answer any questions you have. How can I assist you today?",
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (message) => {
    if (!message.trim()) return

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: message,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        type: 'ai',
        content: getSimulatedResponse(message),
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiResponse])
      setIsLoading(false)
    }, 1500)
  }

  const getSimulatedResponse = (userMessage) => {
    const responses = {
      beverage: "I'd be happy to help you find the perfect beverage! We have an excellent selection of wines, craft beers, signature cocktails, and refreshing mocktails. What type of drink are you in the mood for today?",
      reservation: "I can help you make a reservation! Our reservation system is currently being finalized, but I can provide you with information about available time slots and special events. What date and time were you thinking?",
      menu: "Our beverage menu features carefully curated selections including premium wines from California vineyards, craft beers from local breweries, artisan cocktails created by our expert mixologists, and refreshing non-alcoholic options. Would you like recommendations in any particular category?",
      default: "That's a great question! While I'm still learning and our full AI capabilities are being developed, I'm here to help with information about our beverages, reservations, and services. Is there anything specific about Nauti Bouys you'd like to know?"
    }

    const message = userMessage.toLowerCase()
    if (message.includes('drink') || message.includes('beverage') || message.includes('wine') || message.includes('beer')) {
      return responses.beverage
    } else if (message.includes('reservation') || message.includes('book') || message.includes('table')) {
      return responses.reservation
    } else if (message.includes('menu') || message.includes('what do you have')) {
      return responses.menu
    } else {
      return responses.default
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(inputMessage)
  }

  const toggleListening = () => {
    setIsListening(!isListening)
    // Voice recognition would be implemented here
  }

  const clearChat = () => {
    setMessages([{
      id: 1,
      type: 'ai',
      content: "Hello! I'm your Nauti Bouys IA assistant. I can help you discover beverages, make reservations, and answer any questions you have. How can I assist you today?",
      timestamp: new Date()
    }])
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">IA Assistant</h1>
          <p className="text-lg text-gray-600">
            Chat with our intelligent assistant for personalized recommendations and support
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Avatar Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <IAAvatar size="large" showControls={true} />
              
              <div className="mt-6 space-y-2">
                <button
                  onClick={clearChat}
                  className="w-full btn-secondary flex items-center justify-center"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Clear Chat
                </button>
              </div>

              <div className="mt-6 text-sm text-gray-500">
                <h3 className="font-semibold mb-2">What I can help with:</h3>
                <ul className="space-y-1">
                  <li>• Beverage recommendations</li>
                  <li>• Making reservations</li>
                  <li>• Menu information</li>
                  <li>• Event details</li>
                  <li>• General questions</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Chat Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md flex flex-col" style={{ height: '600px' }}>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.type === 'user' ? 'text-teal-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-gray-500">IA is typing...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-200 p-4">
                <form onSubmit={handleSubmit} className="flex space-x-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 input-field"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`p-2 rounded-md transition-colors duration-200 ${
                      isListening 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !inputMessage.trim()}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IAPage