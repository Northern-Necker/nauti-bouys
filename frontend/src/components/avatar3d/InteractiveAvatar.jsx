import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useFBX, useAnimations, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// GLB Avatar component that attempts to load the SavannahAvatar.glb model
function GLBAvatar({ mousePosition, onError }) {
  const group = useRef();
  const [glbModel, setGlbModel] = useState(null);
  const [headBone, setHeadBone] = useState(null);
  const [hasError, setHasError] = useState(false);
  
  // Load the GLB model - hooks must be called unconditionally
  const gltf = useGLTF('/assets/SavannahAvatar.glb');
  const { actions } = useAnimations(gltf?.animations || [], group);
  
  useEffect(() => {
    if (!gltf && !hasError) {
      console.log('GLB model not loaded yet...');
      return;
    }
    
    if (gltf && !hasError) {
      console.log('GLB model loaded successfully:', gltf);
      setGlbModel(gltf.scene);
      
      // Find head bone for mouse tracking
      gltf.scene.traverse((child) => {
        if (child.isBone) {
          console.log('Found GLB bone:', child.name);
          if (child.name.toLowerCase().includes('head') || 
              child.name.toLowerCase().includes('neck') ||
              child.name.toLowerCase().includes('skull')) {
            setHeadBone(child);
            console.log('Using GLB bone for head tracking:', child.name);
          }
        }
      });
      
      // Play first available animation if it exists
      if (actions && Object.keys(actions).length > 0) {
        const firstActionKey = Object.keys(actions)[0];
        const firstAction = actions[firstActionKey];
        if (firstAction && typeof firstAction.play === 'function') {
          firstAction.play();
          console.log('Playing GLB animation:', firstActionKey);
        } else {
          console.log('GLB animation action not playable:', firstActionKey);
        }
      } else {
        console.log('No GLB animations found');
      }
      
      // Scale the model appropriately - try different scales to make it visible
      gltf.scene.scale.setScalar(0.02); // Much smaller scale to fit in view
      
      // Center the model
      gltf.scene.position.set(0, 0, 0);
      
      // Log model bounds for debugging
      const box = new THREE.Box3().setFromObject(gltf.scene);
      console.log('GLB model bounds:', box);
      console.log('GLB model size:', box.getSize(new THREE.Vector3()));
    }
  }, [gltf, actions, hasError]);
  
  // Handle loading errors with a timeout
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!glbModel && !hasError) {
        console.log('GLB loading timeout, switching to FBX');
        setHasError(true);
        onError?.(new Error('GLB loading timeout'));
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timeout);
  }, [glbModel, hasError, onError]);
  
  // Mouse tracking animation
  useFrame(() => {
    if (headBone && mousePosition && !hasError) {
      const targetRotationY = (mousePosition.x - 0.5) * 0.5;
      const targetRotationX = (mousePosition.y - 0.5) * 0.3;
      
      headBone.rotation.y = THREE.MathUtils.lerp(headBone.rotation.y, targetRotationY, 0.1);
      headBone.rotation.x = THREE.MathUtils.lerp(headBone.rotation.x, -targetRotationX, 0.1);
    }
  });
  
  if (hasError) {
    return null; // Let parent handle fallback
  }
  
  if (!glbModel) {
    return null; // Loading
  }
  
  return (
    <group ref={group} position={[0, -1, 0]}>
      <primitive object={glbModel} />
    </group>
  );
}

