/**
 * Viseme Lip Sync Test Page
 * Sophisticated testing interface for validating lip sync functionality and viseme mapping
 */

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { 
  VisemeTestSuite, 
  MorphTargetValidator, 
  TimingAnalyzer, 
  PerformanceBenchmark 
} from '../utils/visemeTestFramework';
import { synthesizeSpeech } from '../utils/speechProcessing';
import { VisemeToReallusion, lerpMorphTarget } from '../utils/convaiReallusion';

// Test avatar with validation instrumentation
function TestAvatar({ 
  isPlaying, 
  currentViseme, 
  onMorphTargetUpdate,
  showDebugInfo = false,
  ...props 
}) {
  const { scene } = useGLTF('/assets/SavannahAvatar.glb');
  const avatarRef = useRef();
  const { clock } = useThree();
  const blendShapeRef = useRef([]);
  const morphTargetsRef = useRef({});
  
  // Blinking state
  const [blink, setBlink] = useState(false);
  const currentBlendFrame = useRef(0);
  
  // Automatic blinking
  useEffect(() => {
    let blinkTimeout;
    const nextBlink = () => {
      blinkTimeout = setTimeout(() => {
        setBlink(true);
        setTimeout(() => {
          setBlink(false);
          nextBlink();
        }, 200);
      }, THREE.MathUtils.randInt(1000, 5000));
    };
    nextBlink();
    return () => clearTimeout(blinkTimeout);
  }, []);
  
  // Apply viseme data to morph targets
  useEffect(() => {
    if (currentViseme && avatarRef.current) {
      blendShapeRef.current = [];
      VisemeToReallusion(currentViseme, blendShapeRef);
    }
  }, [currentViseme]);
  
  // Frame synchronization with validation hooks
  useFrame((state) => {
    if (!avatarRef.current) return;
    
    const frameSkipNumber = 10;
    if (Math.floor(state.clock.elapsedTime * 100) - currentBlendFrame.current > frameSkipNumber) {
      currentBlendFrame.current = Math.floor(state.clock.elapsedTime * 100);
      
      const currentMorphTargets = {};
      
      // Apply morph targets and record values
      avatarRef.current.traverse((child) => {
        if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
          // Blinking
          const eyeCloseIndex = child.morphTargetDictionary['eyesClosed'] || 
                               child.morphTargetDictionary['EyesClosed'] ||
                               child.morphTargetDictionary['eyes_closed'];
          if (eyeCloseIndex !== undefined) {
            child.morphTargetInfluences[eyeCloseIndex] = THREE.MathUtils.lerp(
              child.morphTargetInfluences[eyeCloseIndex] || 0,
              blink ? 1 : 0,
              0.3
            );
            currentMorphTargets['eyesClosed'] = child.morphTargetInfluences[eyeCloseIndex];
          }
          
          // Apply Conv-AI viseme blend shapes
          if (blendShapeRef.current.length > 0) {
            const blendShape = blendShapeRef.current[0];
            
            // Map Conv-AI morph target names to actual avatar morph targets
            const morphMapping = {
              'Mouth_Drop_Lower': ['Jaw_Open', 'jawOpen', 'mouth_open'],
              'Mouth_Drop_Upper': ['mouthUpperUp_L', 'mouthUpperUp_R'],
              'Mouth_Smile_L': ['mouthSmile_L', 'Mouth_Smile_L'],
              'Mouth_Smile_R': ['mouthSmile_R', 'Mouth_Smile_R'],
              'Mouth_Frown_L': ['mouthFrown_L', 'Mouth_Frown_L'],
              'Mouth_Frown_R': ['mouthFrown_R', 'Mouth_Frown_R'],
              'Open_Jaw': ['Jaw_Open', 'jawOpen'],
              'V_Explosive': ['mouthPucker', 'Mouth_Pucker'],
              'V_Dental_Lip': ['mouthPress', 'Mouth_Press'],
              'V_Tight_O': ['mouthPucker', 'Mouth_Pucker'],
              'V_Lip_Open': ['mouthOpen', 'Mouth_Open'],
              'V_Wide': ['mouthSmile_L', 'mouthSmile_R'],
            };
            
            // Apply each morph target
            for (const [convaiName, value] of Object.entries(blendShape)) {
              if (value > 0) {
                const candidates = morphMapping[convaiName] || [convaiName];
                for (const candidate of candidates) {
                  const index = child.morphTargetDictionary[candidate];
                  if (index !== undefined) {
                    child.morphTargetInfluences[index] = THREE.MathUtils.lerp(
                      child.morphTargetInfluences[index] || 0,
                      value,
                      0.2
                    );
                    currentMorphTargets[candidate] = child.morphTargetInfluences[index];
                  }
                }
              }
            }
          }
        }
      });
      
      // Update morph targets reference
      morphTargetsRef.current = currentMorphTargets;
      
      // Callback for validation recording
      if (onMorphTargetUpdate) {
        onMorphTargetUpdate(currentMorphTargets);
      }
      
      // Clear the blend shape array after applying
      if (blendShapeRef.current.length > 0) {
        blendShapeRef.current.shift();
      }
    }
  });

  return (
    <group ref={avatarRef} {...props} dispose={null}>
      <group name="Scene">
        <group scale={0.02} position={[0, -1, 0]}>
          <primitive object={scene} />
        </group>
      </group>
      {showDebugInfo && morphTargetsRef.current && (
        <Html position={[0, 2, 0]} center>
          <div style={{ 
            background: 'rgba(0,0,0,0.8)', 
            color: 'white', 
            padding: '10px',
            borderRadius: '5px',
            fontSize: '12px',
            maxWidth: '300px'
          }}>
            <h4 style={{ margin: '0 0 5px 0' }}>Active Morph Targets:</h4>
            {Object.entries(morphTargetsRef.current)
              .filter(([_, value]) => value > 0.01)
              .map(([name, value]) => (
                <div key={name}>
                  {name}: {(value * 100).toFixed(1)}%
                </div>
              ))}
          </div>
        </Html>
      )}
    </group>
  );
}

