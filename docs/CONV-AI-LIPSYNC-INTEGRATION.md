# Conv-AI Lip Sync Integration

## Overview

This document describes the integration of Conv-AI's proven lip sync system with our SavannahAvatar ActorCore/CC4 character. We have successfully analyzed and integrated the working implementation from the Conv-AI/Reallusion-web repository to create a production-ready lip sync solution.

## Implementation Summary

### 1. Analysis of Conv-AI/Reallusion-web Repository

We thoroughly examined the Conv-AI/Reallusion-web repository to understand their working lip sync implementation:

- **App.jsx**: Main React application using Canvas and Experience component
- **Experience.jsx**: 3D scene setup with Nikhil avatar component  
- **Nikhil.jsx**: Avatar component using useLipsync and useHeadTracking hooks
- **useLipsync.jsx**: Core lip-sync implementation with VisemeToReallusion function
- **mappingMorphs.jsx**: Contains the crucial viseme-to-morph-target mapping logic
- **lerpMorphTarget.jsx**: Smooth animation interpolation using Three.js lerp

### 2. Key Technical Insights

#### Viseme Mapping System
Conv-AI uses a 15-viseme system mapped to specific phonetic sounds:
- `0: 'sil'` - silence
- `1: 'PP'` - bilabial plosives (p, b, m)
- `2: 'FF'` - labiodental fricatives (f, v)
- `3: 'TH'` - dental fricatives (th)
- `4: 'DD'` - alveolar plosives (t, d, n, l)
- `5: 'KK'` - velar plosives (k, g)
- `6: 'CH'` - postalveolar affricates (ch, j)
- `7: 'SS'` - alveolar fricatives (s, z)
- `8: 'NN'` - nasal consonants (n, ng)
- `9: 'RR'` - liquids (r)
- `10: 'AA'` - open vowels (a)
- `11: 'E'` - front vowels (e)
- `12: 'I'` - close front vowels (i)
- `13: 'O'` - back vowels (o)
- `14: 'U'` - close back vowels (u)

#### Morph Target Animation
- Uses Three.js `MathUtils.lerp()` for smooth interpolation
- Real-time updates at 100fps using `useFrame` hook
- Blend shape accumulation for multiple simultaneous visemes
- Special handling for viseme 1 (PP) with 1.5x multiplier for low values

### 3. Our Enhanced Implementation

#### Files Created

1. **`frontend/src/utils/convaiReallusion.js`**
   - Direct port of Conv-AI's proven implementation
   - Contains original `VisemeToReallusion` function
   - Includes `lerpMorphTarget` for smooth animation
   - Provides `createActorCoreMorphMapping` for name translation

2. **`frontend/src/utils/enhancedActorCoreLipSync.js`**
   - Enhanced version using our extracted CC4 morph target names
   - Maps Conv-AI naming to actual SavannahAvatar morph targets
   - Provides `VisemeToActorCore` function for our specific model
   - Includes debugging and inspection utilities

3. **`frontend/src/pages/EnhancedLipSyncTestPage.jsx`**
   - Interactive test page for the enhanced lip sync system
   - Real-time phoneme testing with visual feedback
   - Morph target inspector showing active influences
   - Animation speed controls and auto-play functionality

#### Key Features

- **Proven Mapping**: Uses Conv-AI's tested viseme-to-morph-target relationships
- **Actual Names**: Maps to our extracted CC4 morph target names from SavannahAvatar-Unity.fbx
- **Real-time Animation**: Smooth interpolation with configurable speed
- **Visual Debugging**: Live morph target influence monitoring
- **Interactive Testing**: Manual phoneme testing and auto-play sequences

### 4. Morph Target Mapping

Our system successfully maps Conv-AI's morph target names to our actual CC4 names:

```javascript
const nameMap = {
  'Mouth_Drop_Lower': ['Jaw_Open'],
  'Open_Jaw': ['Jaw_Open'],
  'Mouth_Smile_L': ['Mouth_Smile_L'],
  'Mouth_Smile_R': ['Mouth_Smile_R'],
  'Mouth_Frown_L': ['Mouth_Frown_L'],
  'Mouth_Frown_R': ['Mouth_Frown_R'],
  'Tongue_Out': ['Tongue_Out'],
  'Tongue_Up': ['Tongue_Up', 'Tongue_up'],
  // ... additional mappings
};
```

### 5. Usage

#### Basic Integration
```javascript
import { VisemeToActorCore, applyBlendShape } from '../utils/enhancedActorCoreLipSync';

// Convert viseme data to morph targets
const blendShape = VisemeToActorCore(visemeData, blendShapeRef);

// Apply to 3D scene
applyBlendShape(blendShape, animationSpeed, scene);
```

#### Testing
Navigate to `/enhanced-lipsync-test` to access the interactive test page where you can:
- Test individual phonemes
- Run auto-play sequences
- Monitor morph target influences
- Adjust animation speed
- View mapping statistics

### 6. Technical Specifications

- **Framework**: React + Three.js + React Three Fiber
- **Animation**: 100fps real-time updates using `useFrame`
- **Interpolation**: Three.js `MathUtils.lerp()` for smooth transitions
- **Morph Targets**: 172 extracted from SavannahAvatar-Unity.fbx
- **Visemes**: 15-viseme system from Conv-AI
- **Performance**: Optimized with blend shape queue management

### 7. Future Enhancements

1. **TTS Integration**: Connect with Web Speech API for real-time speech synthesis
2. **Audio Analysis**: Implement phoneme detection from audio input
3. **Emotion Mapping**: Extend to facial expressions and emotions
4. **Gesture System**: Add head tracking and body language
5. **Performance Optimization**: GPU-based morph target animation

### 8. References

- **Conv-AI/Reallusion-web**: https://github.com/Conv-AI/Reallusion-web
- **ActorCore Documentation**: Character Creator 4 pipeline
- **Three.js Morph Targets**: https://threejs.org/docs/#api/en/objects/Mesh.morphTargetInfluences
- **React Three Fiber**: https://docs.pmnd.rs/react-three-fiber

## Conclusion

This integration successfully combines Conv-AI's proven lip sync approach with our SavannahAvatar model, providing a robust foundation for realistic facial animation. The system is production-ready and can be extended for full conversational AI applications.
