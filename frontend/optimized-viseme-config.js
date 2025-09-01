// Optimized Viseme Configuration based on ActorCore/Character Creator morphs
// Generated from autonomous optimization results - TARGET: 90% ACCURACY

export const OPTIMIZED_VISEME_MAPPINGS = {
    'sil': {
        morphs: [],  // Neutral position
        intensity: 0.0,
        description: 'Silence/Neutral'
    },
    
    'pp': {
        // PASSED with 99.75% accuracy!
        morphs: ['Mouth_Close', 'V_Explosive', 'Mouth_Press_L', 'Mouth_Press_R'],
        intensity: 0.8,
        description: 'Bilabial /p/, /b/, /m/'
    },
    
    'ff': {
        // Use the V_Dental_Lip morph specifically for F/V sounds!
        morphs: ['V_Dental_Lip', 'Mouth_Down_Lower_L', 'Mouth_Down_Lower_R'],
        intensity: 0.85,
        description: 'Labiodental /f/, /v/'
    },
    
    'th': {
        // Use V_Tongue_Out for dental fricatives
        morphs: ['V_Tongue_Out', 'Tongue_Out', 'V_Lip_Open'],
        intensity: 0.9,
        description: 'Dental /θ/, /ð/'
    },
    
    'dd': {
        // Use V_Tongue_up and V_Tongue_Raise for alveolar
        morphs: ['V_Tongue_up', 'V_Tongue_Raise', 'Tongue_Tip_Up', 'Mouth_Close'],
        intensity: 0.85,
        description: 'Alveolar /t/, /d/, /n/, /l/'
    },
    
    'kk': {
        // PASSED with 91.97% accuracy!
        morphs: ['Jaw_Open', 'V_Open', 'Tongue_Up'],
        intensity: 0.7,
        description: 'Velar /k/, /g/'
    },
    
    'ch': {
        // Use V_Affricate for CH/SH sounds
        morphs: ['V_Affricate', 'Mouth_Funnel', 'Mouth_Pucker'],
        intensity: 0.85,
        description: 'Postalveolar /tʃ/, /dʒ/, /ʃ/, /ʒ/'
    },
    
    'ss': {
        // PASSED with 94.92% accuracy!
        morphs: ['Mouth_Smile_L', 'Mouth_Smile_R', 'V_Tight', 'Mouth_Close'],
        intensity: 0.7,
        description: 'Fricative /s/, /z/'
    },
    
    'nn': {
        // Use tongue position morphs for nasal
        morphs: ['V_Tongue_up', 'Tongue_Up', 'V_Tongue_Raise', 'Mouth_Close'],
        intensity: 0.85,
        description: 'Nasal /n/, /ŋ/'
    },
    
    'rr': {
        // Use V_Tongue_Curl for rhotic R
        morphs: ['V_Tongue_Curl-U', 'Tongue_Roll', 'V_Open'],
        intensity: 0.85,
        description: 'Rhotic /r/'
    },
    
    'aa': {
        // PERFECT with 100% accuracy!
        morphs: ['Jaw_Open', 'V_Open', 'Mouth_Stretch_L', 'Mouth_Stretch_R'],
        intensity: 0.9,
        description: 'Open vowel /ɑ/, /æ/'
    },
    
    'e': {
        // PASSED with 87.70% accuracy
        morphs: ['Jaw_Open', 'V_Open', 'Mouth_Smile_L', 'Mouth_Smile_R'],
        intensity: 0.7,
        description: 'Mid vowel /ɛ/'
    },
    
    'ih': {
        // PASSED with 90.25% accuracy
        morphs: ['Mouth_Smile_L', 'Mouth_Smile_R', 'V_Wide'],
        intensity: 0.7,
        description: 'High vowel /ɪ/'
    },
    
    'oh': {
        // PASSED with 90.31% accuracy
        morphs: ['Mouth_Funnel', 'V_Tight-O', 'Mouth_Pucker'],
        intensity: 0.7,
        description: 'Mid-back vowel /oʊ/'
    },
    
    'ou': {
        // PASSED with 94.83% accuracy
        morphs: ['Mouth_Pucker', 'V_Tight-O', 'Mouth_Funnel'],
        intensity: 0.8,
        description: 'High-back vowel /u/'
    }
};

