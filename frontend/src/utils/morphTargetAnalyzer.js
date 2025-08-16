import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

/**
 * Morph Target Analyzer - Analyzes and categorizes morph targets for lip sync and emotions
 */
export class MorphTargetAnalyzer {
  constructor() {
    this.loader = new GLTFLoader()
  }

  /**
   * Analyze morph targets and categorize them for animation
   * @param {string} modelPath - Path to the GLB model
   * @returns {Promise<Object>} Categorized morph targets
   */
  async analyzeMorphTargets(modelPath) {
    try {
      const gltf = await this.loadModel(modelPath)
      const morphData = this.extractMorphTargets(gltf.scene)
      const categorized = this.categorizeMorphTargets(morphData)
      const visemeMapping = this.createVisemeMapping(categorized.mouth)
      
      return {
        total: morphData.length,
        morphTargets: morphData,
        categories: categorized,
        visemeMapping,
        recommendations: this.generateRecommendations(categorized)
      }
    } catch (error) {
      console.error('Error analyzing morph targets:', error)
      throw error
    }
  }

  /**
   * Load GLB model
   */
  loadModel(modelPath) {
    return new Promise((resolve, reject) => {
      this.loader.load(
        modelPath,
        (gltf) => resolve(gltf),
        (progress) => console.log('Loading progress:', progress),
        (error) => reject(error)
      )
    })
  }

  /**
   * Extract all morph targets from the model
   */
  extractMorphTargets(scene) {
    const morphTargets = []
    
    scene.traverse((child) => {
      if (child.isMesh && child.morphTargetInfluences && child.morphTargetDictionary) {
        Object.entries(child.morphTargetDictionary).forEach(([name, index]) => {
          morphTargets.push({
            name,
            index,
            meshName: child.name,
            currentInfluence: child.morphTargetInfluences[index] || 0,
            mesh: child
          })
        })
      }
    })

    return morphTargets.sort((a, b) => a.name.localeCompare(b.name))
  }

  /**
   * Categorize morph targets by type for animation
   */
  categorizeMorphTargets(morphTargets) {
    const categories = {
      mouth: [],
      eyes: [],
      eyebrows: [],
      cheeks: [],
      nose: [],
      jaw: [],
      tongue: [],
      emotions: [],
      other: []
    }

    morphTargets.forEach(target => {
      const name = target.name.toLowerCase()
      
      // Mouth and lip shapes (for lip sync)
      if (this.isMouthTarget(name)) {
        categories.mouth.push(target)
      }
      // Eyes (blinking, gaze)
      else if (this.isEyeTarget(name)) {
        categories.eyes.push(target)
      }
      // Eyebrows (expressions)
      else if (this.isEyebrowTarget(name)) {
        categories.eyebrows.push(target)
      }
      // Cheeks (smiling, expressions)
      else if (this.isCheekTarget(name)) {
        categories.cheeks.push(target)
      }
      // Nose (expressions)
      else if (this.isNoseTarget(name)) {
        categories.nose.push(target)
      }
      // Jaw (mouth opening)
      else if (this.isJawTarget(name)) {
        categories.jaw.push(target)
      }
      // Tongue (advanced lip sync)
      else if (this.isTongueTarget(name)) {
        categories.tongue.push(target)
      }
      // Emotional expressions
      else if (this.isEmotionTarget(name)) {
        categories.emotions.push(target)
      }
      // Everything else
      else {
        categories.other.push(target)
      }
    })

    return categories
  }

  /**
   * Check if morph target is mouth-related
   */
  isMouthTarget(name) {
    const mouthKeywords = [
      'mouth', 'lip', 'lips', 'smile', 'frown', 'pucker', 'kiss',
      'open', 'close', 'wide', 'narrow', 'corner', 'upper', 'lower',
      'viseme', 'phoneme', 'aa', 'ee', 'ih', 'oh', 'ou', 'pp', 'ff', 'th', 'dd', 'kk', 'ch', 'ss', 'nn', 'rr'
    ]
    return mouthKeywords.some(keyword => name.includes(keyword))
  }

  /**
   * Check if morph target is eye-related
   */
  isEyeTarget(name) {
    const eyeKeywords = [
      'eye', 'eyes', 'blink', 'wink', 'squint', 'wide', 'close', 'lid', 'lids'
    ]
    return eyeKeywords.some(keyword => name.includes(keyword))
  }

  /**
   * Check if morph target is eyebrow-related
   */
  isEyebrowTarget(name) {
    const eyebrowKeywords = [
      'brow', 'eyebrow', 'eyebrows', 'raise', 'lower', 'furrow', 'arch'
    ]
    return eyebrowKeywords.some(keyword => name.includes(keyword))
  }

