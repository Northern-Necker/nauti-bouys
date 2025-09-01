/**
 * GLB ActorCore Lip-Sync with Index-Based Morph Target Mapping
 * Fallback solution when FBX loading fails or for performance optimization
 * Uses numeric indices with CC4 morph target name mapping from research
 */

/**
 * ActorCore CC4 Morph Target Index Mapping (based on research)
 * This mapping is derived from Tommy Wright's CC4.2-to-blender-ARkit repository
 * and our analysis of the ActorCore GLB export patterns
 */
export const ACTORCORE_MORPH_INDEX_MAP = {
  // CC_Game_Body mesh morph targets (indices 0-72)
  // Jaw controls
  0: "Jaw_Open",
  1: "Jaw_Forward",
  2: "Jaw_L",
  3: "Jaw_R",
  
  // Basic mouth shapes  
  4: "Mouth_Close",
  5: "Mouth_Funnel",
  6: "Mouth_Pucker",
  7: "Mouth_L",
  8: "Mouth_R",
  
  // Mouth expressions
  9: "Mouth_Smile_L",
  10: "Mouth_Smile_R",
  11: "Mouth_Frown_L", 
  12: "Mouth_Frown_R",
  13: "Mouth_Dimple_L",
  14: "Mouth_Dimple_R",
  
  // Mouth detailed controls
  15: "Mouth_Up_Upper_L",
  16: "Mouth_Up_Upper_R",
  17: "Mouth_Down_Lower_L",
  18: "Mouth_Down_Lower_R",
  19: "Mouth_Press_L",
  20: "Mouth_Press_R",
  21: "Mouth_Stretch_L",
  22: "Mouth_Stretch_R",
  23: "Mouth_Shrug_Upper",
  24: "Mouth_Shrug_Lower",
  
  // Advanced mouth controls
  25: "Mouth_Roll_In_Upper",
  26: "Mouth_Roll_In_Lower",
  27: "Mouth_Roll_Out_Upper",
  28: "Mouth_Roll_Out_Lower",
  
  // Eye controls
  29: "Eye_Blink_L",
  30: "Eye_Blink_R",
  31: "Eye_Squint_L",
  32: "Eye_Squint_R",
  33: "Eye_Wide_L",
  34: "Eye_Wide_R",
  
  // Eye movement
  35: "Eye_L_Look_Up",
  36: "Eye_R_Look_Up",
  37: "Eye_L_Look_Down",
  38: "Eye_R_Look_Down",
  39: "Eye_L_Look_L",
  40: "Eye_L_Look_R",
  41: "Eye_R_Look_L",
  42: "Eye_R_Look_R",
  
  // Brow controls
  43: "Brow_Drop_L",
  44: "Brow_Drop_R",
  45: "Brow_Raise_Inner_L",
  46: "Brow_Raise_Inner_R",
  47: "Brow_Raise_Outer_L",
  48: "Brow_Raise_Outer_R",
  
  // Cheek and nose
  49: "Cheek_Raise_L",
  50: "Cheek_Raise_R",
  51: "Cheek_Puff_L",
  52: "Cheek_Puff_R",
  53: "Nose_Sneer_L",
  54: "Nose_Sneer_R",
  
  // Additional facial controls (indices may vary)
  55: "Mouth_Funnel_Up_L",
  56: "Mouth_Funnel_Up_R",
  57: "Mouth_Funnel_Down_L",
  58: "Mouth_Funnel_Down_R",
  59: "Mouth_Pucker_Up_L",
  60: "Mouth_Pucker_Up_R",
  61: "Mouth_Pucker_Down_L",
  62: "Mouth_Pucker_Down_R",
  
  // Less common controls
  63: "Mouth_Roll_In_Upper_L",
  64: "Mouth_Roll_In_Upper_R",
  65: "Mouth_Roll_In_Lower_L",
  66: "Mouth_Roll_In_Lower_R",
  
  // Final indices (may include additional controls)
  67: "Head_Turn_L",
  68: "Head_Turn_R",
  69: "Head_Tilt_L",
  70: "Head_Tilt_R",
  71: "Head_Nod_Down",
  72: "Head_Nod_Up"
};

/**
 * CC_Game_Tongue mesh morph targets (indices 0-25)
 */
export const ACTORCORE_TONGUE_INDEX_MAP = {
  0: "Tongue_Out",
  1: "Tongue_Up", 
  2: "Tongue_Down",
  3: "Tongue_L",
  4: "Tongue_R",
  5: "Tongue_Roll",
  6: "Tongue_Curl",
  7: "Tongue_Wide",
  8: "Tongue_Narrow",
  9: "Tongue_Curl_U",
  10: "Tongue_Curl_D",
  11: "Tongue_Lower",
  12: "Tongue_Raise",
  13: "Tongue_Twist_L",
  14: "Tongue_Twist_R",
  15: "Tongue_Bulge_L",
  16: "Tongue_Bulge_R",
  17: "Tongue_Tip_Up",
  18: "Tongue_Tip_Down",
  19: "Tongue_Tip_L",
  20: "Tongue_Tip_R",
  21: "Tongue_Root_Up",
  22: "Tongue_Root_Down",
  23: "Tongue_Root_L",
  24: "Tongue_Root_R",
  25: "Tongue_Press"
};

