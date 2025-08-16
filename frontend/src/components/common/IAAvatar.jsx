import { useState, useEffect } from 'react'
import { MessageCircle, Mic, MicOff, Volume2, VolumeX, User } from 'lucide-react'

const IAAvatar = ({ size = 'medium', showControls = true }) => {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [avatarState, setAvatarState] = useState('idle') // idle, listening, speaking, thinking

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-32 h-32',
    large: 'w-48 h-48'
  }

  const controlSizes = {
    small: 'p-2',
    medium: 'p-3',
    large: 'p-4'
  }

  useEffect(() => {
    // Simulate avatar animation cycles
    const interval = setInterval(() => {
      if (avatarState === 'idle') {
        // Occasional blink or subtle movement
        setAvatarState('thinking')
        setTimeout(() => setAvatarState('idle'), 500)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [avatarState])

  const handleMicToggle = () => {
    setIsListening(!isListening)
    setAvatarState(isListening ? 'idle' : 'listening')
  }

  const handleMuteToggle = () => {
    setIsMuted(!isMuted)
  }

  const getAvatarClasses = () => {
    const baseClasses = `${sizeClasses[size]} rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg transition-all duration-300`
    
    switch (avatarState) {
      case 'listening':
        return `${baseClasses} ring-4 ring-teal-300 ring-opacity-75 animate-pulse`
      case 'speaking':
        return `${baseClasses} ring-4 ring-blue-300 ring-opacity-75 scale-105`
      case 'thinking':
        return `${baseClasses} ring-2 ring-yellow-300 ring-opacity-50`
      default:
        return `${baseClasses} hover:scale-105`
    }
  }

  const getEyeAnimation = () => {
    switch (avatarState) {
      case 'listening':
        return 'animate-pulse'
      case 'speaking':
        return 'animate-bounce'
      default:
        return ''
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar Circle */}
      <div className="relative">
        <div className={getAvatarClasses()}>
          {/* Face Elements */}
          <div className="relative">
            {/* Eyes */}
            <div className={`flex space-x-2 mb-2 ${getEyeAnimation()}`}>
              <div className={`w-2 h-2 bg-white rounded-full ${avatarState === 'thinking' ? 'animate-ping' : ''}`}></div>
              <div className={`w-2 h-2 bg-white rounded-full ${avatarState === 'thinking' ? 'animate-ping' : ''}`}></div>
            </div>
            
            {/* Mouth */}
            <div className={`w-4 h-1 bg-white rounded-full mx-auto ${isSpeaking ? 'animate-pulse h-2' : ''}`}></div>
          </div>
          
          {/* Status Indicator */}
          {avatarState !== 'idle' && (
            <div className="absolute -top-2 -right-2">
              <div className={`w-4 h-4 rounded-full ${
                avatarState === 'listening' ? 'bg-green-400' :
                avatarState === 'speaking' ? 'bg-blue-400' : 
                'bg-yellow-400'
              } animate-ping`}></div>
              <div className={`absolute inset-0 w-4 h-4 rounded-full ${
                avatarState === 'listening' ? 'bg-green-400' :
                avatarState === 'speaking' ? 'bg-blue-400' : 
                'bg-yellow-400'
              }`}></div>
            </div>
          )}
        </div>

        {/* Interaction Ring */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent hover:border-teal-300 transition-colors duration-200"></div>
      </div>

      {/* Avatar Status Text */}
      <div className="text-center">
        <p className={`font-medium ${
          size === 'small' ? 'text-sm' : 
          size === 'medium' ? 'text-base' : 
          'text-lg'
        }`}>
          {avatarState === 'idle' && 'Ready to help'}
          {avatarState === 'listening' && 'Listening...'}
          {avatarState === 'speaking' && 'Speaking...'}
          {avatarState === 'thinking' && 'Thinking...'}
        </p>
        <p className={`text-gray-500 ${
          size === 'small' ? 'text-xs' : 'text-sm'
        }`}>
          IA Assistant
        </p>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="flex space-x-3">
          <button
            onClick={handleMicToggle}
            className={`${controlSizes[size]} rounded-full transition-all duration-200 ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-teal-500 hover:bg-teal-600 text-white'
            }`}
            title={isListening ? 'Stop listening' : 'Start listening'}
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          <button
            onClick={handleMuteToggle}
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
            className={`${controlSizes[size]} bg-purple-500 hover:bg-purple-600 text-white rounded-full transition-all duration-200`}
            title="Start chat"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Quick Actions (for large size) */}
      {size === 'large' && showControls && (
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          <button className="px-3 py-2 bg-teal-100 text-teal-700 rounded-full text-sm hover:bg-teal-200 transition-colors duration-200">
            Recommend drinks
          </button>
          <button className="px-3 py-2 bg-teal-100 text-teal-700 rounded-full text-sm hover:bg-teal-200 transition-colors duration-200">
            Check availability
          </button>
          <button className="px-3 py-2 bg-teal-100 text-teal-700 rounded-full text-sm hover:bg-teal-200 transition-colors duration-200">
            Make reservation
          </button>
        </div>
      )}
    </div>
  )
}

export default IAAvatar