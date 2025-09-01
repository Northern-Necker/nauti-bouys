import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Debug utility to verify morph targets and test viseme mouth opening
 */
export class VisemeDebugger {
  constructor() {
    this.loader = new GLTFLoader();
    this.model = null;
    this.meshTargets = [];
    this.morphInventory = {};
    this.visemeResults = {};
  }

  async initialize(glbUrl) {
    try {
      console.log('🔍 Initializing Viseme Debugger...');
      
      const gltf = await this.loader.loadAsync(glbUrl);
      this.model = gltf.scene;
      
      // Catalog all morph targets
      this.model.traverse((obj) => {
        if (obj.isSkinnedMesh && obj.morphTargetDictionary) {
          this.meshTargets.push(obj);
          console.log(`\n📦 Mesh: ${obj.name}`);
          console.log(`  Morphs: ${Object.keys(obj.morphTargetDictionary).length}`);
          
          // Store morph inventory per mesh
          this.morphInventory[obj.name] = Object.keys(obj.morphTargetDictionary);
          
          // Log all morphs for this mesh
          Object.keys(obj.morphTargetDictionary).forEach(morphName => {
            console.log(`    - ${morphName} (index: ${obj.morphTargetDictionary[morphName]})`);
          });
        }
      });

      return this;
    } catch (error) {
      console.error('❌ Failed to initialize debugger:', error);
      throw error;
    }
  }

  // Check if specific morphs exist
  checkMorphExistence(morphNames) {
    const results = {};
    
    morphNames.forEach(morphName => {
      results[morphName] = {
        exists: false,
        meshes: []
      };
      
      this.meshTargets.forEach(mesh => {
        if (mesh.morphTargetDictionary[morphName] !== undefined) {
          results[morphName].exists = true;
          results[morphName].meshes.push({
            name: mesh.name,
            index: mesh.morphTargetDictionary[morphName]
          });
        }
      });
    });
    
    return results;
  }

  // Test a single morph directly
  testMorph(morphName, intensity = 1.0) {
    const results = [];
    
    this.meshTargets.forEach(mesh => {
      if (mesh.morphTargetDictionary[morphName] !== undefined) {
        const index = mesh.morphTargetDictionary[morphName];
        // Reset all morphs first
        mesh.morphTargetInfluences.fill(0);
        // Apply the test morph
        mesh.morphTargetInfluences[index] = intensity;
        
        results.push({
          mesh: mesh.name,
          morph: morphName,
          index: index,
          applied: true,
          intensity: intensity
        });
      }
    });
    
    return results;
  }

  // Test all visemes and check which ones include mouth-opening morphs
  testAllVisemes(visemeCombinations) {
    const mouthOpeningMorphs = [
      'V_Open', 'Jaw_Open', 'V_Lip_Open', 'Jaw_Back', 
      'Mouth_Open', 'Mouth_Pucker', 'Jaw_Down'
    ];
    
    const results = {};
    
    Object.entries(visemeCombinations).forEach(([viseme, morphs]) => {
      if (morphs) {
        const visemeResult = {
          viseme: viseme,
          morphs: morphs,
          mouthOpeningMorphs: [],
          missingMorphs: [],
          existingMorphs: []
        };
        
        morphs.forEach(morph => {
          // Check if this morph opens the mouth
          if (mouthOpeningMorphs.includes(morph)) {
            visemeResult.mouthOpeningMorphs.push(morph);
          }
          
          // Check if the morph exists
          let morphExists = false;
          this.meshTargets.forEach(mesh => {
            if (mesh.morphTargetDictionary[morph] !== undefined) {
              morphExists = true;
            }
          });
          
          if (morphExists) {
            visemeResult.existingMorphs.push(morph);
          } else {
            visemeResult.missingMorphs.push(morph);
          }
        });
        
        // Determine if viseme should open mouth
        visemeResult.shouldOpenMouth = visemeResult.mouthOpeningMorphs.length > 0;
        visemeResult.canOpenMouth = visemeResult.mouthOpeningMorphs.some(m => 
          visemeResult.existingMorphs.includes(m)
        );
        
        results[viseme] = visemeResult;
      }
    });
    
    return results;
  }

