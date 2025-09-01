/**
 * Emotional Lip Sync Test Suite
 * Comprehensive testing framework for emotional expression functionality
 * Validates emotion-modulated viseme generation, timing, and performance
 */

import { VisemeToActorCore, applyBlendShape, getMorphTargetMapping } from './enhancedActorCoreLipSync';
import { textToPhonemes, phonemesToVisemes, createVisemeAnimation } from './speechProcessing';
import { VisemeTestCase, MorphTargetValidator, TimingAnalyzer, PerformanceBenchmark } from './visemeTestFramework';

/**
 * Emotional states configuration for testing
 */
export const EMOTIONAL_STATES = {
  happy: {
    name: 'Happy',
    intensity: { min: 0.7, max: 1.0 },
    modulation: { amplify: 1.3, speed: 1.2 },
    baselineShapes: {
      'Mouth_Smile_L': 0.3,
      'Mouth_Smile_R': 0.3,
      'Cheek_Puff_L': 0.1,
      'Cheek_Puff_R': 0.1
    },
    breathing: { rate: 1.1, depth: 0.8 }
  },
  sad: {
    name: 'Sad',
    intensity: { min: 0.3, max: 0.7 },
    modulation: { amplify: 0.7, speed: 0.8 },
    baselineShapes: {
      'Mouth_Frown_L': 0.25,
      'Mouth_Frown_R': 0.25,
      'Mouth_Down_Lower_L': 0.2,
      'Mouth_Down_Lower_R': 0.2
    },
    breathing: { rate: 0.8, depth: 1.2 }
  },
  excited: {
    name: 'Excited',
    intensity: { min: 0.8, max: 1.0 },
    modulation: { amplify: 1.5, speed: 1.4 },
    baselineShapes: {
      'Mouth_Smile_L': 0.4,
      'Mouth_Smile_R': 0.4,
      'Jaw_Open': 0.1,
      'Mouth_Stretch_L': 0.2,
      'Mouth_Stretch_R': 0.2
    },
    breathing: { rate: 1.3, depth: 0.9 }
  },
  calm: {
    name: 'Calm',
    intensity: { min: 0.4, max: 0.8 },
    modulation: { amplify: 0.9, speed: 0.9 },
    baselineShapes: {
      'Mouth_Roll_In_Upper': 0.1,
      'Mouth_Roll_In_Lower': 0.1
    },
    breathing: { rate: 0.9, depth: 1.1 }
  },
  surprised: {
    name: 'Surprised',
    intensity: { min: 0.6, max: 1.0 },
    modulation: { amplify: 1.2, speed: 1.3 },
    baselineShapes: {
      'Jaw_Open': 0.3,
      'Mouth_Funnel': 0.2,
      'Mouth_Up_Upper_L': 0.15,
      'Mouth_Up_Upper_R': 0.15
    },
    breathing: { rate: 1.2, depth: 0.7 }
  }
};

/**
 * Emotional content analysis patterns for testing
 */
export const EMOTIONAL_CONTENT_PATTERNS = {
  happy: [
    /joy|happy|excited|wonderful|amazing|fantastic|great|awesome|love|perfect/i,
    /smile|laugh|celebrate|cheer|delighted|thrilled|pleased|glad/i
  ],
  sad: [
    /sad|cry|tears|sorrow|grief|mourn|weep|upset|depressed|down/i,
    /sorry|regret|disappointed|hurt|pain|loss|miss|lonely/i
  ],
  excited: [
    /excited|thrilled|pumped|energetic|enthusiastic|eager|amazing|incredible/i,
    /wow|fantastic|awesome|unbelievable|outstanding|extraordinary/i
  ],
  calm: [
    /calm|peaceful|serene|tranquil|relaxed|quiet|gentle|soft|still/i,
    /meditate|breathe|rest|peace|harmony|balance|centered/i
  ],
  surprised: [
    /surprised|shocked|amazed|astonished|stunned|wow|incredible|unbelievable/i,
    /sudden|unexpected|wonder|curious|mystery|bizarre|strange/i
  ]
};

/**
 * Test suite for emotional content analysis
 */
export class EmotionalContentAnalyzer {
  constructor() {
    this.patterns = EMOTIONAL_CONTENT_PATTERNS;
  }

  /**
   * Analyze text for emotional content
   * @param {string} text - Input text to analyze
   * @returns {Object} Emotional analysis results
   */
  analyzeText(text) {
    if (!text || typeof text !== 'string') {
      return { emotion: 'neutral', confidence: 0, matches: [] };
    }

    const results = {};
    const allMatches = [];

    // Check each emotion pattern
    Object.entries(this.patterns).forEach(([emotion, patterns]) => {
      let matches = 0;
      const emotionMatches = [];

      patterns.forEach((pattern, index) => {
        const patternMatches = text.match(pattern);
        if (patternMatches) {
          matches += patternMatches.length;
          emotionMatches.push({
            pattern: index,
            matches: patternMatches,
            count: patternMatches.length
          });
        }
      });

      if (matches > 0) {
        results[emotion] = {
          score: matches,
          confidence: Math.min(matches * 0.2, 1.0),
          matches: emotionMatches
        };
        allMatches.push({ emotion, score: matches, confidence: results[emotion].confidence });
      }
    });

    // Determine dominant emotion
    if (allMatches.length === 0) {
      return { emotion: 'neutral', confidence: 0, matches: [], analysis: results };
    }

    const dominantEmotion = allMatches.reduce((prev, current) => 
      (current.score > prev.score) ? current : prev
    );

    return {
      emotion: dominantEmotion.emotion,
      confidence: dominantEmotion.confidence,
      matches: allMatches,
      analysis: results
    };
  }

