import React, { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Preload GLB model
if (typeof window !== 'undefined') {
  useGLTF.preload('/assets/SavannahAvatar.glb');
}

function AvatarWithMorphs({ scale }) {
  const group = useRef();
  const [morphTargets, setMorphTargets] = useState([]);
  const [currentMorph, setCurrentMorph] = useState(null);
  
  const { scene } = useGLTF('/assets/SavannahAvatar.glb');
  
  useEffect(() => {
    if (scene) {
      console.log('🎭 Loading avatar and analyzing morphs...');
      
      // Scale and center
      scene.scale.setScalar(scale);
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      scene.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
      
      // Find morphs directly
      const foundMorphs = [];
      
      scene.traverse((child) => {
        if (child.isMesh) {
          child.frustumCulled = false;
          if (child.material) {
            child.material.side = THREE.DoubleSide;
          }
          
          if (child.morphTargetDictionary && child.morphTargetInfluences) {
            console.log(`🔍 Found mesh with morphs: ${child.name}`);
            console.log(`📊 Morph dictionary:`, Object.keys(child.morphTargetDictionary));
            
            Object.entries(child.morphTargetDictionary).forEach(([name, index]) => {
              // Focus on facial morphs
              if (name.toLowerCase().includes('mouth') || 
                  name.toLowerCase().includes('lip') ||
                  name.toLowerCase().includes('jaw') ||
                  name.toLowerCase().includes('eye') ||
                  name.toLowerCase().includes('brow') ||
                  /^[aeiou]$/i.test(name)) {
                foundMorphs.push({
                  name,
                  index,
                  mesh: child,
                  originalValue: child.morphTargetInfluences[index] || 0
                });
              }
            });
          }
        }
      });
      
      console.log(`✅ Found ${foundMorphs.length} facial morphs`);
      setMorphTargets(foundMorphs);
    }
  }, [scene, scale]);
  
  // Test morph function
  const testMorphByIndex = (morphIndex, intensity = 0.4) => {
    if (morphIndex >= 0 && morphIndex < morphTargets.length) {
      // Reset all morphs first
      morphTargets.forEach(morph => {
        morph.mesh.morphTargetInfluences[morph.index] = morph.originalValue;
      });
      
      // Apply the selected morph
      const morph = morphTargets[morphIndex];
      morph.mesh.morphTargetInfluences[morph.index] = Math.min(intensity, 0.5);
      setCurrentMorph(morphIndex);
      
      console.log(`🎭 Testing morph: ${morph.name} at intensity ${intensity}`);
    }
  };
  
  const resetAllMorphs = () => {
    morphTargets.forEach(morph => {
      morph.mesh.morphTargetInfluences[morph.index] = morph.originalValue;
    });
    setCurrentMorph(null);
  };
  
  // Expose functions to parent
  React.useImperativeHandle(group, () => ({
    testMorphByIndex,
    resetAllMorphs,
    morphTargets,
    currentMorph
  }));
  
  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

export default function WorkingSafeVisemeTest() {
  const [scale, setScale] = useState(0.2);
  const [morphTargets, setMorphTargets] = useState([]);
  const [currentMorph, setCurrentMorph] = useState(null);
  const avatarRef = useRef();
  
  // Get morphs from avatar
  useEffect(() => {
    const checkForMorphs = () => {
      if (avatarRef.current) {
        setMorphTargets(avatarRef.current.morphTargets || []);
        setCurrentMorph(avatarRef.current.currentMorph);
      }
    };
    
    // Check periodically for morphs
    const interval = setInterval(checkForMorphs, 200);
    
    return () => clearInterval(interval);
  }, []);
  
  const testMorph = (index) => {
    if (avatarRef.current) {
      avatarRef.current.testMorphByIndex(index, 0.4);
      
      // Auto-reset after 2 seconds
      setTimeout(() => {
        if (avatarRef.current) {
          avatarRef.current.resetAllMorphs();
        }
      }, 2000);
    }
  };
  
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a1a' }}>
      {/* Controls Panel */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        width: '320px',
        background: 'rgba(0,0,0,0.9)',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        zIndex: 100,
        maxHeight: '85vh',
        overflowY: 'auto'
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#10b981' }}>🎭 Working Viseme Test</h2>
        
        {/* Scale Control */}
        <div style={{ marginBottom: '15px' }}>
          <label>Avatar Scale: {scale.toFixed(2)}</label><br />
          <input
            type="range"
            min="0.1"
            max="0.5"
            step="0.05"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        
        {/* Status */}
        <div style={{ marginBottom: '15px', fontSize: '12px', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '4px' }}>
          <div>📊 Found morphs: {morphTargets.length}</div>
          <div>🎯 Current: {currentMorph !== null ? morphTargets[currentMorph]?.name : 'None'}</div>
          <div style={{ color: '#6b7280', marginTop: '5px' }}>
            {morphTargets.length === 0 ? 'Analyzing GLB file...' : 'Ready to test!'}
          </div>
        </div>
        
        {/* Reset Button */}
        <div style={{ marginBottom: '15px' }}>
          <button
            onClick={() => avatarRef.current?.resetAllMorphs()}
            style={{
              width: '100%',
              padding: '10px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            🔄 Reset All Morphs
          </button>
        </div>
        
        {/* Morph Buttons */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
            Facial Morphs ({morphTargets.length}):
          </div>
          
          {morphTargets.length === 0 ? (
            <div style={{ color: '#fbbf24', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
              ⏳ Loading morphs from GLB...
              <br />
              <small style={{ color: '#6b7280', marginTop: '5px', display: 'block' }}>
                Check browser console for details
              </small>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
              {morphTargets.map((morph, index) => (
                <button
                  key={index}
                  onClick={() => testMorph(index)}
                  style={{
                    padding: '8px',
                    background: currentMorph === index ? '#10b981' : '#374151',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    textAlign: 'left'
                  }}
                >
                  {index + 1}. {morph.name}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Info */}
        <div style={{ fontSize: '11px', color: '#9ca3af', borderTop: '1px solid #374151', paddingTop: '10px' }}>
          <div>💡 Click morph buttons to test (auto-resets in 2s)</div>
          <div style={{ marginTop: '4px' }}>🎮 Use trackpad to pan/zoom/rotate camera</div>
        </div>
      </div>
      
      {/* 3D Scene */}
      <Canvas camera={{ position: [0, 1.5, 4], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <directionalLight position={[-5, 5, -5]} intensity={0.4} />
        
        <gridHelper args={[6, 6]} />
        <axesHelper args={[3]} />
        
        <React.Suspense fallback={
          <mesh>
            <sphereGeometry args={[0.5]} />
            <meshStandardMaterial color="yellow" wireframe />
          </mesh>
        }>
          <AvatarWithMorphs ref={avatarRef} scale={scale} />
        </React.Suspense>
        
        <OrbitControls
          target={[0, 1.2, 0]}
          enablePan={true}
          panSpeed={2.5}
          zoomSpeed={1.5}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>
    </div>
  );
}