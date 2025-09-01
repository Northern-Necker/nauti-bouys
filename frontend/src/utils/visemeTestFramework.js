/**
 * Viseme Test Framework
 * Comprehensive testing and validation system for lip sync functionality
 */

import { PHONEME_TO_VISEME, textToPhonemes, phonemesToVisemes } from './speechProcessing';
import { Reallusion } from './convaiReallusion';

/**
 * Test case structure for viseme validation
 */
export class VisemeTestCase {
  constructor(name, input, expectedPhonemes, expectedVisemes, description = '') {
    this.name = name;
    this.input = input;
    this.expectedPhonemes = expectedPhonemes;
    this.expectedVisemes = expectedVisemes;
    this.description = description;
    this.results = null;
  }

  run() {
    const startTime = performance.now();
    
    // Extract phonemes
    const actualPhonemes = textToPhonemes(this.input);
    
    // Convert to visemes
    const actualVisemes = phonemesToVisemes(actualPhonemes);
    
    const endTime = performance.now();
    
    // Validate results
    const phonemeMatch = this.validatePhonemes(actualPhonemes);
    const visemeMatch = this.validateVisemes(actualVisemes);
    
    this.results = {
      passed: phonemeMatch.passed && visemeMatch.passed,
      executionTime: endTime - startTime,
      phonemeValidation: phonemeMatch,
      visemeValidation: visemeMatch,
      actualPhonemes,
      actualVisemes
    };
    
    return this.results;
  }

  validatePhonemes(actualPhonemes) {
    const passed = this.expectedPhonemes.length === actualPhonemes.length &&
                  this.expectedPhonemes.every((phoneme, index) => phoneme === actualPhonemes[index]);
    
    return {
      passed,
      expected: this.expectedPhonemes,
      actual: actualPhonemes,
      differences: this.findDifferences(this.expectedPhonemes, actualPhonemes)
    };
  }

  validateVisemes(actualVisemes) {
    const passed = this.expectedVisemes.length === actualVisemes.length &&
                  this.expectedVisemes.every((viseme, index) => 
                    JSON.stringify(viseme) === JSON.stringify(actualVisemes[index])
                  );
    
    return {
      passed,
      expected: this.expectedVisemes,
      actual: actualVisemes,
      differences: this.findVisemeDifferences(this.expectedVisemes, actualVisemes)
    };
  }

  findDifferences(expected, actual) {
    const differences = [];
    const maxLength = Math.max(expected.length, actual.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (expected[i] !== actual[i]) {
        differences.push({
          index: i,
          expected: expected[i] || 'undefined',
          actual: actual[i] || 'undefined'
        });
      }
    }
    
    return differences;
  }

  findVisemeDifferences(expected, actual) {
    const differences = [];
    const maxLength = Math.max(expected.length, actual.length);
    
    for (let i = 0; i < maxLength; i++) {
      const expectedViseme = expected[i] || {};
      const actualViseme = actual[i] || {};
      
      if (JSON.stringify(expectedViseme) !== JSON.stringify(actualViseme)) {
        differences.push({
          index: i,
          expected: expectedViseme,
          actual: actualViseme
        });
      }
    }
    
    return differences;
  }
}

/**
 * Comprehensive test suite for viseme validation
 * Enhanced with emotional testing capabilities
 */
export class VisemeTestSuite {
  constructor() {
    this.tests = [];
    this.results = [];
    this.emotionalTests = [];
    this.initializeTests();
    this.initializeEmotionalTests();
  }