// FBX Avatar component that attempts to load FBX models as fallback
function FBXAvatar({ mousePosition, onError, modelPath = '/assets/SavannahAvatar.fbx' }) {
  const group = useRef();
  const [fbxModel, setFbxModel] = useState(null);
  const [headBone, setHeadBone] = useState(null);
  const [hasError, setHasError] = useState(false);
  
  // Load the FBX model - hooks must be called unconditionally
  const fbx = useFBX(modelPath);
  const { actions } = useAnimations(fbx?.animations || [], group);
  
  useEffect(() => {
    if (!fbx && !hasError) {
      console.log('FBX model not loaded yet...');
      return;
    }
    
    if (fbx && !hasError) {
      console.log('FBX model loaded successfully:', modelPath, fbx);
      setFbxModel(fbx);
      
      // Find head bone for mouse tracking
      fbx.traverse((child) => {
        if (child.isBone) {
          console.log('Found FBX bone:', child.name);
          if (child.name.toLowerCase().includes('head') || 
              child.name.toLowerCase().includes('neck') ||
              child.name.toLowerCase().includes('skull')) {
            setHeadBone(child);
            console.log('Using FBX bone for head tracking:', child.name);
          }
        }
      });
      
      // Play first available animation
      if (actions && Object.keys(actions).length > 0) {
        const firstAction = Object.values(actions)[0];
        firstAction.play();
        console.log('Playing FBX animation:', Object.keys(actions)[0]);
      }
      
      // Scale the model appropriately
      fbx.scale.setScalar(0.01); // Adjust scale as needed
    }
  }, [fbx, actions, hasError, modelPath]);
  
  // Handle loading errors with a timeout
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!fbxModel && !hasError) {
        console.log('FBX loading timeout, switching to fallback');
        setHasError(true);
        onError?.(new Error('FBX loading timeout'));
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timeout);
  }, [fbxModel, hasError, onError]);
  
  // Mouse tracking animation
  useFrame(() => {
    if (headBone && mousePosition && !hasError) {
      const targetRotationY = (mousePosition.x - 0.5) * 0.5;
      const targetRotationX = (mousePosition.y - 0.5) * 0.3;
      
      headBone.rotation.y = THREE.MathUtils.lerp(headBone.rotation.y, targetRotationY, 0.1);
      headBone.rotation.x = THREE.MathUtils.lerp(headBone.rotation.x, -targetRotationX, 0.1);
    }
  });
  
  if (hasError) {
    return null; // Let parent handle fallback
  }
  
  if (!fbxModel) {
    return null; // Loading
  }
  
  return (
    <group ref={group} position={[0, -1, 0]}>
      <primitive object={fbxModel} />
    </group>
  );
}

