import * as THREE from 'three'

/**
 * CC4 Lip Sync System - Adapted from TalkingHead for ActorCore models
 * Maps Oculus LipSync visemes to CC4 morph targets
 */
export class CC4LipSync {
  constructor() {
    // Standard Oculus LipSync visemes to CC4 morph target mapping
    // This will be populated based on actual model analysis
    this.visemeToMorphMap = {
      'sil': null,        // Silence - neutral position
      'PP': null,         // P, B, M sounds - lips pressed together
      'FF': null,         // F, V sounds - lower lip to upper teeth
      'TH': null,         // TH sounds - tongue tip visible
      'DD': null,         // T, D, N, L sounds - tongue to roof
      'kk': null,         // K, G sounds - back of tongue up
      'CH': null,         // CH, J, SH sounds - tongue blade up
      'SS': null,         // S, Z sounds - tongue tip down
      'nn': null,         // NG sounds - back of tongue up, mouth open
      'RR': null,         // R sounds - tongue tip back
      'aa': null,         // A sounds - mouth wide open
      'E': null,          // E sounds - mouth half open
      'I': null,          // I sounds - mouth slightly open, corners back
      'O': null,          // O sounds - mouth open, lips rounded
      'U': null           // U sounds - mouth narrow, lips forward
    }

    // Viseme durations (from TalkingHead)
    this.visemeDurations = {
      'aa': 0.95, 'E': 0.90, 'I': 0.92, 'O': 0.96, 'U': 0.95, 'PP': 1.08,
      'SS': 1.23, 'TH': 1, 'DD': 1.05, 'FF': 1.00, 'kk': 1.21, 'nn': 0.88,
      'RR': 0.88, 'sil': 1
    }

    // Current animation state
    this.currentViseme = 'sil'
    this.targetViseme = 'sil'
    this.animationProgress = 0
    this.animationSpeed = 8.0 // Transitions per second
    this.isAnimating = false

    // Model references
    this.avatarMesh = null
    this.morphTargetInfluences = null
    this.morphTargetDictionary = null

    // Animation queue
    this.visemeQueue = []
    this.currentTime = 0
  }

  /**
   * Initialize with CC4 model and morph target mapping
   * @param {THREE.Mesh} avatarMesh - The avatar mesh with morph targets
   * @param {Object} morphTargetMapping - Mapping of visemes to morph target names
   */
  initialize(avatarMesh, morphTargetMapping = {}) {
    this.avatarMesh = avatarMesh
    this.morphTargetInfluences = avatarMesh.morphTargetInfluences
    this.morphTargetDictionary = avatarMesh.morphTargetDictionary

    // Map visemes to actual morph target indices
    Object.keys(this.visemeToMorphMap).forEach(viseme => {
      const morphTargetName = morphTargetMapping[viseme]
      if (morphTargetName && this.morphTargetDictionary[morphTargetName] !== undefined) {
        this.visemeToMorphMap[viseme] = this.morphTargetDictionary[morphTargetName]
        console.log(`Mapped viseme ${viseme} to morph target ${morphTargetName} (index ${this.visemeToMorphMap[viseme]})`)
      }
    })

    console.log('CC4 LipSync initialized with mapping:', this.visemeToMorphMap)
  }

  /**
   * Auto-detect morph target mapping based on naming conventions
   * @param {Array} morphTargets - Array of morph target objects from analyzer
   */
  autoDetectMapping(morphTargets) {
    const mapping = {}
    
    // Common CC4 morph target naming patterns for visemes
    const patterns = {
      'sil': ['neutral', 'rest', 'close', 'mouth_close'],
      'PP': ['pucker', 'press', 'pp', 'mouth_pucker', 'lips_pucker'],
      'FF': ['bite', 'lower', 'ff', 'mouth_lower', 'lip_bite'],
      'TH': ['tongue', 'tip', 'th', 'tongue_tip'],
      'DD': ['dental', 'dd', 'mouth_dental', 'tongue_dental'],
      'kk': ['back', 'kk', 'mouth_back', 'tongue_back'],
      'CH': ['palatal', 'ch', 'mouth_palatal', 'tongue_palatal'],
      'SS': ['hiss', 'ss', 'mouth_hiss', 'tongue_hiss'],
      'nn': ['nasal', 'nn', 'mouth_nasal'],
      'RR': ['roll', 'rr', 'mouth_roll', 'tongue_roll'],
      'aa': ['open', 'wide', 'aa', 'mouth_open', 'mouth_wide', 'jaw_open'],
      'E': ['mid', 'eh', 'ee', 'mouth_mid', 'mouth_eh'],
      'I': ['high', 'ih', 'ii', 'mouth_high', 'mouth_ih', 'smile'],
      'O': ['round', 'oh', 'oo', 'mouth_round', 'mouth_oh'],
      'U': ['narrow', 'uu', 'ou', 'mouth_narrow', 'mouth_uu']
    }

    // Try to match morph targets to visemes
    Object.entries(patterns).forEach(([viseme, keywords]) => {
      const matchingTarget = morphTargets.find(target => {
        const name = target.name.toLowerCase()
        return keywords.some(keyword => name.includes(keyword))
      })
      
      if (matchingTarget) {
        mapping[viseme] = matchingTarget.name
        console.log(`Auto-detected mapping: ${viseme} -> ${matchingTarget.name}`)
      }
    })

    return mapping
  }

  /**
   * Set viseme with smooth transition
   * @param {string} viseme - Target viseme
   * @param {number} duration - Animation duration in seconds
   */
  setViseme(viseme, duration = 0.1) {
    if (!this.morphTargetInfluences || !this.visemeToMorphMap[viseme]) {
      return
    }

    this.targetViseme = viseme
    this.animationProgress = 0
    this.isAnimating = true

    // Calculate animation speed based on duration
    this.animationSpeed = 1.0 / duration
  }

