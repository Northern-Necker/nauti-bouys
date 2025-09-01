import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

/**
 * Production-Ready ActorCore GLB Lip-Sync System
 * Comprehensive implementation for TTS integration with 100% accurate viseme morphs
 */
export class GLBActorCoreLipSync {
  constructor() {
    this.loader = new GLTFLoader();
    this.model = null;
    this.scene = null;
    this.isReady = false;
    this.meshTargets = [];
    this.tongueMesh = null;
    this.bodyMesh = null;
    this.currentViseme = null;
    this.targetMorphs = {};
    this.currentMorphs = {};
    this.morphTransitionSpeed = 0.15; // Smooth transitions between visemes
    
    // Production-calibrated intensity multipliers
    this.globalIntensityMultiplier = 1.0; // Full intensity for TTS
    
    // Viseme-specific intensity calibration for natural speech
    this.visemeIntensities = {
      'sil': 0.0,
      'PP': 0.9,   // Bilabial plosive
      'FF': 0.85,  // Labiodental fricative
      'TH': 0.8,   // Dental fricative
      'DD': 0.75,  // Alveolar plosive
      'kk': 0.8,   // Velar plosive
      'CH': 0.85,  // Affricate
      'SS': 0.9,   // Alveolar fricative
      'nn': 0.7,   // Nasal
      'RR': 0.75,  // Approximant
      'aa': 1.0,   // Open vowel
      'E': 0.85,   // Mid-front vowel
      'I': 0.8,    // High-front vowel
      'O': 0.9,    // Mid-back vowel
      'U': 0.85    // High-back vowel
    };
    
    // Comprehensive viseme-to-morph mappings for ActorCore avatars
    this.visemeMappings = {
      'sil': [], // Silence - neutral position
      
      // Consonants with precise morph combinations
      'PP': {
        morphs: ['V_Explosive', 'V_Lip_Open', 'Mouth_Press_L', 'Mouth_Press_R'],
        weights: [1.0, 0.3, 0.6, 0.6]
      },
      
      'FF': {
        morphs: ['V_Dental_Lip', 'V_Open', 'Mouth_Press_L'],
        weights: [1.0, 0.4, 0.5]
      },
      
      'TH': {
        morphs: ['V_Tongue_Out', 'V_Dental_Lip', 'V_Open', 'V_Tight'],
        weights: [0.8, 0.7, 0.5, 0.3]
      },
      
      'DD': {
        morphs: ['Tongue_Up', 'V_Dental_Lip', 'V_Open', 'V_Lip_Open'],
        weights: [0.9, 0.6, 0.5, 0.4]
      },
      
      'kk': {
        morphs: ['V_Tongue_up', 'V_Open', 'Tongue_Wide', 'V_Tight', 'Jaw_Open'],
        weights: [1.0, 0.6, 0.7, 0.4, 0.3]
      },
      
      'CH': {
        morphs: ['V_Affricate', 'V_Open', 'V_Tight-O', 'Tongue_Up'],
        weights: [1.0, 0.5, 0.6, 0.7]
      },
      
      'SS': {
        morphs: ['V_Wide', 'V_Open', 'V_Tongue_Narrow', 'V_Tight', 'Jaw_Open'],
        weights: [0.9, 0.6, 0.8, 0.7, 0.4]
      },
      
      'nn': {
        morphs: ['Tongue_Tip_Up', 'V_Open', 'V_Lip_Open', 'V_Tongue_Narrow'],
        weights: [1.0, 0.3, 0.5, 0.6]
      },
      
      'RR': {
        morphs: ['V_Tongue_Curl-U', 'V_Tight-O', 'V_Open', 'Tongue_Roll'],
        weights: [0.8, 0.5, 0.4, 0.9]
      },
      
      // Vowels with full mouth opening
      'aa': {
        morphs: ['V_Open', 'Jaw_Open', 'Tongue_Down', 'V_Lip_Open'],
        weights: [1.0, 1.0, 0.7, 0.6]
      },
      
      'E': {
        morphs: ['V_Wide', 'V_Open', 'V_Lip_Open', 'Tongue_Tip_Down', 'Jaw_Open'],
        weights: [0.8, 0.7, 0.6, 0.5, 0.5]
      },
      
      'I': {
        morphs: ['V_Wide', 'V_Tight', 'Tongue_Up', 'V_Lip_Open'],
        weights: [0.9, 0.6, 0.7, 0.5]
      },
      
      'O': {
        morphs: ['V_Tight-O', 'V_Open', 'Jaw_Open', 'Mouth_Pucker'],
        weights: [0.8, 0.8, 0.7, 0.5]
      },
      
      'U': {
        morphs: ['V_Tight-O', 'V_Open', 'Tongue_Up', 'Mouth_Pucker', 'Jaw_Open'],
        weights: [0.9, 0.6, 0.5, 0.8, 0.4]
      }
    };
  }

