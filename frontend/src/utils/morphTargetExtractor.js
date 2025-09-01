import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export async function extractMorphTargets(glbUrl) {
  const loader = new GLTFLoader();
  
  try {
    const gltf = await loader.loadAsync(glbUrl);
    const morphTargets = {
      CC_Game_Tongue: [],
      CC_Game_Body: [],
      Other: []
    };
    
    gltf.scene.traverse((obj) => {
      if (obj.isSkinnedMesh && obj.morphTargetDictionary) {
        const morphNames = Object.keys(obj.morphTargetDictionary);
        
        if (obj.name.includes('CC_Game_Tongue')) {
          morphTargets.CC_Game_Tongue = morphNames;
        } else if (obj.name.includes('CC_Game_Body')) {
          morphTargets.CC_Game_Body = morphNames;
        } else {
          morphTargets.Other = [...morphTargets.Other, ...morphNames];
        }
        
        console.log(`Mesh: ${obj.name}`);
        console.log(`Morph targets (${morphNames.length}):`, morphNames);
      }
    });
    
    return morphTargets;
  } catch (error) {
    console.error('Failed to extract morph targets:', error);
    throw error;
  }
}

// Helper function to find similar morph names (for mapping fixes)
export function findSimilarMorphs(availableMorphs, searchTerm) {
  const searchLower = searchTerm.toLowerCase();
  return availableMorphs.filter(morph => {
    const morphLower = morph.toLowerCase();
    return morphLower.includes(searchLower) || 
           searchLower.includes(morphLower) ||
           // Check for common variations
           (searchLower.includes('tongue') && morphLower.includes('tongue')) ||
           (searchLower.includes('stretch') && (morphLower.includes('stretch') || morphLower.includes('wide'))) ||
           (searchLower.includes('up') && morphLower.includes('up'));
  });
}