  /**
   * Check if morph target is cheek-related
   */
  isCheekTarget(name) {
    const cheekKeywords = [
      'cheek', 'cheeks', 'puff', 'suck', 'dimple'
    ]
    return cheekKeywords.some(keyword => name.includes(keyword))
  }

  /**
   * Check if morph target is nose-related
   */
  isNoseTarget(name) {
    const noseKeywords = [
      'nose', 'nostril', 'nostrils', 'sneer', 'flare'
    ]
    return noseKeywords.some(keyword => name.includes(keyword))
  }

  /**
   * Check if morph target is jaw-related
   */
  isJawTarget(name) {
    const jawKeywords = [
      'jaw', 'chin', 'mandible'
    ]
    return jawKeywords.some(keyword => name.includes(keyword))
  }

  /**
   * Check if morph target is tongue-related
   */
  isTongueTarget(name) {
    const tongueKeywords = [
      'tongue', 'lick'
    ]
    return tongueKeywords.some(keyword => name.includes(keyword))
  }

  /**
   * Check if morph target is emotion-related
   */
  isEmotionTarget(name) {
    const emotionKeywords = [
      'happy', 'sad', 'angry', 'surprised', 'fear', 'disgust', 'contempt',
      'joy', 'sorrow', 'rage', 'shock', 'terror', 'revulsion'
    ]
    return emotionKeywords.some(keyword => name.includes(keyword))
  }

  /**
   * Create viseme mapping for lip sync
   */
  createVisemeMapping(mouthTargets) {
    const visemeMap = {}
    
    // Standard visemes and their phonetic representations
    const standardVisemes = {
      'sil': ['silence', 'rest', 'neutral', 'close'],
      'PP': ['p', 'b', 'm', 'pucker', 'press'],
      'FF': ['f', 'v', 'bite', 'lower'],
      'TH': ['th', 'tongue', 'tip'],
      'DD': ['t', 'd', 'n', 'l', 'dental'],
      'kk': ['k', 'g', 'back'],
      'CH': ['ch', 'j', 'sh', 'zh', 'palatal'],
      'SS': ['s', 'z', 'hiss'],
      'nn': ['ng', 'nasal'],
      'RR': ['r', 'roll'],
      'aa': ['a', 'ah', 'open', 'wide'],
      'E': ['e', 'eh', 'mid'],
      'I': ['i', 'ih', 'ee', 'high'],
      'O': ['o', 'oh', 'round'],
      'U': ['u', 'oo', 'ou', 'round', 'back']
    }

    // Try to map morph targets to visemes
    Object.entries(standardVisemes).forEach(([viseme, keywords]) => {
      const matchingTarget = mouthTargets.find(target => {
        const name = target.name.toLowerCase()
        return keywords.some(keyword => name.includes(keyword))
      })
      
      if (matchingTarget) {
        visemeMap[viseme] = matchingTarget.name
      }
    })

    return visemeMap
  }

  /**
   * Generate recommendations based on analysis
   */
  generateRecommendations(categories) {
    const recommendations = []
    
    if (categories.mouth.length > 0) {
      recommendations.push(`Found ${categories.mouth.length} mouth targets - excellent for lip sync`)
    }
    
    if (categories.eyes.length > 0) {
      recommendations.push(`Found ${categories.eyes.length} eye targets - can implement blinking and gaze`)
    }
    
    if (categories.eyebrows.length > 0) {
      recommendations.push(`Found ${categories.eyebrows.length} eyebrow targets - good for expressions`)
    }
    
    if (categories.emotions.length > 0) {
      recommendations.push(`Found ${categories.emotions.length} emotion targets - can implement facial emotions`)
    }
    
    if (categories.jaw.length > 0) {
      recommendations.push(`Found ${categories.jaw.length} jaw targets - can enhance mouth opening`)
    }
    
    if (categories.tongue.length > 0) {
      recommendations.push(`Found ${categories.tongue.length} tongue targets - advanced lip sync possible`)
    }

    return recommendations
  }

  /**
   * Test morph target by setting its influence
   */
  testMorphTarget(morphTarget, influence = 1.0) {
    if (morphTarget.mesh && morphTarget.mesh.morphTargetInfluences) {
      morphTarget.mesh.morphTargetInfluences[morphTarget.index] = influence
      console.log(`Set ${morphTarget.name} to ${influence}`)
    }
  }

  /**
   * Reset all morph targets to 0
   */
  resetAllMorphTargets(morphTargets) {
    morphTargets.forEach(target => {
      if (target.mesh && target.mesh.morphTargetInfluences) {
        target.mesh.morphTargetInfluences[target.index] = 0
      }
    })
  }
}

// Export utility function
export const analyzeMorphTargets = async (modelPath) => {
  const analyzer = new MorphTargetAnalyzer()
  return await analyzer.analyzeMorphTargets(modelPath)
}

export default MorphTargetAnalyzer
