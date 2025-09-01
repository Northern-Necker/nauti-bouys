import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Verify the structure of the ActorCore GLB model
 * Confirms that tongue morphs are on the CC_Game_Tongue mesh
 */
export async function verifyActorCoreGLBStructure(glbUrl) {
  const loader = new GLTFLoader();
  
  try {
    console.log('🔍 Loading GLB file to verify structure...');
    const gltf = await loader.loadAsync(glbUrl);
    
    const meshInfo = {
      tongueMesh: null,
      bodyMesh: null,
      otherMeshes: [],
      summary: {
        hasSeparateTongueMesh: false,
        tongueMorphCount: 0,
        bodyMorphCount: 0,
        tongueMorphs: [],
        bodyMorphs: []
      }
    };
    
    // Traverse the model to find meshes and their morph targets
    gltf.scene.traverse((obj) => {
      if (obj.isSkinnedMesh && obj.morphTargetDictionary) {
        const morphNames = Object.keys(obj.morphTargetDictionary);
        
        console.log(`\n📦 Found mesh: ${obj.name}`);
        console.log(`   Total morphs: ${morphNames.length}`);
        
        if (obj.name === 'CC_Game_Tongue') {
          meshInfo.tongueMesh = obj.name;
          meshInfo.summary.hasSeparateTongueMesh = true;
          meshInfo.summary.tongueMorphCount = morphNames.length;
          meshInfo.summary.tongueMorphs = morphNames;
          
          console.log('   ✅ This is the TONGUE mesh!');
          console.log('   Tongue morphs found:');
          morphNames.forEach(morph => {
            if (morph.toLowerCase().includes('tongue')) {
              console.log(`     - ${morph}`);
            }
          });
          
        } else if (obj.name === 'CC_Game_Body') {
          meshInfo.bodyMesh = obj.name;
          meshInfo.summary.bodyMorphCount = morphNames.length;
          meshInfo.summary.bodyMorphs = morphNames;
          
          console.log('   ✅ This is the BODY mesh!');
          console.log('   Sample body/face morphs:');
          const sampleMorphs = morphNames.slice(0, 10);
          sampleMorphs.forEach(morph => {
            console.log(`     - ${morph}`);
          });
          if (morphNames.length > 10) {
            console.log(`     ... and ${morphNames.length - 10} more`);
          }
          
        } else {
          meshInfo.otherMeshes.push(obj.name);
          console.log(`   Other mesh with ${morphNames.length} morphs`);
        }
      }
    });
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 VERIFICATION SUMMARY:');
    console.log('='.repeat(60));
    
    if (meshInfo.summary.hasSeparateTongueMesh) {
      console.log('✅ CONFIRMED: Tongue morphs are on a SEPARATE mesh!');
      console.log(`   - Tongue mesh: ${meshInfo.tongueMesh}`);
      console.log(`   - Tongue morphs: ${meshInfo.summary.tongueMorphCount}`);
      console.log(`   - Body mesh: ${meshInfo.bodyMesh}`);
      console.log(`   - Body morphs: ${meshInfo.summary.bodyMorphCount}`);
      
      // List all tongue-related morphs
      console.log('\n🦷 All tongue-related morphs on CC_Game_Tongue:');
      meshInfo.summary.tongueMorphs.forEach(morph => {
        if (morph.toLowerCase().includes('tongue') || 
            morph === 'V_Tongue_Out' || 
            morph === 'V_Tongue_Raise' ||
            morph === 'V_Tongue_Lower' ||
            morph === 'V_Tongue_Curl-U' ||
            morph === 'V_Tongue_Curl-D') {
          console.log(`   - ${morph}`);
        }
      });
      
    } else {
      console.log('❌ WARNING: Separate tongue mesh NOT found!');
      console.log('   This may indicate an issue with the GLB file.');
    }
    
    console.log('='.repeat(60));
    
    return meshInfo;
    
  } catch (error) {
    console.error('❌ Error verifying GLB structure:', error);
    throw error;
  }
}

// Auto-run if this script is executed directly
if (typeof window !== 'undefined' && window.location) {
  // Browser environment
  window.verifyActorCoreGLBStructure = verifyActorCoreGLBStructure;
  
  // Auto-verify if on a test page
  if (window.location.pathname.includes('test') || window.location.pathname.includes('Test')) {
    console.log('🚀 Auto-running verification...');
    verifyActorCoreGLBStructure('/assets/party-f-0013-fixed.glb')
      .then(result => {
        console.log('✅ Verification complete!', result);
      })
      .catch(error => {
        console.error('❌ Verification failed:', error);
      });
  }
}