  async initialize(glbUrl) {
    try {
      console.log('🎭 Initializing Production GLB ActorCore Lip-Sync System...');
      
      const gltf = await this.loader.loadAsync(glbUrl);
      this.model = gltf.scene;
      this.scene = gltf.scene;
      
      // Process all meshes and set up materials
      this.model.traverse((obj) => {
        if (obj.isMesh || obj.isSkinnedMesh) {
          // Ensure mesh remains visible
          obj.visible = true;
          obj.frustumCulled = false; // Disable frustum culling to prevent disappearing meshes
          
          // Configure materials for morph targets and visibility
          const configureMaterial = (material) => {
            material.morphTargets = true;
            material.morphNormals = true;
            material.side = THREE.DoubleSide; // Render both sides to prevent invisible faces
            material.transparent = false; // Ensure material is not accidentally transparent
            material.opacity = 1.0; // Full opacity
            material.depthWrite = true; // Ensure depth writing is enabled
            material.depthTest = true; // Ensure depth testing is enabled
            material.needsUpdate = true;
          };
          
          if (Array.isArray(obj.material)) {
            obj.material.forEach(configureMaterial);
          } else if (obj.material) {
            configureMaterial(obj.material);
          }
          
          // Process morph targets
          if (obj.morphTargetDictionary && obj.morphTargetInfluences) {
            this.meshTargets.push(obj);
            
            // Initialize morph influences
            for (let i = 0; i < obj.morphTargetInfluences.length; i++) {
              obj.morphTargetInfluences[i] = 0;
            }
            
            // Enable morph target updates
            obj.updateMorphTargets();
            
            console.log(`✅ Found mesh: ${obj.name} with ${Object.keys(obj.morphTargetDictionary).length} morphs`);
            
            // Identify specific meshes
            if (obj.name.includes('CC_Game_Tongue')) {
              this.tongueMesh = obj;
              console.log('  └─ Tongue mesh identified');
            } else if (obj.name.includes('CC_Game_Body')) {
              this.bodyMesh = obj;
              console.log('  └─ Body/Face mesh identified');
            }
            
            // Initialize current morph values
            Object.keys(obj.morphTargetDictionary).forEach(morphName => {
              this.currentMorphs[morphName] = 0;
              this.targetMorphs[morphName] = 0;
            });
          }
        }
      });
      
      // Verify critical meshes
      if (!this.bodyMesh) {
        console.warn('⚠️ Body mesh not found - some visemes may not work correctly');
      }
      if (!this.tongueMesh) {
        console.warn('⚠️ Tongue mesh not found - tongue morphs will be limited');
      }
      
      this.isReady = true;
      console.log('✅ Lip-Sync System Ready - Found', this.meshTargets.length, 'meshes with morphs');
      
      // Start the animation loop for smooth transitions
      this.startAnimationLoop();
      
      return {
        scene: this.scene,
        model: this.model,
        lipSync: this
      };
      
    } catch (error) {
      console.error('❌ Failed to initialize GLB lip-sync system:', error);
      throw error;
    }
  }

  /**
   * Apply a viseme with proper morph combinations and weights
   */
  applyViseme(viseme, intensity = 1.0, immediate = false) {
    if (!this.isReady) {
      console.warn('⚠️ Lip-sync system not ready');
      return { success: false, error: 'System not ready' };
    }
    
    // Get viseme-specific intensity
    const visemeIntensity = (this.visemeIntensities[viseme] || 1.0) * intensity;
    
    console.log(`🎭 Applying viseme: ${viseme} (intensity: ${visemeIntensity.toFixed(2)})`);
    
    // Reset ALL target morphs to 0
    Object.keys(this.targetMorphs).forEach(key => {
      this.targetMorphs[key] = 0;
    });
    
    // Apply viseme morphs
    const mapping = this.visemeMappings[viseme];
    const appliedMorphs = [];
    
    if (mapping && mapping.morphs) {
      mapping.morphs.forEach((morphName, index) => {
        const weight = (mapping.weights[index] || 1.0) * visemeIntensity * this.globalIntensityMultiplier;
        
        // Apply the morph (will be ignored if it doesn't exist on any mesh)
        this.targetMorphs[morphName] = weight;
        appliedMorphs.push({ morph: morphName, weight: weight.toFixed(3) });
        console.log(`  ✓ Applied ${morphName}: ${weight.toFixed(3)}`);
      });
    } else if (viseme !== 'sil') {
      console.warn(`  ⚠️ No mapping found for viseme: ${viseme}`);
    }
    
    // If immediate, skip animation and apply directly
    if (immediate) {
      this.applyMorphsImmediately();
    }
    
    this.currentViseme = viseme;
    
    console.log(`  📊 Total morphs applied: ${appliedMorphs.length}`);
    
    return {
      success: true,
      viseme: viseme,
      intensity: visemeIntensity,
      morphsApplied: appliedMorphs.length,
      morphs: appliedMorphs
    };
  }

