import { useEffect, useRef, useState, useCallback } from 'react'
import { MessageCircle, Mic, MicOff, Volume2, VolumeX, User, AlertCircle, Phone, Settings, Play, Pause, Video, Anchor } from 'lucide-react'
import { createAgentManager, StreamType } from '@d-id/client-sdk'

const NautiBouysDIDAgent = ({ 
  size = 'large', 
  showControls = true, 
  className = '',
  onAgentReady = null,
  onAgentError = null,
  onSessionStart = null,
  onMessage = null,
  triggerMessage = null
}) => {
  const containerRef = useRef(null)
  const videoRef = useRef(null)
  const idleVideoRef = useRef(null)
  const agentManagerRef = useRef(null)
  
  const [agentStatus, setAgentStatus] = useState('initializing')
  const [statusMessage, setStatusMessage] = useState('Installing D-ID SDK...')
  const [isConnected, setIsConnected] = useState(false)
  const [messageCount, setMessageCount] = useState(0)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [connectionError, setConnectionError] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [agentId, setAgentId] = useState(null)
  const [sdkLoaded, setSdkLoaded] = useState(false)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  // Size configurations
  const sizeClasses = {
    small: 'w-64 h-48',
    medium: 'w-96 h-72',
    large: 'w-full h-[600px]'
  }

  const containerClass = sizeClasses[size] || sizeClasses.large

  // D-ID Configuration
  const DID_CONFIG = {
    // You'll need to create an agent in D-ID Studio and get these values
    agentId: import.meta.env.VITE_DID_AGENT_ID || 'your-agent-id-here',
    clientKey: import.meta.env.VITE_DID_CLIENT_KEY || 'your-client-key-here',
    auth: { 
      type: 'key', 
      clientKey: import.meta.env.VITE_DID_CLIENT_KEY || 'your-client-key-here'
    },
    streamOptions: { 
      compatibilityMode: "on", 
      streamWarmup: false, 
      fluent: true // Use new fluent streaming
    }
  }

  // Initialize D-ID SDK (now using npm package)
  const initializeSDK = useCallback(async () => {
    try {
      setStatusMessage('Initializing D-ID SDK...')
      
      // SDK is now imported directly via npm
      setSdkLoaded(true)
      setStatusMessage('D-ID SDK ready!')

    } catch (error) {
      console.error('[D-ID SDK] Initialization error:', error)
      setConnectionError(`Failed to initialize D-ID SDK: ${error.message}`)
      setAgentStatus('error')
    }
  }, [])

  // D-ID SDK Callbacks
  const createCallbacks = useCallback(() => ({
    // Link video element with WebRTC stream
    onSrcObjectReady(srcObject) {
      console.log('[D-ID Agent] SrcObject Ready')
      if (videoRef.current) {
        videoRef.current.srcObject = srcObject
      }
      return srcObject
    },

    // Connection state changes
    onConnectionStateChange(state) {
      console.log('[D-ID Agent] Connection State:', state)
      
      if (state === 'connecting') {
        setAgentStatus('loading')
        setStatusMessage('Connecting to Savannah...')
        setIsConnected(false)
        
        // Show agent info if available
        if (agentManagerRef.current?.agent) {
          const agent = agentManagerRef.current.agent
          console.log('[D-ID Agent] Agent info:', agent)
          
          // Set idle video if available
          if (idleVideoRef.current && agent.presenter?.idle_video) {
            idleVideoRef.current.src = agent.presenter.idle_video
            idleVideoRef.current.play().catch(e => console.warn('Idle video play failed:', e))
          }
        }
      }
      else if (state === 'connected') {
        setAgentStatus('ready')
        setStatusMessage('Savannah is Ready!')
        setIsConnected(true)
        setConnectionError(null)
        
        // Add welcome message
        if (agentManagerRef.current?.agent?.greetings?.[0]) {
          const welcomeMessage = {
            id: Date.now(),
            type: 'assistant',
            content: agentManagerRef.current.agent.greetings[0],
            timestamp: new Date()
          }
          setMessages(prev => [...prev, welcomeMessage])
        }

        if (onAgentReady) {
          onAgentReady({ 
            sessionId: sessionId, 
            agentId: DID_CONFIG.agentId,
            status: 'ready'
          })
        }

        if (onSessionStart) {
          onSessionStart({ 
            sessionId: sessionId, 
            agent: true,
            agentId: DID_CONFIG.agentId
          })
        }
      }
      else if (state === 'disconnected' || state === 'closed') {
        setAgentStatus('error')
        setStatusMessage('Disconnected from Savannah')
        setIsConnected(false)
      }
    },

    // Video state changes
    onVideoStateChange(state) {
      console.log('[D-ID Agent] Video State:', state)
      
      if (state === 'START') {
        setIsPlaying(true)
        // Show streaming video, hide idle video
        if (videoRef.current && idleVideoRef.current) {
          videoRef.current.style.opacity = '1'
          idleVideoRef.current.style.opacity = '0'
        }
      } else {
        setIsPlaying(false)
        // Show idle video, hide streaming video
        if (videoRef.current && idleVideoRef.current) {
          videoRef.current.style.opacity = '0'
          idleVideoRef.current.style.opacity = '1'
        }
      }
    },

    // New messages
    onNewMessage(messages, type) {
      console.log('[D-ID Agent] New Message:', messages, type)
      
      if (messages && messages.length > 0) {
        const lastMessage = messages[messages.length - 1]
        
        if (lastMessage && lastMessage.role === 'assistant' && type === 'answer') {
          const agentMessage = {
            id: lastMessage.id || Date.now(),
            type: 'assistant',
            content: lastMessage.content,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, agentMessage])
          setStatusMessage('Savannah is Ready!')
          setIsTyping(false)
        }
      }
    },

    // Agent activity state
    onAgentActivityStateChange(state) {
      console.log('[D-ID Agent] Activity State:', state)
      if (state === 'talking') {
        setIsPlaying(true)
      } else {
        setIsPlaying(false)
      }
    },

    // Error handling
    onError(error, errorData) {
      console.error('[D-ID Agent] Error:', error, errorData)
      setConnectionError(`Agent error: ${error}`)
      setAgentStatus('error')
      setStatusMessage('Connection error')
      
      if (onAgentError) {
        onAgentError(new Error(error))
      }
    }
  }), [sessionId, onAgentReady, onAgentError, onSessionStart])

  // Initialize D-ID Agent
  const initializeAgent = useCallback(async () => {
    try {
      if (!sdkLoaded) {
        console.log('[D-ID Agent] SDK not loaded yet')
        return
      }

      if (!createAgentManager) {
        throw new Error('D-ID SDK not properly loaded')
      }

      if (!DID_CONFIG.agentId || DID_CONFIG.agentId === 'your-agent-id-here') {
        throw new Error('Please set VITE_DID_AGENT_ID in your .env file')
      }

      if (!DID_CONFIG.clientKey || DID_CONFIG.clientKey === 'your-client-key-here') {
        throw new Error('Please set VITE_DID_CLIENT_KEY in your .env file')
      }

      setAgentStatus('loading')
      setStatusMessage('Creating Savannah Agent Manager...')

      // Generate session ID
      const agentSessionId = `nauti_agent_${Date.now()}`
      setSessionId(agentSessionId)
      setAgentId(DID_CONFIG.agentId)

      console.log('[D-ID Agent] Creating agent manager with:', {
        agentId: DID_CONFIG.agentId,
        auth: DID_CONFIG.auth,
        streamOptions: DID_CONFIG.streamOptions
      })

      // Create agent manager using D-ID SDK
      const agentManager = await createAgentManager(
        DID_CONFIG.agentId,
        {
          auth: DID_CONFIG.auth,
          callbacks: createCallbacks(),
          streamOptions: DID_CONFIG.streamOptions
        }
      )

      agentManagerRef.current = agentManager
      console.log('[D-ID Agent] Agent Manager created:', agentManager)

      setStatusMessage('Connecting to Savannah...')
      
      // Connect to agent
      await agentManager.connect()
      
      console.log('[D-ID Agent] Connected successfully')

    } catch (error) {
      console.error('[D-ID Agent] Initialization error:', error)
      setAgentStatus('error')
      setStatusMessage(`Failed to initialize: ${error.message}`)
      setConnectionError(error.message)
      
      if (onAgentError) {
        onAgentError(error)
      }
    }
  }, [sdkLoaded, createCallbacks, onAgentError])

  // Send message to agent
  const sendMessageToAgent = useCallback(async (message) => {
    if (!message.trim() || !agentManagerRef.current || !isConnected) {
      console.log('[D-ID Agent] Cannot send message - not ready')
      return
    }

    try {
      setIsTyping(true)
      setStatusMessage('Savannah is thinking...')

      // Add user message to chat
      const userMessage = {
        id: Date.now(),
        type: 'user',
        content: message,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, userMessage])
      setMessageCount(prev => prev + 1)

      console.log('[D-ID Agent] Sending chat message:', message)

      // Send message using D-ID SDK
      await agentManagerRef.current.chat(message)

      if (onMessage) {
        onMessage({ content: message, type: 'user' })
      }

    } catch (error) {
      console.error('[D-ID Agent] Send message error:', error)
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: `Failed to send message: ${error.message}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      setStatusMessage('Message failed - Ready to retry')
      setIsTyping(false)
    }
  }, [isConnected, onMessage])

  // Send message (user interface)
  const sendMessage = useCallback(async (message) => {
    if (!message.trim()) return
    await sendMessageToAgent(message)
  }, [sendMessageToAgent])

  // Voice controls
  const toggleListening = useCallback(() => {
    setIsListening(!isListening)
    // TODO: Implement speech recognition
  }, [isListening])

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }, [isMuted])

  // Auto-scroll messages
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
    if (triggerMessage && isConnected) {
      console.log('[D-ID Agent] Sending triggered message:', triggerMessage)
      sendMessage(triggerMessage)
    }
  }, [triggerMessage, isConnected, sendMessage])

  // Initialize SDK on mount
  useEffect(() => {
    initializeSDK()
  }, [initializeSDK])

  // Initialize agent when SDK is loaded
  useEffect(() => {
    if (sdkLoaded) {
      initializeAgent()
    }
  }, [sdkLoaded, initializeAgent])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (agentManagerRef.current) {
        try {
          agentManagerRef.current.disconnect()
        } catch (error) {
          console.warn('[D-ID Agent] Cleanup error:', error)
        }
      }
    }
  }, [])

  // Retry connection
  const retryConnection = () => {
    setConnectionError(null)
    if (sdkLoaded) {
      initializeAgent()
    } else {
      initializeSDK()
    }
  }

  const getStatusColor = () => {
    switch (agentStatus) {
      case 'ready': return 'text-green-600'
      case 'active': return 'text-blue-600'
      case 'error': return 'text-red-600'
      case 'loading': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = () => {
    switch (agentStatus) {
      case 'ready': return <Anchor className="h-4 w-4" />
      case 'active': return <MessageCircle className="h-4 w-4" />
      case 'error': return <AlertCircle className="h-4 w-4" />
      case 'loading': return <Settings className="h-4 w-4 animate-spin" />
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
                <span className="text-xs font-medium">Connecting...</span>
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
          id="nauti-bouys-did-agent-container"
        >
          {/* Loading State */}
          {agentStatus === 'loading' && (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-teal-50 to-blue-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Setting up Savannah with D-ID SDK...</p>
                <p className="text-gray-500 text-sm mt-2">Loading agent manager and establishing connection</p>
              </div>
            </div>
          )}
          
          {/* Error State */}
          {agentStatus === 'error' && (
            <div className="flex items-center justify-center h-full bg-red-50">
              <div className="text-center max-w-md">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 font-medium mb-2">Agent Connection Failed</p>
                <p className="text-red-500 text-sm mb-4">
                  {connectionError || 'Unable to initialize D-ID Agent'}
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

          {/* Success State - D-ID Agent + Chat Interface */}
          {(agentStatus === 'ready' || agentStatus === 'active') && (
            <div className="w-full h-full flex">
              {/* D-ID Agent Video Section */}
              <div className="w-1/2 bg-gradient-to-br from-teal-50 to-blue-50 flex flex-col">
                {/* Agent Video Container */}
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="relative w-full max-w-sm aspect-square rounded-lg shadow-lg overflow-hidden">
                    {/* D-ID Agent Video Stream */}
                    <video
                      ref={videoRef}
                      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                      autoPlay
                      playsInline
                      muted={isMuted}
                      style={{ opacity: isPlaying ? 1 : 0 }}
                    />
                    
                    {/* Idle Video */}
                    <video
                      ref={idleVideoRef}
                      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                      autoPlay
                      loop
                      muted
                      playsInline
                      style={{ opacity: isPlaying ? 0 : 1 }}
                    />
                    
                    {/* Fallback Avatar Image */}
                    {!isPlaying && !idleVideoRef.current?.src && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-teal-100 to-blue-100">
                        <div className="text-center">
                          <Anchor className="h-16 w-16 text-teal-600 mx-auto mb-4" />
                          <p className="text-teal-700 font-medium">Savannah</p>
                          <p className="text-teal-600 text-sm">AI Bartender</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Agent Controls Overlay */}
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
                        title="Voice input (coming soon)"
                      >
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </button>
                      
                      <button
                        className="p-2 rounded-full bg-green-500 text-white hover:opacity-80 transition-opacity"
                        title="D-ID Agent active"
                      >
                        <Video className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Speaking Indicator */}
                    {isPlaying && (
                      <div className="absolute top-4 right-4 flex items-center space-x-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span>Speaking</span>
                      </div>
                    )}

                    {/* Processing Indicator */}
                    {isTyping && (
                      <div className="absolute top-4 right-4 flex items-center space-x-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span>Thinking</span>
                      </div>
                    )}

                    {/* D-ID Agent Live Indicator */}
                    <div className="absolute top-4 left-4 flex items-center space-x-2 bg-purple-500 text-white px-2 py-1 rounded-full text-xs">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span>D-ID Agent</span>
                    </div>
                  </div>
                </div>

                {/* Agent Info */}
                <div className="p-4 bg-white bg-opacity-80 border-t border-teal-200">
                  <div className="text-center">
                    <h3 className="font-medium text-gray-800">Savannah - AI Bartender</h3>
                    <p className="text-sm text-gray-600">D-ID Agent + Gemini 2.5 Flash</p>
                    <div className="flex items-center justify-center mt-2 space-x-4 text-xs text-gray-500">
                      <span>Agent: {isConnected ? 'Active' : 'Loading'}</span>
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
                      <h3 className="font-medium text-gray-800">Live Agent Chat</h3>
                      <p className="text-sm text-gray-600">D-ID Agent + WebRTC Stream</p>
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
                          {message.type === 'user' ? <User className="h-4 w-4 text-white" /> : <Anchor className="h-4 w-4 text-white" />}
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
                          <Anchor className="h-4 w-4 text-white" />
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
                      placeholder="Ask Savannah about cocktails, spirits, or wines..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && inputMessage.trim() && !isTyping) {
                          sendMessage(inputMessage)
                          setInputMessage('')
                        }
                      }}
                      disabled={isTyping || !isConnected}
                    />
                    <button 
                      onClick={() => {
                        if (inputMessage.trim() && !isTyping) {
                          sendMessage(inputMessage)
                          setInputMessage('')
                        }
                      }}
                      disabled={!inputMessage.trim() || isTyping || !isConnected}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isTyping ? 'Processing...' : 'Send'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    🎯 D-ID Agent SDK • 🗣️ WebRTC Stream • ⚡ Gemini 2.5 Flash AI
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Agent Controls */}
      {showControls && isConnected && (
        <div className="bg-gradient-to-r from-purple-50 to-teal-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
            <Video className="h-5 w-5 mr-2" />
            D-ID Agent Controls
          </h4>
          
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-700">Agent Active</span>
            </div>

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
              onClick={toggleListening}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isListening 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              <span>{isListening ? 'Stop Voice' : 'Voice Input'}</span>
            </button>

            <div className="flex items-center space-x-2 px-3 py-2 bg-blue-100 rounded-lg">
              <MessageCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-700">Messages: {messageCount}</span>
            </div>
          </div>

          <div className="mt-3 text-center text-sm text-gray-600">
            Agent: {agentId?.substring(0, 8)}... • 
            Session: {sessionId?.substring(0, 8)}... • 
            Status: {isPlaying ? '🗣️ Speaking' : '😊 Ready'}
          </div>
        </div>
      )}

      {/* D-ID Agent Notice */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-semibold text-green-800 mb-2 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          D-ID Agent SDK Implementation
        </h4>
        <p className="text-sm text-green-700">
          This component uses the official D-ID Agent SDK with your existing Gemini 2.5 Flash backend. 
          The SDK handles all WebRTC complexity automatically, providing professional avatar presentation 
          with your custom AI intelligence. To use this component, you need to:
        </p>
        <ul className="text-sm text-green-700 mt-2 ml-4 list-disc">
          <li>Create an agent in D-ID Studio</li>
          <li>Set VITE_DID_AGENT_ID and VITE_DID_CLIENT_KEY in your .env file</li>
          <li>Configure your agent to use external LLM pointing to your Gemini backend</li>
        </ul>
      </div>

      {/* Debug Info (development only) */}
      {import.meta.env.DEV && (
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer hover:text-gray-700">Debug Information</summary>
          <div className="mt-2 p-3 bg-gray-100 rounded font-mono">
            <div>Status: {agentStatus}</div>
            <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
            <div>SDK Loaded: {sdkLoaded ? 'Yes' : 'No'}</div>
            <div>Session ID: {sessionId || 'None'}</div>
            <div>Agent ID: {agentId || 'None'}</div>
            <div>Message Count: {messageCount}</div>
            <div>Audio: {isMuted ? 'Muted' : 'Active'}</div>
            <div>Voice: {isListening ? 'Listening' : 'Off'}</div>
            <div>Playing: {isPlaying ? 'Yes' : 'No'}</div>
            <div>Error: {connectionError || 'None'}</div>
          </div>
        </details>
      )}
    </div>
  )
}

export default NautiBouysDIDAgent
