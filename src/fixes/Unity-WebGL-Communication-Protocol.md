# Unity WebGL Morph Target Communication Protocol

## Overview

This document defines the communication protocol between Unity WebGL builds and JavaScript for morph target synchronization. The protocol ensures frame-perfect synchronization and handles GPU coordination between Unity's renderer and WebGL.

## Architecture

```
JavaScript Environment
├── UnityWebGLMorphSynchronizer (Main controller)
├── UnityMorphBridge (Global interface)
└── External Systems (React, Three.js, etc.)
                    ↕ 
Unity WebGL Build
├── UnityMorphSynchronizer (C# controller)
├── UnityMeshCoordinator (Mesh management)
├── UnityWebGLMorphBridge.jslib (Bridge)
└── ActorCoreLipSyncController (Viseme system)
```

## Communication Methods

### 1. JavaScript → Unity

#### Method: `SendMessage()`
Unity's built-in JavaScript-to-Unity communication.

```javascript
// Single morph update
SendMessage('MorphSynchronizer', 'UpdateSingleMorph', 'morphKey|weight');

// Batch morph update
SendMessage('MorphSynchronizer', 'ProcessBatchMorphUpdate', JSON.stringify(morphData));

// Viseme application
SendMessage('ActorCoreLipSyncController', 'OnVisemeData', JSON.stringify(visemeData));
```

#### Data Formats

**Single Morph Update:**
```
Format: "meshIndex_morphName|weight"
Example: "0_Mouth_Open|0.75"
```

**Batch Morph Update:**
```json
{
  "0_Mouth_Open": 0.75,
  "1_Tongue_Tip_Up": 0.8,
  "0_Jaw_Open": 0.3
}
```

**Viseme Data:**
```json
{
  "viseme": "DD",
  "intensity": 0.8,
  "timestamp": 1640995200000
}
```

### 2. Unity → JavaScript

#### Method: `DllImport` Functions
Unity calls JavaScript functions through the .jslib bridge.

```csharp
[DllImport("__Internal")]
private static extern void NotifyFrameSynchronized();

[DllImport("__Internal")]
private static extern void SendPerformanceMetrics(float fps, float frameTime, float morphTime, int visemeCount);
```

#### JavaScript Implementation

```javascript
// In UnityWebGLMorphBridge.jslib
NotifyFrameSynchronized: function() {
    // Handle frame synchronization
},

SendPerformanceMetrics: function(fps, frameTime, morphTime, visemeCount) {
    // Handle performance data
}
```

## Message Types

### 1. Morph Updates

#### Single Morph
- **Direction:** JavaScript → Unity
- **Method:** `UpdateSingleMorph`
- **Format:** `"meshIndex_morphName|weight"`
- **Example:** `"0_Mouth_Open|0.75"`

#### Batch Morph
- **Direction:** JavaScript → Unity  
- **Method:** `ProcessBatchMorphUpdate`
- **Format:** JSON object with morph keys and weights
- **Example:** `{"0_Mouth_Open": 0.75, "1_Tongue_Tip_Up": 0.8}`

### 2. Viseme Commands

#### Apply Viseme
- **Direction:** JavaScript → Unity
- **Method:** `OnVisemeData`
- **Format:** JSON with viseme name, intensity, and timestamp
- **Example:** `{"viseme": "DD", "intensity": 0.8, "timestamp": 1640995200000}`

### 3. System Events

#### Frame Synchronization
- **Direction:** Unity → JavaScript
- **Method:** `NotifyFrameSynchronized`
- **Purpose:** Notify JavaScript that Unity has completed a frame
- **Usage:** GPU synchronization timing

#### Performance Metrics
- **Direction:** Unity → JavaScript
- **Method:** `SendPerformanceMetrics`
- **Parameters:** fps, frameTime, morphTime, visemeCount
- **Purpose:** Real-time performance monitoring

### 4. Configuration

