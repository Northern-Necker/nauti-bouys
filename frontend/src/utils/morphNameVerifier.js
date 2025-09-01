import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Verify and extract actual morph target names from the GLB file
 */
export async function verifyMorphNames(glbUrl) {
  const loader = new GLTFLoader();
  
  try {
    const gltf = await loader.loadAsync(glbUrl);
    const morphData = {
      meshes: {},
      totalMorphs: 0,
      morphNameMapping: {}
    };
    
    // Traverse and find all meshes with morph targets
    gltf.scene.traverse((obj) => {
      if ((obj.isMesh || obj.isSkinnedMesh) && obj.morphTargetDictionary) {
        const morphNames = Object.keys(obj.morphTargetDictionary);
        morphData.meshes[obj.name] = {
          morphNames: morphNames,
          count: morphNames.length,
          influences: obj.morphTargetInfluences ? obj.morphTargetInfluences.length : 0
        };
        morphData.totalMorphs += morphNames.length;
        
        // Create a mapping for common morph patterns
        morphNames.forEach(name => {
          const normalized = name.toLowerCase();
          if (!morphData.morphNameMapping[normalized]) {
            morphData.morphNameMapping[normalized] = [];
          }
          morphData.morphNameMapping[normalized].push({
            mesh: obj.name,
            actualName: name
          });
        });
        
        console.log(`📦 Mesh: ${obj.name}`);
        console.log(`   Morph count: ${morphNames.length}`);
        console.log(`   First 10 morphs:`, morphNames.slice(0, 10));
      }
    });
    
    // Analyze common patterns
    console.log('\n🔍 Morph Analysis:');
    console.log('Total meshes with morphs:', Object.keys(morphData.meshes).length);
    console.log('Total morph targets:', morphData.totalMorphs);
    
    // Check for expected viseme morphs
    const expectedMorphs = [
      'V_Explosive', 'V_Dental_Lip', 'V_Tongue_Out', 'V_Tongue_up',
      'V_Wide', 'V_Open', 'V_Tight', 'V_Tight-O', 'V_Lip_Open',
      'V_Affricate', 'V_Tongue_Narrow', 'V_Tongue_Curl-U',
      'Tongue_Up', 'Tongue_Down', 'Tongue_Wide', 'Tongue_Roll',
      'Tongue_Tip_Up', 'Tongue_Tip_Down', 'Mouth_Press_L', 'Mouth_Press_R',
      'Mouth_Pucker', 'Jaw_Open'
    ];
    
    console.log('\n✅ Checking for expected morphs:');
    const foundMorphs = [];
    const missingMorphs = [];
    
    expectedMorphs.forEach(expectedName => {
      let found = false;
      Object.entries(morphData.meshes).forEach(([meshName, meshInfo]) => {
        if (meshInfo.morphNames.includes(expectedName)) {
          found = true;
          foundMorphs.push(`${expectedName} (in ${meshName})`);
        }
      });
      
      if (!found) {
        // Check for similar names (case-insensitive)
        const normalized = expectedName.toLowerCase();
        Object.entries(morphData.meshes).forEach(([meshName, meshInfo]) => {
          const similar = meshInfo.morphNames.find(name => 
            name.toLowerCase() === normalized || 
            name.toLowerCase().includes(normalized.replace('v_', '')) ||
            name.toLowerCase().includes(normalized.replace('_', ''))
          );
          if (similar) {
            found = true;
            foundMorphs.push(`${expectedName} → ${similar} (in ${meshName})`);
          }
        });
      }
      
      if (!found) {
        missingMorphs.push(expectedName);
      }
    });
    
    console.log('Found morphs:', foundMorphs);
    console.log('Missing morphs:', missingMorphs);
    
    return morphData;
    
  } catch (error) {
    console.error('Failed to verify morph names:', error);
    throw error;
  }
}

/**
 * Generate corrected viseme mappings based on actual morph names
 */
export function generateCorrectedMappings(morphData) {
  const corrections = {};
  
  // Map of intended morph names to actual morph names found
  const morphCorrections = {};
  
  Object.entries(morphData.meshes).forEach(([meshName, meshInfo]) => {
    meshInfo.morphNames.forEach(actualName => {
      const lower = actualName.toLowerCase();
      
      // Common corrections
      if (lower.includes('explosive')) morphCorrections['V_Explosive'] = actualName;
      if (lower.includes('dental') && lower.includes('lip')) morphCorrections['V_Dental_Lip'] = actualName;
      if (lower.includes('tongue') && lower.includes('out')) morphCorrections['V_Tongue_Out'] = actualName;
      if (lower.includes('tongue') && lower.includes('up')) morphCorrections['V_Tongue_up'] = actualName;
      if (lower.includes('wide')) morphCorrections['V_Wide'] = actualName;
      if (lower.includes('open') && !lower.includes('lip')) morphCorrections['V_Open'] = actualName;
      if (lower.includes('tight') && !lower.includes('o')) morphCorrections['V_Tight'] = actualName;
      if (lower.includes('tight') && lower.includes('o')) morphCorrections['V_Tight-O'] = actualName;
      if (lower.includes('lip') && lower.includes('open')) morphCorrections['V_Lip_Open'] = actualName;
      if (lower.includes('affricate')) morphCorrections['V_Affricate'] = actualName;
      if (lower.includes('tongue') && lower.includes('narrow')) morphCorrections['V_Tongue_Narrow'] = actualName;
      if (lower.includes('tongue') && lower.includes('curl')) morphCorrections['V_Tongue_Curl-U'] = actualName;
      if (lower === 'tongue_up' || lower === 'tongueup') morphCorrections['Tongue_Up'] = actualName;
      if (lower === 'tongue_down' || lower === 'tonguedown') morphCorrections['Tongue_Down'] = actualName;
      if (lower === 'tongue_wide' || lower === 'tonguewide') morphCorrections['Tongue_Wide'] = actualName;
      if (lower.includes('tongue') && lower.includes('roll')) morphCorrections['Tongue_Roll'] = actualName;
      if (lower.includes('tongue') && lower.includes('tip') && lower.includes('up')) morphCorrections['Tongue_Tip_Up'] = actualName;
      if (lower.includes('tongue') && lower.includes('tip') && lower.includes('down')) morphCorrections['Tongue_Tip_Down'] = actualName;
      if (lower.includes('mouth') && lower.includes('press') && lower.includes('l')) morphCorrections['Mouth_Press_L'] = actualName;
      if (lower.includes('mouth') && lower.includes('press') && lower.includes('r')) morphCorrections['Mouth_Press_R'] = actualName;
      if (lower.includes('mouth') && lower.includes('pucker')) morphCorrections['Mouth_Pucker'] = actualName;
      if (lower.includes('jaw') && lower.includes('open')) morphCorrections['Jaw_Open'] = actualName;
    });
  });
  
  console.log('\n🔧 Morph Corrections Found:', morphCorrections);
  
  return morphCorrections;
}
