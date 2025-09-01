import { FBXMorphTargetLoader, createActorCoreFBXViewer } from './fbxMorphTargetLoader.js';
import { extractTongueMorphs } from './fbxTongueMorphExtractor.js';

/**
 * Enhanced ActorCore FBX Lip-Sync Integration
 * Uses the original FBX file to access morph targets by name instead of indices
 */
export class FBXActorCoreLipSync {
  constructor() {
    this.loader = null;
    this.enhancedModel = null;
    this.isReady = false;
    
    // OPTIMIZED INTENSITY CONFIGURATION
    // Based on industry standards from Oculus LipSync, Ready Player Me, and Reallusion
    // These values create more natural-looking lip-sync animations
    this.globalIntensityMultiplier = 0.85; // Global dampening for all morphs (0.7-1.0 range)
    
    // Intensity multipliers by morph category
    this.intensityConfig = {
      // Jaw movements - varies by vowel openness
      jawOpen: {
        fullOpen: 1.0,      // For wide open vowels (AA)
        mediumOpen: 0.7,    // For mid vowels (E)
        slightOpen: 0.4,    // For close vowels (I)
        minimalOpen: 0.2,   // For nasals and minimal opening
      },
      
      // Lip pressing (bilabial sounds P/B/M)
      lipPress: {
        press: 0.5,         // Reduced from 1.0 to avoid over-compression
        close: 0.75,        // Natural closure without extreme compression
      },
      
      // Lip shapes and movements
      lipShapes: {
        smile: 0.4,         // Subtle smile for most cases
        smileExtreme: 0.8,  // Strong smile for 'ee' sounds
        stretch: 0.6,       // Horizontal stretch
        pucker: 0.85,       // Needs to be visible for U/OO
        funnel: 0.75,       // Rounded lips
        rollIn: 0.8,        // Lower lip roll for F/V
        shrugUpper: 0.6,    // Upper lip movement
        downLower: 0.65,    // Lower lip downward movement
      },
      
      // Tongue movements
      tongue: {
        out: 0.7,           // Tongue visibility for TH
        tipUp: 0.75,        // Alveolar contact
        curl: 0.8,          // R sound tongue curl
      }
    };
    
    // Map visemes to ActorCore morph target names based on actual FBX morph targets
    this.visemeToMorphMap = {
      // Standard visemes to ActorCore morph target names (phonetically accurate)
      'sil': null, // Silence - no morph needed
      'PP': null, // P, B, M sounds - use combination below
      'FF': null, // F, V sounds - use combination below
      'TH': 'Tongue_Out', // TH sounds - tongue between teeth
      'DD': 'Tongue_Tip_Up', // D, T, N sounds - tongue tip to alveolar ridge
      'kk': null, // K, G sounds - use combination below
      'CH': null, // CH, J, SH sounds - use combination below  
      'SS': null, // S, Z sounds - use combination below
      'nn': null, // N, NG sounds - use combination below
      'RR': 'Tongue_Curl', // R sounds - tongue curled back
      'aa': null, // AH sounds - use combination below
      'E': null, // EH sounds - use combination below
      'I': null, // IH sounds - use combination below
      'O': null, // OH sounds - use combination below
      'U': null, // OO sounds - use combination below
      
      // Additional phonemes mapped to visemes
      'A': null, // Use combination
      'B': null, // Use combination
      'C': null, // Use combination
      'D': 'Tongue_Tip_Up',
      'F': null, // Use combination
      'G': null, // Use combination
      'H': 'Jaw_Open', // H is just open mouth with breath
      'J': null, // Use combination
      'K': null, // Use combination
      'L': 'Tongue_Tip_Up',
      'M': null, // Use combination
      'N': null, // Use combination
      'P': null, // Use combination
      'Q': null, // Use combination
      'R': 'Tongue_Curl',
      'S': null, // Use combination
      'T': 'Tongue_Tip_Up',
      'V': null, // Use combination
      'W': null, // Use combination
      'X': null, // Use combination
      'Y': null, // Use combination
      'Z': null  // Use combination
    };

    // Additional morph targets for more complex visemes (combinations)
    this.visemeCombinations = {
      // Bilabial sounds (P, B, M) - lips pressed together
      'PP': ['Mouth_Close', 'Mouth_Press_L', 'Mouth_Press_R'], 
      'P': ['Mouth_Close', 'Mouth_Press_L', 'Mouth_Press_R'],
      'B': ['Mouth_Close', 'Mouth_Press_L', 'Mouth_Press_R'],
      'M': ['Mouth_Close', 'Mouth_Press_L', 'Mouth_Press_R'],
      
      // Labiodental sounds (F, V) - lower lip to upper teeth
      'FF': ['Mouth_Roll_In_Lower', 'Jaw_Open'],
      'F': ['Mouth_Roll_In_Lower', 'Jaw_Open'],
      'V': ['Mouth_Roll_In_Lower', 'Jaw_Open'],
      
      // Sibilant sounds (S, Z) - teeth nearly closed, lips slightly retracted
      'SS': ['Mouth_Stretch_L', 'Mouth_Stretch_R'],
      'S': ['Mouth_Stretch_L', 'Mouth_Stretch_R'],
      'Z': ['Mouth_Stretch_L', 'Mouth_Stretch_R'],
      
      // Postalveolar sounds (CH, J, SH) - lips rounded forward
      'CH': ['Mouth_Pucker', 'Mouth_Shrug_Upper', 'Jaw_Open'],
      'J': ['Mouth_Pucker', 'Mouth_Shrug_Upper', 'Jaw_Open'],
      
      // Velar sounds (K, G) - back of tongue raised, jaw moderately open
      // Less stretch than E, more jaw opening to differentiate
      'kk': ['Jaw_Open', 'Jaw_Forward'],  // K/G uses jaw forward motion
      'K': ['Jaw_Open', 'Jaw_Forward'],
      'G': ['Jaw_Open', 'Jaw_Forward'],
      'C': ['Jaw_Open', 'Jaw_Forward'],
      'Q': ['Jaw_Open', 'Jaw_Forward'],
      'X': ['Jaw_Open', 'Jaw_Forward'],
      
      // Nasal sounds (N, NG) - tongue tip up behind teeth, minimal jaw
      'nn': ['Tongue_Tip_Up', 'Jaw_Open'],  // N sound - tongue to alveolar ridge
      'N': ['Tongue_Tip_Up', 'Jaw_Open'],
      
      // Open vowel sounds (AH, A) - jaw wide open, neutral lips
      'aa': ['Jaw_Open', 'Mouth_Down_Lower_L', 'Mouth_Down_Lower_R'],
      'A': ['Jaw_Open', 'Mouth_Down_Lower_L', 'Mouth_Down_Lower_R'],
      
      // Front vowel sounds - ENHANCED FOR BETTER VISIBILITY
      // E (eh as in "bed") - less jaw, more lip spread than KK
      'E': ['Jaw_Open', 'Mouth_Stretch_L', 'Mouth_Stretch_R', 'Mouth_Smile_L', 'Mouth_Smile_R'],
      
      // I (ih as in "bit") - jaw slightly open, lips spread more than E
      'I': ['Jaw_Open', 'Mouth_Stretch_L', 'Mouth_Stretch_R', 'Mouth_Up_Upper_L', 'Mouth_Up_Upper_R'],
      
      // Y (ee as in "see") - lips spread in smile position
      'Y': ['Mouth_Smile_L', 'Mouth_Smile_R', 'Mouth_Stretch_L', 'Mouth_Stretch_R'],
      
      // Back rounded vowel sounds (O, U) - lips rounded
      'O': ['Jaw_Open', 'Mouth_Funnel'],  // OH sound - jaw open + lips rounded
      'U': ['Mouth_Pucker', 'Mouth_Funnel'],   // OO sound - lips tightly rounded
      'W': ['Mouth_Pucker', 'Mouth_Funnel'],   // W is similar to U
      
      // Alveolar sounds with proper tongue involvement
      'TH': ['Tongue_Out', 'Mouth_Smile_L', 'Mouth_Smile_R'], // Tongue between teeth with slight smile to show teeth
      'DD': ['Tongue_Tip_Up', 'Jaw_Open'], // D/T - tongue to alveolar ridge with slight jaw
      'RR': ['Tongue_Curl', 'Jaw_Open', 'Mouth_Funnel', 'Mouth_Pucker'] // R sound - tongue curled + rounded lips
    };

    // Backup: Map common visemes to likely ActorCore names
    this.fallbackMorphMap = {
      'sil': null,
      'PP': ['Mouth_Close', 'Mouth_Press_L', 'Mouth_Press_R'],
      'FF': ['Mouth_Funnel', 'Mouth_Pucker'],
      'TH': ['Mouth_Stretch_L', 'Mouth_Stretch_R'],
      'DD': ['Mouth_Press_L', 'Mouth_Press_R', 'Tongue_Out'],
      'kk': ['Jaw_Open', 'Jaw_Forward'],
      'CH': ['Mouth_Shrug_Upper', 'Mouth_Shrug_Lower'],
      'SS': ['Mouth_Smile_L', 'Mouth_Smile_R'],
      'nn': ['Mouth_Close', 'Tongue_Out'],
      'RR': ['Mouth_Funnel', 'Tongue_Out'],
      'aa': ['Jaw_Open', 'Mouth_Open'],
      'E': ['Mouth_Smile_L', 'Mouth_Smile_R'],
      'I': ['Mouth_Smile_L', 'Mouth_Smile_R'],
      'O': ['Mouth_Funnel', 'Mouth_Open'],
      'U': ['Mouth_Pucker', 'Mouth_Funnel']
    };
  }

