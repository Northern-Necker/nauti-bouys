/**
 * Enhanced ActorCore Lip Sync System
 * Integrates Conv-AI's proven viseme-to-morph-target mapping with our extracted CC4 morph target names
 * This combines the working Conv-AI implementation with our actual SavannahAvatar morph targets
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
 * Enhanced lerp morph target function for smooth animation
 */
export const lerpActorCoreMorphTarget = (target, value, speed, model) => {
  if (!model || !target) {
    console.warn('lerpActorCoreMorphTarget: Missing model or target', { target, model });
    return;
  }

  let foundTarget = false;
  let skinnedMeshCount = 0;
  
  model.traverse((child) => {
    if (child.isSkinnedMesh) {
      skinnedMeshCount++;
      console.log(`Found SkinnedMesh: ${child.name || 'unnamed'}, has morphTargetDictionary: ${!!child.morphTargetDictionary}`);
      
      if (child.morphTargetDictionary) {
        console.log(`Available morph targets in ${child.name || 'mesh'}:`, Object.keys(child.morphTargetDictionary).slice(0, 10));
        
        const index = child.morphTargetDictionary[target];
        
        if (index !== undefined) {
          if (child.morphTargetInfluences && child.morphTargetInfluences[index] !== undefined) {
            foundTarget = true;
            const previousValue = child.morphTargetInfluences[index];
            
            // Calculate new value
            const newValue = THREE.MathUtils.lerp(previousValue, value, speed);
            
            // Apply the new value
            child.morphTargetInfluences[index] = newValue;
            
            // Log detailed information
            console.log(`✓ Updated morph target: ${target}`);
            console.log(`  - Mesh: ${child.name || 'unnamed'}`);
            console.log(`  - Index: ${index}`);
            console.log(`  - Previous: ${previousValue.toFixed(4)}`);
            console.log(`  - Target: ${value.toFixed(4)}`);
            console.log(`  - New: ${newValue.toFixed(4)}`);
            console.log(`  - Speed: ${speed}`);
            console.log(`  - Delta: ${(newValue - previousValue).toFixed(4)}`);
          } else {
            console.warn(`Morph target "${target}" found at index ${index} but morphTargetInfluences is invalid`);
          }
        } else {
          console.log(`Morph target "${target}" not found in ${child.name || 'mesh'}'s dictionary`);
        }
      } else {
        console.log(`SkinnedMesh ${child.name || 'unnamed'} has no morphTargetDictionary`);
      }
    }
  });
  
  if (skinnedMeshCount === 0) {
    console.error('No SkinnedMesh found in model!');
  } else if (!foundTarget) {
    console.warn(`Morph target "${target}" not found in any of the ${skinnedMeshCount} SkinnedMesh(es)`);
  }
};

/**
 * Apply multiple morph targets from a blend shape object
 */
export const applyBlendShape = (blendShape, speed, model) => {
  if (blendShape && model) {
    for (const [morphTarget, value] of Object.entries(blendShape)) {
      if (morphTarget && value !== undefined) {
        lerpActorCoreMorphTarget(morphTarget, value, speed, model);
      }
    }
  }
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
  console.log('Enhanced ActorCore Morph Target Mapping:');
  console.log(MORPH_MAPPING);
  console.log('Available morph targets:', extractedMorphTargets.morphTargetNames.length);
  console.log('Mapped targets:', Object.keys(MORPH_MAPPING).filter(key => MORPH_MAPPING[key]).length);
};

export default {
  VisemeMap,
  EnhancedReallusion,
  VisemeToActorCore,
  lerpActorCoreMorphTarget,
  applyBlendShape,
  getMorphTargetMapping,
  getAvailableMorphTargets,
  debugMorphMapping
};
