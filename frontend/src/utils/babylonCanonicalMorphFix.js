/**
 * Canonical Babylon.js Morph Target Pattern
 * Based on official Babylon.js best practices and 2025 bug fixes
 * 
 * This replaces the GPU sync hacks with proper morph target handling
 * Addresses issues with frozen materials, defines, and dirty flags
 */

import * as BABYLON from '@babylonjs/core';

export class CanonicalMorphHandler {
  constructor() {
    this.scene = null;
    this.faceMesh = null;
    this.tongueMesh = null;
    this.morphTargetManager = null;
    this.tongueMorphTargetManager = null;
    this.isInitialized = false;
  }

  /**
   * Initialize with proper mesh targeting
   */
  initialize(scene, meshes) {
    this.scene = scene;
    
    // Find the meshes with morph targets
    meshes.forEach(mesh => {
      if (mesh.morphTargetManager && mesh.morphTargetManager.numTargets > 0) {
        if (mesh.name.includes('CC_Game_Body')) {
          this.faceMesh = mesh;
          this.morphTargetManager = mesh.morphTargetManager;
          console.log(`✅ Found face mesh: ${mesh.name} with ${this.morphTargetManager.numTargets} morphs`);
        } else if (mesh.name.includes('CC_Game_Tongue')) {
          this.tongueMesh = mesh;
          this.tongueMorphTargetManager = mesh.morphTargetManager;
          console.log(`✅ Found tongue mesh: ${mesh.name} with ${this.tongueMorphTargetManager.numTargets} morphs`);
        }
      }
    });

    if (this.morphTargetManager) {
      // Set numMaxInfluencers explicitly to avoid edge cases
      this.morphTargetManager.numMaxInfluencers = 8;
      
      // Unfreeze material if frozen
      if (this.faceMesh.material?.isFrozen) {
        this.faceMesh.material.unfreeze();
        console.log('🔓 Unfroze face mesh material for morph updates');
      }

      // One-time compile nudge to ensure MORPHTARGETS define is set
      this.performInitialCompileNudge();
      
      this.isInitialized = true;
      console.log('✅ Canonical morph handler initialized');
    }

    if (this.tongueMorphTargetManager) {
      this.tongueMorphTargetManager.numMaxInfluencers = 4;
      
      if (this.tongueMesh.material?.isFrozen) {
        this.tongueMesh.material.unfreeze();
        console.log('🔓 Unfroze tongue mesh material for morph updates');
      }
    }

    return this.isInitialized;
  }

  /**
   * One-time compile nudge to ensure material compiles with MORPHTARGETS
   */
  performInitialCompileNudge() {
    if (!this.morphTargetManager) return;
    
    const firstTarget = this.morphTargetManager.getTarget(0);
    if (firstTarget) {
      // Set to 1, render, then back to 0
      firstTarget.influence = 1;
      this.scene.render();
      firstTarget.influence = 0;
      this.scene.render();
      console.log('✅ Initial compile nudge completed - MORPHTARGETS define ensured');
    }
  }

  /**
   * Apply visemes using the canonical batched pattern
   */
  applyVisemes(visemeEntries, decayFactor = 0.85) {
    if (!this.isInitialized || !this.morphTargetManager) return false;

    // Batch updates to avoid N recompiles
    this.morphTargetManager.areUpdatesFrozen = true;
    
    // Apply decay to previous visemes
    for (let i = 0; i < this.morphTargetManager.numTargets; i++) {
      const target = this.morphTargetManager.getTarget(i);
      if (target) {
        target.influence = Math.max(0, target.influence * decayFactor);
      }
    }

    // Apply tongue decay if available
    if (this.tongueMorphTargetManager) {
      this.tongueMorphTargetManager.areUpdatesFrozen = true;
      for (let i = 0; i < this.tongueMorphTargetManager.numTargets; i++) {
        const target = this.tongueMorphTargetManager.getTarget(i);
        if (target) {
          target.influence = Math.max(0, target.influence * decayFactor);
        }
      }
    }
    
    // Raise current visemes
    for (const [morphName, weight] of visemeEntries) {
      // Try face mesh first
      let target = this.morphTargetManager.getTargetByName(morphName);
      if (target) {
        target.influence = Math.min(1, Math.max(weight, target.influence));
      } else if (this.tongueMorphTargetManager) {
        // Try tongue mesh if not found in face
        target = this.tongueMorphTargetManager.getTargetByName(morphName);
        if (target) {
          target.influence = Math.min(1, Math.max(weight, target.influence));
        }
      }
    }
    
    // Unfreeze to trigger a single sync
    this.morphTargetManager.areUpdatesFrozen = false;
    if (this.tongueMorphTargetManager) {
      this.tongueMorphTargetManager.areUpdatesFrozen = false;
    }
    
    // Ensure attributes/defines rebind if MORPHTARGETS turned on this frame
    this.faceMesh._markSubMeshesAsAttributesDirty();
    this.faceMesh.material?.markAsDirty(
      BABYLON.Material.AttributesDirtyFlag | BABYLON.Material.MiscDirtyFlag
    );

    if (this.tongueMesh) {
      this.tongueMesh._markSubMeshesAsAttributesDirty();
      this.tongueMesh.material?.markAsDirty(
        BABYLON.Material.AttributesDirtyFlag | BABYLON.Material.MiscDirtyFlag
      );
    }
    
    return true;
  }

