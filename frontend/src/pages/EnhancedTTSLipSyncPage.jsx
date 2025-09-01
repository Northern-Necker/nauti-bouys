/**
 * Enhanced TTS + Lip Sync Test Page
 * Integrates IntegratedLipSyncEngine from enhancedLipSync.js with emotional expression
 * Advanced features for improved efficacy and emotional expression testing
 */

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { IntegratedLipSyncEngine } from '../utils/enhancedLipSync';
import { VisemeToActorCore, applyBlendShape } from '../utils/enhancedActorCoreLipSync';
import { synthesizeSpeech, textToVisemes } from '../utils/speechProcessing';

// Enhanced test phrases with emotional context
const ENHANCED_TEST_PHRASES = [
  {
    id: 'greeting',
    text: "Hello! Welcome to Nauti-Bouys. I'm your AI bartender assistant.",
    category: 'Greeting',
    expectedEmotion: 'happy',
    complexity: 'medium'
  },
  {
    id: 'excitement',
    text: "Wow! That's absolutely incredible! This whiskey is spectacular and outstanding!",
    category: 'Excitement',
    expectedEmotion: 'excited',
    complexity: 'high'
  },
  {
    id: 'sadness',
    text: "I'm sorry, but unfortunately we're out of that spirit. I'm disappointed too.",
    category: 'Sadness',
    expectedEmotion: 'sad',
    complexity: 'medium'
  },
  {
    id: 'surprise',
    text: "Really? Seriously? That's honestly quite remarkable and unbelievable!",
    category: 'Surprise',
    expectedEmotion: 'surprised',
    complexity: 'high'
  },
  {
    id: 'calm',
    text: "Certainly, indeed. This bourbon precisely has notes of vanilla and caramel naturally.",
    category: 'Calm Professional',
    expectedEmotion: 'calm',
    complexity: 'low'
  },
  {
    id: 'phonemes',
    text: "Peter Piper picked a peck of pickled peppers. How much wood would a woodchuck chuck?",
    category: 'Phoneme Test',
    expectedEmotion: 'neutral',
    complexity: 'very_high'
  }
];

