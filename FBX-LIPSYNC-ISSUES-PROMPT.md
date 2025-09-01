# FBX Lip-Sync and Viseme Verification Prompt

## Current Situation Summary

We have successfully loaded the ActorCore FBX model (`SavannahAvatar-Unity.fbx`) and extracted all 105 morph targets. The core FBX loading and morph target extraction system is working correctly. However, the React test page (`FBXActorCoreLipSyncTestPage.jsx`) is failing with the error: `Cannot read properties of undefined (reading 'length')`.

This indicates a race condition in the React component where it attempts to render the debug information before the `debugInfo.morphTargets` array is fully populated, especially when an error occurs during the asynchronous initialization process.

## Technical Details

### Root Cause
- **Asynchronous Initialization**: The `initializeScene` function is async, and the component may try to render before the `debugInfo` state is fully populated.
- **Error Handling**: The `catch` block in `initializeScene` was not robust enough to prevent render errors when FBX loading fails.
- **React State**: The component's state was not being properly cleared or handled during the error state, leading to inconsistent data.

### Files Involved
- `frontend/src/pages/FBXActorCoreLipSyncTestPage.jsx`: The React component with the rendering issue.
- `frontend/src/utils/fbxActorCoreLipSync.js`: The lip-sync utility that provides the `getDebugInfo()` method.
- `frontend/src/utils/fbxMorphTargetLoader.js`: The core FBX loader, which is working correctly.

## Next Steps: Verify Lip-Sync with Visemes

Now that the FBX loading and morph target extraction are stable, we need to verify that the lip-sync system is correctly mapping visemes to the appropriate morph targets.

### 1. Fix the React Component
The immediate next step is to fix the rendering error in `FBXActorCoreLipSyncTestPage.jsx` by making the `getDebugInfo()` method more robust and ensuring the component handles undefined properties safely.

**Proposed Change in `fbxActorCoreLipSync.js`:**
```javascript
  getDebugInfo() {
    if (!this.enhancedModel) {
      return { 
        ready: false, 
        morphTargets: [], 
        visemeMapping: {},
        meshCount: 0 
      };
    }

    const morphTargets = this.enhancedModel.listMorphTargets ? 
      this.enhancedModel.listMorphTargets() : [];

    return {
      ready: this.isReady,
      morphTargets: Array.isArray(morphTargets) ? morphTargets : [],
      visemeMapping: this.visemeToMorphMap || {},
      meshCount: this.enhancedModel.morphTargetMeshes?.length || 0
    };
  }
```

### 2. Test Viseme Mapping
Once the test page is stable, we need to systematically test each viseme to ensure it triggers the correct facial expression.

**Testing Protocol:**
1. **Launch the test page**: `http://localhost:5173/fbx-actorcore-lipsync-test`
2. **Test each viseme button**: Click on each viseme button ("AA", "E", "I", "O", "U", etc.) and visually confirm that the avatar's mouth shape changes appropriately.
3. **Verify morph target values**: In the "Debug Information" panel, check that the correct morph target's value changes to 1.0 when a viseme is active.
4. **Test fallback mappings**: If a primary viseme mapping fails, the console should log a warning and attempt to use a fallback. Verify that this works as expected.

### 3. Simulate Speech
Use the "Simulate Speech Pattern" button to test a sequence of visemes and ensure smooth transitions between them.

### 4. Document Findings
- Record any visemes that are not mapping correctly.
- Note any unexpected behavior or visual artifacts.
- Update the `visemeToMorphMap` in `fbxActorCoreLipSync.js` with any necessary corrections.

## Expected Outcome

By the end of this process, we should have a fully functional and verified FBX-based lip-sync system with a stable test page for validation. This will confirm that we can reliably access and control all 105 morph targets by name, resolving the original issue of name-stripping in GLB files.