// Test control panel
function TestControlPanel({ 
  onRunTests, 
  onStartRecording, 
  onStopRecording,
  isRecording,
  testResults,
  performanceMetrics
}) {
  return (
    <div className="test-control-panel">
      <h3>Viseme Test Controls</h3>
      
      <div className="test-actions">
        <button 
          className="test-btn primary"
          onClick={onRunTests}
        >
          🧪 Run All Tests
        </button>
        
        <button 
          className={`test-btn ${isRecording ? 'recording' : 'secondary'}`}
          onClick={isRecording ? onStopRecording : onStartRecording}
        >
          {isRecording ? '⏹️ Stop Recording' : '⏺️ Start Recording'}
        </button>
      </div>
      
      {testResults && (
        <div className="test-results-summary">
          <h4>Test Results</h4>
          <div className="result-stats">
            <div className="stat">
              <span className="label">Total Tests:</span>
              <span className="value">{testResults.totalTests}</span>
            </div>
            <div className="stat">
              <span className="label">Passed:</span>
              <span className="value success">{testResults.passed}</span>
            </div>
            <div className="stat">
              <span className="label">Failed:</span>
              <span className="value error">{testResults.failed}</span>
            </div>
            <div className="stat">
              <span className="label">Pass Rate:</span>
              <span className="value">
                {((testResults.passed / testResults.totalTests) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}
      
      {performanceMetrics && (
        <div className="performance-metrics">
          <h4>Performance Metrics</h4>
          <div className="metric">
            <span className="label">Avg Execution Time:</span>
            <span className="value">{performanceMetrics.averageDuration.toFixed(2)}ms</span>
          </div>
          {performanceMetrics.averageMemoryDelta && (
            <div className="metric">
              <span className="label">Avg Memory Delta:</span>
              <span className="value">
                {(performanceMetrics.averageMemoryDelta / 1024 / 1024).toFixed(2)}MB
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Detailed test results viewer
function TestResultsViewer({ results }) {
  const [selectedTest, setSelectedTest] = useState(null);
  
  if (!results || results.length === 0) return null;
  
  return (
    <div className="test-results-viewer">
      <h3>Detailed Test Results</h3>
      
      <div className="test-list">
        {results.map((result, index) => (
          <div 
            key={index}
            className={`test-item ${result.passed ? 'passed' : 'failed'} ${selectedTest === index ? 'selected' : ''}`}
            onClick={() => setSelectedTest(index)}
          >
            <span className="status-icon">{result.passed ? '✅' : '❌'}</span>
            <span className="test-name">{result.testName}</span>
            <span className="execution-time">{result.executionTime.toFixed(2)}ms</span>
          </div>
        ))}
      </div>
      
      {selectedTest !== null && (
        <div className="test-details">
          <h4>{results[selectedTest].testName}</h4>
          <p className="description">{results[selectedTest].description}</p>
          
          <div className="validation-section">
            <h5>Phoneme Validation</h5>
            <div className="validation-result">
              <span className={results[selectedTest].phonemeValidation.passed ? 'success' : 'error'}>
                {results[selectedTest].phonemeValidation.passed ? 'PASSED' : 'FAILED'}
              </span>
              {!results[selectedTest].phonemeValidation.passed && (
                <div className="differences">
                  <h6>Differences:</h6>
                  {results[selectedTest].phonemeValidation.differences.map((diff, i) => (
                    <div key={i} className="diff-item">
                      Index {diff.index}: Expected "{diff.expected}", Got "{diff.actual}"
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="validation-section">
            <h5>Viseme Validation</h5>
            <div className="validation-result">
              <span className={results[selectedTest].visemeValidation.passed ? 'success' : 'error'}>
                {results[selectedTest].visemeValidation.passed ? 'PASSED' : 'FAILED'}
              </span>
              {!results[selectedTest].visemeValidation.passed && (
                <div className="differences">
                  <h6>Differences:</h6>
                  {results[selectedTest].visemeValidation.differences.map((diff, i) => (
                    <div key={i} className="diff-item">
                      Index {diff.index}: 
                      Expected {JSON.stringify(diff.expected)}, 
                      Got {JSON.stringify(diff.actual)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Timing visualization
function TimingVisualization({ timingData }) {
  if (!timingData || !timingData.timingData || timingData.timingData.length === 0) return null;
  
  const maxTime = Math.max(...timingData.timingData.map(d => d.timestamp));
  const scale = 500 / maxTime; // Scale to 500px width
  
  return (
    <div className="timing-visualization">
      <h3>Timing Analysis</h3>
      
      <div className="timing-stats">
        <div className="stat">
          <span className="label">Avg Audio-Viseme Delay:</span>
          <span className="value">{timingData.averageAudioVisemeDelay.toFixed(2)}ms</span>
        </div>
        <div className="stat">
          <span className="label">Sync Score:</span>
          <span className={`value ${timingData.synchronizationScore}`}>
            {timingData.synchronizationScore.toUpperCase()}
          </span>
        </div>
      </div>
      
      <div className="timeline">
        <div className="timeline-track audio">
          <div className="track-label">Audio</div>
          {timingData.timingData
            .filter(d => d.type === 'audio_event')
            .map((event, i) => (
              <div 
                key={i}
                className="timeline-event audio-event"
                style={{ left: `${event.timestamp * scale}px` }}
                title={`Audio: ${event.event} at ${event.timestamp.toFixed(0)}ms`}
              />
            ))}
        </div>
        
        <div className="timeline-track viseme">
          <div className="track-label">Viseme</div>
          {timingData.timingData
            .filter(d => d.type === 'viseme_change')
            .map((event, i) => (
              <div 
                key={i}
                className="timeline-event viseme-event"
                style={{ left: `${event.timestamp * scale}px` }}
                title={`Viseme: ${JSON.stringify(event.viseme)} at ${event.timestamp.toFixed(0)}ms`}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

export default function VisemeLipSyncTestPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentViseme, setCurrentViseme] = useState({ 0: 1.0 });
  const [showDebugInfo, setShowDebugInfo] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [detailedResults, setDetailedResults] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [timingData, setTimingData] = useState(null);
  
  // Test framework instances
  const testSuiteRef = useRef(new VisemeTestSuite());
  const morphValidatorRef = useRef(new MorphTargetValidator());
  const timingAnalyzerRef = useRef(new TimingAnalyzer());
  const benchmarkRef = useRef(new PerformanceBenchmark());
  
  // Run comprehensive tests
  const runTests = useCallback(async () => {
    benchmarkRef.current.startBenchmark('Full Test Suite');
    
    const results = await testSuiteRef.current.runAll();
    const report = testSuiteRef.current.generateReport();
    
    benchmarkRef.current.endBenchmark();
    const metrics = benchmarkRef.current.getAverageMetrics();
    
    setTestResults(results);
    setDetailedResults(results.results);
    setPerformanceMetrics(metrics);
    
    console.log('Test Report:', report);
  }, []);
  
  // Recording controls
  const startRecording = useCallback(() => {
    morphValidatorRef.current.startRecording();
    timingAnalyzerRef.current.reset();
    setIsRecording(true);
  }, []);
  
  const stopRecording = useCallback(() => {
    const recordings = morphValidatorRef.current.stopRecording();
    const timingAnalysis = timingAnalyzerRef.current.analyze();
    
    setIsRecording(false);
    setTimingData(timingAnalysis);
    
    console.log('Morph Target Recordings:', recordings);
    console.log('Timing Analysis:', timingAnalysis);
  }, []);
  
  // Morph target update callback
  const handleMorphTargetUpdate = useCallback((morphTargets) => {
    if (isRecording) {
      morphValidatorRef.current.recordFrame(morphTargets);
    }
  }, [isRecording]);
  
  // Test speech synthesis
  const runTestSpeech = useCallback(async (text) => {
    if (isPlaying) {
      speechSynthesis.cancel();
      setIsPlaying(false);
      setCurrentViseme({ 0: 1.0 });
      return;
    }

    try {
      setIsPlaying(true);
      const startTime = performance.now();

      await synthesizeSpeech(
        text,
        {
          rate: 1.0,
          pitch: 1.0,
          volume: 0.8
        },
        (visemeData) => {
          setCurrentViseme(visemeData);
          
          if (isRecording) {
            timingAnalyzerRef.current.recordVisemeChange(
              visemeData, 
              performance.now() - startTime
            );
          }
        }
      );

      setIsPlaying(false);
      setCurrentViseme({ 0: 1.0 });

    } catch (error) {
      console.error('Speech synthesis error:', error);
      setIsPlaying(false);
      setCurrentViseme({ 0: 1.0 });
    }
  }, [isPlaying, isRecording]);
  
  return (
    <div className="viseme-test-page">
      <div className="page-header">
        <h1>Viseme Lip Sync Test Framework</h1>
        <p>Comprehensive testing and validation for lip sync accuracy</p>
      </div>

      <div className="test-layout">
        <div className="avatar-section">
          <Canvas 
            camera={{ position: [0, 1.6, 2.5], fov: 50 }}
            gl={{ preserveDrawingBuffer: false, antialias: true }}
          >
            <ambientLight intensity={0.2} />
            <hemisphereLight 
              skyColor={'#fcf9d9'} 
              groundColor={'#fcf9d9'} 
              intensity={0.5} 
            />
            <directionalLight 
              position={[5, 10, 5]} 
              color={'#fcf9d9'} 
              intensity={2} 
            />
            
            <Suspense fallback={null}>
              <TestAvatar 
                isPlaying={isPlaying} 
                currentViseme={currentViseme}
                onMorphTargetUpdate={handleMorphTargetUpdate}
                showDebugInfo={showDebugInfo}
              />
            </Suspense>
            
            <OrbitControls 
              target={[0, 1.4, 0]}
              maxDistance={6}
              minDistance={1.5}
              maxPolarAngle={Math.PI * 0.8}
              minPolarAngle={Math.PI * 0.1}
              enableDamping={true}
              dampingFactor={0.05}
            />
          </Canvas>
          
          <div className="avatar-controls">
            <label>
              <input
                type="checkbox"
                checked={showDebugInfo}
                onChange={(e) => setShowDebugInfo(e.target.checked)}
              />
              Show Debug Info
            </label>
          </div>
        </div>

        <div className="test-sections">
          <TestControlPanel 
            onRunTests={runTests}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            isRecording={isRecording}
            testResults={testResults}
            performanceMetrics={performanceMetrics}
          />
          
          <div className="test-speech-section">
            <h3>Test Speech</h3>
            <div className="test-phrases">
              <button onClick={() => runTestSpeech('papa mama baba')}>
                Test Bilabials (P, B, M)
              </button>
              <button onClick={() => runTestSpeech('five very fun')}>
                Test Labiodentals (F, V)
              </button>
              <button onClick={() => runTestSpeech('think this that')}>
                Test Dentals (TH)
              </button>
              <button onClick={() => runTestSpeech('see zoo sassy')}>
                Test Sibilants (S, Z)
              </button>
              <button onClick={() => runTestSpeech('hello world, how are you today?')}>
                Test Complex Sentence
              </button>
            </div>
          </div>
          
          {detailedResults && (
            <TestResultsViewer results={detailedResults} />
          )}
          
          {timingData && (
            <TimingVisualization timingData={timingData} />
          )}
        </div>
      </div>

      <style jsx>{`
        .viseme-test-page {
          padding: 20px;
          max-width: 1800px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .page-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .page-header h1 {
          color: #2c3e50;
          margin-bottom: 10px;
          font-size: 2.5rem;
        }

        .page-header p {
          color: #6c757d;
          font-size: 1.1rem;
        }

        .test-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }

        .avatar-section {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          height: 700px;
        }

        .avatar-controls {
          position: absolute;
          bottom: 20px;
          left: 20px;
          background: rgba(255, 255, 255, 0.9);
          padding: 10px;
          border-radius: 8px;
          backdrop-filter: blur(10px);
        }

        .avatar-controls label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 500;
        }

        .test-sections {
          display: flex;
          flex-direction: column;
          gap: 20px;
          overflow-y: auto;
          max-height: 700px;
          padding-right: 10px;
        }

        .test-control-panel {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        }

        .test-control-panel h3 {
          margin: 0 0 15px 0;
          color: #2c3e50;
        }

        .test-actions {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .test-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .test-btn.primary {
          background: #007bff;
          color: white;
        }

        .test-btn.primary:hover {
          background: #0056b3;
        }

        .test-btn.secondary {
          background: #6c757d;
          color: white;
        }

        .test-btn.secondary:hover {
          background: #5a6268;
        }

        .test-btn.recording {
          background: #dc3545;
          color: white;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }

        .test-results-summary {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin-top: 15px;
        }

        .test-results-summary h4 {
          margin: 0 0 10px 0;
          color: #495057;
        }

        .result-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .stat {
          display: flex;
          justify-content: space-between;
        }

        .stat .label {
          color: #6c757d;
        }

        .stat .value {
          font-weight: 600;
          color: #495057;
        }

        .stat .value.success {
          color: #28a745;
        }

        .stat .value.error {
          color: #dc3545;
        }

        .performance-metrics {
          background: #e9ecef;
          padding: 15px;
          border-radius: 8px;
          margin-top: 15px;
        }

        .performance-metrics h4 {
          margin: 0 0 10px 0;
          color: #495057;
        }

        .metric {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }

        .metric .label {
          color: #6c757d;
        }

        .metric .value {
          font-weight: 600;
          color: #007bff;
        }

        .test-speech-section {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        }

        .test-speech-section h3 {
          margin: 0 0 15px 0;
          color: #2c3e50;
        }

        .test-phrases {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .test-phrases button {
          padding: 10px;
          border: 1px solid #dee2e6;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .test-phrases button:hover {
          background: #f8f9fa;
          border-color: #007bff;
        }

        .test-results-viewer {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        }

        .test-results-viewer h3 {
          margin: 0 0 15px 0;
          color: #2c3e50;
        }

        .test-list {
          border: 1px solid #dee2e6;
          border-radius: 6px;
          max-height: 200px;
          overflow-y: auto;
        }

        .test-item {
          display: flex;
          align-items: center;
          padding: 10px;
          border-bottom: 1px solid #f1f3f4;
          cursor: pointer;
          transition: background 0.2s;
        }

        .test-item:last-child {
          border-bottom: none;
        }

        .test-item:hover {
          background: #f8f9fa;
        }

        .test-item.selected {
          background: #e3f2fd;
        }

        .test-item.passed .status-icon {
          color: #28a745;
        }

        .test-item.failed .status-icon {
          color: #dc3545;
        }

        .status-icon {
          margin-right: 10px;
          font-size: 16px;
        }

        .test-name {
          flex: 1;
          font-weight: 500;
        }

        .execution-time {
          color: #6c757d;
          font-size: 14px;
        }

        .test-details {
          margin-top: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .test-details h4 {
          margin: 0 0 10px 0;
          color: #2c3e50;
        }

        .test-details .description {
          color: #6c757d;
          margin-bottom: 15px;
        }

        .validation-section {
          margin-bottom: 15px;
        }

        .validation-section h5 {
          margin: 0 0 10px 0;
          color: #495057;
        }

        .validation-result {
          padding: 10px;
          background: white;
          border-radius: 6px;
        }

        .validation-result .success {
          color: #28a745;
          font-weight: 600;
        }

        .validation-result .error {
          color: #dc3545;
          font-weight: 600;
        }

        .differences {
          margin-top: 10px;
        }

        .differences h6 {
          margin: 0 0 5px 0;
          color: #6c757d;
        }

        .diff-item {
          padding: 5px;
          background: #fff3cd;
          border: 1px solid #ffeeba;
          border-radius: 4px;
          margin-bottom: 5px;
          font-size: 14px;
          font-family: monospace;
        }

        .timing-visualization {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        }

        .timing-visualization h3 {
          margin: 0 0 15px 0;
          color: #2c3e50;
        }

        .timing-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }

        .timing-stats .stat {
          padding: 10px;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .timing-stats .value.excellent {
          color: #28a745;
        }

        .timing-stats .value.good {
          color: #17a2b8;
        }

        .timing-stats .value.acceptable {
          color: #ffc107;
        }

        .timing-stats .value.poor {
          color: #dc3545;
        }

        .timeline {
          position: relative;
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
        }

        .timeline-track {
          position: relative;
          height: 40px;
          margin-bottom: 10px;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 4px;
        }

        .track-label {
          position: absolute;
          left: -80px;
          top: 50%;
          transform: translateY(-50%);
          font-weight: 600;
          color: #495057;
          width: 70px;
          text-align: right;
        }

        .timeline-event {
          position: absolute;
          width: 4px;
          height: 30px;
          top: 5px;
          border-radius: 2px;
          cursor: pointer;
        }

        .audio-event {
          background: #007bff;
        }

        .viseme-event {
          background: #28a745;
        }

        @media (max-width: 1200px) {
          .test-layout {
            grid-template-columns: 1fr;
          }
          
          .avatar-section {
            height: 500px;
          }
          
          .test-sections {
            max-height: none;
          }
        }
      `}</style>
    </div>
  );
}