  /**
   * Initialize the FBX lip-sync system with ActorCore model
   * @param {string} fbxUrl - Path to the ActorCore FBX file
   * @returns {Promise<Object>} - Scene setup ready for rendering
   */
  async initialize(fbxUrl) {
    try {
      console.log('🎭 Initializing FBX ActorCore Lip-Sync System...');
      
      // Load the enhanced FBX model
      const sceneSetup = await createActorCoreFBXViewer(fbxUrl);
      this.enhancedModel = sceneSetup;
      this.isReady = true;

      console.log('✅ FBX ActorCore Lip-Sync System ready!');
      console.log('🎯 Available morph targets:', Object.keys(sceneSetup.morphTargetNames));
      
      // ATTEMPT TO EXTRACT TONGUE MORPHS
      console.log('🔍 Attempting to extract tongue morphs...');
      if (sceneSetup.model) {
        const tongueExtraction = extractTongueMorphs(sceneSetup.model);
        
        if (tongueExtraction.morphCount > 0) {
          console.log('✅ TONGUE MORPHS FOUND AND EXTRACTED!');
          console.log('🎯 Extracted tongue morphs:', Object.keys(tongueExtraction.tongueMorphs));
          
          // Store the tongue morph activators for later use
          this.tongueMorphActivators = tongueExtraction.activators;
          this.tongueMorphs = tongueExtraction.tongueMorphs;
          
          // Update our enhanced model to include tongue morph activation
          const originalSetMorphTarget = this.enhancedModel.setMorphTarget;
          this.enhancedModel.setMorphTarget = (morphName, value) => {
            // First try the original method
            const result = originalSetMorphTarget && originalSetMorphTarget(morphName, value);
            
            // If that didn't work and it's a tongue morph, try the extractor
            if (!result && morphName && morphName.toLowerCase().includes('tongue')) {
              if (this.tongueMorphActivators && this.tongueMorphActivators[morphName]) {
                return this.tongueMorphActivators[morphName](value);
              }
            }
            
            return result;
          };
          
          console.log('✅ Tongue morph activation integrated into lip-sync system');
        } else {
          console.log('❌ No tongue morphs could be extracted - using fallback mapping');
          console.log('📝 Using visual differentiation workarounds for DD, KK, RR visemes');
        }
      }
      
      // Validate our viseme mapping
      this.validateVisemeMapping();

      return sceneSetup;

    } catch (error) {
      console.error('❌ Failed to initialize FBX lip-sync system:', error);
      throw error;
    }
  }

