/**
 * Enhanced ActorCore Lip Sync System with Advanced Debugging
 * This version includes comprehensive debugging to identify why morph targets aren't visually updating
 */

import * as THREE from 'three';
import extractedMorphTargets from '../../../scripts/extracted-morph-targets.json';

// Conv-AI's proven viseme mapping
const VisemeMap = {
  0: 'sil',   // silence
  1: 'PP',    // bilabial plosives (p, b, m)
  2: 'FF',    // labiodental fricatives (f, v)
  3: 'TH',    // dental fricatives (th)
  4: 'DD',    // alveolar plosives (t, d, n, l)
  5: 'KK',    // velar plosives (k, g)
  6: 'CH',    // postalveolar affricates (ch, j)
  7: 'SS',    // alveolar fricatives (s, z)
  8: 'NN',    // nasal consonants (n, ng)
  9: 'RR',    // liquids (r)
  10: 'AA',   // open vowels (a)
  11: 'E',    // front vowels (e)
  12: 'I',    // close front vowels (i)
  13: 'O',    // back vowels (o)
  14: 'U',    // close back vowels (u)
};

/**
 * Create mapping from Conv-AI morph target names to our actual CC4 names
 */
function createMorphTargetMapping() {
  const availableTargets = extractedMorphTargets.morphTargetNames;
  const mapping = {};
  
  // Define mapping from Conv-AI names to potential CC4 names
  const nameMap = {
    // Jaw controls
    'Mouth_Drop_Lower': ['Jaw_Open'],
    'Open_Jaw': ['Jaw_Open'],
    
    // Mouth controls
    'Mouth_Smile_L': ['Mouth_Smile_L'],
    'Mouth_Smile_R': ['Mouth_Smile_R'],
    'Mouth_Frown_L': ['Mouth_Frown_L'],
    'Mouth_Frown_R': ['Mouth_Frown_R'],
    'Mouth_Stretch_L': ['Mouth_Stretch_L'],
    'Mouth_Stretch_R': ['Mouth_Stretch_R'],
    'Mouth_Press_L': ['Mouth_Press_L'],
    'Mouth_Press_R': ['Mouth_Press_R'],
    'Mouth_Pucker': ['Mouth_Pucker'],
    'Mouth_Funnel': ['Mouth_Funnel'],
    'Mouth_Roll_In_Upper': ['Mouth_Roll_In_Upper'],
    'Mouth_Roll_In_Lower': ['Mouth_Roll_In_Lower'],
    'Mouth_Shrug_Upper': ['Mouth_Shrug_Upper'],
    'Mouth_Shrug_Lower': ['Mouth_Shrug_Lower'],
    'Mouth_Up_Upper_L': ['Mouth_Up_Upper_L'],
    'Mouth_Up_Upper_R': ['Mouth_Up_Upper_R'],
    'Mouth_Down_Lower_L': ['Mouth_Down_Lower_L'],
    'Mouth_Down_Lower_R': ['Mouth_Down_Lower_R'],
    
    // Tongue controls
    'Tongue_Out': ['Tongue_Out'],
    'Tongue_Up': ['Tongue_Up', 'Tongue_up'], // Handle both variants
    'Tongue_Down': ['Tongue_Down'],
    'Tongue_L': ['Tongue_L'],
    'Tongue_R': ['Tongue_R'],
    'Tongue_Roll': ['Tongue_Roll'],
    'Tongue_Curl': ['Tongue_Curl'],
    'Tongue_Wide': ['Tongue_Wide'],
    'Tongue_Narrow': ['Tongue_Narrow'],
    'Tongue_Tip_Up': ['Tongue_Tip_Up'],
    'Tongue_Tip_Down': ['Tongue_Tip_Down'],
    
    // Cheek controls
    'Cheek_Puff_L': ['Cheek_Puff_L'],
    'Cheek_Puff_R': ['Cheek_Puff_R'],
    
    // Jaw movement
    'Jaw_Forward': ['Jaw_Forward'],
    'Jaw_L': ['Jaw_L'],
    'Jaw_R': ['Jaw_R'],
  };
  
  // Find the first existing morph target name for each Conv-AI name
  for (const [convaiName, candidates] of Object.entries(nameMap)) {
    for (const candidate of candidates) {
      if (availableTargets.includes(candidate)) {
        mapping[convaiName] = candidate;
        break;
      }
    }
  }
  
  return mapping;
}