// Enhanced Avatar Component with Emotional Lip Sync
function EnhancedSavannahAvatar({ 
  isPlaying, 
  currentViseme, 
  currentEmotion, 
  emotionIntensity,
  breathingEnabled = true,
  idleEnabled = true,
  ...props 
}) {
  const { scene } = useGLTF('/assets/SavannahAvatar.glb');
  const avatarRef = useRef();
  const { clock } = useThree();
  const lipSyncEngine = useRef(new IntegratedLipSyncEngine());
  
  // Animation state
  const [blink, setBlink] = useState(false);
  const currentBlendFrame = useRef(0);
  const blendShapeRef = useRef([]);
  const previousViseme = useRef(null);
  const nextViseme = useRef(null);
  
  // Performance metrics
  const [performanceMetrics, setPerformanceMetrics] = useState({
    frameTime: 0,
    quality: 1.0,
    avgFrameTime: 0
  });

  // Automatic blinking with realistic patterns
  useEffect(() => {
    let blinkTimeout;
    const nextBlink = () => {
      const blinkInterval = THREE.MathUtils.randInt(2000, 6000);
      blinkTimeout = setTimeout(() => {
        setBlink(true);
        setTimeout(() => {
          setBlink(false);
          nextBlink();
        }, THREE.MathUtils.randInt(150, 250));
      }, blinkInterval);
    };
    nextBlink();
    return () => clearTimeout(blinkTimeout);
  }, []);

  // Real-time frame processing with enhanced features
  useFrame((state) => {
    if (!avatarRef.current) return;
    
    const frameStartTime = performance.now();
    const frameSkipNumber = 8; // Optimized frame rate
    
    if (Math.floor(state.clock.elapsedTime * 100) - currentBlendFrame.current > frameSkipNumber) {
      currentBlendFrame.current = Math.floor(state.clock.elapsedTime * 100);
      
      // Process enhanced lip sync frame
      const frameData = lipSyncEngine.current.processFrame(
        currentViseme,
        previousViseme.current,
        nextViseme.current,
        state.clock.elapsedTime * 1000,
        0.5 // interpolation factor
      );

      // Apply enhanced morph targets
      avatarRef.current.traverse((child) => {
        if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
          
          // Apply lip sync morph targets
          if (frameData.morphTargets) {
            Object.entries(frameData.morphTargets).forEach(([morphName, value]) => {
              const index = child.morphTargetDictionary[morphName];
              if (index !== undefined) {
                child.morphTargetInfluences[index] = THREE.MathUtils.lerp(
                  child.morphTargetInfluences[index] || 0,
                  value,
                  0.3
                );
              }
            });
          }

          // Apply blinking
          const eyeBlinkL = child.morphTargetDictionary['Eye_Blink_L'];
          const eyeBlinkR = child.morphTargetDictionary['Eye_Blink_R'];
          
          if (eyeBlinkL !== undefined) {
            child.morphTargetInfluences[eyeBlinkL] = THREE.MathUtils.lerp(
              child.morphTargetInfluences[eyeBlinkL] || 0,
              (blink || frameData.idle?.eyeBlink > 0) ? 1 : 0,
              0.4
            );
          }
          if (eyeBlinkR !== undefined) {
            child.morphTargetInfluences[eyeBlinkR] = THREE.MathUtils.lerp(
              child.morphTargetInfluences[eyeBlinkR] || 0,
              (blink || frameData.idle?.eyeBlink > 0) ? 1 : 0,
              0.4
            );
          }

          // Apply breathing animation if enabled
          if (breathingEnabled && frameData.breathing) {
            // Apply subtle breathing effects to available morph targets
            const chestInfluence = frameData.breathing.chestRise * 0.1;
            const nostrilInfluence = frameData.breathing.nostrilFlare;
            
            // Apply to any available breathing-related morph targets
            Object.keys(child.morphTargetDictionary).forEach(morphName => {
              if (morphName.toLowerCase().includes('nostril') || morphName.toLowerCase().includes('nose')) {
                const index = child.morphTargetDictionary[morphName];
                if (index !== undefined) {
                  child.morphTargetInfluences[index] = THREE.MathUtils.lerp(
                    child.morphTargetInfluences[index] || 0,
                    nostrilInfluence,
                    0.1
                  );
                }
              }
            });
          }

          // Apply idle movements if enabled
          if (idleEnabled && frameData.idle) {
            // Subtle head sway through body positioning (minimal effect)
            if (frameData.idle.headSway && avatarRef.current) {
              avatarRef.current.rotation.y = frameData.idle.headSway * 0.02;
            }
          }
        }
      });

      // Update performance metrics
      const frameTime = performance.now() - frameStartTime;
      setPerformanceMetrics(prev => ({
        frameTime,
        quality: frameData.performance?.quality || 1.0,
        avgFrameTime: (prev.avgFrameTime * 0.9) + (frameTime * 0.1)
      }));
    }
  });

  return (
    <group ref={avatarRef} {...props} dispose={null}>
      <group name="Scene">
        <group scale={0.02} position={[0, -1, 0]}>
          <primitive object={scene} />
        </group>
      </group>
    </group>
  );
}