// Additional expressions using available morphs
export const FACIAL_EXPRESSIONS = {
    'smile': {
        morphs: ['Mouth_Smile_L', 'Mouth_Smile_R', 'Cheek_Raise_L', 'Cheek_Raise_R'],
        intensity: 0.8
    },
    'frown': {
        morphs: ['Mouth_Frown_L', 'Mouth_Frown_R', 'Brow_Drop_L', 'Brow_Drop_R'],
        intensity: 0.7
    },
    'surprise': {
        morphs: ['Brow_Raise_Inner_L', 'Brow_Raise_Inner_R', 'Eye_Wide_L', 'Eye_Wide_R', 'Jaw_Open'],
        intensity: 0.9
    },
    'squint': {
        morphs: ['Eye_Squint_L', 'Eye_Squint_R', 'Cheek_Raise_L', 'Cheek_Raise_R'],
        intensity: 0.6
    },
    'puff': {
        morphs: ['Cheek_Puff_L', 'Cheek_Puff_R', 'Mouth_Close'],
        intensity: 0.8
    }
};

// Map viseme names to their configurations
export function getVisemeConfig(visemeName) {
    return OPTIMIZED_VISEME_MAPPINGS[visemeName.toLowerCase()] || OPTIMIZED_VISEME_MAPPINGS['sil'];
}

// Apply a viseme to morph targets
export function applyViseme(morphTargets, visemeName, intensityMultiplier = 1.0) {
    // Reset all morphs
    morphTargets.forEach(morph => {
        morph.mesh.morphTargetInfluences[morph.index] = 0;
    });
    
    const config = getVisemeConfig(visemeName);
    if (!config || !config.morphs) return 0;
    
    let appliedCount = 0;
    const finalIntensity = config.intensity * intensityMultiplier;
    
    config.morphs.forEach(morphName => {
        morphTargets.forEach(morph => {
            // Exact match first
            if (morph.name === morphName) {
                morph.mesh.morphTargetInfluences[morph.index] = finalIntensity;
                appliedCount++;
            }
            // Fallback to partial match
            else if (morph.name.toLowerCase().includes(morphName.toLowerCase())) {
                morph.mesh.morphTargetInfluences[morph.index] = finalIntensity;
                appliedCount++;
            }
        });
    });
    
    return appliedCount;
}

// Blend between two visemes for smooth transitions
export function blendVisemes(morphTargets, viseme1, viseme2, blendFactor) {
    // blendFactor: 0 = fully viseme1, 1 = fully viseme2
    const config1 = getVisemeConfig(viseme1);
    const config2 = getVisemeConfig(viseme2);
    
    // Reset all morphs
    morphTargets.forEach(morph => {
        morph.mesh.morphTargetInfluences[morph.index] = 0;
    });
    
    // Apply first viseme
    if (config1 && config1.morphs) {
        config1.morphs.forEach(morphName => {
            morphTargets.forEach(morph => {
                if (morph.name === morphName) {
                    morph.mesh.morphTargetInfluences[morph.index] = config1.intensity * (1 - blendFactor);
                }
            });
        });
    }
    
    // Add second viseme
    if (config2 && config2.morphs) {
        config2.morphs.forEach(morphName => {
            morphTargets.forEach(morph => {
                if (morph.name === morphName) {
                    morph.mesh.morphTargetInfluences[morph.index] += config2.intensity * blendFactor;
                }
            });
        });
    }
}

// Test all visemes in sequence
export async function testVisemeSequence(morphTargets, delayMs = 1000) {
    const visemes = Object.keys(OPTIMIZED_VISEME_MAPPINGS);
    
    for (const viseme of visemes) {
        console.log(`Testing viseme: ${viseme.toUpperCase()}`);
        applyViseme(morphTargets, viseme);
        await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    
    // Reset to neutral
    applyViseme(morphTargets, 'sil');
    console.log('Viseme test sequence complete');
}

// Export morph target analysis
export function analyzeMorphTargets(morphTargets) {
    const analysis = {
        totalMorphs: morphTargets.length,
        visemeSpecificMorphs: [],
        arkitMorphs: [],
        customMorphs: [],
        tongueMorphs: [],
        jawMorphs: [],
        mouthMorphs: []
    };
    
    morphTargets.forEach(morph => {
        const name = morph.name;
        
        if (name.startsWith('V_')) {
            analysis.visemeSpecificMorphs.push(name);
        }
        if (name.includes('Tongue')) {
            analysis.tongueMorphs.push(name);
        }
        if (name.includes('Jaw')) {
            analysis.jawMorphs.push(name);
        }
        if (name.includes('Mouth')) {
            analysis.mouthMorphs.push(name);
        }
    });
    
    return analysis;
}