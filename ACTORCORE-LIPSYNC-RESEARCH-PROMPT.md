# ActorCore GLB Lip-Sync Integration Research Prompt

## Current Situation Summary

We have a GLB avatar model from ActorCore (Reallusion) that contains 105 morph targets for facial animations. The lip-sync system is attempting to animate the avatar but cannot find the morph targets because:

1. **The GLB uses numeric indices instead of names**: The morph targets are indexed 0-72 in `CC_Game_Body` mesh and 0-25 in `CC_Game_Tongue` mesh
2. **The original FBX had named morph targets**: Our extracted data shows names like "Jaw_Open", "Mouth_Smile_L", etc.
3. **The GLB export process stripped the names**: When converted from FBX to GLB, the morph target names were replaced with numeric indices

## Technical Details

### Model Structure
- **Source**: ActorCore/Reallusion Character Creator 4 (CC4)
- **File**: `SavannahAvatar.glb` (converted from `SavannahAvatar-Unity.fbx`)
- **Meshes with Morph Targets**:
  - `CC_Game_Body`: 73 morph targets (indices 0-72)
  - `CC_Game_Tongue`: 26 morph targets (indices 0-25)
  - Other meshes: 1 morph target each (clothing/accessories)

### Original Morph Target Names (from FBX)
The FBX file contained these facial morph target names:
- Jaw_Open, Jaw_Forward, Jaw_L, Jaw_R
- Mouth_Smile_L, Mouth_Smile_R
- Mouth_Frown_L, Mouth_Frown_R
- Mouth_Pucker, Mouth_Funnel
- Mouth_Press_L, Mouth_Press_R
- Mouth_Stretch_L, Mouth_Stretch_R
- Mouth_Roll_In_Upper, Mouth_Roll_In_Lower
- Mouth_Shrug_Upper, Mouth_Shrug_Lower
- Mouth_Up_Upper_L, Mouth_Up_Upper_R
- Mouth_Down_Lower_L, Mouth_Down_Lower_R
- Tongue_Out, Tongue_Up, Tongue_Down, Tongue_L, Tongue_R
- Tongue_Roll, Tongue_Curl, Tongue_Wide, Tongue_Narrow
- Cheek_Puff_L, Cheek_Puff_R
- Eye_Blink_L, Eye_Blink_R
- Brow_Drop_L, Brow_Drop_R
- (172 total morph targets)

## Research Needed

### 1. ActorCore/Reallusion Morph Target Index Mapping
We need to find the standard index mapping for ActorCore GLB exports. Research areas:

- **ActorCore Documentation**: Look for GLB export specifications
- **Reallusion CC4 Forums**: Search for "GLB morph target indices" or "blend shape index mapping"
- **Unity Integration Guides**: ActorCore provides Unity packages that may document the index mapping
- **Three.js Community**: Others may have solved this for ActorCore models

### 2. Standard CC4 Morph Target Order
Character Creator 4 likely has a consistent order for morph targets. Research:

- **CC4 SDK Documentation**: May list the standard morph target order
- **iClone ActorCore Documentation**: iClone uses these same models
- **FBX to GLB Conversion Standards**: How Reallusion handles this conversion

### 3. Existing Solutions
Look for existing implementations:

- **Conv.AI Integration**: They mention ActorCore support - check their documentation
- **Ready Player Me**: Uses similar morph target systems
- **Mixamo**: May have documentation on CC4 morph targets
- **A-Frame Components**: Community components for ActorCore avatars

## Specific Search Queries

1. "ActorCore GLB morph target index mapping"
2. "Reallusion CC4 blend shape indices"
3. "Character Creator 4 morph target order"
4. "ActorCore Unity morph target documentation"
5. "CC_Game_Body morph target indices"
6. "Reallusion GLB export blend shapes"
7. "Three.js ActorCore facial animation"
8. "Conv.AI ActorCore integration"

## Expected Mapping Pattern

Based on common CC4 patterns, the likely index mapping for `CC_Game_Body` (first 20 indices) might be:

```javascript
{
  0: "Jaw_Open",           // Usually first
  1: "Jaw_Forward",        
  2: "Jaw_L",
  3: "Jaw_R",
  4: "Mouth_Smile_L",
  5: "Mouth_Smile_R",
  6: "Mouth_Frown_L",
  7: "Mouth_Frown_R",
  8: "Mouth_Pucker",
  9: "Mouth_Funnel",
  10: "Mouth_Press_L",
  11: "Mouth_Press_R",
  12: "Mouth_Stretch_L",
  13: "Mouth_Stretch_R",
  14: "Mouth_Roll_In_Upper",
  15: "Mouth_Roll_In_Lower",
  16: "Mouth_Shrug_Upper",
  17: "Mouth_Shrug_Lower",
  18: "Mouth_Up_Upper_L",
  19: "Mouth_Up_Upper_R",
  // ... continues to index 72
}
```

## Alternative Solutions

If the exact mapping cannot be found through research:

1. **Contact ActorCore Support**: They should provide the index mapping
2. **Use the FBX File**: The original FBX has named morph targets
3. **Reverse Engineer**: Use the discovery tool to manually map each index
4. **Re-export from CC4**: Export with different settings to preserve names

## Implementation Once Mapping is Found

Once we have the correct index mapping, we need to:

1. Create a mapping object from viseme names to indices
2. Update the lip-sync system to use indices instead of names
3. Modify the `lerpActorCoreMorphTarget` function to work with indices
4. Test with the discovered mapping

## Resources to Check

- **ActorCore Website**: https://actorcore.reallusion.com/
- **Reallusion Forum**: https://forum.reallusion.com/
- **CC4 Documentation**: https://manual.reallusion.com/CC4/
- **Unity ActorCore Package**: May contain mapping in scripts
- **GitHub**: Search for "ActorCore morph target" repositories

## Contact Information

If research doesn't yield results:
- **ActorCore Support**: support@reallusion.com
- **Reallusion Developer Forum**: Active community for technical questions
- **Discord Communities**: Three.js, WebGL, Character Creator communities

This research will allow us to properly map the visemes to the correct morph target indices and get the lip-sync working with the ActorCore GLB model.
