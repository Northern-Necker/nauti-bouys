import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export default function UltraMinimalGLBTest() {
  const mountRef = useRef(null);
  const [status, setStatus] = useState('Initializing...');
  const [hasInitialized, setHasInitialized] = useState(false);
  
  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitialized) {
      console.log('⚠️ Component already initialized, skipping...');
      return;
    }
    
    console.log('🚀 UltraMinimalGLBTest - Starting initialization');
    setHasInitialized(true);
    setStatus('Setting up scene...');
    
    let scene, camera, renderer, animationId;
    let isDestroyed = false;
    
    try {
      // Create basic Three.js scene
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x222222);
      
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 3;
      
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      
      // Add renderer to DOM
      if (mountRef.current) {
        mountRef.current.appendChild(renderer.domElement);
        console.log('✅ Renderer added to DOM');
      } else {
        throw new Error('Mount ref not available');
      }
      
      // Add basic lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);
      
      console.log('✅ Lights added');
      setStatus('Scene ready, loading GLB...');
      
      // Animation loop
      function animate() {
        if (isDestroyed) return;
        
        animationId = requestAnimationFrame(animate);
        renderer.render(scene, camera);
      }
      
      animate();
      console.log('✅ Animation loop started');
      
      // Load GLB
      const loader = new GLTFLoader();
      
      loader.load(
        '/assets/SavannahAvatar.glb',
        (gltf) => {
          if (isDestroyed) return;
          
          console.log('✅ GLB loaded successfully:', gltf);
          setStatus('GLB loaded! Adding to scene...');
          
          const model = gltf.scene;
          
          // Scale and position the model
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2 / maxDim;
          
          model.scale.setScalar(scale);
          model.position.set(0, -1, 0);
          
          scene.add(model);
          console.log('✅ GLB added to scene');
          setStatus('Avatar loaded successfully!');
        },
        (progress) => {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          console.log(`GLB loading: ${percent}%`);
          setStatus(`Loading GLB: ${percent}%`);
        },
        (error) => {
          console.error('❌ GLB loading failed:', error);
          setStatus('GLB loading failed: ' + error.message);
        }
      );
      
      // Handle window resize
      function handleResize() {
        if (isDestroyed) return;
        
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
      
      window.addEventListener('resize', handleResize);
      
      // Cleanup function
      return () => {
        console.log('🧹 Cleaning up UltraMinimalGLBTest...');
        isDestroyed = true;
        
        // Stop animation
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
        
        // Remove event listener
        window.removeEventListener('resize', handleResize);
        
        // Clean up Three.js
        if (renderer) {
          if (mountRef.current && renderer.domElement) {
            try {
              mountRef.current.removeChild(renderer.domElement);
            } catch (e) {
              console.log('Canvas already removed');
            }
          }
          renderer.dispose();
        }
        
        // Clean up scene
        if (scene) {
          scene.traverse((object) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
              } else {
                object.material.dispose();
              }
            }
          });
        }
        
        console.log('✅ Cleanup complete');
      };
      
    } catch (error) {
      console.error('❌ Initialization error:', error);
      setStatus('Initialization failed: ' + error.message);
    }
  }, [hasInitialized]); // Only depend on hasInitialized flag
  
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      background: '#000',
      overflow: 'hidden'
    }}>
      <div 
        ref={mountRef}
        style={{ 
          width: '100%', 
          height: '100%' 
        }}
      />
      
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        color: 'white',
        background: 'rgba(0,0,0,0.8)',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '14px',
        maxWidth: '400px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
          Ultra Minimal GLB Test
        </div>
        <div style={{ marginBottom: '5px' }}>
          Status: {status}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.8 }}>
          Pure Three.js implementation - No React Three Fiber
        </div>
      </div>
    </div>
  );
}
