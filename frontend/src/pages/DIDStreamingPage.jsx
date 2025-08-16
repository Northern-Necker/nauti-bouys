import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Anchor, Zap, Brain, DollarSign, Clock, Shield, ArrowLeft } from 'lucide-react'
import DIDTalksStreaming from '../components/d-id/DIDTalksStreaming'

const DIDStreamingPage = () => {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [sessionData, setSessionData] = useState(null)
  const [performanceMetrics, setPerformanceMetrics] = useState({
    responseTime: 0,
    tokensUsed: 0,
    costSavings: 90
  })

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsAuthenticated(!!token)
  }, [])

  // Handle agent ready
  const handleAgentReady = (data) => {
    console.log('D-ID Streaming Agent Ready:', data)
    setSessionData(data)
  }

  // Handle agent error
  const handleAgentError = (error) => {
    console.error('D-ID Streaming Agent Error:', error)
  }

  // Handle session start
  const handleSessionStart = (data) => {
    console.log('D-ID Streaming Session Started:', data)
  }

  // Handle new message
  const handleMessage = (message) => {
    console.log('New Message:', message)
    
    // Update performance metrics
    if (message.usage) {
      setPerformanceMetrics(prev => ({
        ...prev,
        tokensUsed: prev.tokensUsed + (message.usage.totalTokens || 0)
      }))
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          <Anchor className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            Please log in to access the D-ID Streaming AI Bartender.
          </p>
          <button
            onClick={() => navigate('/auth/login')}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-3">
                <Anchor className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-800">D-ID Talks Streaming</h1>
                  <p className="text-sm text-gray-600">Powered by Gemini 2.5 Flash</p>
                </div>
              </div>
            </div>
            
            {/* Performance Metrics */}
            <div className="hidden md:flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-green-600" />
                <span className="text-gray-600">~2.1s latency</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-gray-600">90% cost savings</span>
              </div>
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 text-blue-600" />
                <span className="text-gray-600">{performanceMetrics.tokensUsed} tokens</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Info Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">🎯 D-ID Talks Streaming + Gemini 2.5 Flash</h2>
              <p className="text-blue-100 mb-4">
                Experience the perfect fusion of D-ID's real-time avatar streaming with your sophisticated Gemini 2.5 Flash backend. 
                Get all the advanced AI capabilities with professional video avatars.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-500 bg-opacity-50 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-5 h-5" />
                    <span className="font-semibold">Real-time</span>
                  </div>
                  <p className="text-sm text-blue-100 mt-1">WebRTC Streaming</p>
                </div>
                
                <div className="bg-blue-500 bg-opacity-50 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Brain className="w-5 h-5" />
                    <span className="font-semibold">Smart AI</span>
                  </div>
                  <p className="text-sm text-blue-100 mt-1">Gemini 2.5 Flash</p>
                </div>
                
                <div className="bg-blue-500 bg-opacity-50 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5" />
                    <span className="font-semibold">Cost Efficient</span>
                  </div>
                  <p className="text-sm text-blue-100 mt-1">90% Savings</p>
                </div>
                
                <div className="bg-blue-500 bg-opacity-50 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span className="font-semibold">Full Control</span>
                  </div>
                  <p className="text-sm text-blue-100 mt-1">Your Backend</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* D-ID Streaming Component */}
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          <DIDTalksStreaming
            size="large"
            showControls={true}
            onAgentReady={handleAgentReady}
            onAgentError={handleAgentError}
            onSessionStart={handleSessionStart}
            onMessage={handleMessage}
            avatarImageUrl="https://clips-presenters.d-id.com/v2/Alyssa_NoHands_RedSuite_Lobby/qtzjxMSwEa/ypTds_0CK3/image.png"
            autoStart={true}
          />
        </div>

        {/* Technical Details */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Architecture */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Brain className="w-5 h-5 text-blue-600 mr-2" />
              Architecture Flow
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-gray-700">User Message → Speech Recognition</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span className="text-gray-700">Gemini 2.5 Flash Processing</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                <span className="text-gray-700">Patron Memory Integration</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                <span className="text-gray-700">Real-time Inventory Context</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                <span className="text-gray-700">D-ID Talks Streaming</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                <span className="text-gray-700">WebRTC Video Avatar</span>
              </div>
            </div>
          </div>

          {/* Session Info */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Shield className="w-5 h-5 text-green-600 mr-2" />
              Session Information
            </h3>
            {sessionData ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Stream ID:</span>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {sessionData.streamId?.substring(0, 12)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Session ID:</span>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {sessionData.sessionId?.substring(0, 12)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-green-600 font-semibold">{sessionData.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tokens Used:</span>
                  <span className="font-semibold">{performanceMetrics.tokensUsed}</span>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-4">
                <div className="animate-pulse">Initializing session...</div>
              </div>
            )}
          </div>
        </div>

        {/* Features Comparison */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6 text-center">
            Why D-ID Talks Streaming + Gemini is Superior
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Feature</th>
                  <th className="text-center py-3 px-4 font-semibold text-green-700">D-ID + Gemini</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-500">D-ID Agents</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-500">Embedded Widget</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 px-4 font-medium">Real-time Avatar</td>
                  <td className="py-3 px-4 text-center text-green-600">✅</td>
                  <td className="py-3 px-4 text-center text-green-600">✅</td>
                  <td className="py-3 px-4 text-center text-red-600">❌</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Custom LLM Backend</td>
                  <td className="py-3 px-4 text-center text-green-600">✅</td>
                  <td className="py-3 px-4 text-center text-red-600">❌</td>
                  <td className="py-3 px-4 text-center text-red-600">❌</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Patron Memory</td>
                  <td className="py-3 px-4 text-center text-green-600">✅</td>
                  <td className="py-3 px-4 text-center text-red-600">❌</td>
                  <td className="py-3 px-4 text-center text-red-600">❌</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Real-time Inventory</td>
                  <td className="py-3 px-4 text-center text-green-600">✅</td>
                  <td className="py-3 px-4 text-center text-red-600">❌</td>
                  <td className="py-3 px-4 text-center text-red-600">❌</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Cost Efficiency</td>
                  <td className="py-3 px-4 text-center text-green-600">90% savings</td>
                  <td className="py-3 px-4 text-center text-red-600">High cost</td>
                  <td className="py-3 px-4 text-center text-yellow-600">Medium</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Latency</td>
                  <td className="py-3 px-4 text-center text-green-600">~2.1s</td>
                  <td className="py-3 px-4 text-center text-green-600">~2.0s</td>
                  <td className="py-3 px-4 text-center text-green-600">~0.8s</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Customization</td>
                  <td className="py-3 px-4 text-center text-green-600">Complete</td>
                  <td className="py-3 px-4 text-center text-red-600">Limited</td>
                  <td className="py-3 px-4 text-center text-red-600">None</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DIDStreamingPage