  /**
   * Get emotional modulation parameters
   * @param {string} emotion - Detected emotion
   * @param {number} confidence - Confidence level (0-1)
   * @returns {Object} Modulation parameters
   */
  getModulationParams(emotion, confidence) {
    const emotionalState = EMOTIONAL_STATES[emotion];
    if (!emotionalState) {
      return { amplify: 1.0, speed: 1.0, baseline: {}, breathing: { rate: 1.0, depth: 1.0 } };
    }

    // Scale modulation by confidence
    const amplify = 1.0 + (emotionalState.modulation.amplify - 1.0) * confidence;
    const speed = 1.0 + (emotionalState.modulation.speed - 1.0) * confidence;

    // Scale baseline shapes by confidence
    const baseline = {};
    Object.entries(emotionalState.baselineShapes).forEach(([key, value]) => {
      baseline[key] = value * confidence;
    });

    return {
      amplify,
      speed,
      baseline,
      breathing: emotionalState.breathing
    };
  }
}

/**
 * Enhanced viseme test case with emotional support
 */
export class EmotionalVisemeTestCase extends VisemeTestCase {
  constructor(name, input, expectedEmotion, expectedIntensity, description = '') {
    super(name, input, [], [], description);
    this.expectedEmotion = expectedEmotion;
    this.expectedIntensity = expectedIntensity;
    this.emotionalAnalyzer = new EmotionalContentAnalyzer();
  }

  run() {
    const startTime = performance.now();
    
    // Analyze emotional content
    const emotionalAnalysis = this.emotionalAnalyzer.analyzeText(this.input);
    
    // Generate base visemes
    const phonemes = textToPhonemes(this.input);
    const baseVisemes = phonemesToVisemes(phonemes);
    
    // Apply emotional modulation
    const modulationParams = this.emotionalAnalyzer.getModulationParams(
      emotionalAnalysis.emotion, 
      emotionalAnalysis.confidence
    );
    
    const emotionalVisemes = this.modulateVisemes(baseVisemes, modulationParams);
    
    const endTime = performance.now();
    
    // Validate results
    const emotionMatch = this.validateEmotion(emotionalAnalysis);
    const visemeModulation = this.validateVisemeModulation(baseVisemes, emotionalVisemes, modulationParams);
    
    this.results = {
      passed: emotionMatch.passed && visemeModulation.passed,
      executionTime: endTime - startTime,
      emotionalAnalysis,
      modulationParams,
      emotionValidation: emotionMatch,
      visemeValidation: visemeModulation,
      baseVisemes,
      emotionalVisemes
    };
    
    return this.results;
  }

  modulateVisemes(baseVisemes, params) {
    return baseVisemes.map(viseme => {
      const modulated = {};
      
      // Apply emotional amplification
      Object.entries(viseme).forEach(([key, value]) => {
        modulated[key] = Math.min(value * params.amplify, 1.0);
      });
      
      // Add baseline emotional shapes
      Object.entries(params.baseline).forEach(([key, value]) => {
        // This would normally map to actual morph targets
        modulated[`baseline_${key}`] = value;
      });
      
      return modulated;
    });
  }

  validateEmotion(analysis) {
    const emotionMatch = analysis.emotion === this.expectedEmotion;
    const intensityMatch = Math.abs(analysis.confidence - this.expectedIntensity) <= 0.2;
    
    return {
      passed: emotionMatch && intensityMatch,
      emotionMatch,
      intensityMatch,
      expected: { emotion: this.expectedEmotion, intensity: this.expectedIntensity },
      actual: { emotion: analysis.emotion, intensity: analysis.confidence }
    };
  }

  validateVisemeModulation(baseVisemes, emotionalVisemes, params) {
    const differences = [];
    
    for (let i = 0; i < Math.min(baseVisemes.length, emotionalVisemes.length); i++) {
      const base = baseVisemes[i];
      const emotional = emotionalVisemes[i];
      
      // Check amplification was applied
      Object.entries(base).forEach(([key, baseValue]) => {
        const emotionalValue = emotional[key];
        const expectedValue = Math.min(baseValue * params.amplify, 1.0);
        
        if (Math.abs(emotionalValue - expectedValue) > 0.05) {
          differences.push({
            index: i,
            visemeKey: key,
            expected: expectedValue,
            actual: emotionalValue,
            base: baseValue
          });
        }
      });
    }
    
    return {
      passed: differences.length === 0,
      differences,
      modulationApplied: differences.length < baseVisemes.length * 0.1 // Allow 10% tolerance
    };
  }
}

