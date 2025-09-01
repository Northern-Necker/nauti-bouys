import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

async function getAllMorphs() {
  try {
    console.log('🔍 Loading GLB file to get ALL available morphs...');
    
    const gltf = await loader.loadAsync('/assets/party-f-0013-fixed.glb');
    const scene = gltf.scene;
    
    const bodyMorphs = [];
    const tongueMorphs = [];
    
    scene.traverse((obj) => {
      if (obj.isSkinnedMesh && obj.morphTargetDictionary) {
        const morphNames = Object.keys(obj.morphTargetDictionary);
        
        if (obj.name.includes('CC_Game_Body')) {
          console.log(`\n📦 CC_Game_Body - ALL ${morphNames.length} morphs:`);
          morphNames.sort().forEach(name => {
            console.log(`  - ${name}`);
            bodyMorphs.push(name);
          });
        } else if (obj.name.includes('CC_Game_Tongue')) {
          console.log(`\n📦 CC_Game_Tongue - ALL ${morphNames.length} morphs:`);
          morphNames.sort().forEach(name => {
            console.log(`  - ${name}`);
            tongueMorphs.push(name);
          });
        }
      }
    });
    
    console.log('\n============================================================');
    console.log('📊 COMPLETE MORPH INVENTORY:');
    console.log('============================================================');
    console.log(`✅ Body morphs: ${bodyMorphs.length}`);
    console.log(`✅ Tongue morphs: ${tongueMorphs.length}`);
    
    // Check for specific morphs we're trying to use
    console.log('\n🔍 Checking specific morphs used in viseme combinations:');
    const morphsToCheck = ['V_Pucker', 'V_Tight-O', 'V_Oh', 'V_Stretched', 'V_Ah'];
    
    morphsToCheck.forEach(morph => {
      const inBody = bodyMorphs.includes(morph);
      const inTongue = tongueMorphs.includes(morph);
      console.log(`  ${morph}: ${inBody ? '✅ Body' : '❌ Body'} | ${inTongue ? '✅ Tongue' : '❌ Tongue'}`);
    });
    
  } catch (error) {
    console.error('❌ Error loading morphs:', error);
  }
}

// Run the analysis
getAllMorphs();