  // Find similar morph names (for typos or variations)
  findSimilarMorphs(targetMorph) {
    const similar = [];
    const targetLower = targetMorph.toLowerCase();
    
    Object.entries(this.morphInventory).forEach(([meshName, morphs]) => {
      morphs.forEach(morph => {
        const morphLower = morph.toLowerCase();
        
        // Check for partial matches
        if (morphLower.includes(targetLower) || targetLower.includes(morphLower)) {
          similar.push({
            mesh: meshName,
            morph: morph,
            matchType: 'partial'
          });
        }
        
        // Check for similar patterns (e.g., V_Open vs V_Ah)
        if (this.calculateSimilarity(targetLower, morphLower) > 0.7) {
          similar.push({
            mesh: meshName,
            morph: morph,
            matchType: 'similar'
          });
        }
      });
    });
    
    return similar;
  }

  // Calculate string similarity (simple Levenshtein-like)
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Generate comprehensive report
  generateReport(visemeCombinations) {
    console.log('\n' + '='.repeat(80));
    console.log('🔬 VISEME DEBUGGER REPORT');
    console.log('='.repeat(80));
    
    // Check critical mouth-opening morphs
    const criticalMorphs = ['V_Open', 'Jaw_Open', 'V_Lip_Open', 'Mouth_Open'];
    console.log('\n📋 Critical Mouth-Opening Morph Check:');
    const morphCheck = this.checkMorphExistence(criticalMorphs);
    
    Object.entries(morphCheck).forEach(([morph, result]) => {
      if (result.exists) {
        console.log(`  ✅ ${morph}: Found in ${result.meshes.map(m => m.name).join(', ')}`);
      } else {
        console.log(`  ❌ ${morph}: NOT FOUND`);
        // Try to find similar morphs
        const similar = this.findSimilarMorphs(morph);
        if (similar.length > 0) {
          console.log(`     Suggestions:`);
          similar.forEach(s => {
            console.log(`       - ${s.morph} (in ${s.mesh})`);
          });
        }
      }
    });
    
    // Test all visemes
    console.log('\n📊 Viseme Analysis:');
    const visemeResults = this.testAllVisemes(visemeCombinations);
    
    // Group visemes by mouth-opening status
    const problemVisemes = [];
    const workingVisemes = [];
    const noMouthVisemes = [];
    
    Object.entries(visemeResults).forEach(([viseme, result]) => {
      if (result.shouldOpenMouth && !result.canOpenMouth) {
        problemVisemes.push(viseme);
      } else if (result.shouldOpenMouth && result.canOpenMouth) {
        workingVisemes.push(viseme);
      } else {
        noMouthVisemes.push(viseme);
      }
    });
    
    console.log('\n⚠️ PROBLEMATIC VISEMES (should open mouth but can\'t):');
    problemVisemes.forEach(viseme => {
      const result = visemeResults[viseme];
      console.log(`  ${viseme}:`);
      console.log(`    Mouth morphs: ${result.mouthOpeningMorphs.join(', ')}`);
      console.log(`    Missing: ${result.missingMorphs.filter(m => result.mouthOpeningMorphs.includes(m)).join(', ')}`);
    });
    
    console.log('\n✅ WORKING VISEMES (mouth opening should work):');
    workingVisemes.forEach(viseme => {
      const result = visemeResults[viseme];
      console.log(`  ${viseme}: Uses ${result.mouthOpeningMorphs.filter(m => result.existingMorphs.includes(m)).join(', ')}`);
    });
    
    console.log('\n📌 Summary:');
    console.log(`  - Problem visemes: ${problemVisemes.length} (${problemVisemes.join(', ')})`);
    console.log(`  - Working visemes: ${workingVisemes.length}`);
    console.log(`  - Non-mouth visemes: ${noMouthVisemes.length}`);
    
    return {
      morphCheck,
      visemeResults,
      problemVisemes,
      workingVisemes,
      noMouthVisemes
    };
  }
}

export async function debugVisemes(glbUrl, visemeCombinations) {
  const visemeDebugger = new VisemeDebugger();
  await visemeDebugger.initialize(glbUrl);
  return visemeDebugger.generateReport(visemeCombinations);
}