/**
 * Sub-frame interpolation tester
 */
export class SubFrameInterpolationTester {
  constructor() {
    this.recordings = [];
    this.smoothnessMetrics = [];
  }

  /**
   * Test interpolation smoothness between viseme transitions
   * @param {Array} visemeSequence - Sequence of visemes to test
   * @param {number} frameRate - Target frame rate (fps)
   * @returns {Object} Smoothness analysis results
   */
  testInterpolationSmoothness(visemeSequence, frameRate = 60) {
    const frameDuration = 1000 / frameRate; // ms per frame
    const interpolatedFrames = [];
    
    for (let i = 0; i < visemeSequence.length - 1; i++) {
      const currentViseme = visemeSequence[i];
      const nextViseme = visemeSequence[i + 1];
      const transitionDuration = nextViseme.timestamp - currentViseme.timestamp;
      const frameCount = Math.floor(transitionDuration / frameDuration);
      
      // Generate interpolated frames
      for (let frame = 0; frame < frameCount; frame++) {
        const t = frame / frameCount;
        const interpolated = this.interpolateVisemes(currentViseme, nextViseme, t);
        
        interpolatedFrames.push({
          timestamp: currentViseme.timestamp + (frame * frameDuration),
          viseme: interpolated,
          transitionId: i,
          frame: frame,
          t: t
        });
      }
    }
    
    // Analyze smoothness
    const smoothnessAnalysis = this.analyzeSmoothness(interpolatedFrames);
    
    return {
      frameCount: interpolatedFrames.length,
      smoothnessScore: smoothnessAnalysis.score,
      abruptTransitions: smoothnessAnalysis.abruptTransitions,
      averageChangeRate: smoothnessAnalysis.averageChangeRate,
      interpolatedFrames
    };
  }

  interpolateVisemes(viseme1, viseme2, t) {
    const interpolated = {};
    
    // Get all unique viseme keys
    const allKeys = new Set([...Object.keys(viseme1), ...Object.keys(viseme2)]);
    
    allKeys.forEach(key => {
      if (key === 'timestamp' || key === 'duration' || key === 'intensity') return;
      
      const value1 = viseme1[key] || 0;
      const value2 = viseme2[key] || 0;
      
      // Smooth interpolation using ease-in-out
      const easedT = this.easeInOutCubic(t);
      interpolated[key] = value1 + (value2 - value1) * easedT;
    });
    
    return interpolated;
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }

  analyzeSmoothness(frames) {
    let totalChange = 0;
    let abruptTransitions = 0;
    const changeThreshold = 0.3; // Threshold for "abrupt" change
    
    for (let i = 1; i < frames.length; i++) {
      const prevFrame = frames[i - 1];
      const currentFrame = frames[i];
      
      let frameChange = 0;
      const allKeys = new Set([
        ...Object.keys(prevFrame.viseme),
        ...Object.keys(currentFrame.viseme)
      ]);
      
      allKeys.forEach(key => {
        const prevValue = prevFrame.viseme[key] || 0;
        const currentValue = currentFrame.viseme[key] || 0;
        const change = Math.abs(currentValue - prevValue);
        
        frameChange += change;
        
        if (change > changeThreshold) {
          abruptTransitions++;
        }
      });
      
      totalChange += frameChange;
    }
    
    const averageChangeRate = frames.length > 1 ? totalChange / (frames.length - 1) : 0;
    const smoothnessScore = Math.max(0, 1 - (averageChangeRate / 2)); // Normalize to 0-1
    
    return {
      score: smoothnessScore,
      abruptTransitions,
      averageChangeRate,
      totalFrames: frames.length
    };
  }
}

/**
 * Breathing animation pattern tester
 */
export class BreathingAnimationTester {
  constructor() {
    this.breathingPatterns = {};
  }

  /**
   * Generate breathing animation for emotional state
   * @param {string} emotion - Emotional state
   * @param {number} duration - Duration in seconds
   * @returns {Array} Breathing animation frames
   */
  generateBreathingAnimation(emotion, duration) {
    const emotionalState = EMOTIONAL_STATES[emotion] || EMOTIONAL_STATES.calm;
    const breathingRate = emotionalState.breathing.rate; // breaths per second
    const breathingDepth = emotionalState.breathing.depth; // intensity multiplier
    
    const frames = [];
    const frameRate = 30; // 30 fps
    const totalFrames = duration * frameRate;
    
    for (let frame = 0; frame < totalFrames; frame++) {
      const time = frame / frameRate;
      
      // Generate breathing cycle (sine wave)
      const breathCycle = Math.sin(time * Math.PI * 2 * breathingRate);
      const breathIntensity = (breathCycle + 1) / 2 * breathingDepth; // Normalize to 0-1
      
      frames.push({
        timestamp: time * 1000, // Convert to milliseconds
        breathIntensity,
        morphTargets: {
          'Chest_Expand': breathIntensity * 0.3,
          'Mouth_Shrug_Lower': breathIntensity * 0.1,
          'Jaw_Open': breathIntensity * 0.05
        }
      });
    }
    
    return frames;
  }

