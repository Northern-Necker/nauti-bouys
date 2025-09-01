# Three.js Alternatives for Advanced Lip-Sync with FBX Models

## Current Problem Summary

Three.js FBXLoader cannot access tongue morphs (Tongue_Tip_Up, Tongue_Curl, etc.) that are critical for natural lip-sync on NN, DD, and RR visemes. The morphs exist in the FBX file but are on a separate mesh in the hierarchy that Three.js doesn't properly expose.

## Alternative 3D Libraries Analysis

### 1. **Babylon.js** ⭐⭐⭐⭐⭐ (RECOMMENDED)

**Pros:**
- **Superior FBX Support**: More comprehensive FBX loader that handles complex hierarchies
- **Better Morph Target Access**: Can access morphs across multiple meshes in hierarchy
- **Native Animation System**: Built-in animation and morph target blending
- **Performance**: Often faster than Three.js for complex scenes
- **Active Development**: Strong Microsoft backing, regular updates

**Implementation Path:**
```javascript
// Babylon.js FBX loading with full morph access
BABYLON.SceneLoader.LoadAssetContainer("", "model.fbx", scene, (container) => {
    // Access ALL morphs across all meshes
    container.meshes.forEach(mesh => {
        if (mesh.morphTargetManager) {
            // Can access tongue morphs on separate meshes
            const tongueTarget = mesh.morphTargetManager.getTarget("Tongue_Tip_Up");
            if (tongueTarget) {
                tongueTarget.influence = 0.8; // Direct control
            }
        }
    });
});
```

**Migration Effort:** Medium - Need to rewrite rendering pipeline but morph system will work better

### 2. **PlayCanvas** ⭐⭐⭐⭐

**Pros:**
- **Excellent FBX Support**: Professional-grade FBX importer
- **Morph Target System**: Robust blend shape support
- **WebGL Optimization**: Highly optimized for web
- **Visual Editor**: Optional editor for testing

**Implementation Path:**
```javascript
// PlayCanvas morph target access
app.assets.loadFromUrl('model.fbx', 'model', (err, asset) => {
    const entity = new pc.Entity();
    entity.addComponent('model', { asset: asset });
    
    // Access morphs across all mesh instances
    entity.model.meshInstances.forEach(meshInstance => {
        const morphInstance = meshInstance.morphInstance;
        if (morphInstance) {
            // Set tongue morphs
            morphInstance.setWeight('Tongue_Tip_Up', 0.8);
        }
    });
});
```

**Migration Effort:** Medium-High - Different API paradigm but excellent results

### 3. **Native WebGL with glTF-Transform** ⭐⭐⭐⭐

**Pros:**
- **Full Control**: Direct WebGL gives complete access to all data
- **Convert FBX to GLB**: Use professional tools for conversion
- **Preserve All Morphs**: Conversion tools can ensure all morphs are accessible

**Implementation Path:**
1. Convert FBX to GLB using Blender or FBX2glTF with morph preservation
2. Use glTF-Transform to manipulate morphs programmatically
3. Load in Three.js with guaranteed morph access

```javascript
// Using glTF-Transform to ensure morph access
import { Document, NodeIO } from '@gltf-transform/core';

const document = await new NodeIO().read('model.glb');
const root = document.getRoot();

// All morphs will be accessible after proper conversion
root.listNodes().forEach(node => {
    const mesh = node.getMesh();
    if (mesh) {
        mesh.listPrimitives().forEach(primitive => {
            const morphTargets = primitive.listTargets();
            // Tongue morphs will be here if conversion is done right
        });
    }
});
```

**Migration Effort:** Low-Medium - Can still use Three.js after conversion

### 4. **A-Frame with Custom Components** ⭐⭐⭐

**Pros:**
- **Built on Three.js**: Familiar if you know Three.js
- **Component System**: Can write custom morph handlers
- **Community Extensions**: May have solutions for FBX morphs

**Migration Effort:** Low - But may not solve the core problem

### 5. **Wonderland Engine** ⭐⭐⭐

**Pros:**
- **WebAssembly Performance**: Very fast
- **Good Morph Support**: Handles complex models well
- **Small Bundle Size**: Efficient delivery

**Cons:**
- **Learning Curve**: Different paradigm
- **Smaller Community**: Less resources

