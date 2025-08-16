import { useEffect, useRef, useState, useCallback } from 'react'
import { MessageCircle, Mic, MicOff, Volume2, VolumeX, User, AlertCircle, Phone, Settings, Play, Pause, Video } from 'lucide-react'
import { getHttpStatusMessage } from '../../utils/httpStatusMessages'

const VisibleDidAvatar = ({ 
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
  const canvasRef = useRef(null)
  
  const [agentStatus, setAgentStatus] = useState('initializing')
  const [statusMessage, setStatusMessage] = useState('Initializing D-ID Avatar...')
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
  const [currentTalkId, setCurrentTalkId] = useState(null)
  const [avatarImageLoaded, setAvatarImageLoaded] = useState(false)
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

  // Avatar configuration - Use Alyssa (Red Suit Lobby) as Savannah avatar
  const [avatarConfig, setAvatarConfig] = useState({
    source_url: "https://clips-presenters.d-id.com/v2/Alyssa_NoHands_RedSuite_Lobby/qtzjxMSwEa/ypTds_0CK3/image.png", // Alyssa avatar
    image_url: null,
    avatar_id: null,
    voice_id: null,
    voice: {
      type: "microsoft",
      voice_id: "en-US-JennyMultilingualV2Neural"
    }
  })

  // Fetch specific Savannah avatar by ID from D-ID API
  const fetchSavannahAvatar = useCallback(async () => {
    try {
      // First try to get the specific Savannah avatar by ID
      const SAVANNAH_AVATAR_ID = '25efdee1cd09408fa22ce2036cf52540'
      console.log('[D-ID Avatar] Fetching Savannah avatar by ID:', SAVANNAH_AVATAR_ID)
      
      const specificResponse = await fetch(`${DID_API.url}/scenes/avatars/${SAVANNAH_AVATAR_ID}`, {
        headers: {
          'Authorization': `Basic ${DID_API.key}`,
          'Accept': 'application/json',
        },
      })

      if (specificResponse.ok) {
        const savannahAvatar = await specificResponse.json()
        console.log('[D-ID Avatar] Found Savannah avatar by ID:', savannahAvatar.id, savannahAvatar.name)
        
        if (savannahAvatar.status === 'done') {
          setAvatarConfig(prev => ({
            ...prev,
            source_url: savannahAvatar.image_url || savannahAvatar.source_url,
            image_url: savannahAvatar.image_url,
            avatar_id: savannahAvatar.id,
            voice_id: savannahAvatar.voice_id,
            voice: savannahAvatar.voice_id ? {
              type: "elevenlabs",
              voice_id: savannahAvatar.voice_id
            } : prev.voice
          }))
          return savannahAvatar
        }
      }

      // Fallback: Search all avatars if direct ID lookup fails
      console.log('[D-ID Avatar] Direct ID lookup failed, searching all avatars...')
      const response = await fetch(`${DID_API.url}/scenes/avatars?limit=100`, {
        headers: {
          'Authorization': `Basic ${DID_API.key}`,
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch avatars: ${getHttpStatusMessage(response.status)}`)
      }

      const data = await response.json()
      console.log('[D-ID Avatar] Available avatars:', data.avatars?.length || 0)
      
      // Log all avatar names for debugging
      if (data.avatars) {
        console.log('[D-ID Avatar] Avatar names:', data.avatars.map(a => `${a.id}: "${a.name}" (${a.status})`))
      }

      // Look for Savannah avatar by ID first, then by name variations
      const savannahAvatar = data.avatars?.find(avatar => 
        (avatar.id === SAVANNAH_AVATAR_ID || 
         avatar.name?.toLowerCase().includes('savannah') ||
         avatar.name?.toLowerCase().includes('savanah')) && 
        avatar.status === 'done'
      )

      if (savannahAvatar) {
        console.log('[D-ID Avatar] Found Savannah avatar:', savannahAvatar.id, savannahAvatar.name)
        setAvatarConfig(prev => ({
          ...prev,
          source_url: savannahAvatar.image_url || savannahAvatar.source_url,
          image_url: savannahAvatar.image_url,
          avatar_id: savannahAvatar.id,
          voice_id: savannahAvatar.voice_id,
          voice: savannahAvatar.voice_id ? {
            type: "elevenlabs",
            voice_id: savannahAvatar.voice_id
          } : prev.voice
        }))
        return savannahAvatar
      } else {
        console.log('[D-ID Avatar] No Savannah avatar found, using fallback')
        return null
      }

    } catch (error) {
      console.error('[D-ID Avatar] Error fetching avatars:', error)
      return null
    }
  }, [])

  // Initialize D-ID Avatar
  const initializeAvatar = useCallback(async () => {
    try {
      setAgentStatus('loading')
      setStatusMessage('Fetching your Savannah avatar...')

      // Generate session ID
      const avatarSessionId = `avatar_${Date.now()}`
      setSessionId(avatarSessionId)

      // Try to fetch existing Savannah avatar
      const savannahAvatar = await fetchSavannahAvatar()
      
      if (savannahAvatar) {
        setStatusMessage('Loading Savannah avatar...')
      } else {
        setStatusMessage('Using fallback avatar...')
      }

      // Load the avatar image first (without crossOrigin to avoid CORS issues)
      const img = new Image()
      img.onload = () => {
        setAvatarImageLoaded(true)
        console.log('[D-ID Avatar] Avatar image loaded successfully')
      }
      img.onerror = () => {
        console.error('[D-ID Avatar] Failed to load avatar image')
        setAvatarImageLoaded(true) // Continue anyway
      }
      img.src = avatarConfig.source_url

      // Wait for image load
      await new Promise(resolve => setTimeout(resolve, 2000))

      setAgentStatus('ready')
      setStatusMessage(savannahAvatar ? 'Savannah Avatar Ready' : 'AI Avatar Ready')
      setIsConnected(true)
      setConnectionError(null)

      if (onAgentReady) {
        onAgentReady({ 
          sessionId: avatarSessionId, 
          status: 'ready',
          avatar: savannahAvatar || 'fallback'
        })
      }

      if (onSessionStart) {
        onSessionStart({ 
          sessionId: avatarSessionId, 
          avatar: true,
          avatarId: savannahAvatar?.id || 'fallback'
        })
      }

    } catch (error) {
      console.error('[D-ID Avatar] Initialization error:', error)
      setAgentStatus('error')
      setStatusMessage(`Failed to initialize: ${error.message}`)
      setConnectionError(error.message)
      
      if (onAgentError) {
        onAgentError(error)
      }
    }
  }, [fetchSavannahAvatar, avatarConfig.source_url, onAgentReady, onAgentError, onSessionStart])

  // Create D-ID Talk with lip sync
  const createTalkWithLipSync = useCallback(async (text) => {
    try {
      console.log('[D-ID Avatar] Creating talk with text:', text.substring(0, 100) + '...')
      
      const response = await fetch(`${DID_API.url}/talks`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${DID_API.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: {
            type: 'text',
            input: text,
            provider: avatarConfig.voice
          },
          config: {
            fluent: false,
            pad_audio: 0.0,
            driver_expressions: {
              expressions: [
                { start_frame: 0, expression: 'neutral', intensity: 1.0 }
              ]
            }
          },
          source_url: avatarConfig.source_url
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('[D-ID Avatar] API Error Response:', errorData)
        throw new Error(`D-ID API Error: ${getHttpStatusMessage(response.status)} - ${errorData}`)
      }

      const talkData = await response.json()
      console.log('[D-ID Avatar] Talk created successfully:', talkData.id)
      
      setCurrentTalkId(talkData.id)
      return talkData

    } catch (error) {
      console.error('[D-ID Avatar] Create talk error:', error)
      throw error
    }
  }, [])

  // Get talk status and video
  const getTalkStatus = useCallback(async (talkId) => {
    try {
      const response = await fetch(`${DID_API.url}/talks/${talkId}`, {
        headers: {
          'Authorization': `Basic ${DID_API.key}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to get talk status: ${getHttpStatusMessage(response.status)}`)
      }

      const talkData = await response.json()
      console.log('[D-ID Avatar] Talk status:', talkData.status, talkData.id)
      
      return talkData

    } catch (error) {
      console.error('[D-ID Avatar] Get talk status error:', error)
      throw error
    }
  }, [])

  // Poll for talk completion and play video
  const pollTalkCompletion = useCallback(async (talkId) => {
    const maxAttempts = 60 // 60 seconds max
    let attempts = 0

    const poll = async () => {
      try {
        attempts++
        const talkData = await getTalkStatus(talkId)

        if (talkData.status === 'done' && talkData.result_url) {
          console.log('[D-ID Avatar] Talk completed! Playing video:', talkData.result_url)
          
          // Set video source and play
          if (videoRef.current) {
            videoRef.current.src = talkData.result_url
            videoRef.current.load()
            
            // Play the video with lip sync
            try {
              await videoRef.current.play()
              setIsPlaying(true)
              
              // Set up event listeners
              videoRef.current.onended = () => {
                setIsPlaying(false)
                console.log('[D-ID Avatar] Video playback ended')
              }
              
              videoRef.current.onerror = (e) => {
                console.error('[D-ID Avatar] Video playback error:', e)
                setIsPlaying(false)
              }
              
            } catch (playError) {
              console.error('[D-ID Avatar] Video play error:', playError)
              setIsPlaying(false)
            }
          }
          
          return talkData
          
        } else if (talkData.status === 'error') {
          throw new Error(`Talk generation failed: ${talkData.error?.message || 'Unknown error'}`)
          
        } else if (attempts >= maxAttempts) {
          throw new Error('Talk generation timeout - please try again later')
          
        } else {
          // Continue polling
          console.log(`[D-ID Avatar] Polling attempt ${attempts}/60, status: ${talkData.status}`)
          setTimeout(poll, 2000) // Poll every 2 seconds
        }
        
      } catch (error) {
        console.error('[D-ID Avatar] Poll error:', error)
        setIsPlaying(false)
        throw error
      }
    }

    return poll()
  }, [getTalkStatus])

  // Send message to Gemini and create D-ID talk
  const sendMessageWithLipSync = useCallback(async (message) => {
    if (!message.trim() || !sessionId) {
      console.log('[D-ID Avatar] No message or session ID')
      return
    }

    try {
      setIsTyping(true)
      setIsPlaying(false)
      setStatusMessage('Processing with Gemini 2.5 Flash...')

      // Add user message to chat
      const userMessage = {
        id: Date.now(),
        type: 'user',
        content: message,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, userMessage])
      setMessageCount(prev => prev + 1)

      // Send to Gemini 2.5 Flash via webhook
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/d-id-agent/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          sessionId: sessionId,
          agentId: 'visible_avatar_agent'
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `Webhook failed: ${getHttpStatusMessage(response.status)}`)
      }

      const data = await response.json()
      console.log('[D-ID Avatar] Gemini response received')

      // Add AI response to chat
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
        emotion: data.emotion || 'friendly'
      }
      setMessages(prev => [...prev, aiMessage])
      setMessageCount(prev => prev + 1)

      // Create D-ID talk with lip sync
      setStatusMessage('Generating avatar speech...')
      const talkData = await createTalkWithLipSync(data.response)
      
      // Poll for completion and play video
      setStatusMessage('Processing lip sync...')
      await pollTalkCompletion(talkData.id)
      
      setStatusMessage('AI Avatar Ready')

      if (onMessage) {
        onMessage({ content: data.response, emotion: data.emotion, talkId: talkData.id })
      }

    } catch (error) {
      console.error('[D-ID Avatar] Send message error:', error)
      let content = `Avatar error: ${error.message}`
      try {
        const errData = JSON.parse(error.message)
        content = errData.response || content
      } catch (parseError) {
        if (error.response) {
          content = error.response
        }
      }
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      setStatusMessage('Avatar Error - Ready to retry')
    } finally {
      setIsTyping(false)
    }
  }, [sessionId, createTalkWithLipSync, pollTalkCompletion, onMessage])

  // Send message (user interface)
  const sendMessage = useCallback(async (message) => {
    if (!message.trim()) return
    await sendMessageWithLipSync(message)
  }, [sendMessageWithLipSync])

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
      console.log('[D-ID Avatar] Sending triggered message:', triggerMessage)
      sendMessage(triggerMessage)
    }
  }, [triggerMessage, isConnected, sendMessage])

  // Initialize on mount
  useEffect(() => {
    initializeAvatar()
  }, [initializeAvatar])

  // Retry connection
  const retryConnection = () => {
    setConnectionError(null)
    initializeAvatar()
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
      case 'ready': return <User className="h-4 w-4" />
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

      {/* D-ID Avatar Container */}
      <div className={`${containerClass} bg-white rounded-lg shadow-lg border-2 border-teal-200 overflow-hidden relative`}>
        <div 
          ref={containerRef}
          className="w-full h-full"
          id="visible-did-avatar-container"
        >
          {/* Loading State */}
          {agentStatus === 'loading' && (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-teal-50 to-blue-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Setting up D-ID Avatar...</p>
                <p className="text-gray-500 text-sm mt-2">Loading avatar image and connecting to API</p>
              </div>
            </div>
          )}
          
          {/* Error State */}
          {agentStatus === 'error' && (
            <div className="flex items-center justify-center h-full bg-red-50">
              <div className="text-center max-w-md">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 font-medium mb-2">Avatar Connection Failed</p>
                <p className="text-red-500 text-sm mb-4">
                  {connectionError || 'Unable to initialize D-ID avatar'}
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

          {/* Success State - Visible Avatar + Chat Interface */}
          {(agentStatus === 'ready' || agentStatus === 'active') && (
            <div className="w-full h-full flex">
              {/* Visible Avatar Section */}
              <div className="w-1/2 bg-gradient-to-br from-teal-50 to-blue-50 flex flex-col">
                {/* Avatar Display Container */}
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="relative w-full max-w-sm aspect-square rounded-lg shadow-lg overflow-hidden">
                    {/* Static Avatar Image (always visible) */}
                    <img
                      src={avatarConfig.source_url}
                      alt="Savannah AI Bartender"
                      className={`w-full h-full object-cover transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}
                      onLoad={() => setAvatarImageLoaded(true)}
                      onError={() => console.error('[D-ID Avatar] Failed to load avatar image')}
                    />
                    
                    {/* D-ID Video (plays over the image when speaking) */}
                    <video
                      ref={videoRef}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
                      muted={isMuted}
                      playsInline
                      style={{ display: isPlaying ? 'block' : 'none' }}
                    />
                    
                    {/* Avatar Controls Overlay */}
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
                        title="D-ID Avatar active"
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
                        <span>Processing</span>
                      </div>
                    )}

                    {/* D-ID Live Indicator */}
                    <div className="absolute top-4 left-4 flex items-center space-x-2 bg-purple-500 text-white px-2 py-1 rounded-full text-xs">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span>D-ID</span>
                    </div>
                  </div>
                </div>

                {/* Avatar Info */}
                <div className="p-4 bg-white bg-opacity-80 border-t border-teal-200">
                  <div className="text-center">
                    <h3 className="font-medium text-gray-800">Savannah - AI Bartender</h3>
                    <p className="text-sm text-gray-600">Visible D-ID Avatar + Gemini 2.5 Flash</p>
                    <div className="flex items-center justify-center mt-2 space-x-4 text-xs text-gray-500">
                      <span>Avatar: {avatarImageLoaded ? 'Visible' : 'Loading'}</span>
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
                      <p className="text-sm text-gray-600">Visible Avatar + Lip Sync</p>
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
                          Ahoy! I'm Savannah, your AI bartender with a visible D-ID avatar! You can see me right now, and when you send a message, I'll speak with synchronized lip movements. Try asking me about cocktails or whiskey!
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
                      placeholder="Ask me about cocktails - watch me speak!"
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
                    👁️ Visible Avatar • 👄 Lip Sync • ⚡ Gemini 2.5 Flash AI
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Avatar Controls */}
      {showControls && isConnected && (
        <div className="bg-gradient-to-r from-purple-50 to-teal-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
            <Video className="h-5 w-5 mr-2" />
            Visible D-ID Avatar Controls
          </h4>
          
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-700">Avatar Visible</span>
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
            Session: {sessionId?.substring(0, 8)}... • 
            Talk ID: {currentTalkId?.substring(0, 8) || 'None'}... • 
            Status: {isPlaying ? '🗣️ Speaking' : '😊 Ready'}
          </div>
        </div>
      )}

      {/* Visible Avatar Notice */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-semibold text-green-800 mb-2 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          Visible D-ID Avatar with Lip Sync
        </h4>
        <p className="text-sm text-green-700">
          This component displays a visible D-ID avatar that you can see at all times! The avatar image is always shown, 
          and when you send a message, the D-ID Talks API generates a video with perfect lip sync that plays over the image. 
          Watch the avatar speak with synchronized facial movements!
        </p>
      </div>

      {/* Debug Info (development only) */}
      {import.meta.env.DEV && (
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer hover:text-gray-700">Debug Information</summary>
          <div className="mt-2 p-3 bg-gray-100 rounded font-mono">
            <div>Status: {agentStatus}</div>
            <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
            <div>Session ID: {sessionId || 'None'}</div>
            <div>Talk ID: {currentTalkId || 'None'}</div>
            <div>Message Count: {messageCount}</div>
            <div>Avatar Image: {avatarImageLoaded ? 'Loaded' : 'Loading'}</div>
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

export default VisibleDidAvatar
