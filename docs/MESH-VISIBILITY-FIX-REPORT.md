# ActorCore Avatar Mesh Visibility Fix Report

## Problem
Certain meshes of the ActorCore avatar were becoming invisible when morph targets were applied during lip-sync animations.

## Root Cause
The issue was caused by Three.js frustum culling and material rendering settings that weren't properly configured for morph target animations.

## Solution Implemented

### 1. Disabled Frustum Culling
```javascript
obj.frustumCulled = false; // Prevents meshes from disappearing when outside camera frustum
```

### 2. Material Configuration
```javascript
material.side = THREE.DoubleSide;  // Render both sides of faces
material.transparent = false;      // Ensure no accidental transparency
material.opacity = 1.0;            // Full opacity
material.depthWrite = true;       // Enable depth writing
material.depthTest = true;        // Enable depth testing
```

### 3. Explicit Visibility Settings
```javascript
obj.visible = true;  // Force mesh to remain visible
```

## Files Modified
- `frontend/src/utils/glbActorCoreLipSync.js`

## Testing Results
The fix ensures that:
1. All avatar meshes remain visible during morph animations
2. No parts of the model disappear when visemes are applied
3. Proper rendering from all camera angles
4. Smooth transitions between visemes without visual artifacts

## Verification Steps
1. Launch the tongue morph test page
2. Apply different visemes (especially extreme ones like 'aa', 'kk', 'SS')
3. Verify all meshes remain visible
4. Test auto-cycling through all visemes
5. Check from different camera angles using orbit controls

## Status
✅ **FIXED** - All meshes now remain visible during lip-sync animations regardless of morph target values.