// Emotional State Display Component
function EmotionalStateDisplay({ 
  currentEmotion, 
  emotionIntensity, 
  emotionScores, 
  isAnalyzing 
}) {
  return (
    <div className="emotional-state-display">
      <h4>Emotional Analysis</h4>
      
      <div className="current-emotion">
        <span className={`emotion-indicator ${currentEmotion}`}>
          {isAnalyzing ? '🔄 Analyzing...' : `😊 ${currentEmotion.charAt(0).toUpperCase() + currentEmotion.slice(1)}`}
        </span>
        <div className="intensity-bar">
          <div 
            className="intensity-fill" 
            style={{ width: `${emotionIntensity * 100}%` }}
          />
          <span className="intensity-label">
            Intensity: {(emotionIntensity * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {emotionScores && (
        <div className="emotion-scores">
          <h5>Emotion Breakdown:</h5>
          {Object.entries(emotionScores).map(([emotion, score]) => (
            <div key={emotion} className="emotion-score">
              <span className="emotion-name">{emotion}:</span>
              <span className="emotion-value">{score}</span>
              <div className="score-bar">
                <div 
                  className="score-fill" 
                  style={{ width: `${Math.min(score * 33, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Performance Metrics Dashboard
function PerformanceMetrics({ 
  metrics, 
  processingTime, 
  qualityLevel, 
  visemeCount 
}) {
  return (
    <div className="performance-metrics">
      <h4>Performance Dashboard</h4>
      
      <div className="metrics-grid">
        <div className="metric-item">
          <span className="metric-label">Frame Time:</span>
          <span className={`metric-value ${metrics.frameTime > 16 ? 'warning' : 'good'}`}>
            {metrics.frameTime.toFixed(2)}ms
          </span>
        </div>
        
        <div className="metric-item">
          <span className="metric-label">Avg Frame Time:</span>
          <span className={`metric-value ${metrics.avgFrameTime > 16 ? 'warning' : 'good'}`}>
            {metrics.avgFrameTime.toFixed(2)}ms
          </span>
        </div>
        
        <div className="metric-item">
          <span className="metric-label">Quality Level:</span>
          <span className={`metric-value ${metrics.quality < 0.8 ? 'warning' : 'good'}`}>
            {(metrics.quality * 100).toFixed(0)}%
          </span>
        </div>
        
        <div className="metric-item">
          <span className="metric-label">Processing Time:</span>
          <span className="metric-value">
            {processingTime.toFixed(2)}ms
          </span>
        </div>
        
        <div className="metric-item">
          <span className="metric-label">Viseme Count:</span>
          <span className="metric-value">
            {visemeCount}
          </span>
        </div>
        
        <div className="metric-item">
          <span className="metric-label">FPS:</span>
          <span className={`metric-value ${1000/metrics.avgFrameTime < 50 ? 'warning' : 'good'}`}>
            {(1000 / Math.max(metrics.avgFrameTime, 1)).toFixed(0)}
          </span>
        </div>
      </div>
    </div>
  );
}

// Enhanced Controls Component
function EnhancedControls({ 
  speechSettings, 
  onSettingsChange,
  selectedVoice,
  onVoiceChange,
  breathingEnabled,
  onBreathingToggle,
  idleEnabled,
  onIdleToggle,
  emotionOverride,
  onEmotionOverride
}) {
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      if (!selectedVoice && availableVoices.length > 0) {
        const englishVoice = availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
        onVoiceChange(englishVoice);
      }
    };

    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoice, onVoiceChange]);

  return (
    <div className="enhanced-controls">
      <div className="control-section">
        <h4>Voice & Speech</h4>
        
        <div className="voice-selector">
          <select 
            value={selectedVoice?.voiceURI || ''} 
            onChange={(e) => {
              const voice = voices.find(v => v.voiceURI === e.target.value);
              onVoiceChange(voice);
            }}
          >
            <option value="">Select a voice...</option>
            {voices.map(voice => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang}) {voice.localService ? '🏠' : '☁️'}
              </option>
            ))}
          </select>
        </div>
        
        <div className="speech-settings">
          <div className="setting-group">
            <label>Rate: {speechSettings.rate.toFixed(2)}</label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={speechSettings.rate}
              onChange={(e) => onSettingsChange({ ...speechSettings, rate: parseFloat(e.target.value) })}
            />
          </div>
          
          <div className="setting-group">
            <label>Pitch: {speechSettings.pitch.toFixed(2)}</label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={speechSettings.pitch}
              onChange={(e) => onSettingsChange({ ...speechSettings, pitch: parseFloat(e.target.value) })}
            />
          </div>
          
          <div className="setting-group">
            <label>Volume: {speechSettings.volume.toFixed(2)}</label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={speechSettings.volume}
              onChange={(e) => onSettingsChange({ ...speechSettings, volume: parseFloat(e.target.value) })}
            />
          </div>
        </div>
      </div>

      <div className="control-section">
        <h4>Animation Controls</h4>
        
        <div className="animation-toggles">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={breathingEnabled}
              onChange={onBreathingToggle}
            />
            Enable Breathing Animation
          </label>
          
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={idleEnabled}
              onChange={onIdleToggle}
            />
            Enable Idle Movements
          </label>
        </div>

        <div className="emotion-override">
          <label>Emotion Override:</label>
          <select
            value={emotionOverride}
            onChange={(e) => onEmotionOverride(e.target.value)}
          >
            <option value="">Auto-detect</option>
            <option value="neutral">Neutral</option>
            <option value="happy">Happy</option>
            <option value="sad">Sad</option>
            <option value="excited">Excited</option>
            <option value="surprised">Surprised</option>
            <option value="calm">Calm</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// Enhanced Visual Feedback Component
function VisualFeedback({ currentViseme, isPlaying }) {
  return (
    <div className="visual-feedback">
      <h4>Live Viseme Data</h4>
      
      <div className="viseme-display">
        <div className={`viseme-status ${isPlaying ? 'active' : 'inactive'}`}>
          Status: {isPlaying ? 'Speaking' : 'Silent'}
        </div>
        
        {currentViseme && Object.keys(currentViseme).length > 0 && (
          <div className="viseme-data">
            <h5>Active Visemes:</h5>
            {Object.entries(currentViseme).map(([visemeId, value]) => (
              <div key={visemeId} className="viseme-item">
                <span className="viseme-id">Viseme {visemeId}:</span>
                <span className="viseme-value">{value.toFixed(3)}</span>
                <div className="viseme-bar">
                  <div 
                    className="viseme-fill" 
                    style={{ width: `${value * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Main Enhanced TTS Lip Sync Page Component
export default function EnhancedTTSLipSyncPage() {
  // Core state
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPhrase, setSelectedPhrase] = useState(ENHANCED_TEST_PHRASES[0]);
  const [customText, setCustomText] = useState('');
  const [useCustomText, setUseCustomText] = useState(false);
  
  // Speech settings
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [speechSettings, setSpeechSettings] = useState({
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8
  });

  // Enhanced lip sync state
  const [currentViseme, setCurrentViseme] = useState({ 0: 1.0 });
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [emotionIntensity, setEmotionIntensity] = useState(0);
  const [emotionScores, setEmotionScores] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Animation controls
  const [breathingEnabled, setBreathingEnabled] = useState(true);
  const [idleEnabled, setIdleEnabled] = useState(true);
  const [emotionOverride, setEmotionOverride] = useState('');

  // Performance metrics
  const [performanceMetrics, setPerformanceMetrics] = useState({
    frameTime: 0,
    quality: 1.0,
    avgFrameTime: 0
  });
  const [processingTime, setProcessingTime] = useState(0);
  const [visemeCount, setVisemeCount] = useState(0);

  // Enhanced lip sync engine
  const lipSyncEngine = useRef(new IntegratedLipSyncEngine());
  const currentSpeechRef = useRef(null);

  // Enhanced speech synthesis with emotional processing
  const handleEnhancedSpeak = useCallback(async () => {
    if (isPlaying) {
      speechSynthesis.cancel();
      if (currentSpeechRef.current) {
        currentSpeechRef.current.stop?.();
      }
      setIsPlaying(false);
      setCurrentViseme({ 0: 1.0 });
      return;
    }

    const textToSpeak = useCustomText ? customText : selectedPhrase.text;
    if (!textToSpeak.trim()) return;

    try {
      setIsPlaying(true);
      setIsAnalyzing(true);

      const startTime = performance.now();

      // Process enhanced speech with emotional analysis
      const enhancedData = await lipSyncEngine.current.processEnhancedSpeech(textToSpeak, {
        emotionOverride: emotionOverride || undefined,
        preserveEmotionalNuance: true
      });

      const endTime = performance.now();
      setProcessingTime(endTime - startTime);

      // Update emotional state
      setCurrentEmotion(emotionOverride || enhancedData.emotion.emotion);
      setEmotionIntensity(enhancedData.emotion.intensity);
      setEmotionScores(enhancedData.emotion.scores);
      setVisemeCount(enhancedData.visemes.length);
      setIsAnalyzing(false);

      // Create speech synthesis utterance
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.rate = speechSettings.rate;
      utterance.pitch = speechSettings.pitch;
      utterance.volume = speechSettings.volume;

      // Enhanced viseme animation synchronized with speech
      let visemeIndex = 0;
      const visemeDuration = 60000 / (speechSettings.rate * 300); // Adjusted for speech rate
      
      const visemeInterval = setInterval(() => {
        if (visemeIndex < enhancedData.visemes.length) {
          setCurrentViseme(enhancedData.visemes[visemeIndex]);
          visemeIndex++;
        } else {
          clearInterval(visemeInterval);
          setCurrentViseme({ 0: 1.0 }); // Return to silence
        }
      }, visemeDuration);

      currentSpeechRef.current = {
        stop: () => {
          clearInterval(visemeInterval);
          setCurrentViseme({ 0: 1.0 });
        }
      };

      utterance.onend = () => {
        clearInterval(visemeInterval);
        setCurrentViseme({ 0: 1.0 });
        setIsPlaying(false);
        setCurrentEmotion('neutral');
        setEmotionIntensity(0);
        currentSpeechRef.current = null;
      };

      utterance.onerror = (error) => {
        console.error('Enhanced speech synthesis error:', error);
        clearInterval(visemeInterval);
        setCurrentViseme({ 0: 1.0 });
        setIsPlaying(false);
        currentSpeechRef.current = null;
      };

      speechSynthesis.speak(utterance);

    } catch (error) {
      console.error('Enhanced speech processing error:', error);
      setIsPlaying(false);
      setIsAnalyzing(false);
    }
  }, [isPlaying, useCustomText, customText, selectedPhrase, speechSettings, selectedVoice, emotionOverride]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
      if (currentSpeechRef.current) {
        currentSpeechRef.current.stop?.();
      }
    };
  }, []);

  return (
    <div className="enhanced-tts-lipsync-page">
      <div className="page-header">
        <h1>Enhanced TTS + Emotional Lip Sync</h1>
        <p>Advanced testing with emotional expression, breathing animation, and performance optimization</p>
      </div>

      <div className="enhanced-layout">
        <div className="avatar-container">
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
              <EnhancedSavannahAvatar 
                isPlaying={isPlaying}
                currentViseme={currentViseme}
                currentEmotion={currentEmotion}
                emotionIntensity={emotionIntensity}
                breathingEnabled={breathingEnabled}
                idleEnabled={idleEnabled}
              />
            </Suspense>
            
            <OrbitControls 
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              target={[0, 1.4, 0]}
              maxDistance={6}
              minDistance={1.5}
              maxPolarAngle={Math.PI * 0.8}
              minPolarAngle={Math.PI * 0.1}
              enableDamping={true}
              dampingFactor={0.05}
              rotateSpeed={0.8}
              zoomSpeed={1.2}
              panSpeed={0.8}
              zoomToCursor={true}
              autoRotate={false}
            />
          </Canvas>
          
          <div className="avatar-overlay">
            <div className="status-info">
              <span className={`avatar-status ${isPlaying ? 'speaking' : 'idle'}`}>
                Avatar: {isPlaying ? 'Speaking' : 'Idle'}
              </span>
              <span className={`emotion-status ${currentEmotion}`}>
                Emotion: {currentEmotion} ({(emotionIntensity * 100).toFixed(0)}%)
              </span>
            </div>
          </div>
        </div>

        <div className="controls-container">
          <div className="control-section">
            <h3>Enhanced Text Selection</h3>
            <div className="text-mode-toggle">
              <label>
                <input
                  type="radio"
                  checked={!useCustomText}
                  onChange={() => setUseCustomText(false)}
                />
                Emotional Test Phrases
              </label>
              <label>
                <input
                  type="radio"
                  checked={useCustomText}
                  onChange={() => setUseCustomText(true)}
                />
                Custom Text
              </label>
            </div>

            {!useCustomText ? (
              <div className="phrase-selection">
                <select 
                  value={selectedPhrase.id} 
                  onChange={(e) => {
                    const phrase = ENHANCED_TEST_PHRASES.find(p => p.id === e.target.value);
                    setSelectedPhrase(phrase);
                  }}
                >
                  {ENHANCED_TEST_PHRASES.map(phrase => (
                    <option key={phrase.id} value={phrase.id}>
                      {phrase.category} - {phrase.expectedEmotion} ({phrase.complexity})
                    </option>
                  ))}
                </select>
                <div className="selected-text">
                  <strong>{selectedPhrase.category}</strong>
                  <div className="phrase-metadata">
                    Expected Emotion: <span className={`emotion-tag ${selectedPhrase.expectedEmotion}`}>
                      {selectedPhrase.expectedEmotion}
                    </span>
                    | Complexity: <span className="complexity-tag">{selectedPhrase.complexity}</span>
                  </div>
                  <p>"{selectedPhrase.text}"</p>
                </div>
              </div>
            ) : (
              <div className="custom-text-input">
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Enter your custom text here for emotional analysis..."
                  rows={4}
                />
                <div className="text-stats">
                  Characters: {customText.length} | Words: {customText.split(/\s+/).filter(w => w).length}
                </div>
              </div>
            )}

            <div className="playback-controls">
              <button
                className={`enhanced-speak-btn ${isPlaying ? 'playing' : ''}`}
                onClick={handleEnhancedSpeak}
                disabled={useCustomText && !customText.trim()}
              >
                {isPlaying ? '⏹️ Stop Enhanced Speech' : '🎭 Start Enhanced Speech'}
              </button>
            </div>
          </div>

          <EnhancedControls
            speechSettings={speechSettings}
            onSettingsChange={setSpeechSettings}
            selectedVoice={selectedVoice}
            onVoiceChange={setSelectedVoice}
            breathingEnabled={breathingEnabled}
            onBreathingToggle={() => setBreathingEnabled(!breathingEnabled)}
            idleEnabled={idleEnabled}
            onIdleToggle={() => setIdleEnabled(!idleEnabled)}
            emotionOverride={emotionOverride}
            onEmotionOverride={setEmotionOverride}
          />

          <EmotionalStateDisplay
            currentEmotion={currentEmotion}
            emotionIntensity={emotionIntensity}
            emotionScores={emotionScores}
            isAnalyzing={isAnalyzing}
          />

          <VisualFeedback
            currentViseme={currentViseme}
            isPlaying={isPlaying}
          />

          <PerformanceMetrics
            metrics={performanceMetrics}
            processingTime={processingTime}
            qualityLevel={performanceMetrics.quality}
            visemeCount={visemeCount}
          />
        </div>
      </div>

      <style jsx>{`
        .enhanced-tts-lipsync-page {
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .page-header p {
          color: #6c757d;
          font-size: 1.1rem;
        }

        .enhanced-layout {
          display: grid;
          grid-template-columns: 1fr 500px;
          gap: 25px;
          min-height: 85vh;
        }

        .avatar-container {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 15px;
          overflow: hidden;
          position: relative;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          min-height: 600px;
        }

        .avatar-overlay {
          position: absolute;
          top: 15px;
          left: 15px;
          background: rgba(255, 255, 255, 0.95);
          padding: 12px;
          border-radius: 10px;
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }

        .status-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
        }

        .avatar-status, .emotion-status {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
        }

        .avatar-status.idle {
          background: #f8f9fa;
          color: #6c757d;
        }

        .avatar-status.speaking {
          background: #d4edda;
          color: #155724;
        }

        .emotion-status {
          background: #e3f2fd;
          color: #1565c0;
        }

        .emotion-status.happy { background: #fff3e0; color: #e65100; }
        .emotion-status.sad { background: #f3e5f5; color: #4a148c; }
        .emotion-status.excited { background: #fff8e1; color: #ff6f00; }
        .emotion-status.surprised { background: #e8f5e8; color: #2e7d32; }
        .emotion-status.calm { background: #e1f5fe; color: #0277bd; }

        .controls-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          overflow-y: auto;
          padding-right: 10px;
          max-height: 85vh;
        }

        .control-section {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          border: 1px solid #e9ecef;
        }

        .control-section h3, .control-section h4 {
          margin: 0 0 15px 0;
          color: #2c3e50;
          font-weight: 600;
        }

        .control-section h3 {
          font-size: 1.3rem;
          border-bottom: 2px solid #e9ecef;
          padding-bottom: 8px;
        }

        .control-section h4 {
          font-size: 1.1rem;
        }

        .text-mode-toggle {
          display: flex;
          gap: 20px;
          margin-bottom: 15px;
        }

        .text-mode-toggle label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 500;
        }

        .phrase-selection select {
          width: 100%;
          padding: 10px;
          border: 2px solid #ddd;
          border-radius: 8px;
          margin-bottom: 15px;
          font-size: 14px;
          transition: border-color 0.3s;
        }

        .phrase-selection select:focus {
          border-color: #667eea;
          outline: none;
        }

        .selected-text {
          background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%);
          padding: 16px;
          border-radius: 10px;
          border-left: 4px solid #667eea;
        }

        .phrase-metadata {
          margin: 8px 0;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .emotion-tag {
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .emotion-tag.happy { background: #fff3e0; color: #e65100; }
        .emotion-tag.sad { background: #f3e5f5; color: #4a148c; }
        .emotion-tag.excited { background: #fff8e1; color: #ff6f00; }
        .emotion-tag.surprised { background: #e8f5e8; color: #2e7d32; }
        .emotion-tag.calm { background: #e1f5fe; color: #0277bd; }
        .emotion-tag.neutral { background: #f5f5f5; color: #616161; }

        .complexity-tag {
          padding: 2px 6px;
          border-radius: 4px;
          background: #e3f2fd;
          color: #1565c0;
          font-weight: 500;
          font-size: 11px;
        }

        .custom-text-input textarea {
          width: 100%;
          padding: 12px;
          border: 2px solid #ddd;
          border-radius: 8px;
          resize: vertical;
          font-family: inherit;
          font-size: 14px;
          line-height: 1.5;
          transition: border-color 0.3s;
        }

        .custom-text-input textarea:focus {
          border-color: #667eea;
          outline: none;
        }

        .text-stats {
          margin-top: 8px;
          font-size: 12px;
          color: #6c757d;
        }

        .playback-controls {
          text-align: center;
          margin-top: 20px;
        }

        .enhanced-speak-btn {
          padding: 16px 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          transition: all 0.3s;
          min-width: 220px;
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
        }

        .enhanced-speak-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        .enhanced-speak-btn.playing {
          background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
          box-shadow: 0 4px 16px rgba(220, 53, 69, 0.3);
        }

        .enhanced-speak-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .enhanced-controls {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .voice-selector select {
          width: 100%;
          padding: 8px;
          border: 2px solid #ddd;
          border-radius: 6px;
          transition: border-color 0.3s;
        }

        .voice-selector select:focus {
          border-color: #667eea;
          outline: none;
        }

        .speech-settings {
          margin-top: 15px;
        }

        .setting-group {
          margin-bottom: 15px;
        }

        .setting-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #495057;
          font-size: 14px;
        }

        .setting-group input[type="range"] {
          width: 100%;
          margin: 5px 0;
        }

        .animation-toggles {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 15px;
        }

        .toggle-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 500;
        }

        .emotion-override {
          margin-top: 15px;
        }

        .emotion-override label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #495057;
        }

        .emotion-override select {
          width: 100%;
          padding: 8px;
          border: 2px solid #ddd;
          border-radius: 6px;
          transition: border-color 0.3s;
        }

        .emotion-override select:focus {
          border-color: #667eea;
          outline: none;
        }

        .emotional-state-display {
          background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
          border-radius: 12px;
          border: 2px solid #ffb74d;
        }

        .current-emotion {
          margin-bottom: 15px;
        }

        .emotion-indicator {
          display: block;
          padding: 8px 12px;
          border-radius: 8px;
          font-weight: 600;
          text-align: center;
          margin-bottom: 10px;
          background: rgba(255, 255, 255, 0.8);
        }

        .intensity-bar {
          position: relative;
          height: 20px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 10px;
          overflow: hidden;
        }

        .intensity-fill {
          height: 100%;
          background: linear-gradient(90deg, #4caf50 0%, #ff9800 50%, #f44336 100%);
          transition: width 0.3s ease;
        }

        .intensity-label {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 11px;
          font-weight: 600;
          color: #333;
        }

        .emotion-scores {
          margin-top: 15px;
        }

        .emotion-scores h5 {
          margin: 0 0 10px 0;
          color: #e65100;
        }

        .emotion-score {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 12px;
        }

        .emotion-name {
          min-width: 60px;
          font-weight: 500;
          text-transform: capitalize;
        }

        .emotion-value {
          min-width: 20px;
          font-weight: 600;
        }

        .score-bar {
          flex: 1;
          height: 6px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 3px;
          overflow: hidden;
        }

        .score-fill {
          height: 100%;
          background: #ff9800;
          transition: width 0.3s ease;
        }

        .visual-feedback {
          background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c8 100%);
          border-radius: 12px;
          border: 2px solid #81c784;
        }

        .viseme-display {
          margin-top: 15px;
        }

        .viseme-status {
          padding: 8px 12px;
          border-radius: 8px;
          font-weight: 600;
          text-align: center;
          margin-bottom: 15px;
          background: rgba(255, 255, 255, 0.8);
        }

        .viseme-status.active {
          background: #c8e6c8;
          color: #2e7d32;
        }

        .viseme-status.inactive {
          background: #f5f5f5;
          color: #757575;
        }

        .viseme-data h5 {
          margin: 0 0 10px 0;
          color: #2e7d32;
        }

        .viseme-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          font-size: 11px;
        }

        .viseme-id {
          min-width: 70px;
          font-weight: 500;
        }

        .viseme-value {
          min-width: 40px;
          font-weight: 600;
        }

        .viseme-bar {
          flex: 1;
          height: 6px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 3px;
          overflow: hidden;
        }

        .viseme-fill {
          height: 100%;
          background: #4caf50;
          transition: width 0.2s ease;
        }

        .performance-metrics {
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          border-radius: 12px;
          border: 2px solid #64b5f6;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 15px;
        }

        .metric-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 8px;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 6px;
          font-size: 11px;
        }

        .metric-label {
          font-weight: 500;
          color: #1565c0;
        }

        .metric-value {
          font-weight: 600;
        }

        .metric-value.good {
          color: #2e7d32;
        }

        .metric-value.warning {
          color: #f57c00;
        }

        @media (max-width: 1600px) {
          .enhanced-layout {
            grid-template-columns: 1fr;
            grid-template-rows: 60vh auto;
          }
          
          .controls-container {
            max-height: 40vh;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            display: grid;
            gap: 15px;
          }
        }

        @media (max-width: 768px) {
          .enhanced-tts-lipsync-page {
            padding: 15px;
          }
          
          .page-header h1 {
            font-size: 2rem;
          }
          
          .controls-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}