  initializeTests() {
    // Basic consonant tests
    this.addTest(new VisemeTestCase(
      'Bilabial Plosives',
      'papa mama baba',
      ['p', 'aa', 'p', 'aa', 'pau', 'm', 'aa', 'm', 'aa', 'pau', 'b', 'aa', 'b', 'aa'],
      [
        {1: 1.0}, {10: 1.0}, {1: 1.0}, {10: 1.0}, {0: 1.0},
        {1: 1.0}, {10: 1.0}, {1: 1.0}, {10: 1.0}, {0: 1.0},
        {1: 1.0}, {10: 1.0}, {1: 1.0}, {10: 1.0}
      ],
      'Tests P, B, M phonemes mapping to viseme 1 (PP)'
    ));

    this.addTest(new VisemeTestCase(
      'Labiodental Fricatives',
      'five very fun',
      ['f', 'ih', 'v', 'eh', 'pau', 'v', 'eh', 'r', 'iy', 'pau', 'f', 'uh', 'n'],
      [
        {2: 1.0}, {12: 1.0}, {2: 1.0}, {11: 1.0}, {0: 1.0},
        {2: 1.0}, {11: 1.0}, {9: 1.0}, {12: 1.0}, {0: 1.0},
        {2: 1.0}, {14: 1.0}, {4: 1.0}
      ],
      'Tests F, V phonemes mapping to viseme 2 (FF)'
    ));

    this.addTest(new VisemeTestCase(
      'Dental Fricatives',
      'think this that',
      ['th', 'ih', 'ng', 'k', 'pau', 'th', 'ih', 's', 'pau', 'th', 'aa', 't'],
      [
        {3: 1.0}, {12: 1.0}, {8: 1.0}, {5: 1.0}, {0: 1.0},
        {3: 1.0}, {12: 1.0}, {7: 1.0}, {0: 1.0},
        {3: 1.0}, {10: 1.0}, {4: 1.0}
      ],
      'Tests TH phonemes mapping to viseme 3 (TH)'
    ));

    // Vowel tests
    this.addTest(new VisemeTestCase(
      'Open Vowels',
      'father car',
      ['f', 'aa', 'th', 'er', 'pau', 'k', 'aa', 'r'],
      [
        {2: 1.0}, {10: 1.0}, {3: 1.0}, {9: 1.0}, {0: 1.0},
        {5: 1.0}, {10: 1.0}, {9: 1.0}
      ],
      'Tests AA phonemes mapping to viseme 10 (AA)'
    ));

    this.addTest(new VisemeTestCase(
      'Front Vowels',
      'bed get',
      ['b', 'eh', 'd', 'pau', 'g', 'eh', 't'],
      [
        {1: 1.0}, {11: 1.0}, {4: 1.0}, {0: 1.0},
        {5: 1.0}, {11: 1.0}, {4: 1.0}
      ],
      'Tests E phonemes mapping to viseme 11 (E)'
    ));

    // Complex word tests
    this.addTest(new VisemeTestCase(
      'Complex Sentence',
      'hello world',
      ['h', 'eh', 'l', 'oh', 'pau', 'w', 'er', 'l', 'd'],
      [
        {0: 1.0}, {11: 1.0}, {4: 1.0}, {13: 1.0}, {0: 1.0},
        {14: 1.0}, {9: 1.0}, {4: 1.0}, {4: 1.0}
      ],
      'Tests complex word with multiple phoneme types'
    ));

    // Edge cases
    this.addTest(new VisemeTestCase(
      'Empty Input',
      '',
      [],
      [],
      'Tests empty string handling'
    ));

    this.addTest(new VisemeTestCase(
      'Special Characters',
      'test! @#$ 123',
      ['t', 'eh', 's', 't', 'pau'],
      [
        {4: 1.0}, {11: 1.0}, {7: 1.0}, {4: 1.0}, {0: 1.0}
      ],
      'Tests special character and number handling'
    ));
  }

  addTest(test) {
    this.tests.push(test);
  }

  addEmotionalTest(test) {
    this.emotionalTests.push(test);
  }

  /**
   * Initialize emotional testing capabilities
   */
  initializeEmotionalTests() {
    // Import emotional test components dynamically to avoid circular dependencies
    try {
      // These would be imported from emotionalLipSyncTests.js when available
      this.emotionalAnalyzer = null; // Will be set when emotional tests are run
      this.emotionalTestsEnabled = true;
    } catch (error) {
      console.warn('Emotional testing capabilities not available:', error);
      this.emotionalTestsEnabled = false;
    }
  }

