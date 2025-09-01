# TalkingHead Viseme Research Findings

**Source**: https://github.com/met4citizen/TalkingHead - met4citizen's JavaScript class for Ready Player Me GLB avatars
**Research Date**: August 25, 2025
**Purpose**: Resolve Babylon.js viseme intensity and multi-mesh coordination issues

## Key Discoveries for Dramatic Viseme Enhancement

### 1. **setFixedValue Method - Override System**
```javascript
setFixedValue( mt, val, ms=null ) {
    if ( this.mtAvatar.hasOwnProperty(mt) ) {
        Object.assign(this.mtAvatar[mt],{ fixed: val, needsUpdate: true });
    }
}
```

**Critical Insight**: Allows **complete override** of morph target values beyond normal [0,1] ranges for dramatic effects.

### 2. **Real-time Value Override**
```javascript
// Direct blendshape control without smooth transitions
Object.assign( head.mtAvatar["jawOpen"],{ realtime: 1, needsUpdate: true });
```

**Application**: Immediate dramatic viseme effects bypassing normal animation smoothing.

### 3. **Volume-Based Intensity Amplification**
```javascript
// Volume effect for enhanced visemes
if ( vol ) {
    switch(mt){
        case 'viseme_aa':
        case 'viseme_E': 
        case 'viseme_I':
        case 'viseme_O':
        case 'viseme_U':
            m.newvalue *= 1 + vol / 255 - 0.5; // DYNAMIC INTENSITY
    }
}
```

**Breakthrough**: Dynamic viseme intensity based on audio volume - explains dramatic lip movement!

### 4. **Multi-Level Priority System**
```javascript
updateMorphTargets(dt) {
    // Priority order: fixed -> realtime -> system -> newvalue -> baseline
    let target = null;
    let newvalue = null;
    if ( o.fixed !== null ) {
        target = o.fixed;
        o.system = null; // Clear lower priorities
    } else if ( o.realtime !== null ) {
        newvalue = o.realtime;
    }
    // ... layered control system
}
```

**Solution**: Sophisticated override system for precise viseme control.

### 5. **Viseme-Specific Scaling**
```javascript
// Different intensity levels per viseme type
const level = (val.visemes[j] === 'PP' || val.visemes[j] === 'FF') ? 0.9 : 0.6;

// Enhanced scaling for vowels vs consonants
lipsyncAnim.push({
    vs: {
        ['viseme_'+val.visemes[j]]: [null, level, 0]
    }
});
```

**Key**: Plosives (P, F sounds) get **0.9 intensity** vs **0.6** for other visemes.

### 6. **Multi-Mesh Coordination**
```javascript
// Systematic multi-mesh management
this.morphs.forEach( x => {
    Object.keys(x.morphTargetDictionary).forEach( y => keys.add(y) );
});

// Apply to all relevant meshes
for( let i=0,l=o.ms.length; i<l; i++ ) {
    o.ms[i][o.is[i]] = o.applied;
}
```

**Solution**: Handles CC_Game_Body + CC_Game_Tongue coordination systematically.

### 7. **Enhanced Viseme Timing**
```javascript
// Precise viseme timing with overlap
ts: [ 
    t - Math.min(60, 2*d/3),     // Pre-transition
    t + Math.min(25, d/2),       // Peak
    t + d + Math.min(60, d/2)    // Post-transition
],
vs: {
    ['viseme_'+viseme]: [null, intensity, 0]
}
```

**Improvement**: Better viseme timing reduces blend artifacts.

## Morph Target Management System

### Internal Data Structure
```javascript
mtTemp[x] = {
    fixed: null,        // Highest priority override
    realtime: null,     // Immediate override
    system: null,       // System controlled
    newvalue: null,     // Animation value
    baseline: val,      // Default baseline
    needsUpdate: true,  // Update flag
    ms: [],            // Mesh influences arrays
    is: []             // Morph target indices
};
```

### RPM Extra Blendshapes Generation
```javascript
mtExtras = [
    { key: "mouthOpen", mix: { jawOpen: 0.5 } },
    { key: "mouthSmile", mix: { mouthSmileLeft: 0.8, mouthSmileRight: 0.8 } },
    { key: "eyesClosed", mix: { eyeBlinkLeft: 1.0, eyeBlinkRight: 1.0 } },
    { key: "eyesLookUp", mix: { eyeLookUpLeft: 1.0, eyeLookUpRight: 1.0 } },
    { key: "eyesLookDown", mix: { eyeLookDownLeft: 1.0, eyeLookDownRight: 1.0 } }
];
```

**Critical**: Auto-generates missing RPM extras from ARKit blend shapes.

## Implementation Priority for Babylon.js

### IMMEDIATE FIXES NEEDED:
1. **Volume-based intensity scaling** (lines 2891-2900)
2. **setFixedValue override system** (lines 2024-2029) 
3. **Multi-mesh coordination** (lines 1426-1441)
4. **Enhanced viseme timing** (lines 3398-3406)
5. **Viseme-specific intensity levels** (lines 3401)

### RESEARCH CITATIONS:
- **TalkingHead v1.5.0** - GitHub met4citizen/TalkingHead
- **updateMorphTargets method** - Lines 2820-2950
- **speakAudio viseme processing** - Lines 3390-3410
- **Multi-mesh management** - Lines 1420-1450
- **setFixedValue API** - Lines 2024-2029

## Expected Results
- **✅ ALL 15 visemes produce visible movement**
- **✅ Dramatic intensity for vowels and plosives** 
- **✅ Coordinated CC_Game_Body + CC_Game_Tongue**
- **✅ Real-time override capabilities**
- **✅ Volume-responsive viseme scaling**

## Next Steps
1. Integrate findings into `babylonGLBActorCoreLipSync.js`
2. Implement enhanced viseme testing interface
3. Validate all 15 visemes with dramatic effects
4. Ensure Surface Pro touch controls remain functional
5. Document complete resolution with evidence
