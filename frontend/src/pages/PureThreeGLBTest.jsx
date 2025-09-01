import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const PureThreeGLBTest = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationIdRef = useRef(null);
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2a2a2a); // Lighter background
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      50, // Reduced FOV for better framing
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.6, 4); // Moved camera back and up slightly

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Enhanced Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2); // Brighter ambient
    scene.add(ambientLight);

    // Main directional light (key light)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(2, 4, 3);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Fill light from the left
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
    fillLight.position.set(-3, 2, 2);
    scene.add(fillLight);

    // Rim light from behind
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
    rimLight.position.set(0, 3, -2);
    scene.add(rimLight);

    // Load GLB model
    const loader = new GLTFLoader();
    setStatus('Loading GLB model...');

    loader.load(
      '/assets/SavannahAvatar.glb',
      (gltf) => {
        setStatus('GLB model loaded successfully!');
        setError(null);
        
        const model = gltf.scene;
        
        // Calculate model bounds for better scaling
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        // Scale model to fit better in viewport (smaller)
        const maxDimension = Math.max(size.x, size.y, size.z);
        const targetSize = 2.0; // Smaller target size for better fit
        const scale = targetSize / maxDimension;
        model.scale.setScalar(scale);
        
        // Center the model and position it properly for full visibility
        model.position.x = -center.x * scale;
        model.position.y = -center.y * scale + 0.3; // Raise the model to show head/face
        model.position.z = -center.z * scale;
        
        // Enable shadows
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        scene.add(model);

        // Simple rotation animation
        const animate = () => {
          animationIdRef.current = requestAnimationFrame(animate);
          
          // Rotate model slowly
          model.rotation.y += 0.005;
          
          renderer.render(scene, camera);
        };
        animate();
      },
      (progress) => {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        setStatus(`Loading: ${percent}%`);
      },
      (error) => {
        console.error('Error loading GLB:', error);
        setError(`Failed to load GLB: ${error.message}`);
        setStatus('Error loading model');
      }
    );

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      if (renderer) {
        renderer.dispose();
      }
      
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
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Pure Three.js GLB Test</h1>
          <p className="text-gray-300">
            Testing GLB avatar loading without React Three Fiber dependencies
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Status</h2>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${error ? 'bg-red-500' : status.includes('successfully') ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span>{status}</span>
            </div>
            {error && (
              <div className="text-red-400 text-sm">
                Error: {error}
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold">3D Avatar Viewport</h2>
          </div>
          <div 
            ref={mountRef}
            className="w-full h-96 bg-gray-900"
            style={{ minHeight: '400px' }}
          />
        </div>

        <div className="mt-6 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Implementation:</strong> Pure Three.js (no React Three Fiber)
            </div>
            <div>
              <strong>Model:</strong> /assets/SavannahAvatar.glb
            </div>
            <div>
              <strong>Features:</strong> Auto-rotation, Lighting, Shadows
            </div>
            <div>
              <strong>Purpose:</strong> Bypass React Three Fiber conflicts
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PureThreeGLBTest;