#### System Configuration
- **Direction:** JavaScript → Unity
- **Method:** `SetConfiguration`
- **Format:** JSON configuration object
- **Example:** `{"enableGPUSync": true, "morphUpdateThreshold": 0.001}`

## Morph Key Format

### Standard Format
```
meshIndex_morphName
```

### Examples
- `0_Mouth_Open` - Mouth_Open morph on mesh 0 (CC_Game_Body)
- `1_Tongue_Tip_Up` - Tongue_Tip_Up morph on mesh 1 (CC_Game_Tongue)
- `0_Jaw_Open` - Jaw_Open morph on mesh 0 (CC_Game_Body)

### Mesh Index Mapping
- **0:** CC_Game_Body (main facial morphs)
- **1:** CC_Game_Tongue (tongue-specific morphs)
- **2+:** Additional meshes (teeth, eyes, etc.)

## Critical Tongue Morphs

These morphs are essential for proper viseme rendering:

```javascript
const criticalTongueMorphs = {
  "Tongue_Tip_Up": "1_Tongue_Tip_Up",    // For DD, nn visemes
  "Tongue_Curl": "1_Tongue_Curl",        // For RR visemes  
  "Tongue_Out": "1_Tongue_Out"           // For TH visemes
};
```

## Viseme Mappings

### Standard Visemes
```javascript
const visemeMappings = {
  "PP": ["0_Mouth_Close", "0_Mouth_Press_L", "0_Mouth_Press_R"],
  "FF": ["0_Mouth_Roll_In_Lower", "0_Jaw_Open"],
  "TH": ["1_Tongue_Out", "0_Mouth_Smile_L", "0_Mouth_Smile_R"],
  "DD": ["1_Tongue_Tip_Up", "0_Jaw_Open"],
  "RR": ["1_Tongue_Curl", "0_Jaw_Open", "0_Mouth_Funnel", "0_Mouth_Pucker"]
};
```

## Performance Optimization

### Batch Updates
Always prefer batch updates over individual morph calls:

```javascript
// ✅ Good - Batch update
const morphs = {
  "0_Mouth_Open": 0.75,
  "1_Tongue_Tip_Up": 0.8,
  "0_Jaw_Open": 0.3
};
window.setUnityMorphs(morphs);

// ❌ Bad - Individual calls
window.setUnityMorph("0_Mouth_Open", 0.75);
window.setUnityMorph("1_Tongue_Tip_Up", 0.8);
window.setUnityMorph("0_Jaw_Open", 0.3);
```

### Frame Synchronization
Use frame sync for smooth animations:

```javascript
window.addEventListener('unityFrameSynchronized', () => {
  // Apply next frame's morph data
  applyNextMorphFrame();
});
```

## Error Handling

### JavaScript Side
```javascript
try {
  const success = window.setUnityMorph("0_Mouth_Open", 0.75);
  if (!success) {
    console.warn('Morph update failed - Unity not ready');
  }
} catch (error) {
  console.error('Unity communication error:', error);
}
```

### Unity Side
```csharp
public void ProcessBatchMorphUpdate(string morphDataJson)
{
    try
    {
        var morphs = JsonUtility.FromJson<Dictionary<string, float>>(morphDataJson);
        // Process morphs...
    }
    catch (Exception e)
    {
        Debug.LogError($"Failed to process morph update: {e.Message}");
    }
}
```

## Integration Examples

