import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Minimal test component
function MinimalAvatar({ scale = 0.2 }) {
  try {
    const { scene } = useGLTF('/assets/SavannahAvatar.glb');
    
    React.useEffect(() => {
      if (scene) {
        scene.scale.setScalar(scale);
        const box = new THREE.Box3().setFromObject(scene);
        const center = box.getCenter(new THREE.Vector3());
        scene.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
        
        scene.traverse((child) => {
          if (child.isMesh) {
            child.frustumCulled = false;
            if (child.material) {
              child.material.side = THREE.DoubleSide;
            }
          }
        });
      }
    }, [scene, scale]);
    
    return <primitive object={scene} />;
  } catch (error) {
    console.error('MinimalAvatar error:', error);
    return (
      <mesh>
        <boxGeometry args={[1, 2, 0.5]} />
        <meshStandardMaterial color="red" />
      </mesh>
    );
  }
}

export default function MinimalVisemeTest() {
  const [scale, setScale] = useState(0.2);
  
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#222' }}>
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        padding: '20px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        zIndex: 100,
        borderRadius: '8px'
      }}>
        <h2>🔧 Minimal Test</h2>
        <div>
          <label>Scale: {scale.toFixed(2)}</label><br/>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.1"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            style={{ width: '200px' }}
          />
        </div>
        <div style={{ marginTop: '10px', fontSize: '12px' }}>
          This should show the avatar if GLB loading works
        </div>
      </div>
      
      <Canvas camera={{ position: [0, 1.5, 4], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        
        <gridHelper args={[10, 10]} />
        
        <React.Suspense fallback={
          <mesh>
            <sphereGeometry args={[0.5]} />
            <meshStandardMaterial color="yellow" />
          </mesh>
        }>
          <MinimalAvatar scale={scale} />
        </React.Suspense>
        
        <OrbitControls target={[0, 1, 0]} />
      </Canvas>
    </div>
  );
}