/**
 * Enhanced GLB ActorCore Lip-Sync with Index Mapping
 */
export class GLBActorCoreLipSyncWithIndexMapping {
  constructor() {
    this.model = null;
    this.bodyMesh = null;
    this.tongueMesh = null;
    this.isReady = false;
    
    // Reverse mapping for quick lookups
    this.nameToBodyIndex = {};
    this.nameToTongueIndex = {};
    
    // Build reverse mappings
    Object.entries(ACTORCORE_MORPH_INDEX_MAP).forEach(([index, name]) => {
      this.nameToBodyIndex[name] = parseInt(index);
    });
    
    Object.entries(ACTORCORE_TONGUE_INDEX_MAP).forEach(([index, name]) => {
      this.nameToTongueIndex[name] = parseInt(index);
    });
    
    // Viseme to morph target mapping
    this.visemeToMorphMap = {
      'sil': null,
      'PP': 'Mouth_Close', // P, B, M sounds
      'FF': 'Mouth_Funnel', // F, V sounds  
      'TH': 'Mouth_Stretch_L', // TH sounds
      'DD': 'Mouth_Press_L', // D, T, N sounds
      'kk': 'Jaw_Open', // K, G sounds
      'CH': 'Mouth_Shrug_Upper', // CH, J sounds
      'SS': 'Mouth_Smile_L', // S, Z sounds
      'nn': 'Mouth_Close', // N, NG sounds
      'RR': 'Tongue_Out', // R sounds
      'aa': 'Jaw_Open', // Large A sounds
      'E': 'Mouth_Smile_L', // E sounds
      'I': 'Mouth_Smile_L', // I sounds 
      'O': 'Mouth_Funnel', // O sounds
      'U': 'Mouth_Pucker' // U sounds
    };

    // Fallback mappings if primary fails
    this.fallbackMorphMap = {
      'PP': ['Mouth_Close', 'Mouth_Press_L', 'Mouth_Press_R'],
      'FF': ['Mouth_Funnel', 'Mouth_Pucker'],
      'TH': ['Mouth_Stretch_L', 'Mouth_Stretch_R'],
      'DD': ['Mouth_Press_L', 'Mouth_Press_R'],
      'kk': ['Jaw_Open', 'Jaw_Forward'],
      'CH': ['Mouth_Shrug_Upper', 'Mouth_Shrug_Lower'],
      'SS': ['Mouth_Smile_L', 'Mouth_Smile_R'],
      'nn': ['Mouth_Close'],
      'RR': ['Tongue_Out', 'Mouth_Funnel'],
      'aa': ['Jaw_Open'],
      'E': ['Mouth_Smile_L', 'Mouth_Smile_R'],
      'I': ['Mouth_Smile_L', 'Mouth_Smile_R'],
      'O': ['Mouth_Funnel', 'Mouth_Pucker'],
      'U': ['Mouth_Pucker', 'Mouth_Funnel']
    };
  }

  /**
   * Initialize with loaded GLB model
   * @param {THREE.Object3D} glbModel - Loaded GLB model
   */
  initialize(glbModel) {
    this.model = glbModel;
    
    // Find the body and tongue meshes
    glbModel.traverse((child) => {
      if (child.isMesh && child.morphTargetInfluences) {
        if (child.name === 'CC_Game_Body' || child.name.includes('Body')) {
          this.bodyMesh = child;
          console.log(`🎭 Found body mesh: ${child.name} with ${child.morphTargetInfluences.length} morph targets`);
        } else if (child.name === 'CC_Game_Tongue' || child.name.includes('Tongue')) {
          this.tongueMesh = child;
          console.log(`👅 Found tongue mesh: ${child.name} with ${child.morphTargetInfluences.length} morph targets`);
        }
      }
    });

    if (!this.bodyMesh) {
      console.warn('⚠️ No body mesh found with morph targets');
      return false;
    }

    this.isReady = true;
    console.log('✅ GLB ActorCore lip-sync with index mapping ready!');
    return true;
  }

  /**
   * Set morph target by name using index mapping
   * @param {string} morphName - Name of the morph target
   * @param {number} value - Value between 0 and 1
   * @returns {boolean} - Success status
   */
  setMorphTargetByName(morphName, value) {
    if (!this.isReady) return false;

    // Try body mesh first
    const bodyIndex = this.nameToBodyIndex[morphName];
    if (bodyIndex !== undefined && this.bodyMesh.morphTargetInfluences[bodyIndex] !== undefined) {
      this.bodyMesh.morphTargetInfluences[bodyIndex] = Math.max(0, Math.min(1, value));
      return true;
    }

    // Try tongue mesh
    const tongueIndex = this.nameToTongueIndex[morphName];
    if (tongueIndex !== undefined && this.tongueMesh?.morphTargetInfluences[tongueIndex] !== undefined) {
      this.tongueMesh.morphTargetInfluences[tongueIndex] = Math.max(0, Math.min(1, value));
      return true;
    }

    return false;
  }