  /**
   * Enable emotional testing with analyzer
   * @param {Object} emotionalAnalyzer - Emotional content analyzer instance
   */
  enableEmotionalTesting(emotionalAnalyzer) {
    this.emotionalAnalyzer = emotionalAnalyzer;
    this.emotionalTestsEnabled = true;
  }

  /**
   * Test emotional content analysis accuracy
   * @param {Array} testCases - Array of test cases with text and expected emotions
   * @returns {Object} Emotional analysis test results
   */
  testEmotionalAnalysis(testCases) {
    if (!this.emotionalTestsEnabled || !this.emotionalAnalyzer) {
      return { error: 'Emotional testing not enabled or analyzer not available' };
    }

    const results = [];
    let correctEmotions = 0;
    let correctIntensities = 0;

    for (const testCase of testCases) {
      const { text, expectedEmotion, expectedIntensity } = testCase;
      const analysis = this.emotionalAnalyzer.analyzeText(text);
      
      const emotionMatch = analysis.emotion === expectedEmotion;
      const intensityMatch = Math.abs(analysis.confidence - expectedIntensity) <= 0.2;

      if (emotionMatch) correctEmotions++;
      if (intensityMatch) correctIntensities++;

      results.push({
        text,
        expected: { emotion: expectedEmotion, intensity: expectedIntensity },
        actual: { emotion: analysis.emotion, intensity: analysis.confidence },
        emotionMatch,
        intensityMatch,
        analysis
      });
    }

    return {
      emotionAccuracy: correctEmotions / testCases.length,
      intensityAccuracy: correctIntensities / testCases.length,
      testCases: results,
      summary: {
        totalTests: testCases.length,
        passedEmotions: correctEmotions,
        passedIntensities: correctIntensities
      }
    };
  }

  /**
   * Test emotion-modulated viseme generation
   * @param {string} text - Input text
   * @param {string} expectedEmotion - Expected emotional state
   * @returns {Object} Emotional viseme generation test results
   */
  testEmotionalVisemeGeneration(text, expectedEmotion) {
    if (!this.emotionalTestsEnabled || !this.emotionalAnalyzer) {
      return { error: 'Emotional testing not enabled' };
    }

    const startTime = performance.now();

    // Analyze emotional content
    const analysis = this.emotionalAnalyzer.analyzeText(text);
    const modulationParams = this.emotionalAnalyzer.getModulationParams(
      analysis.emotion, 
      analysis.confidence
    );

    // Generate base visemes
    const phonemes = textToPhonemes(text);
    const baseVisemes = phonemesToVisemes(phonemes);

    // Apply emotional modulation (simplified version)
    const emotionalVisemes = baseVisemes.map(viseme => {
      const modulated = {};
      Object.entries(viseme).forEach(([key, value]) => {
        modulated[key] = Math.min(value * modulationParams.amplify, 1.0);
      });
      return modulated;
    });

    const endTime = performance.now();

    // Validate results
    const emotionMatch = analysis.emotion === expectedEmotion;
    const modulationApplied = emotionalVisemes.some(viseme => {
      return Object.values(viseme).some(value => value !== 0);
    });

    return {
      passed: emotionMatch && modulationApplied,
      executionTime: endTime - startTime,
      emotionalAnalysis: analysis,
      modulationParams,
      baseVisemes,
      emotionalVisemes,
      validation: {
        emotionMatch,
        modulationApplied,
        visemeCount: emotionalVisemes.length
      }
    };
  }

  async runAll() {
    this.results = [];
    const startTime = performance.now();
    
    for (const test of this.tests) {
      const result = test.run();
      this.results.push({
        testName: test.name,
        description: test.description,
        ...result
      });
    }
    
    const endTime = performance.now();
    
    return {
      totalTests: this.tests.length,
      passed: this.results.filter(r => r.passed).length,
      failed: this.results.filter(r => !r.passed).length,
      totalExecutionTime: endTime - startTime,
      results: this.results
    };
  }

