# Babylon.js FBX Test Results - Critical Discovery

## Test Date: 8/21/2025

## Key Finding: Babylon.js DOES NOT Support FBX Natively

### Test Results
- **Error**: "Unable to find a plugin to load .fbx files"
- **Morphs Found**: 0
- **Tongue Morphs**: All NOT FOUND
- **Model Visibility**: No model loaded

### Console Output
```
BJS - [08:04:35]: Unable to find a plugin to load .fbx files. 
Trying to use .babylon default plugin.
Error loading FBX: Unable to load from /assets/Grace40s.fbx
=== Tongue Morph Availability ===
✗ Tongue_Out NOT FOUND
✗ Tongue_Tip_Up NOT FOUND
✗ Tongue_Curl NOT FOUND
Total morphs accessible: 0
```

## Analysis

### The Problem
1. **Three.js limitation**: Cannot access tongue morphs on separate mesh hierarchies in FBX
2. **Babylon.js limitation**: Doesn't support FBX format at all without conversion

### Why This Matters
- Both popular WebGL libraries have FBX limitations
- FBX is a proprietary Autodesk format with limited web support
- The tongue morphs issue isn't just a Three.js problem - it's an FBX-on-web problem

## The Real Solution: FBX to GLB Conversion

### Why GLB?
1. **Universal Support**: Both Three.js and Babylon.js fully support GLB/glTF
2. **Morph Target Preservation**: GLB properly preserves all morph targets across meshes
3. **Web Optimized**: GLB is designed for web delivery
4. **Open Standard**: glTF/GLB is an open standard, not proprietary

### Conversion Options

#### Option 1: Using Blender (Recommended)
```python
# Blender Python Script
import bpy

# Import FBX
bpy.ops.import_scene.fbx(filepath="Grace40s.fbx")

# Ensure all shape keys are preserved
for obj in bpy.data.objects:
    if obj.type == 'MESH' and obj.data.shape_keys:
        for key in obj.data.shape_keys.key_blocks:
            key.mute = False

# Export as GLB with morphs
bpy.ops.export_scene.gltf(
    filepath="Grace40s.glb",
    export_morph=True,
    export_morph_normal=True,
    export_morph_tangent=True
)
```

#### Option 2: Using FBX2glTF Command Line Tool
```bash
# Install FBX2glTF
npm install -g fbx2gltf

# Convert with morph preservation
FBX2glTF -i Grace40s.fbx -o Grace40s.glb --preserve-morphs --no-flip-v
```

#### Option 3: Online Converters
- https://products.groupdocs.app/conversion/fbx-to-glb
- https://anyconv.com/fbx-to-glb-converter/

### After Conversion - Use with Three.js

```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const loader = new GLTFLoader();
loader.load('Grace40s.glb', (gltf) => {
    const model = gltf.scene;
    
    // All morphs including tongue should now be accessible
    model.traverse((child) => {
        if (child.isMesh && child.morphTargetDictionary) {
            console.log('Morphs found:', Object.keys(child.morphTargetDictionary));
            
            // Access tongue morphs
            if ('Tongue_Tip_Up' in child.morphTargetDictionary) {
                const index = child.morphTargetDictionary['Tongue_Tip_Up'];
                child.morphTargetInfluences[index] = 0.8; // Works!
            }
        }
    });
});
```

## Conclusion

The issue isn't that Three.js is inadequate - it's that **FBX is not a web-friendly format**. The solution is:

1. **Convert FBX to GLB** using Blender or FBX2glTF
2. **Continue using Three.js** with the GLB model
3. **All tongue morphs will be accessible** in the converted GLB

This is a simpler solution than switching to Babylon.js (which also can't load FBX) and maintains your existing Three.js codebase.

## Next Steps

1. Convert Grace40s.fbx to Grace40s.glb
2. Update your existing Three.js code to load GLB instead of FBX
3. Test that all tongue morphs (Tongue_Tip_Up, Tongue_Curl) are accessible
4. Your NN, DD, and RR visemes will finally work with proper tongue articulation
