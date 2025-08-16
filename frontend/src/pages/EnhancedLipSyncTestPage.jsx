/**
 * Enhanced Lip Sync Test Page
 * Tests the Conv-AI based lip sync system with SavannahAvatar
 * Demonstrates the integration of proven viseme-to-morph-target mapping
 */

import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import {
  VisemeToActorCore,
  applyBlendShape,
  debugMorphMapping,
  getMorphTargetMapping,
  getAvailableMorphTargets
} from '../utils/enhancedActorCoreLipSync';

// Test viseme data for different phonemes
const TEST_VISEMES = {
  silence: { 0: 1.0 },
  hello_h: { 11: 0.8 }, // E sound
  hello_e: { 11: 1.0 }, // E sound
  hello_l: { 4: 0.9 },  // DD sound (alveolar)
  hello_o: { 13: 0.8 }, // O sound
  world_w: { 14: 0.7 }, // U sound (rounded)
  world_o: { 13: 0.9 }, // O sound
  world_r: { 9: 0.8 },  // RR sound
  world_l: { 4: 0.7 },  // DD sound
  world_d: { 4: 1.0 },  // DD sound
  pp_sound: { 1: 1.0 }, // PP bilabial
  ff_sound: { 2: 1.0 }, // FF labiodental
  th_sound: { 3: 1.0 }, // TH dental
  ss_sound: { 7: 1.0 }, // SS alveolar fricative
  aa_sound: { 10: 1.0 }, // AA open vowel
};

function SavannahAvatar({ currentViseme, animationSpeed = 0.1 }) {
  const { scene } = useGLTF('/assets/SavannahAvatar.glb');
  const avatarRef = useRef();
  const blendShapeRef = useRef([]);
  
  // Apply viseme to morph targets
  useEffect(() => {
    if (currentViseme && avatarRef.current) {
      const blendShape = VisemeToActorCore(currentViseme, blendShapeRef);
      applyBlendShape(blendShape, animationSpeed, avatarRef.current);
    }
  }, [currentViseme, animationSpeed]);

  // Animation loop for smooth transitions
  useFrame(() => {
    if (blendShapeRef.current.length > 0 && avatarRef.current) {
      const latestBlendShape = blendShapeRef.current[blendShapeRef.current.length - 1];
      applyBlendShape(latestBlendShape, animationSpeed, avatarRef.current);
      
      // Keep only recent blend shapes to prevent memory buildup
      if (blendShapeRef.current.length > 10) {
        blendShapeRef.current = blendShapeRef.current.slice(-5);
      }
    }
  });

  return (
    <primitive 
      ref={avatarRef}
      object={scene} 
      scale={[1, 1, 1]} 
      position={[0, -1, 0]}
    />
  );
}

function MorphTargetInspector({ scene }) {
  const [morphTargets, setMorphTargets] = useState([]);
  const [influences, setInfluences] = useState({});

  useEffect(() => {
    if (scene) {
      const targets = [];
      const currentInfluences = {};
      
      scene.traverse((child) => {
        if (child.isSkinnedMesh && child.morphTargetDictionary) {
          Object.entries(child.morphTargetDictionary).forEach(([name, index]) => {
            if (!targets.includes(name)) {
              targets.push(name);
              currentInfluences[name] = child.morphTargetInfluences[index] || 0;
            }
          });
        }
      });
      
      setMorphTargets(targets.sort());
      setInfluences(currentInfluences);
    }
  }, [scene]);

  // Update influences periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (scene) {
        const currentInfluences = {};
        scene.traverse((child) => {
          if (child.isSkinnedMesh && child.morphTargetDictionary) {
            Object.entries(child.morphTargetDictionary).forEach(([name, index]) => {
              currentInfluences[name] = child.morphTargetInfluences[index] || 0;
            });
          }
        });
        setInfluences(currentInfluences);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [scene]);

  return (
    <div className="morph-inspector">
      <h3>Active Morph Targets</h3>
      <div className="morph-list">
        {morphTargets
          .filter(name => influences[name] > 0.01)
          .map(name => (
            <div key={name} className="morph-item">
              <span className="morph-name">{name}</span>
              <span className="morph-value">{influences[name]?.toFixed(3)}</span>
              <div 
                className="morph-bar"
                style={{
                  width: `${(influences[name] || 0) * 100}%`,
                  height: '4px',
                  backgroundColor: '#4CAF50',
                  marginTop: '2px'
                }}
              />
            </div>
          ))}
      </div>
    </div>
  );
}

