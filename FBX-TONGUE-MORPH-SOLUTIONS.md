# Solutions for FBX Tongue Morphs While Preserving Viseme Mappings

## The Challenge
- **Three.js limitation**: Cannot access tongue morphs on separate mesh hierarchies in FBX
- **Conversion limitation**: Converting FBX to GLB loses viseme mappings/metadata
- **Need**: Access tongue morphs WITHOUT losing FBX viseme data

## Solution Options

### Option 1: Hybrid Approach (Use Both FBX and GLB)
**Keep FBX for viseme mappings, use GLB just for tongue morphs**

```javascript
// Load FBX for main model and viseme mappings
const fbxLoader = new FBXLoader();
const fbxModel = await fbxLoader.loadAsync('/assets/Grace40s.fbx');

// Load GLB ONLY to extract tongue morph references
const gltfLoader = new GLTFLoader();
const gltfModel = await gltfLoader.loadAsync('/assets/Grace40s.glb');

// Find tongue mesh in GLB
let tongueMesh = null;
gltfModel.scene.traverse((child) => {
    if (child.isMesh && child.morphTargetDictionary) {
        if ('Tongue_Tip_Up' in child.morphTargetDictionary) {
            tongueMesh = child;
        }
    }
});

// Apply visemes using FBX data but control tongue separately
function applyViseme(viseme) {
    // Use FBX for everything except tongue
    applyFBXViseme(fbxModel, viseme);
    
    // Use GLB mesh for tongue morphs only
    if (viseme === 'nn' && tongueMesh) {
        const index = tongueMesh.morphTargetDictionary['Tongue_Tip_Up'];
        tongueMesh.morphTargetInfluences[index] = 0.75;
    }
}
```

### Option 2: Direct Mesh Access in Three.js
**Force access to tongue morphs by finding the specific mesh**

```javascript
// The tongue morphs exist in the FBX, just on a different mesh
// Let's find them by traversing more thoroughly

function findTongueMorphsInFBX(fbxModel) {
    const tongueMorphs = {};
    
    // Check ALL objects, not just direct children
    fbxModel.traverse((child) => {
        if (child.isMesh || child.isSkinnedMesh) {
            // Check if this mesh has morphTargetDictionary
            if (child.morphTargetDictionary) {
                // Look for tongue morphs
                const morphNames = Object.keys(child.morphTargetDictionary);
                morphNames.forEach(name => {
                    if (name.includes('Tongue')) {
                        tongueMorphs[name] = {
                            mesh: child,
                            index: child.morphTargetDictionary[name]
                        };
                        console.log(`Found ${name} on mesh: ${child.name}`);
                    }
                });
            }
            
            // Also check geometry.morphAttributes (alternative storage)
            if (child.geometry && child.geometry.morphAttributes) {
                console.log('Morph attributes:', child.geometry.morphAttributes);
            }
        }
    });
    
    return tongueMorphs;
}

// Use it
const tongueMorphRefs = findTongueMorphsInFBX(fbxModel);

// Apply tongue morphs directly
if (tongueMorphRefs['Tongue_Tip_Up']) {
    const { mesh, index } = tongueMorphRefs['Tongue_Tip_Up'];
    mesh.morphTargetInfluences[index] = 0.75;
}
```

### Option 3: Workaround - Fake Tongue Movement
**If we truly can't access tongue morphs, simulate them**

```javascript
// Since Tongue_Out works, use it creatively for other visemes
const tongueWorkarounds = {
    'nn': {
        // For NN, slightly protrude tongue and raise jaw
        morphs: ['Tongue_Out', 'Jaw_Open'],
        intensities: { 'Tongue_Out': 0.2, 'Jaw_Open': 0.15 }
    },
    'DD': {
        // For DD, minimal tongue out with jaw movement
        morphs: ['Tongue_Out', 'Jaw_Open'],
        intensities: { 'Tongue_Out': 0.1, 'Jaw_Open': 0.3 }
    },
    'RR': {
        // For RR, retract lips instead of curling tongue
        morphs: ['Mouth_Pucker_L', 'Mouth_Pucker_R', 'Jaw_Open'],
        intensities: { 'Mouth_Pucker_L': 0.3, 'Mouth_Pucker_R': 0.3, 'Jaw_Open': 0.25 }
    }
};
```

### Option 4: Server-Side Processing
**Use a backend service to extract FBX data properly**

```javascript
// Use Node.js with FBX SDK or Python with FBX Python SDK
// to properly extract ALL morph targets server-side

// Backend endpoint
app.post('/api/process-fbx', async (req, res) => {
    const fbxData = await processFBXWithSDK('Grace40s.fbx');
    
    // Returns complete morph target map including tongue
    res.json({
        morphTargets: fbxData.morphTargets,
        visemeMap: fbxData.visemeMap,
        tongueMorphs: fbxData.tongueMorphs
    });
});

// Frontend uses processed data
const fbxData = await fetch('/api/process-fbx').then(r => r.json());
// Now you have access to all morphs AND preserve viseme mappings
```

### Option 5: Use Reallusion's Web Player
**If using ActorCore/Character Creator models**

ActorCore models are from Reallusion. They offer a web player that properly handles all morphs:
- https://www.reallusion.com/character-creator/web-player.html
- Preserves all viseme mappings
- Handles tongue morphs correctly
- But requires their SDK/licensing

## Recommendation

**Try Option 2 first** - Deep traverse the FBX in Three.js to find the tongue mesh. The morphs ARE in the file, just on a different mesh object that needs to be found.

**If that fails, use Option 1** - Load both FBX and GLB, using each for what it does best.

**Last resort: Option 3** - Creative workarounds using available morphs.

## The Real Issue

The core problem is that Three.js FBXLoader doesn't properly expose morphs that are on child meshes in complex hierarchies. The morphs exist in the file but aren't accessible through the standard traverse method.

## Test Code to Find Hidden Morphs

```javascript
function deepMorphSearch(object, depth = 0) {
    const indent = '  '.repeat(depth);
    console.log(`${indent}Object: ${object.name} (${object.type})`);
    
    // Check for morphs in various places
    if (object.morphTargetDictionary) {
        console.log(`${indent}  Found morphTargetDictionary:`, Object.keys(object.morphTargetDictionary));
    }
    
    if (object.geometry) {
        if (object.geometry.morphAttributes) {
            console.log(`${indent}  Found morphAttributes:`, Object.keys(object.geometry.morphAttributes));
        }
        if (object.geometry.morphTargets) {
            console.log(`${indent}  Found morphTargets:`, object.geometry.morphTargets);
        }
    }
    
    // Recursively check children
    if (object.children) {
        object.children.forEach(child => deepMorphSearch(child, depth + 1));
    }
}

// Run on your FBX model
deepMorphSearch(fbxModel);
```

This should help you find where the tongue morphs are hiding in the FBX hierarchy.
