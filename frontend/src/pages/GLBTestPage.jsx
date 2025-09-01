import React, { useState, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Stats } from '@react-three/drei';
import * as THREE from 'three';

// Preload the GLB model
useGLTF.preload('/assets/SavannahAvatar.glb');

function GLBAvatar() {
  const [glbModel, setGlbModel] = useState(null);
  const [error, setError] = useState(null);
  
  // FIXED: Use useGLTF outside try-catch for proper React hooks
  const gltf = useGLTF('/assets/SavannahAvatar.glb');
  
  useEffect(() => {
    if (gltf && gltf.scene && !error) {
      try {
        console.log('✅ GLB Model Loaded Successfully:', gltf);
        
        // Calculate bounds and auto-scale
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        console.log('Model Size:', size);
        console.log('Model Center:', center);
        
        // Scale to fit in view (target height of 2 units)
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        gltf.scene.scale.setScalar(scale);
        
        // Center the model
        gltf.scene.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
        
        // FIXED: Ensure material visibility with proper handling
        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            child.frustumCulled = false;
            child.visible = true;
            
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  mat.transparent = false;
                  mat.opacity = 1;
                  mat.side = THREE.DoubleSide;
                  mat.needsUpdate = true;
                });
              } else {
                child.material.transparent = false;
                child.material.opacity = 1;
                child.material.side = THREE.DoubleSide;
                child.material.needsUpdate = true;
              }
            }
          }
        });
        
        // FIXED: Set the processed scene to state
        setGlbModel(gltf.scene);
        
      } catch (err) {
        console.error('Error processing GLB:', err);
        setError(err.message);
      }
    }
  }, [gltf, error]);
  
  if (error) {
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="red" />
      </mesh>
    );
  }
  
  if (!glbModel) {
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="orange" />
      </mesh>
    );
  }
  
  return <primitive object={glbModel} />;
}

export default function GLBTestPage() {
  const [lightIntensity, setLightIntensity] = useState(1);
  const [showStats, setShowStats] = useState(true);
  
  // FIXED: Use useMemo to prevent object recreation on every render
  const cameraConfig = useMemo(() => ({
    position: [0, 0, 5],
    fov: 50
  }), []);
  
  const glConfig = useMemo(() => ({
    antialias: true,
    toneMapping: THREE.ACESFilmicToneMapping,
    toneMappingExposure: 1
  }), []);
  
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#222' }}>
      <div style={{ 
        position: 'absolute', 
        top: 10, 
        left: 10, 
        zIndex: 100, 
        background: 'rgba(0,0,0,0.8)', 
        padding: '20px',
        borderRadius: '8px',
        color: 'white'
      }}>
        <h2>GLB Avatar Test Page</h2>
        <p>File: /assets/SavannahAvatar.glb</p>
        <div style={{ marginTop: '10px' }}>
          <label>Light Intensity: {lightIntensity}</label>
          <input 
            type="range" 
            min="0" 
            max="5" 
            step="0.1" 
            value={lightIntensity}
            onChange={(e) => setLightIntensity(parseFloat(e.target.value))}
            style={{ width: '200px', marginLeft: '10px' }}
          />
        </div>
        <div style={{ marginTop: '10px' }}>
          <button 
            onClick={() => {/* Camera position is now fixed */}}
            style={{ marginRight: '10px', padding: '5px 10px', opacity: 0.5 }}
          >
            Reset Camera (Fixed)
          </button>
          <button 
            onClick={() => setShowStats(!showStats)}
            style={{ padding: '5px 10px' }}
          >
            Toggle Stats
          </button>
        </div>
        <div style={{ marginTop: '10px', fontSize: '12px' }}>
          <p>Controls:</p>
          <p>• Left Click + Drag: Rotate</p>
          <p>• Right Click + Drag: Pan</p>
          <p>• Scroll: Zoom</p>
        </div>
      </div>
      
      <Canvas
        camera={cameraConfig}
        gl={glConfig}
      >
        {/* Lighting Setup */}
        <ambientLight intensity={lightIntensity * 0.5} />
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={lightIntensity} 
          castShadow 
        />
        <directionalLight 
          position={[-5, 5, -5]} 
          intensity={lightIntensity * 0.5} 
        />
        <pointLight 
          position={[0, 10, 0]} 
          intensity={lightIntensity * 0.3} 
        />
        
        {/* Environment for reflections */}
        <Environment preset="studio" />
        
        {/* Grid Helper */}
        <gridHelper args={[10, 10]} />
        
        {/* Axes Helper */}
        <axesHelper args={[5]} />
        
        {/* The Avatar */}
        <React.Suspense fallback={
          <mesh>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshBasicMaterial color="yellow" wireframe />
          </mesh>
        }>
          <GLBAvatar />
        </React.Suspense>
        
        {/* Camera Controls */}
        <OrbitControls 
          enableDamping
          dampingFactor={0.05}
          minDistance={1}
          maxDistance={20}
        />
        
        {/* Performance Stats */}
        {showStats && <Stats />}
      </Canvas>
    </div>
  );
}