import { useEffect, useRef, useState, useCallback } from 'react'
import { MessageCircle, Mic, Volume2, User, AlertCircle, Phone, PhoneOff, Settings } from 'lucide-react'

const DidAgentAPI = ({ 
  size = 'large', 
  showControls = true, 
  className = '',
  onAgentReady = null,
  onAgentError = null,
  onSessionStart = null,
  onMessage = null,
  triggerMessage = null,
  userId = null
}) => {
  const containerRef = useRef(null)
  const [agentStatus, setAgentStatus] = useState('initializing')
  const [statusMessage, setStatusMessage] = useState('Initializing D-ID Agent API...')
  const [sessionId, setSessionId] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [messageCount, setMessageCount] = useState(0)
  const [lastMessage, setLastMessage] = useState('')
  const [connectionError, setConnectionError] = useState(null)
  const [demoMode, setDemoMode] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [currentModel, setCurrentModel] = useState('Gemini 2.5 Flash') // Default fallback
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  // Size configurations
  const sizeClasses = {
    small: 'w-64 h-48',
    medium: 'w-96 h-72',
    large: 'w-full h-[600px]'
  }

  const containerClass = sizeClasses[size] || sizeClasses.large

  // Fetch current model information from backend
  const fetchModelInfo = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/d-id-agent/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.status) {
          // Extract model info from status
          const aiProvider = data.status.aiProvider || 'Google Gemini 2.5 Pro'
          setCurrentModel(aiProvider)
        }
      }
    } catch (error) {
      console.log('[D-ID Agent API] Could not fetch model info:', error)
      // Keep default fallback
    }
  }, [])

  // Create D-ID Agent session
  const createAgentSession = useCallback(async () => {
    try {
      setAgentStatus('connecting')
      setStatusMessage('Creating D-ID Agent session...')

      const token = localStorage.getItem('token')
      if (!token) {
        setAgentStatus('auth_required')
        setStatusMessage('Authentication required')
        setConnectionError('Please log in to use the D-ID Agent API')
        return
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/d-id-agent/create-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          features: ['voice_interaction', 'emotional_analysis', 'avatar_presentation']
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setSessionId(data.sessionId)
        setAgentStatus('loading_agent')
        setStatusMessage('Loading D-ID Agent...')
        
        // Initialize D-ID Agent with the session
        await initializeDidAgent(data.sessionId, data.agentConfig, data.webhookUrl)
        
        if (onSessionStart) {
          onSessionStart(data)
        }
      } else {
        throw new Error(data.message || 'Failed to create session')
      }

    } catch (error) {
      console.error('[D-ID Agent API] Session creation error:', error)
      setAgentStatus('error')
      setStatusMessage(`Connection failed: ${error.message}`)
      setConnectionError(error.message)
      
      if (onAgentError) {
        onAgentError(error)
      }
    }
  }, [onSessionStart, onAgentError])

  // Initialize D-ID Agent
  const initializeDidAgent = async (sessionId, agentConfig, webhookUrl) => {
    try {
      setStatusMessage('Initializing avatar and voice...')

      // For now, simulate the D-ID Agent with a demo mode that shows Gemini integration
      console.log('[D-ID Agent API] Starting demo mode with Gemini 2.5 Flash integration')
      
      // Simulate successful initialization
      setTimeout(() => {
        handleAgentReady()
      }, 2000)

    } catch (error) {
      console.error('[D-ID Agent API] Initialization error:', error)
      setAgentStatus('error')
      setStatusMessage(`Initialization failed: ${error.message}`)
      setConnectionError(error.message)
    }
  }

  // Load D-ID SDK
  const loadDidSDK = () => {
    return new Promise((resolve, reject) => {
      if (window.DID) {
        resolve()
        return
      }

      const script = document.createElement('script')
      // Use the correct D-ID SDK URL
      script.src = 'https://d-id-public-bucket.s3.amazonaws.com/agent-sdk/latest/d-id-agent-sdk.js'
      script.onload = () => {
        console.log('[D-ID Agent API] SDK loaded successfully')
        resolve()
      }
      script.onerror = () => {
        console.error('[D-ID Agent API] Failed to load SDK from:', script.src)
        reject(new Error('Failed to load D-ID SDK'))
      }
      document.head.appendChild(script)
    })
  }

  // Agent event handlers
  const handleAgentReady = useCallback(() => {
    console.log('[D-ID Agent API] Agent ready')
    setAgentStatus('ready')
    setStatusMessage('AI Assistant Ready')
    setIsConnected(true)
    setConnectionError(null)
    
    if (onAgentReady) {
      onAgentReady({ sessionId, status: 'ready' })
    }
  }, [sessionId, onAgentReady])

  const handleAgentError = useCallback((error) => {
    console.error('[D-ID Agent API] Agent error:', error)
    setAgentStatus('error')
    setStatusMessage('Connection Error')
    setConnectionError(error.message || 'Unknown error')
    setIsConnected(false)
    
    if (onAgentError) {
      onAgentError(error)
    }
  }, [onAgentError])

  const handleAgentMessage = useCallback((message) => {
    console.log('[D-ID Agent API] Message received:', message)
    setLastMessage(message.content || message.text || '')
    setMessageCount(prev => prev + 1)
    
    if (onMessage) {
      onMessage(message)
    }
  }, [onMessage])

  const handleAgentConnect = useCallback(() => {
    console.log('[D-ID Agent API] Agent connected')
    setIsConnected(true)
    setAgentStatus('active')
    setStatusMessage('Conversation Active')
  }, [])

  const handleAgentDisconnect = useCallback(() => {
    console.log('[D-ID Agent API] Agent disconnected')
    setIsConnected(false)
    setAgentStatus('ready')
    setStatusMessage('AI Assistant Ready')
  }, [])

  // Send message to Gemini 2.5 Flash via webhook
  const sendMessageToGemini = useCallback(async (message) => {
    console.log('[D-ID Agent API] Sending message:', message)
    console.log('[D-ID Agent API] Session ID:', sessionId)
    
    if (!message.trim() || !sessionId) {
      console.log('[D-ID Agent API] Message or session ID missing')
      return
    }

    try {
      setIsTyping(true)
      
      // Add user message to chat
      const userMessage = {
        id: Date.now(),
        type: 'user',
        content: message,
        timestamp: new Date()
      }
      console.log('[D-ID Agent API] Adding user message:', userMessage)
      setMessages(prev => [...prev, userMessage])
      setMessageCount(prev => prev + 1)

      // Send to Gemini 2.5 Flash via enhanced webhook
      const url = `${import.meta.env.VITE_API_BASE_URL}/d-id-agent/webhook`
      console.log('[D-ID Agent API] Sending to URL:', url)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          sessionId: sessionId,
          agentId: 'v2_agt_AYiJdoSm'
        }),
      })

      console.log('[D-ID Agent API] Response status:', response.status)
      const data = await response.json()
      console.log('[D-ID Agent API] Response data:', data)

      if (data.response) {
        // Add AI response to chat
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: data.response,
          timestamp: new Date(),
          emotion: data.emotion || 'friendly'
        }
        console.log('[D-ID Agent API] Adding AI message:', aiMessage)
        setMessages(prev => [...prev, aiMessage])
        setLastMessage(data.response)
        setMessageCount(prev => prev + 1)
        setAgentStatus('active')
        setStatusMessage('Conversation Active')
      } else {
        console.log('[D-ID Agent API] No response in data:', data)
      }

    } catch (error) {
      console.error('[D-ID Agent API] Error sending message:', error)
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }, [sessionId])

  // Auto-scroll to bottom when messages change (only within chat container)
  const scrollToBottom = () => {
    if (messagesContainerRef.current && messagesEndRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // Send message to agent (legacy function for compatibility)
  const sendMessage = useCallback((message) => {
    sendMessageToGemini(message)
    return true
  }, [sendMessageToGemini])

  // Handle trigger message
  useEffect(() => {
    if (triggerMessage && isConnected) {
      console.log('[D-ID Agent API] Sending triggered message:', triggerMessage)
      sendMessage(triggerMessage)
    }
  }, [triggerMessage, isConnected, sendMessage])

  // Initialize on mount
  useEffect(() => {
    fetchModelInfo() // Fetch current model info
    createAgentSession()

    return () => {
      // Cleanup
      const agent = containerRef.current?.didAgent
      if (agent) {
        try {
          agent.stop()
        } catch (error) {
          console.error('[D-ID Agent API] Cleanup error:', error)
        }
      }
    }
  }, [createAgentSession, fetchModelInfo])

  // Retry connection
  const retryConnection = () => {
    setConnectionError(null)
    createAgentSession()
  }

  const getStatusColor = () => {
    switch (agentStatus) {
      case 'ready': return 'text-green-600'
      case 'active': return 'text-blue-600'
      case 'error': return 'text-red-600'
      case 'connecting': return 'text-yellow-600'
      case 'loading_agent': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = () => {
    switch (agentStatus) {
      case 'ready': return <User className="h-4 w-4" />
      case 'active': return <MessageCircle className="h-4 w-4" />
      case 'error': return <AlertCircle className="h-4 w-4" />
      case 'connecting': return <Phone className="h-4 w-4" />
      case 'loading_agent': return <Settings className="h-4 w-4 animate-spin" />
      default: return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
    }
  }

  return (
    <div className={`flex flex-col space-y-4 ${className}`}>
      {/* Enhanced Status Bar */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg border border-teal-200">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {statusMessage}
            </span>
            {sessionId && (
              <div className="text-xs text-gray-500 mt-1">
                Session: {sessionId.substring(0, 12)}...
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {messageCount > 0 && (
            <div className="text-xs text-gray-600">
              Messages: {messageCount}
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <div className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-xs font-medium">Connected</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                <span className="text-xs font-medium">Disconnected</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* D-ID Agent Container */}
      <div className={`${containerClass} bg-white rounded-lg shadow-lg border-2 border-teal-200 overflow-hidden relative`}>
        <div 
          ref={containerRef}
          className="w-full h-full"
          id="did-agent-api-container"
        >
          {/* Authentication Required State */}
          {agentStatus === 'auth_required' && (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-yellow-50 to-orange-50">
              <div className="text-center max-w-md">
                <User className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                <p className="text-yellow-700 font-medium mb-2">Authentication Required</p>
                <p className="text-yellow-600 text-sm mb-4">
                  Please log in to access the D-ID Agent API and start your personalized AI bartender experience.
                </p>
                <div className="space-y-2">
                  <button 
                    onClick={() => window.location.href = '/login'}
                    className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors mr-2"
                  >
                    Go to Login
                  </button>
                  <div className="text-xs text-yellow-600 mt-2">
                    The D-ID Agent API requires authentication for security and personalized experiences.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading States */}
          {agentStatus === 'initializing' && (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-teal-50 to-blue-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Initializing D-ID Agent API...</p>
                <p className="text-gray-500 text-sm mt-2">Setting up your AI assistant</p>
              </div>
            </div>
          )}

          {agentStatus === 'connecting' && (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-yellow-50 to-orange-50">
              <div className="text-center">
                <Phone className="h-12 w-12 text-yellow-600 mx-auto mb-4 animate-pulse" />
                <p className="text-gray-600 font-medium">Connecting to D-ID Agent...</p>
                <p className="text-gray-500 text-sm mt-2">Creating secure session</p>
              </div>
            </div>
          )}

          {agentStatus === 'loading_agent' && (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-teal-50">
              <div className="text-center">
                <Settings className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600 font-medium">Loading AI Avatar...</p>
                <p className="text-gray-500 text-sm mt-2">Preparing voice and visual interface</p>
              </div>
            </div>
          )}
          
          {/* Error State */}
          {agentStatus === 'error' && (
            <div className="flex items-center justify-center h-full bg-red-50">
              <div className="text-center max-w-md">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 font-medium mb-2">Failed to Connect</p>
                <p className="text-red-500 text-sm mb-4">
                  {connectionError || 'Unable to establish connection with D-ID Agent API'}
                </p>
                <button 
                  onClick={retryConnection}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          )}

          {/* Success State - Chat Interface */}
          {(agentStatus === 'ready' || agentStatus === 'active') && (
            <div className="w-full h-full bg-gradient-to-br from-teal-50 to-blue-50 flex flex-col">
              {/* Chat Header */}
              <div className="p-4 bg-white bg-opacity-80 border-b border-teal-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Savannah - AI Bartender</h3>
                    <p className="text-sm text-gray-600">Powered by {currentModel}</p>
                  </div>
                  <div className="ml-auto">
                    <div className="flex items-center text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                      <span className="text-xs font-medium">Ready</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Messages Area */}
              <div ref={messagesContainerRef} className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  {/* Welcome Message */}
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm max-w-xs">
                      <p className="text-sm text-gray-800">
                        Ahoy! I'm Savannah, your AI bartender. I'm powered by {currentModel} and ready to help with personalized cocktail recommendations, wine pairings, and concierge services. What can I help you with today?
                      </p>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  {messages.map((message) => (
                    <div key={message.id} className={`flex items-start space-x-3 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.type === 'user' 
                          ? 'bg-blue-600' 
                          : message.type === 'error'
                          ? 'bg-red-600'
                          : 'bg-teal-600'
                      }`}>
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className={`rounded-lg p-3 shadow-sm max-w-xs ${
                        message.type === 'user' 
                          ? 'bg-blue-100' 
                          : message.type === 'error'
                          ? 'bg-red-100'
                          : 'bg-white'
                      }`}>
                        <p className={`text-sm ${
                          message.type === 'user' 
                            ? 'text-blue-800' 
                            : message.type === 'error'
                            ? 'text-red-800'
                            : 'text-gray-800'
                        }`}>
                          {message.content}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Invisible scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-white bg-opacity-80 border-t border-teal-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask me about cocktails, wines, or anything else..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && inputMessage.trim() && !isTyping) {
                        sendMessageToGemini(inputMessage)
                        setInputMessage('')
                      }
                    }}
                    disabled={isTyping}
                  />
                  <button 
                    onClick={() => {
                      if (inputMessage.trim() && !isTyping) {
                        sendMessageToGemini(inputMessage)
                        setInputMessage('')
                      }
                    }}
                    disabled={!inputMessage.trim() || isTyping}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isTyping ? 'Sending...' : 'Send'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  ✨ Live Chat: Connected to {currentModel} AI with complete patron memory!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Connection Status Overlay */}
        {!isConnected && agentStatus !== 'error' && agentStatus !== 'initializing' && (
          <div className="absolute top-4 right-4 bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-2">
            <div className="flex items-center text-yellow-700 text-sm">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse mr-2"></div>
              Reconnecting...
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Usage Instructions */}
      {showControls && (
        <div className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-semibold text-blue-800 mb-4 flex items-center">
            <MessageCircle className="h-5 w-5 mr-2" />
            D-ID Agent API Features
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h5 className="font-medium text-blue-700 mb-3 flex items-center">
                <Mic className="h-4 w-4 mr-2" />
                Voice Interaction
              </h5>
              <ul className="text-blue-600 space-y-2">
                <li>• Professional avatar with realistic lip-sync</li>
                <li>• Microsoft Neural voice synthesis</li>
                <li>• Natural conversation flow</li>
                <li>• Emotional intelligence and mood adaptation</li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-medium text-blue-700 mb-3 flex items-center">
                <Volume2 className="h-4 w-4 mr-2" />
                AI Capabilities
              </h5>
              <ul className="text-blue-600 space-y-2">
                <li>• Gemini 2.5 Flash integration</li>
                <li>• Complete patron memory system</li>
                <li>• Real-time beverage inventory</li>
                <li>• Personalized recommendations</li>
              </ul>
            </div>
          </div>
          
          {/* Enhanced Sample Questions */}
          <div className="mt-6 pt-4 border-t border-blue-200">
            <h5 className="font-medium text-blue-700 mb-3">🗣️ Try These Advanced Interactions:</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <strong className="text-blue-700 block mb-2">🍹 Personalized Cocktails:</strong>
                <p className="text-blue-600">"Remember my preferences and suggest something new based on what I've enjoyed before"</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <strong className="text-blue-700 block mb-2">🥃 Expert Guidance:</strong>
                <p className="text-blue-600">"I'm celebrating an anniversary - what's your most special bourbon recommendation?"</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <strong className="text-blue-700 block mb-2">📅 Concierge Services:</strong>
                <p className="text-blue-600">"Plan a waterfront dining experience for a business dinner next week"</p>
              </div>
            </div>
          </div>

          {/* Session Info */}
          {sessionId && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="flex items-center justify-between text-xs text-blue-600">
                <div>Session ID: {sessionId}</div>
                <div>Messages: {messageCount}</div>
                <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Debug Info (development only) */}
      {import.meta.env.DEV && (
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer hover:text-gray-700">Debug Information</summary>
          <div className="mt-2 p-3 bg-gray-100 rounded font-mono">
            <div>Status: {agentStatus}</div>
            <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
            <div>Session ID: {sessionId || 'None'}</div>
            <div>Message Count: {messageCount}</div>
            <div>Last Message: {lastMessage.substring(0, 50)}...</div>
            <div>Error: {connectionError || 'None'}</div>
          </div>
        </details>
      )}
    </div>
  )
}

export default DidAgentAPI