// Create the mapping once
const MORPH_MAPPING = createMorphTargetMapping();

/**
 * Enhanced Reallusion morph target configurations using our actual CC4 names
 * Based on Conv-AI's proven values but mapped to our available morph targets
 */
export const EnhancedReallusion = {
  sil: {
    // Silence - all targets at rest
  },
  
  PP: {
    // Bilabial plosives (p, b, m) - lips pressed together
    [MORPH_MAPPING['Open_Jaw']]: 0.1,
    [MORPH_MAPPING['Mouth_Press_L']]: 0.5,
    [MORPH_MAPPING['Mouth_Press_R']]: 0.5,
  },
  
  FF: {
    // Labiodental fricatives (f, v) - lower lip to upper teeth
    [MORPH_MAPPING['Mouth_Up_Upper_L']]: 0.25,
    [MORPH_MAPPING['Mouth_Up_Upper_R']]: 0.25,
    [MORPH_MAPPING['Mouth_Down_Lower_L']]: 0.2,
    [MORPH_MAPPING['Mouth_Down_Lower_R']]: 0.2,
  },
  
  TH: {
    // Dental fricatives (th) - tongue between teeth
    [MORPH_MAPPING['Mouth_Drop_Lower']]: 0.2,
    [MORPH_MAPPING['Mouth_Shrug_Upper']]: 0.25,
    [MORPH_MAPPING['Mouth_Stretch_L']]: 0.1,
    [MORPH_MAPPING['Mouth_Stretch_R']]: 0.1,
    [MORPH_MAPPING['Tongue_Out']]: 1.0,
    [MORPH_MAPPING['Open_Jaw']]: 0.12,
    [MORPH_MAPPING['Tongue_Up']]: 0.22,
  },
  
  DD: {
    // Alveolar plosives (t, d, n, l) - tongue to alveolar ridge
    [MORPH_MAPPING['Mouth_Shrug_Upper']]: 0.35,
    [MORPH_MAPPING['Mouth_Stretch_L']]: 0.35,
    [MORPH_MAPPING['Mouth_Stretch_R']]: 0.35,
    [MORPH_MAPPING['Open_Jaw']]: 0.07,
    [MORPH_MAPPING['Tongue_Up']]: 0.22,
  },
  
  KK: {
    // Velar plosives (k, g) - back of tongue to soft palate
    [MORPH_MAPPING['Mouth_Drop_Lower']]: 0.6,
    [MORPH_MAPPING['Mouth_Shrug_Upper']]: 0.1,
    [MORPH_MAPPING['Open_Jaw']]: 0.06,
  },
  
  CH: {
    // Postalveolar affricates (ch, j) - tongue blade to post-alveolar
    [MORPH_MAPPING['Mouth_Drop_Lower']]: 0.4,
    [MORPH_MAPPING['Mouth_Down_Lower_L']]: 0.22,
    [MORPH_MAPPING['Mouth_Down_Lower_R']]: 0.22,
    [MORPH_MAPPING['Open_Jaw']]: 0.06,
    [MORPH_MAPPING['Tongue_Up']]: 0.22,
  },
  
  SS: {
    // Alveolar fricatives (s, z) - tongue tip near alveolar ridge
    [MORPH_MAPPING['Mouth_Shrug_Upper']]: 0.3,
    [MORPH_MAPPING['Mouth_Drop_Lower']]: 0.85,
    [MORPH_MAPPING['Mouth_Smile_L']]: 0.27,
    [MORPH_MAPPING['Mouth_Smile_R']]: 0.27,
    [MORPH_MAPPING['Open_Jaw']]: 0.05,
  },
  
  NN: {
    // Nasal consonants (n, ng) - tongue blocks oral airflow
    [MORPH_MAPPING['Mouth_Drop_Lower']]: 0.5,
    [MORPH_MAPPING['Mouth_Down_Lower_L']]: 0.22,
    [MORPH_MAPPING['Mouth_Down_Lower_R']]: 0.22,
    [MORPH_MAPPING['Open_Jaw']]: 0.08,
    [MORPH_MAPPING['Tongue_Up']]: 0.22,
  },
  
  RR: {
    // Liquids (r) - tongue tip curled or bunched
    [MORPH_MAPPING['Mouth_Up_Upper_L']]: 0.2,
    [MORPH_MAPPING['Mouth_Up_Upper_R']]: 0.2,
    [MORPH_MAPPING['Mouth_Drop_Lower']]: 0.1,
    [MORPH_MAPPING['Mouth_Down_Lower_L']]: 0.22,
    [MORPH_MAPPING['Mouth_Down_Lower_R']]: 0.22,
    [MORPH_MAPPING['Open_Jaw']]: 0.05,
    [MORPH_MAPPING['Tongue_Up']]: 0.2,
    [MORPH_MAPPING['Tongue_Curl']]: 0.5,
  },
  
  AA: {
    // Open vowels (a) - jaw open, tongue low
    [MORPH_MAPPING['Mouth_Drop_Lower']]: 0.2,
    [MORPH_MAPPING['Mouth_Frown_L']]: 0.2,
    [MORPH_MAPPING['Mouth_Frown_R']]: 0.2,
    [MORPH_MAPPING['Open_Jaw']]: 0.2,
  },
  
  E: {
    // Front vowels (e) - tongue forward and high
    [MORPH_MAPPING['Mouth_Shrug_Upper']]: 0.2,
    [MORPH_MAPPING['Mouth_Drop_Lower']]: 0.2,
    [MORPH_MAPPING['Mouth_Down_Lower_L']]: 0.3,
    [MORPH_MAPPING['Mouth_Down_Lower_R']]: 0.3,
    [MORPH_MAPPING['Mouth_Smile_L']]: 0.3,
    [MORPH_MAPPING['Mouth_Smile_R']]: 0.3,
    [MORPH_MAPPING['Open_Jaw']]: 0.09,
  },
  
  I: {
    // Close front vowels (i) - tongue high and forward
    [MORPH_MAPPING['Mouth_Shrug_Upper']]: 0.2,
    [MORPH_MAPPING['Mouth_Drop_Lower']]: 0.21,
    [MORPH_MAPPING['Mouth_Down_Lower_L']]: 0.2,
    [MORPH_MAPPING['Mouth_Down_Lower_R']]: 0.2,
    [MORPH_MAPPING['Open_Jaw']]: 0.1,
    [MORPH_MAPPING['Mouth_Frown_L']]: 0.15,
    [MORPH_MAPPING['Mouth_Frown_R']]: 0.15,
    [MORPH_MAPPING['Tongue_Up']]: 0.2,
    [MORPH_MAPPING['Tongue_Out']]: 0.2,
  },
  
  O: {
    // Back vowels (o) - lips rounded, tongue back
    [MORPH_MAPPING['Mouth_Shrug_Upper']]: 0.3,
    [MORPH_MAPPING['Mouth_Drop_Lower']]: 0.2,
    [MORPH_MAPPING['Mouth_Down_Lower_L']]: 0.3,
    [MORPH_MAPPING['Mouth_Down_Lower_R']]: 0.3,
    [MORPH_MAPPING['Mouth_Smile_L']]: 0.3,
    [MORPH_MAPPING['Mouth_Smile_R']]: 0.3,
    [MORPH_MAPPING['Open_Jaw']]: 0.12,
    [MORPH_MAPPING['Mouth_Pucker']]: 0.4,
  },
  
  U: {
    // Close back vowels (u) - lips rounded and protruded
    [MORPH_MAPPING['Mouth_Shrug_Lower']]: 0.1,
    [MORPH_MAPPING['Mouth_Up_Upper_L']]: 0.22,
    [MORPH_MAPPING['Mouth_Up_Upper_R']]: 0.22,
    [MORPH_MAPPING['Mouth_Down_Lower_L']]: 0.27,
    [MORPH_MAPPING['Mouth_Down_Lower_R']]: 0.27,
    [MORPH_MAPPING['Mouth_Pucker']]: 0.8,
    [MORPH_MAPPING['Open_Jaw']]: 0.11,
  },
};

