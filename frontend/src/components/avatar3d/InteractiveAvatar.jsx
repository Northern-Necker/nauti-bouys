import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Simple Avatar component using basic 3D shapes to demonstrate interactivity
function Avatar({ mousePosition }) {
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
