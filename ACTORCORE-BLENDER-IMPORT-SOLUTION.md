# ActorCore FBX Import Solution for Blender

## Problem Summary
When importing ActorCore FBX models directly into Blender:
- Armature has incorrect transformations (rotation 90°, wrong scale)
- Mesh and armature become disjointed
- Morph targets may not work properly
- Tongue morphs on separate mesh (CC_Game_Tongue) need special handling

## Solution: CC/iC Blender Tools Add-on

### What is CC/iC Blender Tools?
- Official add-on for importing Character Creator, iClone, and ActorCore models
- Automatically fixes rigging issues
- Preserves all morph targets including tongue morphs
- Handles material setup and texture mapping
- Maintained by soupday on GitHub

### Installation Steps

1. **Download the Add-on**
   - Option A: GitHub Release
     - Go to: https://github.com/soupday/cc_blender_tools/releases
     - Download the latest .zip file (don't extract it)
   
   - Option B: Reallusion Official
     - Visit: https://www.reallusion.com/auto-setup/blender/download.html
     - Download the Blender Auto Setup

2. **Install in Blender**
   - Open Blender
   - Go to Edit > Preferences > Add-ons
   - Click "Install..." button
   - Navigate to the downloaded .zip file
   - Select and install
   - Enable the add-on by checking the box next to "Import-Export: CC/iC Blender Tools"

3. **Import ActorCore FBX**
   - Use File > Import > CC/iC Import (NOT regular FBX import)
   - Select your ActorCore FBX file
   - The add-on will:
     - Fix armature transformations
     - Properly connect meshes to armature
     - Preserve all shape keys/morph targets
     - Set up materials correctly

### Key Features for ActorCore Models

- **Automatic Rigging Fix**: Corrects the 90° rotation and scale issues
- **Shape Key Preservation**: All morphs including tongue morphs are maintained
- **Separate Mesh Handling**: Properly handles CC_Game_Tongue as separate mesh
- **Material Setup**: Automatically configures PBR materials

### Export to GLB

After importing with CC/iC Tools:
1. Select all objects (armature and meshes)
2. File > Export > glTF 2.0 (.glb/.gltf)
3. Settings:
   - Format: GLB
   - Include: Selected Objects
   - Transform: +Y Up
   - Geometry:
     - Apply Modifiers: OFF
     - Export Morph Targets: ON
     - Export Morph Normals: ON
   - Animation:
     - Export Animations: ON (if needed)
     - Export Skinning: ON

### Verified Working Configuration

- **Model**: ActorCore party-f-0013.fbx
- **Meshes with Morphs**:
  - CC_Game_Body: 74 shape keys (visemes, expressions)
  - CC_Game_Tongue: 27 shape keys (all tongue movements)
- **Tongue Morphs Preserved**:
  - V_Tongue_up, V_Tongue_Raise, V_Tongue_Out
  - V_Tongue_Narrow, V_Tongue_Lower
  - V_Tongue_Curl-U, V_Tongue_Curl-D
  - Tongue directional controls (L/R/Up/Down)

### Three.js Implementation

Once exported to GLB with CC/iC Tools:

```javascript
// The tongue morphs will be on the CC_Game_Tongue mesh
gltf.scene.traverse((node) => {
  if (node.name === 'CC_Game_Tongue' && node.morphTargetInfluences) {
    // Access tongue morphs
    const morphDict = node.morphTargetDictionary;
    // morphDict will contain all tongue shape keys
  }
});
```

### Troubleshooting

If morphs are missing after export:
1. Ensure "Export Morph Targets" is enabled in glTF export
2. Check that shape keys have non-zero values in Blender
3. Verify mesh names match expected values (CC_Game_Body, CC_Game_Tongue)

### References

- CC/iC Blender Tools GitHub: https://github.com/soupday/cc_blender_tools
- Documentation: https://soupday.github.io/cc_blender_tools/
- Reallusion Download: https://www.reallusion.com/auto-setup/blender/download.html
