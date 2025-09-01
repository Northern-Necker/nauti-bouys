/**
 * Consolidated Production Avatar Component
 * Integrates existing sophisticated systems with working GLB renderer
 * 
 * CONSOLIDATION APPROACH:
 * - Uses existing speechProcessing.js for text-to-viseme conversion
 * - Leverages existing EmotionallyIntelligentAvatar.jsx emotional systems
 * - Combines with working PureThreeGLBTest.jsx renderer
 * - Integrates existing enhancedActorCoreLipSync.js for morph targets
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Use existing sophisticated systems
import speechProcessing from '../../utils/speechProcessing';
import { 
  VisemeToActorCore, 
  applyBlendShapeDebug, 
  debugMorphMapping,
  testMorphTargetDirect,
  testAllMouthTargets,
  analyzeModelMorphTargets
} from '../../utils/enhancedActorCoreLipSyncDebug';
import { setupGlobalDiscoveryFunctions } from '../../utils/glbMorphTargetDiscovery';
import VisemeValidator from '../../utils/visemeValidator';
import AdvancedEmotionalIntelligence from '../../utils/advancedEmotionalIntelligence';
import SavannahEmotionalEngine from '../../services/SavannahEmotionalEngine';
import { PatronEngagementMechanics } from '../../utils/patronEngagementMechanics';

const ConsolidatedProductionAvatar = ({ 
  patronId = 'default_patron',
  onAvatarReady = null,
  enableLipSync = true,
  enableEmotionalIntelligence = true,
  enableDebugMode = false,
  avatarScale = 2.0,
  className = "",
  style = {}
}) => {
  // Core Three.js refs (from working PureThreeGLBTest.jsx)
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationIdRef = useRef(null);
  const modelRef = useRef(null);
  const cameraRef = useRef(null);
  
  // Camera controls state (moved to component level to fix hooks error)
  const controlsRef = useRef({
    isDragging: false,
    previousMousePosition: { x: 0, y: 0 },
    cameraDistance: 3,
    cameraAngleX: 0,
    cameraAngleY: 0,
    cameraHeight: 1.8,
    panOffsetX: 0,
    panOffsetY: 0,
    lastTouchDistance: 0,
    isPanning: false
  });
  
  // Existing system integration
  const visemeValidatorRef = useRef(null);
  const emotionalEngineRef = useRef(null);
  const savannahEngineRef = useRef(null);
  const patronEngagementRef = useRef(null);
  const blendShapeRef = useRef([]);
  const currentVisemeRef = useRef({});
  
  // State management (declare states first to avoid temporal dead zone)
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState(null);
  const [isAvatarReady, setIsAvatarReady] = useState(false);
  
  // State refs for reliable access in callbacks
  const isAvatarReadyRef = useRef(false);
  const enableLipSyncRef = useRef(enableLipSync);
  const enableDebugModeRef = useRef(enableDebugMode);
  const enableEmotionalIntelligenceRef = useRef(enableEmotionalIntelligence);
  
  // Update refs when state changes
  useEffect(() => {
    isAvatarReadyRef.current = isAvatarReady;
  }, [isAvatarReady]);
  
  useEffect(() => {
    enableLipSyncRef.current = enableLipSync;
  }, [enableLipSync]);
  
  useEffect(() => {
    enableDebugModeRef.current = enableDebugMode;
  }, [enableDebugMode]);
  
  useEffect(() => {
    enableEmotionalIntelligenceRef.current = enableEmotionalIntelligence;
  }, [enableEmotionalIntelligence]);
  const [morphTargetInfo, setMorphTargetInfo] = useState(null);
  const [currentEmotionalState, setCurrentEmotionalState] = useState(null);
  const [patronRelationship, setPatronRelationship] = useState(null);
  const [isProcessingSpeech, setIsProcessingSpeech] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    fps: 0,
    morphTargetsActive: 0,
    lastVisemeTime: 0,
    speechProcessingTime: 0,
    emotionalProcessingTime: 0
  });

  // Initialize existing systems
  useEffect(() => {
    if (enableLipSync) {
      visemeValidatorRef.current = new VisemeValidator();
    }
    if (enableEmotionalIntelligence) {
      emotionalEngineRef.current = new AdvancedEmotionalIntelligence();
      savannahEngineRef.current = new SavannahEmotionalEngine();
      patronEngagementRef.current = new PatronEngagementMechanics(savannahEngineRef.current);
      
      // Start emotional session
      if (patronId) {
        try {
          const emotionalContext = savannahEngineRef.current.startSession(patronId);
          setCurrentEmotionalState(emotionalContext);
          
          // Get patron relationship data
          const relationship = savannahEngineRef.current.getPatronRelationship(patronId);
          setPatronRelationship(relationship);
          
          if (enableDebugMode) {
            console.log('🧠 Emotional session started:', {
              patronId,
              specialStatus: relationship.specialStatus,
              relationshipLevel: relationship.relationshipLevel,
              mood: emotionalContext.currentState?.mood
            });
          }
        } catch (error) {
          console.warn('Could not start emotional session:', error);
        }
      }
    }
    
    if (enableDebugMode) {
      debugMorphMapping();
    }
  }, [enableLipSync, enableEmotionalIntelligence, enableDebugMode, patronId]);

  // Initialize Three.js scene (from working PureThreeGLBTest.jsx)
  useEffect(() => {
    if (!mountRef.current) return;

    initializeScene();
    loadAvatarModel();

    return cleanup;
  }, []);

  const initializeScene = () => {
    // Scene setup (proven working approach)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2a2a2a);
    sceneRef.current = scene;

    // Camera setup - optimized for face viewing
    const camera = new THREE.PerspectiveCamera(
      45, // Better FOV for close-up viewing
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.8, 3); // Closer and higher for better face view
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

    // Add camera controls for zooming and rotation
    addCameraControls(camera, renderer);

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

  // Add interactive camera controls
  const addCameraControls = (camera, renderer) => {
    const canvas = renderer.domElement;

    // Mouse wheel for zooming
    const handleWheel = (event) => {
      event.preventDefault();
      const zoomSpeed = 0.1;
      controlsRef.current.cameraDistance += event.deltaY * zoomSpeed * 0.01;
      controlsRef.current.cameraDistance = Math.max(1, Math.min(10, controlsRef.current.cameraDistance)); // Limit zoom range
      updateCameraPosition();
    };

    // Enhanced mouse controls for Surface Pro trackpad
    const handleMouseDown = (event) => {
      // Check for middle mouse button or Shift+click for panning
      if (event.button === 1 || (event.button === 0 && event.shiftKey)) {
        controlsRef.current.isPanning = true;
        canvas.style.cursor = 'move';
      } else if (event.button === 0) {
        controlsRef.current.isDragging = true;
        canvas.style.cursor = 'grabbing';
      }
      
      controlsRef.current.previousMousePosition = { x: event.clientX, y: event.clientY };
      event.preventDefault();
    };

    const handleMouseMove = (event) => {
      if (!controlsRef.current.isDragging && !controlsRef.current.isPanning) return;

      const deltaX = event.clientX - controlsRef.current.previousMousePosition.x;
      const deltaY = event.clientY - controlsRef.current.previousMousePosition.y;

      if (controlsRef.current.isPanning) {
        // Improved panning mode with better sensitivity for Surface Pro trackpad
        const panSpeed = 0.005; // Increased sensitivity
        controlsRef.current.panOffsetX -= deltaX * panSpeed;
        controlsRef.current.panOffsetY -= deltaY * panSpeed; // Fixed direction for intuitive vertical panning
        
        // Limit panning range with more generous bounds
        controlsRef.current.panOffsetX = Math.max(-3, Math.min(3, controlsRef.current.panOffsetX));
        controlsRef.current.panOffsetY = Math.max(-3, Math.min(3, controlsRef.current.panOffsetY));
      } else {
        // Rotation mode
        controlsRef.current.cameraAngleY += deltaX * 0.01; // Horizontal rotation
        controlsRef.current.cameraAngleX += deltaY * 0.01; // Vertical rotation
        
        // Limit vertical rotation
        controlsRef.current.cameraAngleX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, controlsRef.current.cameraAngleX));
      }

      controlsRef.current.previousMousePosition = { x: event.clientX, y: event.clientY };
      updateCameraPosition();
    };

    const handleMouseUp = (event) => {
      controlsRef.current.isDragging = false;
      controlsRef.current.isPanning = false;
      canvas.style.cursor = 'grab';
    };

    // Touch controls for mobile
    const handleTouchStart = (event) => {
      if (event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        controlsRef.current.lastTouchDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) + 
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
      } else if (event.touches.length === 1) {
        controlsRef.current.isDragging = true;
        const touch = event.touches[0];
        controlsRef.current.previousMousePosition = { x: touch.clientX, y: touch.clientY };
      }
    };

    const handleTouchMove = (event) => {
      event.preventDefault();
      
      if (event.touches.length === 2) {
        // Pinch to zoom
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) + 
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        
        if (controlsRef.current.lastTouchDistance > 0) {
          const zoomFactor = currentDistance / controlsRef.current.lastTouchDistance;
          controlsRef.current.cameraDistance /= zoomFactor;
          controlsRef.current.cameraDistance = Math.max(1, Math.min(10, controlsRef.current.cameraDistance));
          updateCameraPosition();
        }
        controlsRef.current.lastTouchDistance = currentDistance;
      } else if (event.touches.length === 1 && controlsRef.current.isDragging) {
        // Single touch drag
        const touch = event.touches[0];
        const deltaX = touch.clientX - controlsRef.current.previousMousePosition.x;
        const deltaY = touch.clientY - controlsRef.current.previousMousePosition.y;

        controlsRef.current.cameraAngleY += deltaX * 0.01;
        controlsRef.current.cameraAngleX += deltaY * 0.01;
        controlsRef.current.cameraAngleX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, controlsRef.current.cameraAngleX));

        controlsRef.current.previousMousePosition = { x: touch.clientX, y: touch.clientY };
        updateCameraPosition();
      }
    };

    const handleTouchEnd = () => {
      controlsRef.current.isDragging = false;
      controlsRef.current.lastTouchDistance = 0;
    };

    // Update camera position based on angles, distance, and panning
    const updateCameraPosition = () => {
      const controls = controlsRef.current;
      const x = Math.sin(controls.cameraAngleY) * Math.cos(controls.cameraAngleX) * controls.cameraDistance;
      const y = controls.cameraHeight + Math.sin(controls.cameraAngleX) * controls.cameraDistance;
      const z = Math.cos(controls.cameraAngleY) * Math.cos(controls.cameraAngleX) * controls.cameraDistance;
      
      // Apply panning offsets
      camera.position.set(x + controls.panOffsetX, y + controls.panOffsetY, z);
      
      // Look at target with panning offset
      const lookAtTarget = new THREE.Vector3(
        controls.panOffsetX, 
        controls.cameraHeight - 0.3 + controls.panOffsetY, 
        0
      );
      camera.lookAt(lookAtTarget);
    };

    // Add event listeners
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    
    // Touch events
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    // Set initial cursor
    canvas.style.cursor = 'grab';

    // Cleanup function
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
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
    
    // Apply improved positioning for better centering and face visibility
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    const maxDimension = Math.max(size.x, size.y, size.z);
    const scale = avatarScale / maxDimension;
    model.scale.setScalar(scale);
    
    // Center the model properly and position for optimal face viewing
    model.position.x = -center.x * scale; // Center horizontally
    model.position.y = -center.y * scale + 1.5; // Much higher positioning for better face centering
    model.position.z = -center.z * scale; // Center depth-wise
    
    // Ensure the model is facing forward
    model.rotation.y = 0;
    
    // Enable shadows
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    sceneRef.current.add(model);

    // Initialize viseme system with existing validator
    if (enableLipSync && visemeValidatorRef.current) {
      initializeVisemeSystem(model);
    }

    // Analyze model morph targets for debugging
    if (enableDebugMode) {
      const analysis = analyzeModelMorphTargets(model);
      console.log('🔬 Model Analysis Complete:', analysis);
      
      // Setup discovery functions for numeric morph targets
      setupGlobalDiscoveryFunctions(model);
      
      // Expose test functions globally for debugging
      window.testMorphTarget = (targetName) => testMorphTargetDirect(targetName, model);
      window.testAllMouth = () => testAllMouthTargets(model);
      window.analyzeModel = () => analyzeModelMorphTargets(model);
      
      console.log('⚠️ IMPORTANT: This GLB uses numeric morph target indices, not names!');
      console.log('🎮 Use these commands to discover the correct indices:');
      console.log('  window.testMorph("CC_Game_Body", 0) - Test body morph at index 0');
      console.log('  window.cycleBody(0, 10) - Cycle through indices 0-10');
      console.log('  window.findMouth() - Auto-test all ranges to find mouth morphs');
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
        renderer: rendererRef.current,
        speakText: speakTextWithEmotion,
        speakTextWithEmotion: speakTextWithEmotion,
        processMessage: processPatronMessage,
        testMorphTarget: (targetName) => testMorphTargetDirect(targetName, model),
        testAllMouthTargets: () => testAllMouthTargets(model)
      });
    }

    // Start animation loop
    startAnimationLoop();
  };

  const initializeVisemeSystem = (model) => {
    try {
      // Use existing viseme validator
      const validation = visemeValidatorRef.current.validateMorphTargets(sceneRef.current);
      setMorphTargetInfo(validation);
      
      console.log('🎭 Consolidated viseme system initialized:', {
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
      
      // Apply viseme animations using existing blend shape system
      if (enableLipSync && blendShapeRef.current.length > 0) {
        processVisemeQueue(deltaTime);
      }
      
      // Disable automatic rotation for better face viewing and lip sync validation
      // if (modelRef.current && !controlsRef.current.isDragging) {
      //   modelRef.current.rotation.y += 0.001; // Very slow rotation when not interacting
      // }
      
      // Render scene
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    animate(performance.now());
  };

  const processVisemeQueue = (deltaTime) => {
    if (blendShapeRef.current.length === 0) return;
    
    // Process latest viseme data using existing enhanced system
    const latestBlendShape = blendShapeRef.current.shift();
    if (latestBlendShape && modelRef.current) {
      // Apply blend shape with debugging
      const debugResult = applyBlendShapeDebug(latestBlendShape, 0.15, modelRef.current);
      
      // Update performance metrics
      const activeTargets = Object.values(latestBlendShape).filter(v => v > 0.01).length;
      setPerformanceMetrics(prev => ({
        ...prev,
        morphTargetsActive: activeTargets,
        lastVisemeTime: performance.now()
      }));
    }
  };

  // Enhanced speech processing using existing speechProcessing.js
  const speakTextWithEmotion = useCallback(async (text, emotionalContext = null) => {
    // Use refs for reliable state access to avoid stale closure issues
    const currentEnableLipSync = enableLipSyncRef.current;
    const currentIsAvatarReady = isAvatarReadyRef.current;
    const currentEnableDebugMode = enableDebugModeRef.current;
    const currentEnableEmotionalIntelligence = enableEmotionalIntelligenceRef.current;
    
    if (currentEnableDebugMode) {
      console.log('🎤 Speech function called:', { 
        text: text.substring(0, 50) + '...', 
        enableLipSync: currentEnableLipSync, 
        isAvatarReady: currentIsAvatarReady,
        modelLoaded: !!modelRef.current,
        sceneReady: !!sceneRef.current,
        visemeValidatorReady: !!visemeValidatorRef.current
      });
    }
    
    if (!currentEnableLipSync || !currentIsAvatarReady) {
      console.warn('Lip sync not available', { 
        enableLipSync: currentEnableLipSync, 
        isAvatarReady: currentIsAvatarReady, 
        modelLoaded: !!modelRef.current 
      });
      return { success: false, error: 'Lip sync not available' };
    }

    setIsProcessingSpeech(true);
    const startTime = performance.now();

    try {
      // Use existing emotional intelligence if available
      let processedEmotionalContext = emotionalContext;
      if (currentEnableEmotionalIntelligence && emotionalEngineRef.current && !emotionalContext) {
        processedEmotionalContext = emotionalEngineRef.current.analyzeMood(text);
      }

      // Use existing speechProcessing.js for text-to-viseme conversion
      const visemeAnimation = speechProcessing.createVisemeAnimation(text, {
        wordsPerMinute: getEmotionalSpeechRate(processedEmotionalContext),
        pauseDuration: getEmotionalPauseDuration(processedEmotionalContext),
        visemeIntensity: getEmotionalIntensity(processedEmotionalContext)
      });

      if (currentEnableDebugMode) {
        console.log('🎭 Generated viseme animation:', {
          text,
          visemeCount: visemeAnimation.length,
          firstFewVisemes: visemeAnimation.slice(0, 5).map(v => ({ viseme: v.viseme, startTime: v.startTime }))
        });
      }

      // Convert to our blend shape format and queue
      visemeAnimation.forEach((item, index) => {
        setTimeout(() => {
          // Convert existing speechProcessing viseme format to our enhanced format
          const blendShape = VisemeToActorCore(item.viseme, blendShapeRef);
          if (blendShape) {
            blendShapeRef.current.push(blendShape);
            currentVisemeRef.current = item.viseme;
            
            if (currentEnableDebugMode) {
              console.log('🎯 Applying viseme:', item.viseme, 'BlendShape:', Object.keys(blendShape).filter(k => blendShape[k] > 0));
            }
          } else {
            if (currentEnableDebugMode) {
              console.warn('⚠️ No blend shape for viseme:', item.viseme);
            }
          }
        }, item.startTime);
      });

      // Update performance metrics
      const processingTime = performance.now() - startTime;
      setPerformanceMetrics(prev => ({
        ...prev,
        speechProcessingTime: processingTime
      }));

      if (currentEnableDebugMode) {
        console.log('🗣️ Speaking with emotion:', {
          text,
          visemeCount: visemeAnimation.length,
          processingTime: `${processingTime.toFixed(2)}ms`,
          emotionalContext: processedEmotionalContext
        });
      }

      return {
        success: true,
        visemeAnimation,
        emotionalContext: processedEmotionalContext,
        processingTime
      };

    } catch (error) {
      console.error('Failed to process emotional speech:', error);
      return { success: false, error: error.message };
    } finally {
      setIsProcessingSpeech(false);
    }
  }, [
    enableLipSyncRef, 
    isAvatarReadyRef, 
    enableDebugModeRef, 
    enableEmotionalIntelligenceRef
  ]);

  // Process patron messages using existing emotional systems
  const processPatronMessage = useCallback(async (message, metadata = {}) => {
    if (!enableEmotionalIntelligence || !savannahEngineRef.current) {
      // Fallback to simple speech without emotional processing
      return await speakTextWithEmotion(message);
    }

    const startTime = performance.now();

    try {
      // Use existing Savannah emotional engine
      const emotionalContext = savannahEngineRef.current.processPatronMessage(message, metadata);
      setCurrentEmotionalState(emotionalContext);

      // Process patron engagement mechanics
      let engagementResult = null;
      if (patronEngagementRef.current) {
        // Analyze message for patron actions
        const patronAction = analyzePatronAction(message);
        if (patronAction) {
          engagementResult = patronEngagementRef.current.processPatronAction(
            patronAction, 
            { sincerity: metadata.sincerity || 0.7, timing: 'good' }
          );
          
          // Update relationship display
          const updatedRelationship = savannahEngineRef.current.getPatronRelationship(patronId);
          setPatronRelationship(updatedRelationship);
          
          if (enableDebugMode && engagementResult.favorLevelChanged) {
            console.log('🎭 Favor level changed:', {
              previousLevel: engagementResult.previousLevel,
              newLevel: engagementResult.newLevel,
              pointsEarned: engagementResult.pointsEarned
            });
          }
        }
      }

      // Generate response using existing emotional intelligence
      const emotionalAnalysis = emotionalEngineRef.current.analyzeMood(message);
      const responseText = emotionalEngineRef.current.generateContextualResponse(
        message, 
        emotionalAnalysis, 
        emotionalEngineRef.current.buildPersonalityProfile(emotionalAnalysis, {}),
        { patronRelationship, engagementResult }
      );

      // Speak the response with emotional context
      const speechResult = await speakTextWithEmotion(responseText, emotionalContext);

      // Update performance metrics
      const processingTime = performance.now() - startTime;
      setPerformanceMetrics(prev => ({
        ...prev,
        emotionalProcessingTime: processingTime
      }));

      return {
        responseText,
        emotionalContext,
        emotionalAnalysis,
        engagementResult,
        speechResult,
        processingTime
      };

    } catch (error) {
      console.error('Failed to process patron message:', error);
      return null;
    }
  }, [enableEmotionalIntelligence, speakTextWithEmotion, patronId, enableDebugMode, patronRelationship]);

  // Analyze patron message for engagement actions
  const analyzePatronAction = (message) => {
    const lowerMessage = message.toLowerCase();
    
    // Map common phrases to patron actions
    if (lowerMessage.includes('thank') || lowerMessage.includes('appreciate')) {
      return 'genuine_thanks';
    }
    if (lowerMessage.includes('beautiful') || lowerMessage.includes('gorgeous') || lowerMessage.includes('stunning')) {
      return 'specific_compliment';
    }
    if (lowerMessage.includes('tell me more') || lowerMessage.includes('interesting')) {
      return 'showing_interest_in_stories';
    }
    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest')) {
      return 'trusting_recommendations';
    }
    if (lowerMessage.includes('rude') || lowerMessage.includes('annoying') || lowerMessage.includes('shut up')) {
      return 'being_rude';
    }
    if (lowerMessage.includes('whatever') || lowerMessage.includes('don\'t care')) {
      return 'dismissing_recommendations';
    }
    if (lowerMessage.includes('hurry up') || lowerMessage.includes('faster')) {
      return 'being_impatient';
    }
    
    // Default to general interaction
    return 'asking_about_her_day';
  };

  // Emotional modulation helpers
  const getEmotionalSpeechRate = (emotionalContext) => {
    if (!emotionalContext) return 150; // Default WPM
    
    const { energyLevel, primaryMood } = emotionalContext;
    let baseRate = 150;
    
    if (energyLevel === 'high') baseRate *= 1.2;
    else if (energyLevel === 'low') baseRate *= 0.8;
    
    if (primaryMood === 'excited') baseRate *= 1.3;
    else if (primaryMood === 'sad') baseRate *= 0.7;
    
    return Math.round(baseRate);
  };

  const getEmotionalPauseDuration = (emotionalContext) => {
    if (!emotionalContext) return 300; // Default pause
    
    const { primaryMood } = emotionalContext;
    let basePause = 300;
    
    if (primaryMood === 'disappointed') basePause *= 1.5;
    else if (primaryMood === 'excited') basePause *= 0.7;
    
    return Math.round(basePause);
  };

  const getEmotionalIntensity = (emotionalContext) => {
    if (!emotionalContext) return 1.0;
    
    const { energyLevel, primaryMood, serviceModifiers } = emotionalContext;
    let intensity = 1.0;
    
    // Base emotional modulation
    if (energyLevel === 'high') intensity *= 1.1;
    else if (energyLevel === 'low') intensity *= 0.9;
    
    if (primaryMood === 'happy' || primaryMood === 'excited') intensity *= 1.1;
    else if (primaryMood === 'sad' || primaryMood === 'hurt') intensity *= 0.8;
    
    // Apply service modifiers from patron relationship
    if (serviceModifiers) {
      intensity *= (serviceModifiers.warmth || 1.0);
      intensity *= (serviceModifiers.attentiveness || 1.0);
    }
    
    // Patron relationship affects expression intensity
    if (patronRelationship) {
      if (patronRelationship.specialStatus === 'favorite') {
        intensity *= 1.2; // More expressive with favorites
      } else if (patronRelationship.specialStatus === 'problematic') {
        intensity *= 0.7; // Less expressive with problematic patrons
      }
    }
    
    return Math.max(0.3, Math.min(intensity, 1.5));
  };

  // Get engagement summary for current patron
  const getEngagementSummary = useCallback(() => {
    if (!patronEngagementRef.current || !patronId) return null;
    
    try {
      return patronEngagementRef.current.getEngagementSummary(patronId);
    } catch (error) {
      console.warn('Could not get engagement summary:', error);
      return null;
    }
  }, [patronId]);

  // Reset avatar to neutral expression using existing validator
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

    // Cleanup emotional session
    if (enableEmotionalIntelligence && savannahEngineRef.current) {
      try {
        savannahEngineRef.current.endSession();
      } catch (error) {
        console.warn('Error ending emotional session:', error);
      }
    }
  };

  return (
    <div className={`consolidated-production-avatar ${className}`} style={style}>
      {/* Status Display */}
      <div className="avatar-status mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            error ? 'bg-red-500' : 
            isAvatarReady ? 'bg-green-500' : 
            'bg-yellow-500'
          }`}></div>
          <span className="text-sm">{status}</span>
          {isProcessingSpeech && (
            <span className="text-xs text-blue-400">Speaking...</span>
          )}
        </div>
        {error && (
          <div className="text-red-400 text-sm mt-1">
            {error}
          </div>
        )}
      </div>

      {/* 3D Viewport with Controls Instructions */}
      <div className="avatar-viewport-container">
        <div 
          ref={mountRef}
          className="avatar-viewport w-full bg-gray-900 rounded-lg overflow-hidden relative"
          style={{ minHeight: '500px', ...style }}
        />
        <div className="controls-info mt-2 text-xs text-gray-400 text-center">
          <div>🖱️ Drag to rotate • 🔄 Scroll to zoom • 📱 Pinch to zoom on mobile</div>
          <div>⌨️ Shift+Drag or Middle-click+Drag to pan • 🎯 Focus on face for lip sync</div>
        </div>
      </div>

      {/* Emotional State Display */}
      {enableEmotionalIntelligence && currentEmotionalState && (
        <div className="emotional-state-display mt-2 p-2 bg-gray-800 rounded text-sm">
          <div className="flex items-center justify-between">
            <span>Mood: {currentEmotionalState.currentState?.mood || 'neutral'}</span>
            <span>Energy: {Math.round((currentEmotionalState.currentState?.energy || 0.5) * 100)}%</span>
          </div>
          {patronRelationship && (
            <div className="flex items-center justify-between mt-1 text-xs">
              <span>Status: {patronRelationship.specialStatus}</span>
              <span>Relationship: {Math.round((patronRelationship.relationshipLevel + 1) * 50)}%</span>
            </div>
          )}
        </div>
      )}

      {/* Debug Information */}
      {enableDebugMode && isAvatarReady && (
        <div className="debug-panel mt-4 p-4 bg-gray-800 rounded-lg text-sm">
          <h3 className="font-semibold mb-2">Consolidated System Debug</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Performance:</strong>
              <div>FPS: {performanceMetrics.fps}</div>
              <div>Active Morph Targets: {performanceMetrics.morphTargetsActive}</div>
              <div>Speech Processing: {performanceMetrics.speechProcessingTime.toFixed(2)}ms</div>
              <div>Emotional Processing: {performanceMetrics.emotionalProcessingTime.toFixed(2)}ms</div>
            </div>
            <div>
              <strong>Systems:</strong>
              <div>✅ speechProcessing.js</div>
              <div>✅ enhancedActorCoreLipSync.js</div>
              <div>✅ SavannahEmotionalEngine.js</div>
              <div>✅ advancedEmotionalIntelligence.js</div>
              <div>✅ patronEngagementMechanics.js</div>
            </div>
          </div>
          {morphTargetInfo && (
            <div className="mt-2">
              <strong>Morph Targets:</strong>
              <div>Valid: {morphTargetInfo.valid.length} | Facial: {morphTargetInfo.facial.length} | Broken: {morphTargetInfo.broken.length}</div>
            </div>
          )}
          {patronRelationship && (
            <div className="mt-2">
              <strong>Patron Relationship:</strong>
              <div>Level: {patronRelationship.relationshipLevel.toFixed(2)} | Trust: {patronRelationship.trustLevel?.toFixed(2) || 'N/A'}</div>
              <div>Interactions: {patronRelationship.totalInteractions} | Status: {patronRelationship.specialStatus}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConsolidatedProductionAvatar;
