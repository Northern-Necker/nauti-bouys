import React, { useEffect, useRef, useState } from 'react';
import { createGLBActorCoreLipSyncSystem } from '../utils/glbActorCoreLipSync';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const GLBActorCoreLipSyncTestPage = () => {
  const mountRef = useRef(null);
  const [lipSync, setLipSync] = useState(null);
  const [viseme, setViseme] = useState('sil');
  const [intensity, setIntensity] = useState(1.0);

  useEffect(() => {
    let scene, camera, renderer, controls;

    const init = async () => {
      const glbUrl = '/assets/party-f-0013.glb';
      const lipSyncSystem = await createGLBActorCoreLipSyncSystem(glbUrl);
      
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x333333); // Add background color for better visibility
      
      // Center and scale the model
      const box = new THREE.Box3().setFromObject(lipSyncSystem.model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      // Center the model at origin
      lipSyncSystem.model.position.sub(center);
      
      // Calculate appropriate scale (target height of ~1.8 units for human model)
      const targetHeight = 1.8;
      const scale = targetHeight / size.y;
      lipSyncSystem.model.scale.multiplyScalar(scale);
      
      // Rotate model to face forward (toward negative Z)
      lipSyncSystem.model.rotation.y = Math.PI; // 180 degrees
      
      // Re-calculate bounds after scaling
      box.setFromObject(lipSyncSystem.model);
      const scaledSize = box.getSize(new THREE.Vector3());
      const scaledCenter = box.getCenter(new THREE.Vector3());
      
      scene.add(lipSyncSystem.model);
      
      // Position camera to view the model
      const maxDim = Math.max(scaledSize.x, scaledSize.y, scaledSize.z);
      const fov = 45;
      const cameraDistance = maxDim / (2 * Math.tan((fov * Math.PI) / 360));
      
      camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 1000);
      // Position camera to view the upper part of the model (face area) from the front
      const headHeight = scaledCenter.y + scaledSize.y * 0.35; // Focus on head area
      camera.position.set(0, headHeight, -cameraDistance * 1.2); // Negative Z to view from front
      camera.lookAt(0, headHeight, 0);
      
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.shadowMap.enabled = true;
      mountRef.current.appendChild(renderer.domElement);
      
      // Add orbit controls for better viewing
      controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, headHeight, 0); // Orbit around head height
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.screenSpacePanning = false;
      controls.minDistance = cameraDistance * 0.3;
      controls.maxDistance = cameraDistance * 3;
      controls.maxPolarAngle = Math.PI;
      
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(1, 2, 1);
      directionalLight.castShadow = true;
      scene.add(directionalLight);
      
      // Add a second light from the front to better illuminate the face
      const frontLight = new THREE.DirectionalLight(0xffffff, 0.5);
      frontLight.position.set(0, headHeight, -cameraDistance);
      scene.add(frontLight);
      
      // Add a helper grid for reference
      const gridHelper = new THREE.GridHelper(10, 10);
      scene.add(gridHelper);

      setLipSync(lipSyncSystem.lipSync);

      const animate = () => {
        requestAnimationFrame(animate);
        controls.update(); // Update orbit controls
        renderer.render(scene, camera);
      };
      animate();
      
      // Handle window resize
      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        if (controls) controls.dispose();
      };
    };

    init();

    return () => {
      if (renderer && mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
        renderer.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (lipSync) {
      lipSync.applyViseme(viseme, intensity);
    }
  }, [lipSync, viseme, intensity]);

  const visemes = ['sil', 'PP', 'FF', 'TH', 'DD', 'kk', 'CH', 'SS', 'nn', 'RR', 'aa', 'E', 'I', 'O', 'U'];

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      <div style={{ 
        position: 'absolute', 
        top: 10, 
        left: 10, 
        backgroundColor: 'rgba(0,0,0,0.7)', 
        padding: '15px',
        borderRadius: '8px',
        color: 'white', 
        zIndex: 1 
      }}>
        <h1 style={{ margin: '0 0 15px 0', fontSize: '1.5em' }}>GLB ActorCore Lip-Sync Test</h1>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ marginRight: '10px' }}>Viseme: </label>
          <select 
            style={{ padding: '5px', fontSize: '14px' }}
            value={viseme} 
            onChange={(e) => {
              console.log('Viseme changed:', e.target.value);
              setViseme(e.target.value);
            }}
          >
            {visemes.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ marginRight: '10px' }}>Intensity: </label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.1" 
            value={intensity} 
            onChange={(e) => {
              console.log('Intensity changed:', e.target.value);
              setIntensity(parseFloat(e.target.value))
            }} 
          />
          <span style={{ marginLeft: '10px' }}>{intensity.toFixed(1)}</span>
        </div>
        <div style={{ fontSize: '12px', marginTop: '15px', opacity: 0.8 }}>
          <p style={{ margin: '5px 0' }}>• Use mouse to orbit around the avatar</p>
          <p style={{ margin: '5px 0' }}>• Scroll to zoom in/out</p>
          <p style={{ margin: '5px 0' }}>• Right-click drag to pan</p>
        </div>
      </div>
    </div>
  );
};

export default GLBActorCoreLipSyncTestPage;
