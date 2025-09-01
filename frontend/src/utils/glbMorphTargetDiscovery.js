/**
 * GLB Morph Target Discovery Tool
 * Helps identify and test numeric morph targets in the GLB file
 */

export function discoverMorphTargets(model) {
  const discovery = {
    meshes: [],
    totalTargets: 0,
    bodyTargets: null,
    tongueTargets: null
  };

  model.traverse((child) => {
    if (child.isSkinnedMesh && child.morphTargetDictionary) {
      const meshInfo = {
        name: child.name,
        targets: Object.keys(child.morphTargetDictionary),
        count: Object.keys(child.morphTargetDictionary).length
      };
      
      discovery.meshes.push(meshInfo);
      discovery.totalTargets += meshInfo.count;
      
      // Store specific mesh targets
      if (child.name === 'CC_Game_Body') {
        discovery.bodyTargets = meshInfo.targets;
      } else if (child.name === 'CC_Game_Tongue') {
        discovery.tongueTargets = meshInfo.targets;
      }
      
      console.log(`📦 Mesh: ${child.name}`);
      console.log(`   Morph targets (${meshInfo.count}):`, meshInfo.targets.slice(0, 10), '...');
    }
  });
  
  return discovery;
}

export function testNumericMorphTarget(model, meshName, targetIndex, value = 1.0) {
  let found = false;
  
  model.traverse((child) => {
    if (child.isSkinnedMesh && child.name === meshName) {
      if (child.morphTargetInfluences && targetIndex < child.morphTargetInfluences.length) {
        // Reset all first
        child.morphTargetInfluences.fill(0);
        
        // Set the specific target
        child.morphTargetInfluences[targetIndex] = value;
        
        // Force update
        if (child.geometry) {
          child.geometry.attributes.position.needsUpdate = true;
          if (child.geometry.attributes.normal) {
            child.geometry.attributes.normal.needsUpdate = true;
          }
        }
        
        console.log(`✅ Set ${meshName}[${targetIndex}] to ${value}`);
        found = true;
      } else {
        console.error(`❌ Invalid index ${targetIndex} for ${meshName}`);
      }
    }
  });
  
  return found;
}

export function cycleBodyMorphTargets(model, startIndex = 0, endIndex = 10, duration = 500) {
  console.log(`🔄 Cycling through body morph targets ${startIndex} to ${endIndex}...`);
  
  let currentIndex = startIndex;
  
  const interval = setInterval(() => {
    if (currentIndex > endIndex) {
      clearInterval(interval);
      console.log('✅ Cycle complete');
      // Reset all
      model.traverse((child) => {
        if (child.isSkinnedMesh && child.name === 'CC_Game_Body' && child.morphTargetInfluences) {
          child.morphTargetInfluences.fill(0);
        }
      });
      return;
    }
    
    console.log(`Testing index ${currentIndex}...`);
    testNumericMorphTarget(model, 'CC_Game_Body', currentIndex, 1.0);
    currentIndex++;
  }, duration);
  
  return interval;
}

export function cycleTongueMorphTargets(model, startIndex = 0, endIndex = 10, duration = 500) {
  console.log(`🔄 Cycling through tongue morph targets ${startIndex} to ${endIndex}...`);
  
  let currentIndex = startIndex;
  
  const interval = setInterval(() => {
    if (currentIndex > endIndex) {
      clearInterval(interval);
      console.log('✅ Cycle complete');
      // Reset all
      model.traverse((child) => {
        if (child.isSkinnedMesh && child.name === 'CC_Game_Tongue' && child.morphTargetInfluences) {
          child.morphTargetInfluences.fill(0);
        }
      });
      return;
    }
    
    console.log(`Testing index ${currentIndex}...`);
    testNumericMorphTarget(model, 'CC_Game_Tongue', currentIndex, 1.0);
    currentIndex++;
  }, duration);
  
  return interval;
}

// Function to find which indices correspond to mouth movements
export function findMouthMorphTargets(model) {
  console.log('🔍 Looking for mouth-related morph targets...');
  console.log('Watch the avatar and note which indices affect the mouth:');
  
  // Test likely ranges for facial expressions
  // CC4 typically puts facial morphs in specific ranges
  const testRanges = [
    { start: 0, end: 20, name: 'First 20' },
    { start: 20, end: 40, name: 'Mid range' },
    { start: 40, end: 60, name: 'Upper range' },
    { start: 60, end: 73, name: 'Last targets' }
  ];
  
  let rangeIndex = 0;
  
  function testNextRange() {
    if (rangeIndex >= testRanges.length) {
      console.log('✅ Testing complete');
      return;
    }
    
    const range = testRanges[rangeIndex];
    console.log(`\n📊 Testing ${range.name} (indices ${range.start}-${range.end}):`);
    
    cycleBodyMorphTargets(model, range.start, range.end, 1000);
    
    rangeIndex++;
    setTimeout(testNextRange, (range.end - range.start + 2) * 1000);
  }
  
  testNextRange();
}

// Create a mapping from discovered indices to viseme names
export function createIndexToVisemeMapping(model) {
  // This will be populated after manual discovery
  // For now, we'll try common CC4 index patterns
  const mapping = {
    // These are common CC4 morph target indices - may need adjustment
    'jaw_open': 0,  // Usually first
    'mouth_smile_l': 1,
    'mouth_smile_r': 2,
    'mouth_frown_l': 3,
    'mouth_frown_r': 4,
    'mouth_pucker': 5,
    'mouth_funnel': 6,
    'mouth_press_l': 7,
    'mouth_press_r': 8,
    // Add more as discovered
  };
  
  return mapping;
}

// Export functions for global access
export function setupGlobalDiscoveryFunctions(model) {
  window.discoverMorphs = () => discoverMorphTargets(model);
  window.testMorph = (meshName, index, value = 1.0) => testNumericMorphTarget(model, meshName, index, value);
  window.cycleBody = (start = 0, end = 10) => cycleBodyMorphTargets(model, start, end);
  window.cycleTongue = (start = 0, end = 10) => cycleTongueMorphTargets(model, start, end);
  window.findMouth = () => findMouthMorphTargets(model);
  
  console.log('🎮 Morph target discovery functions available:');
  console.log('  window.discoverMorphs() - List all morph targets');
  console.log('  window.testMorph("CC_Game_Body", 0, 1.0) - Test specific morph');
  console.log('  window.cycleBody(0, 10) - Cycle through body morphs');
  console.log('  window.cycleTongue(0, 10) - Cycle through tongue morphs');
  console.log('  window.findMouth() - Auto-test ranges to find mouth morphs');
}

export default {
  discoverMorphTargets,
  testNumericMorphTarget,
  cycleBodyMorphTargets,
  cycleTongueMorphTargets,
  findMouthMorphTargets,
  createIndexToVisemeMapping,
  setupGlobalDiscoveryFunctions
};
