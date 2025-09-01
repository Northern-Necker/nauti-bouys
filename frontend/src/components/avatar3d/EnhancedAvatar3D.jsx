import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls, Environment, Text3D, Center } from '@react-three/drei';
import * as THREE from 'three';

// Avatar Model Component with enhanced features
function AvatarModel({ 
  avatarState = 'idle', 
  speechText = '', 
  gestureType = null,
  emotionalState = 'neutral',
  onLoaded = () => {} 
}) {
  const group = useRef();
  const mixer = useRef();
  const [morphTargets, setMorphTargets] = useState({});
  const [bones, setBones] = useState({});
  
  // Load GLB model
  const { scene, animations } = useGLTF('/assets/SavannahAvatar.glb');
  const { actions } = useAnimations(animations, group);
  
  // Initialize model
  useEffect(() => {
    if (scene) {
      console.log('✅ Enhanced Avatar loaded successfully');
      
      // Calculate and apply proper scaling
      const box = new THREE.Box3().setFromObject(scene);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      // Target height of 2 units for good visibility
      const targetHeight = 2;
      const scale = targetHeight / size.y;
      scene.scale.setScalar(scale);
      
      // Center the model
      scene.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
      
      // Collect bones and morph targets
      const bonesMap = {};
      const morphMap = {};
      
      scene.traverse((child) => {
        // Ensure visibility
        if (child.isMesh) {
          child.frustumCulled = false;
          if (child.material) {
            child.material.transparent = false;
            child.material.opacity = 1;
            child.material.side = THREE.DoubleSide;
          }
          
          // Collect morph targets
          if (child.morphTargetDictionary) {
            Object.keys(child.morphTargetDictionary).forEach(key => {
              morphMap[key] = { mesh: child, index: child.morphTargetDictionary[key] };
            });
          }
        }
        
        // Collect bones
        if (child.isBone) {
          const boneName = child.name.toLowerCase();
          if (boneName.includes('head')) bonesMap.head = child;
          if (boneName.includes('neck')) bonesMap.neck = child;
          if (boneName.includes('spine')) bonesMap.spine = child;
          if (boneName.includes('arm_l')) bonesMap.leftArm = child;
          if (boneName.includes('arm_r')) bonesMap.rightArm = child;
          if (boneName.includes('hand_l')) bonesMap.leftHand = child;
          if (boneName.includes('hand_r')) bonesMap.rightHand = child;
        }
      });
      
      setBones(bonesMap);
      setMorphTargets(morphMap);
      
      // Play idle animation if available
      if (actions && actions.idle) {
        actions.idle.play();
      } else if (actions && Object.keys(actions).length > 0) {
        // Play first available animation
        Object.values(actions)[0].play();
      }
      
      onLoaded();
    }
  }, [scene, actions, onLoaded]);
  
  // Gesture animations
  useEffect(() => {
    if (!bones.rightArm || !bones.leftArm) return;
    
    switch (gestureType) {
      case 'wave':
        // Wave gesture
        bones.rightArm.rotation.z = Math.sin(Date.now() * 0.005) * 0.5;
        break;
      case 'point':
        // Pointing gesture
        bones.rightArm.rotation.x = -0.5;
        bones.rightArm.rotation.z = 0.3;
        break;
      case 'thinking':
        // Thinking pose
        bones.rightArm.rotation.x = -1.2;
        bones.rightHand?.rotation && (bones.rightHand.rotation.x = -0.5);
        break;
      case 'welcome':
        // Open arms welcome
        bones.rightArm.rotation.z = 0.8;
        bones.leftArm.rotation.z = -0.8;
        break;
      default:
        // Reset to neutral
        bones.rightArm.rotation.set(0, 0, 0);
        bones.leftArm.rotation.set(0, 0, 0);
    }
  }, [gestureType, bones]);
  
  // Emotional expressions via morph targets
  useEffect(() => {
    if (!morphTargets || Object.keys(morphTargets).length === 0) return;
    
    // Reset all morphs
    Object.values(morphTargets).forEach(({ mesh, index }) => {
      if (mesh.morphTargetInfluences) {
        mesh.morphTargetInfluences[index] = 0;
      }
    });
    
    // Apply emotional morphs
    switch (emotionalState) {
      case 'happy':
        if (morphTargets.smile) {
          morphTargets.smile.mesh.morphTargetInfluences[morphTargets.smile.index] = 0.8;
        }
        break;
      case 'sad':
        if (morphTargets.frown) {
          morphTargets.frown.mesh.morphTargetInfluences[morphTargets.frown.index] = 0.6;
        }
        break;
      case 'surprised':
        if (morphTargets.eyesWide) {
          morphTargets.eyesWide.mesh.morphTargetInfluences[morphTargets.eyesWide.index] = 0.9;
        }
        if (morphTargets.mouthOpen) {
          morphTargets.mouthOpen.mesh.morphTargetInfluences[morphTargets.mouthOpen.index] = 0.5;
        }
        break;
      case 'thinking':
        if (morphTargets.eyebrowRaise) {
          morphTargets.eyebrowRaise.mesh.morphTargetInfluences[morphTargets.eyebrowRaise.index] = 0.4;
        }
        break;
    }
  }, [emotionalState, morphTargets]);
  
  // Animation loop for subtle movements
  useFrame((state) => {
    if (!group.current) return;
    
    const time = state.clock.elapsedTime;
    
    // Subtle idle animation
    if (avatarState === 'idle') {
      group.current.rotation.y = Math.sin(time * 0.5) * 0.05;
      if (bones.head) {
        bones.head.rotation.x = Math.sin(time * 0.7) * 0.02;
        bones.head.rotation.z = Math.cos(time * 0.5) * 0.01;
      }
    }
    
    // Speaking animation
    if (avatarState === 'speaking' && bones.head) {
      bones.head.rotation.x = Math.sin(time * 4) * 0.03;
      // Simulate mouth movement with morph targets
      if (morphTargets.mouthOpen) {
        morphTargets.mouthOpen.mesh.morphTargetInfluences[morphTargets.mouthOpen.index] = 
          (Math.sin(time * 8) + 1) * 0.25;
      }
    }
    
    // Listening animation
    if (avatarState === 'listening' && bones.head) {
      bones.head.rotation.x = 0.1; // Slight head tilt
      bones.head.rotation.y = Math.sin(time * 0.3) * 0.1; // Gentle side-to-side
    }
    
    // Thinking animation
    if (avatarState === 'thinking' && bones.head) {
      bones.head.rotation.x = -0.1; // Look up slightly
      bones.head.rotation.z = Math.sin(time * 2) * 0.02;
    }
  });
  
  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

// Preload GLB model for better performance
if (typeof window !== 'undefined') {
  useGLTF.preload('/assets/SavannahAvatar.glb');
}

// Main Enhanced Avatar Component
export default function EnhancedAvatar3D({
  avatarState = 'idle',
  speechText = '',
  gestureType = null,
  emotionalState = 'neutral',
  onReady = () => {},
  enableControls = true,
  className = ''
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  
  const handleModelLoaded = useCallback(() => {
    setIsLoaded(true);
    onReady();
  }, [onReady]);
  
  const handleError = useCallback((err) => {
    console.error('Avatar loading error:', err);
    setError(err.message || 'Failed to load avatar');
  }, []);
  
  if (error) {
    return (
      <div className={`avatar-error ${className}`}>
        <div className="error-content">
          <h3>Avatar Loading Error</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`enhanced-avatar-3d ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ 
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping
        }}
        onError={handleError}
      >
        {/* Lighting Setup */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
        <directionalLight position={[-5, 5, -5]} intensity={0.4} />
        <pointLight position={[0, 10, 0]} intensity={0.3} />
        
        {/* Environment for reflections */}
        <Environment preset="studio" />
        
        {/* Avatar Model */}
        <React.Suspense fallback={
          <mesh>
            <boxGeometry args={[1, 2, 0.5]} />
            <meshStandardMaterial color="#667eea" />
          </mesh>
        }>
          <AvatarModel
            avatarState={avatarState}
            speechText={speechText}
            gestureType={gestureType}
            emotionalState={emotionalState}
            onLoaded={handleModelLoaded}
          />
        </React.Suspense>
        
        {/* Speech Text Display */}
        {speechText && (
          <Center position={[0, 2.5, 0]}>
            <Text3D
              font="/fonts/helvetiker_regular.typeface.json"
              size={0.15}
              height={0.02}
              curveSegments={12}
            >
              {speechText}
              <meshStandardMaterial color="#ffffff" />
            </Text3D>
          </Center>
        )}
        
        {/* Camera Controls */}
        {enableControls && (
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={6}
            maxPolarAngle={Math.PI * 0.6}
            minPolarAngle={Math.PI * 0.3}
          />
        )}
      </Canvas>
      
      {/* Loading Overlay */}
      {!isLoaded && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading Savannah...</p>
        </div>
      )}
      
      <style jsx>{`
        .enhanced-avatar-3d {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 500px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          overflow: hidden;
        }
        
        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          z-index: 10;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .avatar-error {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 500px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          border-radius: 12px;
          padding: 40px;
        }
        
        .error-content {
          background: white;
          padding: 30px;
          border-radius: 12px;
          text-align: center;
          max-width: 400px;
        }
        
        .error-content h3 {
          color: #dc2626;
          margin-bottom: 16px;
        }
        
        .error-content p {
          color: #6b7280;
          margin-bottom: 20px;
        }
        
        .error-content button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .error-content button:hover {
          background: #2563eb;
        }
      `}</style>
    </div>
  );
}