/**
 * Enhanced VisemeToActorCore function
 * Converts viseme data to our actual CC4 morph target influences
 */
export const VisemeToActorCore = (viseme, blendShapeRef) => {
  if (typeof viseme === 'object') {
    const blendShape = {};
    
    // Initialize all available morph targets to 0
    Object.values(MORPH_MAPPING).forEach(morphName => {
      if (morphName) {
        blendShape[morphName] = 0;
      }
    });

    // Process each viseme in the input
    for (const key in viseme) {
      let visemeValue = viseme[key];
      
      // Conv-AI's special handling for viseme 1 (PP)
      if (key === '1' && visemeValue < 0.2) {
        visemeValue = visemeValue * 1.5;
      }

      // Get the corresponding blend shape configuration
      const currentBlend = EnhancedReallusion[VisemeMap[key]];
      
      if (currentBlend) {
        // Apply each morph target influence
        for (const morphTarget in currentBlend) {
          if (morphTarget && morphTarget !== 'undefined') {
            const blendValue = currentBlend[morphTarget] * visemeValue;
            blendShape[morphTarget] = (blendShape[morphTarget] || 0) + blendValue;
          }
        }
      }
    }

    // Push to the blend shape reference (Conv-AI pattern)
    if (blendShapeRef && blendShapeRef.current) {
      blendShapeRef.current.push(blendShape);
    }
    
    return blendShape;
  }
  return {};
};

