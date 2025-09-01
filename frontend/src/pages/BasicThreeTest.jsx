import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export default function BasicThreeTest() {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationIdRef = useRef(null);
  const [loadingStatus, setLoadingStatus] = useState('Initializing...');
  
  console.log('🚨 BasicThreeTest component loaded!');
  
  useEffect(() => {
    if (!containerRef.current) {
      console.log('❌ Container ref not available');
      return;
    }
    
    console.log('✅ Starting BasicThreeTest setup...');
    setLoadingStatus('Setting up 3D scene...');
    
    // Create scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    
    // Store refs for cleanup
    sceneRef.current = scene;
    rendererRef.current = renderer;
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x222222, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Safely append to container
    try {
      containerRef.current.appendChild(renderer.domElement);
      console.log('✅ Renderer canvas added to DOM');
    } catch (error) {
      console.error('❌ Failed to add canvas to DOM:', error);
      return;
    }
    
    camera.position.set(0, 0, 5);
    
    // Add test cube immediately for visual feedback
    const testCube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshLambertMaterial({ color: 0x00ff00 })
    );
    testCube.position.set(2, 0, 0);
    testCube.castShadow = true;
    scene.add(testCube);
    console.log('✅ Test cube added to scene');
    
    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);
    
    console.log('✅ Lights added to scene');
    setLoadingStatus('Scene ready, starting render loop...');
    
    // Animation loop with error handling
    const animate = () => {
      try {
        animationIdRef.current = requestAnimationFrame(animate);
        
        // Rotate test cube
        testCube.rotation.x += 0.01;
        testCube.rotation.y += 0.01;
        
        // Render scene
        renderer.render(scene, camera);
      } catch (error) {
        console.error('❌ Animation loop error:', error);
        setLoadingStatus('Render error: ' + error.message);
      }
    };
    
    animate();
    console.log('✅ Render loop started');
    setLoadingStatus('Rendering... Loading GLB avatar...');
    
    // Load GLB with proper error handling
    const loadGLB = () => {
      const loader = new GLTFLoader();
      
      console.log('🔄 Starting GLB load from /assets/SavannahAvatar.glb');
      
      loader.load(
        '/assets/SavannahAvatar.glb',
        (gltf) => {
          try {
            console.log('✅ GLB loaded successfully:', gltf);
            setLoadingStatus('GLB loaded! Processing...');
            
            if (!gltf.scene) {
              throw new Error('GLB scene is null');
            }
            
            if (gltf.scene.children.length === 0) {
              throw new Error('GLB scene has no children');
            }
            
            // Calculate bounding box
            const box = new THREE.Box3().setFromObject(gltf.scene);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            
            console.log('GLB size:', size);
            console.log('GLB center:', center);
            
            if (size.x === 0 || size.y === 0 || size.z === 0) {
              throw new Error('GLB has zero dimensions');
            }
            
            // Scale to reasonable size
            const maxDim = Math.max(size.x, size.y, size.z);
            const targetSize = 2; // Target size in scene units
            const scale = targetSize / maxDim;
            
            gltf.scene.scale.setScalar(scale);
            
            // Center the model
            gltf.scene.position.copy(center).multiplyScalar(-scale);
            gltf.scene.position.x = -2; // Position to the left of test cube
            
            // Enable shadows
            gltf.scene.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });
            
            scene.add(gltf.scene);
            console.log('✅ GLB added to scene with scale:', scale);
            setLoadingStatus('Avatar loaded successfully!');
            
          } catch (error) {
            console.error('❌ Error processing GLB:', error);
            setLoadingStatus('GLB processing error: ' + error.message);
          }
        },
        (progress) => {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          console.log('GLB loading progress:', percent + '%');
          setLoadingStatus(`Loading GLB: ${percent}%`);
        },
        (error) => {
          console.error('❌ GLB loading failed:', error);
          setLoadingStatus('GLB loading failed: ' + error.message);
        }
      );
    };
    
    // Load GLB after a short delay to ensure scene is stable
    const loadTimeout = setTimeout(loadGLB, 500);
    
    // Handle window resize
    const handleResize = () => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up BasicThreeTest...');
      
      // Clear timeout
      clearTimeout(loadTimeout);
      
      // Stop animation loop
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      // Remove event listeners
      window.removeEventListener('resize', handleResize);
      
      // Clean up Three.js objects
      if (rendererRef.current) {
        // Remove canvas from DOM
        if (containerRef.current && rendererRef.current.domElement) {
          try {
            containerRef.current.removeChild(rendererRef.current.domElement);
          } catch (error) {
            console.log('Canvas already removed from DOM');
          }
        }
        
        // Dispose renderer
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      
      // Clean up scene
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object.geometry) {
            object.geometry.dispose();
          }
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
        sceneRef.current = null;
      }
      
      console.log('✅ Cleanup complete');
    };
  }, []); // Empty dependency array to prevent re-runs
  
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      background: '#000',
      overflow: 'hidden',
      zIndex: 1000
    }}>
      <div 
        ref={containerRef}
        style={{ 
          width: '100%', 
          height: '100%',
          display: 'block'
        }}
      />
      
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        color: 'white',
        background: 'rgba(0,0,0,0.8)',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '14px',
        maxWidth: '300px',
        lineHeight: '1.4'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
          GLB Avatar Test
        </div>
        <div style={{ marginBottom: '4px' }}>
          Status: {loadingStatus}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.8 }}>
          • Green cube should be rotating (right)
          • Avatar should appear (left)
          • Check console for detailed logs
        </div>
      </div>
      
      <div style={{
        position: 'absolute',
        bottom: 10,
        left: 10,
        color: 'white',
        background: 'rgba(0,0,0,0.8)',
        padding: '10px',
        borderRadius: '5px',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}>
        Press F12 to open DevTools and check console
      </div>
    </div>
  );
}