  /**
   * Apply a single morph for testing
   */
  applySingleMorph(morphName, weight) {
    if (!this.isInitialized) return false;

    const entries = [[morphName, weight]];
    return this.applyVisemes(entries, 0); // No decay for single morph test
  }

  /**
   * Reset all morphs to zero
   */
  resetAllMorphs() {
    if (!this.morphTargetManager) return;

    this.morphTargetManager.areUpdatesFrozen = true;
    for (let i = 0; i < this.morphTargetManager.numTargets; i++) {
      const target = this.morphTargetManager.getTarget(i);
      if (target) {
        target.influence = 0;
      }
    }
    this.morphTargetManager.areUpdatesFrozen = false;

    if (this.tongueMorphTargetManager) {
      this.tongueMorphTargetManager.areUpdatesFrozen = true;
      for (let i = 0; i < this.tongueMorphTargetManager.numTargets; i++) {
        const target = this.tongueMorphTargetManager.getTarget(i);
        if (target) {
          target.influence = 0;
        }
      }
      this.tongueMorphTargetManager.areUpdatesFrozen = false;
    }

    console.log('🔄 All morphs reset to 0');
  }

  /**
   * Refresh bounding info for extreme visemes
   */
  refreshBounds() {
    if (this.faceMesh) {
      this.faceMesh.refreshBoundingInfo(true);
    }
    if (this.tongueMesh) {
      this.tongueMesh.refreshBoundingInfo(true);
    }
  }

  /**
   * Get current state for debugging
   */
  getCurrentState() {
    const state = {
      initialized: this.isInitialized,
      faceMesh: this.faceMesh?.name,
      tongueMesh: this.tongueMesh?.name,
      faceMorphCount: this.morphTargetManager?.numTargets || 0,
      tongueMorphCount: this.tongueMorphTargetManager?.numTargets || 0,
      maxInfluencers: this.morphTargetManager?.numMaxInfluencers || 0,
      morphs: {}
    };

    if (this.morphTargetManager) {
      for (let i = 0; i < this.morphTargetManager.numTargets; i++) {
        const target = this.morphTargetManager.getTarget(i);
        if (target && target.influence > 0.01) {
          state.morphs[target.name] = target.influence;
        }
      }
    }

    if (this.tongueMorphTargetManager) {
      for (let i = 0; i < this.tongueMorphTargetManager.numTargets; i++) {
        const target = this.tongueMorphTargetManager.getTarget(i);
        if (target && target.influence > 0.01) {
          state.morphs[`tongue_${target.name}`] = target.influence;
        }
      }
    }

    return state;
  }
}

/**
 * Proper viseme mappings with corrected PP for bilabial closure
 * Based on phonetic research for pressed lips (not puckered)
 */
