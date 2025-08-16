import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// GLB Avatar component that loads the SavannahAvatar.glb model
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
      
      // Scale the model appropriately
      gltf.scene.scale.setScalar(0.02);
      
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
        console.log('GLB loading timeout, switching to fallback');
        setHasError(true);
        onError?.(new Error('GLB loading timeout'));
      }
    }, 10000); // 10 second timeout for GLB
    
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

// Image Fallback component - displays a static image when 3D model fails
function ImageFallback({ mousePosition }) {
  const imageRef = useRef();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Subtle mouse tracking animation for the image
  useFrame(() => {
    if (imageRef.current && mousePosition && imageLoaded) {
      // Very subtle parallax effect
      const offsetX = (mousePosition.x - 0.5) * 0.02;
      const offsetY = (mousePosition.y - 0.5) * 0.02;
      
      imageRef.current.position.x = THREE.MathUtils.lerp(imageRef.current.position.x, offsetX, 0.1);
      imageRef.current.position.y = THREE.MathUtils.lerp(imageRef.current.position.y, -offsetY, 0.1);
    }
  });
  
  const handleImageLoad = () => {
    setImageLoaded(true);
    console.log('Avatar fallback image loaded successfully');
  };
  
  const handleImageError = () => {
    setImageError(true);
    console.log('Avatar fallback image failed to load');
  };
  
  if (imageError) {
    // Final fallback - simple text message
    return (
      <group position={[0, 0, 0]}>
        <mesh>
          <planeGeometry args={[4, 3]} />
          <meshBasicMaterial color="#667eea" transparent opacity={0.8} />
        </mesh>
      </group>
    );
  }
  
  return (
    <group ref={imageRef} position={[0, 0, 0]}>
      <mesh>
        <planeGeometry args={[3, 4]} />
        <meshBasicMaterial>
          <primitive 
            object={(() => {
              const loader = new THREE.TextureLoader();
              const texture = loader.load(
                '/assets/SavannahAvatar.jpg', // Try JPG first
                handleImageLoad,
                undefined,
                () => {
                  // If JPG fails, try PNG
                  const pngTexture = loader.load(
                    '/assets/SavannahAvatar.png',
                    handleImageLoad,
                    undefined,
                    handleImageError
                  );
                  return pngTexture;
                }
              );
              texture.flipY = false;
              return texture;
            })()} 
            attach="map" 
          />
        </meshBasicMaterial>
      </mesh>
      
      {/* Subtle glow effect around the image */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[3.2, 4.2]} />
        <meshBasicMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.1}
        />
      </mesh>
    </group>
  );
}

// Main Avatar component - simplified to GLB → Fallback only
function Avatar({ mousePosition }) {
  const [useGLB, setUseGLB] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  
  const handleGLBError = useCallback((error) => {
    console.log('GLB failed, switching to fallback avatar:', error);
    setUseGLB(false);
    setUseFallback(true);
  }, []);
  
  if (useFallback) {
    return <ImageFallback mousePosition={mousePosition} />;
  }
  
  if (useGLB) {
    return (
      <React.Suspense fallback={<ImageFallback mousePosition={mousePosition} />}>
        <GLBAvatar 
          mousePosition={mousePosition} 
          onError={handleGLBError}
        />
      </React.Suspense>
    );
  }
  
  return <ImageFallback mousePosition={mousePosition} />;
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
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={15}
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
          panSpeed={1.0}
          rotateSpeed={1.0}
          zoomSpeed={1.0}
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
        />
      </Canvas>
      
      <div className="avatar-info">
        <p>Move your mouse to interact with the avatar</p>
        <p>Left-click + drag: Rotate • Right-click + drag: Pan • Scroll: Zoom</p>
        <p>Trackpad: One finger drag to rotate • Two finger drag to pan/zoom</p>
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
