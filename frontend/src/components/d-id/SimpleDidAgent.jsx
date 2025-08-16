import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Mic, Volume2, User, AlertCircle } from 'lucide-react'

const SimpleDidAgent = ({ 
  size = 'large', 
  showControls = true, 
  className = '',
  onAgentReady = null,
  onAgentError = null,
  triggerMessage = null // New prop for programmatic message sending
}) => {
  const containerRef = useRef(null)
  const [agentStatus, setAgentStatus] = useState('loading')
  const [statusMessage, setStatusMessage] = useState('Initializing AI Assistant...')
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)

  // Size configurations
  const sizeClasses = {
    small: 'w-64 h-48',
    medium: 'w-96 h-72',
    large: 'w-full h-[600px]'
  }

  const containerClass = sizeClasses[size] || sizeClasses.large

  // Function to send message to D-ID agent
  const sendMessageToAgent = (message) => {
    if (agentStatus !== 'ready' && agentStatus !== 'active') {
      console.warn('[D-ID Agent] Agent not ready, cannot send message:', message)
      return false
    }

    try {
      const container = document.getElementById('did-agent-container')
      const iframe = container?.querySelector('iframe')
      
      if (iframe && iframe.contentWindow) {
        // Try to send message to D-ID iframe
        iframe.contentWindow.postMessage({
          type: 'send-message',
          message: message
        }, '*')
        console.log('[D-ID Agent] Message sent to agent:', message)
        return true
      } else {
        // Fallback: try to find and fill text input
        const textInput = container?.querySelector('input[type="text"], textarea')
        if (textInput) {
          textInput.value = message
          textInput.dispatchEvent(new Event('input', { bubbles: true }))
          
          // Try to find and click send button
          const sendButton = container?.querySelector('button[type="submit"], button:contains("Send")')
          if (sendButton) {
            sendButton.click()
            console.log('[D-ID Agent] Message sent via text input:', message)
            return true
          }
        }
      }
    } catch (error) {
      console.error('[D-ID Agent] Error sending message:', error)
    }
    
    return false
  }

  // Handle triggerMessage prop changes - Show as suggestion instead of auto-sending
  useEffect(() => {
    if (triggerMessage && agentStatus === 'ready') {
      console.log('[D-ID Agent] Showing suggested message:', triggerMessage)
      // Instead of auto-sending, we'll show this as a suggestion to the user
    }
  }, [triggerMessage, agentStatus])

  useEffect(() => {
    // Load the D-ID agent script
    loadDidAgent()

    // Listen for agent events
    const handleMessage = (event) => {
      if (event.origin.includes('d-id.com')) {
        console.log('[D-ID Agent] Message received:', event.data)
        
        switch (event.data?.type) {
          case 'agent-ready':
            setAgentStatus('ready')
            setStatusMessage('AI Assistant Ready')
            if (onAgentReady) onAgentReady(event.data)
            break
          case 'agent-error':
            setAgentStatus('error')
            setStatusMessage('Connection Error')
            if (onAgentError) onAgentError(event.data)
            break
          case 'conversation-start':
            setAgentStatus('active')
            setStatusMessage('Conversation Active')
            break
          case 'conversation-end':
            setAgentStatus('ready')
            setStatusMessage('AI Assistant Ready')
            break
          default:
            console.log('[D-ID Agent] Unknown event:', event.data)
        }
      }
    }

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
      // Clean up script if needed
      const existingScript = document.querySelector('script[src*="agent.d-id.com"]')
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [onAgentReady, onAgentError])

  const loadDidAgent = () => {
    // Check if script is already loaded
    const existingScript = document.querySelector('script[src*="agent.d-id.com"]')
    if (existingScript) {
      setIsScriptLoaded(true)
      return
    }

    // Create and configure the D-ID agent script
    const script = document.createElement('script')
    script.type = 'module'
    script.src = 'https://agent.d-id.com/v2/index.js'
    script.setAttribute('data-mode', 'full')
    script.setAttribute('data-client-key', 'Z29vZ2xlLW9hdXRoMnwxMDcyODc2NjczODk5NDc0ODU0NDU6VVIxdU9IS1NPWVBUVnBmbUo5NXRo')
    script.setAttribute('data-agent-id', 'v2_agt_AYiJdoSm')
    script.setAttribute('data-name', 'did-agent')
    script.setAttribute('data-monitor', 'true')
    script.setAttribute('data-target-id', 'did-agent-container')

    script.onload = () => {
      console.log('[D-ID Agent] Script loaded successfully')
      setIsScriptLoaded(true)
      
      // Simple polling approach to check if D-ID content has loaded
      const checkAgentLoaded = () => {
        const container = document.getElementById('did-agent-container')
        if (container) {
          // Check for various indicators that the agent has loaded
          const hasContent = container.innerHTML.trim() !== ''
          const hasIframe = container.querySelector('iframe')
          const hasButton = container.textContent?.includes('Start conversation') || 
                           container.textContent?.includes('Turn microphone on')
          const hasDidElements = container.querySelector('[data-testid]') || 
                                container.querySelector('[class*="did"]') ||
                                container.children.length > 0
          
          if (hasContent && (hasIframe || hasButton || hasDidElements)) {
            console.log('[D-ID Agent] Agent content detected and loaded')
            setAgentStatus('ready')
            setStatusMessage('AI Assistant Ready')
            if (onAgentReady) onAgentReady({ type: 'agent-loaded' })
            return true
          }
        }
        return false
      }
      
      // More realistic status progression - wait longer before declaring ready
      if (!checkAgentLoaded()) {
        // First, wait a bit before even starting to check
        setTimeout(() => {
          setStatusMessage('Loading AI Assistant...')
        }, 1000)
        
        setTimeout(() => {
          setStatusMessage('Connecting to avatar...')
        }, 2000)
        
        // Start checking after 3 seconds
        setTimeout(() => {
          const pollInterval = setInterval(() => {
            if (checkAgentLoaded()) {
              clearInterval(pollInterval)
            }
          }, 1000) // Check every 1 second
          
          // Final fallback after 10 seconds
          setTimeout(() => {
            clearInterval(pollInterval)
            const container = document.getElementById('did-agent-container')
            if (container && container.innerHTML.trim() !== '') {
              console.log('[D-ID Agent] Final timeout - assuming agent is ready')
              setAgentStatus('ready')
              setStatusMessage('AI Assistant Ready')
              if (onAgentReady) onAgentReady({ type: 'agent-loaded' })
            }
          }, 10000)
        }, 3000)
      }
    }

    script.onerror = () => {
      console.error('[D-ID Agent] Failed to load script')
      setAgentStatus('error')
      setStatusMessage('Script failed to load')
    }

    document.head.appendChild(script)
  }

  const getStatusColor = () => {
    switch (agentStatus) {
      case 'ready': return 'text-green-600'
      case 'active': return 'text-blue-600'
      case 'error': return 'text-red-600'
      default: return 'text-yellow-600'
    }
  }

  const getStatusIcon = () => {
    switch (agentStatus) {
      case 'ready': return <User className="h-4 w-4" />
      case 'active': return <MessageCircle className="h-4 w-4" />
      case 'error': return <AlertCircle className="h-4 w-4" />
      default: return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
    }
  }

  return (
    <div className={`flex flex-col space-y-4 ${className}`}>
      {/* Status Bar */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {statusMessage}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          Agent ID: v2_agt_AYiJdoSm
        </div>
      </div>

      {/* D-ID Agent Container */}
      <div className={`${containerClass} bg-white rounded-lg shadow-lg border-2 border-teal-200 overflow-hidden`}>
        <div 
          id="did-agent-container" 
          ref={containerRef}
          className="w-full h-full"
        >
          {/* Loading placeholder */}
          {agentStatus === 'loading' && (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-teal-50 to-blue-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Initializing your AI assistant...</p>
                <p className="text-gray-500 text-sm mt-2">This may take a moment</p>
              </div>
            </div>
          )}
          
          {/* Error placeholder */}
          {agentStatus === 'error' && (
            <div className="flex items-center justify-center h-full bg-red-50">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 font-medium">Failed to load AI Assistant</p>
                <p className="text-red-500 text-sm mt-2">Please refresh the page to try again</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Usage Instructions */}
      {showControls && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
            <MessageCircle className="h-5 w-5 mr-2" />
            How to Use Your AI Assistant
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-blue-700 mb-2 flex items-center">
                <Mic className="h-4 w-4 mr-1" />
                Voice Interaction
              </h5>
              <ul className="text-blue-600 space-y-1">
                <li>• Click the microphone button in the agent window</li>
                <li>• Allow microphone access when prompted</li>
                <li>• Speak naturally about cocktails, wines, or spirits</li>
                <li>• Watch the avatar respond with realistic lip-sync</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-blue-700 mb-2 flex items-center">
                <Volume2 className="h-4 w-4 mr-1" />
                Text Chat
              </h5>
              <ul className="text-blue-600 space-y-1">
                <li>• Use the text input for typed questions</li>
                <li>• Ask about menu items and recommendations</li>
                <li>• Get expert advice on wine and spirit pairings</li>
                <li>• Learn about Nauti-Bouys unique offerings</li>
              </ul>
            </div>
          </div>
          
          {/* Sample Questions */}
          <div className="mt-4 pt-4 border-t border-blue-200">
            <h5 className="font-medium text-blue-700 mb-2">🗣️ Try These Sample Questions:</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <strong className="text-blue-700">🍹 Cocktails:</strong>
                <p className="text-blue-600">"What's your signature cocktail?"</p>
              </div>
              <div>
                <strong className="text-blue-700">🥃 Spirits:</strong>
                <p className="text-blue-600">"Show me your premium bourbon selection"</p>
              </div>
              <div>
                <strong className="text-blue-700">📅 Services:</strong>
                <p className="text-blue-600">"I'd like to make a reservation"</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug Info (only in development) */}
      {import.meta.env.DEV && (
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer hover:text-gray-700">Debug Information</summary>
          <div className="mt-2 p-2 bg-gray-100 rounded font-mono">
            <div>Status: {agentStatus}</div>
            <div>Script Loaded: {isScriptLoaded ? 'Yes' : 'No'}</div>
            <div>Container ID: did-agent-container</div>
            <div>Agent ID: v2_agt_AYiJdoSm</div>
          </div>
        </details>
      )}
    </div>
  )
}

export default SimpleDidAgent
