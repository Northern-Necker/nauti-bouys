import { useEffect, useRef, useState, useCallback } from 'react'
import { MessageCircle, Mic, MicOff, Volume2, VolumeX, User, AlertCircle, Phone, Settings, Play, Pause, Video } from 'lucide-react'

const StreamingDidAgent = ({ 
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
  const peerConnectionRef = useRef(null)
  const streamIdRef = useRef(null)
  const sessionIdRef = useRef(null)
  
  const [agentStatus, setAgentStatus] = useState('initializing')
  const [statusMessage, setStatusMessage] = useState('Initializing D-ID Streaming...')
  const [isConnected, setIsConnected] = useState(false)
  const [messageCount, setMessageCount] = useState(0)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [connectionError, setConnectionError] = useState(null)
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

  // D-ID API Configuration
  const DID_API = {
    key: import.meta.env.VITE_DID_API_KEY,
    url: 'https://api.d-id.com',
    service: 'talks'
  }

  // Create D-ID Stream
  const createStream = useCallback(async () => {
    try {
      setAgentStatus('creating_stream')
      setStatusMessage('Creating D-ID stream...')

      const response = await fetch(`${DID_API.url}/talks/streams`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${DID_API.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_url: "https://clips-presenters.d-id.com/v2/Alyssa_NoHands_RedSuite_Lobby/qtzjxMSwEa/ypTds_0CK3/image.png",
          voice: {
            type: "microsoft",
            voice_id: "en-US-JennyMultilingualV2Neural"
          }
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to create stream: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('[Streaming D-ID] Stream created:', data)
      
      streamIdRef.current = data.id
      sessionIdRef.current = data.session_id

      return data
    } catch (error) {
      console.error('[Streaming D-ID] Create stream error:', error)
      throw error
    }
  }, [])

  // Setup WebRTC connection
  const setupWebRTC = useCallback(async (streamData) => {
    try {
      setAgentStatus('connecting_webrtc')
      setStatusMessage('Connecting WebRTC...')

      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      })

      peerConnectionRef.current = peerConnection

      // Handle incoming video stream
      peerConnection.ontrack = (event) => {
        console.log('[Streaming D-ID] Received video track')
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0]
        }
      }

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('[Streaming D-ID] Connection state:', peerConnection.connectionState)
        if (peerConnection.connectionState === 'connected') {
          setIsConnected(true)
          setAgentStatus('ready')
          setStatusMessage('AI Assistant Ready')
          setConnectionError(null)
          
          if (onAgentReady) {
            onAgentReady({ sessionId: sessionIdRef.current, streamId: streamIdRef.current })
          }
        } else if (peerConnection.connectionState === 'failed') {
          setConnectionError('WebRTC connection failed')
          setAgentStatus('error')
          setStatusMessage('Connection Failed')
        }
      }

      // Create offer
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)

      // Send offer to D-ID
      const response = await fetch(`${DID_API.url}/talks/streams/${streamIdRef.current}/sdp`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${DID_API.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answer: {
            type: 'offer',
            sdp: offer.sdp,
          },
          session_id: sessionIdRef.current,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to send SDP offer: ${response.status}`)
      }

      const answerData = await response.json()
      console.log('[Streaming D-ID] Received SDP answer:', answerData)

      // Set remote description
      await peerConnection.setRemoteDescription(answerData.answer)

      if (onSessionStart) {
        onSessionStart({ 
          sessionId: sessionIdRef.current, 
          streamId: streamIdRef.current,
          streamData 
        })
      }

    } catch (error) {
      console.error('[Streaming D-ID] WebRTC setup error:', error)
      throw error
    }
  }, [onAgentReady, onSessionStart])

  // Send message to D-ID
  const sendMessageToDidAPI = useCallback(async (message) => {
    if (!streamIdRef.current || !sessionIdRef.current) {
      console.log('[Streaming D-ID] No stream or session available')
      return
    }

    try {
      setIsTyping(true)
      setIsPlaying(true)

      // Send message to our backend webhook to get AI response
      const webhookResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/d-id-agent/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          sessionId: sessionIdRef.current,
          agentId: 'streaming_agent'
        }),
      })

      if (!webhookResponse.ok) {
        throw new Error(`Webhook failed: ${webhookResponse.status}`)
      }

      const webhookData = await webhookResponse.json()
      console.log('[Streaming D-ID] Webhook response:', webhookData)

      // Send the AI response to D-ID for speech synthesis
      const talkResponse = await fetch(`${DID_API.url}/talks/streams/${streamIdRef.current}`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${DID_API.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: {
            type: 'text',
            input: webhookData.response,
            provider: {
              type: 'microsoft',
              voice_id: 'en-US-JennyMultilingualV2Neural'
            }
          },
          session_id: sessionIdRef.current,
        }),
      })

      if (!talkResponse.ok) {
        throw new Error(`Failed to send talk: ${talkResponse.status}`)
      }

      // Add AI response to chat
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: webhookData.response,
        timestamp: new Date(),
        emotion: webhookData.emotion || 'friendly'
      }
      setMessages(prev => [...prev, aiMessage])
      setMessageCount(prev => prev + 1)

      if (onMessage) {
        onMessage({ content: webhookData.response, emotion: webhookData.emotion })
      }

    } catch (error) {
      console.error('[Streaming D-ID] Send message error:', error)
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
      // isPlaying will be set to false when the avatar finishes speaking
      setTimeout(() => setIsPlaying(false), 3000) // Fallback timeout
    }
  }, [onMessage])

  // Send message (user interface)
  const sendMessage = useCallback(async (message) => {
    if (!message.trim()) return

    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setMessageCount(prev => prev + 1)

    // Send to D-ID API
    await sendMessageToDidAPI(message)
  }, [sendMessageToDidAPI])

  // Initialize D-ID Streaming
  const initializeStreaming = useCallback(async () => {
    try {
      console.log('[Streaming D-ID] Initializing...')
      
      const streamData = await createStream()
      await setupWebRTC(streamData)

    } catch (error) {
      console.error('[Streaming D-ID] Initialization error:', error)
      setAgentStatus('error')
      setStatusMessage(`Failed to initialize: ${error.message}`)
      setConnectionError(error.message)
      
      if (onAgentError) {
        onAgentError(error)
      }
    }
  }, [createStream, setupWebRTC, onAgentError])

  // Voice controls (placeholder - would need additional implementation)
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
      console.log('[Streaming D-ID] Sending triggered message:', triggerMessage)
      sendMessage(triggerMessage)
    }
  }, [triggerMessage, isConnected, sendMessage])

  // Initialize on mount
  useEffect(() => {
    initializeStreaming()

    return () => {
      // Cleanup
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
      }
      if (streamIdRef.current) {
        // Delete stream
        fetch(`${DID_API.url}/talks/streams/${streamIdRef.current}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Basic ${DID_API.key}`,
          },
        }).catch(console.error)
      }
    }
  }, [initializeStreaming])

  // Retry connection
  const retryConnection = () => {
    setConnectionError(null)
    initializeStreaming()
  }

  const getStatusColor = () => {
    switch (agentStatus) {
      case 'ready': return 'text-green-600'
      case 'active': return 'text-blue-600'
      case 'error': return 'text-red-600'
      case 'creating_stream': return 'text-yellow-600'
      case 'connecting_webrtc': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = () => {
    switch (agentStatus) {
      case 'ready': return <User className="h-4 w-4" />
      case 'active': return <MessageCircle className="h-4 w-4" />
      case 'error': return <AlertCircle className="h-4 w-4" />
      case 'creating_stream': return <Settings className="h-4 w-4 animate-spin" />
      case 'connecting_webrtc': return <Phone className="h-4 w-4" />
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
            {sessionIdRef.current && (
              <div className="text-xs text-gray-500 mt-1">
                Session: {sessionIdRef.current.substring(0, 12)}...
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

      {/* D-ID Streaming Container */}
      <div className={`${containerClass} bg-white rounded-lg shadow-lg border-2 border-teal-200 overflow-hidden relative`}>
        <div 
          ref={containerRef}
          className="w-full h-full"
          id="streaming-did-agent-container"
        >
          {/* Loading States */}
          {(agentStatus === 'initializing' || agentStatus === 'creating_stream') && (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-teal-50 to-blue-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Creating D-ID Stream...</p>
                <p className="text-gray-500 text-sm mt-2">Setting up avatar and voice synthesis</p>
              </div>
            </div>
          )}

          {agentStatus === 'connecting_webrtc' && (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-teal-50">
              <div className="text-center">
                <Phone className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
                <p className="text-gray-600 font-medium">Connecting WebRTC...</p>
                <p className="text-gray-500 text-sm mt-2">Establishing video connection</p>
              </div>
            </div>
          )}
          
          {/* Error State */}
          {agentStatus === 'error' && (
            <div className="flex items-center justify-center h-full bg-red-50">
              <div className="text-center max-w-md">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 font-medium mb-2">Connection Failed</p>
                <p className="text-red-500 text-sm mb-4">
                  {connectionError || 'Unable to establish connection with D-ID Streaming API'}
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
                  <div className="relative w-full max-w-sm aspect-square bg-black rounded-lg shadow-lg overflow-hidden">
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
                        title="Voice input (coming soon)"
                      >
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </button>
                      
                      <button
                        className="p-2 rounded-full bg-green-500 text-white hover:opacity-80 transition-opacity"
                        title="Video stream active"
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

                    {/* Connection Status */}
                    <div className="absolute top-4 left-4 flex items-center space-x-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span>Live</span>
                    </div>
                  </div>
                </div>

                {/* Avatar Info */}
                <div className="p-4 bg-white bg-opacity-80 border-t border-teal-200">
                  <div className="text-center">
                    <h3 className="font-medium text-gray-800">Savannah - AI Bartender</h3>
                    <p className="text-sm text-gray-600">D-ID Streaming + Gemini 2.5 Flash</p>
                    <div className="flex items-center justify-center mt-2 space-x-4 text-xs text-gray-500">
                      <span>Stream: {streamIdRef.current ? 'Active' : 'Inactive'}</span>
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
                      <p className="text-sm text-gray-600">Text + Voice Sync</p>
                    </div>
                    <div className="flex items-center text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                      <span className="text-xs font-medium">Streaming</span>
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
                          Ahoy! I'm Savannah, your AI bartender with live video and voice sync. Type your message and watch me respond with synchronized speech!
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
                      placeholder="Type your message to see voice sync..."
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
                      {isTyping ? 'Speaking...' : 'Send'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    🎬 Live video • 🗣️ Voice sync • ⚡ Gemini 2.5 Flash AI
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      {showControls && isConnected && (
        <div className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
            <Video className="h-5 w-5 mr-2" />
            D-ID Streaming Controls
          </h4>
          
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-700">Live Stream Active</span>
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

            <div className="flex items-center space-x-2 px-3 py-2 bg-blue-100 rounded-lg">
              <MessageCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-700">Messages: {messageCount}</span>
            </div>
          </div>

          <div className="mt-3 text-center text-sm text-gray-600">
            Stream ID: {streamIdRef.current?.substring(0, 8)}... • 
            Session: {sessionIdRef.current?.substring(0, 8)}... • 
            Status: {isPlaying ? '🗣️ Speaking' : '😊 Ready'}
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
            <div>Stream ID: {streamIdRef.current || 'None'}</div>
            <div>Session ID: {sessionIdRef.current || 'None'}</div>
            <div>Message Count: {messageCount}</div>
            <div>Audio: {isMuted ? 'Muted' : 'Active'}</div>
            <div>Playing: {isPlaying ? 'Yes' : 'No'}</div>
            <div>Error: {connectionError || 'None'}</div>
          </div>
        </details>
      )}
    </div>
  )
}

export default StreamingDidAgent
