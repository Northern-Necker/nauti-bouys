/**
 * Enhanced Lip Sync Implementation
 * Advanced features for improved efficacy and emotional expression
 */

import * as THREE from 'three';
import { PHONEME_TO_VISEME } from './speechProcessing';
import { VisemeToReallusion } from './convaiReallusion';

/**
 * Emotional Expression System
 * Integrates emotions with lip sync for more dynamic avatar behavior
 */
export class EmotionalLipSync {
  constructor() {
    this.currentEmotion = 'neutral';
    this.emotionIntensity = 1.0;
    this.emotionTransitionSpeed = 0.1;
    this.personalityTraits = {
      expressiveness: 1.0,
      energyLevel: 1.0,
      formality: 0.5
    };
  }

  /**
   * Analyze text for emotional content using sentiment analysis
   */
  analyzeEmotionalContent(text) {
    const emotionalKeywords = {
      happy: ['great', 'wonderful', 'amazing', 'fantastic', 'excellent', 'love', 'perfect', 'awesome'],
      sad: ['sorry', 'unfortunately', 'sadly', 'disappointed', 'trouble', 'problem', 'difficult'],
      excited: ['wow', 'incredible', 'unbelievable', 'spectacular', 'outstanding', 'brilliant'],
      calm: ['certainly', 'indeed', 'precisely', 'specifically', 'naturally', 'obviously'],
      surprised: ['really', 'seriously', 'actually', 'honestly', 'truly', 'remarkable']
    };

    const words = text.toLowerCase().split(/\s+/);
    const emotionScores = {};

    Object.keys(emotionalKeywords).forEach(emotion => {
      emotionScores[emotion] = 0;
      emotionalKeywords[emotion].forEach(keyword => {
        if (words.some(word => word.includes(keyword))) {
          emotionScores[emotion]++;
        }
      });
    });

    // Find dominant emotion
    const dominantEmotion = Object.keys(emotionScores).reduce((a, b) => 
      emotionScores[a] > emotionScores[b] ? a : b
    );

    return {
      emotion: emotionScores[dominantEmotion] > 0 ? dominantEmotion : 'neutral',
      intensity: Math.min(emotionScores[dominantEmotion] / 3, 1.0),
      scores: emotionScores
    };
  }

  /**
   * Apply emotional modulation to viseme data
   */
  modulateVisemeWithEmotion(viseme, emotion, intensity = 1.0) {
    const modulatedViseme = { ...viseme };
    
    const emotionModifiers = {
      happy: {
        smileBoost: 1.3,
        energyMultiplier: 1.2,
        mouthOpenness: 1.1
      },
      sad: {
        smileBoost: 0.7,
        energyMultiplier: 0.8,
        mouthOpenness: 0.9
      },
      excited: {
        smileBoost: 1.4,
        energyMultiplier: 1.5,
        mouthOpenness: 1.3
      },
      calm: {
        smileBoost: 1.0,
        energyMultiplier: 0.9,
        mouthOpenness: 1.0
      },
      surprised: {
        smileBoost: 1.1,
        energyMultiplier: 1.3,
        mouthOpenness: 1.4
      }
    };

    const modifier = emotionModifiers[emotion] || emotionModifiers.calm;
    
    // Apply emotional modulation to each viseme
    Object.keys(modulatedViseme).forEach(visemeKey => {
      const currentValue = modulatedViseme[visemeKey];
      
      // Apply energy and openness modulation
      let modifiedValue = currentValue * modifier.energyMultiplier;
      
      // Special handling for smile-related visemes (11, 13)
      if (visemeKey === '11' || visemeKey === '13') {
        modifiedValue *= modifier.smileBoost;
      }
      
      // Special handling for open mouth visemes (10, 11, 12, 13, 14)
      if (['10', '11', '12', '13', '14'].includes(visemeKey)) {
        modifiedValue *= modifier.mouthOpenness;
      }
      
      // Apply intensity scaling
      modifiedValue = currentValue + (modifiedValue - currentValue) * intensity;
      
      // Clamp to valid range
      modulatedViseme[visemeKey] = Math.max(0, Math.min(1, modifiedValue));
    });

    return modulatedViseme;
  }

