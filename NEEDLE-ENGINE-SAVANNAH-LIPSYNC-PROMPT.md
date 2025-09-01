# Needle Engine Savannah Lip-Sync Prototype - Complete Implementation Prompt

## Project Overview
Build a web-based 3D lip-sync demonstration prototype using Needle Engine in Unity that showcases the Savannah avatar with full viseme animation capabilities, including the problematic tongue morphs that have been inaccessible in Three.js.

## Critical Technology Stack
- **Needle Engine**: A Unity plugin that directly converts Unity scenes to optimized web projects
- **NO Unity WebGL**: Do NOT use File > Build Settings or any standard Unity WebGL workflow
- **Export Method**: Exclusively use Needle Engine's export tools
- **Target**: Modern web browsers with WebGL2 support

## Savannah Avatar Technical Specifications

### FBX Model Details
- **Source File**: `frontend/public/assets/SavannahAvatar-Unity.fbx`
- **Model Type**: ActorCore/Reallusion FBX
- **Total Morph Targets**: 91 blend shapes
- **Mesh Count**: 8 separate meshes
- **Critical Requirement**: Must start with FBX as native format

### Mesh Structure with Morph Targets
```
1. CC_Game_Body (15 morph targets)
2. CC_Game_Tongue (14 morph targets) - CRITICAL FOR TONGUE VISEMES
   - Tongue_Curl
   - Tongue_Tip_Up
   - Tongue_Tip_Down
   - Other tongue positions
3. CC_Game_Teeth (12 morph targets)
4. CC_Eye_Occlusion_L (6 morph targets)
5. CC_Eye_Occlusion_R (6 morph targets)
6. CC_Game_Eye_L (13 morph targets)
7. CC_Game_Eye_R (13 morph targets)
8. CC_Game_Eyelash (12 morph targets)
```

## Viseme Requirements

### Complete 15-Viseme Set
The prototype must demonstrate ALL of these visemes with smooth transitions:

1. **Silence** - Neutral mouth position
2. **AA** - (as in "father") - Jaw_Open, Mouth_Open
3. **E** - (as in "bee") - Mouth_Smile_L, Mouth_Smile_R
4. **I** - (as in "bit") - Mouth_Stretch
5. **O** - (as in "go") - Mouth_Pucker, Mouth_Funnel
6. **U** - (as in "you") - Mouth_Pucker, Mouth_Funnel (stronger)
7. **PP** - (bilabial plosive) - Mouth_Press_L, Mouth_Press_R
8. **FF** - (labiodental fricative) - Mouth_Lower_Down_L/R, V_Tongue_Out
9. **TH** - (dental fricative) - V_Tongue_Out, Mouth_Open (slight)
10. **DD** - (alveolar plosive) - **Tongue_Tip_Up**, Jaw_Open (slight) - PROBLEMATIC
11. **KK** - (velar plosive) - **Tongue_Curl**, Jaw_Open (slight)
12. **CH** - (postalveolar affricate) - Mouth_Pucker, Teeth_Open
13. **SS** - (alveolar fricative) - Mouth_Stretch, Teeth_Close
14. **NN** - (alveolar nasal) - **Tongue_Tip_Up**, Mouth_Open (slight) - PROBLEMATIC
15. **RR** - (alveolar approximant) - **Tongue_Curl**, Mouth_Funnel - PROBLEMATIC

### Problematic Tongue Visemes (Must Be Demonstrated)
These visemes require tongue morphs from the CC_Game_Tongue mesh that Three.js cannot access:
- **DD**: Requires Tongue_Tip_Up
- **NN**: Requires Tongue_Tip_Up  
- **RR**: Requires Tongue_Curl

### Optimized Intensity Values
```javascript
const visemeIntensities = {
    PP: 0.5,      // Reduced to prevent over-puckering
    global: 0.85, // Overall intensity multiplier
    tongue: {
        DD: 0.8,  // Tongue_Tip_Up intensity
        NN: 0.7,  // Tongue_Tip_Up intensity
        RR: 0.8   // Tongue_Curl intensity
    }
};
```

## Needle Engine Implementation Requirements

### Scene Setup
1. Create new Unity scene named "SavannahLipSyncDemo"
2. Import Savannah FBX directly (not as prefab initially)
3. Set up proper lighting and camera
4. Configure Needle Engine components

### Needle Engine Components
1. **NeedleEngine**: Main component on root GameObject
2. **GLTFObject**: On the Savannah avatar for proper export
3. **BlendShapeController**: Custom component for viseme control
4. **WebInterface**: For browser-based controls

### Export Configuration
```csharp
// Needle Engine export settings (pseudo-code)
NeedleExportSettings {
    compressionLevel: "high",
    textureQuality: "medium",
    includeBlendShapes: true,
    optimizeMeshes: false, // Keep all meshes separate for morph access
    exportFormat: "glb",
    targetFramework: "three.js" // Needle uses Three.js internally
}
```

## Prototype Features

