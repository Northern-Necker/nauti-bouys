import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Mic, MicOff, Volume2, VolumeX, Video, VideoOff, Heart, Brain, Eye } from 'lucide-react'
import didService from '../../services/api/didService'
import conversationService from '../../services/api/conversationService'

const EnhancedIAAvatar = ({ size = 'large', onEmotionDetected, onConversationUpdate }) => {
  // State management
  const [sessionId, setSessionId] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [avatarState, setAvatarState] = useState('idle') // idle, listening, speaking, thinking, analyzing
  const [emotionalState, setEmotionalState] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')

  // Refs
  const videoRef = useRef(null)
  const userVideoRef = useRef(null)
  const peerConnection = useRef(null)
  const mediaStream = useRef(null)
  const speechRecognition = useRef(null)

  // Component sizes
  const sizeClasses = {
    small: 'w-24 h-32',
    medium: 'w-48 h-64',
    large: 'w-72 h-96'
  }

  const controlSizes = {
    small: 'p-2',
    medium: 'p-3',
    large: 'p-4'
  }

  // Initialize D-ID session and WebRTC connection
  useEffect(() => {
    initializeSession()
    
    return () => {
      cleanup()
    }
  }, [])

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      speechRecognition.current = new SpeechRecognition()
      
      speechRecognition.current.continuous = false
      speechRecognition.current.interimResults = true
      speechRecognition.current.lang = 'en-US'

      speechRecognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        if (event.results[0].isFinal) {
          handleVoiceInput(transcript)
        }
      }

      speechRecognition.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        setAvatarState('idle')
      }

      speechRecognition.current.onend = () => {
        setIsListening(false)
        setAvatarState('idle')
      }
    }
  }, [])

  const initializeSession = async () => {
    try {
      setConnectionStatus('connecting')
      
      // Start conversation service session
      const conversationResult = await conversationService.startSession()
      if (!conversationResult.success) {
        throw new Error('Failed to start conversation session')
      }

      // Create D-ID streaming session
      const didResult = await didService.createStreamingSession()
      if (!didResult.success) {
        throw new Error('Failed to create D-ID session')
      }

      setSessionId(didResult.sessionId)
      
      // Set up WebRTC connection
      await setupWebRTCConnection(didResult.iceServers, didResult.offerSdp)
      
      setIsConnected(true)
      setConnectionStatus('connected')
      setAvatarState('idle')

    } catch (error) {
      console.error('Failed to initialize IA Avatar session:', error)
      setConnectionStatus('error')
      setAvatarState('error')
    }
  }

  const setupWebRTCConnection = async (iceServers, offerSdp) => {
    try {
      // Create peer connection
      peerConnection.current = didService.createWebRTCConnection(iceServers)

      // Set up event handlers
      peerConnection.current.oniceconnectionstatechange = () => {
        const state = peerConnection.current.iceConnectionState
        console.log('ICE Connection State:', state)
        if (state === 'connected' || state === 'completed') {
          setIsConnected(true)
        } else if (state === 'disconnected' || state === 'failed') {
          setIsConnected(false)
        }
      }

      peerConnection.current.ontrack = (event) => {
        if (videoRef.current) {
          videoRef.current.srcObject = event.streams[0]
        }
      }

      // Get user media for emotion analysis
      if (videoEnabled) {
        try {
          mediaStream.current = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
          })
          
          if (userVideoRef.current) {
            userVideoRef.current.srcObject = mediaStream.current
          }

          // Add stream to peer connection
          mediaStream.current.getTracks().forEach(track => {
            peerConnection.current.addTrack(track, mediaStream.current)
          })

          // Start periodic emotion analysis
          startEmotionAnalysis()

        } catch (error) {
          console.error('Failed to get user media:', error)
          setVideoEnabled(false)
        }
      }

      // Set remote description
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription({ type: 'offer', sdp: offerSdp })
      )

      // Create and set local description
      const answer = await peerConnection.current.createAnswer()
      await peerConnection.current.setLocalDescription(answer)

      return answer

    } catch (error) {
      console.error('WebRTC setup failed:', error)
      throw error
    }
  }

  const startEmotionAnalysis = () => {
    const analyzeInterval = setInterval(async () => {
      if (!userVideoRef.current || !videoEnabled) return

      try {
        setAvatarState('analyzing')
        
        // Capture frame from user video
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = userVideoRef.current.videoWidth
        canvas.height = userVideoRef.current.videoHeight
        ctx.drawImage(userVideoRef.current, 0, 0)
        
        // Analyze emotion (using mock service for now)
        const emotionResult = await didService.analyzeEmotion(canvas)
        
        if (emotionResult.success) {
          setEmotionalState(emotionResult.emotion)
          conversationService.updateEmotionalState(emotionResult.emotion)
          
          if (onEmotionDetected) {
            onEmotionDetected(emotionResult.emotion)
          }
        }

        setAvatarState('idle')
        
      } catch (error) {
        console.error('Emotion analysis failed:', error)
        setAvatarState('idle')
      }
    }, 3000) // Analyze every 3 seconds

    return () => clearInterval(analyzeInterval)
  }

  const handleVoiceInput = async (transcript) => {
    if (!transcript.trim()) return

    try {
      setAvatarState('thinking')
      
      // Generate contextual response
      const response = await conversationService.generateResponse(transcript, {
        inputMode: 'voice',
        emotionalState: emotionalState
      })

      if (response.success) {
        await speakResponse(response.response)
        
        if (onConversationUpdate) {
          onConversationUpdate({
            userMessage: transcript,
            aiResponse: response.response,
            emotionalState: emotionalState
          })
        }
      }

    } catch (error) {
      console.error('Voice input processing failed:', error)
      setAvatarState('idle')
    }
  }

  const speakResponse = async (text) => {
    if (!sessionId || isMuted) return

    try {
      setIsSpeaking(true)
      setAvatarState('speaking')

      // Send message to D-ID for avatar speech
      const result = await didService.sendMessage(sessionId, text, {
        emotion: emotionalState?.primary || 'neutral'
      })

      if (!result.success) {
        console.error('D-ID speech failed:', result.error)
      }

    } catch (error) {
      console.error('Speech synthesis failed:', error)
    } finally {
      // Reset speaking state after a delay
      setTimeout(() => {
        setIsSpeaking(false)
        setAvatarState('idle')
      }, text.length * 50) // Estimate speech duration
    }
  }

  const toggleListening = () => {
    if (!speechRecognition.current) {
      console.error('Speech recognition not supported')
      return
    }

    if (isListening) {
      speechRecognition.current.stop()
      setIsListening(false)
      setAvatarState('idle')
    } else {
      speechRecognition.current.start()
      setIsListening(true)
      setAvatarState('listening')
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const toggleVideo = () => {
    if (mediaStream.current) {
      mediaStream.current.getVideoTracks().forEach(track => {
        track.enabled = !videoEnabled
      })
    }
    setVideoEnabled(!videoEnabled)
  }

  const cleanup = async () => {
    try {
      if (speechRecognition.current) {
        speechRecognition.current.stop()
      }
      
      if (mediaStream.current) {
        mediaStream.current.getTracks().forEach(track => track.stop())
      }
      
      if (peerConnection.current) {
        peerConnection.current.close()
      }
      
      if (sessionId) {
        await didService.destroySession(sessionId)
      }

      await conversationService.endSession()

    } catch (error) {
      console.error('Cleanup failed:', error)
    }
  }

  const getAvatarClasses = () => {
    const baseClasses = `${sizeClasses[size]} bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg overflow-hidden shadow-lg transition-all duration-300`
    
    switch (avatarState) {
      case 'listening':
        return `${baseClasses} ring-4 ring-green-300 ring-opacity-75 animate-pulse`
      case 'speaking':
        return `${baseClasses} ring-4 ring-blue-300 ring-opacity-75 scale-105`
      case 'thinking':
        return `${baseClasses} ring-4 ring-yellow-300 ring-opacity-50`
      case 'analyzing':
        return `${baseClasses} ring-4 ring-purple-300 ring-opacity-50`
      case 'error':
        return `${baseClasses} ring-4 ring-red-300 ring-opacity-75`
      default:
        return `${baseClasses} hover:scale-105`
    }
  }

  const getStatusText = () => {
    switch (avatarState) {
      case 'listening': return 'Listening...'
      case 'speaking': return 'Speaking...'
      case 'thinking': return 'Thinking...'
      case 'analyzing': return 'Reading emotions...'
      case 'error': return 'Connection error'
      default: return isConnected ? 'Ready to help' : 'Connecting...'
    }
  }

  const getEmotionDisplay = () => {
    if (!emotionalState) return null

    return (
      <div className="mt-2 text-xs text-gray-600">
        <div className="flex items-center space-x-1">
          <Heart className="h-3 w-3" />
          <span>Mood: {emotionalState.primary}</span>
          <span className="text-gray-400">({Math.round(emotionalState.confidence * 100)}%)</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Main Avatar Container */}
      <div className="relative">
        <div className={getAvatarClasses()}>
          {/* D-ID Avatar Video */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={false}
            className="w-full h-full object-cover"
            style={{ display: isConnected ? 'block' : 'none' }}
          />
          
          {/* Fallback Avatar Display */}
          {!isConnected && (
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center">
                <Brain className="h-12 w-12 mx-auto mb-2 animate-pulse" />
                <p className="text-sm font-medium">Initializing...</p>
              </div>
            </div>
          )}

          {/* Status Indicators */}
          <div className="absolute top-2 right-2 flex space-x-1">
            {isConnected && (
              <div className="w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
            )}
            {emotionalState && (
              <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
            )}
          </div>
        </div>

        {/* User Video (for emotion analysis) */}
        {videoEnabled && (
          <div className="absolute bottom-2 right-2 w-16 h-12 bg-black rounded overflow-hidden">
            <video
              ref={userVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 border-2 border-purple-300 rounded"></div>
          </div>
        )}
      </div>

      {/* Status Display */}
      <div className="text-center">
        <p className="font-medium text-gray-800">{getStatusText()}</p>
        <p className="text-sm text-gray-500">Bay AI Assistant</p>
        {getEmotionDisplay()}
      </div>

      {/* Controls */}
      <div className="flex space-x-3">
        <button
          onClick={toggleListening}
          disabled={!isConnected}
          className={`${controlSizes[size]} rounded-full transition-all duration-200 ${
            isListening 
              ? 'bg-green-500 hover:bg-green-600 text-white animate-pulse' 
              : 'bg-teal-500 hover:bg-teal-600 text-white disabled:opacity-50'
          }`}
          title={isListening ? 'Stop listening' : 'Start listening'}
        >
          {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>

        <button
          onClick={toggleMute}
          className={`${controlSizes[size]} rounded-full transition-all duration-200 ${
            isMuted 
              ? 'bg-gray-500 hover:bg-gray-600 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>

        <button
          onClick={toggleVideo}
          className={`${controlSizes[size]} rounded-full transition-all duration-200 ${
            videoEnabled 
              ? 'bg-purple-500 hover:bg-purple-600 text-white' 
              : 'bg-gray-500 hover:bg-gray-600 text-white'
          }`}
          title={videoEnabled ? 'Disable emotion reading' : 'Enable emotion reading'}
        >
          {videoEnabled ? <Eye className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </button>

        <button
          className={`${controlSizes[size]} bg-orange-500 hover:bg-orange-600 text-white rounded-full transition-all duration-200`}
          title="Chat mode"
          disabled={!isConnected}
        >
          <MessageCircle className="h-5 w-5" />
        </button>
      </div>

      {/* Connection Status */}
      <div className="text-xs text-center">
        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-white ${
          connectionStatus === 'connected' ? 'bg-green-500' :
          connectionStatus === 'connecting' ? 'bg-yellow-500' :
          'bg-red-500'
        }`}>
          <div className={`w-2 h-2 rounded-full bg-white ${
            connectionStatus === 'connected' ? 'animate-pulse' : ''
          }`}></div>
          <span className="capitalize">{connectionStatus}</span>
        </span>
      </div>
    </div>
  )
}

export default EnhancedIAAvatar