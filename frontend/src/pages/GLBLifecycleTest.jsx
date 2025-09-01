import React, { useEffect, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';

// Track component lifecycle
function LifecycleGLB() {
  const mountTime = useRef(Date.now());
  const [loadState, setLoadState] = useState('initializing');
  
  console.log(`[${Date.now() - mountTime.current}ms] LifecycleGLB render - state: ${loadState}`);
  
  useEffect(() => {
    console.log(`[${Date.now() - mountTime.current}ms] LifecycleGLB mounted`);
    setLoadState('mounted');
    
    return () => {
      console.log(`[${Date.now() - mountTime.current}ms] LifecycleGLB UNMOUNTING! This is the problem!`);
    };
  }, []);
  
  try {
    const gltf = useGLTF('/assets/SavannahAvatar.glb');
    
    useEffect(() => {
      if (gltf) {
        console.log(`[${Date.now() - mountTime.current}ms] GLB loaded successfully`, gltf);
        setLoadState('loaded');
        
        // Set a simple scale
        if (gltf.scene) {
          gltf.scene.scale.set(0.01, 0.01, 0.01);
          gltf.scene.position.set(0, -1, 0);
        }
      }
    }, [gltf]);
    
    if (!gltf || !gltf.scene) {
      return (
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="blue" />
        </mesh>
      );
    }
    
    return <primitive object={gltf.scene} />;
  } catch (error) {
    console.error(`[${Date.now() - mountTime.current}ms] Error in LifecycleGLB:`, error);
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

export default function GLBLifecycleTest() {
  const [canvasKey, setCanvasKey] = useState(0);
  const [showCanvas, setShowCanvas] = useState(true);
  
  useEffect(() => {
    console.log('=== GLBLifecycleTest Page Mounted ===');
    return () => {
      console.log('=== GLBLifecycleTest Page Unmounting ===');
    };
  }, []);
  
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#222' }}>
      <div style={{ 
        position: 'absolute', 
        top: 10, 
        left: 10, 
        zIndex: 100, 
        color: 'white',
        background: 'rgba(0,0,0,0.9)',
        padding: '15px',
        borderRadius: '5px'
      }}>
        <h2>GLB Lifecycle Test</h2>
        <p>Check console for mount/unmount logs</p>
        <p>Canvas visible: {showCanvas ? 'YES' : 'NO'}</p>
        <button 
          onClick={() => setCanvasKey(k => k + 1)}
          style={{ 
            marginRight: '10px',
            padding: '5px 10px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Remount Canvas (key: {canvasKey})
        </button>
        <button 
          onClick={() => setShowCanvas(s => !s)}
          style={{ 
            padding: '5px 10px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Toggle Canvas
        </button>
      </div>
      
      {showCanvas && (
        <Canvas 
          key={canvasKey}
          camera={{ position: [0, 0, 3], fov: 50 }}
          onCreated={() => console.log('Canvas onCreated fired')}
          onError={(e) => console.error('Canvas onError:', e)}
        >
          <ambientLight intensity={1} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          
          <React.Suspense fallback={
            <mesh>
              <sphereGeometry args={[0.5, 32, 32]} />
              <meshBasicMaterial color="yellow" />
            </mesh>
          }>
            <LifecycleGLB />
          </React.Suspense>
          
          <OrbitControls />
          <gridHelper args={[10, 10]} />
        </Canvas>
      )}
    </div>
  );
}