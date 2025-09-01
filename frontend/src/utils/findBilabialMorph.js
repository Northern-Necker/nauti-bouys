import * as BABYLON from '@babylonjs/core';

/**
 * Systematically test all morphs to find ones that create bilabial closure
 */
export class BilabialMorphFinder {
  constructor(scene) {
    this.scene = scene;
    this.headMesh = scene.getMeshByName('CC_Game_Body');
    this.tongueMesh = scene.getMeshByName('CC_Game_Tongue');
    this.allMorphs = [];
    this.extractAllMorphs();
  }

  extractAllMorphs() {
    this.allMorphs = [];
    
    // Extract head mesh morphs
    if (this.headMesh?.morphTargetManager) {
      const manager = this.headMesh.morphTargetManager;
      for (let i = 0; i < manager.numTargets; i++) {
        const target = manager.getTarget(i);
        if (target) {
          this.allMorphs.push({
            mesh: 'head',
            index: i,
            name: target.name,
            target: target
          });
        }
      }
    }

    // Extract tongue mesh morphs
    if (this.tongueMesh?.morphTargetManager) {
      const manager = this.tongueMesh.morphTargetManager;
      for (let i = 0; i < manager.numTargets; i++) {
        const target = manager.getTarget(i);
        if (target) {
          this.allMorphs.push({
            mesh: 'tongue',
            index: i,
            name: target.name,
            target: target
          });
        }
      }
    }

    console.log(`🔍 Found ${this.allMorphs.length} total morphs`);
    return this.allMorphs;
  }

  resetAllMorphs() {
    this.allMorphs.forEach(morph => {
      morph.target.influence = 0;
    });
  }

  /**
   * Test a specific morph by name or index
   */
  testMorph(nameOrIndex, intensity = 0.8) {
    this.resetAllMorphs();
    
    let morphToTest;
    if (typeof nameOrIndex === 'number') {
      morphToTest = this.allMorphs[nameOrIndex];
    } else {
      morphToTest = this.allMorphs.find(m => 
        m.name.toLowerCase().includes(nameOrIndex.toLowerCase())
      );
    }

    if (morphToTest) {
      morphToTest.target.influence = intensity;
      console.log(`🎯 Testing morph: ${morphToTest.name} at ${intensity}`);
      return morphToTest;
    } else {
      console.warn(`❌ Morph not found: ${nameOrIndex}`);
      return null;
    }
  }

  /**
   * Find morphs that likely create lip closure
   */
  findLipClosureMorphs() {
    const lipKeywords = [
      'M', 'PP', 'bilabial', 'close', 'press', 'pucker', 
      'narrow', 'lips', 'mouth', 'V_M', 'V_PP', 'Mouth_M'
    ];
    
    const candidates = this.allMorphs.filter(morph => {
      const nameLower = morph.name.toLowerCase();
      return lipKeywords.some(keyword => 
        nameLower.includes(keyword.toLowerCase())
      );
    });

    console.log('🔍 Lip closure morph candidates:', candidates.map(m => m.name));
    return candidates;
  }

  /**
   * Test all morphs one by one with a delay
   */
  async testAllMorphsSequentially(delay = 2000, intensity = 0.8) {
    console.log(`🧪 Testing all ${this.allMorphs.length} morphs sequentially...`);
    
    for (let i = 0; i < this.allMorphs.length; i++) {
      const morph = this.allMorphs[i];
      this.resetAllMorphs();
      morph.target.influence = intensity;
      
      console.log(`[${i}/${this.allMorphs.length}] Testing: ${morph.name} (${morph.mesh})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    console.log('✅ Sequential morph testing complete');
    this.resetAllMorphs();
  }

  /**
   * Test combinations of morphs for PP viseme
   */
  testPPCombination(morphNames, weights) {
    this.resetAllMorphs();
    
    morphNames.forEach((name, idx) => {
      const morph = this.allMorphs.find(m => 
        m.name.toLowerCase() === name.toLowerCase() ||
        m.name.toLowerCase().includes(name.toLowerCase())
      );
      
      if (morph) {
        const weight = weights[idx] || 0.8;
        morph.target.influence = weight;
        console.log(`✓ Applied ${morph.name}: ${weight}`);
      } else {
        console.warn(`✗ Morph not found: ${name}`);
      }
    });
  }

  /**
   * Get common PP viseme combinations to test
   */
  getPPTestCombinations() {
    return [
      // Test individual morphs that might create bilabial closure
      { name: 'M only', morphs: ['M'], weights: [1.0] },
      { name: 'V_M only', morphs: ['V_M'], weights: [1.0] },
      { name: 'V_PP only', morphs: ['V_PP'], weights: [1.0] },
      { name: 'Mouth_M only', morphs: ['Mouth_M'], weights: [1.0] },
      { name: 'Mouth_Close only', morphs: ['Mouth_Close'], weights: [1.0] },
      { name: 'V_Lips only', morphs: ['V_Lips'], weights: [1.0] },
      
      // Test combinations
      { name: 'M + narrow', morphs: ['M', 'Mouth_Narrow'], weights: [0.9, 0.3] },
      { name: 'Mouth_Close + narrow', morphs: ['Mouth_Close', 'Mouth_Narrow'], weights: [0.9, 0.3] },
      { name: 'V_Lips + M', morphs: ['V_Lips', 'M'], weights: [0.6, 0.6] },
      
      // Test with negative jaw
      { name: 'M + negative jaw', morphs: ['M', 'Jaw_Open'], weights: [0.9, -0.2] },
      { name: 'Mouth_Close + negative jaw', morphs: ['Mouth_Close', 'Jaw_Open'], weights: [0.9, -0.2] },
    ];
  }

  /**
   * Print all morph names for debugging
   */
  printAllMorphNames() {
    console.log('📋 All Available Morphs:');
    console.log('HEAD MORPHS:', this.allMorphs.filter(m => m.mesh === 'head').map(m => m.name));
    console.log('TONGUE MORPHS:', this.allMorphs.filter(m => m.mesh === 'tongue').map(m => m.name));
  }
}

/**
 * Interactive morph testing function
 */
export async function findCorrectPPMorph(scene) {
  const finder = new BilabialMorphFinder(scene);
  
  // First, print all available morphs
  finder.printAllMorphNames();
  
  // Find potential lip closure morphs
  const candidates = finder.findLipClosureMorphs();
  
  // Test each candidate
  console.log('🧪 Testing lip closure candidates...');
  for (const candidate of candidates) {
    finder.resetAllMorphs();
    candidate.target.influence = 0.9;
    console.log(`Testing: ${candidate.name}`);
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  finder.resetAllMorphs();
  return finder;
}
