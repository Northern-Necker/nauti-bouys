import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export async function analyzeVisemeMappings(glbUrl) {
  const loader = new GLTFLoader();
  
  try {
    const gltf = await loader.loadAsync(glbUrl);
    const availableMorphs = {
      CC_Game_Tongue: [],
      CC_Game_Body: [],
      Other: []
    };
    
    // Extract all available morphs
    gltf.scene.traverse((obj) => {
      if (obj.isSkinnedMesh && obj.morphTargetDictionary) {
        const morphNames = Object.keys(obj.morphTargetDictionary);
        
        if (obj.name.includes('CC_Game_Tongue')) {
          availableMorphs.CC_Game_Tongue = morphNames;
        } else if (obj.name.includes('CC_Game_Body')) {
          availableMorphs.CC_Game_Body = morphNames;
        } else {
          availableMorphs.Other = [...availableMorphs.Other, ...morphNames];
        }
      }
    });
    
    // Current viseme mappings from glbActorCoreLipSync.js
    const currentMappings = {
      'PP': ['V_Explosive'],
      'FF': ['V_Dental_Lip', 'V_Open'],
      'TH': ['V_Tongue_Out', 'V_Dental_Lip', 'V_Open'],
      'DD': ['Tongue_Up', 'V_Dental_Lip', 'V_Open'],
      'RR': ['V_Tongue_Curl-U', 'V_Tight-O', 'V_Open'],
      'kk': ['V_Tongue_up', 'V_Open'],
      'nn': ['Tongue_Tip_Up', 'V_Open'],
      'CH': ['V_Affricate', 'V_Open'],
      'SS': ['V_Wide', 'V_Open'],
      'aa': ['V_Ah', 'V_Open'],
      'E': ['V_Stretched', 'V_Open'],
      'I': ['V_Stretched', 'V_Open'],
      'O': ['V_Oh', 'V_Open'],
      'U': ['V_Tight-O', 'V_Open'],
    };
    
    // Analyze morph usage
    const usedMorphs = new Set();
    const missingMorphs = [];
    const unusedMorphs = [];
    
    // Check which morphs are used
    Object.entries(currentMappings).forEach(([viseme, morphs]) => {
      morphs.forEach(morph => {
        usedMorphs.add(morph);
        
        // Check if morph exists
        const allMorphs = [...availableMorphs.CC_Game_Body, ...availableMorphs.CC_Game_Tongue];
        if (!allMorphs.includes(morph)) {
          missingMorphs.push({ viseme, morph });
        }
      });
    });
    
    // Find unused morphs that could enhance realism
    const allAvailableMorphs = [...availableMorphs.CC_Game_Body, ...availableMorphs.CC_Game_Tongue];
    allAvailableMorphs.forEach(morph => {
      if (!usedMorphs.has(morph)) {
        unusedMorphs.push(morph);
      }
    });
    
    // Suggest enhancements based on unused morphs
    const enhancements = [];
    
    // Lip-related unused morphs
    const lipMorphs = unusedMorphs.filter(m => 
      m.includes('Lip') || m.includes('V_Lip') || 
      m.includes('Mouth') || m.includes('Smile')
    );
    
    // Tongue-related unused morphs
    const tongueMorphs = unusedMorphs.filter(m => 
      m.includes('Tongue') || m.includes('V_Tongue')
    );
    
    // Jaw-related unused morphs
    const jawMorphs = unusedMorphs.filter(m => 
      m.includes('Jaw') || m.includes('Open_Jaw')
    );
    
    // Other facial morphs that could add realism
    const facialMorphs = unusedMorphs.filter(m => 
      m.includes('Cheek') || m.includes('Nose') || 
      m.includes('Brow') || m.includes('Squint')
    );
    
    return {
      availableMorphs,
      currentMappings,
      usedMorphs: Array.from(usedMorphs),
      missingMorphs,
      unusedMorphs,
      suggestions: {
        lipMorphs,
        tongueMorphs,
        jawMorphs,
        facialMorphs
      }
    };
    
  } catch (error) {
    console.error('Failed to analyze viseme mappings:', error);
    throw error;
  }
}

