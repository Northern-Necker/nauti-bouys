import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

/**
 * Simple direct morph test - bypassing our lip-sync system
 * to test if morphs work at the basic Three.js level
 */
export async function testDirectMorphApplication(glbUrl) {
  const loader = new GLTFLoader();
  
  try {
    console.log('🧪 Loading GLB for direct morph testing...');
    const gltf = await loader.loadAsync(glbUrl);
    const model = gltf.scene;
    
    // Find meshes with morph targets
    const meshes = [];
    model.traverse((obj) => {
      if ((obj.isMesh || obj.isSkinnedMesh) && obj.morphTargetDictionary && obj.morphTargetInfluences) {
        meshes.push(obj);
        console.log(`🎯 Found mesh: ${obj.name}`);
        console.log(`   Morph targets:`, Object.keys(obj.morphTargetDictionary));
        console.log(`   Current influences:`, obj.morphTargetInfluences);
        
        // Test: Set first morph target to maximum
        if (obj.morphTargetInfluences.length > 0) {
          console.log(`🔧 Setting first morph to 1.0 on ${obj.name}`);
          obj.morphTargetInfluences[0] = 1.0;
          
          // Force updates
          obj.updateMorphTargets();
          if (obj.geometry) {
            obj.geometry.computeBoundingBox();
            obj.geometry.computeBoundingSphere();
          }
          
          // Log the change
          console.log(`✅ Applied morph influence[0] = 1.0 to ${obj.name}`);
        }
      }
    });
    
    console.log(`📊 Found ${meshes.length} meshes with morph targets`);
    
    return {
      model,
      meshes,
      testApplied: meshes.length > 0
    };
    
  } catch (error) {
    console.error('❌ Direct morph test failed:', error);
    throw error;
  }
}

/**
 * Test specific morph by name
 */
export function applySpecificMorph(model, morphName, value = 1.0) {
  let applied = false;
  
  model.traverse((obj) => {
    if ((obj.isMesh || obj.isSkinnedMesh) && obj.morphTargetDictionary && obj.morphTargetInfluences) {
      const morphIndex = obj.morphTargetDictionary[morphName];
      if (morphIndex !== undefined) {
        console.log(`🎯 Applying ${morphName} = ${value} to ${obj.name} (index ${morphIndex})`);
        obj.morphTargetInfluences[morphIndex] = value;
        obj.updateMorphTargets();
        applied = true;
      }
    }
  });
  
  if (!applied) {
    console.warn(`⚠️ Morph "${morphName}" not found in any mesh`);
  }
  
  return applied;
}
