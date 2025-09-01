/**
 * Production Avatar Component
 * Integrates working GLB renderer with sophisticated viseme/lipsync system
 * Combines PureThreeGLBTest.jsx with EnhancedLipSyncTestPage.jsx functionality
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Import sophisticated viseme/lipsync systems
import { 
  VisemeToActorCore, 
  applyBlendShape, 
  lerpActorCoreMorphTarget,
  debugMorphMapping 
} from '../../utils/enhancedActorCoreLipSync';
import VisemeValidator from '../../utils/visemeValidator';
import AdvancedEmotionalIntelligence from '../../utils/advancedEmotionalIntelligence';

const ProductionAvatarComponent = ({ 
  onAvatarReady = null,
  enableLipSync = true,
  enableEmotionalIntelligence = true,
  enableDebugMode = false,
  avatarScale = 2.0,
  className = "",
  style = {}
}) => {
  // Core Three.js refs
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationIdRef = useRef(null);
  const modelRef = useRef(null);
  const cameraRef = useRef(null);
  
  // Viseme system refs
  const visemeValidatorRef = useRef(null);
  const emotionalIntelligenceRef = useRef(null);
  const blendShapeRef = useRef([]);
  const currentVisemeRef = useRef({});
  
  // State management
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState(null);
  const [isAvatarReady, setIsAvatarReady] = useState(false);
  const [morphTargetInfo, setMorphTargetInfo] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    fps: 0,
    morphTargetsActive: 0,
    lastVisemeTime: 0
  });

  // Initialize systems
  useEffect(() => {
    if (enableLipSync) {
      visemeValidatorRef.current = new VisemeValidator();
    }
    if (enableEmotionalIntelligence) {
      emotionalIntelligenceRef.current = new AdvancedEmotionalIntelligence();
    }
    
    if (enableDebugMode) {
      debugMorphMapping();
    }
  }, [enableLipSync, enableEmotionalIntelligence, enableDebugMode]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    initializeScene();
    loadAvatarModel();

    return cleanup;
  }, []);

  const initializeScene = () => {
    // Scene setup (based on working PureThreeGLBTest.jsx)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2a2a2a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      50, // Reduced FOV for better framing
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.6, 4);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Enhanced Lighting Setup (from working implementation)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(2, 4, 3);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
    fillLight.position.set(-3, 2, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
    rimLight.position.set(0, 3, -2);
    scene.add(rimLight);

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  };

  const loadAvatarModel = () => {
    const loader = new GLTFLoader();
    setStatus('Loading avatar model...');

    loader.load(
      '/assets/SavannahAvatar.glb',
      (gltf) => {
        handleModelLoaded(gltf);
      },
      (progress) => {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        setStatus(`Loading: ${percent}%`);
      },
      (error) => {
        console.error('Error loading GLB:', error);
        setError(`Failed to load avatar: ${error.message}`);
        setStatus('Error loading model');
      }
    );
  };

  const handleModelLoaded = (gltf) => {
    const model = gltf.scene;
    modelRef.current = model;
    
    // Apply proven positioning from PureThreeGLBTest.jsx
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    const maxDimension = Math.max(size.x, size.y, size.z);
    const scale = avatarScale / maxDimension;
    model.scale.setScalar(scale);
    
    // Position for full visibility (head/face shown)
    model.position.x = -center.x * scale;
    model.position.y = -center.y * scale + 0.3; // Raised for head visibility
    model.position.z = -center.z * scale;
    
    // Enable shadows
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    sceneRef.current.add(model);

    // Initialize viseme system
    if (enableLipSync && visemeValidatorRef.current) {
      initializeVisemeSystem(model);
    }

    setStatus('Avatar loaded successfully!');
    setIsAvatarReady(true);
    setError(null);

    // Notify parent component
    if (onAvatarReady) {
      onAvatarReady({
        model,
        scene: sceneRef.current,
        camera: cameraRef.current,
        renderer: rendererRef.current
      });
    }

    // Start animation loop
    startAnimationLoop();
  };

  const initializeVisemeSystem = (model) => {
    try {
      // Validate morph targets
      const validation = visemeValidatorRef.current.validateMorphTargets(sceneRef.current);
      setMorphTargetInfo(validation);
      
      console.log('🎭 Viseme system initialized:', {
        validTargets: validation.valid.length,
        facialTargets: validation.facial.length,
        brokenTargets: validation.broken.length
      });
      
      if (enableDebugMode) {
        console.log('Valid facial morph targets:', validation.facial.map(m => m.name));
      }
    } catch (error) {
      console.error('Failed to initialize viseme system:', error);
    }
  };

  const startAnimationLoop = () => {
    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = lastTime;

    const animate = (currentTime) => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      
      // Update FPS counter
      frameCount++;
      if (currentTime - lastFpsUpdate >= 1000) {
        setPerformanceMetrics(prev => ({
          ...prev,
          fps: Math.round(frameCount * 1000 / (currentTime - lastFpsUpdate))
        }));
        frameCount = 0;
        lastFpsUpdate = currentTime;
      }
      
      // Apply viseme animations
      if (enableLipSync && blendShapeRef.current.length > 0) {
        processVisemeQueue(deltaTime);
      }
      
      // Gentle rotation animation
      if (modelRef.current) {
        modelRef.current.rotation.y += 0.003; // Slower rotation
      }
      
      // Render scene
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    animate(performance.now());
  };

  const processVisemeQueue = (deltaTime) => {
    if (blendShapeRef.current.length === 0) return;
    
    // Process latest viseme data
    const latestBlendShape = blendShapeRef.current.shift();
    if (latestBlendShape && sceneRef.current) {
      // Apply blend shape with smooth interpolation
      applyBlendShape(latestBlendShape, 0.15, sceneRef.current);
      
      // Update performance metrics
      const activeTargets = Object.values(latestBlendShape).filter(v => v > 0.01).length;
      setPerformanceMetrics(prev => ({
        ...prev,
        morphTargetsActive: activeTargets,
        lastVisemeTime: performance.now()
      }));
    }
  };

  // Public API for lip sync
  const speakText = useCallback((text, emotionalContext = null) => {
    if (!enableLipSync || !isAvatarReady) {
      console.warn('Lip sync not available');
      return;
    }

    try {
      // Process emotional context if available
      let emotionalAnalysis = null;
      if (enableEmotionalIntelligence && emotionalIntelligenceRef.current && emotionalContext) {
        emotionalAnalysis = emotionalIntelligenceRef.current.analyzeMood(text);
      }

      // Convert text to visemes (simplified for now - would integrate with speech processing)
      const visemeSequence = generateVisemeSequence(text);
      
      // Apply viseme sequence
      visemeSequence.forEach((viseme, index) => {
        setTimeout(() => {
          const blendShape = VisemeToActorCore(viseme, blendShapeRef);
          currentVisemeRef.current = viseme;
        }, index * 100); // 100ms per viseme
      });

      if (enableDebugMode) {
        console.log('🗣️ Speaking text:', text, 'Visemes:', visemeSequence.length);
      }
    } catch (error) {
      console.error('Failed to process speech:', error);
    }
  }, [enableLipSync, enableEmotionalIntelligence, isAvatarReady, enableDebugMode]);

  // Simplified viseme sequence generation (would be replaced with proper speech processing)
  const generateVisemeSequence = (text) => {
    const words = text.toLowerCase().split(' ');
    const sequence = [];
    
    words.forEach(word => {
      // Simple vowel detection for basic visemes
      for (let char of word) {
        switch (char) {
          case 'a': sequence.push({ 10: 0.8 }); break; // AA
          case 'e': sequence.push({ 11: 0.8 }); break; // E
          case 'i': sequence.push({ 12: 0.8 }); break; // I
          case 'o': sequence.push({ 13: 0.8 }); break; // O
          case 'u': sequence.push({ 14: 0.8 }); break; // U
          default: sequence.push({ 0: 0.2 }); break; // Silence/consonant
        }
      }
      sequence.push({ 0: 0.1 }); // Word break
    });
    
    return sequence;
  };

  // Test morph target function
  const testMorphTarget = useCallback(async (targetName) => {
    if (!visemeValidatorRef.current || !isAvatarReady) return false;
    
    return await visemeValidatorRef.current.testMorphTarget(targetName);
  }, [isAvatarReady]);

  // Reset avatar to neutral expression
  const resetToNeutral = useCallback(() => {
    if (!isAvatarReady || !sceneRef.current) return;
    
    if (visemeValidatorRef.current) {
      visemeValidatorRef.current.resetAllMorphTargets(sceneRef.current);
    }
    
    // Clear viseme queue
    blendShapeRef.current = [];
    currentVisemeRef.current = {};
    
    if (enableDebugMode) {
      console.log('🔄 Avatar reset to neutral');
    }
  }, [isAvatarReady, enableDebugMode]);

  const cleanup = () => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
    
    if (mountRef.current && rendererRef.current?.domElement) {
      mountRef.current.removeChild(rendererRef.current.domElement);
    }
    
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
    
    if (sceneRef.current) {
      sceneRef.current.traverse((object) => {
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

  // Expose public API
  React.useImperativeHandle(onAvatarReady, () => ({
    speakText,
    testMorphTarget,
    resetToNeutral,
    getPerformanceMetrics: () => performanceMetrics,
    getMorphTargetInfo: () => morphTargetInfo,
    isReady: isAvatarReady
  }), [speakText, testMorphTarget, resetToNeutral, performanceMetrics, morphTargetInfo, isAvatarReady]);

  return (
    <div className={`production-avatar-container ${className}`} style={style}>
      {/* Status Display */}
      <div className="avatar-status mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            error ? 'bg-red-500' : 
            isAvatarReady ? 'bg-green-500' : 
            'bg-yellow-500'
          }`}></div>
          <span className="text-sm">{status}</span>
        </div>
        {error && (
          <div className="text-red-400 text-sm mt-1">
            {error}
          </div>
        )}
      </div>

      {/* 3D Viewport */}
      <div 
        ref={mountRef}
        className="avatar-viewport w-full bg-gray-900 rounded-lg overflow-hidden"
        style={{ minHeight: '400px', ...style }}
      />

      {/* Debug Information */}
      {enableDebugMode && isAvatarReady && (
        <div className="debug-panel mt-4 p-4 bg-gray-800 rounded-lg text-sm">
          <h3 className="font-semibold mb-2">Debug Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Performance:</strong>
              <div>FPS: {performanceMetrics.fps}</div>
              <div>Active Morph Targets: {performanceMetrics.morphTargetsActive}</div>
            </div>
            <div>
              <strong>Morph Targets:</strong>
              {morphTargetInfo && (
                <>
                  <div>Valid: {morphTargetInfo.valid.length}</div>
                  <div>Facial: {morphTargetInfo.facial.length}</div>
                  <div>Broken: {morphTargetInfo.broken.length}</div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionAvatarComponent;
