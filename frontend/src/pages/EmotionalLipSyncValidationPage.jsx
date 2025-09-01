/**
 * Emotional Lip Sync Validation Page
 * Visual testing interface for emotional expression validation
 * Provides real-time testing and validation of emotional lip sync functionality
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  EmotionalLipSyncTestSuite,
  EmotionalContentAnalyzer,
  EMOTIONAL_STATES,
  SubFrameInterpolationTester,
  BreathingAnimationTester,
  PerformanceOptimizationTester,
  EmotionalTransitionTester
} from '../utils/emotionalLipSyncTests';

const EmotionalLipSyncValidationPage = () => {
  // State management
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState('happy');
  const [testInput, setTestInput] = useState("I'm so happy and excited about this amazing day!");
  const [realTimeAnalysis, setRealTimeAnalysis] = useState(null);
  const [visualDemo, setVisualDemo] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [transitionDemo, setTransitionDemo] = useState(null);

  // Refs
  const testSuiteRef = useRef(null);
  const contentAnalyzerRef = useRef(null);
  const interpolationTesterRef = useRef(null);
  const breathingTesterRef = useRef(null);
  const performanceTesterRef = useRef(null);
  const transitionTesterRef = useRef(null);

  // Initialize test components
  useEffect(() => {
    testSuiteRef.current = new EmotionalLipSyncTestSuite();
    contentAnalyzerRef.current = new EmotionalContentAnalyzer();
    interpolationTesterRef.current = new SubFrameInterpolationTester();
    breathingTesterRef.current = new BreathingAnimationTester();
    performanceTesterRef.current = new PerformanceOptimizationTester();
    transitionTesterRef.current = new EmotionalTransitionTester();
  }, []);

  // Real-time analysis of input text
  useEffect(() => {
    if (contentAnalyzerRef.current && testInput) {
      const analysis = contentAnalyzerRef.current.analyzeText(testInput);
      const modulationParams = contentAnalyzerRef.current.getModulationParams(
        analysis.emotion, 
        analysis.confidence
      );
      
      setRealTimeAnalysis({
        ...analysis,
        modulationParams
      });
    }
  }, [testInput]);

  // Run comprehensive test suite
  const runComprehensiveTests = useCallback(async () => {
    if (!testSuiteRef.current || isRunning) return;

    setIsRunning(true);
    setCurrentTest('Initializing comprehensive test suite...');
    
    try {
      const results = await testSuiteRef.current.runComprehensiveTests();
      const report = testSuiteRef.current.generateTestReport();
      
      setTestResults({
        ...results,
        report
      });
      setCurrentTest('');
    } catch (error) {
      console.error('Error running comprehensive tests:', error);
      setTestResults({ error: error.message });
      setCurrentTest('');
    } finally {
      setIsRunning(false);
    }
  }, [isRunning]);

  // Test individual emotional content analysis
  const testEmotionalAnalysis = useCallback(() => {
    if (!contentAnalyzerRef.current) return;

    const analysis = contentAnalyzerRef.current.analyzeText(testInput);
    const modulationParams = contentAnalyzerRef.current.getModulationParams(
      analysis.emotion, 
      analysis.confidence
    );

    setRealTimeAnalysis({
      ...analysis,
      modulationParams,
      timestamp: Date.now()
    });
  }, [testInput]);

  // Run interpolation smoothness test
  const testInterpolationSmoothness = useCallback(() => {
    if (!interpolationTesterRef.current) return;

    const testVisemes = [
      { 1: 1.0, timestamp: 0, duration: 200 },  // PP
      { 10: 1.0, timestamp: 200, duration: 200 }, // AA
      { 2: 1.0, timestamp: 400, duration: 200 },  // FF
      { 0: 1.0, timestamp: 600, duration: 200 }   // Silence
    ];

    const result = interpolationTesterRef.current.testInterpolationSmoothness(testVisemes, 60);
    
    setVisualDemo({
      type: 'interpolation',
      result,
      timestamp: Date.now()
    });
  }, []);

  // Test breathing animation
  const testBreathingAnimation = useCallback(() => {
    if (!breathingTesterRef.current) return;

    const breathingFrames = breathingTesterRef.current.generateBreathingAnimation(selectedEmotion, 5);
    const validation = breathingTesterRef.current.validateBreathingPattern(breathingFrames, selectedEmotion);
    
    setVisualDemo({
      type: 'breathing',
      frames: breathingFrames.slice(0, 100), // Show first 100 frames for visualization
      validation,
      emotion: selectedEmotion,
      timestamp: Date.now()
    });
  }, [selectedEmotion]);

  // Run performance benchmark
  const runPerformanceBenchmark = useCallback(async () => {
    if (!performanceTesterRef.current) return;

    setCurrentTest('Running performance benchmarks...');
    
    try {
      const benchmarkResult = performanceTesterRef.current.benchmarkEmotionalVisemeGeneration(
        testInput, 
        selectedEmotion, 
        50
      );

      const realtimeResult = await performanceTesterRef.current.testRealTimePerformance(() => {
        const analysis = contentAnalyzerRef.current.analyzeText(testInput);
      }, 2);

      setPerformanceMetrics({
        benchmark: benchmarkResult,
        realtime: realtimeResult,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Performance benchmark error:', error);
    } finally {
      setCurrentTest('');
    }
  }, [testInput, selectedEmotion]);

  // Test emotional transitions
  const testEmotionalTransitions = useCallback(async () => {
    if (!transitionTesterRef.current) return;

    setCurrentTest('Testing emotional transitions...');
    
    try {
      const emotionSequence = ['calm', 'happy', 'excited', 'surprised', 'calm'];
      const result = await transitionTesterRef.current.testEmotionalTransitions(emotionSequence, 600);
      
      setTransitionDemo({
        ...result,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Transition test error:', error);
    } finally {
      setCurrentTest('');
    }
  }, []);

  // Render emotion state indicator
  const renderEmotionIndicator = (emotion, confidence) => {
    const emotionalState = EMOTIONAL_STATES[emotion];
    if (!emotionalState) return null;

    return (
      <div className="emotion-indicator">
        <div className="emotion-name">{emotionalState.name}</div>
        <div className="confidence-bar">
          <div 
            className="confidence-fill" 
            style={{ 
              width: `${confidence * 100}%`,
              backgroundColor: confidence > 0.7 ? '#4CAF50' : confidence > 0.4 ? '#FF9800' : '#F44336'
            }}
          />
        </div>
        <div className="confidence-text">{(confidence * 100).toFixed(1)}%</div>
      </div>
    );
  };

  // Render test results summary
  const renderTestSummary = () => {
    if (!testResults) return null;

    const { report } = testResults;
    if (!report) return null;

    return (
      <div className="test-summary">
        <h3>Test Results Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="label">Overall Score:</span>
            <span className={`score ${report.summary.grade.toLowerCase()}`}>
              {(report.summary.overallScore * 100).toFixed(1)}%
            </span>
          </div>
          <div className="summary-item">
            <span className="label">Grade:</span>
            <span className={`grade ${report.summary.grade.toLowerCase()}`}>
              {report.summary.grade}
            </span>
          </div>
          <div className="summary-item">
            <span className="label">Tests Run:</span>
            <span className="count">{report.summary.testsRun}</span>
          </div>
        </div>
        
        {report.recommendations && report.recommendations.length > 0 && (
          <div className="recommendations">
            <h4>Recommendations:</h4>
            <ul>
              {report.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Render detailed test results
  const renderDetailedResults = () => {
    if (!testResults || !testResults.contentAnalysis) return null;

    return (
      <div className="detailed-results">
        <h3>Detailed Test Results</h3>
        
        {/* Content Analysis Results */}
        <div className="test-section">
          <h4>Emotional Content Analysis</h4>
          <div className="metrics">
            <div className="metric">
              <span>Emotion Accuracy:</span>
              <span>{(testResults.contentAnalysis.emotionAccuracy * 100).toFixed(1)}%</span>
            </div>
            <div className="metric">
              <span>Intensity Accuracy:</span>
              <span>{(testResults.contentAnalysis.intensityAccuracy * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Viseme Generation Results */}
        {testResults.visemeGeneration && (
          <div className="test-section">
            <h4>Emotion-Modulated Viseme Generation</h4>
            <div className="metric">
              <span>Pass Rate:</span>
              <span>{(testResults.visemeGeneration.passRate * 100).toFixed(1)}%</span>
            </div>
          </div>
        )}

        {/* Interpolation Results */}
        {testResults.interpolation && (
          <div className="test-section">
            <h4>Sub-Frame Interpolation</h4>
            <div className="metrics">
              <div className="metric">
                <span>Smoothness Score:</span>
                <span>{(testResults.interpolation.smoothnessScore * 100).toFixed(1)}%</span>
              </div>
              <div className="metric">
                <span>Abrupt Transitions:</span>
                <span>{testResults.interpolation.abruptTransitions}</span>
              </div>
            </div>
          </div>
        )}

        {/* Performance Results */}
        {testResults.performance && (
          <div className="test-section">
            <h4>Performance Metrics</h4>
            <div className="metrics">
              <div className="metric">
                <span>Average FPS:</span>
                <span>{testResults.performance.averageFps.toFixed(1)}</span>
              </div>
              <div className="metric">
                <span>Performance Grade:</span>
                <span className={testResults.performance.performanceGrade.toLowerCase()}>
                  {testResults.performance.performanceGrade}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render visual demo section
  const renderVisualDemo = () => {
    if (!visualDemo) return null;

    if (visualDemo.type === 'interpolation') {
      return (
        <div className="visual-demo interpolation-demo">
          <h4>Interpolation Smoothness Test</h4>
          <div className="demo-metrics">
            <div className="metric">
              <span>Smoothness Score:</span>
              <span>{(visualDemo.result.smoothnessScore * 100).toFixed(1)}%</span>
            </div>
            <div className="metric">
              <span>Frames Generated:</span>
              <span>{visualDemo.result.frameCount}</span>
            </div>
            <div className="metric">
              <span>Abrupt Transitions:</span>
              <span>{visualDemo.result.abruptTransitions}</span>
            </div>
          </div>
        </div>
      );
    }

    if (visualDemo.type === 'breathing') {
      return (
        <div className="visual-demo breathing-demo">
          <h4>Breathing Animation Test - {visualDemo.emotion}</h4>
          <div className="demo-metrics">
            <div className="metric">
              <span>Pattern Valid:</span>
              <span className={visualDemo.validation.passed ? 'passed' : 'failed'}>
                {visualDemo.validation.passed ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="metric">
              <span>Rate Match:</span>
              <span className={visualDemo.validation.rateMatch ? 'passed' : 'failed'}>
                {visualDemo.validation.rateMatch ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="metric">
              <span>Depth Match:</span>
              <span className={visualDemo.validation.depthMatch ? 'passed' : 'failed'}>
                {visualDemo.validation.depthMatch ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
          
          {/* Breathing pattern visualization */}
          <div className="breathing-visualization">
            <svg width="400" height="100" className="breathing-chart">
              {visualDemo.frames.map((frame, index) => (
                <circle
                  key={index}
                  cx={index * 4}
                  cy={50 - (frame.breathIntensity * 30)}
                  r="1"
                  fill="#2196F3"
                />
              ))}
            </svg>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="emotional-lipsync-validation-page">
      <style jsx>{`
        .emotional-lipsync-validation-page {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
          font-family: Arial, sans-serif;
        }

        .header {
          text-align: center;
          margin-bottom: 30px;
        }

        .header h1 {
          color: #2196F3;
          margin-bottom: 10px;
        }

        .control-panel {
          background: #f5f5f5;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .control-group {
          margin-bottom: 15px;
        }

        .control-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }

        .control-group input,
        .control-group select,
        .control-group textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .control-group textarea {
          height: 80px;
          resize: vertical;
        }

        .button-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
          margin-top: 15px;
        }

        .test-button {
          padding: 10px 15px;
          border: none;
          border-radius: 4px;
          background: #2196F3;
          color: white;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.3s;
        }

        .test-button:hover:not(:disabled) {
          background: #1976D2;
        }

        .test-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .test-button.primary {
          background: #4CAF50;
          grid-column: 1 / -1;
        }

        .test-button.primary:hover:not(:disabled) {
          background: #45a049;
        }

        .real-time-analysis {
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .emotion-indicator {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 10px;
        }

        .emotion-name {
          font-weight: bold;
          min-width: 80px;
        }

        .confidence-bar {
          flex: 1;
          height: 20px;
          background: #eee;
          border-radius: 10px;
          overflow: hidden;
        }

        .confidence-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .confidence-text {
          font-weight: bold;
          min-width: 50px;
        }

        .modulation-params {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
          margin-top: 15px;
        }

        .param-item {
          background: #f9f9f9;
          padding: 10px;
          border-radius: 4px;
        }

        .param-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 5px;
        }

        .param-value {
          font-weight: bold;
          font-size: 16px;
        }

        .current-test {
          background: #FFF3CD;
          border: 1px solid #FFEAA7;
          color: #856404;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 20px;
          text-align: center;
        }

        .test-summary {
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 15px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background: #f9f9f9;
          border-radius: 4px;
        }

        .label {
          font-weight: bold;
        }

        .score, .grade {
          font-weight: bold;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .score.excellent, .grade.excellent {
          background: #4CAF50;
          color: white;
        }

        .score.good, .grade.good {
          background: #8BC34A;
          color: white;
        }

        .score.acceptable, .grade.acceptable {
          background: #FF9800;
          color: white;
        }

        .score.needs-improvement, .grade.needs-improvement {
          background: #F44336;
          color: white;
        }

        .recommendations {
          margin-top: 15px;
          padding: 15px;
          background: #E3F2FD;
          border-radius: 4px;
        }

        .recommendations h4 {
          margin-top: 0;
          color: #1976D2;
        }

        .recommendations ul {
          margin: 10px 0 0 20px;
        }

        .detailed-results {
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .test-section {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #eee;
        }

        .test-section:last-child {
          border-bottom: none;
        }

        .test-section h4 {
          color: #2196F3;
          margin-bottom: 10px;
        }

        .metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
        }

        .metric {
          display: flex;
          justify-content: space-between;
          padding: 8px;
          background: #f9f9f9;
          border-radius: 4px;
        }

        .visual-demo {
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .visual-demo h4 {
          color: #2196F3;
          margin-bottom: 15px;
        }

        .demo-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
          margin-bottom: 15px;
        }

        .breathing-visualization {
          margin-top: 15px;
        }

        .breathing-chart {
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .passed {
          color: #4CAF50;
          font-weight: bold;
        }

        .failed {
          color: #F44336;
          font-weight: bold;
        }

        .good {
          color: #4CAF50;
        }

        .acceptable {
          color: #FF9800;
        }

        .poor {
          color: #F44336;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .error {
          background: #FFEBEE;
          border: 1px solid #FFCDD2;
          color: #C62828;
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 20px;
        }
      `}</style>

      <div className="header">
        <h1>Emotional Lip Sync Validation</h1>
        <p>Comprehensive testing and validation of emotional expression functionality</p>
      </div>

      <div className="control-panel">
        <div className="control-group">
          <label htmlFor="test-input">Test Input Text:</label>
          <textarea
            id="test-input"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Enter text to analyze for emotional content..."
          />
        </div>

        <div className="control-group">
          <label htmlFor="emotion-select">Test Emotion:</label>
          <select
            id="emotion-select"
            value={selectedEmotion}
            onChange={(e) => setSelectedEmotion(e.target.value)}
          >
            {Object.keys(EMOTIONAL_STATES).map(emotion => (
              <option key={emotion} value={emotion}>
                {EMOTIONAL_STATES[emotion].name}
              </option>
            ))}
          </select>
        </div>

        <div className="button-grid">
          <button
            className="test-button primary"
            onClick={runComprehensiveTests}
            disabled={isRunning}
          >
            {isRunning ? 'Running Tests...' : 'Run Comprehensive Test Suite'}
          </button>
          
          <button
            className="test-button"
            onClick={testEmotionalAnalysis}
            disabled={isRunning}
          >
            Test Emotional Analysis
          </button>
          
          <button
            className="test-button"
            onClick={testInterpolationSmoothness}
            disabled={isRunning}
          >
            Test Interpolation
          </button>
          
          <button
            className="test-button"
            onClick={testBreathingAnimation}
            disabled={isRunning}
          >
            Test Breathing Animation
          </button>
          
          <button
            className="test-button"
            onClick={runPerformanceBenchmark}
            disabled={isRunning}
          >
            Performance Benchmark
          </button>
          
          <button
            className="test-button"
            onClick={testEmotionalTransitions}
            disabled={isRunning}
          >
            Test Transitions
          </button>
        </div>
      </div>

      {currentTest && (
        <div className="current-test">
          {currentTest}
        </div>
      )}

      {realTimeAnalysis && (
        <div className="real-time-analysis">
          <h3>Real-Time Emotional Analysis</h3>
          {renderEmotionIndicator(realTimeAnalysis.emotion, realTimeAnalysis.confidence)}
          
          {realTimeAnalysis.modulationParams && (
            <div className="modulation-params">
              <div className="param-item">
                <div className="param-label">Amplification</div>
                <div className="param-value">{realTimeAnalysis.modulationParams.amplify.toFixed(2)}x</div>
              </div>
              <div className="param-item">
                <div className="param-label">Speed Modifier</div>
                <div className="param-value">{realTimeAnalysis.modulationParams.speed.toFixed(2)}x</div>
              </div>
              <div className="param-item">
                <div className="param-label">Breathing Rate</div>
                <div className="param-value">{realTimeAnalysis.modulationParams.breathing.rate.toFixed(2)}x</div>
              </div>
              <div className="param-item">
                <div className="param-label">Breathing Depth</div>
                <div className="param-value">{realTimeAnalysis.modulationParams.breathing.depth.toFixed(2)}x</div>
              </div>
            </div>
          )}
        </div>
      )}

      {testResults?.error && (
        <div className="error">
          <strong>Test Error:</strong> {testResults.error}
        </div>
      )}

      {renderTestSummary()}
      {renderDetailedResults()}
      {renderVisualDemo()}

      {performanceMetrics && (
        <div className="visual-demo">
          <h4>Performance Metrics</h4>
          <div className="demo-metrics">
            <div className="metric">
              <span>Average Execution Time:</span>
              <span>{performanceMetrics.benchmark.averageExecutionTime.toFixed(2)}ms</span>
            </div>
            <div className="metric">
              <span>Throughput:</span>
              <span>{performanceMetrics.benchmark.throughput.toFixed(1)} ops/sec</span>
            </div>
            <div className="metric">
              <span>Real-time FPS:</span>
              <span className={performanceMetrics.realtime.averageFps >= 30 ? 'good' : 'poor'}>
                {performanceMetrics.realtime.averageFps.toFixed(1)}
              </span>
            </div>
            <div className="metric">
              <span>Memory Usage:</span>
              <span>{(performanceMetrics.benchmark.averageMemoryUsage / 1024).toFixed(1)}KB</span>
            </div>
          </div>
        </div>
      )}

      {transitionDemo && (
        <div className="visual-demo">
          <h4>Emotional Transition Test Results</h4>
          <div className="demo-metrics">
            <div className="metric">
              <span>Overall Score:</span>
              <span>{(transitionDemo.overallScore * 100).toFixed(1)}%</span>
            </div>
            <div className="metric">
              <span>Transitions Tested:</span>
              <span>{transitionDemo.transitions.length}</span>
            </div>
            <div className="metric">
              <span>Average Smoothness:</span>
              <span>{(transitionDemo.smoothnessScores.reduce((sum, score) => sum + score, 0) / transitionDemo.smoothnessScores.length * 100).toFixed(1)}%</span>
            </div>
            <div className="metric">
              <span>Timing Accuracy:</span>
              <span>{(transitionDemo.timingAccuracy.reduce((sum, score) => sum + score, 0) / transitionDemo.timingAccuracy.length * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmotionalLipSyncValidationPage;