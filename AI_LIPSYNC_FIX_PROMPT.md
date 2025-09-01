# AI Lip Sync Fix Prompt

## Task Overview
Fix the lip sync functionality in a React Three Fiber TTS test page for a 3D avatar. The current implementation only has basic random mouth movement instead of proper viseme-based lip sync animation.

## Current Problem
The avatar's mouth moves randomly during speech instead of synchronizing with the actual phonemes being spoken. The lip sync system needs to be enhanced to use proper viseme-to-morph-target mapping.

## Project Context

### Technology Stack
- React + React Three Fiber (R3F)
- Three.js for 3D rendering
- GLB/GLTF 3D model format
- ActorCore/CC4 character from Reallusion
- Web Speech Synthesis API for TTS

### Key Files to Modify

1. **Main TTS Test Page**: `frontend/src/pages/TTSLipSyncTestPage.jsx`
   - Contains the SavannahAvatar component with basic lip sync
   - Uses Web Speech Synthesis API
   - Has working WebGL context and Surface Pro navigation

2. **Enhanced Lip Sync Utility**: `frontend/src/utils/enhancedActorCoreLipSync.js`
   - Contains proven Conv-AI viseme mapping system
   - Has 15-viseme system mapped to CC4 morph targets
   - Includes VisemeToActorCore function and applyBlendShape

3. **Extracted Morph Targets**: `scripts/extracted-morph-targets.json`
   - Contains 172 morph target names from SavannahAvatar.glb
   - Used for mapping visemes to actual model morph targets

## Current Implementation Issues

### In TTSLipSyncTestPage.jsx - SavannahAvatar Component:
```javascript
// CURRENT BROKEN IMPLEMENTATION:
useEffect(() => {
  let animationInterval;
  if (isPlaying) {
    animationInterval = setInterval(() => {
      // Simple mouth movement during speech - THIS IS WRONG
      setCurrentViseme(Math.random() * 0.5 + 0.3); // Random mouth opening
    }, 100);
  } else {
    setCurrentViseme(0); // Close mouth when not speaking
  }
  
  return () => {
    if (animationInterval) {
      clearInterval(animationInterval);
    }
  };
}, [isPlaying]);
```

### The useFrame hook only applies basic mouth opening:
```javascript
// Apply simple mouth animation - THIS NEEDS TO BE ENHANCED
const mouthOpenIndex = child.morphTargetDictionary['mouthOpen'] || 
                      child.morphTargetDictionary['MouthOpen'] ||
                      child.morphTargetDictionary['mouth_open'] ||
                      child.morphTargetDictionary['A'];
if (mouthOpenIndex !== undefined) {
  child.morphTargetInfluences[mouthOpenIndex] = THREE.MathUtils.lerp(
    child.morphTargetInfluences[mouthOpenIndex] || 0,
    currentViseme,
    0.2
  );
}
```

## Required Solution

### 1. Text-to-Phoneme Conversion
Implement a system to convert the spoken text into phonemes/visemes in real-time. Options:
- Use a phoneme library like `phoneme-synthesis` or `espeak-phonemes`
- Create a simple phoneme mapping for common English sounds
- Use timing-based approximation with text analysis

### 2. Integrate Enhanced Lip Sync System
Replace the random mouth movement with the proven Conv-AI viseme system:

```javascript
// Import the enhanced lip sync system
import { VisemeToActorCore, applyBlendShape } from '../utils/enhancedActorCoreLipSync';
```

### 3. Real-time Viseme Application
Modify the useFrame hook to apply multiple morph targets based on current phonemes:

```javascript
// Instead of single mouth opening, apply full viseme blend shapes
const blendShape = VisemeToActorCore(currentVisemeData, blendShapeRef);
applyBlendShape(blendShape, 0.3, avatarRef.current);
```

## Available Resources

### Conv-AI Viseme Mapping (from enhancedActorCoreLipSync.js):
- 15-viseme system: sil, PP, FF, TH, DD, KK, CH, SS, NN, RR, AA, E, I, O, U
- Each viseme maps to specific CC4 morph targets with proven values
- Includes smooth interpolation with THREE.MathUtils.lerp

### Available Morph Targets (172 total):
Key mouth-related targets include:
- Jaw_Open, Mouth_Smile_L/R, Mouth_Frown_L/R
- Mouth_Pucker, Mouth_Funnel, Mouth_Press_L/R
- Tongue_Out, Tongue_Up, Tongue_Down
- And many more detailed facial controls

## Implementation Requirements

### 1. Phoneme Detection
Create a function to analyze the text being spoken and generate phoneme timing:
```javascript
const generatePhonemeSequence = (text, speechRate) => {
  // Convert text to phoneme sequence with timing
  // Return array of {phoneme, startTime, duration}
}
```

### 2. Real-time Viseme Updates
Replace the random mouth movement with phoneme-synchronized visemes:
```javascript
const updateVisemes = (currentTime, phonemeSequence) => {
  // Find current phoneme based on speech timing
  // Convert to viseme using Conv-AI mapping
  // Return viseme data for morph target application
}
```

### 3. Enhanced useFrame Hook
Apply multiple morph targets simultaneously:
```javascript
useFrame((state) => {
  if (!avatarRef.current || !isPlaying) return;
  
  const currentTime = state.clock.elapsedTime;
  const currentVisemeData = getCurrentViseme(currentTime);
  
  // Apply Conv-AI viseme system
  const blendShape = VisemeToActorCore(currentVisemeData);
  applyBlendShape(blendShape, 0.3, avatarRef.current);
  
  // Keep existing blinking functionality
  // ... blinking code remains the same
});
```

## Success Criteria
1. Avatar's mouth movements should correspond to actual phonemes being spoken
2. Different vowels (A, E, I, O, U) should produce visibly different mouth shapes
3. Consonants (P, B, M, F, V, etc.) should show appropriate lip/tongue positions
4. Smooth transitions between phonemes using lerp interpolation
5. Maintain existing WebGL stability and blinking functionality

## Testing Approach
Use the existing test phrases in TTSLipSyncTestPage.jsx:
- Phoneme test: "Peter Piper picked a peck of pickled peppers"
- Vowel test: "The quick brown fox jumps over the lazy dog"
- Natural speech: Bartending conversations

## Key Files to Reference
1. `frontend/src/pages/TTSLipSyncTestPage.jsx` - Main implementation
2. `frontend/src/utils/enhancedActorCoreLipSync.js` - Viseme mapping system
3. `scripts/extracted-morph-targets.json` - Available morph targets
4. `docs/CONV-AI-LIPSYNC-INTEGRATION.md` - Technical documentation

## Important Notes
- Maintain the existing Conv-AI/Reallusion-web pattern for WebGL stability
- Keep the automatic blinking functionality intact
- Preserve Surface Pro trackpad navigation optimizations
- Use the proven morph target mapping from enhancedActorCoreLipSync.js
- Ensure smooth 100fps updates using useFrame hook with frame skipping

## Expected Outcome
A fully functional lip sync system where the 3D avatar's mouth movements accurately reflect the phonemes being spoken through the Web Speech Synthesis API, using the proven Conv-AI viseme-to-morph-target mapping system.
