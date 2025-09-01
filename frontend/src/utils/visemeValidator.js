/**
 * Viseme Validation and Management Utility
 * Fixes broken morph targets and polygon artifacts
 */

export class VisemeValidator {
  constructor() {
    this.validMorphTargets = new Map();
    this.brokenTargets = new Set();
    this.maxIntensity = 0.6; // Safe maximum to prevent artifacts
  }

  /**
   * Validate and catalog morph targets from a GLB scene
   */
  validateMorphTargets(scene) {
    console.log('🔍 Validating morph targets...');
    
    const results = {
      valid: [],
      broken: [],
      facial: [],
      other: []
    };
    
    scene.traverse((child) => {
      if (child.isMesh && child.morphTargetDictionary) {
        const morphDict = child.morphTargetDictionary;
        const influences = child.morphTargetInfluences || [];
        
        Object.entries(morphDict).forEach(([name, index]) => {
          const morphInfo = {
            name,
            index,
            mesh: child,
            isValid: this.validateMorphTarget(child, index),
            category: this.categorizeMorphTarget(name)
          };
          
          if (morphInfo.isValid) {
            this.validMorphTargets.set(name, morphInfo);
            results.valid.push(morphInfo);
            
            if (morphInfo.category === 'facial') {
              results.facial.push(morphInfo);
            } else {
              results.other.push(morphInfo);
            }
          } else {
            this.brokenTargets.add(name);
            results.broken.push(morphInfo);
          }
          
          console.log(`  ${morphInfo.isValid ? '✅' : '❌'} ${name} (${morphInfo.category})`);
        });
      }
    });
    
    console.log(`📊 Validation complete: ${results.valid.length} valid, ${results.broken.length} broken`);
    return results;
  }
  
  /**
   * Check if a morph target is safe to use
   */
  validateMorphTarget(mesh, index) {
    try {
      if (!mesh.morphTargetInfluences) return false;
      if (index >= mesh.morphTargetInfluences.length) return false;
      if (index < 0) return false;
      
      // Test with small value to check for artifacts
      const originalValue = mesh.morphTargetInfluences[index];
      mesh.morphTargetInfluences[index] = 0.1;
      
      // Check geometry bounds
      mesh.geometry.computeBoundingBox();
      const box = mesh.geometry.boundingBox;
      const isValid = box && 
        isFinite(box.min.x) && isFinite(box.max.x) &&
        isFinite(box.min.y) && isFinite(box.max.y) &&
        isFinite(box.min.z) && isFinite(box.max.z);
      
      // Restore original value
      mesh.morphTargetInfluences[index] = originalValue;
      
      return isValid;
    } catch (error) {
      console.warn(`Morph target validation failed for index ${index}:`, error);
      return false;
    }
  }
  
  /**
   * Categorize morph target by name
   */
  categorizeMorphTarget(name) {
    const nameLower = name.toLowerCase();
    
    // Facial expressions
    if (nameLower.includes('mouth') || 
        nameLower.includes('lip') ||
        nameLower.includes('jaw') ||
        nameLower.includes('smile') ||
        nameLower.includes('frown') ||
        nameLower.includes('eye') ||
        nameLower.includes('brow') ||
        nameLower.includes('cheek') ||
        nameLower.includes('nose') ||
        nameLower.includes('viseme') ||
        /^[aeiou]$/i.test(name)) {
      return 'facial';
    }
    
    // Body/pose
    if (nameLower.includes('pose') ||
        nameLower.includes('body') ||
        nameLower.includes('arm') ||
        nameLower.includes('hand')) {
      return 'pose';
    }
    
    return 'other';
  }
  
  /**
   * Safely apply morph target with validation
   */
  applyMorphTarget(name, intensity = 0.5) {
    const morphInfo = this.validMorphTargets.get(name);
    if (!morphInfo) {
      console.warn(`Morph target '${name}' not found or invalid`);
      return false;
    }
    
    try {
      // Clamp intensity to safe range
      const safeIntensity = Math.max(0, Math.min(intensity, this.maxIntensity));
      
      // Apply the morph
      morphInfo.mesh.morphTargetInfluences[morphInfo.index] = safeIntensity;
      
      return true;
    } catch (error) {
      console.error(`Failed to apply morph target '${name}':`, error);
      return false;
    }
  }
  
  /**
   * Reset all morph targets to neutral
   */
  resetAllMorphTargets(scene) {
    scene.traverse((child) => {
      if (child.isMesh && child.morphTargetInfluences) {
        for (let i = 0; i < child.morphTargetInfluences.length; i++) {
          child.morphTargetInfluences[i] = 0;
        }
      }
    });
    console.log('🔄 All morph targets reset to neutral');
  }
  
  /**
   * Test individual morph target safely
   */
  testMorphTarget(name, duration = 2000) {
    return new Promise((resolve) => {
      if (!this.applyMorphTarget(name, 0.4)) {
        resolve(false);
        return;
      }
      
      console.log(`🎭 Testing morph target: ${name}`);
      
      setTimeout(() => {
        this.applyMorphTarget(name, 0);
        resolve(true);
      }, duration);
    });
  }
  
  /**
   * Get all valid facial morph targets
   */
  getFacialMorphTargets() {
    return Array.from(this.validMorphTargets.values())
      .filter(morph => morph.category === 'facial')
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  
  /**
   * Create viseme sequence for speech testing
   */
  createVisemeSequence(visemes = ['A', 'E', 'I', 'O', 'U']) {
    const sequence = [];
    const facialMorphs = this.getFacialMorphTargets();
    
    visemes.forEach(viseme => {
      // Find morph targets that might correspond to this viseme
      const matches = facialMorphs.filter(morph => 
        morph.name.toLowerCase().includes(viseme.toLowerCase()) ||
        morph.name.toLowerCase().includes('mouth') ||
        morph.name.toLowerCase().includes('lip')
      );
      
      if (matches.length > 0) {
        sequence.push({
          viseme,
          morphs: matches.slice(0, 2) // Max 2 morphs per viseme
        });
      }
    });
    
    return sequence;
  }
}

export default VisemeValidator;