  /**
   * Generate facial expression blend shapes for emotions
   */
  generateEmotionalBlendShapes(emotion, intensity = 1.0) {
    const emotionalExpressions = {
      happy: {
        Mouth_Smile_L: 0.6 * intensity,
        Mouth_Smile_R: 0.6 * intensity,
        Eye_Smile_L: 0.4 * intensity,
        Eye_Smile_R: 0.4 * intensity,
        Cheek_Raise_L: 0.3 * intensity,
        Cheek_Raise_R: 0.3 * intensity
      },
      sad: {
        Mouth_Frown_L: 0.5 * intensity,
        Mouth_Frown_R: 0.5 * intensity,
        Mouth_Down: 0.4 * intensity,
        Eye_Droop_L: 0.3 * intensity,
        Eye_Droop_R: 0.3 * intensity,
        Brow_Down_L: 0.2 * intensity,
        Brow_Down_R: 0.2 * intensity
      },
      excited: {
        Mouth_Smile_L: 0.8 * intensity,
        Mouth_Smile_R: 0.8 * intensity,
        Eye_Wide_L: 0.5 * intensity,
        Eye_Wide_R: 0.5 * intensity,
        Brow_Up_L: 0.4 * intensity,
        Brow_Up_R: 0.4 * intensity,
        Cheek_Raise_L: 0.6 * intensity,
        Cheek_Raise_R: 0.6 * intensity
      },
      surprised: {
        Mouth_Drop_Lower: 0.7 * intensity,
        Eye_Wide_L: 0.8 * intensity,
        Eye_Wide_R: 0.8 * intensity,
        Brow_Up_L: 0.9 * intensity,
        Brow_Up_R: 0.9 * intensity,
        Open_Jaw: 0.3 * intensity
      },
      calm: {
        // Subtle neutral adjustments
        Mouth_Neutral: 1.0,
        Eye_Neutral: 1.0
      }
    };

    return emotionalExpressions[emotion] || emotionalExpressions.calm;
  }
}

/**
 * Advanced Timing and Synchronization System
 */
export class AdvancedTiming {
  constructor() {
    this.frameBuffer = [];
    this.predictiveLookahead = 3; // frames
    this.adaptiveFrameRate = true;
    this.smoothingFactor = 0.15;
  }

  /**
   * Sub-frame interpolation for smoother animation
   */
  interpolateSubFrame(previousViseme, currentViseme, nextViseme, t) {
    const result = {};
    
    // Combine all viseme keys
    const allKeys = new Set([
      ...Object.keys(previousViseme || {}),
      ...Object.keys(currentViseme || {}),
      ...Object.keys(nextViseme || {})
    ]);

    allKeys.forEach(key => {
      const prev = (previousViseme && previousViseme[key]) || 0;
      const curr = (currentViseme && currentViseme[key]) || 0;
      const next = (nextViseme && nextViseme[key]) || 0;
      
      // Catmull-Rom spline interpolation for smooth curves
      const t2 = t * t;
      const t3 = t2 * t;
      
      result[key] = 0.5 * (
        (2 * curr) +
        (-prev + next) * t +
        (2 * prev - 5 * curr + 4 * next) * t2 +
        (-prev + 3 * curr - 3 * next + next) * t3
      );
      
      // Clamp to valid range
      result[key] = Math.max(0, Math.min(1, result[key]));
    });

    return result;
  }

  /**
   * Predictive timing based on speech patterns
   */
  predictNextVisemes(currentSequence, speechRate = 1.0) {
    // Analyze speech patterns for timing prediction
    const avgDuration = 150 / speechRate; // ms per viseme
    const predictions = [];
    
    for (let i = 0; i < this.predictiveLookahead; i++) {
      predictions.push({
        timestamp: Date.now() + (avgDuration * (i + 1)),
        confidence: Math.max(0.1, 1.0 - (i * 0.3))
      });
    }
    
    return predictions;
  }

  /**
   * Dynamic frame rate adjustment based on complexity
   */
  calculateOptimalFrameRate(visemeComplexity, deviceCapability = 1.0) {
    const baseFrameRate = 60;
    const complexityFactor = Math.max(0.5, 1.0 - (visemeComplexity * 0.3));
    const adjustedRate = baseFrameRate * complexityFactor * deviceCapability;
    
    return Math.max(30, Math.min(120, adjustedRate));
  }
}

/**
 * Enhanced Viseme Processing with Co-articulation
 */
export class CoarticulationProcessor {
  constructor() {
    this.coarticulationRules = {
      // Bilabial influences
      'p_vowel': { influence: 0.3, effect: 'lip_rounding' },
      'b_vowel': { influence: 0.3, effect: 'lip_rounding' },
      'm_vowel': { influence: 0.4, effect: 'nasal_resonance' },
      
      // Dental influences
      'th_s': { influence: 0.5, effect: 'tongue_position' },
      'th_t': { influence: 0.4, effect: 'tongue_tip' },
      
      // Vowel-vowel transitions
      'aa_iy': { influence: 0.6, effect: 'jaw_tongue_movement' },
      'uw_aa': { influence: 0.7, effect: 'lip_jaw_coordination' }
    };
  }