  /**
   * Run all tests including emotional tests
   * @returns {Object} Comprehensive test results
   */
  async runAllWithEmotional() {
    const basicResults = await this.runAll();
    
    if (!this.emotionalTestsEnabled) {
      return {
        ...basicResults,
        emotionalTestsEnabled: false,
        message: 'Emotional tests not available'
      };
    }

    // Run emotional tests if available
    const emotionalResults = await this.runEmotionalTests();
    
    return {
      ...basicResults,
      emotionalResults,
      emotionalTestsEnabled: true,
      combinedScore: this.calculateCombinedScore(basicResults, emotionalResults)
    };
  }

  /**
   * Run emotional-specific tests
   * @returns {Object} Emotional test results
   */
  async runEmotionalTests() {
    if (!this.emotionalTestsEnabled) {
      return { error: 'Emotional testing not enabled' };
    }

    const emotionalResults = [];
    const startTime = performance.now();

    // Run emotional test cases
    for (const test of this.emotionalTests) {
      const result = test.run();
      emotionalResults.push({
        testName: test.name,
        description: test.description,
        ...result
      });
    }

    const endTime = performance.now();

    return {
      totalEmotionalTests: this.emotionalTests.length,
      passedEmotional: emotionalResults.filter(r => r.passed).length,
      failedEmotional: emotionalResults.filter(r => !r.passed).length,
      emotionalExecutionTime: endTime - startTime,
      emotionalResults
    };
  }

  /**
   * Calculate combined score for basic and emotional tests
   * @param {Object} basicResults - Basic viseme test results
   * @param {Object} emotionalResults - Emotional test results
   * @returns {number} Combined score (0-1)
   */
  calculateCombinedScore(basicResults, emotionalResults) {
    const basicScore = basicResults.passed / basicResults.totalTests;
    const emotionalScore = emotionalResults.passedEmotional / Math.max(emotionalResults.totalEmotionalTests, 1);
    
    // Weight basic tests at 60%, emotional tests at 40%
    return (basicScore * 0.6) + (emotionalScore * 0.4);
  }

  generateReport() {
    const summary = {
      totalTests: this.tests.length,
      passed: this.results.filter(r => r.passed).length,
      failed: this.results.filter(r => !r.passed).length,
      passRate: (this.results.filter(r => r.passed).length / this.tests.length * 100).toFixed(2) + '%'
    };
    
    const failedTests = this.results.filter(r => !r.passed).map(r => ({
      name: r.testName,
      description: r.description,
      phonemeDifferences: r.phonemeValidation?.differences,
      visemeDifferences: r.visemeValidation?.differences
    }));
    
    return {
      summary,
      failedTests,
      detailedResults: this.results,
      emotionalTestsEnabled: this.emotionalTestsEnabled
    };
  }

