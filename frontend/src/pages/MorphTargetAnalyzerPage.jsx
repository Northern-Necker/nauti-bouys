import { useState, useEffect } from 'react'
import { analyzeMorphTargets } from '../utils/morphTargetAnalyzer'

const MorphTargetAnalyzerPage = () => {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedTarget, setSelectedTarget] = useState(null)
  const [testInfluence, setTestInfluence] = useState(1.0)

  const analyzeModel = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await analyzeMorphTargets('/assets/SavannahAvatar.glb')
      setAnalysis(result)
      console.log('Morph Target Analysis Complete:', result)
    } catch (err) {
      setError(err.message)
      console.error('Morph Target Analysis Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    analyzeModel()
  }, [])

  const testMorphTarget = (target) => {
    if (target.mesh && target.mesh.morphTargetInfluences) {
      // Reset all targets first
      target.mesh.morphTargetInfluences.fill(0)
      // Set the selected target
      target.mesh.morphTargetInfluences[target.index] = testInfluence
      setSelectedTarget(target)
      console.log(`Testing ${target.name} at influence ${testInfluence}`)
    }
  }

  const resetAllTargets = () => {
    if (analysis && analysis.morphTargets) {
      analysis.morphTargets.forEach(target => {
        if (target.mesh && target.mesh.morphTargetInfluences) {
          target.mesh.morphTargetInfluences[target.index] = 0
        }
      })
      setSelectedTarget(null)
      console.log('Reset all morph targets')
    }
  }

  const renderCategory = (categoryName, targets) => {
    if (targets.length === 0) return null
    
    return (
      <div key={categoryName} className="mb-6">
        <h3 className="text-xl font-bold text-bay-800 mb-4 capitalize">
          {categoryName} Targets ({targets.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {targets.map((target, index) => (
            <div 
              key={index} 
              className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                selectedTarget?.name === target.name 
                  ? 'bg-blue-100 border-blue-500 shadow-md' 
                  : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
              onClick={() => testMorphTarget(target)}
            >
              <div className="font-medium text-gray-800 mb-1">{target.name}</div>
              <div className="text-sm text-gray-600 mb-2">
                Index: {target.index} | Mesh: {target.meshName}
              </div>
              <div className="text-xs text-gray-500">
                Current: {target.currentInfluence.toFixed(3)}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderVisemeMapping = (visemeMapping) => {
    const mappedCount = Object.keys(visemeMapping).length
    const totalVisemes = 15 // Standard viseme count
    
    return (
      <div className="mb-6">
        <h3 className="text-xl font-bold text-bay-800 mb-4">
          Viseme Mapping ({mappedCount}/{totalVisemes} mapped)
        </h3>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(visemeMapping).map(([viseme, targetName]) => (
              <div key={viseme} className="bg-white p-3 rounded border">
                <div className="font-medium text-green-800">{viseme}</div>
                <div className="text-sm text-green-600">{targetName}</div>
              </div>
            ))}
          </div>
          {mappedCount < totalVisemes && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <div className="text-yellow-800 font-medium">Missing Visemes:</div>
              <div className="text-yellow-700 text-sm mt-1">
                Some standard visemes could not be automatically mapped. Manual mapping may be required.
              </div>
            </div>
          )}
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
              Analyzing Morph Targets...
            </h2>
            <p className="text-bay-600 mt-2">
              Categorizing facial animation capabilities
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
              Morph Target Analyzer
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
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-bay-800 mb-4">
            Morph Target Analysis
          </h1>
          <p className="text-xl text-bay-600">
            SavannahAvatar.glb Facial Animation Capabilities
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-bay-700 font-medium">Test Influence:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={testInfluence}
                onChange={(e) => setTestInfluence(parseFloat(e.target.value))}
                className="w-32"
              />
              <span className="text-bay-600 min-w-[3rem]">{testInfluence.toFixed(1)}</span>
            </div>
            <button
              onClick={resetAllTargets}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Reset All
            </button>
            <button
              onClick={analyzeModel}
              className="bg-bay-600 text-white px-4 py-2 rounded hover:bg-bay-700"
            >
              Re-analyze
            </button>
          </div>
          
          {selectedTarget && (
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <div className="font-medium text-blue-800">
                Testing: {selectedTarget.name}
              </div>
              <div className="text-blue-600 text-sm">
                Influence: {testInfluence} | Index: {selectedTarget.index} | Mesh: {selectedTarget.meshName}
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-md text-center">
            <div className="text-2xl font-bold text-bay-800">{analysis.total}</div>
            <div className="text-bay-600">Total Targets</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md text-center">
            <div className="text-2xl font-bold text-green-600">{analysis.categories.mouth.length}</div>
            <div className="text-bay-600">Mouth/Lip</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md text-center">
            <div className="text-2xl font-bold text-blue-600">{analysis.categories.eyes.length}</div>
            <div className="text-bay-600">Eyes</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md text-center">
            <div className="text-2xl font-bold text-purple-600">{analysis.categories.emotions.length}</div>
            <div className="text-bay-600">Emotions</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Viseme Mapping */}
          {renderVisemeMapping(analysis.visemeMapping)}

          {/* Recommendations */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-bay-800 mb-4">
              Animation Recommendations
            </h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <ul className="space-y-2">
                {analysis.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-yellow-600 mr-2">💡</span>
                    <span className="text-yellow-800">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Categories */}
          {Object.entries(analysis.categories).map(([category, targets]) =>
            renderCategory(category, targets)
          )}
        </div>

        <div className="text-center mt-8 text-gray-600">
          <p>Click on any morph target to test it with the current influence value.</p>
          <p>Use the slider to adjust the test influence strength.</p>
        </div>
      </div>
    </div>
  )
}

export default MorphTargetAnalyzerPage
