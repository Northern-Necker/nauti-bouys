import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Preload GLB model
if (typeof window !== 'undefined') {
  useGLTF.preload('/assets/SavannahAvatar.glb');
}

// Safe Viseme Testing Component
function SafeAvatarWithVisemes({ scale }) {
  const group = useRef();
  const [validMorphs, setValidMorphs] = useState([]);
  const [currentMorphIndex, setCurrentMorphIndex] = useState(-1);
  const [isValidating, setIsValidating] = useState(true);
  
  const { scene } = useGLTF('/assets/SavannahAvatar.glb');
  
  useEffect(() => {
    if (scene) {
      console.log('🔍 Validating morph targets safely...');
      
      // Apply scaling and centering
      scene.scale.setScalar(scale);
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      scene.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
      
      // Find and validate morph targets
      const morphs = [];
      
      scene.traverse((child) => {
        if (child.isMesh) {
          child.frustumCulled = false;
          if (child.material) {
            child.material.side = THREE.DoubleSide;
          }
          
          if (child.morphTargetDictionary && child.morphTargetInfluences) {
            Object.entries(child.morphTargetDictionary).forEach(([name, index]) => {
              // Only include facial morphs with safe names
              if (isFacialMorph(name) && index < child.morphTargetInfluences.length) {
                // Test morph safety
                const originalValue = child.morphTargetInfluences[index] || 0;
                
                try {
                  // Test with very small value
                  child.morphTargetInfluences[index] = 0.1;
                  child.geometry.computeBoundingBox();
                  
                  // Check if geometry is still valid
                  const testBox = child.geometry.boundingBox;
                  const isValid = testBox && 
                    isFinite(testBox.min.x) && isFinite(testBox.max.x) &&
                    !isNaN(testBox.min.x) && !isNaN(testBox.max.x);
                  
                  if (isValid) {
                    morphs.push({
                      name,
                      index,
                      mesh: child,
                      safe: true
                    });
                    console.log(`✅ Valid morph: ${name}`);
                  } else {
                    console.log(`❌ Invalid morph: ${name}`);
                  }
                  
                  // Reset to original
                  child.morphTargetInfluences[index] = originalValue;
                } catch (error) {
                  console.log(`❌ Error testing morph ${name}:`, error);
                  child.morphTargetInfluences[index] = originalValue;
                }
              }
            });
          }
        }
      });
      
      setValidMorphs(morphs);
      setIsValidating(false);
      console.log(`📊 Found ${morphs.length} safe facial morphs`);
      
      // Force parent update by triggering a re-render
      setTimeout(() => {
        console.log('🔄 Triggering parent morph update...');
      }, 100);
    }
  }, [scene, scale]);
  
  // Helper function to identify facial morphs
  const isFacialMorph = (name) => {
    const nameLower = name.toLowerCase();
    return nameLower.includes('mouth') ||
           nameLower.includes('lip') ||
           nameLower.includes('jaw') ||
           nameLower.includes('smile') ||
           nameLower.includes('eye') ||
           nameLower.includes('brow') ||
           nameLower.includes('cheek') ||
           /^[aeiou]$/i.test(name);
  };
  
  // Test individual morph
  const testMorph = (morphIndex, intensity = 0.3) => {
    if (morphIndex >= 0 && morphIndex < validMorphs.length) {
      // Reset all morphs first
      validMorphs.forEach(morph => {
        if (morph.mesh.morphTargetInfluences) {
          morph.mesh.morphTargetInfluences[morph.index] = 0;
        }
      });
      
      // Apply specific morph
      const morph = validMorphs[morphIndex];
      if (morph.mesh.morphTargetInfluences) {
        morph.mesh.morphTargetInfluences[morph.index] = Math.max(0, Math.min(intensity, 0.5));
      }
    }
  };
  
  // Reset all morphs
  const resetAllMorphs = () => {
    validMorphs.forEach(morph => {
      if (morph.mesh.morphTargetInfluences) {
        morph.mesh.morphTargetInfluences[morph.index] = 0;
      }
    });
    setCurrentMorphIndex(-1);
  };
  
  // Expose functions and data to parent
  React.useImperativeHandle(group, () => ({
    testMorph,
    resetAllMorphs,
    get validMorphs() {
      return validMorphs;
    }
  }), [validMorphs]);
  
  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

export default function SafeVisemeTest() {
  const [scale, setScale] = useState(0.2);
  const [selectedMorph, setSelectedMorph] = useState(-1);
  const avatarRef = useRef();
  const [validMorphs, setValidMorphs] = useState([]);
  const [isValidating, setIsValidating] = useState(true);
  
  const testMorph = (index) => {
    if (avatarRef.current) {
      avatarRef.current.resetAllMorphs();
      avatarRef.current.testMorph(index, 0.4);
      setSelectedMorph(index);
      
      // Auto reset after 2 seconds
      setTimeout(() => {
        if (avatarRef.current) {
          avatarRef.current.resetAllMorphs();
          setSelectedMorph(-1);
        }
      }, 2000);
    }
  };
  
  const resetAll = () => {
    if (avatarRef.current) {
      avatarRef.current.resetAllMorphs();
      setSelectedMorph(-1);
    }
  };
  
  // Update valid morphs when avatar loads
  useEffect(() => {
    console.log('🔍 Starting morph detection interval...');
    let attempts = 0;
    const maxAttempts = 100; // 10 seconds max
    
    const interval = setInterval(() => {
      attempts++;
      console.log(`Attempt ${attempts}: Checking for morphs...`);
      
      if (avatarRef.current && avatarRef.current.validMorphs) {
        console.log(`✅ Found ${avatarRef.current.validMorphs.length} morphs!`);
        setValidMorphs(avatarRef.current.validMorphs);
        setIsValidating(false);
        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        console.warn('❌ Morph detection timed out after 10 seconds');
        clearInterval(interval);
        // Set loading to false to show error message
        setIsValidating(false);
        setValidMorphs([]);
      } else {
        console.log('⏱️ Avatar or morphs not ready yet...');
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a1a' }}>
      {/* Controls */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        width: '300px',
        background: 'rgba(0,0,0,0.9)',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        zIndex: 100,
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#10b981' }}>🎭 Safe Viseme Test</h2>
        
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
        
        {/* Reset Button */}
        <div style={{ marginBottom: '15px' }}>
          <button
            onClick={resetAll}
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
        
        {/* Debug Info */}
        <div style={{ marginBottom: '15px', fontSize: '12px', color: '#6b7280' }}>
          <div>Avatar ref: {avatarRef.current ? '✅' : '❌'}</div>
          <div>Avatar morphs: {avatarRef.current?.validMorphs?.length || 0}</div>
          <div>State morphs: {validMorphs.length}</div>
        </div>
        
        {/* Morph Testing Buttons */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>Test Individual Morphs:</div>
          {validMorphs.length === 0 ? (
            <div style={{ color: '#fbbf24', fontSize: '14px' }}>
              {isValidating ? 'Loading morphs...' : 'No morphs found - check GLB file'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
              {validMorphs.map((morph, index) => (
                <button
                  key={index}
                  onClick={() => testMorph(index)}
                  style={{
                    padding: '8px',
                    background: selectedMorph === index ? '#10b981' : '#374151',
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
        
        {/* Validation Info */}
        <div style={{ marginBottom: '15px', fontSize: '11px', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '4px' }}>
          <div style={{ color: '#10b981' }}>✅ Valid morphs: {validMorphs.length}</div>
          <div style={{ color: '#fbbf24' }}>🎭 Testing individual morphs safely</div>
        </div>
        
        {/* Info */}
        <div style={{ fontSize: '11px', color: '#9ca3af', borderTop: '1px solid #374151', paddingTop: '10px' }}>
          <div>Valid morphs: {validMorphs.length}</div>
          <div>Selected: {selectedMorph >= 0 ? validMorphs[selectedMorph]?.name : 'None'}</div>
          <div style={{ marginTop: '8px' }}>💡 Each morph auto-resets after 2 seconds</div>
        </div>
      </div>
      
      {/* 3D Viewport */}
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
          <SafeAvatarWithVisemes ref={avatarRef} scale={scale} />
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