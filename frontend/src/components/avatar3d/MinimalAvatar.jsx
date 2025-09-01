import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';

// Very simple GLB loader component
function SimpleGLB() {
  let gltf;
  
  try {
    gltf = useGLTF('/assets/SavannahAvatar.glb');
  } catch (error) {
    console.error('Failed to load GLB:', error);
    return (
      <mesh>
        <boxGeometry args={[1, 2, 0.5]} />
        <meshStandardMaterial color="red" />
      </mesh>
    );
  }
  
  if (!gltf || !gltf.scene) {
    return (
      <mesh>
        <boxGeometry args={[1, 2, 0.5]} />
        <meshStandardMaterial color="orange" />
      </mesh>
    );
  }
  
  // Much smaller scaling to fit in view
  gltf.scene.scale.setScalar(0.15);
  console.log('MinimalAvatar: Applied 0.15x scale');
  
  return <primitive object={gltf.scene} />;
}

// Minimal Avatar Component
export default function MinimalAvatar() {
  return (
    <div style={{ width: '100%', height: '500px' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        <Suspense fallback={
          <mesh>
            <sphereGeometry args={[0.5]} />
            <meshStandardMaterial color="yellow" wireframe />
          </mesh>
        }>
          <SimpleGLB />
        </Suspense>
        
        <OrbitControls />
      </Canvas>
    </div>
  );
}