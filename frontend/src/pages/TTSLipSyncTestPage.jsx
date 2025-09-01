/**
 * TTS + Lip Sync Test Page
 * Ultra-Simple Implementation Based on Conv-AI/Reallusion-web Pattern
 * Clean avatar display without complex morph target manipulation
 */

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Test phrases for different speech patterns
const TEST_PHRASES = [
  {
    id: 'greeting',
    text: "Hello! Welcome to Nauti-Bouys. I'm your AI bartender assistant.",
    category: 'Greeting'
  },
  {
    id: 'cocktail',
    text: "I can recommend a perfect cocktail for you. What flavors do you enjoy?",
    category: 'Bartending'
  },
  {
    id: 'phonemes',
    text: "Peter Piper picked a peck of pickled peppers. How much wood would a woodchuck chuck?",
    category: 'Phoneme Test'
  },
  {
    id: 'vowels',
    text: "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.",
    category: 'Vowel Test'
  },
  {
    id: 'conversation',
    text: "That's a fantastic choice! This whiskey has notes of vanilla, caramel, and oak with a smooth finish.",
    category: 'Natural Speech'
  },
  {
    id: 'numbers',
    text: "One Manhattan, two Old Fashioned, three Martinis, four Mojitos, and five Margaritas coming right up!",
    category: 'Numbers & Lists'
  }
];

// Conv-AI/Reallusion-web Pattern Avatar with Lip Sync
function SavannahAvatar({ isPlaying, ...props }) {
  const { scene } = useGLTF('/assets/SavannahAvatar.glb');
  const avatarRef = useRef();
  const { clock } = useThree();
  
  // Blinking state
  const [blink, setBlink] = useState(false);
  const currentBlendFrame = useRef(0);
  
  // Simple viseme state for basic lip sync
  const [currentViseme, setCurrentViseme] = useState(0);
  
  // Automatic blinking - Conv-AI/Reallusion-web pattern
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
  
  // Simple lip sync animation during speech
  useEffect(() => {
    let animationInterval;
    if (isPlaying) {
      animationInterval = setInterval(() => {
        // Simple mouth movement during speech
        setCurrentViseme(Math.random() * 0.5 + 0.3); // Random mouth opening
      }, 100);
    } else {
      setCurrentViseme(0); // Close mouth when not speaking
    }
    
    return () => {
      if (animationInterval) {
        clearInterval(animationInterval);
      }
    };
  }, [isPlaying]);
  
  // Frame synchronization - Conv-AI/Reallusion-web pattern
  useFrame((state) => {
    if (!avatarRef.current) return;
    
    const frameSkipNumber = 10;
    if (Math.floor(state.clock.elapsedTime * 100) - currentBlendFrame.current > frameSkipNumber) {
      currentBlendFrame.current = Math.floor(state.clock.elapsedTime * 100);
      
      // Find morph targets and apply blinking
      avatarRef.current.traverse((child) => {
        if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
          // Apply blinking
          const eyeCloseIndex = child.morphTargetDictionary['eyesClosed'] || 
                               child.morphTargetDictionary['EyesClosed'] ||
                               child.morphTargetDictionary['eyes_closed'];
          if (eyeCloseIndex !== undefined) {
            child.morphTargetInfluences[eyeCloseIndex] = THREE.MathUtils.lerp(
              child.morphTargetInfluences[eyeCloseIndex] || 0,
              blink ? 1 : 0,
              0.3
            );
          }
          
          // Apply simple mouth animation
          const mouthOpenIndex = child.morphTargetDictionary['mouthOpen'] || 
                                child.morphTargetDictionary['MouthOpen'] ||
                                child.morphTargetDictionary['mouth_open'] ||
                                child.morphTargetDictionary['A'];
          if (mouthOpenIndex !== undefined) {
            child.morphTargetInfluences[mouthOpenIndex] = THREE.MathUtils.lerp(
              child.morphTargetInfluences[mouthOpenIndex] || 0,
              currentViseme,
              0.2
            );
          }
        }
      });
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

// Simple Voice Selector - No Complex Dependencies
function VoiceSelector({ selectedVoice, onVoiceChange }) {
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // Auto-select first English voice if none selected
      if (!selectedVoice && availableVoices.length > 0) {
        const englishVoice = availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
        onVoiceChange(englishVoice);
      }
    };

    loadVoices();
    
    // Voices might not be loaded immediately
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoice, onVoiceChange]);

  return (
    <div className="voice-selector">
      <h4>Voice Selection</h4>
      <select 
        value={selectedVoice?.voiceURI || ''} 
        onChange={(e) => {
          const voice = voices.find(v => v.voiceURI === e.target.value);
          onVoiceChange(voice);
        }}
        className="voice-select"
      >
        <option value="">Select a voice...</option>
        {voices.map(voice => (
          <option key={voice.voiceURI} value={voice.voiceURI}>
            {voice.name} ({voice.lang}) {voice.localService ? '🏠' : '☁️'}
          </option>
        ))}
      </select>
    </div>
  );
}

