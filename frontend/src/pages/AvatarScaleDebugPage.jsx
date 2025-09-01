import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import VisemeValidator from '../utils/visemeValidator';

// Avatar component with real-time scale adjustment
function ScalableAvatar({ scale, cameraDistance, showWireframe, testVisemes }) {
  const group = useRef();
  const [morphTargets, setMorphTargets] = useState({});
  const [visemeNames, setVisemeNames] = useState([]);
  const [visemeValidator, setVisemeValidator] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [currentTest, setCurrentTest] = useState(null);
  
  // Load GLB
  const { scene } = useGLTF('/assets/SavannahAvatar.glb');
  
  useEffect(() => {
    if (scene) {
      console.log('🎭 Avatar loaded, analyzing structure...');
      
      // Apply scale
      scene.scale.setScalar(scale);
      
      // Center the model
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      scene.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
      
      // Log model info
      const size = box.getSize(new THREE.Vector3());
      console.log(`📏 Model bounds: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`);
      console.log(`🔧 Scale applied: ${scale}`);
      console.log(`📍 Center: ${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)}`);
      
      // Initialize viseme validator
      const validator = new VisemeValidator();
      const results = validator.validateMorphTargets(scene);
      
      setVisemeValidator(validator);
      setValidationResults(results);
      
      // Set up rendering properties
      let meshCount = 0;
      scene.traverse((child) => {
        if (child.isMesh) {
          meshCount++;
          child.frustumCulled = false;
          
          if (child.material) {
            child.material.wireframe = showWireframe;
            child.material.side = THREE.DoubleSide;
          }
        }
        
        if (child.isBone) {
          console.log(`🦴 Bone: ${child.name}`);
        }
      });
      
      // Store only valid morph targets
      const validMorphs = {};
      results.valid.forEach(morph => {
        validMorphs[morph.name] = morph;
      });
      
      setMorphTargets(validMorphs);
      setVisemeNames(results.facial.map(m => m.name).sort());
      
      console.log(`✅ Analysis complete: ${meshCount} meshes, ${results.valid.length} valid morphs, ${results.broken.length} broken`);
    }
  }, [scene, scale, showWireframe]);
  
  // Safe viseme testing with validation
  useFrame((state) => {
    if (testVisemes && visemeValidator && validationResults) {
      const time = state.clock.elapsedTime;
      
      // Only test facial morphs, one at a time
      const facialMorphs = validationResults.facial;
      if (facialMorphs.length > 0) {
        // Reset all first
        visemeValidator.resetAllMorphTargets(scene);
        
        // Test one morph at a time in sequence
        const morphIndex = Math.floor(time * 0.5) % facialMorphs.length;
        const currentMorph = facialMorphs[morphIndex];
        
        // Apply with safe intensity
        const intensity = (Math.sin(time * 3) + 1) * 0.2; // 0 to 0.4 max
        visemeValidator.applyMorphTarget(currentMorph.name, intensity);
        
        setCurrentTest(currentMorph.name);
      }
    } else {
      // Reset all morph targets when not testing
      if (visemeValidator && scene) {
        visemeValidator.resetAllMorphTargets(scene);
      }
      setCurrentTest(null);
    }
  });
  
  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

export default function AvatarScaleDebugPage() {
  const [scale, setScale] = useState(0.3); // Start smaller
  const [cameraDistance, setCameraDistance] = useState(5);
  const [showWireframe, setShowWireframe] = useState(false);
  const [testVisemes, setTestVisemes] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [cameraPosition, setCameraPosition] = useState([0, 1, 5]);
  
  const resetCamera = (position) => {
    setCameraPosition([...position]);
  };
  
  const testSingleMorph = async (morphName) => {
    if (visemeValidator) {
      console.log(`🎭 Testing single morph: ${morphName}`);
      await visemeValidator.testMorphTarget(morphName, 1500);
    }
  };
  
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a1a' }}>
      {/* Control Panel */}
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
        fontSize: '14px'
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#60a5fa' }}>🎭 Avatar Scale Debug</h2>
        
        {/* Scale Control */}
        <div style={{ marginBottom: '15px' }}>
          <label>Scale: {scale.toFixed(3)}</label>
          <br />
          <input
            type="range"
            min="0.05"
            max="2.0"
            step="0.05"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ fontSize: '12px', opacity: 0.7 }}>
            Too big → decrease | Too small → increase
          </div>
        </div>
        
        {/* Camera Distance */}
        <div style={{ marginBottom: '15px' }}>
          <label>Camera Distance: {cameraDistance.toFixed(1)}</label>
          <br />
          <input
            type="range"
            min="1"
            max="15"
            step="0.5"
            value={cameraDistance}
            onChange={(e) => setCameraDistance(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        
        {/* Camera Presets */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ marginBottom: '8px' }}>Camera Presets:</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
            <button onClick={() => resetCamera([0, 1.5, 5])} style={buttonStyle}>
              Full Body
            </button>
            <button onClick={() => resetCamera([0, 2, 3])} style={buttonStyle}>
              Upper Body
            </button>
            <button onClick={() => resetCamera([0, 2.2, 2])} style={buttonStyle}>
              Head/Face
            </button>
            <button onClick={() => resetCamera([0, 0.5, 5])} style={buttonStyle}>
              Lower Body
            </button>
          </div>
        </div>
        
        {/* Manual Camera Height Control for Surface Pro */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ marginBottom: '8px' }}>Camera Height (Surface Pro):</div>
          <input
            type="range"
            min="0"
            max="3.5"
            step="0.1"
            value={cameraPosition[1]}
            onChange={(e) => setCameraPosition([cameraPosition[0], parseFloat(e.target.value), cameraPosition[2]])}
            style={{ width: '100%' }}
          />
          <div style={{ fontSize: '11px', opacity: 0.8 }}>
            Y: {cameraPosition[1].toFixed(1)} (0=feet, 1.5=body, 2.5=head)
          </div>
        </div>
        
        {/* Visual Options */}
        <div style={{ marginBottom: '15px' }}>
          <label>
            <input
              type="checkbox"
              checked={showWireframe}
              onChange={(e) => setShowWireframe(e.target.checked)}
            />
            {' '}Wireframe Mode
          </label>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label>
            <input
              type="checkbox"
              checked={testVisemes}
              onChange={(e) => setTestVisemes(e.target.checked)}
            />
            {' '}Test Visemes (Safe Mode)
          </label>
          {currentTest && (
            <div style={{ fontSize: '11px', color: '#fbbf24', marginTop: '4px' }}>
              Testing: {currentTest}
            </div>
          )}
        </div>
        
        {/* Individual Morph Testing */}
        {validationResults && (
          <div style={{ marginBottom: '15px' }}>
            <div style={{ marginBottom: '8px' }}>Individual Tests:</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '11px' }}>
              {validationResults.facial.slice(0, 6).map(morph => (
                <button
                  key={morph.name}
                  onClick={() => testSingleMorph(morph.name)}
                  style={{...buttonStyle, fontSize: '10px', padding: '4px 6px'}}
                >
                  {morph.name.length > 8 ? morph.name.substring(0, 8) + '...' : morph.name}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div style={{ marginBottom: '15px' }}>
          <label>
            <input
              type="checkbox"
              checked={showStats}
              onChange={(e) => setShowStats(e.target.checked)}
            />
            {' '}Show Performance Stats
          </label>
        </div>
        
        {/* Quick Actions */}
        <div style={{ marginBottom: '15px' }}>
          <button
            onClick={() => {
              setScale(0.15);
              resetCamera([0, 1.5, 5]);
              if (visemeValidator && scene) {
                visemeValidator.resetAllMorphTargets(scene);
              }
            }}
            style={{...buttonStyle, backgroundColor: '#10b981', width: '100%'}}
          >
            🎯 Auto-Fix Scale & Reset
          </button>
        </div>
        
        {/* Validation Info */}
        {validationResults && (
          <div style={{ marginBottom: '15px', fontSize: '11px', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '4px' }}>
            <div style={{ color: '#10b981' }}>✅ Valid: {validationResults.valid.length}</div>
            <div style={{ color: '#ef4444' }}>❌ Broken: {validationResults.broken.length}</div>
            <div style={{ color: '#60a5fa' }}>🎭 Facial: {validationResults.facial.length}</div>
          </div>
        )}
        
        {/* Info */}
        <div style={{ fontSize: '12px', opacity: 0.8, borderTop: '1px solid #333', paddingTop: '10px' }}>
          <div><strong>Current Scale:</strong> {scale.toFixed(3)}</div>
          <div><strong>Camera:</strong> [{cameraPosition.map(v => v.toFixed(1)).join(', ')}]</div>
          <div style={{ marginTop: '5px', color: '#fbbf24' }}>
            💡 Use trackpad to orbit, zoom, and pan
          </div>
        </div>
      </div>
      
      {/* 3D Viewport */}
      <Canvas
        camera={{ 
          position: cameraPosition, 
          fov: 50,
          far: 1000
        }}
        key={cameraPosition.join(',')} // Force camera update
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <directionalLight position={[-5, 5, -5]} intensity={0.3} />
        <pointLight position={[0, 3, 0]} intensity={0.2} />
        
        {/* Grid helper */}
        <gridHelper args={[10, 10]} />
        <axesHelper args={[5]} />
        
        {/* Height reference markers */}
        <group>
          {[1, 1.5, 2].map(height => (
            <mesh key={height} position={[2, height, 0]}>
              <boxGeometry args={[0.1, 0.02, 0.1]} />
              <meshBasicMaterial color={height === 1.5 ? '#00ff00' : '#ff0000'} />
            </mesh>
          ))}
        </group>
        
        {/* Avatar */}
        <React.Suspense fallback={
          <mesh position={[0, 1, 0]}>
            <boxGeometry args={[1, 2, 0.5]} />
            <meshStandardMaterial color="yellow" wireframe />
          </mesh>
        }>
          <ScalableAvatar 
            scale={scale}
            cameraDistance={cameraDistance}
            showWireframe={showWireframe}
            testVisemes={testVisemes}
          />
        </React.Suspense>
        
        {/* Controls */}
        <OrbitControls 
          target={[0, 1.5, 0]} // Look at center height
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          panSpeed={2.5}
          zoomSpeed={1.5}
          rotateSpeed={1.0}
          enableDamping
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
        
        {/* Performance info in console when enabled */}
      </Canvas>
    </div>
  );
}

const buttonStyle = {
  padding: '6px 10px',
  background: '#374151',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '12px'
};