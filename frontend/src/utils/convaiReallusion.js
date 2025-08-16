/**
 * Conv-AI Reallusion Lip Sync Implementation
 * Based on the working implementation from Conv-AI/Reallusion-web repository
 * This provides proven viseme-to-morph-target mapping for ActorCore/CC4 characters
 */

import * as THREE from 'three';

// Viseme mapping from Conv-AI implementation
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

// Proven Reallusion morph target mappings from Conv-AI
export const Reallusion = {
  sil: {
    Mouth_Drop_Lower: 0,
    Mouth_Drop_Upper: 0,
    Mouth_Shrug_Upper: 0,
    Mouth_Shrug_Lower: 0,
    Mouth_Stretch_L: 0,
    Mouth_Stretch_R: 0,
    Mouth_Blow_L: 0,
    Mouth_Blow_R: 0,
    Mouth_Pull_Lower_L: 0,
    Mouth_Pull_Lower_R: 0,
    Mouth_Pull_Upper_L: 0,
    Mouth_Pull_Upper_R: 0,
    Mouth_Push_Lower_L: 0,
    Mouth_Push_Lower_R: 0,
    Mouth_Roll_In_Upper_L: 0,
    Mouth_Roll_In_Upper_R: 0,
    Mouth_Roll_In_Lower_L: 0,
    Mouth_Roll_In_Lower_R: 0,
    Mouth_Roll_Out_Lower_L: 0,
    Mouth_Roll_Out_Lower_R: 0,
    Mouth_Roll_Out_Upper_L: 0,
    Mouth_Roll_Out_Upper_R: 0,
    Mouth_Funnel_Down_L: 0,
    Mouth_Funnel_Down_R: 0,
    Mouth_Smile_L: 0,
    Mouth_Smile_R: 0,
    Mouth_Frown_L: 0,
    Mouth_Frown_R: 0,
    Mouth_Down: 0,
    Mouth_Press_R: 0,
    Mouth_Press_L: 0,
    V_Explosive: 0,
    V_Lip_Open: 0,
    V_Wide: 0,
    V_Dental_Lip: 0,
    V_Tight_O: 0,
    V_Affricate: 0,
    V_Tongue_Out: 0,
    Open_Jaw: 0,
    TongueRotation: 0,
    TongueUp: 0,
  },
  
  PP: {
    V_Explosive: 1.0,
    Mouth_Roll_In_Upper_L: 0.3,
    Mouth_Roll_In_Upper_R: 0.3,
    Mouth_Roll_In_Lower_L: 0.3,
    Mouth_Roll_In_Lower_R: 0.3,
    Open_Jaw: 0.1,
  },
  
  FF: {
    V_Dental_Lip: 1.0,
    Mouth_Funnel_Down_L: 0.2,
    Mouth_Funnel_Down_R: 0.2,
    Mouth_Drop_Upper: 0.25,
  },
  
  TH: {
    Mouth_Drop_Lower: 0.2,
    Mouth_Shrug_Upper: 0.25,
    Mouth_Stretch_L: 0.1,
    Mouth_Stretch_R: 0.1,
    V_Lip_Open: 0.4,
    V_Tongue_Out: 1.0,
    Open_Jaw: 0.12,
    TongueUp: 0.22,
    TongueRotation: -0.3,
  },
  
  DD: {
    Mouth_Shrug_Upper: 0.35,
    Mouth_Stretch_L: 0.35,
    Mouth_Stretch_R: 0.35,
    Mouth_Roll_Out_Lower_L: 0.5,
    Mouth_Roll_Out_Lower_R: 0.5,
    V_Lip_Open: 0.5,
    Open_Jaw: 0.07,
    TongueRotation: -0.6,
    TongueUp: 0.22,
  },
  
  KK: {
    Mouth_Drop_Lower: 0.6,
    Mouth_Shrug_Upper: 0.1,
    Open_Jaw: 0.06,
    V_Wide: 0.1,
  },
  
  CH: {
    Mouth_Drop_Lower: 0.4,
    Mouth_Down: 0.22,
    Mouth_Roll_Out_Lower_L: 0.7,
    Mouth_Roll_Out_Lower_R: 0.7,
    V_Affricate: 0.7,
    Open_Jaw: 0.06,
    TongueRotation: -0.1,
    TongueUp: 0.22,
  },
  
  SS: {
    Mouth_Shrug_Upper: 0.3,
    Mouth_Drop_Lower: 0.85,
    Mouth_Smile_L: 0.27,
    Mouth_Smile_R: 0.27,
    Mouth_Roll_In_Upper_L: 0.2,
    Mouth_Roll_In_Upper_R: 0.2,
    V_Wide: 0.3,
    Open_Jaw: 0.05,
  },
  
  NN: {
    Mouth_Drop_Lower: 0.5,
    Mouth_Down: 0.22,
    Mouth_Pull_Lower_L: 1.0,
    Mouth_Pull_Lower_R: 1.0,
    Mouth_Roll_Out_Lower_L: 0.8,
    Mouth_Roll_Out_Lower_R: 0.8,
    V_Affricate: 0.7,
    Open_Jaw: 0.08,
    TongueRotation: -0.3,
    TongueUp: 0.22,
  },
  
  RR: {
    Mouth_Drop_Upper: 0.2,
    Mouth_Drop_Lower: 0.1,
    Mouth_Down: 0.22,
    Mouth_Blow_L: 0.3,
    Mouth_Blow_R: 0.3,
    Mouth_Pull_Lower_L: 1.0,
    Mouth_Pull_Lower_R: 1.0,
    Mouth_Roll_Out_Lower_L: 0.7,
    Mouth_Roll_Out_Lower_R: 0.7,
    V_Affricate: 0.4,
    V_Lip_Open: 0.4,
    Open_Jaw: 0.05,
    TongueUp: 0.2,
    TongueRotation: -0.3,
  },
  
  AA: {
    Mouth_Drop_Lower: 0.2,
    Mouth_Frown_L: 0.2,
    Mouth_Frown_R: 0.2,
    V_Tongue_Out: -0.4,
    TongueRotation: 0.12,
    Open_Jaw: 0.2,
  },
  
  E: {
    Mouth_Shrug_Upper: 0.2,
    Mouth_Drop_Lower: 0.2,
    Mouth_Down: 0.3,
    Mouth_Pull_Lower_L: 1.0,
    Mouth_Pull_Lower_R: 1.0,
    Mouth_Pull_Upper_L: 1.0,
    Mouth_Pull_Upper_R: 1.0,
    Mouth_Smile_L: 0.3,
    Mouth_Smile_R: 0.3,
    Open_Jaw: 0.09,
  },
  
  I: {
    Mouth_Shrug_Upper: 0.2,
    Mouth_Drop_Lower: 0.21,
    Mouth_Down: 0.2,
    Open_Jaw: 0.1,
    Mouth_Frown_L: 0.15,
    Mouth_Frown_R: 0.15,
    Mouth_Pull_Upper_L: 1.0,
    Mouth_Pull_Upper_R: 1.0,
    Mouth_Pull_Lower_L: 1.0,
    Mouth_Pull_Lower_R: 1.0,
    V_Lip_Open: 0.5,
    TongueRotation: -0.2,
    TongueUp: 0.2,
    V_Tongue_Out: 0.2,
  },
  
  O: {
    // Using E pattern as per Conv-AI implementation
    Mouth_Shrug_Upper: 0.3,
    Mouth_Drop_Lower: 0.2,
    Mouth_Down: 0.3,
    Mouth_Pull_Lower_L: 1.0,
    Mouth_Pull_Lower_R: 1.0,
    Mouth_Pull_Upper_L: 1.0,
    Mouth_Pull_Upper_R: 1.0,
    Mouth_Smile_L: 0.3,
    Mouth_Smile_R: 0.3,
    Open_Jaw: 0.12,
  },
  
  U: {
    Mouth_Shrug_Lower: 0.1,
    Mouth_Drop_Upper: 0.22,
    Mouth_Down: 0.27,
    V_Tight_O: 0.8,
    Open_Jaw: 0.11,
  },
};

