import { useState, useEffect } from 'react'
import { Anchor, Video, MessageCircle, AlertCircle, Settings, CheckCircle, ExternalLink } from 'lucide-react'
import NautiBouysDIDAgent from '../components/d-id/NautiBouysDIDAgent'

const NautiBouysDIDAgentPage = () => {
  const [agentStatus, setAgentStatus] = useState(null)
  const [sessionInfo, setSessionInfo] = useState(null)
  const [error, setError] = useState(null)
  const [showDemo, setShowDemo] = useState(false)

  const handleAgentReady = (data) => {
    console.log('[D-ID Agent Page] Agent ready:', data)
    setAgentStatus('ready')
    setSessionInfo(data)
    setError(null)
  }

  const handleAgentError = (error) => {
    console.error('[D-ID Agent Page] Agent error:', error)
    setAgentStatus('error')
    setError(error.message)
  }

  const handleSessionStart = (data) => {
    console.log('[D-ID Agent Page] Session started:', data)
    setSessionInfo(prev => ({ ...prev, ...data }))
  }

  const handleMessage = (message) => {
    console.log('[D-ID Agent Page] Message:', message)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-teal-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg">
                  <Video className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">D-ID Agent Integration</h1>
                  <p className="text-gray-600">Professional AI Bartender with External LLM</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {agentStatus === 'ready' && (
                <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-700 font-medium">Agent Ready</span>
                </div>
              )}
              
              {agentStatus === 'error' && (
                <div className="flex items-center space-x-2 px-4 py-2 bg-red-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-700 font-medium">Agent Error</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Introduction Section */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-teal-200 p-8">
            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-teal-600 rounded-xl">
                  <Anchor className="h-12 w-12 text-white" />
                </div>
              </div>
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Nauti Bouys D-ID Agent Implementation
                </h2>
                
                <div className="prose prose-lg text-gray-700 mb-6">
                  <p>
                    This implementation showcases the integration of <strong>D-ID Agents API</strong> with 
                    your existing <strong>Gemini 2.5 Flash backend</strong>. D-ID provides the professional 
                    avatar and lip sync technology, while your backend handles all the intelligence, 
                    memory, and bartending expertise.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-lg p-4 border border-teal-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <Video className="h-6 w-6 text-teal-600" />
                      <h3 className="font-semibold text-teal-800">D-ID Agent</h3>
                    </div>
                    <p className="text-sm text-teal-700">
                      Professional avatar with WebRTC streaming, voice synthesis, and lip sync
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <MessageCircle className="h-6 w-6 text-blue-600" />
                      <h3 className="font-semibold text-blue-800">External LLM</h3>
                    </div>
                    <p className="text-sm text-blue-700">
                      Your Gemini 2.5 Flash backend provides all intelligence and memory
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <Anchor className="h-6 w-6 text-purple-600" />
                      <h3 className="font-semibold text-purple-800">Bartending AI</h3>
                    </div>
                    <p className="text-sm text-purple-700">
                      Professional bartending expertise with inventory and patron memory
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowDemo(!showDemo)}
                    className="px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-lg hover:from-teal-700 hover:to-blue-700 transition-all duration-200 font-medium"
                  >
                    {showDemo ? 'Hide Demo' : 'Launch D-ID Agent Demo'}
                  </button>
                  
                  <a
                    href="https://docs.d-id.com/reference/agents-overview"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 text-teal-600 hover:text-teal-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>D-ID Agents Documentation</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Architecture */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Settings className="h-6 w-6 mr-3 text-gray-600" />
              Technical Architecture
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-gray-800 mb-4">D-ID Agent Flow</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 bg-teal-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <span className="text-sm text-gray-700">Create D-ID Agent with external LLM webhook</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 bg-teal-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <span className="text-sm text-gray-700">Create chat session and WebRTC stream</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 bg-teal-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <span className="text-sm text-gray-700">User sends message → D-ID calls your webhook</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 bg-teal-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                    <span className="text-sm text-gray-700">Your backend processes with Gemini 2.5 Flash</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 bg-teal-500 text-white rounded-full flex items-center justify-center text-xs font-bold">5</div>
                    <span className="text-sm text-gray-700">D-ID streams response via WebRTC with lip sync</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-4">Backend Integration</h4>
                <div className="bg-gray-900 rounded-lg p-4 text-sm">
                  <pre className="text-green-400 overflow-x-auto">
{`// D-ID Agent Webhook Endpoint
POST /api/d-id-agent/webhook

{
  "message": "What bourbon do you recommend?",
  "sessionId": "nauti_agent_123...",
  "agentId": "agt_abc123...",
  "chatId": "cht_xyz789..."
}

// Your Backend Response
{
  "response": "I recommend Buffalo Trace ($25) 
             for cocktails or Blanton's ($200) 
             for sipping neat...",
  "emotion": "friendly"
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Session Information */}
        {sessionInfo && (
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-lg border border-blue-200 p-6">
              <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Active Session Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-xs text-blue-600 font-medium mb-1">Session ID</div>
                  <div className="text-sm text-blue-800 font-mono">{sessionInfo.sessionId?.substring(0, 16)}...</div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-xs text-green-600 font-medium mb-1">Agent ID</div>
                  <div className="text-sm text-green-800 font-mono">{sessionInfo.agentId?.substring(0, 16)}...</div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-xs text-purple-600 font-medium mb-1">Chat ID</div>
                  <div className="text-sm text-purple-800 font-mono">{sessionInfo.chatId?.substring(0, 16)}...</div>
                </div>
                
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-xs text-orange-600 font-medium mb-1">Stream ID</div>
                  <div className="text-sm text-orange-800 font-mono">{sessionInfo.streamId?.substring(0, 16)}...</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-8">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <h3 className="text-lg font-bold text-red-900">Agent Error</h3>
              </div>
              <p className="text-red-700 mb-4">{error}</p>
              <div className="bg-red-100 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2">Troubleshooting:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Check that VITE_DID_API_KEY is set in frontend/.env</li>
                  <li>• Verify D-ID API key has Agents API access</li>
                  <li>• Ensure backend webhook endpoint is accessible</li>
                  <li>• Check browser console for detailed error messages</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* D-ID Agent Demo */}
        {showDemo && (
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-lg border border-teal-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <Video className="h-6 w-6 mr-3 text-teal-600" />
                  Live D-ID Agent Demo
                </h3>
                <button
                  onClick={() => setShowDemo(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <NautiBouysDIDAgent
                size="large"
                showControls={true}
                onAgentReady={handleAgentReady}
                onAgentError={handleAgentError}
                onSessionStart={handleSessionStart}
                onMessage={handleMessage}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Implementation Benefits */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Implementation Benefits</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-gray-800 mb-4 text-green-700">✅ What You Get</h4>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Professional D-ID avatar with perfect lip sync</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Real-time WebRTC streaming for natural conversations</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Your existing Gemini 2.5 Flash intelligence preserved</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Complete patron memory and conversation history</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Real-time beverage inventory integration</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Professional bartending expertise and spirit protection</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Cost-effective: 90% savings vs OpenAI maintained</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-4 text-blue-700">🔧 Technical Features</h4>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start space-x-3">
                  <Video className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>D-ID Agents API with external LLM webhook</span>
                </li>
                <li className="flex items-start space-x-3">
                  <MessageCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>WebRTC streaming for low-latency communication</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Settings className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Microsoft Neural voice synthesis</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Anchor className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Custom Savannah avatar with maritime personality</span>
                </li>
                <li className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Error handling and connection retry logic</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Session management and conversation tracking</span>
                </li>
                <li className="flex items-start space-x-3">
                  <ExternalLink className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Seamless integration with existing backend</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NautiBouysDIDAgentPage