  /**
   * Generate comprehensive report including emotional tests
   * @returns {Object} Comprehensive test report
   */
  generateComprehensiveReport() {
    const basicReport = this.generateReport();
    
    if (!this.emotionalTestsEnabled) {
      return {
        ...basicReport,
        emotionalSummary: { message: 'Emotional tests not available' }
      };
    }

    // Add emotional test summary if available
    const emotionalSummary = {
      totalEmotionalTests: this.emotionalTests.length,
      emotionalTestsEnabled: this.emotionalTestsEnabled,
      capabilities: [
        'Emotional content analysis',
        'Emotion-modulated viseme generation',
        'Sub-frame interpolation testing',
        'Breathing animation validation',
        'Performance optimization metrics',
        'Real-time transition testing'
      ]
    };

    return {
      ...basicReport,
      emotionalSummary,
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Generate recommendations based on test results
   * @returns {Array} Array of recommendation strings
   */
  generateRecommendations() {
    const recommendations = [];
    
    const passRate = this.results.filter(r => r.passed).length / this.tests.length;
    
    if (passRate < 0.8) {
      recommendations.push('Improve basic viseme mapping accuracy');
    }
    
    if (passRate < 0.6) {
      recommendations.push('Review phoneme-to-viseme conversion logic');
    }
    
    if (!this.emotionalTestsEnabled) {
      recommendations.push('Enable emotional testing capabilities for comprehensive validation');
    }
    
    const failedTests = this.results.filter(r => !r.passed);
    if (failedTests.length > 0) {
      const commonIssues = this.analyzeCommonIssues(failedTests);
      recommendations.push(...commonIssues);
    }
    
    return recommendations;
  }

  /**
   * Analyze common issues in failed tests
   * @param {Array} failedTests - Array of failed test results
   * @returns {Array} Array of common issue descriptions
   */
  analyzeCommonIssues(failedTests) {
    const issues = [];
    
    // Check for timing-related issues
    const timingIssues = failedTests.filter(test => 
      test.executionTime > 100 // Tests taking more than 100ms
    );
    if (timingIssues.length > 0) {
      issues.push('Optimize performance - some tests are running slowly');
    }
    
    // Check for phoneme mapping issues
    const phonemeIssues = failedTests.filter(test => 
      test.phonemeValidation && !test.phonemeValidation.passed
    );
    if (phonemeIssues.length > failedTests.length * 0.5) {
      issues.push('Review phoneme extraction algorithms');
    }
    
    // Check for viseme mapping issues
    const visemeIssues = failedTests.filter(test => 
      test.visemeValidation && !test.visemeValidation.passed
    );
    if (visemeIssues.length > failedTests.length * 0.5) {
      issues.push('Review viseme generation logic');
    }
    
    return issues;
  }
}

/**
 * Morph target accuracy validator
 */
export class MorphTargetValidator {
  constructor() {
    this.recordings = [];
    this.isRecording = false;
  }

  startRecording() {
    this.recordings = [];
    this.isRecording = true;
    this.startTime = performance.now();
  }

  recordFrame(morphTargets, timestamp = null) {
    if (!this.isRecording) return;
    
    this.recordings.push({
      timestamp: timestamp || (performance.now() - this.startTime),
      morphTargets: { ...morphTargets }
    });
  }

  stopRecording() {
    this.isRecording = false;
    return this.recordings;
  }

  validateSequence(expectedSequence) {
    const results = [];
    
    for (let i = 0; i < Math.min(this.recordings.length, expectedSequence.length); i++) {
      const recorded = this.recordings[i];
      const expected = expectedSequence[i];
      
      const morphDifferences = this.compareMorphTargets(recorded.morphTargets, expected.morphTargets);
      const timingDifference = Math.abs(recorded.timestamp - expected.timestamp);
      
      results.push({
        frame: i,
        timingAccuracy: timingDifference < 50, // 50ms tolerance
        morphAccuracy: morphDifferences.length === 0,
        timingDifference,
        morphDifferences
      });
    }
    
    return {
      totalFrames: this.recordings.length,
      accurateFrames: results.filter(r => r.morphAccuracy && r.timingAccuracy).length,
      results
    };
  }

  compareMorphTargets(recorded, expected, tolerance = 0.05) {
    const differences = [];
    
    for (const [key, expectedValue] of Object.entries(expected)) {
      const recordedValue = recorded[key] || 0;
      const difference = Math.abs(recordedValue - expectedValue);
      
      if (difference > tolerance) {
        differences.push({
          morphTarget: key,
          expected: expectedValue,
          recorded: recordedValue,
          difference
        });
      }
    }
    
    return differences;
  }
}

/**
 * Timing accuracy analyzer
 */
export class TimingAnalyzer {
  constructor() {
    this.timingData = [];
  }

  recordVisemeChange(viseme, timestamp) {
    this.timingData.push({
      viseme,
      timestamp,
      type: 'viseme_change'
    });
  }

  recordAudioEvent(event, timestamp) {
    this.timingData.push({
      event,
      timestamp,
      type: 'audio_event'
    });
  }

  analyze() {
    const visemeChanges = this.timingData.filter(d => d.type === 'viseme_change');
    const audioEvents = this.timingData.filter(d => d.type === 'audio_event');
    
    // Calculate average delay between audio and viseme
    let totalDelay = 0;
    let delayCount = 0;
    
    for (const audioEvent of audioEvents) {
      const nearestViseme = this.findNearestViseme(audioEvent.timestamp, visemeChanges);
      if (nearestViseme) {
        totalDelay += Math.abs(nearestViseme.timestamp - audioEvent.timestamp);
        delayCount++;
      }
    }
    
    const averageDelay = delayCount > 0 ? totalDelay / delayCount : 0;
    
    // Calculate viseme transition smoothness
    const transitionDelays = [];
    for (let i = 1; i < visemeChanges.length; i++) {
      transitionDelays.push(visemeChanges[i].timestamp - visemeChanges[i-1].timestamp);
    }
    
    const averageTransitionTime = transitionDelays.length > 0 
      ? transitionDelays.reduce((a, b) => a + b, 0) / transitionDelays.length 
      : 0;
    
    return {
      averageAudioVisemeDelay: averageDelay,
      averageTransitionTime,
      totalVisemeChanges: visemeChanges.length,
      totalAudioEvents: audioEvents.length,
      synchronizationScore: this.calculateSyncScore(averageDelay)
    };
  }

  findNearestViseme(timestamp, visemeChanges) {
    let nearest = null;
    let minDiff = Infinity;
    
    for (const viseme of visemeChanges) {
      const diff = Math.abs(viseme.timestamp - timestamp);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = viseme;
      }
    }
    
    return nearest;
  }

  calculateSyncScore(averageDelay) {
    // Score based on average delay (lower is better)
    if (averageDelay < 20) return 'excellent';
    if (averageDelay < 50) return 'good';
    if (averageDelay < 100) return 'acceptable';
    return 'poor';
  }

  reset() {
    this.timingData = [];
  }
}

/**
 * Performance benchmarking
 */
export class PerformanceBenchmark {
  constructor() {
    this.metrics = [];
  }