  /**
   * Validate that our viseme mapping works with the loaded model
   */
  validateVisemeMapping() {
    if (!this.enhancedModel || !this.enhancedModel.morphTargetNames) {
      console.warn('⚠️ Enhanced model or morphTargetNames not available for validation');
      return;
    }

    try {
      const morphTargetNames = this.enhancedModel.morphTargetNames;
      if (!morphTargetNames || typeof morphTargetNames !== 'object') {
        console.warn('⚠️ Invalid morphTargetNames object');
        return;
      }

      const availableMorphs = Object.keys(morphTargetNames);
      const visemeMap = this.visemeToMorphMap;
      if (!visemeMap || typeof visemeMap !== 'object') {
        console.warn('⚠️ Invalid visemeToMorphMap object');
        return;
      }

      const mappedMorphs = Object.values(visemeMap).filter(Boolean);
      
      console.log('🔍 Validating viseme to morph target mapping...');
      console.log('📝 Available morphs count:', availableMorphs.length);
      console.log('🎯 Mapped morphs count:', mappedMorphs.length);

      // Only check for missing morphs if we have both arrays populated
      if (availableMorphs.length > 0 && mappedMorphs.length > 0) {
        const missingMorphs = mappedMorphs.filter(morph => !availableMorphs.includes(morph));
        if (missingMorphs.length > 0) {
          console.warn('⚠️ Missing expected morph targets:', missingMorphs);
          console.log('🔄 Will attempt fallback mapping...');
        } else {
          console.log('✅ All mapped visemes have corresponding morph targets');
        }
      }
    } catch (error) {
      console.error('❌ Error during viseme mapping validation:', error);
    }
  }

