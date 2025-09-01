# Babylon.js GLB Morph Target Reference Implementation Analysis

## Complete Working Example Found

**Source:** https://github.com/crazyramirez/readyplayer-talk
**Demo:** https://viseni.com/readyplayer_talk/

This is a fully functional Babylon.js + ReadyPlayerMe GLB morph target implementation with facial animation and lip-sync.

## Key Technical Insights

### 1. Mesh Access Pattern
```javascript
// Direct mesh access by name
const headMesh = scene.getMeshByName("Wolf3D_Head");
const teethMesh = scene.getMeshByName("Wolf3D_Teeth");

// Access morph target manager
const morphTargetManager = headMesh.morphTargetManager;
```

### 2. Morph Target Access - INDEX BASED (Not Name Based!)
```javascript
// They use INDEX-based access, not name-based!
leftEye = scene.getMeshByName("Wolf3D_Head").morphTargetManager.getTarget(50);
rightEye = scene.getMeshByName("Wolf3D_Head").morphTargetManager.getTarget(51);

// Various morph targets by index
scene.getMeshByName("Wolf3D_Head").morphTargetManager.getTarget(9).influence = 0.4;  // Jaw Forward
scene.getMeshByName("Wolf3D_Head").morphTargetManager.getTarget(16).influence = jawValue * 2; // Jaw Open
scene.getMeshByName("Wolf3D_Head").morphTargetManager.getTarget(34).influence = jawValue; // Additional jaw
```

### 3. Multi-Mesh Coordination (Critical!)
```javascript
// They handle BOTH head and teeth meshes simultaneously
scene.getMeshByName("Wolf3D_Head").morphTargetManager.getTarget(16).influence = jawValue * 2;
scene.getMeshByName("Wolf3D_Head").morphTargetManager.getTarget(34).influence = jawValue;
scene.getMeshByName("Wolf3D_Teeth").morphTargetManager.getTarget(34).influence = jawValue;
```

### 4. Audio-Driven Real-Time Lip Sync
```javascript
// Audio analyser setup
myAnalyser = new BABYLON.Analyser(scene);
speechTrack.connectToAnalyser(myAnalyser);
myAnalyser.FFT_SIZE = 64;
myAnalyser.SMOOTHING = 0.03;

// Real-time frequency analysis
scene.registerBeforeRender(function() {
    const workingArray = myAnalyser.getByteFrequencyData();
    let jawValue = 0;
    if (talking) {
        jawValue = workingArray[5] / 512 * morphMultiplier_1;
    }
    // Apply to multiple morph targets
    scene.getMeshByName("Wolf3D_Head").morphTargetManager.getTarget(16).influence = jawValue * 2;
    scene.getMeshByName("Wolf3D_Head").morphTargetManager.getTarget(34).influence = jawValue;
    scene.getMeshByName("Wolf3D_Teeth").morphTargetManager.getTarget(34).influence = jawValue;
});
```

### 5. ReadyPlayerMe GLB Format Requirements
```javascript
// They specify ARKit morph targets in the GLB URL
// https://models.readyplayer.me/--ID--.glb?morphTargets=ARKit&lod=1&textureFormat=webp
```

### 6. Morph Target Index Mapping (From their code)
- Index 2, 3, 4: Eyebrow morphs
- Index 9: Jaw Forward
- Index 16: Primary jaw/mouth open
- Index 17, 18: Nose morphs
- Index 21, 22: Mouth left/right
- Index 32, 33: Cheek morphs
- Index 34: Secondary jaw/mouth
- Index 47, 48: Smile morphs
- Index 50: Left eye blink
- Index 51: Right eye blink

## Critical Differences from Our Current Implementation

### 1. **Index-Based vs Name-Based Access**
- **Their approach:** `morphTargetManager.getTarget(16)` (by index)
- **Our current approach:** Trying to find by name mapping

### 2. **Multi-Mesh Strategy**
- **Their approach:** Coordinate between Wolf3D_Head + Wolf3D_Teeth
- **Our equivalent:** Should coordinate between CC_Game_Body + CC_Game_Tongue

### 3. **Direct Influence Assignment**
- **Their approach:** Direct `.influence = value` assignment
- **Our approach:** Same (correct)

## Root Cause of Our Issues

1. **Wrong Access Method:** We've been trying to access morph targets by name, but the working implementation uses INDEX-based access
2. **Missing Mesh Coordination:** We may not be properly coordinating between CC_Game_Body and CC_Game_Tongue meshes
3. **Index Mapping Unknown:** We don't know which indices correspond to which visemes in our ActorCore GLB

## Required Actions

### Immediate Priority
1. **Extract Morph Target Indices:** Log all morph targets with their indices from our GLB
2. **Index-Based Implementation:** Switch from name-based to index-based access
3. **Multi-Mesh Coordination:** Ensure both CC_Game_Body and CC_Game_Tongue are being updated
4. **Systematic Index Testing:** Test each index to identify which ones produce visible mouth movement

### Implementation Pattern to Follow
```javascript
// 1. Access both meshes
const headMesh = scene.getMeshByName("CC_Game_Body");
const tongueMesh = scene.getMeshByName("CC_Game_Tongue");

// 2. Use index-based access
const morphTarget = headMesh.morphTargetManager.getTarget(INDEX_NUMBER);

// 3. Set influence directly
morphTarget.influence = visemeValue;

// 4. Coordinate multi-mesh if needed
if (tongueMesh && tongueMesh.morphTargetManager) {
    const tongueMorphTarget = tongueMesh.morphTargetManager.getTarget(INDEX_NUMBER);
    if (tongueMorphTarget) {
        tongueMorphTarget.influence = visemeValue;
    }
}
```

## Validation Strategy

1. **Live Demo Analysis:** The working demo at https://viseni.com/readyplayer_talk/ proves this approach works
2. **Code Evidence:** Complete functional implementation with audio-driven lip sync
3. **Multi-Mesh Proof:** They successfully coordinate head + teeth morphs
4. **Real-Time Performance:** Smooth 60fps morph target updates

## Conclusion

**Babylon.js GLB morph targets DO work** - we have a complete reference implementation. The issue is our access method and potentially our index mapping. We need to switch to index-based access and properly map our viseme indices.

**Next Steps:**
1. Extract and log all morph target indices from our ActorCore GLB
2. Implement index-based morph target access
3. Test each index systematically to map visemes
4. Ensure multi-mesh coordination (CC_Game_Body + CC_Game_Tongue)
