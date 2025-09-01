/**
 * Babylon.js GLB Morph Debugger
 * Tool to find the correct morph combinations for visemes
 */

import * as BABYLON from '@babylonjs/core';

export class BabylonGLBMorphDebugger {
  constructor(lipSyncSystem) {
    this.lipSync = lipSyncSystem;
    this.testResults = [];
  }

  /**
   * List all available morphs that might be used for pressed lips
   */
  findPressedLipMorphs() {
    console.log('🔍 Searching for pressed lip morphs (NOT puckered/kiss morphs)...');
    
    const potentialMorphs = [];
    const excludePatterns = ['pucker', 'kiss', 'funnel', 'round'];
    const includePatterns = ['close', 'press', 'tight', 'lip', 'mouth', 'shut', 'seal', 'together'];
    
    this.lipSync.morphTargetsByName.forEach((morphData, morphName) => {
      const lowerName = morphName.toLowerCase();
      
      // Skip morphs that create kiss/pucker shapes
      const shouldExclude = excludePatterns.some(pattern => lowerName.includes(pattern));
      if (shouldExclude) {
        console.log(`  ❌ Excluding kiss/pucker morph: ${morphName}`);
        return;
      }
      
      // Look for morphs that might create pressed lips
      const shouldInclude = includePatterns.some(pattern => lowerName.includes(pattern));
      if (shouldInclude) {
        potentialMorphs.push(morphName);
        console.log(`  ✅ Potential pressed lip morph: ${morphName}`);
      }
    });
    
    return potentialMorphs;
  }

  /**
   * Test individual morphs to see their visual effect
   */
  async testMorphVisually(morphName, weight = 1.0, duration = 2000) {
    console.log(`👁️ Testing morph visually: ${morphName} at weight ${weight}`);
    
    // Reset all morphs first
    this.lipSync.reset();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Apply single morph
    const result = this.lipSync.applySingleMorph(morphName, weight, true);
    
    if (result.success) {
      console.log(`  ✅ Applied ${morphName} = ${weight}`);
      console.log(`  👀 OBSERVE: Does this create pressed lips (not puckered)?`);
    } else {
      console.log(`  ❌ Failed to apply ${morphName}`);
    }
    
    // Hold for observation
    await new Promise(resolve => setTimeout(resolve, duration));
    
    return result;
  }