  /**
   * Apply co-articulation effects between adjacent phonemes
   */
  applyCoarticulation(phonemeSequence, visemeSequence) {
    const enhancedSequence = [...visemeSequence];
    
    for (let i = 0; i < phonemeSequence.length - 1; i++) {
      const current = phonemeSequence[i];
      const next = phonemeSequence[i + 1];
      const ruleKey = `${current}_${next}`;
      
      if (this.coarticulationRules[ruleKey]) {
        const rule = this.coarticulationRules[ruleKey];
        const currentViseme = enhancedSequence[i];
        const nextViseme = enhancedSequence[i + 1];
        
        // Apply influence between current and next viseme
        this.blendVisemes(currentViseme, nextViseme, rule.influence);
      }
    }
    
    return enhancedSequence;
  }

  /**
   * Blend two visemes with specified influence
   */
  blendVisemes(viseme1, viseme2, influence) {
    Object.keys(viseme2).forEach(key => {
      if (viseme1[key] !== undefined) {
        const blendedValue = viseme1[key] * (1 - influence) + viseme2[key] * influence;
        viseme1[key] = Math.max(0, Math.min(1, blendedValue));
      }
    });
  }
}

/**
 * Breathing and Idle Animation System
 */
export class BreathingAnimator {
  constructor() {
    this.breathingRate = 0.25; // Hz (4 seconds per breath)
    this.breathingIntensity = 0.3;
    this.idleMovementScale = 0.1;
    this.startTime = Date.now();
  }

  /**
   * Generate breathing animation
   */
  generateBreathingAnimation(currentTime) {
    const elapsed = (currentTime - this.startTime) / 1000;
    const breathPhase = Math.sin(elapsed * 2 * Math.PI * this.breathingRate);
    
    return {
      chestRise: breathPhase * this.breathingIntensity,
      shoulderLift: breathPhase * 0.1,
      nostrilFlare: Math.max(0, breathPhase * 0.05),
      mouthSubtleOpen: Math.max(0, breathPhase * 0.02)
    };
  }

  /**
   * Generate subtle idle micro-movements
   */
  generateIdleMovements(currentTime) {
    const elapsed = (currentTime - this.startTime) / 1000;
    
    return {
      eyeBlink: this.generateBlinkPattern(elapsed),
      headSway: Math.sin(elapsed * 0.1) * this.idleMovementScale,
      jawTension: Math.sin(elapsed * 0.05) * 0.02,
      lipMoisture: Math.sin(elapsed * 0.3) * 0.01
    };
  }

  /**
   * Generate realistic blinking pattern
   */
  generateBlinkPattern(elapsed) {
    // Random blinks every 2-6 seconds
    const blinkInterval = 3 + Math.sin(elapsed * 0.1) * 2;
    const blinkPhase = (elapsed % blinkInterval) / blinkInterval;
    
    if (blinkPhase < 0.1) {
      // Blink duration: ~100ms
      const blinkProgress = blinkPhase / 0.1;
      return Math.sin(blinkProgress * Math.PI);
    }
    
    return 0;
  }
}

/**
 * Performance Optimization System
 */
export class PerformanceOptimizer {
  constructor() {
    this.frameTimeBudget = 16.67; // 60fps in ms
    this.adaptiveQuality = true;
    this.performanceHistory = [];
    this.qualityLevel = 1.0;
  }

  /**
   * Monitor performance and adjust quality
   */
  updatePerformanceMetrics(frameTime) {
    this.performanceHistory.push(frameTime);
    if (this.performanceHistory.length > 60) {
      this.performanceHistory.shift();
    }

    const avgFrameTime = this.performanceHistory.reduce((a, b) => a + b, 0) / this.performanceHistory.length;

    if (this.adaptiveQuality) {
      if (avgFrameTime > this.frameTimeBudget * 1.2) {
        this.qualityLevel = Math.max(0.5, this.qualityLevel - 0.1);
      } else if (avgFrameTime < this.frameTimeBudget * 0.8) {
        this.qualityLevel = Math.min(1.0, this.qualityLevel + 0.05);
      }
    }

    return {
      avgFrameTime,
      qualityLevel: this.qualityLevel,
      performanceScore: Math.max(0, 1 - (avgFrameTime / this.frameTimeBudget))
    };
  }

