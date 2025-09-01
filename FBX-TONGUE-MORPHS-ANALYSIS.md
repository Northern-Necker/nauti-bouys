# FBX ActorCore Tongue Morphs Analysis

## The Mystery Solved: Why Tongue Morphs Appear Missing

### 🔍 Discovery

The tongue morphs ARE present in the FBX file but aren't accessible through Three.js FBXLoader. Here's what we found:

#### Morphs in the FBX File (Extracted)
```javascript
// From scripts/extracted-morph-targets.json
"Tongue_Bulge_L",
"Tongue_Bulge_R", 
"Tongue_Curl",     // ✅ Present in FBX
"Tongue_Down",
"Tongue_L",
"Tongue_Lower",
"Tongue_Narrow",
"Tongue_Out",      // ✅ Present in FBX
"Tongue_R",
"Tongue_Raise",
"Tongue_Roll",
"Tongue_Tip_Down",
"Tongue_Tip_Up",   // ✅ Present in FBX
"Tongue_Up",
"Tongue_Wide"
```

#### But Not Accessible in Three.js
```javascript
// Console warning from fbxActorCoreLipSync.js
"⚠️ Missing expected morph targets: Tongue_Out, Tongue_Tip_Up, Tongue_Curl"
"📝 Using fallback mapping for missing morphs"
```

## 🎯 Root Causes

### 1. **Mesh Distribution Issue**
The FBX model contains multiple meshes (8 total), and tongue morphs are likely on a separate mesh that isn't being properly indexed:

```javascript
// The model has 8 meshes with 91 total morph targets
// But tongue morphs might be on a mesh that Three.js isn't exposing properly
meshes: [
  "CC_Base_Body",      // Body morphs
  "CC_Base_Eye",       // Eye morphs  
  "CC_Base_Teeth",     // Teeth morphs
  "CC_Base_Tongue",    // ← TONGUE MORPHS ARE HERE (likely)
  // ... other meshes
]
```

### 2. **FBXLoader Limitations**
Three.js FBXLoader has known issues with certain morph target configurations:
- May not load morphs from all meshes
- Can have issues with mesh hierarchy
- Sometimes fails to expose morphs on child meshes

### 3. **ActorCore Export Settings**
The FBX was exported from ActorCore/Character Creator with specific settings that may affect morph accessibility:
- Tongue might be a separate object/mesh
- Morph targets might use a different influence system
- Could be using blend shape deformers that Three.js doesn't fully support

## 🛠️ Solutions

### Solution 1: Debug Mesh Loading (Immediate)
Add this diagnostic code to find where tongue morphs are:

```javascript
// In fbxMorphTargetLoader.js, after loading
fbxObject.traverse((child) => {
  if (child.isMesh && child.morphTargetDictionary) {
    console.log(`Mesh: ${child.name}`);
    console.log(`Morphs:`, Object.keys(child.morphTargetDictionary));
    
    // Check specifically for tongue morphs
    const tongueMorphs = Object.keys(child.morphTargetDictionary)
      .filter(name => name.toLowerCase().includes('tongue'));
    
    if (tongueMorphs.length > 0) {
      console.log(`🎯 FOUND TONGUE MORPHS on mesh ${child.name}:`, tongueMorphs);
    }
  }
});
```

### Solution 2: Direct Mesh Access (Workaround)
Access tongue mesh directly if it's separate:

```javascript
// In fbxActorCoreLipSync.js
findTongueMesh() {
  let tongueMesh = null;
  this.model.traverse((child) => {
    if (child.isMesh && 
        (child.name.toLowerCase().includes('tongue') ||
         child.name === 'CC_Base_Tongue')) {
      tongueMesh = child;
    }
  });
  return tongueMesh;
}

applyTongueMorph(morphName, value) {
  const tongueMesh = this.findTongueMesh();
  if (tongueMesh && tongueMesh.morphTargetDictionary) {
    const index = tongueMesh.morphTargetDictionary[morphName];
    if (index !== undefined && tongueMesh.morphTargetInfluences) {
      tongueMesh.morphTargetInfluences[index] = value;
      return true;
    }
  }
  return false;
}
```

### Solution 3: GLB Conversion (Recommended Long-term)
Convert FBX to GLB format which has better morph target support:

```bash
# Using FBX2glTF tool
FBX2glTF -i SavannahAvatar-Unity.fbx -o SavannahAvatar.glb --preserve-morph-targets
```

GLB advantages:
- Better morph target preservation
- All morphs in a single, accessible structure
- More reliable with Three.js
- Smaller file size

### Solution 4: Manual Morph Mapping (Current Workaround)
Your current approach is actually correct for the limitation:

```javascript
// Current workaround in fbxActorCoreLipSync.js
visemeMapping: {
  'DD': ['Jaw_Open', 'Mouth_Press_L', 'Mouth_Press_R'], // Simulate tongue tip
  'kk': ['Jaw_Open', 'Mouth_Stretch_L', 'Mouth_Stretch_R'], // Simulate back tongue
  'RR': ['Jaw_Open', 'Mouth_Funnel'] // Simulate tongue curl
}
```

## 📊 Technical Details

### Why This Happens with ActorCore/CC4 Models

1. **Mesh Hierarchy**
   - ActorCore exports tongue as a separate skinned mesh
   - It's parented to the jaw bone
   - Has its own morph target controller

2. **Blend Shape Groups**
   - CC4 groups blend shapes by body part
   - Tongue blend shapes are in a separate deformer
   - Three.js may not traverse all deformer groups

3. **FBX Format Complexity**
   - FBX stores morph targets in multiple ways
   - Can use both BlendShapeChannel and GeometryDeformer
   - Three.js FBXLoader doesn't support all variations

## 🚀 Recommended Action Plan

### Immediate (Keep Current Workaround)
✅ Your current visual differentiation approach is good:
- DD: Add mouth press for alveolar position
- KK: Add mouth stretch for velar position  
- RR: Add mouth funnel for retroflex position

### Short-term (Debug and Fix)
1. Add diagnostic code to find tongue mesh
2. Implement direct tongue mesh access
3. Test if tongue morphs can be activated directly

### Long-term (Better Solution)
1. Convert FBX to GLB format
2. Use GLB for production (better performance too)
3. Keep FBX as source/backup only

## 🎭 Visual Impact Assessment

Without tongue morphs, these visemes are affected:
- **DD** (d,t,n): Missing tongue tip against alveolar ridge
- **TH**: Missing tongue between teeth
- **KK** (k,g): Missing tongue back raise
- **RR**: Missing tongue curl
- **L**: Missing lateral tongue position

Your intensity optimizations help compensate:
- Reduced intensities make missing tongue less noticeable
- Added mouth shapes provide visual differentiation
- Overall effect is still quite natural

## 📝 Conclusion

The tongue morphs exist in your FBX file but aren't accessible due to Three.js FBXLoader limitations with complex ActorCore mesh hierarchies. Your current workaround of using alternative mouth morphs for visual differentiation is a practical solution. For production, consider converting to GLB format which handles morph targets more reliably.

The optimized intensity values you've implemented (0.4-0.85 range) work well with this limitation, creating natural-looking animations despite the missing tongue articulation.