  /**
   * Test combinations of morphs for pressed lips
   */
  async testPressedLipCombinations() {
    console.log('🧪 Testing morph combinations for pressed lips (PP viseme)...');
    
    const combinations = [
      // Test 1: Try Mouth_Close if it exists
      { morphs: ['Mouth_Close'], weights: [1.0], description: 'Mouth fully closed' },
      
      // Test 2: Try V_Tight alone (without negative lip open)
      { morphs: ['V_Tight'], weights: [1.0], description: 'V_Tight only' },
      
      // Test 3: Try combining different close morphs
      { morphs: ['V_Tight', 'Mouth_Close'], weights: [1.0, 0.5], description: 'V_Tight + partial Mouth_Close' },
      
      // Test 4: Try lips together variations
      { morphs: ['Lips_Together'], weights: [1.0], description: 'Lips together' },
      
      // Test 5: Try mouth shut variations  
      { morphs: ['Mouth_Shut'], weights: [1.0], description: 'Mouth shut' },
      
      // Test 6: V_Dental_Lip might work for pressed lips
      { morphs: ['V_Dental_Lip'], weights: [1.0], description: 'V_Dental_Lip (might press lips)' },
      
      // Test 7: Negative mouth open to close mouth
      { morphs: ['Mouth_Open'], weights: [-1.0], description: 'Negative Mouth_Open' },
      
      // Test 8: Jaw close with tight lips
      { morphs: ['Jaw_Close', 'V_Tight'], weights: [1.0, 1.0], description: 'Jaw close + V_Tight' },
      
      // Test 9: Mouth frown might help press lips
      { morphs: ['Mouth_Frown_L', 'Mouth_Frown_R', 'V_Tight'], weights: [0.5, 0.5, 1.0], description: 'Frown + Tight' },
      
      // Test 10: Look for any "B" or "P" specific morphs
      { morphs: ['V_B'], weights: [1.0], description: 'V_B phoneme' },
      { morphs: ['V_P'], weights: [1.0], description: 'V_P phoneme' },
      { morphs: ['V_M'], weights: [1.0], description: 'V_M phoneme (bilabial)' }
    ];
    
    for (const combo of combinations) {
      console.log(`\n📝 Testing: ${combo.description}`);
      console.log(`   Morphs: ${combo.morphs.join(', ')}`);
      console.log(`   Weights: ${combo.weights.join(', ')}`);
      
      // Reset first
      this.lipSync.reset();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Apply combination
      let success = true;
      combo.morphs.forEach((morphName, idx) => {
        const morphData = this.lipSync.morphTargetsByName.get(morphName);
        if (morphData) {
          this.lipSync.targetMorphs[morphName] = combo.weights[idx];
        } else {
          console.log(`  ⚠️ Morph not found: ${morphName}`);
          success = false;
        }
      });
      
      if (success) {
        // Apply immediately
        Object.keys(this.lipSync.currentMorphs).forEach(key => {
          this.lipSync.currentMorphs[key] = this.lipSync.targetMorphs[key] || 0;
        });
        this.lipSync.updateBabylonMorphTargets();
        
        console.log(`  ✅ Applied combination`);
        console.log(`  👀 OBSERVE: Does this create pressed lips for P/B sounds?`);
        
        // Store result
        this.testResults.push({
          description: combo.description,
          morphs: combo.morphs,
          weights: combo.weights,
          timestamp: Date.now()
        });
      }
      
      // Hold for observation
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Reset after all tests
    this.lipSync.reset();
    console.log('\n✅ Combination testing complete');
    
    return this.testResults;
  }

  /**
   * List all morphs with "V_" prefix (viseme morphs)
   */
  listVisemeMorphs() {
    console.log('📋 Listing all V_ (viseme) morphs in the model:');
    
    const visemeMorphs = [];
    this.lipSync.morphTargetsByName.forEach((morphData, morphName) => {
      if (morphName.startsWith('V_') || morphName.toLowerCase().includes('viseme')) {
        visemeMorphs.push(morphName);
        console.log(`  • ${morphName}`);
      }
    });
    
    console.log(`\nFound ${visemeMorphs.length} viseme morphs`);
    return visemeMorphs;
  }

  /**
   * Interactive morph finder - apply morphs one by one
   */
  async findCorrectPPMorph() {
    console.log('🔎 INTERACTIVE PP MORPH FINDER');
    console.log('================================');
    console.log('Looking for morphs that create PRESSED LIPS (not puckered/kiss)');
    console.log('For P/B sounds, lips should be pressed flat together\n');
    
    // First list all V_ morphs
    const visemeMorphs = this.listVisemeMorphs();
    
    // Test each one
    console.log('\n🧪 Testing each viseme morph individually...\n');
    
    for (const morphName of visemeMorphs) {
      console.log(`Testing: ${morphName}`);
      await this.testMorphVisually(morphName, 1.0, 1500);
    }
    
    // Now test combinations
    console.log('\n🧪 Testing combinations...\n');
    await this.testPressedLipCombinations();
    
    console.log('\n✅ PP Morph finding complete!');
    console.log('Review the visual results to identify which morphs create pressed lips.');
    
    return {
      visemeMorphs,
      testResults: this.testResults
    };
  }
}

// Export helper function to run debugger
export function debugPPViseme(lipSyncSystem) {
  const morphDebugger = new BabylonGLBMorphDebugger(lipSyncSystem);
  return morphDebugger.findCorrectPPMorph();
}
