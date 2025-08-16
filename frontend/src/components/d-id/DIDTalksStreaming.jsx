import { useEffect, useRef, useState, useCallback } from 'react'
import { MessageCircle, Mic, MicOff, Volume2, VolumeX, User, AlertCircle, Phone, Settings, Play, Pause, Video, Anchor, Send, Loader } from 'lucide-react'

const DIDTalksStreaming = ({ 
  size = 'large', 
  showControls = true, 
  className = '',
  onAgentReady = null,
  onAgentError = null,
  onSessionStart = null,
  onMessage = null,
  avatarImageUrl = null,
  autoStart = true
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
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  // Size configurations
  const sizeClasses = {
    small: 'w-64 h-48',
    medium: 'w-96 h-72',
    large: 'w-full h-[600px]'
  }

  const containerClass = sizeClasses[size] || sizeClasses.large

  // API base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('token')
  }

  // API call helper
  const apiCall = async (endpoint, options = {}) => {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      },
      ...options
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `API Error: ${response.statusText}`)
    }

    return response.json()
  }

  // Create WebRTC peer connection
  const createPeerConnection = useCallback((offer, iceServers) => {
    return new Promise((resolve, reject) => {
      try {
        const peerConnection = new RTCPeerConnection({ iceServers })
        peerConnectionRef.current = peerConnection

        // Handle incoming stream
        peerConnection.ontrack = (event) => {
          console.log('[WebRTC] Received stream:', event.streams[0])
          if (videoRef.current && event.streams[0]) {
            videoRef.current.srcObject = event.streams[0]
            setIsConnected(true)
            setAgentStatus('ready')
            setStatusMessage('Savannah is Ready!')
            setConnectionError(null)
            setIsPlaying(true)

            if (onAgentReady) {
              onAgentReady({ 
                streamId: streamIdRef.current,
                sessionId: sessionIdRef.current,
                status: 'ready'
              })
            }
          }
        }

        // Handle ICE candidates
        peerConnection.onicecandidate = async (event) => {
          if (event.candidate && streamIdRef.current && sessionIdRef.current) {
            try {
              await apiCall('/did-streaming/ice-candidate', {
                method: 'POST',
                body: JSON.stringify({
                  streamId: streamIdRef.current,
                  sessionId: sessionIdRef.current,
                  candidate: {
                    candidate: event.candidate.candidate,
                    sdpMid: event.candidate.sdpMid,
                    sdpMLineIndex: event.candidate.sdpMLineIndex
                  }
                })
              })
            } catch (error) {
              console.warn('[WebRTC] ICE candidate submission failed:', error)
            }
          }
        }

        // Handle connection state changes
        peerConnection.oniceconnectionstatechange = () => {
          console.log('[WebRTC] ICE connection state:', peerConnection.iceConnectionState)
          if (peerConnection.iceConnectionState === 'failed') {
            setConnectionError('WebRTC connection failed')
            setAgentStatus('error')
            setStatusMessage('Connection failed')
          } else if (peerConnection.iceConnectionState === 'connected') {
            setIsConnected(true)
            setConnectionError(null)
          }
        }

        peerConnection.onconnectionstatechange = () => {
          console.log('[WebRTC] Connection state:', peerConnection.connectionState)
          if (peerConnection.connectionState === 'failed') {
            setConnectionError('Peer connection failed')
            setAgentStatus('error')
          }
        }

        // Set remote description and create answer
        peerConnection.setRemoteDescription(offer)
          .then(() => peerConnection.createAnswer())
          .then((answer) => {
            peerConnection.setLocalDescription(answer)
            resolve(answer)
          })
          .catch(reject)

      } catch (error) {
        reject(error)
      }
    })
  }, [onAgentReady])

  // Initialize D-ID streaming
  const initializeStreaming = useCallback(async () => {
    try {
      setAgentStatus('loading')
      setStatusMessage('Creating D-ID stream...')

      // Create stream
      const streamResponse = await apiCall('/did-streaming/create-stream', {
        method: 'POST',
        body: JSON.stringify({
          avatarImageUrl: avatarImageUrl
        })
      })

      if (!streamResponse.success) {
        throw new Error(streamResponse.message || 'Failed to create stream')
      }

      const { stream } = streamResponse
      streamIdRef.current = stream.id
      sessionIdRef.current = stream.sessionId

      console.log('[D-ID Streaming] Stream created:', stream.id)

      setStatusMessage('Establishing WebRTC connection...')

      // Create peer connection and get SDP answer
      const sdpAnswer = await createPeerConnection(stream.offer, stream.iceServers)

      // Start stream with SDP answer
      const startResponse = await apiCall('/did-streaming/start-stream', {
        method: 'POST',
        body: JSON.stringify({
          streamId: stream.id,
          sessionId: stream.sessionId,
          sdpAnswer: sdpAnswer
        })
      })

      if (!startResponse.success) {
        throw new Error(startResponse.message || 'Failed to start stream')
      }

      console.log('[D-ID Streaming] Stream started successfully')

      // Add welcome message
      const welcomeMessage = {
        id: Date.now(),
        type: 'assistant',
        content: "Ahoy! Welcome to Nauti-Bouys! I'm Savannah, your AI bartender. How can I help you navigate our beverage selection today?",
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
      setMessageCount(1)

      if (onSessionStart) {
        onSessionStart({ 
          streamId: stream.id,
          sessionId: stream.sessionId,
          agent: true
        })
      }

    } catch (error) {
      console.error('[D-ID Streaming] Initialization error:', error)
      setAgentStatus('error')
      setStatusMessage(`Failed to initialize: ${error.message}`)
      setConnectionError(error.message)
      
      if (onAgentError) {
        onAgentError(error)
      }
    }
  }, [avatarImageUrl, createPeerConnection, onAgentError, onSessionStart])

  // Send message to AI and stream incremental response
  const sendMessage = useCallback(async (message) => {
    if (!message.trim() || !streamIdRef.current || !sessionIdRef.current || isProcessing) {
      return
    }

    // Helper to send speech segments to D-ID
    const speakSegment = async (text) => {
      if (!text.trim()) return
      try {
        await apiCall('/did-streaming/create-talk', {
          method: 'POST',
          body: JSON.stringify({
            streamId: streamIdRef.current,
            sessionId: sessionIdRef.current,
            text
          })
        })
      } catch (err) {
        console.warn('[D-ID Streaming] Failed to send talk segment:', err)
      }
    }

    try {
      setIsProcessing(true)
      setIsSpeaking(true)
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

      // Placeholder for AI response
      const aiMessageId = Date.now() + 1
      const aiMessage = {
        id: aiMessageId,
        type: 'assistant',
        content: '',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])

      let fullText = ''
      let spokenLength = 0

      const finalize = (finalText, meta = {}) => {
        setMessages(prev =>
          prev.map(m => m.id === aiMessageId ? { ...m, content: finalText, ...meta } : m)
        )
        setMessageCount(prev => prev + 1)
        if (onMessage) {
          onMessage({ ...aiMessage, content: finalText, ...meta })
        }
        setIsProcessing(false)
        setIsTyping(false)
        setIsSpeaking(false)
      }

      try {
        const sseUrl =
          `${API_BASE_URL}/did-streaming/send-message-stream` +
          `?streamId=${encodeURIComponent(streamIdRef.current)}` +
          `&sessionId=${encodeURIComponent(sessionIdRef.current)}` +
          `&message=${encodeURIComponent(message)}`

        const eventSource = new EventSource(sseUrl)

        eventSource.onmessage = async (event) => {
          if (event.data === '[DONE]') {
            eventSource.close()
            if (fullText.length > spokenLength) {
              await speakSegment(fullText.slice(spokenLength))
            }
            finalize(fullText)
            return
          }

          let token = event.data
          try {
            const parsed = JSON.parse(event.data)
            token = parsed.token || ''
          } catch (err) {
            // Not JSON, use raw token
          }

          fullText += token
          setMessages(prev =>
            prev.map(m => m.id === aiMessageId ? { ...m, content: fullText } : m)
          )

          if (fullText.length - spokenLength > 40 || /[.!?]\s$/.test(fullText)) {
            const segment = fullText.slice(spokenLength)
            await speakSegment(segment)
            spokenLength = fullText.length
          }
        }

        eventSource.onerror = async () => {
          console.warn('[D-ID Streaming] SSE connection error, falling back to full response')
          eventSource.close()

          try {
            const response = await apiCall('/did-streaming/send-message', {
              method: 'POST',
              body: JSON.stringify({
                streamId: streamIdRef.current,
                sessionId: sessionIdRef.current,
                message
              })
            })

            if (!response.success) {
              throw new Error(response.message || 'Failed to process message')
            }

            fullText = response.aiResponse
            await speakSegment(fullText)
            finalize(fullText, { model: response.model, usage: response.usage })
          } catch (fallbackError) {
            console.error('[D-ID Streaming] Fallback error:', fallbackError)
            finalize('', {})
            const errorMessage = {
              id: Date.now() + 2,
              type: 'error',
              content: `I apologize, but I encountered an error: ${fallbackError.message}. Please try again.`,
              timestamp: new Date()
            }
            setMessages(prev => [...prev, errorMessage])
          }
        }
      } catch (streamSetupError) {
        console.warn('[D-ID Streaming] Streaming not available, using full response mode:', streamSetupError)

        const response = await apiCall('/did-streaming/send-message', {
          method: 'POST',
          body: JSON.stringify({
            streamId: streamIdRef.current,
            sessionId: sessionIdRef.current,
            message
          })
        })

        if (!response.success) {
          throw new Error(response.message || 'Failed to process message')
        }

        fullText = response.aiResponse
        await speakSegment(fullText)
        finalize(fullText, { model: response.model, usage: response.usage })
      }
    } catch (error) {
      console.error('[D-ID Streaming] Send message error:', error)

      // Add error message to chat
      const errorMessage = {
        id: Date.now() + 2,
        type: 'error',
        content: `I apologize, but I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      setIsProcessing(false)
      setIsTyping(false)
      setIsSpeaking(false)
    }
  }, [API_BASE_URL, apiCall, isProcessing, onMessage])

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()
    if (inputMessage.trim()) {
      sendMessage(inputMessage)
      setInputMessage('')
    }
  }

  // Close stream
  const closeStream = useCallback(async () => {
    try {
      if (streamIdRef.current && sessionIdRef.current) {
        await apiCall('/did-streaming/close-stream', {
          method: 'DELETE',
          body: JSON.stringify({
            streamId: streamIdRef.current,
            sessionId: sessionIdRef.current
          })
        })
      }

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }

      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop())
        videoRef.current.srcObject = null
      }

      streamIdRef.current = null
      sessionIdRef.current = null
      setIsConnected(false)
      setAgentStatus('disconnected')
      setStatusMessage('Disconnected')

    } catch (error) {
      console.error('[D-ID Streaming] Close stream error:', error)
    }
  }, [])

  // Initialize on mount
  useEffect(() => {
    if (autoStart) {
      initializeStreaming()
    }

    return () => {
      closeStream()
    }
  }, [autoStart, initializeStreaming, closeStream])

  // Auto-scroll messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(videoRef.current.muted)
    }
  }

  // Toggle play/pause
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play()
        setIsPlaying(true)
      } else {
        videoRef.current.pause()
        setIsPlaying(false)
      }
    }
  }

  return (
    <div ref={containerRef} className={`${containerClass} ${className} bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-2xl overflow-hidden border border-blue-200`}>
      <div className="h-full flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Anchor className="w-8 h-8" />
              {isConnected && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold">Savannah - AI Bartender</h3>
              <p className="text-sm text-blue-100">{statusMessage}</p>
            </div>
          </div>
          
          {showControls && (
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <button
                onClick={togglePlayPause}
                className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          
          {/* Video Avatar */}
          <div className="flex-1 relative bg-gray-900 flex items-center justify-center">
            {agentStatus === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-10">
                <div className="text-center text-white">
                  <Loader className="w-12 h-12 animate-spin mx-auto mb-4" />
                  <p className="text-lg font-semibold">{statusMessage}</p>
                </div>
              </div>
            )}
            
            {agentStatus === 'error' && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-75 z-10">
                <div className="text-center text-white">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                  <p className="text-lg font-semibold">Connection Failed</p>
                  <p className="text-sm text-red-200 mt-2">{connectionError}</p>
                  <button
                    onClick={initializeStreaming}
                    className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    Retry Connection
                  </button>
                </div>
              </div>
            )}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={isMuted}
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }} // Mirror the video
            />

            {/* Speaking indicator */}
            {isSpeaking && (
              <div className="absolute bottom-4 left-4 flex items-center space-x-2 bg-blue-600 bg-opacity-90 text-white px-3 py-2 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Speaking...</span>
              </div>
            )}

            {/* Status indicators */}
            <div className="absolute top-4 right-4 flex flex-col space-y-2">
              {isConnected && (
                <div className="bg-green-600 bg-opacity-90 text-white px-2 py-1 rounded text-xs">
                  Connected
                </div>
              )}
              {isProcessing && (
                <div className="bg-yellow-600 bg-opacity-90 text-white px-2 py-1 rounded text-xs">
                  Processing...
                </div>
              )}
            </div>
          </div>

          {/* Chat Interface */}
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            
            {/* Messages */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
              style={{ maxHeight: 'calc(100% - 80px)' }}
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.type === 'error'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about our beverages..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!isConnected || isProcessing}
                />
                <button
                  type="submit"
                  disabled={!isConnected || isProcessing || !inputMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DIDTalksStreaming