### Core Functionality
1. **Avatar Display**: Savannah avatar rendered at proper scale
2. **Viseme Selector**: UI to trigger each of the 15 visemes
3. **Transition System**: Smooth blending between visemes
4. **Morph Inspector**: Show active morph targets and values
5. **Tongue Viseme Test**: Specific tests for DD, NN, RR visemes

### User Interface (Web-Based)
```html
<div id="needle-container">
    <canvas id="needle-canvas"></canvas>
    <div id="controls">
        <div id="viseme-buttons">
            <!-- Button for each viseme -->
        </div>
        <div id="morph-display">
            <!-- Real-time morph target values -->
        </div>
        <div id="test-sequences">
            <button>Test Tongue Visemes</button>
            <button>Test All Visemes</button>
            <button>Test Phrase</button>
        </div>
    </div>
</div>
```

### Test Sequences
1. **Tongue Test**: "Did Dan run?" - Tests DD, NN, RR
2. **Full Test**: Cycles through all 15 visemes
3. **Phrase Test**: "The quick brown fox" - Natural speech pattern

## Implementation Steps

### Step 1: Unity Scene Setup
```csharp
// 1. Import FBX
// 2. Check all 91 morph targets are accessible
// 3. Verify CC_Game_Tongue mesh and its morphs
// 4. Add Needle Engine components
```

### Step 2: Viseme Controller Script
```csharp
using UnityEngine;
using Needle.Engine;

[AddComponentMenu("Savannah/VisemeController")]
public class SavannahVisemeController : MonoBehaviour
{
    [SerializeField] private SkinnedMeshRenderer[] meshRenderers;
    
    // Map visemes to morph targets
    private Dictionary<string, List<MorphTarget>> visemeMap;
    
    void Start()
    {
        InitializeVisemeMap();
        ValidateTongueMorphs();
    }
    
    public void ApplyViseme(string visemeName, float intensity = 0.85f)
    {
        // Apply morph targets for viseme
        // Special handling for tongue visemes (DD, NN, RR)
    }
}
```

### Step 3: Needle Engine Export
```csharp
// Use Needle Engine menu, NOT Unity Build Settings
// Menu: Needle Engine > Build and Run
// This creates optimized web build in seconds, not hours
```

### Step 4: Web Integration
```javascript
// Needle Engine provides a Three.js scene
// Access and control from JavaScript
const needle = new NeedleEngine({
    container: document.getElementById('needle-container'),
    scene: 'SavannahLipSyncDemo.glb'
});

needle.onLoad = () => {
    const avatar = needle.scene.getObjectByName('SavannahAvatar');
    const controller = avatar.getComponent('VisemeController');
    
    // Control visemes from web
    controller.applyViseme('DD', 0.8);
};
```

## Validation Requirements

### Must Verify
1. All 91 morph targets are accessible in the web build
2. CC_Game_Tongue mesh morphs work (Tongue_Tip_Up, Tongue_Curl)
3. DD, NN, RR visemes show proper tongue movement
4. Smooth transitions between visemes
5. Performance is better than Unity WebGL (smaller size, faster load)

### Expected Results
- Build size: < 10MB (vs 50-100MB for Unity WebGL)
- Load time: < 3 seconds
- Frame rate: 60 FPS
- All visemes working including tongue movements

## Common Issues and Solutions

### Issue: Tongue morphs not working
- Ensure CC_Game_Tongue mesh is not merged
- Check morph target names match exactly
- Verify Needle Engine export includes all blend shapes

### Issue: Avatar appears deformed
- Check FBX import settings in Unity
- Ensure proper rig configuration
- Verify scale is set to 1,1,1

### Issue: Performance issues
- Reduce texture sizes
- Enable Needle Engine compression
- Use LOD system if needed

## Success Criteria
1. ✅ Savannah avatar loads in web browser via Needle Engine
2. ✅ All 15 visemes are demonstrable
3. ✅ DD, NN, RR show proper tongue movement
4. ✅ Smooth transitions between visemes
5. ✅ Better performance than Unity WebGL
6. ✅ Works on mobile devices
7. ✅ No Unity WebGL build process used

## Additional Context
This prototype resolves the critical limitation where Three.js (used by Babylon.js and vanilla Three.js implementations) cannot access the tongue morph targets on the CC_Game_Tongue mesh of the ActorCore FBX model. Needle Engine, by processing the model through Unity first, maintains access to all morph targets while still outputting an optimized web-friendly format.

## DO NOT
- Do NOT use File > Build Settings in Unity
- Do NOT create a Unity WebGL build
- Do NOT use BuildPipeline.BuildPlayer
- Do NOT follow standard Unity WebGL tutorials
- Everything must go through Needle Engine's export process

## References
- Needle Engine Documentation: https://needle.tools/
- ActorCore/Reallusion Morph Target Documentation
- Previous attempts that failed due to tongue morph access:
  - Three.js: Could not access CC_Game_Tongue morphs
  - Babylon.js: Same limitation as Three.js
  - Unity WebGL: Too slow and heavy for production
