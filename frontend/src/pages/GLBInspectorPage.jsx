import { useState, useEffect } from 'react'
import { inspectGLBModel } from '../utils/glbInspector'

const GLBInspectorPage = () => {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const analyzeModel = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await inspectGLBModel('/assets/SavannahAvatar.glb')
      setAnalysis(result)
      console.log('GLB Analysis Complete:', result)
    } catch (err) {
      setError(err.message)
      console.error('GLB Analysis Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    analyzeModel()
  }, [])

  const renderBoneCategory = (categoryName, bones) => {
    if (bones.length === 0) return null
    
    return (
      <div key={categoryName} className="mb-4">
        <h4 className="font-semibold text-lg text-bay-700 mb-2 capitalize">
          {categoryName} Bones ({bones.length})
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {bones.map((bone, index) => (
            <div key={index} className="bg-gray-50 p-2 rounded text-sm">
              <div className="font-medium">{bone.name}</div>
              {bone.parent && (
                <div className="text-gray-600">Parent: {bone.parent}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderMorphTargets = (morphTargets) => {
    if (morphTargets.total === 0) return null

    return (
      <div className="mb-6">
        <h3 className="text-xl font-bold text-bay-800 mb-4">
          Morph Targets ({morphTargets.total})
        </h3>
        {morphTargets.meshes.map((mesh, index) => (
          <div key={index} className="mb-4">
            <h4 className="font-semibold text-lg text-bay-700 mb-2">
              {mesh.meshName} ({mesh.targets.length} targets)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {mesh.targets.map((target, targetIndex) => (
                <div key={targetIndex} className="bg-green-50 p-2 rounded text-sm">
                  <div className="font-medium">{target.name}</div>
                  <div className="text-gray-600">
                    Vertices: {target.vertexCount}
                  </div>
                  <div className="text-gray-600">
                    Influence: {mesh.influences[target.index]?.toFixed(3) || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderAnimations = (animations) => {
    if (animations.total === 0) return null

    return (
      <div className="mb-6">
        <h3 className="text-xl font-bold text-bay-800 mb-4">
          Animations ({animations.total})
        </h3>
        {animations.animations.map((animation, index) => (
          <div key={index} className="bg-blue-50 p-4 rounded mb-4">
            <h4 className="font-semibold text-lg text-bay-700 mb-2">
              {animation.name}
            </h4>
            <div className="text-sm text-gray-600 mb-2">
              Duration: {animation.duration.toFixed(2)}s
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {animation.tracks.map((track, trackIndex) => (
                <div key={trackIndex} className="bg-white p-2 rounded text-sm">
                  <div className="font-medium">{track.name}</div>
                  <div className="text-gray-600">Type: {track.type}</div>
                  <div className="text-gray-600">
                    Keyframes: {track.times} | Values: {track.values}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderCapabilities = (capabilities) => {
    return (
      <div className="mb-6">
        <h3 className="text-xl font-bold text-bay-800 mb-4">Animation Capabilities</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(capabilities).map(([capability, supported]) => (
            <div
              key={capability}
              className={`p-3 rounded-lg text-center ${
                supported 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}
            >
              <div className="font-medium capitalize">
                {capability.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div className="text-sm mt-1">
                {supported ? '✅ Supported' : '❌ Not Available'}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderRecommendations = (recommendations) => {
    if (recommendations.length === 0) return null

    return (
      <div className="mb-6">
        <h3 className="text-xl font-bold text-bay-800 mb-4">
          Animation Recommendations
        </h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <ul className="space-y-2">
            {recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start">
                <span className="text-yellow-600 mr-2">💡</span>
                <span className="text-yellow-800">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bay-50 to-sand-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bay-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-bay-800">
              Analyzing GLB Model...
            </h2>
            <p className="text-bay-600 mt-2">
              Inspecting bone structure and animation capabilities
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bay-50 to-sand-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-red-800 mb-4">
              Analysis Error
            </h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={analyzeModel}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retry Analysis
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bay-50 to-sand-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-bay-800 mb-4">
              GLB Model Inspector
            </h2>
            <button
              onClick={analyzeModel}
              className="bg-bay-600 text-white px-6 py-3 rounded-lg hover:bg-bay-700"
            >
              Start Analysis
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bay-50 to-sand-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-bay-800 mb-4">
            GLB Model Analysis Report
          </h1>
          <p className="text-xl text-bay-600">
            SavannahAvatar.glb Animation Capabilities
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-md text-center">
            <div className="text-2xl font-bold text-bay-800">
              {analysis.summary.totalBones}
            </div>
            <div className="text-bay-600">Total Bones</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md text-center">
            <div className="text-2xl font-bold text-bay-800">
              {analysis.summary.totalMorphTargets}
            </div>
            <div className="text-bay-600">Morph Targets</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md text-center">
            <div className="text-2xl font-bold text-bay-800">
              {analysis.summary.totalAnimations}
            </div>
            <div className="text-bay-600">Animations</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md text-center">
            <div className={`text-2xl font-bold ${
              analysis.summary.canAnimate ? 'text-green-600' : 'text-red-600'
            }`}>
              {analysis.summary.canAnimate ? '✅' : '❌'}
            </div>
            <div className="text-bay-600">Can Animate</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Animation Capabilities */}
          {renderCapabilities(analysis.report.capabilities)}

          {/* Recommendations */}
          {renderRecommendations(analysis.report.recommendations)}

          {/* Morph Targets */}
          {renderMorphTargets(analysis.analysis.morphTargets)}

          {/* Animations */}
          {renderAnimations(analysis.analysis.animations)}

          {/* Bone Structure */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-bay-800 mb-4">
              Bone Structure ({analysis.analysis.bones.total} bones)
            </h3>
            {Object.entries(analysis.analysis.bones.categories).map(([category, bones]) =>
              renderBoneCategory(category, bones)
            )}
          </div>

          {/* Materials */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-bay-800 mb-4">
              Materials ({analysis.analysis.materials.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.analysis.materials.map((material, index) => (
                <div key={index} className="bg-purple-50 p-4 rounded">
                  <h4 className="font-semibold text-purple-800 mb-2">
                    {material.name || `Material ${index + 1}`}
                  </h4>
                  <div className="text-sm text-purple-700 space-y-1">
                    <div>Type: {material.type}</div>
                    <div>Has Texture: {material.hasMap ? '✅' : '❌'}</div>
                    <div>Has Normal Map: {material.hasNormalMap ? '✅' : '❌'}</div>
                    <div>Transparent: {material.transparent ? '✅' : '❌'}</div>
                    <div>Opacity: {material.opacity}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Meshes */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-bay-800 mb-4">
              Meshes ({analysis.analysis.meshes.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.analysis.meshes.map((mesh, index) => (
                <div key={index} className="bg-indigo-50 p-4 rounded">
                  <h4 className="font-semibold text-indigo-800 mb-2">
                    {mesh.name || `Mesh ${index + 1}`}
                  </h4>
                  <div className="text-sm text-indigo-700 space-y-1">
                    <div>Vertices: {mesh.vertices.toLocaleString()}</div>
                    <div>Faces: {mesh.faces.toLocaleString()}</div>
                    <div>Has UV: {mesh.hasUV ? '✅' : '❌'}</div>
                    <div>Has Skinning: {mesh.hasSkinning ? '✅' : '❌'}</div>
                    <div>Morph Targets: {mesh.morphTargets}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={analyzeModel}
            className="bg-bay-600 text-white px-6 py-3 rounded-lg hover:bg-bay-700"
          >
            Re-analyze Model
          </button>
        </div>
      </div>
    </div>
  )
}

export default GLBInspectorPage