  /**
   * Validate breathing pattern characteristics
   * @param {Array} breathingFrames - Generated breathing frames
   * @param {string} expectedEmotion - Expected emotional state
   * @returns {Object} Validation results
   */
  validateBreathingPattern(breathingFrames, expectedEmotion) {
    const emotionalState = EMOTIONAL_STATES[expectedEmotion];
    if (!emotionalState) {
      return { passed: false, error: 'Unknown emotional state' };
    }
    
    // Analyze breathing rate
    const breathingRate = this.analyzeBeathing(breathingFrames);
    const expectedRate = emotionalState.breathing.rate;
    const rateMatch = Math.abs(breathingRate - expectedRate) <= 0.1;
    
    // Analyze breathing depth
    const maxIntensity = Math.max(...breathingFrames.map(f => f.breathIntensity));
    const expectedDepth = emotionalState.breathing.depth;
    const depthMatch = Math.abs(maxIntensity - expectedDepth) <= 0.2;
    
    // Check pattern consistency
    const consistency = this.analyzeConsistency(breathingFrames);
    
    return {
      passed: rateMatch && depthMatch && consistency.score > 0.8,
      rateMatch,
      depthMatch,
      breathingRate,
      expectedRate,
      maxIntensity,
      expectedDepth,
      consistency
    };
  }

  analyzeBeathing(frames) {
    // Simple peak counting to estimate breathing rate
    let peaks = 0;
    let previousValue = frames[0]?.breathIntensity || 0;
    let increasing = false;
    
    for (let i = 1; i < frames.length; i++) {
      const currentValue = frames[i].breathIntensity;
      
      if (currentValue > previousValue) {
        if (!increasing) {
          increasing = true;
        }
      } else if (currentValue < previousValue) {
        if (increasing) {
          peaks++;
          increasing = false;
        }
      }
      
      previousValue = currentValue;
    }
    
    const duration = frames.length > 0 ? 
      (frames[frames.length - 1].timestamp - frames[0].timestamp) / 1000 : 1;
    
    return peaks / duration;
  }

  analyzeConsistency(frames) {
    if (frames.length < 3) return { score: 0, variance: 1 };
    
    const intensities = frames.map(f => f.breathIntensity);
    const mean = intensities.reduce((sum, val) => sum + val, 0) / intensities.length;
    const variance = intensities.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intensities.length;
    
    // Lower variance indicates more consistent pattern
    const consistencyScore = Math.max(0, 1 - variance);
    
    return {
      score: consistencyScore,
      variance,
      mean
    };
  }
}

/**
 * Performance optimization metrics tester
 */
export class PerformanceOptimizationTester extends PerformanceBenchmark {
  constructor() {
    super();
    this.memoryUsageHistory = [];
    this.frameRateHistory = [];
  }

  /**
   * Benchmark emotional viseme generation performance
   * @param {string} text - Test text
   * @param {string} emotion - Emotional state
   * @param {number} iterations - Number of test iterations
   * @returns {Object} Performance metrics
   */
  benchmarkEmotionalVisemeGeneration(text, emotion, iterations = 100) {
    const analyzer = new EmotionalContentAnalyzer();
    const results = {
      iterations,
      executionTimes: [],
      memoryUsage: [],
      throughput: 0
    };
    
    for (let i = 0; i < iterations; i++) {
      const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      const startTime = performance.now();
      
      // Perform emotional viseme generation
      const analysis = analyzer.analyzeText(text);
      const phonemes = textToPhonemes(text);
      const visemes = phonemesToVisemes(phonemes);
      const modulationParams = analyzer.getModulationParams(analysis.emotion, analysis.confidence);
      
      // Apply modulation (simplified)
      const modulatedVisemes = visemes.map(viseme => {
        const modulated = {};
        Object.entries(viseme).forEach(([key, value]) => {
          modulated[key] = Math.min(value * modulationParams.amplify, 1.0);
        });
        return modulated;
      });
      
      const endTime = performance.now();
      const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      
      results.executionTimes.push(endTime - startTime);
      results.memoryUsage.push(endMemory - startMemory);
    }
    
    // Calculate metrics
    const avgExecutionTime = results.executionTimes.reduce((sum, time) => sum + time, 0) / iterations;
    const avgMemoryUsage = results.memoryUsage.reduce((sum, mem) => sum + mem, 0) / iterations;
    const throughput = 1000 / avgExecutionTime; // operations per second
    
    results.averageExecutionTime = avgExecutionTime;
    results.averageMemoryUsage = avgMemoryUsage;
    results.throughput = throughput;
    results.minExecutionTime = Math.min(...results.executionTimes);
    results.maxExecutionTime = Math.max(...results.executionTimes);
    
    return results;
  }