/**
 * Conv-AI's proven VisemeToReallusion function
 * Converts viseme data to Reallusion morph target influences
 */
export const VisemeToReallusion = (viseme, blendShapeRef) => {
  if (typeof viseme === 'object') {
    const blendShape = {
      Mouth_Drop_Lower: 0,
      Mouth_Drop_Upper: 0,
      Mouth_Shrug_Upper: 0,
      Mouth_Shrug_Lower: 0,
      Mouth_Stretch_L: 0,
      Mouth_Stretch_R: 0,
      Mouth_Blow_L: 0,
      Mouth_Blow_R: 0,
      Mouth_Pull_Lower_L: 0,
      Mouth_Pull_Lower_R: 0,
      Mouth_Pull_Upper_L: 0,
      Mouth_Pull_Upper_R: 0,
      Mouth_Push_Lower_L: 0,
      Mouth_Push_Lower_R: 0,
      Mouth_Funnel_Down_L: 0,
      Mouth_Funnel_Down_R: 0,
      Mouth_Roll_In_Upper_L: 0,
      Mouth_Roll_In_Upper_R: 0,
      Mouth_Roll_In_Lower_L: 0,
      Mouth_Roll_In_Lower_R: 0,
      Mouth_Roll_Out_Lower_L: 0,
      Mouth_Roll_Out_Lower_R: 0,
      Mouth_Roll_Out_Upper_L: 0,
      Mouth_Roll_Out_Upper_R: 0,
      Mouth_Smile_R: 0,
      Mouth_Smile_L: 0,
      Mouth_Frown_L: 0,
      Mouth_Frown_R: 0,
      Mouth_Down: 0,
      Mouth_Press_R: 0,
      Mouth_Press_L: 0,
      V_Explosive: 0,
      V_Lip_Open: 0,
      V_Wide: 0,
      V_Dental_Lip: 0,
      V_Tight_O: 0,
      V_Affricate: 0,
      V_Tongue_Out: 0,
      Open_Jaw: 0,
      TongueRotation: 0,
      TongueUp: 0,
    };

    // Process each viseme in the input
    for (const key in viseme) {
      let visemeValue = viseme[key];
      
      // Conv-AI's special handling for viseme 1 (PP)
      if (key === '1' && visemeValue < 0.2) {
        visemeValue = visemeValue * 1.5;
      }

      // Get the corresponding blend shape configuration
      const currentBlend = Reallusion[VisemeMap[key]];
      
      if (currentBlend) {
        // Apply each morph target influence
        for (const blend in currentBlend) {
          const blendValue = currentBlend[blend] * visemeValue;
          blendShape[blend] = blendShape[blend] + blendValue;
        }
      }
    }

    // Push to the blend shape reference (Conv-AI pattern)
    blendShapeRef.current.push(blendShape);
  }
};

