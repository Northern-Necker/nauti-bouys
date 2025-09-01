# Babylon.js Lip-Sync Testing Guide

## Summary

We've implemented a Babylon.js-based alternative to Three.js for the FBX ActorCore lip-sync system to address the critical issue where Three.js FBXLoader cannot access tongue morphs (Tongue_Tip_Up, Tongue_Curl) that are essential for natural NN, DD, and RR viseme articulation.

## Problem Recap

- **Three.js Limitation**: Cannot access tongue morphs on separate mesh hierarchies in FBX files
- **Affected Visemes**: 
  - NN (N sound) - requires Tongue_Tip_Up
  - DD (D/T sounds) - requires Tongue_Tip_Up  
  - RR (R sound) - requires Tongue_Curl
- **Result**: These visemes showed no tongue movement, making lip-sync unnatural

## Solution Implemented

### Files Created

1. **`frontend/src/utils/babylonActorCoreLipSync.js`**
   - Complete Babylon.js implementation with superior FBX morph target support
   - Designed to access ALL morphs across ALL meshes in the hierarchy
   - Includes tongue morph discovery and testing methods

2. **`frontend/src/pages/BabylonLipSyncTestPage.jsx`**
   - Test interface to validate tongue morph accessibility
   - Visual comparison between Three.js and Babylon.js capabilities
   - Individual viseme testing with focus on problematic ones

3. **`docs/THREEJS-ALTERNATIVES-FOR-LIPSYNC-ANALYSIS.md`**
   - Comprehensive analysis of alternatives
   - Babylon.js recommended as best solution
   - Alternative: Convert FBX to GLB with proper morph preservation

## Testing Instructions

### 1. Start the Development Server

```bash
cd frontend
npm run dev
```

### 2. Navigate to Test Page

Open your browser and go to:
```
http://localhost:5173/babylon-lipsync-test
```

### 3. Test Procedure

#### Step 1: Check Morph Discovery
- Look at the **Morph Target Status** panel
- Verify if Babylon.js can see:
  - ✓ Tongue_Out (should work - TH viseme)
  - ✓ Tongue_Tip_Up (critical for NN, DD)
  - ✓ Tongue_Curl (critical for RR)

#### Step 2: Test Individual Tongue Morphs
- Click **"Test Tongue Morphs"** button
- Watch the 3D model for tongue visibility
- Each morph will be tested for 2 seconds

#### Step 3: Test Problem Visemes
- Click **NN** button - tongue tip should go up behind teeth
- Click **DD** button - tongue should touch alveolar ridge
- Click **RR** button - tongue should curl back
- Click **TH** button - tongue should protrude between teeth

#### Step 4: Run Animated Test
- Click **"Test Sentence"** button
- Tests: "The dog ran near the thin path"
- Specifically validates TH, DD, RR, NN visemes in context

### 4. Expected Results

If Babylon.js successfully accesses tongue morphs:

| Viseme | Three.js (Current) | Babylon.js (Expected) |
|--------|-------------------|----------------------|
| NN | No tongue movement | Tongue tip up behind teeth |
| DD | No tongue movement | Tongue to alveolar ridge |
| RR | No tongue movement | Tongue curled back |
| TH | Tongue out (works) | Tongue out (works) |

## Next Steps Based on Results

### If Babylon.js Works ✅

1. **Migration Path**:
   - Replace Three.js FBXLoader with Babylon.js for lip-sync
   - Keep Three.js for other 3D rendering if needed
   - Use Babylon.js specifically for morph target manipulation

2. **Implementation**:
   ```javascript
   // Replace fbxActorCoreLipSync.js usage with:
   import { BabylonActorCoreLipSync } from './babylonActorCoreLipSync';
   
   const lipSync = new BabylonActorCoreLipSync(canvas, '/assets/Grace40s.fbx');
   lipSync.applyViseme('nn'); // Should now work!
   ```

### If Babylon.js Also Fails ❌

**Alternative Solution: FBX to GLB Conversion**

1. Convert FBX to GLB with morph preservation:
   ```bash
   # Using FBX2glTF
   FBX2glTF -i Grace40s.fbx -o Grace40s.glb --preserve-morphs --no-flip-v
   ```

2. Use Three.js with GLB (morphs should be accessible):
   ```javascript
   const loader = new GLTFLoader();
   loader.load('Grace40s.glb', (gltf) => {
       // All morphs including tongue should be accessible
   });
   ```

## Technical Benefits of Babylon.js

1. **Better FBX Support**: More comprehensive loader that handles complex hierarchies
2. **Complete Morph Access**: Can access morphs across all meshes
3. **Performance**: Often faster than Three.js for complex animations
4. **Future-Proof**: Strong backing from Microsoft, regular updates

## Troubleshooting

If the test page doesn't load:
1. Ensure Babylon.js is installed: `npm list @babylonjs/core`
2. Check console for errors
3. Verify FBX file exists at `/assets/Grace40s.fbx`

## Console Output to Watch

When testing, check browser console for:
```
=== Babylon.js Morph Target Discovery ===
Mesh: [mesh names]
  Morph target count: [number]
    - [morph names]

=== Tongue Morph Availability ===
✓ Tongue_Out FOUND on mesh: [mesh name]
✓ Tongue_Tip_Up FOUND on mesh: [mesh name]
✓ Tongue_Curl FOUND on mesh: [mesh name]
```

## Report Results

After testing, document:
1. Which tongue morphs were accessible
2. Which visemes now work correctly
3. Any remaining issues or limitations
4. Performance comparison with Three.js

This will determine if we proceed with Babylon.js migration or need to explore GLB conversion.
