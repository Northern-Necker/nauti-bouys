import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';

function SimpleGLB() {
  console.log('SimpleGLB render called');
  
  useEffect(() => {
    console.log('SimpleGLB MOUNTED');
    return () => {
      console.log('SimpleGLB UNMOUNTING - This explains the white screen!');
    };
  }, []);
  
  const gltf = useGLTF('/assets/SavannahAvatar.glb');
  
  useEffect(() => {
    if (gltf && gltf.scene) {
      console.log('GLB loaded, setting scale');
      gltf.scene.scale.set(0.01, 0.01, 0.01);
      gltf.scene.position.set(0, -1, 0);
    }
  }, [gltf]);
  
  if (!gltf || !gltf.scene) {
    console.log('GLB not ready, showing fallback');
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="blue" />
      </mesh>
    );
  }
  
  console.log('Rendering GLB scene');
  return <primitive object={gltf.scene} />;
}

// Preload
if (typeof window !== 'undefined') {
  useGLTF.preload('/assets/SavannahAvatar.glb');
}

export default function GLBSimpleLifecycle() {
  const [key, setKey] = useState(0);
  
  console.log('Page render, key:', key);
  
  useEffect(() => {
    console.log('=== PAGE MOUNTED ===');
    return () => console.log('=== PAGE UNMOUNTING ===');
  }, []);
  
  return (
    <div style={{ width: '100vw', height: '100vh', background: 'black' }}>
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        left: '10px', 
        zIndex: 100, 
        color: 'white',
        background: 'rgba(0,0,0,0.8)',
        padding: '10px'
      }}>
        <h3>Simple Lifecycle Test</h3>
        <p>Check console for mount/unmount messages</p>
        <button 
          onClick={() => setKey(k => k + 1)}
          style={{ padding: '5px 10px' }}
        >
          Remount (key: {key})
        </button>
      </div>
      
      <Canvas key={key} camera={{ position: [0, 0, 3], fov: 50 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        <React.Suspense fallback={
          <mesh>
            <sphereGeometry args={[0.5]} />
            <meshBasicMaterial color="yellow" />
          </mesh>
        }>
          <SimpleGLB />
        </React.Suspense>
        
        <OrbitControls />
        <gridHelper args={[10, 10]} />
      </Canvas>
    </div>
  );
}