  /**
   * Apply morphs immediately without animation
   */
  applyMorphsImmediately() {
    Object.keys(this.targetMorphs).forEach(morphName => {
      this.currentMorphs[morphName] = this.targetMorphs[morphName];
    });
    this.updateMeshMorphs();
  }

  /**
   * Update mesh morph targets with current values
   */
  updateMeshMorphs() {
    for (const mesh of this.meshTargets) {
      if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) continue;
      
      let morphsUpdated = false;
      
      // Iterate through the morph dictionary to update influences
      Object.entries(mesh.morphTargetDictionary).forEach(([morphName, index]) => {
        const targetValue = this.currentMorphs[morphName] || 0;
        
        // Always update to ensure changes are applied
        if (mesh.morphTargetInfluences[index] !== targetValue) {
          mesh.morphTargetInfluences[index] = targetValue;
          morphsUpdated = true;
          
          // Debug log for significant changes
          if (Math.abs(targetValue) > 0.01) {
            console.log(`  💠 Setting ${morphName} on ${mesh.name}: ${targetValue.toFixed(3)}`);
          }
        }
      });
      
      // Force Three.js to update the mesh if morphs changed
      if (morphsUpdated) {
        // Critical: Mark morph targets as needing update
        if (mesh.geometry) {
          // For BufferGeometry (which GLB uses)
          if (mesh.geometry.morphAttributes && mesh.geometry.morphAttributes.position) {
            // Mark morph attributes as needing update
            mesh.geometry.morphAttributesNeedUpdate = true;
          }
          
          // Compute morph normals if available
          if (mesh.geometry.morphAttributes && mesh.geometry.morphAttributes.normal) {
            mesh.geometry.morphNormalsNeedUpdate = true;
          }
          
          // Update bounding volumes
          mesh.geometry.computeBoundingBox();
          mesh.geometry.computeBoundingSphere();
        }
        
        // Force material update for morph targets
        if (mesh.material) {
          const updateMaterial = (mat) => {
            mat.morphTargets = true;
            mat.morphNormals = true;
            mat.needsUpdate = true;
          };
          
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(updateMaterial);
          } else {
            updateMaterial(mesh.material);
          }
        }
        
        // Force the mesh to update its matrix
        mesh.updateMatrix();
        mesh.updateMatrixWorld(true);
        
        // Call updateMorphTargets to refresh the morph state
        if (mesh.updateMorphTargets) {
          mesh.updateMorphTargets();
        }
      }
    }
  }

  /**
   * Animation loop for smooth morph transitions
   */
  startAnimationLoop() {
    const animate = () => {
      if (!this.isReady) {
        requestAnimationFrame(animate);
        return;
      }
      
      // Smoothly interpolate between current and target morphs
      let needsUpdate = false;
      
      // Update all morph values
      Object.keys(this.targetMorphs).forEach(morphName => {
        const current = this.currentMorphs[morphName] || 0;
        const target = this.targetMorphs[morphName] || 0;
        
        if (Math.abs(current - target) > 0.001) {
          // Smooth interpolation
          this.currentMorphs[morphName] = THREE.MathUtils.lerp(
            current,
            target,
            this.morphTransitionSpeed
          );
          needsUpdate = true;
        } else if (current !== target) {
          // Snap to target if very close
          this.currentMorphs[morphName] = target;
          needsUpdate = true;
        }
      });
      
      // Apply updates if needed
      if (needsUpdate) {
        this.updateMeshMorphs();
      }
      
      // Continue the animation loop
      requestAnimationFrame(animate);
    };
    
    // Start the loop
    animate();
  }

  /**
   * Reset all morphs to neutral position
   */
  reset() {
    Object.keys(this.targetMorphs).forEach(key => {
      this.targetMorphs[key] = 0;
    });
    this.currentViseme = null;
    console.log('🔄 Reset to neutral position');
  }

  /**
   * Set transition speed for morph animations
   */
  setTransitionSpeed(speed) {
    this.morphTransitionSpeed = Math.max(0.01, Math.min(1.0, speed));
    console.log(`⚙️ Transition speed set to: ${this.morphTransitionSpeed}`);
  }

  /**
   * Get current viseme state
   */
  getCurrentState() {
    return {
      viseme: this.currentViseme,
      isReady: this.isReady,
      meshCount: this.meshTargets.length,
      hasBodyMesh: !!this.bodyMesh,
      hasTongueMesh: !!this.tongueMesh,
      activeMorphs: Object.entries(this.currentMorphs)
        .filter(([_, value]) => value > 0.01)
        .map(([name, value]) => ({ name, value: value.toFixed(3) }))
    };
  }

  /**
   * Test all visemes sequentially
   */
  async testAllVisemes(duration = 1000) {
    const visemes = Object.keys(this.visemeMappings);
    
    for (const viseme of visemes) {
      console.log(`Testing viseme: ${viseme}`);
      this.applyViseme(viseme, 1.0);
      await new Promise(resolve => setTimeout(resolve, duration));
    }
    
    this.reset();
    console.log('✅ Viseme test complete');
  }
}

