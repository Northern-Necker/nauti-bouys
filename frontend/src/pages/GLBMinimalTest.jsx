import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Minimal GLB component - no timeouts, no complex logic
function MinimalGLB() {
  try {
    const { scene } = useGLTF('/assets/SavannahAvatar.glb');
    
    // Just set a fixed scale - no calculations
    if (scene) {
      scene.scale.set(0.01, 0.01, 0.01);
      scene.position.set(0, -1, 0);
    }
    
    return scene ? <primitive object={scene} /> : null;
  } catch (error) {
    console.error('GLB Load Error:', error);
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="red" />
      </mesh>
    );
  }
}

// Preload
if (typeof window !== 'undefined') {
  useGLTF.preload('/assets/SavannahAvatar.glb');
}

export default function GLBMinimalTest() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <div style={{ 
        position: 'absolute', 
        top: 10, 
        left: 10, 
        zIndex: 100, 
        color: 'white',
        background: 'rgba(0,0,0,0.8)',
        padding: '10px'
      }}>
        <h3>Minimal GLB Test - No Complex Logic</h3>
        <p>If avatar disappears, check console</p>
      </div>
      
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        <React.Suspense fallback={
          <mesh>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshBasicMaterial color="yellow" />
          </mesh>
        }>
          <MinimalGLB />
        </React.Suspense>
        
        <OrbitControls />
        
        {/* Grid to show 3D space is working */}
        <gridHelper args={[10, 10]} />
      </Canvas>
    </div>
  );
}