export default function EnhancedLipSyncTestPage() {
  const [currentViseme, setCurrentViseme] = useState(TEST_VISEMES.silence);
  const [animationSpeed, setAnimationSpeed] = useState(0.1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPhoneme, setCurrentPhoneme] = useState('silence');
  const [sceneRef, setSceneRef] = useState(null);
  const [mappingInfo, setMappingInfo] = useState(null);

  // Get mapping information
  useEffect(() => {
    const mapping = getMorphTargetMapping();
    const available = getAvailableMorphTargets();
    setMappingInfo({
      mapping,
      availableCount: available.length,
      mappedCount: Object.keys(mapping).filter(key => mapping[key]).length
    });
    
    // Debug log the mapping
    debugMorphMapping();
  }, []);

  // Auto-play sequence
  useEffect(() => {
    if (isPlaying) {
      const phonemes = Object.keys(TEST_VISEMES);
      let currentIndex = 0;
      
      const interval = setInterval(() => {
        const phoneme = phonemes[currentIndex];
        setCurrentViseme(TEST_VISEMES[phoneme]);
        setCurrentPhoneme(phoneme);
        
        currentIndex = (currentIndex + 1) % phonemes.length;
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  const handlePhonemeChange = (phoneme) => {
    setCurrentViseme(TEST_VISEMES[phoneme]);
    setCurrentPhoneme(phoneme);
    setIsPlaying(false);
  };

  return (
    <div className="enhanced-lipsync-test-page">
      <div className="page-header">
        <h1>Enhanced Lip Sync Test</h1>
        <p>Testing Conv-AI based lip sync system with SavannahAvatar</p>
      </div>

      <div className="test-layout">
        <div className="avatar-container">
          <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <SavannahAvatar 
              currentViseme={currentViseme}
              animationSpeed={animationSpeed}
            />
            <OrbitControls 
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
            />
          </Canvas>
        </div>

        <div className="controls-container">
          <div className="control-section">
            <h3>Phoneme Controls</h3>
            <div className="phoneme-buttons">
              {Object.keys(TEST_VISEMES).map(phoneme => (
                <button
                  key={phoneme}
                  className={`phoneme-btn ${currentPhoneme === phoneme ? 'active' : ''}`}
                  onClick={() => handlePhonemeChange(phoneme)}
                >
                  {phoneme.replace('_', ' ')}
                </button>
              ))}
            </div>
            
            <div className="playback-controls">
              <button
                className={`play-btn ${isPlaying ? 'playing' : ''}`}
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? 'Stop Auto-Play' : 'Start Auto-Play'}
              </button>
            </div>
          </div>

          <div className="control-section">
            <h3>Animation Settings</h3>
            <div className="slider-control">
              <label>Animation Speed: {animationSpeed.toFixed(2)}</label>
              <input
                type="range"
                min="0.01"
                max="1.0"
                step="0.01"
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
              />
            </div>
          </div>

          <div className="control-section">
            <h3>Current Viseme Data</h3>
            <pre className="viseme-data">
              {JSON.stringify(currentViseme, null, 2)}
            </pre>
          </div>

          {mappingInfo && (
            <div className="control-section">
              <h3>Mapping Information</h3>
              <div className="mapping-stats">
                <p>Available Morph Targets: {mappingInfo.availableCount}</p>
                <p>Mapped Targets: {mappingInfo.mappedCount}</p>
                <p>Mapping Coverage: {((mappingInfo.mappedCount / mappingInfo.availableCount) * 100).toFixed(1)}%</p>
              </div>
            </div>
          )}

          {sceneRef && (
            <MorphTargetInspector scene={sceneRef} />
          )}
        </div>
      </div>

      <style jsx>{`
        .enhanced-lipsync-test-page {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .page-header h1 {
          color: #2c3e50;
          margin-bottom: 10px;
        }

        .test-layout {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 20px;
          height: 80vh;
        }

        .avatar-container {
          background: #f8f9fa;
          border-radius: 8px;
          overflow: hidden;
        }

        .controls-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          overflow-y: auto;
        }

        .control-section {
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .control-section h3 {
          margin: 0 0 15px 0;
          color: #2c3e50;
        }

        .phoneme-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 8px;
          margin-bottom: 15px;
        }

        .phoneme-btn {
          padding: 8px 12px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 12px;
        }

        .phoneme-btn:hover {
          background: #f0f0f0;
        }

        .phoneme-btn.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .playback-controls {
          text-align: center;
        }

        .play-btn {
          padding: 10px 20px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .play-btn.playing {
          background: #dc3545;
        }

        .slider-control {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .slider-control label {
          font-weight: 500;
          color: #495057;
        }

        .slider-control input[type="range"] {
          width: 100%;
        }

        .viseme-data {
          background: #f8f9fa;
          padding: 10px;
          border-radius: 4px;
          font-size: 12px;
          max-height: 150px;
          overflow-y: auto;
        }

        .mapping-stats p {
          margin: 5px 0;
          font-size: 14px;
        }

        .morph-inspector {
          max-height: 300px;
          overflow-y: auto;
        }

        .morph-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .morph-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .morph-name {
          font-size: 12px;
          font-weight: 500;
          color: #495057;
        }

        .morph-value {
          font-size: 11px;
          color: #6c757d;
        }

        @media (max-width: 1200px) {
          .test-layout {
            grid-template-columns: 1fr;
            grid-template-rows: 60vh auto;
          }
          
          .controls-container {
            max-height: 40vh;
          }
        }
      `}</style>
    </div>
  );
}