// Enhanced viseme mapping suggestions based on phonetic requirements
export function getEnhancedVisemeMappings() {
  return {
    // Bilabial consonants (lips pressed together)
    'PP': {
      current: ['V_Explosive'],
      suggested: ['V_Explosive', 'V_Lip_Open'],  // Add lip separation after explosion
      description: 'Bilabial plosive - lips pressed then released'
    },
    
    // Labiodental (lip-teeth contact)
    'FF': {
      current: ['V_Dental_Lip', 'V_Open'],
      suggested: ['V_Dental_Lip', 'V_Open', 'V_Lip_Suck_Upper'],  // Add upper lip tension
      description: 'Labiodental fricative - lower lip against upper teeth'
    },
    
    // Interdental (tongue between teeth)
    'TH': {
      current: ['V_Tongue_Out', 'V_Dental_Lip', 'V_Open'],
      suggested: ['V_Tongue_Out', 'V_Dental_Lip', 'V_Open', 'V_Tight'],  // Add tension
      description: 'Interdental fricative - tongue between teeth'
    },
    
    // Alveolar stop
    'DD': {
      current: ['Tongue_Up', 'V_Dental_Lip', 'V_Open'],
      suggested: ['Tongue_Up', 'V_Dental_Lip', 'V_Open', 'V_Lip_Open'],  // More natural lip opening
      description: 'Alveolar stop - tongue tip to alveolar ridge'
    },
    
    // Alveolar liquid
    'RR': {
      current: ['V_Tongue_Curl-U', 'V_Tight-O', 'V_Open'],
      suggested: ['V_Tongue_Curl-U', 'V_Tight-O', 'V_Open', 'Tongue_Roll'],  // Add tongue roll
      description: 'Alveolar liquid - tongue curled back'
    },
    
    // Velar stop
    'kk': {
      current: ['V_Tongue_up', 'V_Open'],
      suggested: ['V_Tongue_up', 'V_Open', 'Tongue_Wide', 'V_Tight'],  // Add tongue width/tension
      description: 'Velar stop - back of tongue to soft palate'
    },
    
    // Alveolar nasal
    'nn': {
      current: ['Tongue_Tip_Up', 'V_Open'],
      suggested: ['Tongue_Tip_Up', 'V_Open', 'V_Lip_Open', 'Tongue_Narrow'],  // Add refinements
      description: 'Alveolar nasal - tongue tip up, air through nose'
    },
    
    // Postalveolar affricate
    'CH': {
      current: ['V_Affricate', 'V_Open'],
      suggested: ['V_Affricate', 'V_Open', 'V_Tight-O', 'Tongue_Up'],  // Add lip rounding
      description: 'Postalveolar affricate - tongue near roof, lips slightly rounded'
    },
    
    // Alveolar fricative
    'SS': {
      current: ['V_Wide', 'V_Open'],
      suggested: ['V_Wide', 'V_Open', 'Tongue_Narrow', 'V_Tight'],  // Add tongue groove
      description: 'Alveolar fricative - narrow tongue groove, teeth close'
    },
    
    // Open vowel
    'aa': {
      current: ['V_Ah', 'V_Open'],
      suggested: ['V_Ah', 'V_Open', 'Jaw_Forward', 'Tongue_Down'],  // Full mouth opening
      description: 'Open back vowel - maximum jaw opening'
    },
    
    // Mid front vowel
    'E': {
      current: ['V_Stretched', 'V_Open'],
      suggested: ['V_Wide', 'V_Open', 'V_Lip_Open', 'Tongue_Tip_Down'],  // Better E shape
      description: 'Mid front vowel - lips spread, moderate opening'
    },
    
    // High front vowel
    'I': {
      current: ['V_Stretched', 'V_Open'],
      suggested: ['V_Wide', 'V_Tight', 'Tongue_Up', 'V_Lip_Open'],  // More accurate I
      description: 'High front vowel - lips spread, tongue high'
    },
    
    // Mid back rounded vowel
    'O': {
      current: ['V_Oh', 'V_Open'],
      suggested: ['V_Oh', 'V_Open', 'V_Tight-O', 'Jaw_Back'],  // Enhanced rounding
      description: 'Mid back rounded vowel - lips rounded'
    },
    
    // High back rounded vowel
    'U': {
      current: ['V_Tight-O', 'V_Open'],
      suggested: ['V_Tight-O', 'V_Tight', 'Tongue_Up', 'V_Lip_Suck_Upper'],  // Tighter rounding
      description: 'High back rounded vowel - lips tightly rounded'
    }
  };
}
