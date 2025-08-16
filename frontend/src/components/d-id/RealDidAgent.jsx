import { useEffect, useRef, useState, useCallback } from 'react'
import { MessageCircle, Mic, MicOff, Volume2, VolumeX, User, AlertCircle, Phone, Settings, Play, Pause } from 'lucide-react'

const RealDidAgent = ({ 
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
  const videoRef = useRef(null)
  const [agentStatus, setAgentStatus] = useState('initializing')
  const [statusMessage, setStatusMessage] = useState('Loading D-ID SDK...')
  const [sessionId, setSessionId] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [messageCount, setMessageCount] = useState(0)
  const [lastMessage, setLastMessage] = useState('')
  const [connectionError, setConnectionError] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [currentModel, setCurrentModel] = useState('Gemini 2.5 Flash')
  const [didAgent, setDidAgent] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  // Size configurations
  const sizeClasses = {
    small: 'w-64 h-48',
    medium: 'w-96 h-72',
    large: 'w-full h-[600px]'
  }

  const containerClass = sizeClasses[size] || sizeClasses.large

  // Load D-ID SDK
  const loadDidSDK = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.DID_API) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://d-id-public-bucket.s3.amazonaws.com/api-sdk/latest/d-id-api-sdk.js'
      script.onload = () => {
        console.log('[Real D-ID Agent] SDK loaded successfully')
        resolve()
      }
      script.onerror = () => {
        console.error('[Real D-ID Agent] Failed to load SDK')
        reject(new Error('Failed to load D-ID SDK'))
      }
      document.head.appendChild(script)
    })
  }, [])

  // Initialize D-ID Agent with real SDK
  const initializeDidAgent = useCallback(async () => {
    try {
      setAgentStatus('loading_sdk')
      setStatusMessage('Loading D-ID SDK...')

      await loadDidSDK()

      setAgentStatus('creating_agent')
      setStatusMessage('Creating D-ID Agent...')

      // D-ID Agent configuration
      const agentConfig = {
        source_url: "https://clips-presenters.d-id.com/v2/Alyssa_NoHands_RedSuite_Lobby/qtzjxMSwEa/ypTds_0CK3/image.png",
        voice: {
          type: "microsoft",
          voice_id: "en-US-JennyMultilingualV2Neural"
        },
        presenter: {
          type: "talk"
        }
      }

      // Create D-ID Agent
      const agent = new window.DID_API.Agent({
        apiKey: import.meta.env.VITE_DID_API_KEY,
        ...agentConfig
      })

      // Set up event listeners
      agent.on('ready', () => {
        console.log('[Real D-ID Agent] Agent ready')
        setAgentStatus('ready')
        setStatusMessage('AI Assistant Ready')
        setIsConnected(true)
        setConnectionError(null)
        
        if (onAgentReady) {
          onAgentReady({ sessionId: agent.sessionId, status: 'ready' })
        }
      })

      agent.on('error', (error) => {
        console.error('[Real D-ID Agent] Agent error:', error)
        setAgentStatus('error')
        setStatusMessage('Connection Error')
        setConnectionError(error.message || 'Unknown error')
        setIsConnected(false)
        
        if (onAgentError) {
          onAgentError(error)
        }
      })

      agent.on('message', (message) => {
        console.log('[Real D-ID Agent] Message received:', message)
        const aiMessage = {
          id: Date.now(),
          type: 'ai',
          content: message.text || message.content,
          timestamp: new Date(),
          emotion: message.emotion || 'friendly'
        }
        setMessages(prev => [...prev, aiMessage])
        setLastMessage(message.text || message.content)
        setMessageCount(prev => prev + 1)
        
        if (onMessage) {
          onMessage(message)
        }
      })

      agent.on('speaking', () => {
        setIsPlaying(true)
      })

      agent.on('stopped', () => {
        setIsPlaying(false)
      })

      // Initialize the agent
      await agent.init()
      
      // Connect video element
      if (videoRef.current) {
        agent.setVideoElement(videoRef.current)
      }

      setDidAgent(agent)
      setSessionId(agent.sessionId)

      if (onSessionStart) {
        onSessionStart({ sessionId: agent.sessionId, agentConfig })
      }

    } catch (error) {
      console.error('[Real D-ID Agent] Initialization error:', error)
      setAgentStatus('error')
      setStatusMessage(`Initialization failed: ${error.message}`)
      setConnectionError(error.message)
      
      if (onAgentError) {
        onAgentError(error)
      }
    }
  }, [loadDidSDK, onAgentReady, onAgentError, onSessionStart, onMessage])

  // Send message to D-ID Agent
  const sendMessageToAgent = useCallback(async (message) => {
    if (!didAgent || !message.trim()) {
      console.log('[Real D-ID Agent] No agent or empty message')
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
      setMessages(prev => [...prev, userMessage])
      setMessageCount(prev => prev + 1)

      // Send to D-ID Agent (which will call our webhook)
      await didAgent.speak(message)

    } catch (error) {
      console.error('[Real D-ID Agent] Error sending message:', error)
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
  }, [didAgent])

  // Voice controls
  const toggleListening = useCallback(() => {
    if (!didAgent) return

    if (isListening) {
      didAgent.stopListening()
      setIsListening(false)
    } else {
      didAgent.startListening()
      setIsListening(true)
    }
  }, [didAgent, isListening])

  const toggleMute = useCallback(() => {
    if (!didAgent) return

    if (isMuted) {
      didAgent.unmute()
      setIsMuted(false)
    } else {
      didAgent.mute()
      setIsMuted(true)
    }
  }, [didAgent, isMuted])

  const togglePlayback = useCallback(() => {
    if (!didAgent) return

    if (isPlaying) {
      didAgent.stop()
      setIsPlaying(false)
    } else {
      didAgent.resume()
      setIsPlaying(true)
    }
  }, [didAgent, isPlaying])

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    if (messagesContainerRef.current && messagesEndRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // Handle trigger message
  useEffect(() => {
    if (triggerMessage && isConnected && didAgent) {
      console.log('[Real D-ID Agent] Sending triggered message:', triggerMessage)
      sendMessageToAgent(triggerMessage)
    }
  }, [triggerMessage, isConnected, didAgent, sendMessageToAgent])

  // Initialize on mount
  useEffect(() => {
    initializeDidAgent()

    return () => {
      // Cleanup
      if (didAgent) {
        try {
          didAgent.destroy()
        } catch (error) {
          console.error('[Real D-ID Agent] Cleanup error:', error)
        }
      }
    }
  }, [initializeDidAgent])

  // Retry connection
  const retryConnection = () => {
    setConnectionError(null)
    initializeDidAgent()
  }

  const getStatusColor = () => {
    switch (agentStatus) {
      case 'ready': return 'text-green-600'
      case 'active': return 'text-blue-600'
      case 'error': return 'text-red-600'
      case 'loading_sdk': return 'text-yellow-600'
      case 'creating_agent': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = () => {
    switch (agentStatus) {
      case 'ready': return <User className="h-4 w-4" />
      case 'active': return <MessageCircle className="h-4 w-4" />
      case 'error': return <AlertCircle className="h-4 w-4" />
      case 'loading_sdk': return <Settings className="h-4 w-4 animate-spin" />
      case 'creating_agent': return <Phone className="h-4 w-4" />
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
          id="real-did-agent-container"
        >
          {/* Loading States */}
          {(agentStatus === 'initializing' || agentStatus === 'loading_sdk') && (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-teal-50 to-blue-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Loading D-ID SDK...</p>
                <p className="text-gray-500 text-sm mt-2">Preparing avatar and voice synthesis</p>
              </div>
            </div>
          )}

          {agentStatus === 'creating_agent' && (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-teal-50">
              <div className="text-center">
                <Settings className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600 font-medium">Creating D-ID Agent...</p>
                <p className="text-gray-500 text-sm mt-2">Initializing avatar and voice</p>
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
                  {connectionError || 'Unable to establish connection with D-ID Agent'}
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

          {/* Success State - Video + Chat Interface */}
          {(agentStatus === 'ready' || agentStatus === 'active') && (
            <div className="w-full h-full flex">
              {/* Video Avatar Section */}
              <div className="w-1/2 bg-gradient-to-br from-teal-50 to-blue-50 flex flex-col">
                {/* Video Container */}
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="relative w-full max-w-sm aspect-square bg-white rounded-lg shadow-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted={isMuted}
                      playsInline
                    />
                    
                    {/* Video Controls Overlay */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      <button
                        onClick={toggleMute}
                        className={`p-2 rounded-full ${isMuted ? 'bg-red-500' : 'bg-teal-500'} text-white hover:opacity-80 transition-opacity`}
                      >
                        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </button>
                      
                      <button
                        onClick={toggleListening}
                        className={`p-2 rounded-full ${isListening ? 'bg-red-500' : 'bg-blue-500'} text-white hover:opacity-80 transition-opacity`}
                      >
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </button>
                      
                      <button
                        onClick={togglePlayback}
                        className={`p-2 rounded-full ${isPlaying ? 'bg-orange-500' : 'bg-green-500'} text-white hover:opacity-80 transition-opacity`}
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Speaking Indicator */}
                    {isPlaying && (
                      <div className="absolute top-4 right-4 flex items-center space-x-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span>Speaking</span>
                      </div>
                    )}

                    {/* Listening Indicator */}
                    {isListening && (
                      <div className="absolute top-4 left-4 flex items-center space-x-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span>Listening</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Avatar Info */}
                <div className="p-4 bg-white bg-opacity-80 border-t border-teal-200">
                  <div className="text-center">
                    <h3 className="font-medium text-gray-800">Savannah - AI Bartender</h3>
                    <p className="text-sm text-gray-600">Powered by {currentModel}</p>
                    <div className="flex items-center justify-center mt-2 space-x-4 text-xs text-gray-500">
                      <span>Voice: {isListening ? 'Listening' : 'Ready'}</span>
                      <span>Audio: {isMuted ? 'Muted' : 'Active'}</span>
                      <span>Status: {isPlaying ? 'Speaking' : 'Ready'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Section */}
              <div className="w-1/2 bg-gradient-to-br from-blue-50 to-teal-50 flex flex-col">
                {/* Chat Header */}
                <div className="p-4 bg-white bg-opacity-80 border-b border-teal-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">Live Chat</h3>
                      <p className="text-sm text-gray-600">Voice + Text Interaction</p>
                    </div>
                    <div className="flex items-center text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                      <span className="text-xs font-medium">Live</span>
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
                          Ahoy! I'm Savannah, your AI bartender with voice and video. Try speaking to me or type your message below!
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
                      placeholder="Type your message or use voice..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && inputMessage.trim() && !isTyping) {
                          sendMessageToAgent(inputMessage)
                          setInputMessage('')
                        }
                      }}
                      disabled={isTyping}
                    />
                    <button 
                      onClick={() => {
                        if (inputMessage.trim() && !isTyping) {
                          sendMessageToAgent(inputMessage)
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
                    🎤 Voice enabled • 📹 Video avatar • ⚡ {currentModel} AI
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Voice Controls */}
      {showControls && isConnected && (
        <div className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
            <Mic className="h-5 w-5 mr-2" />
            Voice & Video Controls
          </h4>
          
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={toggleListening}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isListening 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              <span>{isListening ? 'Stop Listening' : 'Start Voice'}</span>
            </button>

            <button
              onClick={toggleMute}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isMuted 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-teal-500 text-white hover:bg-teal-600'
              }`}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              <span>{isMuted ? 'Unmute' : 'Mute'}</span>
            </button>

            <button
              onClick={togglePlayback}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isPlaying 
                  ? 'bg-orange-500 text-white hover:bg-orange-600' 
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span>{isPlaying ? 'Pause' : 'Resume'}</span>
            </button>
          </div>

          <div className="mt-3 text-center text-sm text-gray-600">
            Status: {isListening ? '🎤 Listening' : '⏸️ Voice Off'} • 
            Audio: {isMuted ? '🔇 Muted' : '🔊 Active'} • 
            Avatar: {isPlaying ? '🗣️ Speaking' : '😊 Ready'}
          </div>
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
            <div>Voice: {isListening ? 'Listening' : 'Off'}</div>
            <div>Audio: {isMuted ? 'Muted' : 'Active'}</div>
            <div>Playing: {isPlaying ? 'Yes' : 'No'}</div>
            <div>Error: {connectionError || 'None'}</div>
          </div>
        </details>
      )}
    </div>
  )
}

export default RealDidAgent