export const CORRECTED_VISEME_MAPPINGS = {
  sil: [],
  
  // PP: Bilabial plosives (P, B) - lips pressed together flat
  // Using V_M (bilabial nasal) as it creates proper lip closure
  // Combined with slight mouth narrowing for pressed appearance
  PP: [
    ['V_M', 0.9],           // Primary bilabial closure
    ['Mouth_Narrow', 0.3],  // Slight narrowing
    ['Jaw_Open', -0.1]      // Slight jaw closure
  ],
  
  // FF: Labiodental (F, V) - lower lip to upper teeth  
  FF: [
    ['V_Dental_Lip', 0.9],
    ['Mouth_Frown_L', 0.3],
    ['Mouth_Frown_R', 0.3]
  ],
  
  // TH: Dental - tongue between teeth
  TH: [
    ['V_Open', 0.4],
    ['Tongue_Out', 1.0]
  ],
  
  // DD: Alveolar stops - tongue to ridge
  DD: [
    ['V_Open', 0.3],
    ['Tongue_Tip_Up', 1.0]
  ],
  
  // kk: Velar stops - back of tongue raised
  kk: [
    ['V_Tight', 0.8],
    ['V_Open', 0.2]
  ],
  
  // CH: Affricates
  CH: [
    ['V_Affricate', 0.7],
    ['V_Wide', 0.5]
  ],
  
  // SS: Sibilants
  SS: [
    ['V_Tight', 0.7],
    ['V_Wide', 0.6]
  ],
  
  // nn: Nasals
  nn: [
    ['V_Tight', 0.6],
    ['Mouth_Smile_L', 0.2],
    ['Mouth_Smile_R', 0.2]
  ],
  
  // RR: Approximants
  RR: [
    ['V_Open', 0.6],
    ['V_Wide', 0.4]
  ],
  
  // aa: Open vowel
  aa: [
    ['V_Open', 1.0],
    ['Jaw_Open', 0.8]
  ],
  
  // E: Mid-front vowel
  E: [
    ['V_Wide', 1.0]
  ],
  
  // I: Close-front vowel
  I: [
    ['V_Wide', 0.6],
    ['Mouth_Smile_L', 0.4],
    ['Mouth_Smile_R', 0.4]
  ],
  
  // O: Mid-back vowel
  O: [
    ['Mouth_Pucker', 0.9],
    ['V_Open', 0.4]
  ],
  
  // U: Close-back vowel
  U: [
    ['Mouth_Pucker', 1.0],
    ['V_Tight-O', 0.7]
  ]
};

/**
 * Test bilabial morph combinations for PP viseme
 */
export const BILABIAL_TEST_COMBINATIONS = [
  // Test V_M variants (M is bilabial nasal)
  { name: 'V_M Only', morphs: [['V_M', 1.0]] },
  { name: 'V_M Medium', morphs: [['V_M', 0.7]] },
  { name: 'V_M + Narrow', morphs: [['V_M', 0.8], ['Mouth_Narrow', 0.4]] },
  
  // Test explicit B/P morphs if they exist
  { name: 'V_B Only', morphs: [['V_B', 1.0]] },
  { name: 'V_P Only', morphs: [['V_P', 1.0]] },
  
  // Mouth closure combinations
  { name: 'Mouth_Close', morphs: [['Mouth_Close', 1.0]] },
  { name: 'Lips_Together', morphs: [['Lips_Together', 1.0]] },
  
  // Negative opening to force closure
  { name: 'Negative Jaw_Open', morphs: [['Jaw_Open', -0.5]] },
  { name: 'Negative Mouth_Open', morphs: [['Mouth_Open', -1.0]] },
  
  // Combined approaches
  { name: 'V_M + Close', morphs: [['V_M', 0.7], ['Mouth_Close', 0.3]] },
  { name: 'V_M + Neg Jaw', morphs: [['V_M', 0.8], ['Jaw_Open', -0.2]] },
  
  // Avoid these (creates kiss/pucker)
  { name: 'BAD: V_Tight', morphs: [['V_Tight', 1.0]] },
  { name: 'BAD: Mouth_Pucker', morphs: [['Mouth_Pucker', 1.0]] },
  { name: 'BAD: V_Tight + Lip_Open', morphs: [['V_Tight', 1.0], ['V_Lip_Open', -0.2]] }
];

/**
 * Helper to apply viseme using canonical handler
 */
export function applyVisemeCanonical(handler, visemeName, intensity = 1.0) {
  const mapping = CORRECTED_VISEME_MAPPINGS[visemeName];
  if (!mapping) {
    console.warn(`Unknown viseme: ${visemeName}`);
    return false;
  }

  // Scale weights by intensity
  const scaledEntries = mapping.map(([morph, weight]) => [morph, weight * intensity]);
  
  return handler.applyVisemes(scaledEntries);
}

/**
 * Test all bilabial combinations to find the best PP viseme
 */
export async function testBilabialCombinations(handler, duration = 2000) {
  console.log('🔬 Testing bilabial morph combinations for PP viseme...');
  
  for (const test of BILABIAL_TEST_COMBINATIONS) {
    console.log(`Testing: ${test.name}`);
    handler.applyVisemes(test.morphs, 0); // No decay for testing
    
    await new Promise(resolve => setTimeout(resolve, duration));
    
    // Reset between tests
    handler.resetAllMorphs();
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('✅ Bilabial testing complete');
}