## Recommended Solution Path

### Option A: Babylon.js Migration (Best for Long-term)

1. **Immediate Benefits:**
   - All tongue morphs will be accessible
   - Better performance for complex animations
   - More robust animation system

2. **Implementation Steps:**
   ```javascript
   // New Babylon.js lip-sync implementation
   class BabylonActorCoreLipSync {
       constructor(scene, modelPath) {
           this.morphTargets = new Map();
           this.loadModel(modelPath);
       }
       
       async loadModel(path) {
           const result = await BABYLON.SceneLoader.LoadAssetContainerAsync("", path, this.scene);
           
           // Collect ALL morph targets from ALL meshes
           result.meshes.forEach(mesh => {
               if (mesh.morphTargetManager) {
                   for (let i = 0; i < mesh.morphTargetManager.numTargets; i++) {
                       const target = mesh.morphTargetManager.getTarget(i);
                       this.morphTargets.set(target.name, {
                           target: target,
                           mesh: mesh
                       });
                   }
               }
           });
           
           // Now we have access to ALL morphs including tongue!
           console.log('Available morphs:', Array.from(this.morphTargets.keys()));
       }
       
       applyViseme(viseme, intensity = 1.0) {
           const config = this.visemeConfigs[viseme];
           config.morphs.forEach(morphName => {
               const morphData = this.morphTargets.get(morphName);
               if (morphData) {
                   morphData.target.influence = intensity * config.intensity;
               }
           });
       }
   }
   ```

### Option B: FBX to GLB Conversion (Quickest Fix)

1. **Use Professional Conversion:**
   ```bash
   # Using FBX2glTF with morph preservation
   FBX2glTF -i model.fbx -o model.glb --preserve-morphs --no-flip-v
   ```

2. **Or use Blender Script:**
   ```python
   # Blender Python script for conversion
   import bpy
   
   # Import FBX
   bpy.ops.import_scene.fbx(filepath="model.fbx")
   
   # Ensure all shape keys are preserved
   for obj in bpy.data.objects:
       if obj.type == 'MESH' and obj.data.shape_keys:
           # Make sure all shape keys are included
           for key in obj.data.shape_keys.key_blocks:
               key.mute = False
   
   # Export as GLB with morphs
   bpy.ops.export_scene.gltf(
       filepath="model.glb",
       export_morph=True,
       export_morph_normal=True,
       export_morph_tangent=True
   )
   ```

3. **Continue using Three.js with GLB:**
   ```javascript
   // Three.js with properly converted GLB
   const loader = new GLTFLoader();
   loader.load('model.glb', (gltf) => {
       gltf.scene.traverse((child) => {
           if (child.isMesh && child.morphTargetDictionary) {
               // All morphs including tongue should be accessible
               console.log('Morphs on', child.name, Object.keys(child.morphTargetDictionary));
           }
       });
   });
   ```

## Performance Comparison

| Library | FBX Support | Morph Access | Performance | Bundle Size | Learning Curve |
|---------|------------|--------------|-------------|-------------|----------------|
| Three.js (current) | Limited | Incomplete | Good | Medium | - |
| Babylon.js | Excellent | Complete | Excellent | Large | Medium |
| PlayCanvas | Excellent | Complete | Excellent | Medium | Medium-High |
| GLB + Three.js | N/A | Complete | Good | Medium | Low |
| Native WebGL | Manual | Complete | Best | Smallest | High |

## Immediate Recommendation

**For quickest resolution:** Convert FBX to GLB with proper morph preservation
**For best long-term solution:** Migrate to Babylon.js

Both will solve your tongue morph access issue and enable proper NN, DD, and RR viseme articulation.

## Testing the Solution

After implementing either solution, test with:

```javascript
// Test if tongue morphs work
const testTongueMorphs = () => {
    const tongueMorphs = [
        'Tongue_Tip_Up',    // For NN, DD
        'Tongue_Curl',      // For RR
        'Tongue_Out'        // For TH (already working)
    ];
    
    tongueMorphs.forEach(morphName => {
        // Set morph to 1.0 and visually verify
        setMorphTarget(morphName, 1.0);
        console.log(`Testing ${morphName} - check if tongue is visible`);
    });
};