  /**
   * Test real-time performance with frame rate monitoring
   * @param {Function} renderFunction - Function to test
   * @param {number} testDuration - Test duration in seconds
   * @returns {Object} Real-time performance metrics
   */
  testRealTimePerformance(renderFunction, testDuration = 5) {
    return new Promise((resolve) => {
      const frameRates = [];
      const startTime = performance.now();
      let frameCount = 0;
      let lastFrameTime = startTime;
      
      function testFrame() {
        const currentTime = performance.now();
        
        // Execute render function
        renderFunction();
        
        // Calculate frame rate
        const frameTime = currentTime - lastFrameTime;
        const fps = 1000 / frameTime;
        frameRates.push(fps);
        
        frameCount++;
        lastFrameTime = currentTime;
        
        // Continue test if within duration
        if (currentTime - startTime < testDuration * 1000) {
          requestAnimationFrame(testFrame);
        } else {
          // Calculate final metrics
          const avgFps = frameRates.reduce((sum, fps) => sum + fps, 0) / frameRates.length;
          const minFps = Math.min(...frameRates);
          const maxFps = Math.max(...frameRates);
          const fpsVariance = frameRates.reduce((sum, fps) => sum + Math.pow(fps - avgFps, 2), 0) / frameRates.length;
          
          resolve({
            totalFrames: frameCount,
            averageFps: avgFps,
            minFps,
            maxFps,
            fpsVariance,
            frameRateHistory: frameRates,
            testDuration: (currentTime - startTime) / 1000
          });
        }
      }
      
      requestAnimationFrame(testFrame);
    });
  }
}

/**
 * Integration tester for emotional states and viseme output
 */
export class EmotionalIntegrationTester {
  constructor() {
    this.validator = new MorphTargetValidator();
    this.timingAnalyzer = new TimingAnalyzer();
  }

  /**
   * Test integration between emotional states and viseme output
   * @param {Array} testCases - Array of test cases with text and expected emotions
   * @returns {Object} Integration test results
   */
  async testEmotionalIntegration(testCases) {
    const results = [];
    const analyzer = new EmotionalContentAnalyzer();
    
    for (const testCase of testCases) {
      const { text, expectedEmotion, expectedIntensity } = testCase;
      
      // Analyze emotional content
      const analysis = analyzer.analyzeText(text);
      
      // Generate visemes with emotional modulation
      const phonemes = textToPhonemes(text);
      const baseVisemes = phonemesToVisemes(phonemes);
      const modulationParams = analyzer.getModulationParams(analysis.emotion, analysis.confidence);
      
      // Test morph target generation
      const blendShapeRef = { current: [] };
      baseVisemes.forEach(viseme => {
        VisemeToActorCore(viseme, blendShapeRef);
      });
      
      // Validate results
      const emotionAccuracy = analysis.emotion === expectedEmotion;
      const intensityAccuracy = Math.abs(analysis.confidence - expectedIntensity) <= 0.2;
      const morphTargetsGenerated = blendShapeRef.current.length > 0;
      
      results.push({
        text,
        expectedEmotion,
        expectedIntensity,
        actualEmotion: analysis.emotion,
        actualIntensity: analysis.confidence,
        emotionAccuracy,
        intensityAccuracy,
        morphTargetsGenerated,
        modulationParams,
        morphTargetCount: blendShapeRef.current.length
      });
    }
    
    // Calculate overall metrics
    const totalTests = results.length;
    const passedEmotionTests = results.filter(r => r.emotionAccuracy).length;
    const passedIntensityTests = results.filter(r => r.intensityAccuracy).length;
    const passedMorphTargetTests = results.filter(r => r.morphTargetsGenerated).length;
    
    return {
      totalTests,
      emotionAccuracy: passedEmotionTests / totalTests,
      intensityAccuracy: passedIntensityTests / totalTests,
      morphTargetGeneration: passedMorphTargetTests / totalTests,
      overallScore: (passedEmotionTests + passedIntensityTests + passedMorphTargetTests) / (totalTests * 3),
      detailedResults: results
    };
  }
}

/**
 * Real-time emotional state transition tester
 */
export class EmotionalTransitionTester {
  constructor() {
    this.transitionHistory = [];
    this.currentEmotion = 'neutral';
  }

  /**
   * Test emotional state transitions in real-time
   * @param {Array} emotionSequence - Sequence of emotions to transition through
   * @param {number} transitionDuration - Duration for each transition (ms)
   * @returns {Promise} Promise resolving to transition test results
   */
  async testEmotionalTransitions(emotionSequence, transitionDuration = 1000) {
    const results = {
      transitions: [],
      smoothnessScores: [],
      timingAccuracy: [],
      overallScore: 0
    };
    
    for (let i = 0; i < emotionSequence.length - 1; i++) {
      const fromEmotion = emotionSequence[i];
      const toEmotion = emotionSequence[i + 1];
      
      const transitionResult = await this.executeTransition(
        fromEmotion, 
        toEmotion, 
        transitionDuration
      );
      
      results.transitions.push(transitionResult);
      results.smoothnessScores.push(transitionResult.smoothness);
      results.timingAccuracy.push(transitionResult.timingAccuracy);
    }
    
    // Calculate overall score
    const avgSmoothness = results.smoothnessScores.reduce((sum, score) => sum + score, 0) / results.smoothnessScores.length;
    const avgTimingAccuracy = results.timingAccuracy.reduce((sum, score) => sum + score, 0) / results.timingAccuracy.length;
    results.overallScore = (avgSmoothness + avgTimingAccuracy) / 2;
    
    return results;
  }

