import React, { useEffect, useRef, useState } from 'react';
import { createBabylonGLBLipSyncSystem } from '../utils/babylonGLBActorCoreLipSync';
import { verifyActorCoreGLBStructure } from '../utils/verifyTongueMesh';
import { extractMorphTargets, findSimilarMorphs } from '../utils/morphTargetExtractor';
import { debugVisemes } from '../utils/visemeDebugger';
import { verifyMorphNames, generateCorrectedMappings } from '../utils/morphNameVerifier';
import { CanonicalMorphHandler, testBilabialCombinations, BILABIAL_TEST_COMBINATIONS, applyVisemeCanonical } from '../utils/babylonCanonicalMorphFix';
import { BilabialMorphFinder, findCorrectPPMorph } from '../utils/findBilabialMorph';

const TongueMorphTestPage = () => {
  const mountRef = useRef(null);
  const lipSyncRef = useRef(null);
  const canonicalHandlerRef = useRef(null);
  const morphFinderRef = useRef(null);

  useEffect(() => {
    let babylonSystem = null;
    let cleanupEventListeners = null; // Store cleanup function reference

    const init = async () => {
      // First, verify the GLB structure to confirm tongue mesh separation
      const glbUrl = '/assets/party-f-0013-fixed.glb';  // Use the fixed GLB file
      console.log('🔍 Verifying ActorCore GLB structure...');
      await verifyActorCoreGLBStructure(glbUrl);
      
      console.log('🎭 Initializing Babylon.js GLB Lip-Sync System...');
      
      // Create canvas element for Babylon.js with critical styling from working standalone test
      const canvas = document.createElement('canvas');
      canvas.id = 'renderCanvas';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      
      // CRITICAL FIX: Complete CSS styling to prevent page interference (Surface Pro fix)
      canvas.style.touchAction = 'none';
      canvas.style.webkitTouchAction = 'none';
      canvas.style.msTouchAction = 'none';
      canvas.style.userSelect = 'none';
      canvas.style.webkitUserSelect = 'none';
      canvas.style.khtmlUserSelect = 'none';
      canvas.style.mozUserSelect = 'none';
      canvas.style.msUserSelect = 'none';
      canvas.style.outline = 'none';
      canvas.style.webkitTouchCallout = 'none'; // Prevent context menu on long press
      
      mountRef.current.appendChild(canvas);
      
      // CRITICAL FIX: Smart Touch Event Management from working standalone test
      // RESEARCH-BASED FIX: Allow Babylon.js canvas touch events while preventing page-level zoom
      // Based on GitHub issue #5734 and Babylon.js documentation
      
      // Only prevent page-level zoom gestures, not canvas interactions
      const handleTouchStart = (e) => {
        // Allow touch events on the canvas for 3D controls
        if (e.target.id === 'renderCanvas' || e.target.closest('#renderCanvas')) {
          return; // Let Babylon.js handle canvas touch events
        }
        // Prevent touch on other page elements to avoid page zoom
        if (e.touches.length > 1) {
          e.preventDefault();
        }
      };
      
      // Prevent page-level pinch zoom while allowing canvas pinch zoom
      const handleGestureStart = (e) => {
        // Allow gestures on the canvas for 3D camera controls
        if (e.target.id === 'renderCanvas' || e.target.closest('#renderCanvas')) {
          return; // Let Babylon.js handle canvas gestures
        }
        // Prevent page-level gestures
        e.preventDefault();
      };
      
      // Prevent Ctrl+wheel page zoom while allowing normal scroll and canvas zoom
      const handleWheel = (e) => {
        // Only prevent Ctrl+wheel for page zoom, not canvas interactions
        if (e.ctrlKey && e.target.id !== 'renderCanvas') {
          e.preventDefault();
        }
      };
      
      // Minimal context menu prevention
      const handleContextMenu = (e) => {
        // Only prevent context menu on canvas to avoid interference with 3D controls
        if (e.target.id === 'renderCanvas') {
          e.preventDefault();
        }
      };
      
      // Attach smart touch event listeners
      document.addEventListener('touchstart', handleTouchStart, { passive: false });
      document.addEventListener('gesturestart', handleGestureStart, { passive: false });
      document.addEventListener('wheel', handleWheel, { passive: false });
      document.addEventListener('contextmenu', handleContextMenu, { passive: false });
      
      // Store cleanup functions for later removal
      cleanupEventListeners = () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('gesturestart', handleGestureStart);
        document.removeEventListener('wheel', handleWheel);
        document.removeEventListener('contextmenu', handleContextMenu);
        console.log('✅ Smart touch event listeners removed');
      };
      
      try {
        // Initialize Babylon.js system
        babylonSystem = await createBabylonGLBLipSyncSystem(canvas, glbUrl);
        
        console.log('✅ Babylon.js system initialized:', babylonSystem);
        
        // Store reference to the lip sync system
        lipSyncRef.current = babylonSystem.lipSync;
        
        // Get system state for UI updates
        const systemState = babylonSystem.lipSync.getCurrentState();
        console.log('📊 Babylon.js system state:', systemState);
        
        // Update UI with available morphs from Babylon.js system
        const morphTargetNames = Array.from(babylonSystem.lipSync.morphTargetsByName.keys()).sort();
        setAllMorphNames(morphTargetNames);
        const initialWeights = morphTargetNames.reduce((acc, name) => {
          acc[name] = 0;
          return acc;
        }, {});
        setMorphWeights(initialWeights);
        
        // Mark system as ready
        setLipSyncReady(true);
        
        // Initialize CanonicalMorphHandler
        console.log('🎯 Initializing CanonicalMorphHandler...');
        canonicalHandlerRef.current = new CanonicalMorphHandler(babylonSystem.scene);
        console.log('✅ CanonicalMorphHandler ready');
        
        // Initialize BilabialMorphFinder
        console.log('🔍 Initializing BilabialMorphFinder...');
        morphFinderRef.current = new BilabialMorphFinder(babylonSystem.scene);
        morphFinderRef.current.printAllMorphNames();
        console.log('✅ BilabialMorphFinder ready');
        
        console.log('✅ Babylon.js GLB Lip-Sync System Ready');
        
      } catch (error) {
        console.error('❌ Failed to initialize Babylon.js system:', error);
      }
    };

    init();

    return () => {
      // CRITICAL FIX: Clean up event listeners to prevent memory leaks
      if (typeof cleanupEventListeners === 'function') {
        cleanupEventListeners();
        console.log('✅ Smart touch event listeners removed');
      }
      
      if (babylonSystem && babylonSystem.dispose) {
        console.log('🧹 Disposing Babylon.js system...');
        babylonSystem.dispose();
      }
      if (mountRef.current && mountRef.current.firstChild) {
        mountRef.current.removeChild(mountRef.current.firstChild);
      }
    };
  }, []);

  const [viseme, setViseme] = useState('sil');
  const [intensity, setIntensity] = useState(1.0);
  const [autoTest, setAutoTest] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [testResults, setTestResults] = useState({});
  const [appliedMorphs, setAppliedMorphs] = useState([]);
  const [lipSyncReady, setLipSyncReady] = useState(false);
  const [availableMorphs, setAvailableMorphs] = useState(null);
  const [morphCorrections, setMorphCorrections] = useState(null);
  const [directTestModel, setDirectTestModel] = useState(null);
  const [allMorphNames, setAllMorphNames] = useState([]);
  const [morphWeights, setMorphWeights] = useState({});
  
  // ------- INDEX-BASED TESTING STATE (New Reference Implementation) -------
  const [headMorphIndices, setHeadMorphIndices] = useState([]);
  const [tongueMorphIndices, setTongueMorphIndices] = useState([]);
  const [selectedMeshForTest, setSelectedMeshForTest] = useState('head');
  const [selectedIndexForTest, setSelectedIndexForTest] = useState(0);
  const [testIntensity, setTestIntensity] = useState(0.8);
  const [indexTestResults, setIndexTestResults] = useState({});
  const [showIndexTesting, setShowIndexTesting] = useState(false);
  
  // ------- morphTargetInfluences test state -------
  const [morphInfluencesTest, setMorphInfluencesTest] = useState(null);
  const [isUsingInfluencesSystem, setIsUsingInfluencesSystem] = useState(false);
  const [influencesTestResults, setInfluencesTestResults] = useState({});

  // ------- New state for viseme override UI -------
  const [selectedVisemeForEdit, setSelectedVisemeForEdit] = useState('PP');
  const [visemeEdits, setVisemeEdits] = useState({}); // { viseme: [{morph, weight}] }
  const [profileName, setProfileName] = useState('actorcore-default');
  const [intensityRefresh, setIntensityRefresh] = useState(0); // force re-render when engine intensity changes
  
  // ------- Layout control for better visual verification -------
  const [showLiveMorphTuning, setShowLiveMorphTuning] = useState(false);
  
  // ------- Canonical/Bilabial Testing State -------
  const [currentBilabialTest, setCurrentBilabialTest] = useState(0);
  const [bilabialTestResults, setBilabialTestResults] = useState({});
  const [isUsingCanonical, setIsUsingCanonical] = useState(false);

  const ensureVisemeEdit = (v) => {
    setVisemeEdits(prev => {
      if (prev[v]) return prev;
      // seed from current resolved mapping if available
      let seed = [];
      if (lipSyncRef.current && lipSyncRef.current.getResolvedVisemeMappings) {
        const res = lipSyncRef.current.getResolvedVisemeMappings();
        if (res[v]?.morphs) {
          seed = res[v].morphs.map((m, i) => ({ morph: m, weight: res[v].weights?.[i] ?? 0 }));
        }
      }
      return { ...prev, [v]: seed };
    });
  };

  const addMorphToViseme = () => {
    ensureVisemeEdit(selectedVisemeForEdit);
    setVisemeEdits(prev => {
      const arr = prev[selectedVisemeForEdit] ? [...prev[selectedVisemeForEdit]] : [];
      arr.push({ morph: '', weight: 0 });
      return { ...prev, [selectedVisemeForEdit]: arr };
    });
  };

  const updateVisemeEntry = (index, field, value) => {
    setVisemeEdits(prev => {
      const arr = [...(prev[selectedVisemeForEdit] || [])];
      if (!arr[index]) return prev;
      arr[index] = { ...arr[index], [field]: field === 'weight' ? Math.max(0, Math.min(1, parseFloat(value) || 0)) : value };
      return { ...prev, [selectedVisemeForEdit]: arr };
    });
  };

  const removeVisemeEntry = (index) => {
    setVisemeEdits(prev => {
      const arr = [...(prev[selectedVisemeForEdit] || [])];
      arr.splice(index, 1);
      return { ...prev, [selectedVisemeForEdit]: arr };
    });
  };

  const applyVisemeOverrides = () => {
    if (!lipSyncRef.current || !lipSyncRef.current.setResolvedVisemeWeights) return;
    const edits = visemeEdits[selectedVisemeForEdit] || [];
    lipSyncRef.current.setResolvedVisemeWeights(selectedVisemeForEdit, edits);
    // Re-apply current viseme to see effect using per-viseme intensity if set
    const vi = lipSyncRef.current?.getVisemeIntensities?.();
    const perV = vi?.[selectedVisemeForEdit];
    const applyIntensity = typeof perV === 'number' ? perV : intensity;
    applyCurrentViseme(selectedVisemeForEdit, applyIntensity);
  };

  const resetCurrentVisemeToDefault = () => {
    if (!lipSyncRef.current || !lipSyncRef.current.resetVisemeToDefault) return;
    lipSyncRef.current.resetVisemeToDefault(selectedVisemeForEdit);
    setVisemeEdits(prev => ({ ...prev, [selectedVisemeForEdit]: undefined }));
    applyCurrentViseme(selectedVisemeForEdit, intensity);
  };

  const exportProfile = () => {
    if (!lipSyncRef.current || !lipSyncRef.current.exportProfile) return;
    const profile = lipSyncRef.current.exportProfile();
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profileName || 'viseme-profile'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importProfileFromFile = async (file) => {
    try {
      const text = await file.text();
      const profile = JSON.parse(text);
      if (lipSyncRef.current && lipSyncRef.current.importProfile) {
        const ok = lipSyncRef.current.importProfile(profile);
        if (ok) {
          setVisemeEdits({});
          applyCurrentViseme(viseme, intensity);
        }
      }
    } catch (e) {
      console.error('Failed to import profile file:', e);
    }
  };

  const resetAllVisemes = () => {
    if (!lipSyncRef.current || !lipSyncRef.current.resetResolvedVisemeMappings) return;
    lipSyncRef.current.resetResolvedVisemeMappings();
    setVisemeEdits({});
    applyCurrentViseme(viseme, intensity);
  };

  // Function to apply viseme and update state
  const applyCurrentViseme = (currentViseme, currentIntensity) => {
    console.log(`🔄 Attempting to apply viseme: ${currentViseme} with intensity: ${currentIntensity}`);

    // If using canonical mode and canonical handler is ready, use it
    if (isUsingCanonical && canonicalHandlerRef.current) {
      console.log(`🎯 Using canonical mode for viseme: ${currentViseme}`);
      try {
        applyVisemeCanonical(canonicalHandlerRef.current, currentViseme, currentIntensity);
        // Get the applied morphs from canonical handler for UI display
        const appliedMorphs = [];
        const visemeMapping = canonicalHandlerRef.current.getVisemeMapping(currentViseme);
        if (visemeMapping) {
          visemeMapping.forEach(([morph, weight]) => {
            appliedMorphs.push({ morph, weight: weight * currentIntensity });
          });
        }
        setAppliedMorphs(appliedMorphs);
        console.log(`✅ Applied canonical viseme with ${appliedMorphs.length} morphs`);
        return;
      } catch (error) {
        console.error(`❌ Error applying canonical viseme:`, error);
      }
    }

    // Default behavior: use regular lip sync system
    if (!lipSyncRef.current) {
      console.log(`❌ lipSyncRef.current is null`);
      setAppliedMorphs([]);
      return;
    }

    if (!lipSyncRef.current.isReady) {
      console.log(`⚠️ LipSync not ready yet - viseme: ${currentViseme}, ready: ${lipSyncRef.current?.isReady}`);
      setAppliedMorphs([]);
      return;
    }

    console.log(`🎭 LipSync system is ready - applying viseme: ${currentViseme}`);
    // Use immediate mode for testing to see instant results
    const result = lipSyncRef.current.applyViseme(currentViseme, currentIntensity, true);

    if (result && result.morphs) {
      setAppliedMorphs(result.morphs);
      console.log(`📊 Updated UI with ${result.morphs.length} applied morphs`);
      console.log(`Applied morphs:`, result.morphs);
    } else {
      console.log(`❌ No result or applied morphs from applyViseme`);
      console.log(`Result received:`, result);
      setAppliedMorphs([]);
    }
  };

  // Monitor viseme and intensity changes
  useEffect(() => {
    console.log(`🔄 useEffect triggered - viseme: ${viseme}, intensity: ${intensity}, ready: ${lipSyncReady}`);
    if (lipSyncReady) {
      applyCurrentViseme(viseme, intensity);
    }
  }, [viseme, intensity, lipSyncReady]);

  // Monitor lip sync system readiness
  useEffect(() => {
    const checkReadiness = () => {
      if (lipSyncRef.current && lipSyncRef.current.isReady && !lipSyncReady) {
        console.log(`✅ LipSync system became ready!`);
        setLipSyncReady(true);
      }
    };

    // Only run interval if not ready yet
    if (!lipSyncReady) {
      checkReadiness();
      const interval = setInterval(checkReadiness, 100);
      return () => clearInterval(interval);
    }
  }, [lipSyncReady]); // Depend on lipSyncReady to stop interval when ready

  // Auto-test functionality
  useEffect(() => {
    if (autoTest && currentTestIndex < allVisemes.length) {
      const timer = setTimeout(() => {
        setViseme(allVisemes[currentTestIndex]);
        setCurrentTestIndex(prev => prev + 1);
      }, 3000); // 3 seconds per viseme

      return () => clearTimeout(timer);
    } else if (autoTest && currentTestIndex >= allVisemes.length) {
      setAutoTest(false);
      setCurrentTestIndex(0);
    }
  }, [autoTest, currentTestIndex]);

  const allVisemes = ['sil', 'PP', 'FF', 'TH', 'DD', 'kk', 'CH', 'SS', 'nn', 'RR', 'aa', 'E', 'I', 'O', 'U'];
  
  const markVisemeResult = (viseme, working) => {
    setTestResults(prev => ({
      ...prev,
      [viseme]: working
    }));
  };
  
  const startAutoTest = () => {
    setAutoTest(true);
    setCurrentTestIndex(0);
    setTestResults({});
  };

  const forceUpdate = () => {
    if (lipSyncRef.current && lipSyncRef.current.meshTargets) {
      console.log('� Forcing mesh updates...');
      lipSyncRef.current.meshTargets.forEach(mesh => {
        if (mesh.geometry) {
          if (mesh.geometry.morphAttributes.position) {
            mesh.geometry.morphAttributes.position.needsUpdate = true;
          }
          if (mesh.geometry.morphAttributes.normal) {
            mesh.geometry.morphAttributes.normal.needsUpdate = true;
          }
        }
        mesh.morphTargetInfluences.needsUpdate = true;
        
        // Force material update
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(m => {
              m.needsUpdate = true;
            });
          } else {
            mesh.material.needsUpdate = true;
          }
        }
      });
    }
  };

  // Function to extract and display available morph targets
  const showAvailableMorphs = async () => {
    const glbUrl = '/assets/party-f-0013-fixed.glb';
    try {
      const morphs = await extractMorphTargets(glbUrl);
      setAvailableMorphs(morphs);
      console.log('📋 Available Morph Targets:', morphs);
      
      // Check if the problematic morphs exist
      const allMorphs = [...(morphs.CC_Game_Tongue || []), ...(morphs.CC_Game_Body || [])];
      
      // Check for 'kk' viseme morphs
      console.log('🔍 Checking for kk morphs:');
      console.log('  - V_Tongue_up exists?', allMorphs.includes('V_Tongue_up'));
      console.log('  - Similar morphs:', findSimilarMorphs(allMorphs, 'tongue_up'));
      
      // Check for 'SS' viseme morphs  
      console.log('🔍 Checking for SS morphs:');
      console.log('  - V_Stretched exists?', allMorphs.includes('V_Stretched'));
      console.log('  - Similar morphs:', findSimilarMorphs(allMorphs, 'stretch'));
      
    } catch (error) {
      console.error('Failed to extract morph targets:', error);
    }
  };

  const handleMorphChange = (morphName, value) => {
    const newWeights = { ...morphWeights, [morphName]: value };
    setMorphWeights(newWeights);
    if (lipSyncRef.current) {
      lipSyncRef.current.applySingleMorph(morphName, value, true);
    }
  };

  // ------- INDEX-BASED TESTING FUNCTIONS (Following Reference Implementation) -------
  
  const extractMorphTargetIndices = async () => {
    try {
      console.log('🔍 [Index-Based] Extracting morph target indices following reference implementation...');
      
      if (!lipSyncRef.current || !lipSyncRef.current.scene) {
        console.warn('❌ [Index-Based] Babylon.js scene not available');
        return;
      }
      
      const scene = lipSyncRef.current.scene;
      
      // Find meshes - following reference pattern
      const headMesh = scene.getMeshByName('CC_Game_Body');
      const tongueMesh = scene.getMeshByName('CC_Game_Tongue');
      
      let headIndices = [];
      let tongueIndices = [];
      
      // Extract head mesh morph targets
      if (headMesh?.morphTargetManager) {
        const manager = headMesh.morphTargetManager;
        const count = manager.numTargets;
        
        console.log(`📋 [Index-Based] Head mesh (CC_Game_Body) has ${count} morph targets:`);
        
        for (let i = 0; i < count; i++) {
          const target = manager.getTarget(i);
          if (target) {
            const indexData = {
              index: i,
              name: target.name,
              influence: target.influence
            };
            headIndices.push(indexData);
            console.log(`  Head Index ${i}: "${target.name}" (influence: ${target.influence})`);
          }
        }
      }
      
      // Extract tongue mesh morph targets  
      if (tongueMesh?.morphTargetManager) {
        const manager = tongueMesh.morphTargetManager;
        const count = manager.numTargets;
        
        console.log(`👅 [Index-Based] Tongue mesh (CC_Game_Tongue) has ${count} morph targets:`);
        
        for (let i = 0; i < count; i++) {
          const target = manager.getTarget(i);
          if (target) {
            const indexData = {
              index: i,
              name: target.name,
              influence: target.influence
            };
            tongueIndices.push(indexData);
            console.log(`  Tongue Index ${i}: "${target.name}" (influence: ${target.influence})`);
          }
        }
      }
      
      setHeadMorphIndices(headIndices);
      setTongueMorphIndices(tongueIndices);
      
      console.log('✅ [Index-Based] Morph target indices extracted successfully');
      
    } catch (error) {
      console.error('❌ [Index-Based] Error extracting morph target indices:', error);
    }
  };
  
  const testMorphByIndex = (meshType, index, intensity = testIntensity) => {
    try {
      if (!lipSyncRef.current || !lipSyncRef.current.scene) {
        console.warn('❌ [Index-Based] Babylon.js scene not available');
        return false;
      }
      
      const scene = lipSyncRef.current.scene;
      let mesh, manager;
      
      if (meshType === 'head') {
        mesh = scene.getMeshByName('CC_Game_Body');
        manager = mesh?.morphTargetManager;
      } else if (meshType === 'tongue') {
        mesh = scene.getMeshByName('CC_Game_Tongue');
        manager = mesh?.morphTargetManager;
      }
      
      if (!mesh || !manager) {
        console.warn(`⚠️ [Index-Based] ${meshType} mesh or manager not available`);
        return false;
      }
      
      // Reset all morph targets first
      resetAllIndexMorphs();
      
      const target = manager.getTarget(index);
      if (!target) {
        console.warn(`⚠️ [Index-Based] No morph target at index ${index} for ${meshType}`);
        return false;
      }
      
      // Set influence - following reference implementation pattern
      target.influence = intensity;
      
      console.log(`🎯 [Index-Based] Set ${meshType} index ${index} ("${target.name}") to ${intensity}`);
      
      // Force visual update
      forceUpdate();
      
      // Record test result
      const resultKey = `${meshType}_${index}`;
      setIndexTestResults(prev => ({
        ...prev,
        [resultKey]: {
          tested: true,
          visible: 'pending', // User needs to confirm visually
          morphName: target.name,
          intensity: intensity
        }
      }));
      
      return true;
      
    } catch (error) {
      console.error(`❌ [Index-Based] Error testing morph target:`, error);
      return false;
    }
  };
  
  const resetAllIndexMorphs = () => {
    try {
      if (!lipSyncRef.current || !lipSyncRef.current.scene) return;
      
      const scene = lipSyncRef.current.scene;
      
      // Reset head mesh
      const headMesh = scene.getMeshByName('CC_Game_Body');
      if (headMesh?.morphTargetManager) {
        const manager = headMesh.morphTargetManager;
        for (let i = 0; i < manager.numTargets; i++) {
          const target = manager.getTarget(i);
          if (target) {
            target.influence = 0;
          }
        }
      }
      
      // Reset tongue mesh
      const tongueMesh = scene.getMeshByName('CC_Game_Tongue');
      if (tongueMesh?.morphTargetManager) {
        const manager = tongueMesh.morphTargetManager;
        for (let i = 0; i < manager.numTargets; i++) {
          const target = manager.getTarget(i);
          if (target) {
            target.influence = 0;
          }
        }
      }
      
      forceUpdate();
      console.log('🔄 [Index-Based] Reset all morph targets to 0');
      
    } catch (error) {
      console.error('❌ [Index-Based] Error resetting morph targets:', error);
    }
  };

  const markIndexResult = (meshType, index, isVisible) => {
    const resultKey = `${meshType}_${index}`;
    setIndexTestResults(prev => ({
      ...prev,
      [resultKey]: {
        ...prev[resultKey],
        visible: isVisible
      }
    }));
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0,
        bottom: 0,
        display: 'grid',
        gridTemplateColumns: showLiveMorphTuning ? '420px 1fr 420px' : '420px 1fr',
        gap: '10px',
        padding: '10px',
        pointerEvents: 'none'
      }}>
        <div style={{ 
          backgroundColor: 'rgba(0,0,0,0.7)', 
          padding: '15px',
          borderRadius: '8px',
          color: 'white', 
          zIndex: 1,
          overflowY: 'auto',
          pointerEvents: 'auto'
        }}>
        <h1 style={{ margin: '0 0 15px 0', fontSize: '1.5em' }}>Tongue Morph Test</h1>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Select Viseme:</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {allVisemes.map(v => (
              <button
                key={v}
                onClick={() => {
                  console.log('Viseme button clicked:', v);
                  setViseme(v);
                  setSelectedVisemeForEdit(v);
                  ensureVisemeEdit(v);
                  // apply using the viseme-specific intensity if present
                  const vi = lipSyncRef.current?.getVisemeIntensities?.();
                  const perV = vi?.[v];
                  const applyIntensity = typeof perV === 'number' ? perV : intensity;
                  applyCurrentViseme(v, applyIntensity);
                }}
                style={{
                  padding: '5px 10px',
                  fontSize: '12px',
                  backgroundColor: viseme === v ? '#4CAF50' : '#555',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  minWidth: '40px'
                }}
              >
                {v}
              </button>
            ))}
          </div>
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
        
        <div style={{ marginBottom: '15px', borderTop: '1px solid #555', paddingTop: '15px' }}>
          <div style={{ marginBottom: '10px' }}>
            <button 
              onClick={startAutoTest}
              style={{ 
                marginRight: '10px', 
                padding: '5px 15px', 
                backgroundColor: autoTest ? '#666' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: autoTest ? 'default' : 'pointer'
              }}
              disabled={autoTest}
            >
              {autoTest ? `Auto Test (${currentTestIndex}/${allVisemes.length})` : 'Start Auto Test'}
            </button>
            <button 
              onClick={forceUpdate}
              style={{ 
                marginRight: '10px', 
                padding: '5px 15px', 
                backgroundColor: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Force Update
            </button>
            <button 
              onClick={showAvailableMorphs}
              style={{ 
                marginRight: '10px',
                padding: '5px 15px', 
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Show Morphs
            </button>
            <button 
              onClick={async () => {
                console.log('🔬 Running Viseme Debugger...');
                if (lipSyncRef.current && lipSyncRef.current.visemeCombinations) {
                  const glbUrl = '/assets/party-f-0013-fixed.glb';
                  const debugReport = await debugVisemes(glbUrl, lipSyncRef.current.visemeCombinations);
                  console.log('Debug Report:', debugReport);
                } else {
                  console.log('❌ LipSync not ready for debugging');
                }
              }}
              style={{ 
                padding: '5px 15px', 
                backgroundColor: '#9C27B0',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Debug Visemes
            </button>
            <button 
              onClick={async () => {
                console.log('🔬 Verifying Morph Names...');
                const glbUrl = '/assets/party-f-0013-fixed.glb';
                const morphData = await verifyMorphNames(glbUrl);
                const corrections = generateCorrectedMappings(morphData);
                setMorphCorrections(corrections);
                console.log('Morph Data:', morphData);
                console.log('Suggested Corrections:', corrections);
              }}
              style={{ 
                marginLeft: '10px',
                padding: '5px 15px', 
                backgroundColor: '#FF5722',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Verify Morphs
            </button>
            <button 
              onClick={() => {
                console.log('🧪 Testing Problematic Visemes...');
                if (lipSyncRef.current && lipSyncRef.current.testProblematicVisemes) {
                  lipSyncRef.current.testProblematicVisemes(2000);
                } else {
                  console.log('❌ Babylon.js system not ready');
                }
              }}
              style={{ 
                marginLeft: '10px',
                padding: '5px 15px', 
                backgroundColor: '#E91E63',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Test DD/SS/E Visemes
            </button>
            <button 
              onClick={() => {
                console.log('🧪 Testing All Visemes...');
                if (lipSyncRef.current && lipSyncRef.current.testAllVisemes) {
                  lipSyncRef.current.testAllVisemes(1500);
                } else {
                  console.log('❌ Babylon.js system not ready');
                }
              }}
              style={{ 
                marginLeft: '10px',
                padding: '5px 15px', 
                backgroundColor: '#00BCD4',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Test All Visemes
            </button>
          </div>
          
          {/* Canonical/Bilabial Testing Section */}
          <div style={{ marginTop: '20px', borderTop: '2px solid #FF5722', paddingTop: '15px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2em', color: '#FF5722', fontWeight: 'bold' }}>
              🎯 Canonical Viseme Testing
            </h3>
            
            <div style={{ 
              backgroundColor: 'rgba(255, 87, 34, 0.1)', 
              padding: '12px', 
              borderRadius: '6px',
              marginBottom: '15px'
            }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#FFA726' }}>
                <strong>Current Issue:</strong> PP viseme shows as "kiss/pucker" instead of pressed lips
              </p>
              
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    console.log('🔄 Toggling canonical mode...');
                    setIsUsingCanonical(!isUsingCanonical);
                    if (!isUsingCanonical && canonicalHandlerRef.current) {
                      // Apply canonical PP viseme
                      applyVisemeCanonical(canonicalHandlerRef.current, 'PP', intensity);
                      console.log('✅ Applied canonical PP viseme');
                    } else {
                      // Reset to normal
                      applyCurrentViseme(viseme, intensity);
                    }
                  }}
                  style={{ 
                    padding: '8px 16px', 
                    backgroundColor: isUsingCanonical ? '#4CAF50' : '#607D8B',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold'
                  }}
                >
                  {isUsingCanonical ? '✓ Canonical Mode ON' : 'Enable Canonical Mode'}
                </button>
                
                <button
                  onClick={() => {
                    if (canonicalHandlerRef.current) {
                      console.log('🧪 Applying canonical PP viseme...');
                      applyVisemeCanonical(canonicalHandlerRef.current, 'PP', intensity);
                      setViseme('PP');
                    } else {
                      console.warn('❌ Canonical handler not ready');
                    }
                  }}
                  style={{ 
                    padding: '8px 16px', 
                    backgroundColor: '#FF5722',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  Test Canonical PP
                </button>
                
                <button
                  onClick={async () => {
                    if (canonicalHandlerRef.current) {
                      console.log('🧪 Testing bilabial combinations...');
                      const results = await testBilabialCombinations(canonicalHandlerRef.current, 2000);
                      setBilabialTestResults(results);
                      console.log('Bilabial test results:', results);
                    }
                  }}
                  style={{ 
                    padding: '8px 16px', 
                    backgroundColor: '#9C27B0',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  Test All Bilabial Combinations
                </button>
                
                <button
                  onClick={() => {
                    if (morphFinderRef.current) {
                      console.log('🔍 Finding lip closure morphs...');
                      const candidates = morphFinderRef.current.findLipClosureMorphs();
                      console.log('Found candidates:', candidates);
                      // Test first candidate if found
                      if (candidates.length > 0) {
                        morphFinderRef.current.testMorph(candidates[0].name, 0.9);
                      }
                    }
                  }}
                  style={{ 
                    padding: '8px 16px', 
                    backgroundColor: '#00BCD4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  Find Lip Closure Morphs
                </button>
                
                <button
                  onClick={async () => {
                    if (morphFinderRef.current) {
                      console.log('🧪 Testing all morphs sequentially...');
                      await morphFinderRef.current.testAllMorphsSequentially(1500, 0.9);
                    }
                  }}
                  style={{ 
                    padding: '8px 16px', 
                    backgroundColor: '#FFC107',
                    color: 'black',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  Test All Morphs (Auto)
                </button>
              </div>
              
              {/* Manual Morph Testing */}
              <div style={{ marginTop: '15px', marginBottom: '15px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.0em', color: '#FF8A65' }}>
                  Manual Morph Testing:
                </h4>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Enter morph name (e.g., V_M, Mouth_M)"
                    id="morphNameInput"
                    style={{ 
                      padding: '6px 10px',
                      backgroundColor: '#333',
                      color: 'white',
                      border: '1px solid #666',
                      borderRadius: '4px',
                      flex: 1
                    }}
                  />
                  <button
                    onClick={() => {
                      if (morphFinderRef.current) {
                        const morphName = document.getElementById('morphNameInput').value;
                        if (morphName) {
                          console.log(`🎯 Testing morph: ${morphName}`);
                          const result = morphFinderRef.current.testMorph(morphName, 0.9);
                          if (!result) {
                            alert(`Morph "${morphName}" not found!`);
                          }
                        }
                      }
                    }}
                    style={{ 
                      padding: '6px 12px',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Test Morph
                  </button>
                  <button
                    onClick={() => {
                      if (morphFinderRef.current) {
                        morphFinderRef.current.resetAllMorphs();
                        console.log('✅ All morphs reset');
                      }
                    }}
                    style={{ 
                      padding: '6px 12px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Reset
                  </button>
                </div>
                
                {/* Quick test buttons for common morphs */}
                <div style={{ marginTop: '10px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {['M', 'V_M', 'V_PP', 'Mouth_M', 'Mouth_Close', 'V_Lips', 'V_Tight', 'Mouth_Pucker'].map(morphName => (
                    <button
                      key={morphName}
                      onClick={() => {
                        if (morphFinderRef.current) {
                          console.log(`🎯 Testing ${morphName}`);
                          morphFinderRef.current.testMorph(morphName, 0.9);
                        }
                      }}
                      style={{ 
                        padding: '4px 8px',
                        backgroundColor: '#795548',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '11px'
                      }}
                    >
                      {morphName}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Bilabial Test Combinations */}
              <div style={{ marginBottom: '15px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.0em', color: '#FF8A65' }}>
                  Test Individual Bilabial Combinations:
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {BILABIAL_TEST_COMBINATIONS.map((combo, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (canonicalHandlerRef.current) {
                          console.log(`Testing bilabial combo ${idx + 1}:`, combo.description);
                          canonicalHandlerRef.current.resetAll();
                          combo.morphs.forEach(([morph, weight]) => {
                            canonicalHandlerRef.current.applyMorph(morph, weight);
                          });
                          setCurrentBilabialTest(idx);
                        }
                      }}
                      style={{ 
                        padding: '6px 10px', 
                        backgroundColor: currentBilabialTest === idx ? '#4CAF50' : '#795548',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                        Combo {idx + 1}
                      </div>
                      <div style={{ fontSize: '10px' }}>
                        {combo.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Test Results Display */}
              {Object.keys(bilabialTestResults).length > 0 && (
                <div style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                  padding: '10px', 
                  borderRadius: '4px'
                }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '1.0em' }}>Test Results:</h4>
                  {Object.entries(bilabialTestResults).map(([desc, result]) => (
                    <div key={desc} style={{ 
                      fontSize: '11px', 
                      marginBottom: '4px',
                      color: result.visible ? '#4CAF50' : '#FFC107'
                    }}>
                      {result.visible ? '✓' : '⏳'} {desc}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Current Canonical PP Mapping */}
              <div style={{ 
                backgroundColor: 'rgba(76, 175, 80, 0.1)', 
                padding: '10px', 
                borderRadius: '4px',
                marginTop: '10px'
              }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.0em', color: '#4CAF50' }}>
                  Current Canonical PP Mapping:
                </h4>
                <div style={{ fontSize: '12px' }}>
                  <code style={{ color: '#81C784' }}>
                    V_M: 0.9 (Primary bilabial closure)<br/>
                    Mouth_Narrow: 0.3 (Slight narrowing)<br/>
                    Jaw_Open: -0.1 (Slight jaw closure)
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Index-Based Testing Section */}
          <div style={{ marginTop: '20px', borderTop: '2px solid #4CAF50', paddingTop: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2em', color: '#4CAF50', fontWeight: 'bold' }}>
                🔬 Index-Based Morph Testing
              </h3>
              <button
                onClick={() => setShowIndexTesting(!showIndexTesting)}
                style={{ 
                  padding: '5px 12px', 
                  backgroundColor: showIndexTesting ? '#4CAF50' : '#607D8B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {showIndexTesting ? 'Hide' : 'Show'} Index Testing
              </button>
            </div>

            {showIndexTesting && (
              <div style={{ backgroundColor: 'rgba(76, 175, 80, 0.1)', padding: '15px', borderRadius: '8px' }}>
                <div style={{ 
                  backgroundColor: 'rgba(255, 193, 7, 0.2)', 
                  border: '1px solid #FFC107', 
                  borderRadius: '6px', 
                  padding: '12px', 
                  marginBottom: '15px' 
                }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#F57F17', fontSize: '1.0em', fontWeight: 'bold' }}>
                    🎯 Reference Implementation Testing
                  </h4>
                  <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.4', color: '#F57F17' }}>
                    This section tests morph targets using INDEX-based access, following the working pattern from the 
                    crazyramirez/readyplayer-talk reference implementation. This approach bypasses potential name-matching 
                    issues by directly accessing morphs by their index position.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                  <button 
                    onClick={extractMorphTargetIndices}
                    style={{ 
                      padding: '8px 16px', 
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 'bold'
                    }}
                  >
                    🔍 Extract All Morph Indices
                  </button>
                  <button 
                    onClick={resetAllIndexMorphs}
                    style={{ 
                      padding: '8px 16px', 
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    🔄 Reset All Morphs
                  </button>
                </div>

                {(headMorphIndices.length > 0 || tongueMorphIndices.length > 0) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    {/* Head Mesh Testing */}
                    <div style={{ 
                      border: '2px solid #2196F3', 
                      borderRadius: '8px', 
                      padding: '12px',
                      backgroundColor: 'rgba(33, 150, 243, 0.05)'
                    }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#1976D2', fontSize: '1.0em', fontWeight: 'bold' }}>
                        👤 Head Mesh ({headMorphIndices.length})
                      </h4>
                      
                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                          Test Index:
                        </label>
                        <select
                          value={selectedMeshForTest === 'head' ? selectedIndexForTest : 0}
                          onChange={(e) => {
                            setSelectedMeshForTest('head');
                            setSelectedIndexForTest(Number(e.target.value));
                          }}
                          style={{ 
                            width: '100%', 
                            padding: '4px', 
                            backgroundColor: '#333', 
                            color: 'white', 
                            border: '1px solid #666', 
                            borderRadius: '4px',
                            fontSize: '11px'
                          }}
                        >
                          {headMorphIndices.map((morphData, index) => (
                            <option key={index} value={index}>
                              Index {index}: {morphData?.name || 'Unknown'}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                          Intensity: {testIntensity.toFixed(2)}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={testIntensity}
                          onChange={(e) => setTestIntensity(Number(e.target.value))}
                          style={{ width: '100%' }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
                        <button
                          onClick={() => {
                            setSelectedMeshForTest('head');
                            testMorphByIndex('head', selectedMeshForTest === 'head' ? selectedIndexForTest : 0, testIntensity);
                          }}
                          style={{ 
                            flex: 1,
                            padding: '4px 8px', 
                            backgroundColor: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          🧪 Test
                        </button>
                        <button
                          onClick={() => markIndexResult('head', selectedMeshForTest === 'head' ? selectedIndexForTest : 0, true)}
                          style={{ 
                            padding: '4px 8px', 
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => markIndexResult('head', selectedMeshForTest === 'head' ? selectedIndexForTest : 0, false)}
                          style={{ 
                            padding: '4px 8px', 
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          ✗
                        </button>
                      </div>

                      {/* Head Results */}
                      {Object.keys(indexTestResults).filter(key => key.startsWith('head_')).length > 0 && (
                        <div style={{ 
                          padding: '8px', 
                          backgroundColor: 'rgba(255,255,255,0.1)', 
                          borderRadius: '4px',
                          fontSize: '10px'
                        }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Results:</div>
                          {Object.entries(indexTestResults)
                            .filter(([key]) => key.startsWith('head_'))
                            .map(([key, result]) => (
                              <div key={key} style={{ 
                                color: result.visible === true ? '#4CAF50' : result.visible === false ? '#f44336' : '#FFC107',
                                marginBottom: '2px'
                              }}>
                                {result.visible === true ? '✓' : result.visible === false ? '✗' : '⏳'} 
                                Index {key.split('_')[1]}: {result.morphName}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Tongue Mesh Testing */}
                    <div style={{ 
                      border: '2px solid #FF5722', 
                      borderRadius: '8px', 
                      padding: '12px',
                      backgroundColor: 'rgba(255, 87, 34, 0.05)'
                    }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#D84315', fontSize: '1.0em', fontWeight: 'bold' }}>
                        👅 Tongue Mesh ({tongueMorphIndices.length})
                      </h4>
                      
                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                          Test Index:
                        </label>
                        <select
                          value={selectedMeshForTest === 'tongue' ? selectedIndexForTest : 0}
                          onChange={(e) => {
                            setSelectedMeshForTest('tongue');
                            setSelectedIndexForTest(Number(e.target.value));
                          }}
                          style={{ 
                            width: '100%', 
                            padding: '4px', 
                            backgroundColor: '#333', 
                            color: 'white', 
                            border: '1px solid #666', 
                            borderRadius: '4px',
                            fontSize: '11px'
                          }}
                        >
                          {tongueMorphIndices.map((morphData, index) => (
                            <option key={index} value={index}>
                              Index {index}: {morphData?.name || 'Unknown'}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                          Intensity: {testIntensity.toFixed(2)}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={testIntensity}
                          onChange={(e) => setTestIntensity(Number(e.target.value))}
                          style={{ width: '100%' }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
                        <button
                          onClick={() => {
                            setSelectedMeshForTest('tongue');
                            testMorphByIndex('tongue', selectedMeshForTest === 'tongue' ? selectedIndexForTest : 0, testIntensity);
                          }}
                          style={{ 
                            flex: 1,
                            padding: '4px 8px', 
                            backgroundColor: '#FF5722',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          🧪 Test
                        </button>
                        <button
                          onClick={() => markIndexResult('tongue', selectedMeshForTest === 'tongue' ? selectedIndexForTest : 0, true)}
                          style={{ 
                            padding: '4px 8px', 
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => markIndexResult('tongue', selectedMeshForTest === 'tongue' ? selectedIndexForTest : 0, false)}
                          style={{ 
                            padding: '4px 8px', 
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          ✗
                        </button>
                      </div>

                      {/* Tongue Results */}
                      {Object.keys(indexTestResults).filter(key => key.startsWith('tongue_')).length > 0 && (
                        <div style={{ 
                          padding: '8px', 
                          backgroundColor: 'rgba(255,255,255,0.1)', 
                          borderRadius: '4px',
                          fontSize: '10px'
                        }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Results:</div>
                          {Object.entries(indexTestResults)
                            .filter(([key]) => key.startsWith('tongue_'))
                            .map(([key, result]) => (
                              <div key={key} style={{ 
                                color: result.visible === true ? '#4CAF50' : result.visible === false ? '#f44336' : '#FFC107',
                                marginBottom: '2px'
                              }}>
                                {result.visible === true ? '✓' : result.visible === false ? '✗' : '⏳'} 
                                Index {key.split('_')[1]}: {result.morphName}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Camera Control Section */}
          <div style={{ marginBottom: '15px', borderTop: '1px solid #555', paddingTop: '15px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1em', color: '#FF9800' }}>Camera Controls</h3>
            <div style={{ marginBottom: '10px' }}>
              <button 
                onClick={() => {
                  if (lipSyncRef.current && lipSyncRef.current.captureCameraPosition) {
                    console.log('📸 Capturing camera position...');
                    lipSyncRef.current.captureCameraPosition();
                  } else {
                    console.log('❌ Camera system not ready');
                  }
                }}
                style={{ 
                  marginRight: '10px', 
                  padding: '5px 15px', 
                  backgroundColor: '#FF5722',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                📸 Capture Position
              </button>
              <button 
                onClick={() => {
                  if (lipSyncRef.current && lipSyncRef.current.logCameraPosition) {
                    console.log('📹 Logging current camera position...');
                    lipSyncRef.current.logCameraPosition(true);
                  } else {
                    console.log('❌ Camera system not ready');
                  }
                }}
                style={{ 
                  marginRight: '10px', 
                  padding: '5px 15px', 
                  backgroundColor: '#9C27B0',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                📹 Log Position
              </button>
              <button 
                onClick={() => {
                  if (lipSyncRef.current && lipSyncRef.current.toggleCameraMonitoring) {
                    console.log('📹 Toggling camera monitoring...');
                    lipSyncRef.current.toggleCameraMonitoring();
                  } else {
                    console.log('❌ Camera system not ready');
                  }
                }}
                style={{ 
                  marginRight: '10px', 
                  padding: '5px 15px', 
                  backgroundColor: '#607D8B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                📹 Toggle Monitor
              </button>
              <button 
                onClick={() => {
                  if (lipSyncRef.current && lipSyncRef.current.resetCameraToFacePosition) {
                    console.log('🎯 Resetting camera to optimal face position...');
                    lipSyncRef.current.resetCameraToFacePosition();
                  } else {
                    console.log('❌ Camera system not ready');
                  }
                }}
                style={{ 
                  padding: '5px 15px', 
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                🎯 Reset to Face
              </button>
            </div>
            <div style={{ fontSize: '11px', color: '#aaa', lineHeight: '1.3' }}>
              <strong>Keyboard shortcuts:</strong><br/>
              • <code>Ctrl+C</code>: Capture camera position<br/>
              • <code>Ctrl+M</code>: Toggle continuous monitoring<br/>
              • <code>Ctrl+L</code>: Log current position
            </div>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Test Results:</label>
            <div style={{ fontSize: '12px' }}>
              {allVisemes.map(v => (
                <span key={v} style={{ 
                  marginRight: '8px',
                  padding: '2px 6px',
                  backgroundColor: testResults[v] === true ? '#4CAF50' : testResults[v] === false ? '#f44336' : '#666',
                  borderRadius: '3px'
                }}>
                  {v} {testResults[v] === true ? '✓' : testResults[v] === false ? '✗' : '?'}
                </span>
              ))}
            </div>
            <div style={{ marginTop: '5px', fontSize: '11px', color: '#ccc' }}>
              Manual marking:
              <button onClick={() => markVisemeResult(viseme, true)} style={{ marginLeft: '5px', padding: '1px 5px', fontSize: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none' }}>✓ Working</button>
              <button onClick={() => markVisemeResult(viseme, false)} style={{ marginLeft: '5px', padding: '1px 5px', fontSize: '10px', backgroundColor: '#f44336', color: 'white', border: 'none' }}>✗ Not Working</button>
            </div>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Applied Morphs ({appliedMorphs.length}):</label>
            <div style={{ fontSize: '11px', maxHeight: '80px', overflowY: 'auto', backgroundColor: 'rgba(255,255,255,0.1)', padding: '5px', borderRadius: '3px' }}>
              {appliedMorphs.length > 0 ? appliedMorphs.map((morph, idx) => (
                <div key={idx}>
                  {morph.morph}: {morph.weight}
                </div>
              )) : 'No morphs applied'}
            </div>
          </div>
          
          {availableMorphs && (
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Available Morph Targets:</label>
              <div style={{ fontSize: '10px', maxHeight: '120px', overflowY: 'auto', backgroundColor: 'rgba(255,255,255,0.1)', padding: '5px', borderRadius: '3px' }}>
                {availableMorphs.CC_Game_Tongue && (
                  <div>
                    <strong>Tongue ({availableMorphs.CC_Game_Tongue.length}):</strong>
                    <div>{availableMorphs.CC_Game_Tongue.join(', ')}</div>
                  </div>
                )}
                {availableMorphs.CC_Game_Body && (
                  <div style={{ marginTop: '5px' }}>
                    <strong>Body ({availableMorphs.CC_Game_Body.length}):</strong>
                    <div>{availableMorphs.CC_Game_Body.join(', ')}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {morphCorrections && (
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Morph Name Corrections:</label>
              <div style={{ fontSize: '10px', maxHeight: '100px', overflowY: 'auto', backgroundColor: 'rgba(255,255,255,0.1)', padding: '5px', borderRadius: '3px' }}>
                {Object.entries(morphCorrections).map(([intended, actual]) => (
                  <div key={intended}>
                    {intended} → {actual}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* morphTargetInfluences Test Section */}
          {morphInfluencesTest && (
            <div style={{ marginBottom: '10px', borderTop: '1px solid #555', paddingTop: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>morphTargetInfluences Test System:</label>
              <div style={{ marginBottom: '8px' }}>
                <button 
                  onClick={() => {
                    if (morphInfluencesTest) {
                      console.log('🧪 Testing morphTargetInfluences with viseme:', viseme);
                      const morphs = actorCoreVisemeCombinations[viseme];
                      if (morphs) {
                        const success = morphInfluencesTest.applyViseme(viseme, morphs);
                        setInfluencesTestResults(prev => ({
                          ...prev,
                          [viseme]: success ? 'success' : 'failed'
                        }));
                        
                        // Show current state
                        const currentState = morphInfluencesTest.getCurrentMorphState();
                        console.log('Current morph state:', currentState);
                      } else {
                        console.warn('No morph data for viseme:', viseme);
                      }
                    }
                  }}
                  style={{ 
                    marginRight: '8px',
                    padding: '4px 12px', 
                    backgroundColor: '#00BCD4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Test {viseme} with morphTargetInfluences
                </button>
                <button 
                  onClick={() => {
                    if (morphInfluencesTest) {
                      morphInfluencesTest.resetAllMorphs();
                      console.log('🔄 Reset all morphTargetInfluences to 0');
                    }
                  }}
                  style={{ 
                    marginRight: '8px',
                    padding: '4px 12px', 
                    backgroundColor: '#607D8B',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Reset Influences
                </button>
                <button 
                  onClick={() => {
                    if (morphInfluencesTest) {
                      const currentState = morphInfluencesTest.getCurrentMorphState();
                      console.log('📊 Current morphTargetInfluences state:', currentState);
                    }
                  }}
                  style={{ 
                    padding: '4px 12px', 
                    backgroundColor: '#795548',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Show State
                </button>
              </div>
              
              <div style={{ fontSize: '11px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '5px', borderRadius: '3px' }}>
                <strong>Influences Test Results:</strong>
                <div style={{ marginTop: '3px' }}>
                  {allVisemes.map(v => (
                    <span key={v} style={{ 
                      marginRight: '6px',
                      padding: '1px 4px',
                      backgroundColor: influencesTestResults[v] === 'success' ? '#4CAF50' : influencesTestResults[v] === 'failed' ? '#f44336' : '#666',
                      borderRadius: '2px',
                      fontSize: '10px'
                    }}>
                      {v} {influencesTestResults[v] === 'success' ? '✓' : influencesTestResults[v] === 'failed' ? '✗' : '?'}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Light UI: Viseme Override Editor */}
          <div style={{ marginTop: '10px', borderTop: '1px solid #555', paddingTop: '10px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1em' }}>Viseme Overrides</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <label>Edit Viseme:</label>
              <select
                value={selectedVisemeForEdit}
                onChange={(e) => { setSelectedVisemeForEdit(e.target.value); ensureVisemeEdit(e.target.value); }}
                style={{ background: '#333', color: 'white', border: '1px solid #666', padding: '4px' }}
              >
                {allVisemes.map(v => (<option key={v} value={v}>{v}</option>))}
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: '#ccc' }}>Viseme Intensity</span>
                <input
                  type="range"
                  min="0" max="1" step="0.01"
                  value={(lipSyncRef.current?.getVisemeIntensities?.()[selectedVisemeForEdit]) ?? 1}
                  onChange={(e) => {
                    lipSyncRef.current?.setVisemeIntensity?.(selectedVisemeForEdit, e.target.value);
                    setIntensityRefresh(x => x + 1);
                  }}
                  style={{ width: '120px' }}
                />
                <span style={{ width: '36px', textAlign: 'right' }}>{(((lipSyncRef.current?.getVisemeIntensities?.()[selectedVisemeForEdit])) ?? 1).toFixed(2)}</span>
                <button
                  onClick={() => {
                    lipSyncRef.current?.resetVisemeIntensity?.(selectedVisemeForEdit);
                    setIntensityRefresh(x => x + 1);
                    const vi = lipSyncRef.current?.getVisemeIntensities?.();
                    const perV = vi?.[selectedVisemeForEdit];
                    const applyIntensity = typeof perV === 'number' ? perV : intensity;
                    applyCurrentViseme(selectedVisemeForEdit, applyIntensity);
                  }}
                  style={{ padding: '3px 8px', background: '#777', color: 'white', border: 'none', borderRadius: '3px' }}
                >
                  Reset Intensity
                </button>
              </div>
              <button onClick={addMorphToViseme} style={{ padding: '4px 8px', background: '#607D8B', color: 'white', border: 'none', borderRadius: '3px' }}>+ Add Morph</button>
              <button onClick={applyVisemeOverrides} style={{ padding: '4px 8px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '3px' }}>Apply</button>
              <button onClick={resetCurrentVisemeToDefault} style={{ padding: '4px 8px', background: '#9E9E9E', color: 'white', border: 'none', borderRadius: '3px' }}>Reset Viseme</button>
            </div>

            <div style={{ maxHeight: '160px', overflowY: 'auto', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '4px' }}>
              {(visemeEdits[selectedVisemeForEdit] || []).map((entry, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <input
                    value={entry.morph}
                    onChange={(e) => updateVisemeEntry(idx, 'morph', e.target.value)}
                    placeholder="Morph name (resolved at apply)"
                    style={{ flex: 2, background: '#222', color: 'white', border: '1px solid #555', padding: '3px' }}
                  />
                  <input
                    type="range"
                    min="0" max="1" step="0.01"
                    value={entry.weight}
                    onChange={(e) => updateVisemeEntry(idx, 'weight', e.target.value)}
                    style={{ flex: 3 }}
                  />
                  <span style={{ width: '40px', textAlign: 'right' }}>{(entry.weight ?? 0).toFixed(2)}</span>
                  <button onClick={() => removeVisemeEntry(idx)} style={{ padding: '3px 6px', background: '#f44336', color: 'white', border: 'none', borderRadius: '3px' }}>Remove</button>
                </div>
              ))}
              {(!visemeEdits[selectedVisemeForEdit] || visemeEdits[selectedVisemeForEdit].length === 0) && (
                <div style={{ color: '#bbb', fontSize: '12px' }}>No overrides yet. Click "+ Add Morph" to add entries, or change the viseme to seed from current mapping.</div>
              )}
            </div>

            {/* Profile save/load */}
            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label>Profile name:</label>
              <input value={profileName} onChange={(e) => setProfileName(e.target.value)} style={{ background: '#222', color: 'white', border: '1px solid #555', padding: '3px' }} />
              <button onClick={() => {
                // sync current per-viseme intensity before export
                // nothing needed: exportProfile reads directly from the engine
                exportProfile();
              }} style={{ padding: '4px 8px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '3px' }}>Export</button>
              <label style={{ cursor: 'pointer', background: '#FF9800', color: 'white', borderRadius: '3px', padding: '4px 8px' }}>
                Import
                <input type="file" accept="application/json" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && importProfileFromFile(e.target.files[0])} />
              </label>
              <button onClick={resetAllVisemes} style={{ padding: '4px 8px', background: '#9C27B0', color: 'white', border: 'none', borderRadius: '3px' }}>Reset All</button>
            </div>
          </div>

          {/* Live Morph Tuning Toggle and Section */}
          <div style={{ marginTop: '15px', borderTop: '1px solid #555', paddingTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <button 
                onClick={() => setShowLiveMorphTuning(!showLiveMorphTuning)}
                style={{ 
                  padding: '8px 15px', 
                  backgroundColor: showLiveMorphTuning ? '#4CAF50' : '#555',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                {showLiveMorphTuning ? '🔽 Hide Live Morph Tuning' : '▶️ Show Live Morph Tuning'}
              </button>
              <span style={{ marginLeft: '10px', fontSize: '12px', color: '#aaa' }}>
                Toggle advanced morph control panel
              </span>
            </div>
            
            {showLiveMorphTuning && (
              <div style={{ 
                backgroundColor: 'rgba(255,255,255,0.05)', 
                padding: '10px', 
                borderRadius: '5px',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1em', color: '#4CAF50' }}>Live Morph Tuning</h3>
                {allMorphNames.map(morphName => (
                  <div key={morphName} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <label style={{ marginRight: '10px', minWidth: '120px', fontSize: '11px', color: '#ddd' }}>{morphName}</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={morphWeights[morphName] || 0}
                      onChange={(e) => handleMorphChange(morphName, parseFloat(e.target.value))}
                      style={{ flexGrow: 1, margin: '0 8px' }}
                    />
                    <span style={{ fontSize: '10px', minWidth: '35px', textAlign: 'right', color: '#bbb' }}>
                      {(morphWeights[morphName] || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>
        <div></div>
        {showLiveMorphTuning && (
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: '15px',
            borderRadius: '8px',
            color: 'white',
            zIndex: 1,
            maxHeight: '95vh',
            overflowY: 'auto',
            pointerEvents: 'auto'
          }}>
            <h2 style={{ margin: '0 0 15px 0', fontSize: '1.2em' }}>Live Morph Tuning - Extended View</h2>
            {allMorphNames.map(morphName => (
              <div key={morphName} style={{ marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                <label style={{ marginRight: '10px', minWidth: '150px', fontSize: '12px' }}>{morphName}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={morphWeights[morphName] || 0}
                  onChange={(e) => handleMorphChange(morphName, parseFloat(e.target.value))}
                  style={{ flexGrow: 1 }}
                />
                <span style={{ marginLeft: '10px', fontSize: '12px' }}>{(morphWeights[morphName] || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TongueMorphTestPage;
