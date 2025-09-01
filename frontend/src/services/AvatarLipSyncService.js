/**
 * Avatar Lip Sync Service
 * Real-time text-to-viseme processing service
 * Integrates speech processing with enhanced viseme system
 */

import { VisemeToActorCore } from '../utils/enhancedActorCoreLipSync';
import AdvancedEmotionalIntelligence from '../utils/advancedEmotionalIntelligence';

export class AvatarLipSyncService {
  constructor() {
    this.emotionalIntelligence = new AdvancedEmotionalIntelligence();
    this.isProcessing = false;
    this.currentSequence = [];
    this.sequenceIndex = 0;
    this.timingAccuracy = 50; // Target sub-50ms timing
    this.defaultVisemeDuration = 120; // ms per viseme
    this.blendShapeQueue = [];
    
    // Phoneme to viseme mapping (enhanced from speech processing)
    this.phonemeToViseme = {
      // Silence
      'sil': 0, 'sp': 0, 'spn': 0,
      
      // Bilabial plosives (p, b, m)
      'p': 1, 'b': 1, 'm': 1,
      
      // Labiodental fricatives (f, v)
      'f': 2, 'v': 2,
      
      // Dental fricatives (th)
      'th': 3, 'dh': 3,
      
      // Alveolar plosives (t, d, n, l)
      't': 4, 'd': 4, 'n': 4, 'l': 4, 's': 4, 'z': 4,
      
      // Velar plosives (k, g)
      'k': 5, 'g': 5, 'ng': 5,
      
      // Postalveolar affricates (ch, j)
      'ch': 6, 'jh': 6, 'sh': 6, 'zh': 6,
      
      // Alveolar fricatives (s, z) - alternative mapping
      'ss': 7, 'zz': 7,
      
      // Nasal consonants (n, ng)
      'nn': 8, 'ng': 8,
      
      // Liquids (r)
      'r': 9, 'er': 9, 'axr': 9,
      
      // Open vowels (a)
      'aa': 10, 'ae': 10, 'ah': 10, 'ao': 10, 'aw': 10, 'ax': 10,
      
      // Front vowels (e)
      'eh': 11, 'ey': 11,
      
      // Close front vowels (i)
      'ih': 12, 'iy': 12, 'ix': 12,
      
      // Back vowels (o)
      'oh': 13, 'ow': 13, 'oy': 13,
      
      // Close back vowels (u)
      'uh': 14, 'uw': 14, 'ux': 14
    };
    
    // Performance metrics
    this.metrics = {
      totalSequences: 0,
      averageLatency: 0,
      successRate: 0,
      lastProcessingTime: 0
    };
  }

