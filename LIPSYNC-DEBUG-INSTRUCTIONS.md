# Lip-Sync Debugging Instructions

## Current Status
The lip-sync system has been enhanced with comprehensive debugging capabilities. The audio plays correctly, but the morph target animations are not visually updating on the GLB avatar.

## How to Test

### 1. Access the Test Page
Navigate to: http://localhost:5173/consolidated-avatar-test

### 2. Enable Debug Mode
The test page should have debug mode enabled by default. Look for the debug panel at the bottom showing:
- Performance metrics (FPS, Active Morph Targets)
- System status indicators
- Morph target information

### 3. Use Browser Console Commands

Once the avatar loads, open the browser console (F12) and use these commands:

```javascript
// Test individual morph targets
window.testMorphTarget("Jaw_Open")  // Should open the jaw
window.testMorphTarget("Mouth_Smile_L")  // Should make left side smile
window.testMorphTarget("Mouth_Smile_R")  // Should make right side smile

// Test all mouth targets sequentially (1 second each)
window.testAllMouth()

// Analyze the model's morph target setup
window.analyzeModel()
```

### 4. Test Speech with Lip-Sync

In the test page interface, look for the speech test controls and try:
- "Hello, how are you today?" - Tests basic visemes
- "Peter Piper picked a peck of pickled peppers" - Tests 'P' sounds
- "She sells seashells by the seashore" - Tests 'S' sounds

### 5. What to Look For

#### In the Console:
- 🔬 Model Analysis Complete - Shows morph target structure
- 🎭 Applying blend shape - Shows which targets are being activated
- ✅ SIGNIFICANT morph update - Shows when values change significantly
- Visual progress bars showing morph target values

#### On the Avatar:
- Jaw movement when speaking
- Lip movements synchronized with speech
- Mouth shape changes for different sounds

## Debugging Information

### Key Files Modified:
1. **frontend/src/utils/enhancedActorCoreLipSyncDebug.js**
   - Enhanced debugging functions
   - Direct morph target testing
   - Comprehensive logging

2. **frontend/src/components/avatar/ConsolidatedProductionAvatar.jsx**
   - Integrated debug functions
   - Added model analysis on load
   - Enhanced performance metrics

### Known Issues Being Investigated:
1. **Morph targets are being updated in code but not visually**
   - Values are changing in morphTargetInfluences array
   - Geometry update flags are being set
   - But visual changes are not appearing

### Potential Causes:
1. **Render loop not updating after morph changes**
   - The renderer might need explicit invalidation
   - Three.js might be caching the geometry

2. **GLB file morph target structure**
   - The morph targets might be on a different mesh than expected
   - The morph target indices might not match

3. **Scale or intensity issues**
   - Values might be too small to see
   - The avatar positioning might hide the changes

## Next Steps to Debug:

1. **Check if manual morph target tests work:**
   ```javascript
   window.testMorphTarget("Jaw_Open")
   ```
   If this doesn't visually open the jaw, the issue is with the morph target application.

2. **Verify morph targets exist in the model:**
   ```javascript
   window.analyzeModel()
   ```
   Check the console output for the list of available morph targets.

3. **Monitor the debug console during speech:**
   - Look for "SIGNIFICANT morph update" messages
   - Check the visual progress bars
   - Note which targets are being activated

4. **Try increasing the interpolation speed:**
   The current speed is 0.15, which might be too slow. The debug version uses a minimum of 0.3.

## Manual Fix Attempts:

If the morph targets aren't working, try these in the console:

```javascript
// Get the model directly
const model = window.testMorphTarget._model;

// Find all skinned meshes
model.traverse(child => {
  if (child.isSkinnedMesh) {
    console.log('Mesh:', child.name, 'Morph targets:', Object.keys(child.morphTargetDictionary || {}));
  }
});

// Try setting a morph target directly
model.traverse(child => {
  if (child.isSkinnedMesh && child.morphTargetDictionary) {
    const index = child.morphTargetDictionary['Jaw_Open'];
    if (index !== undefined) {
      child.morphTargetInfluences[index] = 1.0;
      child.geometry.attributes.position.needsUpdate = true;
      console.log('Set Jaw_Open to 1.0');
    }
  }
});
```

## Contact for Support
If the debugging reveals specific error patterns or if manual tests don't work, document:
1. Console error messages
2. Output from window.analyzeModel()
3. Whether manual morph target tests show visual changes
4. Any patterns in the debug logs

This information will help identify whether the issue is with:
- The GLB file itself
- The Three.js rendering pipeline
- The morph target mapping
- The animation timing