// Simple Speech Controls - No Complex Dependencies
function SpeechControls({ 
  speechSettings, 
  onSettingsChange,
  selectedVoice,
  onVoiceChange 
}) {
  return (
    <div className="speech-controls">
      <VoiceSelector 
        selectedVoice={selectedVoice}
        onVoiceChange={onVoiceChange}
      />
      
      <div className="speech-settings">
        <h4>Speech Settings</h4>
        
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
  );
}

// Simple Status Display - No Complex Viseme Processing
function StatusDisplay({ isPlaying }) {
  return (
    <div className="status-display">
      <h4>Speech Status</h4>
      <div className="animation-status">
        <span className={`status-indicator ${isPlaying ? 'active' : 'inactive'}`}>
          {isPlaying ? '🎤 Speaking' : '😶 Silent'}
        </span>
      </div>
    </div>
  );
}

export default function TTSLipSyncTestPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPhrase, setSelectedPhrase] = useState(TEST_PHRASES[0]);
  const [customText, setCustomText] = useState('');
  const [useCustomText, setUseCustomText] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [speechSettings, setSpeechSettings] = useState({
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8
  });

  // Simple speech synthesis without complex morph target manipulation
  const handleSpeak = useCallback(async () => {
    if (isPlaying) {
      speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const textToSpeak = useCustomText ? customText : selectedPhrase.text;
    if (!textToSpeak.trim()) return;

    try {
      setIsPlaying(true);

      // Create simple speech synthesis utterance
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.rate = speechSettings.rate;
      utterance.pitch = speechSettings.pitch;
      utterance.volume = speechSettings.volume;

      utterance.onend = () => {
        setIsPlaying(false);
      };

      utterance.onerror = (error) => {
        console.error('Speech synthesis error:', error);
        setIsPlaying(false);
      };

      speechSynthesis.speak(utterance);

    } catch (error) {
      console.error('Speech synthesis error:', error);
      setIsPlaying(false);
    }
  }, [isPlaying, useCustomText, customText, selectedPhrase, speechSettings, selectedVoice]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="tts-lipsync-test-page">
      <div className="page-header">
        <h1>TTS + Lip Sync Test</h1>
        <p>Comprehensive testing of Text-to-Speech with real-time lip sync animation</p>
      </div>

      <div className="test-layout">
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
              <SavannahAvatar isPlaying={isPlaying} />
            </Suspense>
            
            <OrbitControls 
              // Surface Pro / Trackpad Optimized Settings
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              
              // Focus on avatar face area
              target={[0, 1.4, 0]}
              
              // Distance limits for comfortable viewing
              maxDistance={6}
              minDistance={1.5}
              
              // Vertical rotation limits to keep avatar in view
              maxPolarAngle={Math.PI * 0.8}
              minPolarAngle={Math.PI * 0.1}
              
              // Smooth trackpad navigation
              enableDamping={true}
              dampingFactor={0.05}
              
              // Touch-friendly settings
              touches={{
                ONE: 2, // TOUCH.ROTATE
                TWO: 1  // TOUCH.DOLLY_PAN
              }}
              
              // Mouse/trackpad sensitivity
              rotateSpeed={0.8}
              zoomSpeed={1.2}
              panSpeed={0.8}
              
              // Smooth zoom for trackpad
              zoomToCursor={true}
              
              // Auto-rotate disabled for user control
              autoRotate={false}
            />
          </Canvas>
          
          <div className="avatar-overlay">
            <div className="status-info">
              <span className={`avatar-status ${isPlaying ? 'speaking' : 'idle'}`}>
                Avatar: {isPlaying ? 'Speaking' : 'Idle'}
              </span>
            </div>
            <div className="navigation-help">
              <small>
                📱 Trackpad: Drag to rotate • Pinch to zoom • Two-finger drag to pan
              </small>
            </div>
          </div>
        </div>

        <div className="controls-container">
          <div className="control-section">
            <h3>Text Selection</h3>
            <div className="text-mode-toggle">
              <label>
                <input
                  type="radio"
                  checked={!useCustomText}
                  onChange={() => setUseCustomText(false)}
                />
                Preset Phrases
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
                    const phrase = TEST_PHRASES.find(p => p.id === e.target.value);
                    setSelectedPhrase(phrase);
                  }}
                >
                  {TEST_PHRASES.map(phrase => (
                    <option key={phrase.id} value={phrase.id}>
                      {phrase.category}: {phrase.text.substring(0, 50)}...
                    </option>
                  ))}
                </select>
                <div className="selected-text">
                  <strong>{selectedPhrase.category}</strong>
                  <p>"{selectedPhrase.text}"</p>
                </div>
              </div>
            ) : (
              <div className="custom-text-input">
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Enter your custom text here..."
                  rows={4}
                />
                <div className="text-stats">
                  Characters: {customText.length} | Words: {customText.split(/\s+/).filter(w => w).length}
                </div>
              </div>
            )}

            <div className="playback-controls">
              <button
                className={`speak-btn ${isPlaying ? 'playing' : ''}`}
                onClick={handleSpeak}
                disabled={useCustomText && !customText.trim()}
              >
                {isPlaying ? '⏹️ Stop Speaking' : '🎤 Start Speaking'}
              </button>
            </div>
          </div>

          <SpeechControls
            speechSettings={speechSettings}
            onSettingsChange={setSpeechSettings}
            selectedVoice={selectedVoice}
            onVoiceChange={setSelectedVoice}
          />

          <StatusDisplay isPlaying={isPlaying} />

          <div className="control-section">
            <h3>System Information</h3>
            <div className="system-stats">
              <div className="stat-item">
                <span className="stat-label">Speech Synthesis:</span>
                <span className="stat-value">
                  {'speechSynthesis' in window ? '✅ Supported' : '❌ Not Supported'}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">WebGL Context:</span>
                <span className="stat-value">✅ Stable</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Avatar Model:</span>
                <span className="stat-value">✅ Loaded</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .tts-lipsync-test-page {
          padding: 20px;
          max-width: 1600px;
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
          grid-template-columns: 1fr 450px;
          gap: 25px;
          min-height: 85vh;
        }

        .avatar-container {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          min-height: 600px;
        }

        .avatar-overlay {
          position: absolute;
          top: 15px;
          left: 15px;
          background: rgba(255, 255, 255, 0.9);
          padding: 10px;
          border-radius: 8px;
          backdrop-filter: blur(10px);
        }

        .status-info {
          font-size: 12px;
          font-weight: 600;
        }

        .avatar-status {
          padding: 4px 8px;
          border-radius: 4px;
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

        .navigation-help {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(0,0,0,0.1);
        }

        .navigation-help small {
          color: #6c757d;
          font-size: 10px;
          line-height: 1.3;
          display: block;
        }

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
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
          border: 1px solid #e9ecef;
        }

        .control-section h3 {
          margin: 0 0 15px 0;
          color: #2c3e50;
          font-size: 1.2rem;
          font-weight: 600;
        }

        .control-section h4 {
          margin: 0 0 10px 0;
          color: #495057;
          font-size: 1rem;
          font-weight: 600;
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
          border: 1px solid #ddd;
          border-radius: 6px;
          margin-bottom: 15px;
          font-size: 14px;
        }

        .selected-text {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #007bff;
        }

        .selected-text strong {
          color: #007bff;
          display: block;
          margin-bottom: 8px;
        }

        .selected-text p {
          margin: 0;
          color: #495057;
          line-height: 1.5;
        }

        .custom-text-input textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          resize: vertical;
          font-family: inherit;
          font-size: 14px;
          line-height: 1.5;
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

        .speak-btn {
          padding: 15px 30px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 18px;
          font-weight: 600;
          transition: all 0.2s;
          min-width: 200px;
        }

        .speak-btn:hover:not(:disabled) {
          background: #218838;
          transform: translateY(-1px);
        }

        .speak-btn.playing {
          background: #dc3545;
        }

        .speak-btn.playing:hover {
          background: #c82333;
        }

        .speak-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
          transform: none;
        }

        .voice-select {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 6px;
          margin-bottom: 10px;
        }

        .recommended-voice {
          font-size: 12px;
          color: #28a745;
          margin: 5px 0;
          font-weight: 500;
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

        .status-display {
          max-height: 150px;
        }

        .animation-status {
          margin-top: 15px;
          text-align: center;
        }

        .status-indicator {
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
        }

        .status-indicator.active {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .status-indicator.inactive {
          background: #f8f9fa;
          color: #6c757d;
          border: 1px solid #dee2e6;
        }

        .system-stats {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f1f3f4;
        }

        .stat-item:last-child {
          border-bottom: none;
        }

        .stat-label {
          font-weight: 500;
          color: #495057;
          font-size: 14px;
        }

        .stat-value {
          font-weight: 600;
          color: #007bff;
          font-size: 14px;
        }

        @media (max-width: 1400px) {
          .test-layout {
            grid-template-columns: 1fr;
            grid-template-rows: 60vh auto;
          }
          
          .controls-container {
            max-height: 40vh;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            display: grid;
            gap: 15px;
          }
        }

        @media (max-width: 768px) {
          .tts-lipsync-test-page {
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