/**
 * Enhanced lerp morph target function with comprehensive debugging
 */
export const lerpActorCoreMorphTargetDebug = (target, value, speed, model) => {
  const debugInfo = {
    target,
    value,
    speed,
    modelExists: !!model,
    skinnedMeshes: [],
    morphTargetsFound: [],
    actualUpdates: [],
    errors: []
  };

  if (!model || !target) {
    debugInfo.errors.push(`Missing model (${!!model}) or target (${target})`);
    console.error('❌ lerpActorCoreMorphTargetDebug:', debugInfo);
    return debugInfo;
  }

  let foundTarget = false;
  
  model.traverse((child) => {
    if (child.isSkinnedMesh) {
      const meshInfo = {
        name: child.name || 'unnamed',
        hasMorphTargetDictionary: !!child.morphTargetDictionary,
        hasMorphTargetInfluences: !!child.morphTargetInfluences,
        morphTargetCount: 0,
        availableTargets: []
      };
      
      if (child.morphTargetDictionary) {
        meshInfo.morphTargetCount = Object.keys(child.morphTargetDictionary).length;
        meshInfo.availableTargets = Object.keys(child.morphTargetDictionary).slice(0, 20); // First 20 for debugging
        
        const index = child.morphTargetDictionary[target];
        
        if (index !== undefined) {
          meshInfo.targetFound = true;
          meshInfo.targetIndex = index;
          
          if (child.morphTargetInfluences && child.morphTargetInfluences[index] !== undefined) {
            foundTarget = true;
            const previousValue = child.morphTargetInfluences[index];
            
            // Calculate new value with stronger interpolation for testing
            const testSpeed = Math.max(speed, 0.3); // Ensure minimum speed for visibility
            const newValue = THREE.MathUtils.lerp(previousValue, value, testSpeed);
            
            // Apply the new value
            child.morphTargetInfluences[index] = newValue;
            
            // Force update of the mesh
            child.morphTargetInfluences = [...child.morphTargetInfluences];
            
            // Mark mesh as needing update
            if (child.geometry) {
              child.geometry.attributes.position.needsUpdate = true;
              if (child.geometry.attributes.normal) {
                child.geometry.attributes.normal.needsUpdate = true;
              }
            }
            
            const updateInfo = {
              meshName: child.name || 'unnamed',
              target,
              index,
              previousValue: previousValue.toFixed(4),
              targetValue: value.toFixed(4),
              newValue: newValue.toFixed(4),
              actualSpeed: testSpeed,
              delta: (newValue - previousValue).toFixed(4),
              significant: Math.abs(newValue - previousValue) > 0.001
            };
            
            debugInfo.actualUpdates.push(updateInfo);
            
            // Enhanced console logging with visual indicators
            if (updateInfo.significant) {
              console.log(`✅ SIGNIFICANT morph update: ${target}`);
              console.log(`   Mesh: ${updateInfo.meshName}`);
              console.log(`   Change: ${updateInfo.previousValue} → ${updateInfo.newValue} (Δ${updateInfo.delta})`);
              console.log(`   Visual: ${'█'.repeat(Math.round(newValue * 10))}${'░'.repeat(10 - Math.round(newValue * 10))}`);
            }
          } else {
            meshInfo.error = `morphTargetInfluences invalid at index ${index}`;
            debugInfo.errors.push(meshInfo.error);
          }
        } else {
          meshInfo.targetNotFound = true;
        }
      }
      
      debugInfo.skinnedMeshes.push(meshInfo);
    }
  });
  
  if (!foundTarget) {
    debugInfo.errors.push(`Target "${target}" not found in any SkinnedMesh`);
    console.warn('⚠️ Morph target not found:', debugInfo);
  }
  
  return debugInfo;
};