/**
 * Conv-AI's lerp morph target function for smooth animation
 */
export const lerpMorphTarget = (target, value, speed, scene) => {
  if (scene) {
    if (typeof target === 'string' && !target.includes('Eye')) {
      // Optional logging for debugging (disabled by default)
      // console.log(value, target);
    }
    
    scene.traverse((child) => {
      if (child.isSkinnedMesh && child.morphTargetDictionary) {
        const index = child.morphTargetDictionary[target];
        
        if (index === undefined || child.morphTargetInfluences[index] === undefined) {
          return;
        }
        
        // Smooth interpolation using Three.js lerp
        child.morphTargetInfluences[index] = THREE.MathUtils.lerp(
          child.morphTargetInfluences[index],
          value,
          speed
        );
      }
    });
  }
};

/**
 * Enhanced version that works with our extracted morph target names
 * Maps Conv-AI naming to our actual CC4 morph target names
 */
export const createActorCoreMorphMapping = (extractedNames) => {
  const mapping = {};
  
  // Create mapping from Conv-AI names to our actual morph target names
  const nameMap = {
    'Mouth_Drop_Lower': ['Jaw_Open', 'CC_Base_Jaw_Open', 'jawOpen'],
    'Mouth_Drop_Upper': ['Mouth_Upper_Up_L', 'Mouth_Upper_Up_R', 'CC_Base_Mouth_Upper_Up_L', 'CC_Base_Mouth_Upper_Up_R'],
    'Mouth_Shrug_Upper': ['Mouth_Shrug_Upper', 'CC_Base_Mouth_Shrug_Upper'],
    'Mouth_Shrug_Lower': ['Mouth_Shrug_Lower', 'CC_Base_Mouth_Shrug_Lower'],
    'Mouth_Stretch_L': ['Mouth_Stretch_L', 'CC_Base_Mouth_Stretch_L'],
    'Mouth_Stretch_R': ['Mouth_Stretch_R', 'CC_Base_Mouth_Stretch_R'],
    'Mouth_Blow_L': ['Mouth_Blow_L', 'CC_Base_Mouth_Blow_L'],
    'Mouth_Blow_R': ['Mouth_Blow_R', 'CC_Base_Mouth_Blow_R'],
    'Mouth_Pull_Lower_L': ['Mouth_Pull_Lower_L', 'CC_Base_Mouth_Pull_Lower_L'],
    'Mouth_Pull_Lower_R': ['Mouth_Pull_Lower_R', 'CC_Base_Mouth_Pull_Lower_R'],
    'Mouth_Pull_Upper_L': ['Mouth_Pull_Upper_L', 'CC_Base_Mouth_Pull_Upper_L'],
    'Mouth_Pull_Upper_R': ['Mouth_Pull_Upper_R', 'CC_Base_Mouth_Pull_Upper_R'],
    'Mouth_Smile_L': ['Mouth_Smile_L', 'CC_Base_Mouth_Smile_L'],
    'Mouth_Smile_R': ['Mouth_Smile_R', 'CC_Base_Mouth_Smile_R'],
    'Mouth_Frown_L': ['Mouth_Frown_L', 'CC_Base_Mouth_Frown_L'],
    'Mouth_Frown_R': ['Mouth_Frown_R', 'CC_Base_Mouth_Frown_R'],
    'Open_Jaw': ['Jaw_Open', 'CC_Base_Jaw_Open', 'jawOpen'],
    // Add more mappings as needed
  };
  
  // Find the first existing morph target name for each Conv-AI name
  for (const [convaiName, candidates] of Object.entries(nameMap)) {
    for (const candidate of candidates) {
      if (extractedNames.includes(candidate)) {
        mapping[convaiName] = candidate;
        break;
      }
    }
  }
  
  return mapping;
};

export default {
  VisemeMap,
  Reallusion,
  VisemeToReallusion,
  lerpMorphTarget,
  createActorCoreMorphMapping
};
