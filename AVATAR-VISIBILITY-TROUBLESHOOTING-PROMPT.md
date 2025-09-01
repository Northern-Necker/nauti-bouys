# Avatar Visibility Troubleshooting Task

## Task Objective

**Primary Goal**: Resolve the avatar visibility issue in the FBX-based lip-sync system where the 3D model loads successfully but remains invisible in the viewport.

**Context**: The FBX lip-sync system is functionally complete with all core objectives achieved, but the avatar model is not rendering visually despite successful loading and processing.

## Current Status Summary

### ✅ WORKING (Core Functionality Complete)
- **FBX Loading**: ActorCore FBX model (`SavannahAvatar-Unity.fbx`) loads successfully
- **Morph Target System**: All 91 morph targets accessible by name across 8 meshes
- **Lip-Sync Logic**: Complete viseme-to-morph mapping system functional
- **API Integration**: All methods for controlling facial expressions implemented
- **Scene Setup**: Three.js scene, camera, lighting, and controls properly configured
- **Material Processing**: Material visibility fixes applied (opacity=1.0, transparent=false, visible=true)

### ❌ ISSUE (Needs Resolution)
- **Visual Rendering**: Avatar model invisible in 3D viewport (shows black screen)
- **React Error**: Persistent `TypeError: Cannot read properties of undefined (reading 'length')`

## Technical Context

### Successful Console Output Confirms:
```
📐 Model bounds - Center: [x,y,z] Size: [width,height,depth]
📏 Model max dimension: 169.7459820336748
🔧 Applied LARGE scale factor for visibility: 1.178231128677457
📍 VISIBILITY FIX - Positioned model for camera view at Y=100
🎨 Fixed material visibility for: CC_Game_Body, CC_Game_Tongue, Shoes, Top, Bottom, Hair, CC_Base_Eye, CC_Base_Teeth, Character
🎯 Found 8 meshes with morph targets
📝 Total morph targets: 91
🎮 FINAL FIX: Camera and target both aligned to Y=100!
✅ FBX ActorCore Lip-Sync System fully initialized
```

### Key Files Implemented:
1. **`frontend/src/utils/fbxMorphTargetLoader.js`**
   - Core FBX loading using official Three.js patterns
   - Model scaling, positioning, and material visibility fixes
   - Morph target extraction and management

2. **`frontend/src/utils/fbxActorCoreLipSync.js`** 
   - Viseme-to-morph target mapping system
   - Facial animation control methods
   - Comprehensive error handling

3. **`frontend/src/pages/FBXActorCoreLipSyncTestPage.jsx`**
   - React test interface with controls
   - Scene rendering and animation loop
   - Debug information display

### Applied Fixes (That Haven't Resolved Visibility):
- **Scaling**: Model scaled to 200 units (targetScale = 200/maxDimension)
- **Positioning**: Model positioned at Y=100 to match camera target
- **Camera Setup**: Camera at (50, 120, 150) looking at (0, 100, 0)
- **Material Visibility**: All materials set to visible=true, opacity=1.0, transparent=false
- **Lighting**: HemisphereLight and DirectionalLight with shadows enabled
- **Controls**: OrbitControls properly configured

## Investigation Areas

### Primary Suspects for Invisible Model:
1. **Geometry Issues**
   - Model might be loading with corrupted/empty geometry
   - Vertices may be in unexpected coordinate system
   - Mesh bounds calculation might be incorrect

2. **Material/Shader Problems**
   - Materials might have shader compilation errors
   - Textures might be failing to load or apply
   - Material properties incompatible with Three.js rendering

3. **Three.js Rendering Issues**
   - Renderer settings might be incorrect
   - Scene graph hierarchy problems
   - Frustum culling eliminating the model

4. **FBX-Specific Issues**
   - FBXLoader might not be processing certain model features correctly
   - Skeleton/animation data interfering with static rendering
   - Model might require specific Three.js version or settings

### Secondary Issues:
5. **React State Management**
   - Component re-rendering issues causing Three.js context loss
   - Debug info processing causing undefined property access

## Test URL
- **Development Server**: `http://localhost:5173/fbx-actorcore-lipsync-test`
- **Console Debugging**: All operations log detailed information for analysis

## Expected Deliverable

A visible 3D avatar model in the React test page viewport that:
- Renders correctly with proper lighting and materials
- Responds to camera controls (OrbitControls)
- Maintains all existing lip-sync functionality
- Eliminates any React rendering errors

## Success Criteria
- [ ] Avatar model visible in 3D viewport
- [ ] Model positioned and scaled appropriately for camera view  
- [ ] All materials rendering correctly with textures
- [ ] OrbitControls allow proper camera movement around model
- [ ] React component renders without errors
- [ ] All existing morph target functionality preserved
- [ ] Viseme buttons successfully trigger visible facial animations

## Technical Notes

### Debugging Approaches to Try:
1. **Geometry Validation**: Log vertex counts, face counts, and mesh bounds
2. **Material Analysis**: Check material properties, shader compilation, texture loading
3. **Renderer Debugging**: Enable wireframe mode, adjust near/far planes, check WebGL state
4. **Scene Hierarchy**: Verify object transforms, visibility flags, and scene graph structure
5. **Three.js Inspector**: Use browser extensions or tools to examine Three.js scene state

### Files to Focus On:
- `frontend/src/utils/fbxMorphTargetLoader.js` (model loading and positioning)
- `frontend/src/pages/FBXActorCoreLipSyncTestPage.jsx` (rendering and camera setup)
- Browser DevTools Three.js debugging

The core lip-sync system is complete and functional - this task is purely about making the loaded model visible in the 3D viewport.
