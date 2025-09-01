import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Simple Avatar Component with scale control
function TestAvatar({ scale }) {
  const group = useRef();
  const [error, setError] = useState(null);
  
  try {
    const { scene } = useGLTF('/assets/SavannahAvatar.glb');
    
    useEffect(() => {
      if (scene) {
        console.log('✅ Avatar loaded for scale test');
        
        // Apply scaling
        scene.scale.setScalar(scale);
        
        // Get dimensions
        const box = new THREE.Box3().setFromObject(scene);
        const size = box.getSize(new THREE.Vector3());
        console.log(`📏 Avatar at scale ${scale}:`, {
          width: size.x.toFixed(2),
          height: size.y.toFixed(2), 
          depth: size.z.toFixed(2)
        });
        
        // Center the model
        const center = box.getCenter(new THREE.Vector3());
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
    }, [scene, scale]);
    
    return (
      <group ref={group}>
        <primitive object={scene} />
      </group>
    );
    
  } catch (err) {
    console.error('Avatar load error:', err);
    return (
      <mesh>
        <boxGeometry args={[1, 2, 0.5]} />
        <meshStandardMaterial color="red" />
      </mesh>
    );
  }
}

export default function WorkingAvatarScaleTest() {
  const [scale, setScale] = useState(0.2);
  const [cameraPos, setCameraPos] = useState([0, 1.5, 4]);
  
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a1a' }}>
      {/* Simple Controls */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        zIndex: 100
      }}>
        <h2>🔧 Avatar Scale Test</h2>
        
        <div style={{ marginBottom: '15px' }}>
          <label>Scale: {scale.toFixed(3)}</label><br />
          <input
            type="range"
            min="0.05"
            max="1.0"
            step="0.05"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            style={{ width: '200px' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <button onClick={() => setScale(0.1)} style={btnStyle}>Very Small</button>
          <button onClick={() => setScale(0.2)} style={btnStyle}>Small</button>
          <button onClick={() => setScale(0.3)} style={btnStyle}>Medium</button>
          <button onClick={() => setScale(0.5)} style={btnStyle}>Large</button>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <button onClick={() => setCameraPos([0, 1.5, 4])} style={btnStyle}>Full Body</button>
          <button onClick={() => setCameraPos([0, 2, 2])} style={btnStyle}>Upper Body</button>
          <button onClick={() => setCameraPos([0, 2.2, 1.5])} style={btnStyle}>Face</button>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontSize: '12px', marginBottom: '8px' }}>Manual Camera Y Position:</div>
          <input
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={cameraPos[1]}
            onChange={(e) => setCameraPos([cameraPos[0], parseFloat(e.target.value), cameraPos[2]])}
            style={{ width: '200px' }}
          />
          <div style={{ fontSize: '11px', color: '#aaa' }}>Y: {cameraPos[1].toFixed(1)} (0=feet, 1.5=torso, 2.5=head)</div>
        </div>
        
        <div style={{ fontSize: '12px', color: '#ccc', lineHeight: '1.4' }}>
          <strong>Surface Pro Controls:</strong><br />
          • One finger: Rotate view<br />
          • Two fingers: Pan & Zoom<br />
          • Right-click + drag: Pan<br />
          • Use Y slider above for vertical focus<br /><br />
          Scale: {scale} | Camera Y: {cameraPos[1].toFixed(1)}<br />
          Position: [{cameraPos.map(v => v.toFixed(1)).join(', ')}]
        </div>
      </div>
      
      {/* 3D Viewport */}
      <Canvas
        camera={{ position: cameraPos, fov: 50 }}
        key={cameraPos.join(',')}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <directionalLight position={[-5, 5, -5]} intensity={0.3} />
        
        {/* Simple grid */}
        <gridHelper args={[10, 10]} />
        <axesHelper args={[2]} />
        
        {/* Avatar */}
        <React.Suspense fallback={
          <mesh>
            <sphereGeometry args={[0.5]} />
            <meshStandardMaterial color="yellow" wireframe />
          </mesh>
        }>
          <TestAvatar scale={scale} />
        </React.Suspense>
        
        <OrbitControls 
          target={[0, 1.5, 0]}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          panSpeed={2.0}
          zoomSpeed={1.2}
          rotateSpeed={1.0}
          enableDamping={true}
          dampingFactor={0.05}
          screenSpacePanning={true}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN
          }}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN
          }}
          minDistance={0.5}
          maxDistance={20}
        />
      </Canvas>
    </div>
  );
}

const btnStyle = {
  padding: '5px 10px',
  margin: '2px',
  background: '#333',
  color: 'white',
  border: '1px solid #555',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '12px'
};