  /**
   * Apply viseme with smooth transitions
   * @param {string} viseme - Viseme name (e.g., 'aa', 'PP', 'FF')
   * @param {number} intensity - Intensity of the viseme (0-1)
   */
  applyViseme(viseme, intensity = 1.0) {
    if (!this.isReady || !this.enhancedModel) {
      console.warn('⚠️ FBX lip-sync system not ready');
      return;
    }

    // Reset all morph targets to 0 first for clean transitions
    this.resetAllMorphTargets();

    // Check if this viseme has a combination of morph targets
    if (this.visemeCombinations[viseme]) {
      const morphTargets = this.visemeCombinations[viseme];
      let appliedCount = 0;
      
      // Apply each morph target in the combination
      morphTargets.forEach(morphTarget => {
        // Apply global intensity multiplier and config-based intensity
        let combinedIntensity = intensity * this.globalIntensityMultiplier;
        
        // Use optimized intensity values from configuration
        if (morphTarget.includes('Jaw_Open')) {
          // Different jaw openings for different sounds based on config
          if (viseme === 'aa' || viseme === 'A') {
            combinedIntensity *= this.intensityConfig.jawOpen.fullOpen;
          } else if (viseme === 'E') {
            combinedIntensity *= this.intensityConfig.jawOpen.mediumOpen;
          } else if (viseme === 'I') {
            combinedIntensity *= this.intensityConfig.jawOpen.slightOpen;
          } else if (viseme === 'O') {
            combinedIntensity *= this.intensityConfig.jawOpen.mediumOpen * 1.1; // Slightly more for O
          } else if (viseme === 'kk' || viseme === 'K' || viseme === 'G') {
            combinedIntensity *= this.intensityConfig.jawOpen.mediumOpen;
          } else if (viseme === 'FF' || viseme === 'F' || viseme === 'V') {
            combinedIntensity *= this.intensityConfig.jawOpen.slightOpen * 0.75; // Even less for F/V
          } else if (viseme === 'CH' || viseme === 'J') {
            combinedIntensity *= this.intensityConfig.jawOpen.slightOpen;
          } else if (viseme === 'TH') {
            combinedIntensity *= this.intensityConfig.jawOpen.minimalOpen * 0.5; // Very minimal for TH to show teeth
          } else if (viseme === 'DD' || viseme === 'RR') {
            combinedIntensity *= this.intensityConfig.jawOpen.slightOpen;
          } else if (viseme === 'nn' || viseme === 'N') {
            combinedIntensity *= this.intensityConfig.jawOpen.slightOpen * 0.8; // Slight opening for N
          } else {
            combinedIntensity *= this.intensityConfig.jawOpen.mediumOpen * 0.85;
          }
        } else if (morphTarget.includes('Mouth_Press')) {
          combinedIntensity *= this.intensityConfig.lipPress.press;
        } else if (morphTarget.includes('Mouth_Close')) {
          combinedIntensity *= this.intensityConfig.lipPress.close;
        } else if (morphTarget.includes('Mouth_Smile')) {
          // Different smile intensities for different vowels
          if (viseme === 'Y') {
            combinedIntensity *= this.intensityConfig.lipShapes.smileExtreme;
          } else if (viseme === 'SS' || viseme === 'S' || viseme === 'Z' || viseme === 'I') {
            combinedIntensity *= this.intensityConfig.lipShapes.smile;
          } else {
            combinedIntensity *= this.intensityConfig.lipShapes.smile * 0.8;
          }
        } else if (morphTarget.includes('Mouth_Stretch')) {
          combinedIntensity *= this.intensityConfig.lipShapes.stretch;
          // Additional adjustments for specific visemes
          if (viseme === 'Y') {
            combinedIntensity *= 1.3; // More stretch for Y
          } else if (viseme === 'I') {
            combinedIntensity *= 1.15; // Slightly more for I
          }
        } else if (morphTarget.includes('Mouth_Up_Upper')) {
          combinedIntensity *= this.intensityConfig.lipShapes.smile * 0.8; // Subtle upper lip movement
        } else if (morphTarget.includes('Mouth_Pucker')) {
          combinedIntensity *= this.intensityConfig.lipShapes.pucker;
        } else if (morphTarget.includes('Mouth_Funnel')) {
          combinedIntensity *= this.intensityConfig.lipShapes.funnel;
        } else if (morphTarget.includes('Mouth_Roll_In_Lower')) {
          combinedIntensity *= this.intensityConfig.lipShapes.rollIn;
        } else if (morphTarget.includes('Tongue_Out')) {
          combinedIntensity *= this.intensityConfig.tongue.out;
        } else if (morphTarget.includes('Tongue_Tip_Up')) {
          combinedIntensity *= this.intensityConfig.tongue.tipUp;
        } else if (morphTarget.includes('Tongue_Curl')) {
          combinedIntensity *= this.intensityConfig.tongue.curl;
        } else if (morphTarget.includes('Mouth_Down_Lower')) {
          combinedIntensity *= this.intensityConfig.lipShapes.downLower;
        } else if (morphTarget.includes('Mouth_Shrug')) {
          combinedIntensity *= this.intensityConfig.lipShapes.shrugUpper;
        } else {
          combinedIntensity *= 0.65; // Default moderate intensity
        }
        
        if (this.enhancedModel.setMorphTarget(morphTarget, combinedIntensity)) {
          appliedCount++;
        }
      });
      
      if (appliedCount > 0) {
        console.log(`🎭 Applied combined viseme "${viseme}" with ${appliedCount} morphs at intensity ${intensity}`);
        return;
      }
    }

    // Apply single morph target mapping
    const morphTarget = this.visemeToMorphMap[viseme];
    
    if (morphTarget && this.enhancedModel.setMorphTarget(morphTarget, intensity)) {
      console.log(`🎭 Applied viseme "${viseme}" to morph "${morphTarget}" at intensity ${intensity}`);
    } else if (viseme !== 'sil') {
      // Try fallback mapping
      this.tryFallbackViseme(viseme, intensity);
    }
  }