  /**
   * Process text into viseme sequence with emotional context
   */
  async processTextToVisemes(text, emotionalContext = null, options = {}) {
    const startTime = performance.now();
    
    try {
      this.isProcessing = true;
      
      // Analyze emotional context
      let emotionalAnalysis = null;
      if (emotionalContext) {
        emotionalAnalysis = this.emotionalIntelligence.analyzeMood(text, emotionalContext.voiceMetrics);
      }
      
      // Convert text to phonemes (simplified - would use proper TTS/phoneme engine)
      const phonemes = this.textToPhonemes(text);
      
      // Convert phonemes to visemes
      const visemeSequence = this.phonemesToVisemes(phonemes, emotionalAnalysis);
      
      // Apply emotional modulation
      if (emotionalAnalysis) {
        this.applyEmotionalModulation(visemeSequence, emotionalAnalysis);
      }
      
      // Calculate timing
      const timing = this.calculateVisemeTiming(visemeSequence, options);
      
      // Update metrics
      const processingTime = performance.now() - startTime;
      this.updateMetrics(processingTime, true);
      
      return {
        sequence: visemeSequence,
        timing: timing,
        emotionalAnalysis: emotionalAnalysis,
        processingTime: processingTime,
        metadata: {
          textLength: text.length,
          phonemeCount: phonemes.length,
          visemeCount: visemeSequence.length
        }
      };
      
    } catch (error) {
      console.error('Failed to process text to visemes:', error);
      this.updateMetrics(performance.now() - startTime, false);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Simplified text to phonemes conversion
   * In production, this would use a proper phoneme engine
   */
  textToPhonemes(text) {
    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    const phonemes = [];
    
    // Simple phoneme mapping for common words
    const wordToPhonemes = {
      'hello': ['hh', 'eh', 'l', 'ow'],
      'welcome': ['w', 'eh', 'l', 'k', 'ah', 'm'],
      'nauti': ['n', 'ao', 't', 'iy'],
      'bouys': ['b', 'oy', 'z'],
      'savannah': ['s', 'ah', 'v', 'ae', 'n', 'ah'],
      'captain': ['k', 'ae', 'p', 't', 'ah', 'n'],
      'spirits': ['s', 'p', 'ih', 'r', 'ih', 't', 's'],
      'cocktail': ['k', 'aa', 'k', 't', 'ey', 'l'],
      'whiskey': ['w', 'ih', 's', 'k', 'iy'],
      'bourbon': ['b', 'er', 'b', 'ah', 'n'],
      'rum': ['r', 'ah', 'm'],
      'gin': ['jh', 'ih', 'n'],
      'vodka': ['v', 'aa', 'd', 'k', 'ah'],
      'wine': ['w', 'ay', 'n'],
      'beer': ['b', 'ih', 'r'],
      'cheers': ['ch', 'ih', 'r', 'z'],
      'thank': ['th', 'ae', 'ng', 'k'],
      'you': ['y', 'uw'],
      'please': ['p', 'l', 'iy', 'z'],
      'sorry': ['s', 'aa', 'r', 'iy'],
      'yes': ['y', 'eh', 's'],
      'no': ['n', 'ow'],
      'good': ['g', 'uh', 'd'],
      'great': ['g', 'r', 'ey', 't'],
      'wonderful': ['w', 'ah', 'n', 'd', 'er', 'f', 'ah', 'l'],
      'excellent': ['ih', 'k', 's', 'eh', 'l', 'ah', 'n', 't']
    };
    
    words.forEach(word => {
      if (wordToPhonemes[word]) {
        phonemes.push(...wordToPhonemes[word]);
      } else {
        // Fallback: simple letter-to-phoneme mapping
        for (let char of word) {
          switch (char) {
            case 'a': phonemes.push('aa'); break;
            case 'e': phonemes.push('eh'); break;
            case 'i': phonemes.push('ih'); break;
            case 'o': phonemes.push('oh'); break;
            case 'u': phonemes.push('uh'); break;
            case 'b': phonemes.push('b'); break;
            case 'c': phonemes.push('k'); break;
            case 'd': phonemes.push('d'); break;
            case 'f': phonemes.push('f'); break;
            case 'g': phonemes.push('g'); break;
            case 'h': phonemes.push('hh'); break;
            case 'j': phonemes.push('jh'); break;
            case 'k': phonemes.push('k'); break;
            case 'l': phonemes.push('l'); break;
            case 'm': phonemes.push('m'); break;
            case 'n': phonemes.push('n'); break;
            case 'p': phonemes.push('p'); break;
            case 'r': phonemes.push('r'); break;
            case 's': phonemes.push('s'); break;
            case 't': phonemes.push('t'); break;
            case 'v': phonemes.push('v'); break;
            case 'w': phonemes.push('w'); break;
            case 'y': phonemes.push('y'); break;
            case 'z': phonemes.push('z'); break;
            default: phonemes.push('sil'); break;
          }
        }
      }
      phonemes.push('sp'); // Word break
    });
    
    return phonemes;
  }

  /**
   * Convert phonemes to viseme sequence
   */
  phonemesToVisemes(phonemes, emotionalAnalysis = null) {
    const visemeSequence = [];
    
    phonemes.forEach(phoneme => {
      const visemeIndex = this.phonemeToViseme[phoneme] || 0;
      let intensity = this.getBaseIntensity(visemeIndex);
      
      // Apply emotional modulation to intensity
      if (emotionalAnalysis) {
        intensity = this.modulateIntensityByEmotion(intensity, emotionalAnalysis, visemeIndex);
      }
      
      // Create viseme object
      const viseme = {};
      viseme[visemeIndex] = intensity;
      
      visemeSequence.push({
        viseme: viseme,
        phoneme: phoneme,
        duration: this.getVisemeDuration(visemeIndex, emotionalAnalysis),
        intensity: intensity
      });
    });
    
    return visemeSequence;
  }

  /**
   * Get base intensity for viseme index
   */
  getBaseIntensity(visemeIndex) {
    // Different base intensities for different viseme types
    switch (visemeIndex) {
      case 0: return 0.1; // Silence - minimal
      case 1: return 0.7; // Bilabial - strong
      case 2: return 0.6; // Labiodental - medium-strong
      case 3: return 0.5; // Dental - medium
      case 4: return 0.6; // Alveolar - medium-strong
      case 5: return 0.8; // Velar - strong
      case 6: return 0.7; // Postalveolar - strong
      case 7: return 0.6; // Fricatives - medium-strong
      case 8: return 0.5; // Nasal - medium
      case 9: return 0.6; // Liquids - medium-strong
      case 10: return 0.8; // Open vowels - strong
      case 11: return 0.7; // Front vowels - strong
      case 12: return 0.6; // Close front vowels - medium-strong
      case 13: return 0.7; // Back vowels - strong
      case 14: return 0.8; // Close back vowels - strong
      default: return 0.3;
    }
  }

  /**
   * Modulate viseme intensity based on emotional analysis
   */
  modulateIntensityByEmotion(baseIntensity, emotionalAnalysis, visemeIndex) {
    const { primaryMood, energyLevel } = emotionalAnalysis;
    let modulation = 1.0;
    
    // Energy level modulation
    switch (energyLevel) {
      case 'high':
        modulation *= 1.2; // More expressive
        break;
      case 'low':
        modulation *= 0.8; // More subdued
        break;
      default:
        modulation *= 1.0;
    }
    
    // Mood-based modulation
    switch (primaryMood) {
      case 'happy':
        modulation *= 1.1; // Slightly more expressive
        break;
      case 'sad':
        modulation *= 0.9; // Slightly less expressive
        break;
      case 'stressed':
        modulation *= 0.85; // More controlled
        break;
      case 'excited':
        modulation *= 1.3; // Much more expressive
        break;
      case 'disappointed':
        modulation *= 0.8; // More subdued
        break;
      default:
        modulation *= 1.0;
    }
    
    // Vowel emphasis for emotional expression
    if (visemeIndex >= 10 && visemeIndex <= 14) { // Vowels
      if (primaryMood === 'happy' || primaryMood === 'excited') {
        modulation *= 1.1; // Emphasize vowels for positive emotions
      }
    }
    
    // Clamp to safe range
    return Math.max(0.1, Math.min(baseIntensity * modulation, 0.8));
  }

  /**
   * Get viseme duration based on type and emotional context
   */
  getVisemeDuration(visemeIndex, emotionalAnalysis = null) {
    let baseDuration = this.defaultVisemeDuration;
    
    // Adjust base duration by viseme type
    switch (visemeIndex) {
      case 0: baseDuration *= 0.8; break; // Silence - shorter
      case 1: case 2: case 3: baseDuration *= 1.1; break; // Consonants - slightly longer
      case 10: case 11: case 12: case 13: case 14: baseDuration *= 1.2; break; // Vowels - longer
      default: baseDuration *= 1.0;
    }
    
    // Emotional modulation
    if (emotionalAnalysis) {
      const { energyLevel, primaryMood } = emotionalAnalysis;
      
      if (energyLevel === 'high') {
        baseDuration *= 0.9; // Faster speech
      } else if (energyLevel === 'low') {
        baseDuration *= 1.2; // Slower speech
      }
      
      if (primaryMood === 'stressed') {
        baseDuration *= 0.85; // Rushed speech
      } else if (primaryMood === 'relaxed') {
        baseDuration *= 1.15; // Leisurely speech
      }
    }
    
    return Math.round(baseDuration);
  }

  /**
   * Apply emotional modulation to entire sequence
   */
  applyEmotionalModulation(visemeSequence, emotionalAnalysis) {
    const { primaryMood, energyLevel, context } = emotionalAnalysis;
    
    // Apply global timing adjustments
    let globalSpeedModifier = 1.0;
    
    if (energyLevel === 'high') globalSpeedModifier = 0.9;
    else if (energyLevel === 'low') globalSpeedModifier = 1.1;
    
    if (primaryMood === 'excited') globalSpeedModifier *= 0.85;
    else if (primaryMood === 'sad') globalSpeedModifier *= 1.2;
    
    // Apply modifiers
    visemeSequence.forEach(item => {
      item.duration = Math.round(item.duration * globalSpeedModifier);
      
      // Add emotional pauses
      if (primaryMood === 'disappointed' && Math.random() < 0.3) {
        item.duration *= 1.3; // Occasional longer pauses
      }
    });
  }

  /**
   * Calculate precise timing for viseme sequence
   */
  calculateVisemeTiming(visemeSequence, options = {}) {
    const timing = {
      totalDuration: 0,
      timestamps: [],
      frameRate: options.frameRate || 60,
      targetLatency: this.timingAccuracy
    };
    
    let currentTime = 0;
    
    visemeSequence.forEach((item, index) => {
      timing.timestamps.push({
        index,
        startTime: currentTime,
        endTime: currentTime + item.duration,
        viseme: item.viseme,
        phoneme: item.phoneme
      });
      
      currentTime += item.duration;
    });
    
    timing.totalDuration = currentTime;
    
    return timing;
  }

  /**
   * Execute viseme sequence with precise timing
   */
  async executeVisemeSequence(sequence, timing, blendShapeRef, options = {}) {
    return new Promise((resolve) => {
      let currentIndex = 0;
      const startTime = performance.now();
      
      const executeNext = () => {
        if (currentIndex >= sequence.length) {
          resolve({
            success: true,
            actualDuration: performance.now() - startTime,
            targetDuration: timing.totalDuration
          });
          return;
        }
        
        const item = sequence[currentIndex];
        const timestamp = timing.timestamps[currentIndex];
        
        // Convert to blend shape and queue
        const blendShape = VisemeToActorCore(item.viseme, blendShapeRef);
        
        // Schedule next viseme
        setTimeout(() => {
          currentIndex++;
          executeNext();
        }, item.duration);
      };
      
      executeNext();
    });
  }

  /**
   * Update performance metrics
   */
  updateMetrics(processingTime, success) {
    this.metrics.totalSequences++;
    this.metrics.lastProcessingTime = processingTime;
    
    // Update average latency
    this.metrics.averageLatency = (
      (this.metrics.averageLatency * (this.metrics.totalSequences - 1)) + processingTime
    ) / this.metrics.totalSequences;
    
    // Update success rate
    if (success) {
      this.metrics.successRate = (
        (this.metrics.successRate * (this.metrics.totalSequences - 1)) + 1
      ) / this.metrics.totalSequences;
    } else {
      this.metrics.successRate = (
        this.metrics.successRate * (this.metrics.totalSequences - 1)
      ) / this.metrics.totalSequences;
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      isProcessing: this.isProcessing,
      targetLatency: this.timingAccuracy,
      averageLatencyFormatted: `${this.metrics.averageLatency.toFixed(2)}ms`,
      successRateFormatted: `${(this.metrics.successRate * 100).toFixed(1)}%`
    };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics() {
    this.metrics = {
      totalSequences: 0,
      averageLatency: 0,
      successRate: 0,
      lastProcessingTime: 0
    };
  }

  /**
   * Validate service configuration
   */
  validateConfiguration() {
    const issues = [];
    
    if (this.timingAccuracy > 100) {
      issues.push('Timing accuracy target too high (>100ms)');
    }
    
    if (this.defaultVisemeDuration < 50) {
      issues.push('Default viseme duration too short (<50ms)');
    }
    
    if (Object.keys(this.phonemeToViseme).length < 30) {
      issues.push('Insufficient phoneme mapping coverage');
    }
    
    return {
      isValid: issues.length === 0,
      issues: issues,
      configuration: {
        timingAccuracy: this.timingAccuracy,
        defaultVisemeDuration: this.defaultVisemeDuration,
        phonemeMappingCount: Object.keys(this.phonemeToViseme).length
      }
    };
  }
}

export default AvatarLipSyncService;