  /**
   * Apply quality-based optimizations
   */
  optimizeForQuality(visemeData, morphTargets) {
    if (this.qualityLevel < 1.0) {
      // Reduce morph target precision
      Object.keys(morphTargets).forEach(key => {
        if (Math.abs(morphTargets[key]) < 0.05 * this.qualityLevel) {
          morphTargets[key] = 0;
        }
      });

      // Simplify viseme blending
      Object.keys(visemeData).forEach(key => {
        if (visemeData[key] < 0.1 * this.qualityLevel) {
          delete visemeData[key];
        }
      });
    }

    return { visemeData, morphTargets };
  }
}

/**
 * Integrated Enhanced Lip Sync System
 */
export class IntegratedLipSyncEngine {
  constructor() {
    this.emotionalLipSync = new EmotionalLipSync();
    this.advancedTiming = new AdvancedTiming();
    this.coarticulation = new CoarticulationProcessor();
    this.breathing = new BreathingAnimator();
    this.optimizer = new PerformanceOptimizer();
    
    this.isEnabled = true;
    this.debugMode = false;
  }

  /**
   * Process speech with all enhancements
   */
  async processEnhancedSpeech(text, options = {}) {
    const startTime = performance.now();

    // 1. Emotional analysis
    const emotionalAnalysis = this.emotionalLipSync.analyzeEmotionalContent(text);
    
    // 2. Generate base phonemes and visemes (using existing system)
    const phonemes = this.extractPhonemes(text);
    const baseVisemes = this.convertToVisemes(phonemes);
    
    // 3. Apply co-articulation
    const coarticulatedVisemes = this.coarticulation.applyCoarticulation(phonemes, baseVisemes);
    
    // 4. Apply emotional modulation
    const emotionalVisemes = coarticulatedVisemes.map(viseme => 
      this.emotionalLipSync.modulateVisemeWithEmotion(
        viseme, 
        emotionalAnalysis.emotion, 
        emotionalAnalysis.intensity
      )
    );
    
    // 5. Generate timing data
    const timingData = this.advancedTiming.predictNextVisemes(emotionalVisemes);
    
    // 6. Performance optimization
    const processTime = performance.now() - startTime;
    this.optimizer.updatePerformanceMetrics(processTime);

    return {
      visemes: emotionalVisemes,
      emotion: emotionalAnalysis,
      timing: timingData,
      performance: {
        processingTime: processTime,
        qualityLevel: this.optimizer.qualityLevel
      }
    };
  }

  /**
   * Real-time frame processing with all enhancements
   */
  processFrame(currentViseme, previousViseme, nextViseme, frameTime, t) {
    const frameStartTime = performance.now();

    // Sub-frame interpolation
    const interpolatedViseme = this.advancedTiming.interpolateSubFrame(
      previousViseme, currentViseme, nextViseme, t
    );

    // Add breathing and idle animations
    const breathingAnim = this.breathing.generateBreathingAnimation(frameTime);
    const idleMovements = this.breathing.generateIdleMovements(frameTime);

    // Generate morph targets
    let morphTargets = this.convertVisemeToMorphTargets(interpolatedViseme);

    // Add breathing effects to morph targets
    if (breathingAnim.chestRise > 0) {
      morphTargets.chestExpansion = breathingAnim.chestRise;
      morphTargets.nostrilFlare = breathingAnim.nostrilFlare;
    }

    // Add idle movements
    if (idleMovements.eyeBlink > 0) {
      morphTargets.eyesClosed = idleMovements.eyeBlink;
    }

    // Performance optimization
    const frameProcessTime = performance.now() - frameStartTime;
    const optimized = this.optimizer.optimizeForQuality(interpolatedViseme, morphTargets);

    return {
      viseme: optimized.visemeData,
      morphTargets: optimized.morphTargets,
      breathing: breathingAnim,
      idle: idleMovements,
      performance: {
        frameTime: frameProcessTime,
        quality: this.optimizer.qualityLevel
      }
    };
  }

  // Helper methods (simplified versions of existing functions)
  extractPhonemes(text) {
    // Use existing textToPhonemes implementation
    return ['h', 'eh', 'l', 'oh']; // Simplified
  }

  convertToVisemes(phonemes) {
    // Use existing phonemesToVisemes implementation
    return phonemes.map(p => ({ [PHONEME_TO_VISEME[p] || 0]: 1.0 }));
  }

  convertVisemeToMorphTargets(viseme) {
    // Use existing VisemeToReallusion implementation
    const blendShapeRef = { current: [] };
    VisemeToReallusion(viseme, blendShapeRef);
    return blendShapeRef.current[0] || {};
  }
}

export default {
  EmotionalLipSync,
  AdvancedTiming,
  CoarticulationProcessor,
  BreathingAnimator,
  PerformanceOptimizer,
  IntegratedLipSyncEngine
};