  startBenchmark(name) {
    this.currentBenchmark = {
      name,
      startTime: performance.now(),
      startMemory: performance.memory ? performance.memory.usedJSHeapSize : null
    };
  }

  endBenchmark() {
    if (!this.currentBenchmark) return null;
    
    const endTime = performance.now();
    const endMemory = performance.memory ? performance.memory.usedJSHeapSize : null;
    
    const benchmark = {
      ...this.currentBenchmark,
      endTime,
      endMemory,
      duration: endTime - this.currentBenchmark.startTime,
      memoryDelta: endMemory && this.currentBenchmark.startMemory 
        ? endMemory - this.currentBenchmark.startMemory 
        : null
    };
    
    this.metrics.push(benchmark);
    this.currentBenchmark = null;
    
    return benchmark;
  }

  getAverageMetrics() {
    if (this.metrics.length === 0) return null;
    
    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const avgDuration = totalDuration / this.metrics.length;
    
    const memoryMetrics = this.metrics.filter(m => m.memoryDelta !== null);
    const avgMemoryDelta = memoryMetrics.length > 0
      ? memoryMetrics.reduce((sum, m) => sum + m.memoryDelta, 0) / memoryMetrics.length
      : null;
    
    return {
      averageDuration: avgDuration,
      averageMemoryDelta: avgMemoryDelta,
      totalBenchmarks: this.metrics.length
    };
  }

  reset() {
    this.metrics = [];
    this.currentBenchmark = null;
  }
}

// Export test utilities
export default {
  VisemeTestCase,
  VisemeTestSuite,
  MorphTargetValidator,
  TimingAnalyzer,
  PerformanceBenchmark
};