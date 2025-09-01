# Morph Target Visual Update Fix

## Problem
The morph targets were being applied programmatically (as shown in console logs) but not visually updating the 3D avatar's face during lip-sync animations.

## Root Cause
The issue was in the `updateMeshMorphs()` function in `glbActorCoreLipSync.js`. The morph target influences were being set, but Three.js wasn't properly updating the visual representation because:

1. The geometry update flags weren't being set correctly for BufferGeometry
2. The mesh matrices weren't being updated after morph changes
3. The threshold check was preventing small morph values from being applied

## Solution

### Key Changes Made:

1. **Proper BufferGeometry Updates**
   ```javascript
   // For BufferGeometry (which GLB uses)
   if (mesh.geometry.morphAttributes && mesh.geometry.morphAttributes.position) {
     mesh.geometry.morphAttributesNeedUpdate = true;
   }
   if (mesh.geometry.morphAttributes && mesh.geometry.morphAttributes.normal) {
     mesh.geometry.morphNormalsNeedUpdate = true;
   }
   ```

2. **Force Matrix Updates**
   ```javascript
   // Force the mesh to update its matrix
   mesh.updateMatrix();
   mesh.updateMatrixWorld(true);
   ```

3. **Debug Logging**
   ```javascript
   // Debug log for significant changes
   if (Math.abs(targetValue) > 0.01) {
     console.log(`  💠 Setting ${morphName} on ${mesh.name}: ${targetValue.toFixed(3)}`);
   }
   ```

4. **Removed Threshold Check**
   - Changed from checking if difference > 0.001 to checking if values are not equal
   - This ensures even small morph values are applied

## Files Modified
- `frontend/src/utils/glbActorCoreLipSync.js` - Updated the `updateMeshMorphs()` function

## Verification
The morphs should now visually update when:
1. Clicking different viseme buttons
2. Running auto-test mode
3. Adjusting intensity slider

## Testing Checklist
- [ ] Verify "aa" viseme opens mouth
- [ ] Verify "PP" viseme shows lip compression
- [ ] Verify "TH" viseme shows tongue position
- [ ] Verify smooth transitions between visemes
- [ ] Verify all 15 visemes have visual changes

## Technical Details
The GLB format uses BufferGeometry in Three.js, which requires specific update flags:
- `morphAttributesNeedUpdate` - Updates morph attribute positions
- `morphNormalsNeedUpdate` - Updates morph attribute normals
- `updateMatrix()` and `updateMatrixWorld()` - Ensures transformations are applied