/**
 * Apply multiple morph targets with debugging
 */
export const applyBlendShapeDebug = (blendShape, speed, model) => {
  const debugResults = {
    blendShapeTargets: Object.keys(blendShape).filter(k => blendShape[k] > 0),
    significantTargets: [],
    updates: [],
    timestamp: performance.now()
  };
  
  if (blendShape && model) {
    console.log('🎭 Applying blend shape with targets:', debugResults.blendShapeTargets);
    
    for (const [morphTarget, value] of Object.entries(blendShape)) {
      if (morphTarget && value !== undefined && value > 0.01) {
        debugResults.significantTargets.push({ target: morphTarget, value: value.toFixed(3) });
        const updateResult = lerpActorCoreMorphTargetDebug(morphTarget, value, speed, model);
        debugResults.updates.push(updateResult);
      }
    }
    
    if (debugResults.significantTargets.length > 0) {
      console.log('📊 Significant morph targets:', debugResults.significantTargets);
    }
  }
  
  return debugResults;
};

/**
 * Test function to directly set a morph target to maximum value
 */
export const testMorphTargetDirect = (targetName, model) => {
  console.log(`🧪 Testing direct morph target: ${targetName}`);
  
  if (!model) {
    console.error('No model provided for testing');
    return false;
  }
  
  let found = false;
  model.traverse((child) => {
    if (child.isSkinnedMesh && child.morphTargetDictionary) {
      const index = child.morphTargetDictionary[targetName];
      if (index !== undefined && child.morphTargetInfluences) {
        // Set to maximum value for visibility
        child.morphTargetInfluences[index] = 1.0;
        
        // Force update
        child.morphTargetInfluences = [...child.morphTargetInfluences];
        if (child.geometry) {
          child.geometry.attributes.position.needsUpdate = true;
        }
        
        console.log(`✅ Set ${targetName} to 1.0 in mesh ${child.name || 'unnamed'}`);
        found = true;
      }
    }
  });
  
  if (!found) {
    console.error(`❌ Could not find morph target: ${targetName}`);
  }
  
  return found;
};

/**
 * Test all mouth-related morph targets
 */
