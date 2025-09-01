import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Simple GLB Avatar Component - No complex error handling
function SimpleGLBAvatar() {
  const gltf = useGLTF('/assets/SavannahAvatar.glb');
  
  useEffect(() => {
    if (gltf && gltf.scene) {
      console.log('✅ GLB Avatar loaded successfully');
      
      // Simple scaling
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2 / maxDim;
      
      gltf.scene.scale.setScalar(scale);
      gltf.scene.position.set(0, -1, 0);
      
      // Ensure visibility
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          child.frustumCulled = false;
          if (child.material) {
            child.material.transparent = false;
            child.material.opacity = 1;
            child.material.side = THREE.DoubleSide;
          }
        }
      });
    }
  }, [gltf]);
  
  return gltf ? <primitive object={gltf.scene} /> : null;
}

// Preload
useGLTF.preload('/assets/SavannahAvatar.glb');

// Main component
export default function GLBAvatarValidationTestSimple() {
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // Error boundary
  useEffect(() => {
    const handleError = (event) => {
      console.error('Canvas Error:', event);
      setError(event.message || 'Canvas error occurred');
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', background: '#1a1a1a' }}>
      <div style={{ 
        position: 'absolute', 
        top: 20, 
        left: 20, 
        zIndex: 100, 
        color: 'white',
        background: 'rgba(0,0,0,0.7)',
        padding: '20px',
        borderRadius: '8px'
      }}>
        <h1>Simple GLB Avatar Test</h1>
        <p>This is a minimal test without complex error handling</p>
        <p>Status: {error ? `Error: ${error}` : isReady ? 'Ready' : 'Loading...'}</p>
        <p>Check console for errors (F12)</p>
      </div>
      
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        onCreated={() => {
          console.log('Canvas created');
          setIsReady(true);
        }}
        onError={(err) => {
          console.error('Canvas onError:', err);
          setError(err.message);
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        <Suspense fallback={
          <mesh>
            <boxGeometry args={[1, 2, 0.5]} />
            <meshBasicMaterial color="orange" wireframe />
          </mesh>
        }>
          <SimpleGLBAvatar />
        </Suspense>
        
        <OrbitControls />
        
        {/* Add a ground plane so we can see something */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
          <planeGeometry args={[10, 10]} />
          <meshBasicMaterial color="#333" />
        </mesh>
      </Canvas>
    </div>
  );
}