  /**
   * Queue multiple visemes for sequential playback
   * @param {Array} visemeSequence - Array of {viseme, duration, time} objects
   */
  queueVisemes(visemeSequence) {
    this.visemeQueue = [...visemeSequence]
    this.currentTime = 0
  }

  /**
   * Update animation (call this in your render loop)
   * @param {number} deltaTime - Time since last frame in seconds
   */
  update(deltaTime) {
    this.currentTime += deltaTime

    // Process viseme queue
    if (this.visemeQueue.length > 0) {
      const nextViseme = this.visemeQueue[0]
      if (this.currentTime >= nextViseme.time) {
        this.setViseme(nextViseme.viseme, nextViseme.duration)
        this.visemeQueue.shift()
      }
    }

    // Animate current transition
    if (this.isAnimating) {
      this.animationProgress += deltaTime * this.animationSpeed
      
      if (this.animationProgress >= 1.0) {
        this.animationProgress = 1.0
        this.currentViseme = this.targetViseme
        this.isAnimating = false
      }

      this.updateMorphTargets()
    }
  }

  /**
   * Update morph target influences based on current animation state
   */
  updateMorphTargets() {
    if (!this.morphTargetInfluences) return

    // Reset all lip-related morph targets
    Object.values(this.visemeToMorphMap).forEach(index => {
      if (index !== null && index !== undefined) {
        this.morphTargetInfluences[index] = 0
      }
    })

    // Blend between current and target visemes
    const currentIndex = this.visemeToMorphMap[this.currentViseme]
    const targetIndex = this.visemeToMorphMap[this.targetViseme]

    if (this.isAnimating && currentIndex !== null && targetIndex !== null) {
      // Smooth transition between visemes
      const t = this.easeInOutCubic(this.animationProgress)
      this.morphTargetInfluences[currentIndex] = 1.0 - t
      this.morphTargetInfluences[targetIndex] = t
    } else {
      // Set target viseme directly
      if (targetIndex !== null && targetIndex !== undefined) {
        this.morphTargetInfluences[targetIndex] = 1.0
      }
    }
  }

  /**
   * Smooth easing function for natural transitions
   */
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  /**
   * Convert text to viseme sequence using TalkingHead algorithm
   * @param {string} text - Text to convert
   * @returns {Array} Array of viseme timing objects
   */
  textToVisemes(text) {
    // This would integrate with the TalkingHead LipsyncEn class
    // For now, return a simple example
    const words = text.toLowerCase().split(' ')
    const sequence = []
    let time = 0

    words.forEach(word => {
      // Simple mapping - in real implementation, use TalkingHead's wordsToVisemes
      const visemes = this.simpleWordToVisemes(word)
      visemes.forEach(({viseme, duration}) => {
        sequence.push({
          viseme,
          duration,
          time
        })
        time += duration
      })
      
      // Add pause between words
      time += 0.2
    })

    return sequence
  }

  /**
   * Simple word to viseme conversion (placeholder)
   * In production, this would use the full TalkingHead algorithm
   */
  simpleWordToVisemes(word) {
    const visemes = []
    
    // Very basic phonetic mapping - replace with TalkingHead integration
    for (let char of word) {
      switch (char.toLowerCase()) {
        case 'a': visemes.push({viseme: 'aa', duration: 0.15}); break
        case 'e': visemes.push({viseme: 'E', duration: 0.12}); break
        case 'i': visemes.push({viseme: 'I', duration: 0.12}); break
        case 'o': visemes.push({viseme: 'O', duration: 0.15}); break
        case 'u': visemes.push({viseme: 'U', duration: 0.15}); break
        case 'p': case 'b': case 'm': visemes.push({viseme: 'PP', duration: 0.18}); break
        case 'f': case 'v': visemes.push({viseme: 'FF', duration: 0.15}); break
        case 't': case 'd': case 'n': case 'l': visemes.push({viseme: 'DD', duration: 0.16}); break
        case 'k': case 'g': visemes.push({viseme: 'kk', duration: 0.18}); break
        case 's': case 'z': visemes.push({viseme: 'SS', duration: 0.18}); break
        case 'r': visemes.push({viseme: 'RR', duration: 0.13}); break
        default: visemes.push({viseme: 'sil', duration: 0.05}); break
      }
    }

    return visemes
  }

  /**
   * Reset to neutral position
   */
  reset() {
    this.currentViseme = 'sil'
    this.targetViseme = 'sil'
    this.animationProgress = 0
    this.isAnimating = false
    this.visemeQueue = []
    this.currentTime = 0
    this.updateMorphTargets()
  }

  /**
   * Test a specific viseme
   * @param {string} viseme - Viseme to test
   * @param {number} intensity - Intensity (0-1)
   */
  testViseme(viseme, intensity = 1.0) {
    if (!this.morphTargetInfluences || !this.visemeToMorphMap[viseme]) {
      console.warn(`Cannot test viseme ${viseme} - not mapped or no morph targets available`)
      return
    }

    // Reset all
    Object.values(this.visemeToMorphMap).forEach(index => {
      if (index !== null && index !== undefined) {
        this.morphTargetInfluences[index] = 0
      }
    })

    // Set target viseme
    const targetIndex = this.visemeToMorphMap[viseme]
    if (targetIndex !== null && targetIndex !== undefined) {
      this.morphTargetInfluences[targetIndex] = intensity
      console.log(`Testing viseme ${viseme} at intensity ${intensity}`)
    }
  }
}

export default CC4LipSync