export const testAllMouthTargets = (model) => {
  const mouthTargets = [
    'Jaw_Open',
    'Mouth_Smile_L',
    'Mouth_Smile_R',
    'Mouth_Pucker',
    'Mouth_Funnel',
    'Mouth_Press_L',
    'Mouth_Press_R'
  ];
  
  console.log('🧪 Testing all mouth targets...');
  
  mouthTargets.forEach((target, index) => {
    setTimeout(() => {
      // Reset all first
      model.traverse((child) => {
        if (child.isSkinnedMesh && child.morphTargetInfluences) {
          child.morphTargetInfluences.fill(0);
        }
      });
      
      // Then test this target
      const result = testMorphTargetDirect(target, model);
      console.log(`Test ${index + 1}/${mouthTargets.length}: ${target} = ${result ? '✅' : '❌'}`);
    }, index * 1000); // Test each target for 1 second
  });
};

/**
 * Get available morph target mapping
 */
export const getMorphTargetMapping = () => MORPH_MAPPING;

/**
 * Get available morph target names from our extracted data
 */
export const getAvailableMorphTargets = () => extractedMorphTargets.morphTargetNames;

/**
 * Debug function to log current morph target mapping
 */
export const debugMorphMapping = () => {
  console.log('🔍 Enhanced ActorCore Morph Target Mapping:');
  console.log(MORPH_MAPPING);
  console.log('📊 Statistics:');
  console.log(`  - Available morph targets: ${extractedMorphTargets.morphTargetNames.length}`);
  console.log(`  - Mapped targets: ${Object.keys(MORPH_MAPPING).filter(key => MORPH_MAPPING[key]).length}`);
  console.log(`  - Facial targets available:`, extractedMorphTargets.morphTargetNames.filter(n => 
    n.includes('Mouth') || n.includes('Jaw') || n.includes('Tongue') || n.includes('Cheek')
  ));
};

/**
 * Analyze model's morph target setup
 */
export const analyzeModelMorphTargets = (model) => {
  const analysis = {
    meshes: [],
    totalMorphTargets: 0,
    facialMorphTargets: [],
    issues: []
  };
  
  model.traverse((child) => {
    if (child.isSkinnedMesh) {
      const meshAnalysis = {
        name: child.name || 'unnamed',
        morphTargetCount: 0,
        morphTargets: [],
        hasInfluences: !!child.morphTargetInfluences,
        influenceCount: child.morphTargetInfluences ? child.morphTargetInfluences.length : 0
      };
      
      if (child.morphTargetDictionary) {
        const targets = Object.keys(child.morphTargetDictionary);
        meshAnalysis.morphTargetCount = targets.length;
        meshAnalysis.morphTargets = targets;
        analysis.totalMorphTargets += targets.length;
        
        // Find facial morph targets
        const facialTargets = targets.filter(t => 
          t.includes('Mouth') || t.includes('Jaw') || t.includes('Tongue') || t.includes('Cheek')
        );
        analysis.facialMorphTargets.push(...facialTargets);
        
        // Check for issues
        if (child.morphTargetInfluences) {
          if (child.morphTargetInfluences.length !== targets.length) {
            analysis.issues.push(`Mesh ${meshAnalysis.name}: influence count (${child.morphTargetInfluences.length}) doesn't match target count (${targets.length})`);
          }
        } else {
          analysis.issues.push(`Mesh ${meshAnalysis.name}: missing morphTargetInfluences array`);
        }
      } else {
        analysis.issues.push(`Mesh ${meshAnalysis.name}: missing morphTargetDictionary`);
      }
      
      analysis.meshes.push(meshAnalysis);
    }
  });
  
  console.log('🔬 Model Morph Target Analysis:', analysis);
  return analysis;
};

export default {
  VisemeMap,
  EnhancedReallusion,
  VisemeToActorCore,
  lerpActorCoreMorphTargetDebug,
  applyBlendShapeDebug,
  testMorphTargetDirect,
  testAllMouthTargets,
  getMorphTargetMapping,
  getAvailableMorphTargets,
  debugMorphMapping,
  analyzeModelMorphTargets
};