  /**
   * Try fallback viseme mapping if primary mapping fails
   * @param {string} viseme - Viseme name
   * @param {number} intensity - Intensity value
   */
  tryFallbackViseme(viseme, intensity) {
    const fallbackMorphs = this.fallbackMorphMap[viseme];
    
    if (fallbackMorphs && Array.isArray(fallbackMorphs)) {
      // Try each fallback option until one works
      for (const morphTarget of fallbackMorphs) {
        if (this.enhancedModel.setMorphTarget(morphTarget, intensity)) {
          console.log(`🔄 Applied fallback viseme "${viseme}" to morph "${morphTarget}"`);
          return;
        }
      }
    }

    console.warn(`⚠️ Could not apply viseme "${viseme}" - no matching morph target found`);
  }

  /**
   * Apply lip-sync data from speech processing
   * @param {Array} lipSyncData - Array of {time, viseme, intensity} objects
   * @param {number} currentTime - Current playback time
   */
  applyLipSyncData(lipSyncData, currentTime) {
    if (!this.isReady || !lipSyncData) return;

    // Find the current viseme based on timing
    const currentFrame = lipSyncData.find(frame => 
      currentTime >= frame.time && currentTime < (frame.time + (frame.duration || 0.1))
    );

    if (currentFrame) {
      this.applyViseme(currentFrame.viseme, currentFrame.intensity || 1.0);
    } else {
      // No active viseme, return to neutral
      this.applyViseme('sil');
    }
  }

  /**
   * Reset all morph targets to neutral position
   */
  resetAllMorphTargets() {
    if (!this.enhancedModel || !this.enhancedModel.listMorphTargets) return;

    try {
      const morphTargets = this.enhancedModel.listMorphTargets();
      if (Array.isArray(morphTargets)) {
        morphTargets.forEach(target => {
          if (target && target.name) {
            this.enhancedModel.setMorphTarget(target.name, 0);
          }
        });
      }
    } catch (error) {
      console.warn('⚠️ Error resetting morph targets:', error);
    }
  }