### React Integration
```jsx
import React, { useEffect, useState } from 'react';

function UnityMorphController() {
  const [unityReady, setUnityReady] = useState(false);
  
  useEffect(() => {
    // Wait for Unity bridge
    window.addEventListener('unityMorphBridgeReady', () => {
      setUnityReady(true);
    });
    
    // Monitor performance
    window.addEventListener('unityPerformanceUpdate', (event) => {
      console.log('Unity Performance:', event.detail);
    });
  }, []);
  
  const applyViseme = (viseme, intensity = 1.0) => {
    if (unityReady && window.UnityWebGLMorphFix) {
      window.UnityWebGLMorphFix.setViseme(viseme, intensity);
    }
  };
  
  const applyMorphs = (morphData) => {
    if (unityReady && window.UnityWebGLMorphFix) {
      window.UnityWebGLMorphFix.applyMorphs(morphData);
    }
  };
  
  return (
    <div>
      <p>Unity Status: {unityReady ? 'Ready' : 'Loading...'}</p>
      <button onClick={() => applyViseme('DD', 0.8)}>
        Test DD Viseme
      </button>
    </div>
  );
}
```

### Three.js Integration
```javascript
// Map Three.js morphs to Unity morphs
const threeToUnityMapping = {
  'mouthOpen': '0_Mouth_Open',
  'tongueUp': '1_Tongue_Tip_Up',
  'jawOpen': '0_Jaw_Open'
};

function syncThreeJSToUnity(threeMorphs) {
  const unityMorphs = {};
  
  Object.entries(threeMorphs).forEach(([threeName, weight]) => {
    const unityName = threeToUnityMapping[threeName];
    if (unityName) {
      unityMorphs[unityName] = weight;
    }
  });
  
  if (window.UnityWebGLMorphFix) {
    window.UnityWebGLMorphFix.applyMorphs(unityMorphs);
  }
}
```

## Debugging

### Enable Debug Mode
```javascript
// JavaScript
window.UnityWebGLMorphFix.getInstance().setConfiguration({
  debugMode: true
});
```

```csharp
// Unity
public bool debugMode = true; // In inspector
```

### Performance Monitoring
```javascript
// Monitor performance metrics
window.addEventListener('unityPerformanceUpdate', (event) => {
  const { lastFPS, lastFrameTime, lastMorphTime } = event.detail;
  
  if (lastFPS < 30) {
    console.warn(`Low FPS: ${lastFPS}`);
  }
  
  if (lastMorphTime > 5) {
    console.warn(`High morph processing time: ${lastMorphTime}ms`);
  }
});
```

### System Status
```javascript
const status = window.UnityWebGLMorphFix.getStatus();
console.log('Unity WebGL Morph Fix Status:', status);
```

## Common Issues & Solutions

### Issue: Tongue morphs not working
**Solution:** Ensure mesh index is correct (usually mesh 1 for CC_Game_Tongue)
```javascript
// Correct
window.setUnityMorph("1_Tongue_Tip_Up", 0.8);

// Incorrect  
window.setUnityMorph("0_Tongue_Tip_Up", 0.8);
```

### Issue: Performance drops with many morphs
**Solution:** Use batch updates and limit update frequency
```javascript
// Batch updates at 30fps instead of every frame
setInterval(() => {
  if (pendingMorphUpdates.size > 0) {
    window.setUnityMorphs(Object.fromEntries(pendingMorphUpdates));
    pendingMorphUpdates.clear();
  }
}, 33.33); // 30fps
```

### Issue: Synchronization lag
**Solution:** Use frame sync events
```javascript
let nextFrameMorphs = null;

window.addEventListener('unityFrameSynchronized', () => {
  if (nextFrameMorphs) {
    window.setUnityMorphs(nextFrameMorphs);
    nextFrameMorphs = null;
  }
});

// Queue morphs for next frame
function queueMorphUpdate(morphs) {
  nextFrameMorphs = morphs;
}
```

## Version History

- **v1.0.0** - Initial protocol specification
- Production-ready WebGL export compatibility
- Frame-perfect synchronization support
- CC_Game_Body and CC_Game_Tongue coordination

## Summary

This protocol provides a robust, high-performance communication system between Unity WebGL builds and JavaScript environments, specifically designed to handle the complexities of morph target synchronization across multiple meshes while maintaining frame-perfect timing and GPU coordination.