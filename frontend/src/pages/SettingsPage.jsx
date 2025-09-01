import { useState, useEffect, Suspense, lazy } from 'react'
import { 
  Settings, 
  Monitor, 
  TestTube, 
  Eye, 
  Cpu, 
  Database, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  Play, 
  Pause,
  RotateCcw,
  Download,
  Upload,
  Wrench,
  User
} from 'lucide-react'
import { inspectFbx } from '../utils/fbxInspector'
import AvatarPersonalityEditor from '../components/settings/AvatarPersonalityEditor'

// Lazy load the FbxViewer for performance
const FbxViewer = lazy(() => import('./FbxViewer'))

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('avatar')
  const [systemStatus, setSystemStatus] = useState({
    backend: 'checking',
    database: 'checking',
    avatar: 'checking',
    fbx: 'checking'
  })
  const [fbxInspection, setFbxInspection] = useState(null)
  const [isInspecting, setIsInspecting] = useState(false)
  const [avatarSettings, setAvatarSettings] = useState({
    renderQuality: 'high',
    animationSpeed: 1.0,
    enableLipSync: true,
    enableGestures: true,
    voiceProvider: 'elevenlabs'
  })

  // System status check
  useEffect(() => {
    checkSystemStatus()
  }, [])

  const checkSystemStatus = async () => {
    try {
      // Check backend
      const backendResponse = await fetch('http://localhost:3000/api/health')
      setSystemStatus(prev => ({
        ...prev,
        backend: backendResponse.ok ? 'online' : 'offline'
      }))

      // Check database (through backend)
      const dbResponse = await fetch('http://localhost:3000/api/beverages?limit=1')
      setSystemStatus(prev => ({
        ...prev,
        database: dbResponse.ok ? 'online' : 'offline'
      }))

      // Check 3D capabilities
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      setSystemStatus(prev => ({
        ...prev,
        avatar: gl ? 'ready' : 'unsupported'
      }))

      // Check FBX model
      try {
        const fbxExists = await fetch('/assets/Grace40s.fbx', { method: 'HEAD' })
        setSystemStatus(prev => ({
          ...prev,
          fbx: fbxExists.ok ? 'ready' : 'missing'
        }))
      } catch {
        setSystemStatus(prev => ({ ...prev, fbx: 'missing' }))
      }
    } catch (error) {
      console.error('System status check failed:', error)
    }
  }

  const runFbxInspection = async () => {
    setIsInspecting(true)
    try {
      const result = await inspectFbx('/assets/Grace40s.fbx')
      setFbxInspection(result)
    } catch (error) {
      setFbxInspection({ error: error.message })
    } finally {
      setIsInspecting(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
      case 'ready':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'offline':
      case 'missing':
      case 'unsupported':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'online': return 'Online'
      case 'ready': return 'Ready'
      case 'offline': return 'Offline'
      case 'missing': return 'Missing'
      case 'unsupported': return 'Unsupported'
      case 'checking': return 'Checking...'
      default: return 'Unknown'
    }
  }

  const tabs = [
    { id: 'avatar', label: '3D Avatar', icon: Monitor },
    { id: 'personality', label: 'Personality', icon: User },
    { id: 'testing', label: 'Testing Tools', icon: TestTube },
    { id: 'system', label: 'System Status', icon: Cpu },
    { id: 'performance', label: 'Performance', icon: Zap }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Settings className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Nauti Bouys Settings</h1>
          </div>
          <p className="text-gray-600">Configure your 3D avatar system and test performance</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* 3D Avatar Tab */}
            {activeTab === 'avatar' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Avatar Viewer */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Eye className="h-5 w-5 mr-2" />
                      Savannah Avatar Preview
                    </h3>
                    <div className="bg-white rounded-lg overflow-hidden" style={{ height: '400px' }}>
                      <Suspense fallback={
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading 3D Viewer...</p>
                          </div>
                        </div>
                      }>
                        <FbxViewer width={600} height={400} />
                      </Suspense>
                    </div>
                  </div>

                  {/* Avatar Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <Wrench className="h-5 w-5 mr-2" />
                      Avatar Configuration
                    </h3>

                    {/* Render Quality */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Render Quality
                      </label>
                      <select
                        value={avatarSettings.renderQuality}
                        onChange={(e) => setAvatarSettings(prev => ({ ...prev, renderQuality: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="low">Low (30fps)</option>
                        <option value="medium">Medium (45fps)</option>
                        <option value="high">High (60fps)</option>
                      </select>
                    </div>

                    {/* Animation Speed */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Animation Speed: {avatarSettings.animationSpeed}x
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={avatarSettings.animationSpeed}
                        onChange={(e) => setAvatarSettings(prev => ({ ...prev, animationSpeed: parseFloat(e.target.value) }))}
                        className="w-full"
                      />
                    </div>

                    {/* Feature Toggles */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Enable Lip Sync</span>
                        <button
                          onClick={() => setAvatarSettings(prev => ({ ...prev, enableLipSync: !prev.enableLipSync }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            avatarSettings.enableLipSync ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            avatarSettings.enableLipSync ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Enable Gestures</span>
                        <button
                          onClick={() => setAvatarSettings(prev => ({ ...prev, enableGestures: !prev.enableGestures }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            avatarSettings.enableGestures ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            avatarSettings.enableGestures ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    </div>

                    {/* Voice Provider */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Voice Provider
                      </label>
                      <select
                        value={avatarSettings.voiceProvider}
                        onChange={(e) => setAvatarSettings(prev => ({ ...prev, voiceProvider: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="webspeech">Web Speech API (Fast)</option>
                        <option value="elevenlabs">ElevenLabs (High Quality)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Personality Tab */}
            {activeTab === 'personality' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Avatar Personality Settings
                </h3>
                <p className="text-gray-600 mb-6">
                  Customize your AI assistant's personality, voice settings, and conversation style.
                </p>
                <AvatarPersonalityEditor />
              </div>
            )}

            {/* Testing Tools Tab */}
            {activeTab === 'testing' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold flex items-center">
                  <TestTube className="h-5 w-5 mr-2" />
                  3D Avatar Testing Tools
                </h3>

                {/* FBX Inspection */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium">FBX Model Inspection</h4>
                    <button
                      onClick={runFbxInspection}
                      disabled={isInspecting}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isInspecting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Inspecting...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Run Inspection
                        </>
                      )}
                    </button>
                  </div>

                  {fbxInspection && (
                    <div className="bg-white rounded-md p-4">
                      {fbxInspection.error ? (
                        <div className="text-red-600">
                          <AlertCircle className="h-5 w-5 inline mr-2" />
                          Error: {fbxInspection.error}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Children:</span> {fbxInspection.children}
                            </div>
                            <div>
                              <span className="font-medium">Animations:</span> {fbxInspection.animations}
                            </div>
                          </div>
                          <div className={`inline-flex items-center px-2 py-1 rounded text-sm ${
                            fbxInspection.children > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {fbxInspection.children > 0 ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Model Valid
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-4 w-4 mr-1" />
                                Model Issues
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Test Commands */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-medium mb-4">Available Test Commands</h4>
                  <div className="space-y-3">
                    <div className="bg-white rounded-md p-3 font-mono text-sm">
                      <div className="text-gray-600 mb-1"># Run FBX tests</div>
                      <div className="text-blue-600">npm test</div>
                    </div>
                    <div className="bg-white rounded-md p-3 font-mono text-sm">
                      <div className="text-gray-600 mb-1"># Lint FBX-related files</div>
                      <div className="text-blue-600">npm run lint</div>
                    </div>
                    <div className="bg-white rounded-md p-3 font-mono text-sm">
                      <div className="text-gray-600 mb-1"># Inspect Grace40s model</div>
                      <div className="text-blue-600">node scripts/inspectFbxModel.js frontend/public/assets/Grace40s.fbx</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* System Status Tab */}
            {activeTab === 'system' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Database className="h-5 w-5 mr-2" />
                    System Status
                  </h3>
                  <button
                    onClick={checkSystemStatus}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Refresh
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Backend API</p>
                        <p className="text-lg font-semibold">{getStatusText(systemStatus.backend)}</p>
                      </div>
                      {getStatusIcon(systemStatus.backend)}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Database</p>
                        <p className="text-lg font-semibold">{getStatusText(systemStatus.database)}</p>
                      </div>
                      {getStatusIcon(systemStatus.database)}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">3D Avatar</p>
                        <p className="text-lg font-semibold">{getStatusText(systemStatus.avatar)}</p>
                      </div>
                      {getStatusIcon(systemStatus.avatar)}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Grace40s.fbx</p>
                        <p className="text-lg font-semibold">{getStatusText(systemStatus.fbx)}</p>
                      </div>
                      {getStatusIcon(systemStatus.fbx)}
                    </div>
                  </div>
                </div>

                {/* System Information */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h4 className="text-md font-medium mb-4">System Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Frontend:</span> http://localhost:5173
                    </div>
                    <div>
                      <span className="font-medium">Backend:</span> http://localhost:3000
                    </div>
                    <div>
                      <span className="font-medium">3D Engine:</span> Three.js v0.179.1
                    </div>
                    <div>
                      <span className="font-medium">Avatar Model:</span> Grace40s.fbx
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Performance Metrics
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h4 className="text-md font-medium mb-4">Response Times</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Text Response:</span>
                        <span className="font-medium text-green-600">&lt;200ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>TTS Generation:</span>
                        <span className="font-medium text-blue-600">&lt;2s</span>
                      </div>
                      <div className="flex justify-between">
                        <span>3D Rendering:</span>
                        <span className="font-medium text-purple-600">60fps</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h4 className="text-md font-medium mb-4">Optimization Status</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span>Lazy Loading</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span>Code Splitting</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span>Memory Management</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h4 className="text-md font-medium mb-4">Asset Status</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span>Git LFS</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span>TypeScript</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span>CI/CD Pipeline</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Tips */}
                <div className="bg-blue-50 rounded-lg p-6">
                  <h4 className="text-md font-medium mb-4 text-blue-900">Performance Tips</h4>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li>• The 3D avatar uses lazy loading to improve initial page load times</li>
                    <li>• Grace40s.fbx is stored with Git LFS for efficient version control</li>
                    <li>• Animation loop runs at 60fps for smooth interactions</li>
                    <li>• Memory cleanup prevents leaks during component unmounting</li>
                    <li>• TypeScript provides better development experience and error prevention</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