// Fallback Avatar component using basic 3D shapes
function FallbackAvatar({ mousePosition }) {
  const headRef = useRef();
  const bodyRef = useRef();
  const leftEyeRef = useRef();
  const rightEyeRef = useRef();
  
  // Mouse tracking animation
  useFrame(() => {
    if (headRef.current && mousePosition) {
      // Convert mouse position to rotation
      const targetRotationY = (mousePosition.x - 0.5) * 0.8;
      const targetRotationX = (mousePosition.y - 0.5) * 0.4;
      
      // Smooth interpolation for head movement
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, targetRotationY, 0.1);
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, -targetRotationX, 0.1);
      
      // Eye tracking (more subtle)
      if (leftEyeRef.current && rightEyeRef.current) {
        const eyeRotationY = targetRotationY * 0.3;
        const eyeRotationX = -targetRotationX * 0.3;
        
        leftEyeRef.current.rotation.y = THREE.MathUtils.lerp(leftEyeRef.current.rotation.y, eyeRotationY, 0.15);
        leftEyeRef.current.rotation.x = THREE.MathUtils.lerp(leftEyeRef.current.rotation.x, eyeRotationX, 0.15);
        
        rightEyeRef.current.rotation.y = THREE.MathUtils.lerp(rightEyeRef.current.rotation.y, eyeRotationY, 0.15);
        rightEyeRef.current.rotation.x = THREE.MathUtils.lerp(rightEyeRef.current.rotation.x, eyeRotationX, 0.15);
      }
    }
    
    // Add subtle breathing animation to body
    if (bodyRef.current) {
      bodyRef.current.scale.y = 1 + Math.sin(Date.now() * 0.001) * 0.02;
    }
  });
  
  return (
    <group position={[0, -0.5, 0]}>
      {/* Body */}
      <mesh ref={bodyRef} position={[0, -0.8, 0]}>
        <cylinderGeometry args={[0.4, 0.5, 1.2, 8]} />
        <meshStandardMaterial color="#4a90e2" />
      </mesh>
      
      {/* Head */}
      <group ref={headRef} position={[0, 0.3, 0]}>
        <mesh>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshStandardMaterial color="#ffdbac" />
        </mesh>
        
        {/* Left Eye */}
        <group ref={leftEyeRef} position={[-0.15, 0.1, 0.3]}>
          <mesh>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
        </group>
        
        {/* Right Eye */}
        <group ref={rightEyeRef} position={[0.15, 0.1, 0.3]}>
          <mesh>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
        </group>
        
        {/* Nose */}
        <mesh position={[0, 0, 0.35]}>
          <coneGeometry args={[0.03, 0.1, 4]} />
          <meshStandardMaterial color="#ffdbac" />
        </mesh>
        
        {/* Mouth */}
        <mesh position={[0, -0.1, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.08, 0.02, 4, 8, Math.PI]} />
          <meshStandardMaterial color="#ff6b6b" />
        </mesh>
      </group>
      
      {/* Arms */}
      <mesh position={[-0.6, -0.3, 0]} rotation={[0, 0, Math.PI / 6]}>
        <cylinderGeometry args={[0.08, 0.08, 0.8, 8]} />
        <meshStandardMaterial color="#ffdbac" />
      </mesh>
      <mesh position={[0.6, -0.3, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <cylinderGeometry args={[0.08, 0.08, 0.8, 8]} />
        <meshStandardMaterial color="#ffdbac" />
      </mesh>
    </group>
  );
}

// Main Avatar component that tries GLB first, then FBX, then falls back to simple shapes
function Avatar({ mousePosition }) {
  const [useGLB, setUseGLB] = useState(true);
  const [useFBX, setUseFBX] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  
  const handleGLBError = useCallback((error) => {
    console.log('GLB failed, trying FBX:', error);
    setUseGLB(false);
    setUseFBX(true);
  }, []);
  
  const handleFBXError = useCallback((error) => {
    console.log('FBX failed, switching to fallback avatar:', error);
    setUseFBX(false);
    setUseFallback(true);
  }, []);
  
  if (useFallback) {
    return <FallbackAvatar mousePosition={mousePosition} />;
  }
  
  if (useFBX) {
    return (
      <React.Suspense fallback={<FallbackAvatar mousePosition={mousePosition} />}>
        <FBXAvatar 
          mousePosition={mousePosition} 
          onError={handleFBXError}
        />
      </React.Suspense>
    );
  }
  
  if (useGLB) {
    return (
      <React.Suspense fallback={<FallbackAvatar mousePosition={mousePosition} />}>
        <GLBAvatar 
          mousePosition={mousePosition} 
          onError={handleGLBError}
        />
      </React.Suspense>
    );
  }
  
  return <FallbackAvatar mousePosition={mousePosition} />;
}

// Main Interactive Avatar component
export default function InteractiveAvatar({ className = "" }) {
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Handle mouse movement for head tracking
  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    setMousePosition({ x, y });
  };
  
  const handleLoadingComplete = () => {
    setIsLoading(false);
  };
  
  const handleError = (error) => {
    console.error('Avatar loading error:', error);
    setError(error.message || 'Failed to load avatar');
    setIsLoading(false);
  };
  
  return (
    <div className={`interactive-avatar-container ${className}`}>
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading interactive avatar...</p>
        </div>
      )}
      
      {error && (
        <div className="error-overlay">
          <p>Error loading avatar: {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}
      
      <Canvas
        className="avatar-canvas"
        camera={{ position: [0, 0, 5], fov: 50 }}
        onMouseMove={handleMouseMove}
        onCreated={handleLoadingComplete}
        onError={handleError}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.3} />
        
        <Avatar mousePosition={mousePosition} />
        
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={10}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
      
      <div className="avatar-info">
        <p>Move your mouse to interact with the avatar</p>
        <p>Use mouse wheel to zoom, drag to rotate view</p>
      </div>
      
      <style>{`
        .interactive-avatar-container {
          position: relative;
          width: 100%;
          height: 600px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        .avatar-canvas {
          width: 100% !important;
          height: 100% !important;
        }
        
        .loading-overlay,
        .error-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          z-index: 10;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .avatar-info {
          position: absolute;
          bottom: 16px;
          left: 16px;
          color: white;
          font-size: 14px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
        }
        
        .avatar-info p {
          margin: 4px 0;
        }
        
        .error-overlay button {
          margin-top: 16px;
          padding: 8px 16px;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .error-overlay button:hover {
          background: #2980b9;
        }
      `}</style>
    </div>
  );
}