  async executeTransition(fromEmotion, toEmotion, duration) {
    const startTime = performance.now();
    const frames = [];
    const frameRate = 60;
    const totalFrames = (duration / 1000) * frameRate;
    
    return new Promise((resolve) => {
      let currentFrame = 0;
      
      function animate() {
        const t = currentFrame / totalFrames;
        const currentTime = performance.now();
        
        // Interpolate between emotion states
        const blendedEmotion = this.interpolateEmotions(fromEmotion, toEmotion, t);
        
        frames.push({
          timestamp: currentTime - startTime,
          emotion: blendedEmotion,
          t: t
        });
        
        currentFrame++;
        
        if (currentFrame <= totalFrames) {
          requestAnimationFrame(animate.bind(this));
        } else {
          // Analyze transition
          const smoothness = this.analyzeTransitionSmoothness(frames);
          const timingAccuracy = this.analyzeTimingAccuracy(frames, duration);
          
          resolve({
            fromEmotion,
            toEmotion,
            duration: performance.now() - startTime,
            frames: frames.length,
            smoothness,
            timingAccuracy,
            frameData: frames
          });
        }
      }
      
      animate.call(this);
    });
  }

  interpolateEmotions(emotion1, emotion2, t) {
    const state1 = EMOTIONAL_STATES[emotion1] || EMOTIONAL_STATES.calm;
    const state2 = EMOTIONAL_STATES[emotion2] || EMOTIONAL_STATES.calm;
    
    // Interpolate modulation parameters
    const amplify = state1.modulation.amplify + (state2.modulation.amplify - state1.modulation.amplify) * t;
    const speed = state1.modulation.speed + (state2.modulation.speed - state1.modulation.speed) * t;
    
    // Interpolate baseline shapes
    const baseline = {};
    const allShapes = new Set([
      ...Object.keys(state1.baselineShapes),
      ...Object.keys(state2.baselineShapes)
    ]);
    
    allShapes.forEach(shape => {
      const value1 = state1.baselineShapes[shape] || 0;
      const value2 = state2.baselineShapes[shape] || 0;
      baseline[shape] = value1 + (value2 - value1) * t;
    });
    
    return {
      emotion: t < 0.5 ? emotion1 : emotion2,
      modulation: { amplify, speed },
      baseline,
      t
    };
  }

  analyzeTransitionSmoothness(frames) {
    let totalChange = 0;
    let abruptChanges = 0;
    
    for (let i = 1; i < frames.length; i++) {
      const prev = frames[i - 1];
      const current = frames[i];
      
      const amplifyChange = Math.abs(current.emotion.modulation.amplify - prev.emotion.modulation.amplify);
      const speedChange = Math.abs(current.emotion.modulation.speed - prev.emotion.modulation.speed);
      
      const frameChange = amplifyChange + speedChange;
      totalChange += frameChange;
      
      if (frameChange > 0.1) {
        abruptChanges++;
      }
    }
    
    const averageChange = frames.length > 1 ? totalChange / (frames.length - 1) : 0;
    return Math.max(0, 1 - averageChange - (abruptChanges / frames.length));
  }

  analyzeTimingAccuracy(frames, expectedDuration) {
    if (frames.length === 0) return 0;
    
    const actualDuration = frames[frames.length - 1].timestamp;
    const timingError = Math.abs(actualDuration - expectedDuration) / expectedDuration;
    
    return Math.max(0, 1 - timingError);
  }
}

/**
 * Comprehensive emotional lip sync test suite
 */
export class EmotionalLipSyncTestSuite {
  constructor() {
    this.contentAnalyzer = new EmotionalContentAnalyzer();
    this.interpolationTester = new SubFrameInterpolationTester();
    this.breathingTester = new BreathingAnimationTester();
    this.performanceTester = new PerformanceOptimizationTester();
    this.integrationTester = new EmotionalIntegrationTester();
    this.transitionTester = new EmotionalTransitionTester();
    this.results = {};
  }