  /**
   * Get debug information about the current state
   * @returns {Object} - Debug information
   */
  getDebugInfo() {
    // ROBUST: Always return a safe object even when not ready
    const defaultDebugInfo = { 
      ready: false, 
      morphTargets: [], 
      visemeMapping: {},
      meshCount: 0 
    };

    if (!this.enhancedModel) {
      return defaultDebugInfo;
    }

    try {
      // SAFE: Ensure morphTargets is always an array
      let morphTargets = [];
      if (this.enhancedModel.listMorphTargets && typeof this.enhancedModel.listMorphTargets === 'function') {
        const result = this.enhancedModel.listMorphTargets();
        morphTargets = Array.isArray(result) ? result : [];
      }

      // SAFE: Ensure visemeMapping is always an object
      const visemeMapping = (this.visemeToMorphMap && typeof this.visemeToMorphMap === 'object') ? 
        this.visemeToMorphMap : {};

      // SAFE: Ensure meshCount is always a number
      let meshCount = 0;
      if (this.enhancedModel.morphTargetMeshes) {
        meshCount = Array.isArray(this.enhancedModel.morphTargetMeshes) ? 
          this.enhancedModel.morphTargetMeshes.length : 0;
      }

      return {
        ready: Boolean(this.isReady),
        morphTargets,
        visemeMapping,
        meshCount
      };
    } catch (error) {
      console.error('❌ Error getting debug info:', error);
      return defaultDebugInfo;
    }
  }

  /**
   * Manually test a specific morph target
   * @param {string} morphName - Name of the morph target
   * @param {number} value - Value to set (0-1)
   */
  testMorphTarget(morphName, value = 1.0) {
    if (!this.enhancedModel) return false;
    return this.enhancedModel.setMorphTarget(morphName, value);
  }

  /**
   * Test all available morph targets sequentially
   * @param {number} duration - Duration to hold each morph (ms)
   */
  async testAllMorphTargets(duration = 1000) {
    if (!this.enhancedModel || !this.enhancedModel.listMorphTargets) return;

    try {
      const morphTargets = this.enhancedModel.listMorphTargets();
      if (!Array.isArray(morphTargets) || morphTargets.length === 0) {
        console.log('⚠️ No morph targets available for testing');
        return;
      }

      console.log(`🧪 Testing ${morphTargets.length} morph targets...`);

      for (const target of morphTargets) {
        if (target && target.name) {
          console.log(`Testing morph: ${target.name}`);
          this.resetAllMorphTargets();
          this.enhancedModel.setMorphTarget(target.name, 1.0);
          await new Promise(resolve => setTimeout(resolve, duration));
        }
      }

      // Reset to neutral
      this.resetAllMorphTargets();
      console.log('✅ Morph target testing complete');
    } catch (error) {
      console.error('❌ Error during morph target testing:', error);
    }
  }
}

/**
 * Create and initialize FBX ActorCore lip-sync system
 * @param {string} fbxUrl - Path to ActorCore FBX file
 * @returns {Promise<Object>} - Complete lip-sync system with scene
 */
export async function createFBXActorCoreLipSyncSystem(fbxUrl) {
  try {
    const lipSyncSystem = new FBXActorCoreLipSync();
    const sceneSetup = await lipSyncSystem.initialize(fbxUrl);
    
    // Safely construct the return object without spreading potentially problematic properties
    const result = {
      scene: sceneSetup.scene,
      camera: sceneSetup.camera,
      model: sceneSetup.model,
      morphTargetMeshes: sceneSetup.morphTargetMeshes || [],
      morphTargetNames: sceneSetup.morphTargetNames || {},
      box: sceneSetup.box,
      lipSync: lipSyncSystem
    };

    // Add methods safely
    if (sceneSetup.setMorphTarget) {
      result.setMorphTarget = sceneSetup.setMorphTarget;
    }
    if (sceneSetup.listMorphTargets) {
      result.listMorphTargets = sceneSetup.listMorphTargets;
    }
    if (sceneSetup.getMorphTargetValue) {
      result.getMorphTargetValue = sceneSetup.getMorphTargetValue;
    }

    console.log('✅ FBX ActorCore Lip-Sync System fully initialized');
    return result;

  } catch (error) {
    console.error('❌ Failed to create FBX ActorCore lip-sync system:', error);
    throw error;
  }
}