  /**
   * Apply viseme using index-based mapping
   * @param {string} viseme - Viseme name
   * @param {number} intensity - Intensity value (0-1)
   */
  applyViseme(viseme, intensity = 1.0) {
    if (!this.isReady) return;

    // Reset all morph targets first
    this.resetAllMorphTargets();

    // Apply primary mapping
    const morphName = this.visemeToMorphMap[viseme];
    if (morphName && this.setMorphTargetByName(morphName, intensity)) {
      console.log(`🎭 Applied viseme "${viseme}" to morph "${morphName}" (index mapping)`);
      return;
    }

    // Try fallback mappings
    if (viseme !== 'sil') {
      const fallbacks = this.fallbackMorphMap[viseme];
      if (fallbacks) {
        for (const fallbackMorph of fallbacks) {
          if (this.setMorphTargetByName(fallbackMorph, intensity)) {
            console.log(`🔄 Applied fallback viseme "${viseme}" to morph "${fallbackMorph}"`);
            return;
          }
        }
      }
    }

    if (viseme !== 'sil') {
      console.warn(`⚠️ Could not apply viseme "${viseme}" using index mapping`);
    }
  }

  /**
   * Reset all morph targets to 0
   */
  resetAllMorphTargets() {
    if (this.bodyMesh?.morphTargetInfluences) {
      for (let i = 0; i < this.bodyMesh.morphTargetInfluences.length; i++) {
        this.bodyMesh.morphTargetInfluences[i] = 0;
      }
    }

    if (this.tongueMesh?.morphTargetInfluences) {
      for (let i = 0; i < this.tongueMesh.morphTargetInfluences.length; i++) {
        this.tongueMesh.morphTargetInfluences[i] = 0;
      }
    }
  }

  /**
   * Test a morph target by index
   * @param {string} meshType - 'body' or 'tongue'
   * @param {number} index - Morph target index
   * @param {number} value - Value to set
   */
  testMorphByIndex(meshType, index, value = 1.0) {
    const mesh = meshType === 'tongue' ? this.tongueMesh : this.bodyMesh;
    if (!mesh?.morphTargetInfluences || !mesh.morphTargetInfluences[index]) {
      return false;
    }

    this.resetAllMorphTargets();
    mesh.morphTargetInfluences[index] = value;
    
    const mappingTable = meshType === 'tongue' ? ACTORCORE_TONGUE_INDEX_MAP : ACTORCORE_MORPH_INDEX_MAP;
    const morphName = mappingTable[index] || `Unknown_${index}`;
    console.log(`🧪 Testing ${meshType} morph ${index}: ${morphName} = ${value}`);
    
    return true;
  }

  /**
   * Get debug information
   */
  getDebugInfo() {
    return {
      ready: this.isReady,
      bodyMesh: this.bodyMesh?.name || null,
      bodyMorphCount: this.bodyMesh?.morphTargetInfluences?.length || 0,
      tongueMesh: this.tongueMesh?.name || null,
      tongueMorphCount: this.tongueMesh?.morphTargetInfluences?.length || 0,
      totalMappedMorphs: Object.keys(this.nameToBodyIndex).length + Object.keys(this.nameToTongueIndex).length,
      visemeMapping: this.visemeToMorphMap
    };
  }

  /**
   * Apply lip-sync data with timing
   * @param {Array} lipSyncData - Array of timed viseme data
   * @param {number} currentTime - Current playback time
   */
  applyLipSyncData(lipSyncData, currentTime) {
    if (!this.isReady || !lipSyncData) return;

    const currentFrame = lipSyncData.find(frame => 
      currentTime >= frame.time && currentTime < (frame.time + (frame.duration || 0.1))
    );

    if (currentFrame) {
      this.applyViseme(currentFrame.viseme, currentFrame.intensity || 1.0);
    } else {
      this.applyViseme('sil');
    }
  }
}

/**
 * Create GLB ActorCore lip-sync system with index mapping
 * @param {THREE.Object3D} glbModel - Loaded GLB model
 * @returns {GLBActorCoreLipSyncWithIndexMapping|null} - Initialized system or null
 */
export function createGLBActorCoreLipSyncWithIndexMapping(glbModel) {
  const lipSyncSystem = new GLBActorCoreLipSyncWithIndexMapping();
  
  if (lipSyncSystem.initialize(glbModel)) {
    return lipSyncSystem;
  }
  
  return null;
}