  /**
   * Run complete emotional lip sync test suite
   * @returns {Object} Comprehensive test results
   */
  async runComprehensiveTests() {
    console.log('Starting comprehensive emotional lip sync tests...');
    
    try {
      // Test 1: Emotional content analysis accuracy
      console.log('Testing emotional content analysis...');
      this.results.contentAnalysis = await this.testContentAnalysis();
      
      // Test 2: Emotion-modulated viseme generation
      console.log('Testing emotion-modulated viseme generation...');
      this.results.visemeGeneration = await this.testVisemeGeneration();
      
      // Test 3: Sub-frame interpolation smoothness
      console.log('Testing sub-frame interpolation...');
      this.results.interpolation = await this.testInterpolation();
      
      // Test 4: Breathing animation patterns
      console.log('Testing breathing animation patterns...');
      this.results.breathing = await this.testBreathingAnimations();
      
      // Test 5: Performance optimization metrics
      console.log('Testing performance metrics...');
      this.results.performance = await this.testPerformanceOptimization();
      
      // Test 6: Integration between emotional states and viseme output
      console.log('Testing emotional integration...');
      this.results.integration = await this.testEmotionalIntegration();
      
      // Test 7: Real-time emotional state transitions
      console.log('Testing real-time transitions...');
      this.results.transitions = await this.testRealTimeTransitions();
      
      // Calculate overall score
      this.results.overallScore = this.calculateOverallScore();
      
      console.log('Comprehensive tests completed!');
      return this.results;
      
    } catch (error) {
      console.error('Error during comprehensive testing:', error);
      return { error: error.message, partialResults: this.results };
    }
  }

  async testContentAnalysis() {
    const testCases = [
      { text: "I'm so happy and excited about this!", expected: { emotion: 'happy', confidence: 0.8 } },
      { text: "This is really sad and disappointing", expected: { emotion: 'sad', confidence: 0.7 } },
      { text: "Wow! That's absolutely amazing and incredible!", expected: { emotion: 'excited', confidence: 0.9 } },
      { text: "Let's stay calm and peaceful about this", expected: { emotion: 'calm', confidence: 0.6 } },
      { text: "What?! I can't believe this happened!", expected: { emotion: 'surprised', confidence: 0.8 } }
    ];
    
    const results = [];
    let correctEmotions = 0;
    let correctIntensities = 0;
    
    for (const testCase of testCases) {
      const analysis = this.contentAnalyzer.analyzeText(testCase.text);
      const emotionMatch = analysis.emotion === testCase.expected.emotion;
      const intensityMatch = Math.abs(analysis.confidence - testCase.expected.confidence) <= 0.2;
      
      if (emotionMatch) correctEmotions++;
      if (intensityMatch) correctIntensities++;
      
      results.push({
        text: testCase.text,
        expected: testCase.expected,
        actual: { emotion: analysis.emotion, confidence: analysis.confidence },
        emotionMatch,
        intensityMatch
      });
    }
    
    return {
      emotionAccuracy: correctEmotions / testCases.length,
      intensityAccuracy: correctIntensities / testCases.length,
      testCases: results
    };
  }

  async testVisemeGeneration() {
    const testCases = [
      new EmotionalVisemeTestCase('Happy Expression', "I'm so joyful!", 'happy', 0.8),
      new EmotionalVisemeTestCase('Sad Expression', "I feel so sad", 'sad', 0.7),
      new EmotionalVisemeTestCase('Excited Expression', "This is amazing!", 'excited', 0.9),
      new EmotionalVisemeTestCase('Calm Expression', "Stay peaceful", 'calm', 0.6),
      new EmotionalVisemeTestCase('Surprised Expression', "What happened?!", 'surprised', 0.8)
    ];
    
    const results = [];
    let passedTests = 0;
    
    for (const testCase of testCases) {
      const result = testCase.run();
      if (result.passed) passedTests++;
      results.push(result);
    }
    
    return {
      passRate: passedTests / testCases.length,
      testResults: results
    };
  }

  async testInterpolation() {
    const testVisemes = [
      { 1: 1.0, timestamp: 0, duration: 200 },  // PP
      { 10: 1.0, timestamp: 200, duration: 200 }, // AA
      { 2: 1.0, timestamp: 400, duration: 200 },  // FF
      { 0: 1.0, timestamp: 600, duration: 200 }   // Silence
    ];
    
    const smoothnessResult = this.interpolationTester.testInterpolationSmoothness(testVisemes, 60);
    
    return {
      smoothnessScore: smoothnessResult.smoothnessScore,
      abruptTransitions: smoothnessResult.abruptTransitions,
      frameCount: smoothnessResult.frameCount,
      passed: smoothnessResult.smoothnessScore > 0.8
    };
  }

  async testBreathingAnimations() {
    const emotions = Object.keys(EMOTIONAL_STATES);
    const results = {};
    let passedTests = 0;
    
    for (const emotion of emotions) {
      const breathingFrames = this.breathingTester.generateBreathingAnimation(emotion, 3);
      const validation = this.breathingTester.validateBreathingPattern(breathingFrames, emotion);
      
      results[emotion] = validation;
      if (validation.passed) passedTests++;
    }
    
    return {
      passRate: passedTests / emotions.length,
      emotionResults: results
    };
  }