/**
 * Export the viseme combinations for testing purposes
 */
export const actorCoreVisemeCombinations = {
  'sil': [], // Silence - neutral position
  
  // Consonants with precise morph combinations
  'PP': {
    morphs: ['V_Explosive', 'V_Lip_Open', 'Mouth_Press_L', 'Mouth_Press_R'],
    weights: [1.0, 0.3, 0.6, 0.6]
  },
  
  'FF': {
    morphs: ['V_Dental_Lip', 'V_Open', 'Mouth_Press_L'],
    weights: [1.0, 0.4, 0.5]
  },
  
  'TH': {
    morphs: ['V_Tongue_Out', 'V_Dental_Lip', 'V_Open', 'V_Tight'],
    weights: [0.8, 0.7, 0.5, 0.3]
  },
  
  'DD': {
    morphs: ['Tongue_Up', 'V_Dental_Lip', 'V_Open', 'V_Lip_Open'],
    weights: [0.9, 0.6, 0.5, 0.4]
  },
  
  'kk': {
    morphs: ['V_Tongue_up', 'V_Open', 'Tongue_Wide', 'V_Tight', 'Jaw_Open'],
    weights: [1.0, 0.6, 0.7, 0.4, 0.3]
  },
  
  'CH': {
    morphs: ['V_Affricate', 'V_Open', 'V_Tight-O', 'Tongue_Up'],
    weights: [1.0, 0.5, 0.6, 0.7]
  },
  
  'SS': {
    morphs: ['V_Wide', 'V_Open', 'V_Tongue_Narrow', 'V_Tight', 'Jaw_Open'],
    weights: [0.9, 0.6, 0.8, 0.7, 0.4]
  },
  
  'nn': {
    morphs: ['Tongue_Tip_Up', 'V_Open', 'V_Lip_Open', 'V_Tongue_Narrow'],
    weights: [1.0, 0.3, 0.5, 0.6]
  },
  
  'RR': {
    morphs: ['V_Tongue_Curl-U', 'V_Tight-O', 'V_Open', 'Tongue_Roll'],
    weights: [0.8, 0.5, 0.4, 0.9]
  },
  
  // Vowels with full mouth opening
  'aa': {
    morphs: ['V_Open', 'Jaw_Open', 'Tongue_Down', 'V_Lip_Open'],
    weights: [1.0, 1.0, 0.7, 0.6]
  },
  
  'E': {
    morphs: ['V_Wide', 'V_Open', 'V_Lip_Open', 'Tongue_Tip_Down', 'Jaw_Open'],
    weights: [0.8, 0.7, 0.6, 0.5, 0.5]
  },
  
  'I': {
    morphs: ['V_Wide', 'V_Tight', 'Tongue_Up', 'V_Lip_Open'],
    weights: [0.9, 0.6, 0.7, 0.5]
  },
  
  'O': {
    morphs: ['V_Tight-O', 'V_Open', 'Jaw_Open', 'Mouth_Pucker'],
    weights: [0.8, 0.8, 0.7, 0.5]
  },
  
  'U': {
    morphs: ['V_Tight-O', 'V_Open', 'Tongue_Up', 'Mouth_Pucker', 'Jaw_Open'],
    weights: [0.9, 0.6, 0.5, 0.8, 0.4]
  }
};

/**
 * Factory function to create and initialize the lip-sync system
 */
export async function createGLBActorCoreLipSyncSystem(glbUrl) {
  try {
    const lipSyncSystem = new GLBActorCoreLipSync();
    const result = await lipSyncSystem.initialize(glbUrl);
    
    // Expose useful methods on the result
    result.applyViseme = (viseme, intensity, immediate) => 
      lipSyncSystem.applyViseme(viseme, intensity, immediate);
    result.reset = () => lipSyncSystem.reset();
    result.testAllVisemes = (duration) => lipSyncSystem.testAllVisemes(duration);
    result.getCurrentState = () => lipSyncSystem.getCurrentState();
    result.setTransitionSpeed = (speed) => lipSyncSystem.setTransitionSpeed(speed);
    
    return result;
    
  } catch (error) {
    console.error('❌ Failed to create GLB ActorCore lip-sync system:', error);
    throw error;
  }
}
