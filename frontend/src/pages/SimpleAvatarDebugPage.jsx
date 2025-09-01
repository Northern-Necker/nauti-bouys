import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Box } from '@react-three/drei';
import * as THREE from 'three';

// Simple GLB Model Component
function SimpleGLBModel() {
  const [error, setError] = useState(null);
  
  try {
    // Attempt to load the GLB file
    const { scene } = useGLTF('/assets/SavannahAvatar.glb');
    
    useEffect(() => {
      if (scene) {
        console.log('✅ GLB loaded in SimpleAvatarDebugPage');
        
        // Auto-scale the model
        const box = new THREE.Box3().setFromObject(scene);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        const scale = 2 / Math.max(size.x, size.y, size.z);
        scene.scale.setScalar(scale);
        scene.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
        
        // Ensure visibility
        scene.traverse((child) => {
          if (child.isMesh) {
            child.frustumCulled = false;
            if (child.material) {
              child.material.side = THREE.DoubleSide;
            }
          }
        });
      }
    }, [scene]);
    
    return <primitive object={scene} />;
    
  } catch (err) {
    console.error('❌ Error loading GLB:', err);
    setError(err.message);
    
    // Return a fallback box
    return (
      <Box args={[1, 2, 0.5]}>
        <meshStandardMaterial color="red" />
      </Box>
    );
  }
}

// Main Debug Page Component
export default function SimpleAvatarDebugPage() {
  const [mounted, setMounted] = useState(false);
  const [renderError, setRenderError] = useState(null);
  
  useEffect(() => {
    setMounted(true);
    console.log('SimpleAvatarDebugPage mounted');
    
    // Check if Three.js is available
    if (typeof THREE === 'undefined') {
      setRenderError('Three.js not loaded');
    }
  }, []);
  
  if (!mounted) {
    return (
      <div style={{ padding: '20px', color: 'white', background: '#333' }}>
        <h2>Loading Debug Page...</h2>
      </div>
    );
  }
  
  if (renderError) {
    return (
      <div style={{ padding: '20px', color: 'white', background: '#800' }}>
        <h2>Render Error</h2>
        <p>{renderError}</p>
      </div>
    );
  }
  
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#222' }}>
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        left: '10px', 
        zIndex: 100,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '20px',
        borderRadius: '8px'
      }}>
        <h2>Simple Avatar Debug</h2>
        <p>Testing minimal GLB loading</p>
        <p>File: /assets/SavannahAvatar.glb</p>
        <p>Check browser console for errors</p>
      </div>
      
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        onError={(error) => {
          console.error('Canvas error:', error);
          setRenderError(error.message);
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        <Suspense fallback={
          <Box args={[1, 1, 1]}>
            <meshStandardMaterial color="yellow" wireframe />
          </Box>
        }>
          <SimpleGLBModel />
        </Suspense>
        
        <OrbitControls />
        <gridHelper args={[10, 10]} />
        <axesHelper args={[5]} />
      </Canvas>
    </div>
  );
}