  async testPerformanceOptimization() {
    const testTexts = [
      "Short test",
      "This is a longer test sentence with more words",
      "This is a very long test sentence that contains many words and should test the performance of emotional viseme generation under more demanding conditions"
    ];
    
    const performanceResults = [];
    
    for (const text of testTexts) {
      const result = this.performanceTester.benchmarkEmotionalVisemeGeneration(text, 'happy', 50);
      performanceResults.push({
        text: text.substring(0, 20) + '...',
        averageTime: result.averageExecutionTime,
        throughput: result.throughput,
        memoryUsage: result.averageMemoryUsage
      });
    }
    
    // Test real-time performance
    const realtimeResult = await this.performanceTester.testRealTimePerformance(() => {
      // Simulate frame rendering
      const analysis = this.contentAnalyzer.analyzeText("test text");
      const phonemes = textToPhonemes("test text");
      const visemes = phonemesToVisemes(phonemes);
    }, 2);
    
    return {
      benchmarkResults: performanceResults,
      realtimePerformance: realtimeResult,
      averageFps: realtimeResult.averageFps,
      performanceGrade: realtimeResult.averageFps >= 30 ? 'Good' : realtimeResult.averageFps >= 15 ? 'Acceptable' : 'Poor'
    };
  }

  async testEmotionalIntegration() {
    const testCases = [
      { text: "I'm incredibly happy today!", expectedEmotion: 'happy', expectedIntensity: 0.8 },
      { text: "This makes me feel so sad", expectedEmotion: 'sad', expectedIntensity: 0.7 },
      { text: "Wow, this is absolutely amazing!", expectedEmotion: 'excited', expectedIntensity: 0.9 }
    ];
    
    return await this.integrationTester.testEmotionalIntegration(testCases);
  }

  async testRealTimeTransitions() {
    const emotionSequence = ['calm', 'happy', 'excited', 'surprised', 'calm'];
    return await this.transitionTester.testEmotionalTransitions(emotionSequence, 800);
  }

  calculateOverallScore() {
    const weights = {
      contentAnalysis: 0.15,
      visemeGeneration: 0.20,
      interpolation: 0.15,
      breathing: 0.10,
      performance: 0.15,
      integration: 0.15,
      transitions: 0.10
    };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    if (this.results.contentAnalysis) {
      const score = (this.results.contentAnalysis.emotionAccuracy + this.results.contentAnalysis.intensityAccuracy) / 2;
      totalScore += score * weights.contentAnalysis;
      totalWeight += weights.contentAnalysis;
    }
    
    if (this.results.visemeGeneration) {
      totalScore += this.results.visemeGeneration.passRate * weights.visemeGeneration;
      totalWeight += weights.visemeGeneration;
    }
    
    if (this.results.interpolation) {
      totalScore += this.results.interpolation.smoothnessScore * weights.interpolation;
      totalWeight += weights.interpolation;
    }
    
    if (this.results.breathing) {
      totalScore += this.results.breathing.passRate * weights.breathing;
      totalWeight += weights.breathing;
    }
    
    if (this.results.performance) {
      const perfScore = this.results.performance.averageFps >= 30 ? 1.0 : this.results.performance.averageFps / 30;
      totalScore += perfScore * weights.performance;
      totalWeight += weights.performance;
    }
    
    if (this.results.integration) {
      totalScore += this.results.integration.overallScore * weights.integration;
      totalWeight += weights.integration;
    }
    
    if (this.results.transitions) {
      totalScore += this.results.transitions.overallScore * weights.transitions;
      totalWeight += weights.transitions;
    }
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Generate comprehensive test report
   * @returns {Object} Formatted test report
   */
  generateTestReport() {
    return {
      summary: {
        overallScore: this.results.overallScore,
        grade: this.results.overallScore >= 0.9 ? 'Excellent' : 
               this.results.overallScore >= 0.8 ? 'Good' :
               this.results.overallScore >= 0.7 ? 'Acceptable' : 'Needs Improvement',
        testsRun: Object.keys(this.results).length - 1, // Exclude overallScore
        timestamp: new Date().toISOString()
      },
      details: this.results,
      recommendations: this.generateRecommendations()
    };
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.contentAnalysis?.emotionAccuracy < 0.8) {
      recommendations.push('Improve emotional content analysis patterns');
    }
    
    if (this.results.visemeGeneration?.passRate < 0.8) {
      recommendations.push('Enhance emotion-modulated viseme generation accuracy');
    }
    
    if (this.results.interpolation?.smoothnessScore < 0.8) {
      recommendations.push('Optimize sub-frame interpolation algorithms');
    }
    
    if (this.results.performance?.averageFps < 30) {
      recommendations.push('Optimize performance for real-time rendering');
    }
    
    if (this.results.integration?.overallScore < 0.8) {
      recommendations.push('Improve integration between emotional states and viseme output');
    }
    
    return recommendations;
  }
}

// Export all test classes and utilities
export default {
  EMOTIONAL_STATES,
  EMOTIONAL_CONTENT_PATTERNS,
  EmotionalContentAnalyzer,
  EmotionalVisemeTestCase,
  SubFrameInterpolationTester,
  BreathingAnimationTester,
  PerformanceOptimizationTester,
  EmotionalIntegrationTester,
  EmotionalTransitionTester,
  EmotionalLipSyncTestSuite
};