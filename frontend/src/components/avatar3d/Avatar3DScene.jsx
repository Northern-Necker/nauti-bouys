import React, { useRef, useEffect, useState } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Avatar3DModel({ avatarState, currentMessage }) {
  const group = useRef();
  const [glbModel, setGlbModel] = useState(null);
  
  // Load the GLB model
  const gltf = useGLTF('/assets/SavannahAvatar.glb', true);
  const { actions } = useAnimations(gltf?.animations || [], group);
  
  useEffect(() => {
    if (gltf && gltf.scene) {
      console.log('Avatar3DScene: GLB model loaded');
      
      // Calculate proper scale based on model bounds
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      // Auto-scale - much smaller for proper visibility
      const maxDimension = Math.max(size.x, size.y, size.z);
      const targetSize = 0.8; // Smaller target size
      const scale = targetSize / maxDimension;
      console.log('Avatar3DScene scaling:', { maxDim: maxDimension.toFixed(2), scale: scale.toFixed(4) });
      gltf.scene.scale.setScalar(scale);
      
      console.log(`Avatar3DScene scaling: max dimension ${maxDimension.toFixed(2)}, target ${targetSize}, scale ${scale.toFixed(4)}`);
      
      // Center the model properly
      gltf.scene.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
      
      // Ensure visibility of all meshes
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          child.frustumCulled = false;
          if (child.material) {
            child.material.transparent = false;
            child.material.opacity = 1;
            child.material.side = THREE.DoubleSide;
          }
        }
      });
      
      setGlbModel(gltf.scene);
      
      // Play idle animation if available
      if (actions && Object.keys(actions).length > 0) {
        const idleAction = actions['idle'] || Object.values(actions)[0];
        if (idleAction) {
          idleAction.play();
        }
      }
    }
  }, [gltf, actions]);
  
  // Animate based on avatar state
  useFrame((state, delta) => {
    if (group.current) {
      // Subtle idle animation
      if (avatarState === 'idle') {
        group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
      }
      // Speaking animation
      else if (avatarState === 'speaking') {
        group.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.02;
      }
      // Listening animation
      else if (avatarState === 'listening') {
        group.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.02;
      }
    }
  });
  
  if (!glbModel) {
    // Fallback box while loading
    return (
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 2, 0.5]} />
        <meshStandardMaterial color="#667eea" />
      </mesh>
    );
  }
  
  return (
    <group ref={group} position={[0, -0.5, 0]}>
      <primitive object={glbModel} />
    </group>
  );
}

// Preload GLB model for better performance
if (typeof window !== 'undefined') {
  useGLTF.preload('/assets/SavannahAvatar.glb');
}

export default function Avatar3DScene({ avatarState, isLoading, currentMessage }) {
  if (isLoading) {
    return (
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#3b82f6" wireframe />
      </mesh>
    );
  }
  
  return (
    <React.Suspense fallback={
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 2, 0.5]} />
        <meshStandardMaterial color="#667eea" />
      </mesh>
    }>
      <Avatar3DModel avatarState={avatarState} currentMessage={currentMessage} />
    </React.Suspense>
  );
}